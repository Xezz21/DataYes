"use client";
import { useState, useEffect } from "react";

const POKEMON_COUNT = 1025; // Gen 1 — swap for a bigger number if you want more
const LIST_URL = `https://pokeapi.co/api/v2/pokemon?limit=${POKEMON_COUNT}`;

const TYPE_COLORS = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC',
};

const spriteUrl = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Reshape a raw PokéAPI detail response into the flat shape our UI uses.
const mapDetail = (d) => ({
  id: d.id,
  name: d.name,
  types: d.types.map((t) => t.type.name),
  height: d.height,
  weight: d.weight,
  abilities: d.abilities.map((a) => a.ability.name),
  stats: d.stats.map((s) => ({ name: s.stat.name, value: s.base_stat })),
  sprite: d.sprites?.other?.["official-artwork"]?.front_default || spriteUrl(d.id),
});

export default function Page() {
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const listRes = await fetch(LIST_URL);
        if (!listRes.ok) throw new Error("Couldn't reach PokéAPI");
        const listJson = await listRes.json();

        // fetch full detail for every entry in parallel (types, stats, etc.)
        const details = await Promise.all(
          listJson.results.map((p) => fetch(p.url).then((r) => r.json()))
        );

        if (!cancelled) {
          setPokemon(details.map(mapDetail));
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const removePokemon = (id) => setPokemon((prev) => prev.filter((p) => p.id !== id));

  // Instant client-side filter over the already-loaded list — no API calls.
  const filtered = pokemon.filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const primaryColor = (types) => TYPE_COLORS[types[0]] || '#888';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #080808;
          color: #f0f0f0;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes barFill {
          from { width: 0%; }
        }

        .page-enter { animation: fadeUp 0.6s ease both; }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(1.8rem, 4vw, 2.5rem);
          margin-bottom: 4px;
        }
        .count-label { font-size: 0.8rem; color: #444; font-weight: 300; }

        .search-input {
          background: #111;
          border: 1px solid rgba(255,255,255,0.08);
          color: #f0f0f0;
          padding: 0.625rem 1rem;
          border-radius: 999px;
          font-size: 0.875rem;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
          max-width: 260px;
        }
        .search-input::placeholder { color: #444; }
        .search-input:focus { border-color: rgba(255,255,255,0.2); }

        .grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 14px;
        }

        .poke-card {
          border-radius: 16px;
          padding: 1.1rem;
          border: 1px solid rgba(255,255,255,0.07);
          background: #111;
          transition: border-color 0.25s, transform 0.25s;
          position: relative;
          overflow: hidden;
          animation: cardIn 0.4s ease both;
          cursor: pointer;
        }
        .poke-card:hover {
          transform: translateY(-3px);
        }
        .poke-glow {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          filter: blur(30px);
          opacity: 0.25;
          pointer-events: none;
        }
        .poke-id {
          font-size: 0.65rem;
          color: #444;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.05em;
        }
        .poke-img {
          width: 84px;
          height: 84px;
          object-fit: contain;
          display: block;
          margin: 0.25rem auto 0.5rem;
          filter: drop-shadow(0 6px 10px rgba(0,0,0,0.4));
        }
        .poke-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          text-align: center;
          margin-bottom: 0.6rem;
        }
        .type-row {
          display: flex;
          gap: 6px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 0.85rem;
        }
        .type-pill {
          font-size: 0.62rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 999px;
          color: #0a0a0a;
        }

        .btn-delete {
          width: 100%;
          padding: 0.45rem;
          font-size: 0.72rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          border-radius: 10px;
          border: 1px solid rgba(255,80,80,0.15);
          background: transparent;
          color: rgba(255,100,100,0.7);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-delete:hover { background: rgba(255,60,60,0.08); border-color: rgba(255,80,80,0.3); color: #ff6060; }

        .empty-state, .error-state {
          text-align: center;
          padding: 5rem 1rem;
          color: #333;
          font-size: 0.9rem;
          grid-column: 1 / -1;
        }
        .error-state { color: #a55; }

        .spinner-ring {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: #f0f0f0;
          animation: spin 0.8s linear infinite;
          margin: 3rem auto;
        }

        /* modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          z-index: 1000;
          animation: overlayIn 0.2s ease both;
        }
        .modal-card {
          width: 100%;
          max-width: 460px;
          max-height: 85vh;
          overflow-y: auto;
          background: #111;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 2rem;
          animation: modalIn 0.25s ease both;
          position: relative;
        }
        .modal-close {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #777;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-close:hover { color: #fff; border-color: rgba(255,255,255,0.25); }
        .modal-img { width: 130px; height: 130px; object-fit: contain; display: block; margin: 0 auto 0.5rem; }
        .modal-id { text-align: center; font-size: 0.7rem; color: #555; font-family: 'Syne', sans-serif; letter-spacing: 0.08em; }
        .modal-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.5rem;
          text-align: center;
          margin: 0.15rem 0 0.6rem;
        }
        .modal-section-label {
          font-family: 'Syne', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #555;
          margin: 1.4rem 0 0.75rem;
        }
        .modal-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .modal-info-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 0.6rem 0.75rem;
        }
        .modal-info-key { font-size: 0.62rem; color: #555; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
        .modal-info-val { font-size: 0.85rem; color: #ddd; font-weight: 500; }

        .stat-row { display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem; }
        .stat-label { width: 84px; font-size: 0.68rem; color: #777; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }
        .stat-track { flex: 1; height: 6px; border-radius: 999px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .stat-fill { height: 100%; border-radius: 999px; animation: barFill 0.6s ease both; }
        .stat-value { width: 28px; text-align: right; font-size: 0.7rem; color: #999; flex-shrink: 0; }
      `}</style>

      <main style={{ minHeight: '100vh', background: '#080808', padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          <div className="page-enter" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
            <div>
              <h1 className="section-title">Test</h1>
              <p className="count-label">
                {loading ? 'Loading Pokémon…' : `${pokemon.length} Pokémon (via PokéAPI)`}
              </p>
            </div>
            <input
              className="search-input"
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading && <div className="spinner-ring" />}

          {!loading && error && (
            <div className="error-state">Couldn't load Pokémon: {error}</div>
          )}

          {!loading && !error && (
            <div className="grid-layout">
              {filtered.length === 0 ? (
                <div className="empty-state">No results for "{search}"</div>
              ) : (
                filtered.map((p, i) => {
                  const color = primaryColor(p.types);
                  return (
                    <div
                      key={p.id}
                      className="poke-card"
                      style={{ animationDelay: `${i * 0.02}s` }}
                      onClick={() => setSelected(p)}
                    >
                      <div className="poke-glow" style={{ background: color }} />
                      <div className="poke-id">#{String(p.id).padStart(3, '0')}</div>
                      <img className="poke-img" src={p.sprite} alt={p.name} loading="lazy" />
                      <div className="poke-name">{capitalize(p.name)}</div>
                      <div className="type-row">
                        {p.types.map((t) => (
                          <span key={t} className="type-pill" style={{ background: TYPE_COLORS[t] || '#888' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                      <button
                        className="btn-delete"
                        onClick={(e) => { e.stopPropagation(); removePokemon(p.id); }}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>

            <div className="modal-id">#{String(selected.id).padStart(3, '0')}</div>
            <img className="modal-img" src={selected.sprite} alt={selected.name} />
            <div className="modal-name">{capitalize(selected.name)}</div>
            <div className="type-row">
              {selected.types.map((t) => (
                <span key={t} className="type-pill" style={{ background: TYPE_COLORS[t] || '#888' }}>
                  {t}
                </span>
              ))}
            </div>

            <p className="modal-section-label">Details</p>
            <div className="modal-info-grid">
              <div className="modal-info-item">
                <div className="modal-info-key">Height</div>
                <div className="modal-info-val">{(selected.height / 10).toFixed(1)} m</div>
              </div>
              <div className="modal-info-item">
                <div className="modal-info-key">Weight</div>
                <div className="modal-info-val">{(selected.weight / 10).toFixed(1)} kg</div>
              </div>
              <div className="modal-info-item" style={{ gridColumn: '1 / -1' }}>
                <div className="modal-info-key">Abilities</div>
                <div className="modal-info-val">
                  {selected.abilities.map(capitalize).join(', ')}
                </div>
              </div>
            </div>

            <p className="modal-section-label">Base stats</p>
            <div>
              {selected.stats.map((s) => (
                <div className="stat-row" key={s.name}>
                  <span className="stat-label">{s.name.replace('special-', 'sp. ')}</span>
                  <div className="stat-track">
                    <div
                      className="stat-fill"
                      style={{
                        width: `${Math.min(100, (s.value / 180) * 100)}%`,
                        background: primaryColor(selected.types),
                      }}
                    />
                  </div>
                  <span className="stat-value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}