'use client';

import { useEffect, useReducer } from 'react';
import Link from 'next/link';

/* ────────────────────────────────────────────────────────────────
   Constants & rules
──────────────────────────────────────────────────────────────── */

const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_NAMES = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CHIPS = [10, 50, 100, 500];
const START_BALANCE = 1000;
const DECKS = 6;
const CUT_CARD = 78; // reshuffle before a deal when fewer cards than this remain
const MAX_HANDS = 4; // max hands after splitting
const DEALER_HITS_SOFT_17 = false;
const SAVE_KEY = 'blackjack-save-v1';

const RESULTS = {
  blackjack: { label: 'Blackjack', mult: 2.5, tone: 'win' },
  win: { label: 'You win', mult: 2, tone: 'win' },
  dealerBust: { label: 'Dealer busts', mult: 2, tone: 'win' },
  push: { label: 'Push', mult: 1, tone: 'push' },
  lose: { label: 'Dealer wins', mult: 0, tone: 'lose' },
  bust: { label: 'Bust', mult: 0, tone: 'lose' },
};

const fmt = (n) => '$' + Math.round(n).toLocaleString('en-US');

/* ────────────────────────────────────────────────────────────────
   Pure game logic
──────────────────────────────────────────────────────────────── */

function buildShoe(decks = DECKS) {
  const cards = [];
  for (let d = 0; d < decks; d++)
    for (const s of SUITS) for (const r of RANKS) cards.push({ r, s });
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

const cardValue = (r) => (r === 'A' ? 11 : ['K', 'Q', 'J'].includes(r) ? 10 : Number(r));

function score(cards) {
  let total = 0;
  let aces = 0;
  for (const { r } of cards) {
    if (r === 'A') aces++;
    total += cardValue(r);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return { total, soft: aces > 0 };
}

const isBlackjack = (cards) => cards.length === 2 && score(cards).total === 21;
// 21 on a split hand pays 1:1, not 3:2
const isNatural = (hand) => !hand.fromSplit && isBlackjack(hand.cards);

function outcomeOf(hand, dealer) {
  const p = score(hand.cards).total;
  const d = score(dealer).total;
  const pBJ = isNatural(hand);
  const dBJ = isBlackjack(dealer);
  if (pBJ && dBJ) return 'push';
  if (pBJ) return 'blackjack';
  if (dBJ) return 'lose';
  if (p > 21) return 'bust';
  if (d > 21) return 'dealerBust';
  if (p > d) return 'win';
  if (p < d) return 'lose';
  return 'push';
}

function dealerShouldDraw(cards) {
  const { total, soft } = score(cards);
  return total < 17 || (DEALER_HITS_SOFT_17 && total === 17 && soft);
}

/* Basic strategy (6 decks, dealer stands on soft 17, double after split) */
function advise(cards, upCard, { canDouble, canSplit }) {
  const up = cardValue(upCard.r);
  const { total, soft } = score(cards);
  const dbl = (fallback) => (canDouble ? 'Double' : fallback);

  if (canSplit) {
    const v = cardValue(cards[0].r);
    if (v === 11 || v === 8) return 'Split';
    if (v === 9 && ![7, 10, 11].includes(up)) return 'Split';
    if (v === 7 && up <= 7) return 'Split';
    if (v === 6 && up <= 6) return 'Split';
    if (v === 4 && (up === 5 || up === 6)) return 'Split';
    if ((v === 2 || v === 3) && up <= 7) return 'Split';
  }

  if (soft) {
    if (total >= 19) return 'Stand';
    if (total === 18) {
      if (up >= 3 && up <= 6) return dbl('Stand');
      return up <= 8 ? 'Stand' : 'Hit';
    }
    if (total === 17) return up >= 3 && up <= 6 ? dbl('Hit') : 'Hit';
    if (total === 15 || total === 16) return up >= 4 && up <= 6 ? dbl('Hit') : 'Hit';
    if (total === 13 || total === 14) return up >= 5 && up <= 6 ? dbl('Hit') : 'Hit';
    return 'Hit';
  }

  if (total >= 17) return 'Stand';
  if (total >= 13) return up <= 6 ? 'Stand' : 'Hit';
  if (total === 12) return up >= 4 && up <= 6 ? 'Stand' : 'Hit';
  if (total === 11) return up === 11 ? 'Hit' : dbl('Hit');
  if (total === 10) return up <= 9 ? dbl('Hit') : 'Hit';
  if (total === 9) return up >= 3 && up <= 6 ? dbl('Hit') : 'Hit';
  return 'Hit';
}

/* ────────────────────────────────────────────────────────────────
   State machine
   phases: betting → (insurance) → player → dealer → done
──────────────────────────────────────────────────────────────── */

const initialState = {
  hydrated: false,
  shoe: [],
  dealer: [],
  hands: [], // { cards, bet, status: 'playing' | 'done', fromSplit }
  active: 0,
  bankroll: START_BALANCE,
  bet: 0, // pending bet while betting
  lastBet: 0,
  insurance: 0,
  phase: 'betting',
  results: null,
  round: 0,
  shuffled: false,
  hint: false,
  stats: { hands: 0, wins: 0, losses: 0, pushes: 0, peak: START_BALANCE },
};

// Marks 21s as finished, moves to the next playable hand, or hands off to the dealer.
function normalize(s) {
  const hands = s.hands.map((h) =>
    h.status === 'playing' && score(h.cards).total >= 21 ? { ...h, status: 'done' } : h
  );
  const next = hands.findIndex((h) => h.status === 'playing');
  if (next !== -1) return { ...s, hands, active: next, phase: 'player' };
  if (hands.every((h) => score(h.cards).total > 21)) return settle({ ...s, hands });
  return { ...s, hands, phase: 'dealer' };
}

function settle(s) {
  const dealerBJ = isBlackjack(s.dealer);
  const rows = s.hands.map((h) => {
    const outcome = outcomeOf(h, s.dealer);
    return { outcome, wager: h.bet, payout: Math.round(h.bet * RESULTS[outcome].mult) };
  });
  const insPayout = s.insurance > 0 && dealerBJ ? s.insurance * 3 : 0;
  const payout = rows.reduce((t, r) => t + r.payout, 0) + insPayout;
  const wagered = rows.reduce((t, r) => t + r.wager, 0) + s.insurance;
  const bankroll = s.bankroll + payout;

  const stats = { ...s.stats, peak: Math.max(s.stats.peak, bankroll) };
  for (const r of rows) {
    stats.hands++;
    const { tone } = RESULTS[r.outcome];
    if (tone === 'win') stats.wins++;
    else if (tone === 'lose') stats.losses++;
    else stats.pushes++;
  }

  return {
    ...s,
    bankroll,
    stats,
    phase: 'done',
    results: { hands: rows, insurance: s.insurance, insPayout, net: payout - wagered },
  };
}

// Dealer peeks for blackjack (after insurance decision) and checks the player's natural.
function afterPeek(s) {
  if (isBlackjack(s.dealer) || isNatural(s.hands[0])) return settle(s);
  return normalize(s);
}

function startRound(s, wager, freshShoe) {
  const [p1, d1, p2, d2, ...rest] = freshShoe ?? s.shoe;
  const base = {
    ...s,
    shoe: rest,
    dealer: [d1, d2],
    hands: [{ cards: [p1, p2], bet: wager, status: 'playing', fromSplit: false }],
    active: 0,
    bankroll: s.bankroll - wager,
    bet: 0,
    lastBet: wager,
    insurance: 0,
    results: null,
    round: s.round + 1,
    shuffled: Boolean(freshShoe),
  };
  if (d1.r === 'A' && base.bankroll >= Math.floor(wager / 2)) return { ...base, phase: 'insurance' };
  return afterPeek(base);
}

const num = (x, fallback) => (Number.isFinite(x) ? x : fallback);

function reducer(s, a) {
  switch (a.type) {
    case 'LOAD': {
      const v = a.saved;
      if (!v || !Number.isFinite(v.bankroll) || v.bankroll < 0) return { ...s, hydrated: true };
      const bankroll = Math.floor(v.bankroll);
      return {
        ...s,
        hydrated: true,
        bankroll,
        hint: Boolean(v.hint),
        stats: {
          hands: num(v.stats?.hands, 0),
          wins: num(v.stats?.wins, 0),
          losses: num(v.stats?.losses, 0),
          pushes: num(v.stats?.pushes, 0),
          peak: Math.max(num(v.stats?.peak, bankroll), bankroll),
        },
      };
    }

    case 'CHIP':
      if (s.phase !== 'betting') return s;
      return { ...s, bet: Math.min(s.bet + a.amount, s.bankroll) };

    case 'SET_BET':
      if (s.phase !== 'betting') return s;
      return { ...s, bet: Math.max(0, Math.min(a.amount, s.bankroll)) };

    case 'DEAL':
      if (s.phase !== 'betting' || s.bet <= 0 || s.bet > s.bankroll) return s;
      return startRound(s, s.bet, a.shoe);

    case 'REBET_DEAL': {
      if (s.phase !== 'done') return s;
      const wager = Math.min(s.lastBet, s.bankroll);
      if (wager < CHIPS[0]) return s;
      return startRound(s, wager, a.shoe);
    }

    case 'INSURE': {
      if (s.phase !== 'insurance') return s;
      const cost = a.take ? Math.floor(s.hands[0].bet / 2) : 0;
      return afterPeek({ ...s, insurance: cost, bankroll: s.bankroll - cost });
    }

    case 'HIT': {
      if (s.phase !== 'player') return s;
      const [card, ...rest] = s.shoe;
      const hands = s.hands.map((h, i) => (i === s.active ? { ...h, cards: [...h.cards, card] } : h));
      return normalize({ ...s, shoe: rest, hands });
    }

    case 'STAND': {
      if (s.phase !== 'player') return s;
      const hands = s.hands.map((h, i) => (i === s.active ? { ...h, status: 'done' } : h));
      return normalize({ ...s, hands });
    }

    case 'DOUBLE': {
      const h = s.hands[s.active];
      if (s.phase !== 'player' || !h || h.cards.length !== 2 || s.bankroll < h.bet) return s;
      const [card, ...rest] = s.shoe;
      const hands = s.hands.map((x, i) =>
        i === s.active ? { ...x, cards: [...x.cards, card], bet: x.bet * 2, status: 'done' } : x
      );
      return normalize({ ...s, shoe: rest, hands, bankroll: s.bankroll - h.bet });
    }

    case 'SPLIT': {
      const h = s.hands[s.active];
      if (
        s.phase !== 'player' || !h || h.cards.length !== 2 ||
        cardValue(h.cards[0].r) !== cardValue(h.cards[1].r) ||
        s.hands.length >= MAX_HANDS || s.bankroll < h.bet
      ) return s;
      const [a1, b1] = h.cards;
      const [c1, c2, ...rest] = s.shoe;
      const aces = a1.r === 'A'; // split aces get one card each, no more play
      const status = aces ? 'done' : 'playing';
      const first = { cards: [a1, c1], bet: h.bet, status, fromSplit: true };
      const second = { cards: [b1, c2], bet: h.bet, status, fromSplit: true };
      const hands = [...s.hands.slice(0, s.active), first, second, ...s.hands.slice(s.active + 1)];
      return normalize({ ...s, shoe: rest, hands, bankroll: s.bankroll - h.bet });
    }

    case 'DEALER_DRAW': {
      if (s.phase !== 'dealer') return s;
      const [card, ...rest] = s.shoe;
      return { ...s, shoe: rest, dealer: [...s.dealer, card] };
    }

    case 'SETTLE':
      return s.phase === 'dealer' ? settle(s) : s;

    case 'NEXT':
      if (s.phase !== 'done') return s;
      return { ...s, phase: 'betting', hands: [], dealer: [], results: null, bet: 0, insurance: 0, active: 0 };

    case 'TOGGLE_HINT':
      return { ...s, hint: !s.hint };

    case 'RESET':
      return {
        ...initialState,
        hydrated: true,
        hint: s.hint,
        round: s.round,
      };

    default:
      return s;
  }
}

/* ────────────────────────────────────────────────────────────────
   UI
──────────────────────────────────────────────────────────────── */

function Card({ card, hidden, delay = 0, flip = false }) {
  const style = delay ? { animationDelay: `${delay}ms` } : undefined;
  if (hidden) return <div className="bj-card bj-card-back" style={style} aria-label="Face-down card" />;
  const red = card.s === '♥' || card.s === '♦';
  return (
    <div
      className={`bj-card ${red ? 'bj-red' : ''} ${flip ? 'bj-flip' : ''}`}
      style={style}
      aria-label={`${card.r} of ${SUIT_NAMES[card.s]}`}
    >
      <span className="bj-corner">{card.r}<br />{card.s}</span>
      <span className="bj-pip">{card.s}</span>
    </div>
  );
}

export default function Blackjack() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { phase, hands, dealer, active, bankroll, bet, insurance, results, stats, round, hint } = state;

  // Load saved balance + stats after mount (avoids SSR hydration mismatch).
  useEffect(() => {
    let saved = null;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {}
    dispatch({ type: 'LOAD', saved });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ bankroll, stats, hint }));
    } catch {}
  }, [state.hydrated, bankroll, stats, hint]);

  // Dealer plays one card at a time.
  useEffect(() => {
    if (phase !== 'dealer') return;
    const t = setTimeout(() => {
      dispatch({ type: dealerShouldDraw(dealer) ? 'DEALER_DRAW' : 'SETTLE' });
    }, 700);
    return () => clearTimeout(t);
  }, [phase, dealer]);

  /* derived */
  const hideHole = phase === 'player' || phase === 'insurance';
  const multi = hands.length > 1;
  const activeHand = hands[active];
  const inPlay = phase === 'player' && Boolean(activeHand);
  const twoCards = inPlay && activeHand.cards.length === 2;
  const isPair =
    twoCards && cardValue(activeHand.cards[0].r) === cardValue(activeHand.cards[1].r);
  const canDouble = twoCards && bankroll >= activeHand.bet;
  const canSplit = isPair && hands.length < MAX_HANDS && bankroll >= activeHand.bet;
  const advice = hint && inPlay ? advise(activeHand.cards, dealer[0], { canDouble, canSplit }) : null;
  const totalBet =
    phase === 'betting' ? bet : hands.reduce((t, h) => t + h.bet, 0) + insurance;
  const broke = phase === 'betting' && bankroll < CHIPS[0];
  const rebetAmount = Math.min(state.lastBet, bankroll);
  const canRebet = rebetAmount >= CHIPS[0];
  const insuranceCost = hands[0] ? Math.floor(hands[0].bet / 2) : 0;

  const dealerScore = dealer.length ? score(hideHole ? [dealer[0]] : dealer) : null;

  const needShoe = () => (state.shoe.length < CUT_CARD ? buildShoe(DECKS) : undefined);
  const deal = () => dispatch({ type: 'DEAL', shoe: needShoe() });
  const rebetDeal = () => dispatch({ type: 'REBET_DEAL', shoe: needShoe() });
  const resetGame = () => {
    if (window.confirm('Reset your balance and stats?')) dispatch({ type: 'RESET' });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const onButton = e.target instanceof HTMLElement && e.target.tagName === 'BUTTON';
      const k = e.key.toLowerCase();

      if (phase === 'player') {
        if (k === 'h') dispatch({ type: 'HIT' });
        else if (k === 's') dispatch({ type: 'STAND' });
        else if (k === 'd' && canDouble) dispatch({ type: 'DOUBLE' });
        else if (k === 'p' && canSplit) dispatch({ type: 'SPLIT' });
      } else if (phase === 'insurance') {
        if (k === 'y') dispatch({ type: 'INSURE', take: true });
        else if (k === 'n') dispatch({ type: 'INSURE', take: false });
      } else if (phase === 'betting') {
        if (k === 'enter' && !onButton && bet > 0) deal();
        else if (k === 'r' && canRebet) dispatch({ type: 'SET_BET', amount: rebetAmount });
      } else if (phase === 'done') {
        if (k === 'enter' && !onButton) dispatch({ type: 'NEXT' });
        else if (k === 'r' && canRebet) rebetDeal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* result banner */
  let banner = null;
  if (phase === 'done' && results) {
    const single = results.hands.length === 1 && !results.insurance;
    const net = results.net;
    const tone = net > 0 ? 'win' : net < 0 ? 'lose' : 'push';
    const headline = single
      ? RESULTS[results.hands[0].outcome].label
      : net > 0 ? 'You win' : net < 0 ? 'Dealer wins' : 'Even';
    banner = { tone, headline, net, single };
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #080808;
          --surface: #111111;
          --border: rgba(255,255,255,0.07);
          --text: #f0f0f0;
          --muted: #666;
          --win: #a3e7a3;
          --lose: #e58a8a;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
        }

        h1 { font-family: 'Syne', sans-serif; font-weight: 800; }

        @keyframes dealIn {
          from { opacity: 0; transform: translateY(-14px) rotate(-3deg); }
          to   { opacity: 1; transform: translateY(0) rotate(0); }
        }
        @keyframes flipIn {
          from { transform: scaleX(0.05); }
          to   { transform: scaleX(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .pill-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 1.25rem;
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
          transition: all 0.2s;
          border: 1px solid var(--border);
          color: var(--muted);
          background: transparent;
          cursor: pointer;
        }
        .pill-btn:hover:not(:disabled) { border-color: rgba(255,255,255,0.2); color: var(--text); }
        .pill-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .pill-btn:focus-visible, .bj-chip:focus-visible, .bj-link:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
        .pill-btn.primary { background: #fff; color: #080808; border-color: #fff; font-weight: 600; }
        .pill-btn.primary:hover:not(:disabled) { background: #e0e0e0; border-color: #e0e0e0; }
        .pill-btn.suggest { box-shadow: 0 0 0 2px rgba(163,231,163,0.55); }

        .pill-btn kbd {
          display: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.7rem;
          font-weight: 500;
          padding: 0 5px;
          border-radius: 4px;
          border: 1px solid currentColor;
          opacity: 0.45;
        }
        @media (hover: hover) and (pointer: fine) {
          .pill-btn kbd { display: inline-block; }
        }

        .bj-page { max-width: 720px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }

        .bj-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
        }

        .bj-stats { display: flex; gap: 2rem; }
        .bj-stat small { display: block; font-size: 0.75rem; color: var(--muted); margin-bottom: 2px; }
        .bj-stat strong { font-family: 'Syne', sans-serif; font-size: 1.25rem; font-weight: 700; }

        .bj-table {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .bj-hands { display: flex; flex-wrap: wrap; gap: 1.25rem 2rem; }
        .bj-hand { flex: 1 1 auto; border-radius: 14px; border: 1px solid transparent; transition: border-color 0.2s, background 0.2s; }
        .bj-hands.bj-multi .bj-hand { padding: 0.75rem; margin: -0.75rem; }
        .bj-hands.bj-multi { gap: 1.5rem 1.25rem; padding: 0.75rem 0.75rem 0; margin-bottom: -0.75rem; }
        .bj-hand.bj-active { border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.03); }

        .bj-hand-head {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
          color: var(--muted);
        }
        .bj-hand-head b { font-family: 'Syne', sans-serif; font-size: 1.1rem; color: var(--text); }
        .bj-hand-head .bj-soft { font-size: 0.75rem; }

        .bj-tag {
          font-size: 0.7rem;
          padding: 1px 8px;
          border-radius: 999px;
          border: 1px solid var(--border);
          color: var(--muted);
        }
        .bj-tag.win { color: var(--win); border-color: rgba(163,231,163,0.35); }
        .bj-tag.lose { color: var(--lose); border-color: rgba(229,138,138,0.35); }
        .bj-tag.push { color: var(--text); border-color: rgba(255,255,255,0.25); }

        .bj-cards { display: flex; gap: 0.6rem; min-height: 96px; flex-wrap: wrap; }
        .bj-empty { align-self: center; font-size: 0.9rem; color: var(--muted); }

        .bj-card {
          width: 68px;
          height: 96px;
          border-radius: 10px;
          background: #f5f5f5;
          color: #111;
          position: relative;
          animation: dealIn 0.3s ease both;
          font-family: 'Syne', sans-serif;
          box-shadow: 0 6px 18px rgba(0,0,0,0.5);
        }
        .bj-card.bj-red { color: #d64545; }
        .bj-card.bj-flip { animation: flipIn 0.35s ease both; }
        .bj-corner {
          position: absolute;
          top: 7px;
          left: 8px;
          font-size: 0.95rem;
          font-weight: 700;
          line-height: 1.1;
          text-align: center;
        }
        .bj-pip {
          position: absolute;
          right: 8px;
          bottom: 4px;
          font-size: 1.9rem;
          line-height: 1;
        }
        .bj-card-back {
          background:
            repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 6px, transparent 6px 12px),
            #1c1c1c;
          border: 1px solid rgba(255,255,255,0.15);
        }

        .bj-divider { height: 1px; background: var(--border); }

        .bj-banner {
          text-align: center;
          animation: fadeUp 0.4s ease both;
        }
        .bj-banner h2 { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; }
        .bj-banner p { color: var(--muted); font-size: 0.9rem; margin-top: 4px; }
        .bj-banner.win h2 { color: var(--win); }
        .bj-banner.lose h2 { color: var(--lose); }
        .bj-banner.push h2 { color: var(--text); }

        .bj-controls { margin-top: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; min-height: 120px; }
        .bj-row { display: flex; gap: 0.6rem; flex-wrap: wrap; justify-content: center; }

        .bj-bet { font-size: 0.9rem; color: var(--muted); text-align: center; }
        .bj-bet b { color: var(--text); font-family: 'Syne', sans-serif; font-size: 1.1rem; }
        .bj-hint { font-size: 0.85rem; color: var(--muted); }
        .bj-hint b { color: var(--win); font-weight: 500; }

        .bj-chip {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px dashed rgba(255,255,255,0.3);
          background: transparent;
          color: var(--text);
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: transform 0.15s, border-color 0.15s;
        }
        .bj-chip:hover:not(:disabled) { transform: translateY(-2px); border-color: #fff; }
        .bj-chip:disabled { opacity: 0.25; cursor: not-allowed; }
        .bj-chip[data-v="50"]  { border-color: rgba(229,138,138,0.6); }
        .bj-chip[data-v="100"] { border-color: rgba(163,231,163,0.6); }
        .bj-chip[data-v="500"] { border-color: rgba(170,150,230,0.7); }
        .bj-chip[data-v]:hover:not(:disabled) { border-color: #fff; }

        .bj-footer {
          margin-top: 2rem;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.4rem 1.25rem;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .bj-link {
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          color: var(--muted);
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
        }
        .bj-link:hover:not(:disabled) { color: var(--text); }
        .bj-link:disabled { opacity: 0.35; cursor: not-allowed; text-decoration: none; }

        .bj-note { margin-top: 1rem; text-align: center; font-size: 0.75rem; color: var(--muted); line-height: 1.6; }

        @media (max-width: 480px) {
          .bj-table { padding: 1.25rem; }
          .bj-card { width: 56px; height: 80px; }
          .bj-pip { font-size: 1.5rem; }
          .bj-stats { gap: 1.25rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .bj-card, .bj-banner { animation: none; }
        }
      `}</style>

      <div className="bj-page">
        <div className="bj-top">
          <Link href="/" className="pill-btn">← Home</Link>
          <div className="bj-stats">
            <div className="bj-stat"><small>Balance</small><strong>{fmt(bankroll)}</strong></div>
            <div className="bj-stat"><small>Bet</small><strong>{fmt(totalBet)}</strong></div>
          </div>
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '1.5rem' }}>Blackjack</h1>

        <div className="bj-table">
          <div>
            <div className="bj-hand-head">
              <span>Dealer</span>
              {dealerScore && <b>{dealerScore.total}</b>}
              {hideHole && dealer.length > 0 && <span className="bj-soft">showing</span>}
              {!hideHole && dealer.length > 0 && isBlackjack(dealer) && <span className="bj-tag">Blackjack</span>}
              {!hideHole && dealerScore && dealerScore.total > 21 && <span className="bj-tag">Bust</span>}
            </div>
            <div className="bj-cards">
              {dealer.map((c, i) => {
                const isHole = i === 1;
                const stagger = hands.length <= 1 && i < 2;
                return (
                  <Card
                    key={`${round}-d${i}-${isHole && hideHole ? 'h' : 'v'}`}
                    card={c}
                    hidden={hideHole && isHole}
                    flip={isHole && !hideHole && phase !== 'betting'}
                    delay={stagger && !(isHole && !hideHole) ? (i * 2 + 1) * 110 : 0}
                  />
                );
              })}
              {dealer.length === 0 && <span className="bj-empty">Place a bet to deal.</span>}
            </div>
          </div>

          <div className="bj-divider" />

          <div className={`bj-hands ${multi ? 'bj-multi' : ''}`}>
            {hands.length === 0 && (
              <div className="bj-hand">
                <div className="bj-hand-head"><span>You</span></div>
                <div className="bj-cards" />
              </div>
            )}
            {hands.map((h, i) => {
              const sc = score(h.cards);
              const row = results?.hands[i];
              const rowNet = row ? row.payout - row.wager : 0;
              return (
                <div
                  key={`${round}-h${i}`}
                  className={`bj-hand ${multi && phase === 'player' && i === active ? 'bj-active' : ''}`}
                >
                  <div className="bj-hand-head">
                    <span>{multi ? `Hand ${i + 1}` : 'You'}</span>
                    <b>{sc.total}</b>
                    {sc.soft && sc.total < 21 && <span className="bj-soft">soft</span>}
                    {isNatural(h) && <span className="bj-tag">Blackjack</span>}
                    {sc.total > 21 && <span className="bj-tag">Bust</span>}
                    {multi && <span className="bj-soft">{fmt(h.bet)}</span>}
                    {multi && row && (
                      <span className={`bj-tag ${RESULTS[row.outcome].tone}`}>
                        {RESULTS[row.outcome].label}
                        {rowNet !== 0 && ` ${rowNet > 0 ? '+' : '−'}${fmt(Math.abs(rowNet))}`}
                      </span>
                    )}
                  </div>
                  <div className="bj-cards">
                    {h.cards.map((c, ci) => (
                      <Card
                        key={`${round}-h${i}-c${ci}`}
                        card={c}
                        delay={hands.length === 1 && ci < 2 ? ci * 2 * 110 : 0}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bj-controls" role="status" aria-live="polite">
          {phase === 'betting' && !broke && (
            <>
              <p className="bj-bet">Place your bet</p>
              <div className="bj-row">
                {CHIPS.map((c) => (
                  <button
                    key={c}
                    className="bj-chip"
                    data-v={c}
                    onClick={() => dispatch({ type: 'CHIP', amount: c })}
                    disabled={bet + c > bankroll}
                    aria-label={`Add $${c}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="bj-row">
                <button className="pill-btn" onClick={() => dispatch({ type: 'SET_BET', amount: 0 })} disabled={bet === 0}>
                  Clear
                </button>
                <button
                  className="pill-btn"
                  onClick={() => dispatch({ type: 'SET_BET', amount: bankroll })}
                  disabled={bet === bankroll}
                >
                  Max
                </button>
                {bet === 0 && canRebet && (
                  <button className="pill-btn" onClick={() => dispatch({ type: 'SET_BET', amount: rebetAmount })}>
                    Rebet {fmt(rebetAmount)} <kbd>R</kbd>
                  </button>
                )}
                <button className="pill-btn primary" onClick={deal} disabled={bet === 0}>
                  Deal <kbd>↵</kbd>
                </button>
              </div>
            </>
          )}

          {broke && (
            <div className="bj-banner lose">
              <h2>Out of chips</h2>
              <p style={{ marginBottom: '1rem' }}>Start over with {fmt(START_BALANCE)}.</p>
              <button className="pill-btn primary" onClick={() => dispatch({ type: 'RESET' })}>New game</button>
            </div>
          )}

          {phase === 'insurance' && (
            <>
              <p className="bj-bet">
                Dealer shows an Ace. Insure for <b>{fmt(insuranceCost)}</b>? Pays 2:1 if the dealer has blackjack.
              </p>
              <div className="bj-row">
                <button className="pill-btn primary" onClick={() => dispatch({ type: 'INSURE', take: true })}>
                  Take insurance <kbd>Y</kbd>
                </button>
                <button className="pill-btn" onClick={() => dispatch({ type: 'INSURE', take: false })}>
                  No thanks <kbd>N</kbd>
                </button>
              </div>
            </>
          )}

          {phase === 'player' && (
            <>
              <div className="bj-row">
                <button
                  className={`pill-btn primary ${advice === 'Hit' ? 'suggest' : ''}`}
                  onClick={() => dispatch({ type: 'HIT' })}
                >
                  Hit <kbd>H</kbd>
                </button>
                <button
                  className={`pill-btn ${advice === 'Stand' ? 'suggest' : ''}`}
                  onClick={() => dispatch({ type: 'STAND' })}
                >
                  Stand <kbd>S</kbd>
                </button>
                <button
                  className={`pill-btn ${advice === 'Double' ? 'suggest' : ''}`}
                  onClick={() => dispatch({ type: 'DOUBLE' })}
                  disabled={!canDouble}
                >
                  Double <kbd>D</kbd>
                </button>
                {isPair && (
                  <button
                    className={`pill-btn ${advice === 'Split' ? 'suggest' : ''}`}
                    onClick={() => dispatch({ type: 'SPLIT' })}
                    disabled={!canSplit}
                  >
                    Split <kbd>P</kbd>
                  </button>
                )}
              </div>
              {advice && <p className="bj-hint">Basic strategy: <b>{advice}</b></p>}
            </>
          )}

          {phase === 'dealer' && <p className="bj-bet">Dealer's turn…</p>}

          {phase === 'done' && banner && (
            <>
              <div className={`bj-banner ${banner.tone}`}>
                <h2>{banner.headline}</h2>
                <p>
                  {banner.net > 0 && `You won ${fmt(banner.net)}`}
                  {banner.net === 0 && (banner.single ? 'Your bet is returned' : 'You broke even')}
                  {banner.net < 0 && `You lost ${fmt(-banner.net)}`}
                </p>
                {results.insurance > 0 && (
                  <p>
                    {results.insPayout > 0
                      ? `Insurance paid ${fmt(results.insurance * 2)}`
                      : `Insurance lost ${fmt(results.insurance)}`}
                  </p>
                )}
              </div>
              <div className="bj-row">
                <button className="pill-btn primary" onClick={() => dispatch({ type: 'NEXT' })}>
                  Next hand <kbd>↵</kbd>
                </button>
                {canRebet && (
                  <button className="pill-btn" onClick={rebetDeal}>
                    Rebet {fmt(rebetAmount)} <kbd>R</kbd>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="bj-footer">
          <span>Hands {stats.hands}</span>
          <span>Won {stats.wins}</span>
          <span>Lost {stats.losses}</span>
          <span>Push {stats.pushes}</span>
          <span>Peak {fmt(stats.peak)}</span>
          <button className="bj-link" aria-pressed={hint} onClick={() => dispatch({ type: 'TOGGLE_HINT' })}>
            Strategy hints: {hint ? 'on' : 'off'}
          </button>
          <button
            className="bj-link"
            onClick={resetGame}
            disabled={phase === 'player' || phase === 'dealer' || phase === 'insurance'}
          >
            Reset
          </button>
        </div>

        <p className="bj-note">
          {DECKS} decks · Blackjack pays 3:2 · Dealer {DEALER_HITS_SOFT_17 ? 'hits soft 17' : 'stands on all 17s'} ·
          Double on any first two cards · Split up to {MAX_HANDS} hands · Insurance pays 2:1
          <br />
          {state.shoe.length > 0 && `${state.shoe.length} cards left in shoe`}
          {state.shuffled && hands.length > 0 && ' · New shoe shuffled'}
        </p>
      </div>
    </>
  );
}