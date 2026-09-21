"use client";
import { useState, useEffect, useCallback } from "react";
import data from '../../utils/data.json';
import teachers from '../../utils/teachers.json';

function calcAge(birth_date) {
  if (!birth_date) return '—';
  const b = new Date(birth_date);
  if (isNaN(b)) return '—';
  const diff = Date.now() - b.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function avatarFor(email) {
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(email)}`;
}

// Static entries from data.json / teachers.json have NUMERIC ids.
// Registered users (from users.json via the API) have STRING ids like "u-email@x.com".
// This check is safe for both.
const isRegistered = (item) =>
  typeof item?.id === "string" && item.id.startsWith("u-");

// Deletes a registered user from users.json through the API.
// Returns true on success, false on any failure.
async function deleteRegisteredUser(email) {
  try {
    const res = await fetch("/api/users/register", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await res.json();
    return Boolean(result.success);
  } catch {
    return false;
  }
}

export default function Page() {
  const [students, setStudents] = useState(data);
  const [teacherList, setTeacherList] = useState(teachers);
  const [activeTab, setActiveTab] = useState("students");
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState(null);
  const [selected, setSelected] = useState(null); // { type: 'student' | 'teacher', data: {...} }

  // register modal
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    birth_date: "",
    type: "student",
  });
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // ---- load registered users from the API and merge them in ----
  const loadRegisteredUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users/register");
      const result = await res.json();
      if (!result.success) return;

      const regStudents = result.users
        .filter((u) => u.type === "student")
        .map((u) => ({
          id: `u-${u.email}`,
          firstname: u.firstName,
          lastname: u.lastName,
          email: u.email,
          image: avatarFor(u.email),
          age: calcAge(u.birth_date),
          height: "—",
          role: "student",
          items: [],
        }));

      const regTeachers = result.users
        .filter((u) => u.type === "teacher")
        .map((u) => ({
          id: `u-${u.email}`,
          name: `${u.firstName} ${u.lastName}`,
          image: avatarFor(u.email),
          role: "Teacher",
          department: "—",
          email: u.email,
        }));

      setStudents((prev) => {
        const existing = new Set(prev.map((p) => p.email));
        const toAdd = regStudents.filter((s) => !existing.has(s.email));
        return [...prev, ...toAdd];
      });

      setTeacherList((prev) => {
        const existing = new Set(prev.map((t) => t.email));
        const toAdd = regTeachers.filter((t) => !existing.has(t.email));
        return [...prev, ...toAdd];
      });
    } catch {
      // ignore — page still works with static data
    }
  }, []);

  useEffect(() => {
    loadRegisteredUsers();
  }, [loadRegisteredUsers]);

  // esc close
  useEffect(() => {
    if (!selected && !showRegister) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelected(null);
        setShowRegister(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, showRegister]);

  const filteredStudents = students.filter(p =>
    `${p.firstname} ${p.lastname}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTeachers = teacherList.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const jobColors = {
    developer: { bg: '#111111', border: 'rgba(255,255,255,0.07)', label: 'rgba(191,127,255,0.15)', labelText: '#ffffff' },
    designer:  { bg: '#111111', border: 'rgba(255,255,255,0.07)', label: 'rgba(191,127,255,0.15)', labelText: '#ffffff' },
    manager:   { bg: '#111111', border: 'rgba(255,255,255,0.07)', label: 'rgba(191,127,255,0.15)', labelText: '#ffffff' },
    junior:    { bg: '#111111', border: 'rgba(255,255,255,0.07)', label: 'rgba(191,127,255,0.15)', labelText: '#ffffff' },
    teacher:   { bg: '#111111', border: 'rgba(255,255,255,0.07)', label: 'rgba(191,127,255,0.15)', labelText: '#ffffff' },
    student:   { bg: '#111111', border: 'rgba(255,255,255,0.07)', label: 'rgba(191,127,255,0.15)', labelText: '#ffffff' },
  };

  const getColors = (role) => jobColors[String(role).toLowerCase()] ?? jobColors.junior;

  const HIDDEN_KEYS = new Set(['id', 'firstname', 'lastname', 'name', 'image', 'items', 'password', 'alive']);

  const prettyLabel = (key) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

  const renderValue = (val) => {
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (Array.isArray(val)) return val.join(', ');
    if (val === null || val === undefined || val === '') return '—';
    return String(val);
  };

  function handleRegChange(e) {
    setRegForm({ ...regForm, [e.target.name]: e.target.value });
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      const result = await res.json();

      if (!result.success) {
        setRegError(result.message || "Алдаа гарлаа");
        return;
      }

      // re-pull the full list from the API instead of hand-building
      // the new entry twice — keeps this in sync with users.json
      await loadRegisteredUsers();

      setRegForm({ firstName: "", lastName: "", email: "", password: "", birth_date: "", type: "student" });
      setShowRegister(false);
    } catch {
      setRegError("Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setRegLoading(false);
    }
  }

  // ---- delete handlers ----
  async function handleDeleteStudent(p) {
    // only registered users can be removed; static data.json entries are protected
    if (!isRegistered(p)) return;
    const ok = await deleteRegisteredUser(p.email);
    if (!ok) return;
    setStudents((prev) => prev.filter((s) => s.id !== p.id));
    if (openItems === p.id) setOpenItems(null);
  }

  async function handleDeleteTeacher(t) {
    if (!isRegistered(t)) return;
    const ok = await deleteRegisteredUser(t.email);
    if (!ok) return;
    setTeacherList((prev) => prev.filter((x) => x.id !== t.id));
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #080808;
          --surface: #111;
          --border: rgba(255,255,255,0.07);
          --text: #f0f0f0;
          --muted: #555;
        }

        body {
          background: var(--bg);
          color: var(--text);
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
        @keyframes shimmer {
          from { background-position: -200% 0; }
          to   { background-position: 200% 0; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); max-height: 0; }
          to   { opacity: 1; transform: translateY(0); max-height: 200px; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .page-enter { animation: fadeUp 0.6s ease both; }

        .dir-card {
          border-radius: 16px;
          padding: 1.25rem;
          border: 1px solid var(--border);
          transition: border-color 0.25s, transform 0.25s;
          position: relative;
          overflow: hidden;
          animation: cardIn 0.5s ease both;
          cursor: pointer;
        }
        .dir-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.14);
        }
        .dir-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%);
          pointer-events: none;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .job-badge {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 999px;
        }

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
        }
        .search-input::placeholder { color: #444; }
        .search-input:focus { border-color: rgba(255,255,255,0.2); }

        .tab-btn {
          padding: 0.5rem 1.25rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
          font-family: 'Syne', sans-serif;
          border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.03em;
        }
        .tab-active {
          background: #fff;
          color: #080808;
          border-color: #fff;
        }
        .tab-inactive {
          background: transparent;
          color: #555;
        }
        .tab-inactive:hover { color: #aaa; border-color: rgba(255,255,255,0.14); }

        .add-btn {
          padding: 0.5rem 1.25rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          border: 1px solid #fff;
          background: #fff;
          color: #080808;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.03em;
          margin-left: auto;
        }
        .add-btn:hover { background: #e5e5e5; }

        .items-panel {
          animation: slideDown 0.25s ease both;
          overflow: hidden;
        }

        .btn-ghost {
          width: 100%;
          padding: 0.5rem;
          font-size: 0.75rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07);
          background: transparent;
          color: #555;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 0.5rem;
        }
        .btn-ghost:hover { color: #aaa; border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.03); }

        .btn-delete {
          width: 100%;
          padding: 0.5rem;
          font-size: 0.75rem;
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

        .avatar-img {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .name-text {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: #e8e8e8;
          margin-bottom: 2px;
        }
        .meta-text {
          font-size: 0.72rem;
          color: #444;
        }
        .email-text {
          font-size: 0.7rem;
          color: #3a3a3a;
          margin-bottom: 0.75rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 14px;
        }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(1.8rem, 4vw, 2.5rem);
          color: #f0f0f0;
          margin-bottom: 4px;
        }
        .count-label {
          font-size: 0.8rem;
          color: #444;
          font-weight: 300;
        }

        .empty-state {
          text-align: center;
          padding: 5rem 1rem;
          color: #333;
          font-size: 0.9rem;
          grid-column: 1 / -1;
        }
        .empty-state span { display: block; font-size: 2rem; margin-bottom: 0.75rem; }

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
          max-width: 480px;
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
          transition: all 0.2s;
        }
        .modal-close:hover { color: #fff; border-color: rgba(255,255,255,0.25); }
        .modal-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          object-fit: cover;
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 1rem;
        }
        .modal-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.5rem;
          color: #f5f5f5;
          margin-bottom: 0.25rem;
        }
        .modal-section-label {
          font-family: 'Syne', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #555;
          margin: 1.5rem 0 0.75rem;
        }
        .modal-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem 1rem;
        }
        .modal-info-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 0.6rem 0.75rem;
        }
        .modal-info-key {
          font-size: 0.62rem;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 3px;
        }
        .modal-info-val {
          font-size: 0.85rem;
          color: #ddd;
          font-weight: 500;
          word-break: break-word;
        }
        .modal-items-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .modal-item-thumb {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 68px;
        }
        .modal-item-thumb img {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          object-fit: cover;
        }
        .modal-item-thumb span {
          font-size: 0.65rem;
          color: #666;
          text-align: center;
        }

        /* register form */
        .form-label {
          display: block;
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 6px;
          font-family: 'Syne', sans-serif;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .form-field { margin-bottom: 1rem; }
        .form-input {
          background: #0c0c0c;
          border: 1px solid rgba(255,255,255,0.08);
          color: #f0f0f0;
          padding: 0.625rem 0.875rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }
        .form-input::placeholder { color: #444; }
        .form-input:focus { border-color: rgba(255,255,255,0.25); }
        .form-error {
          color: #ff6060;
          font-size: 0.75rem;
          margin-bottom: 1rem;
        }
        .form-submit {
          width: 100%;
          padding: 0.75rem;
          border-radius: 999px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          border: 1px solid #fff;
          background: #fff;
          color: #080808;
          cursor: pointer;
          transition: all 0.2s;
        }
        .form-submit:hover { background: #e5e5e5; }
        .form-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <main style={{ minHeight: '100vh', background: '#080808', padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* header */}
          <div className="page-enter" style={{ marginBottom: '2rem' }}>
            <h1 className="section-title">Directory</h1>
            <p className="count-label">
              {activeTab === 'students' ? `${students.length} students` : `${teacherList.length} teachers`}
            </p>
          </div>

          {/* controls */}
          <div className="page-enter" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className={`tab-btn ${activeTab === 'students' ? 'tab-active' : 'tab-inactive'}`}
                onClick={() => { setActiveTab('students'); setSearch(''); }}>
                Students ({students.length})
              </button>
              <button className={`tab-btn ${activeTab === 'teachers' ? 'tab-active' : 'tab-inactive'}`}
                onClick={() => { setActiveTab('teachers'); setSearch(''); }}>
                Teachers ({teacherList.length})
              </button>
            </div>
            <input
              className="search-input"
              style={{ maxWidth: '260px' }}
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="add-btn" onClick={() => setShowRegister(true)}>
              + Add User
            </button>
          </div>

          {/* students */}
          {activeTab === 'students' && (
            <div className="grid-layout">
              {filteredStudents.length === 0
                ? <div className="empty-state"><span>◌</span>No results for &quot;{search}&quot;</div>
                : filteredStudents.map((p, i) => {
                    const c = getColors(p.role);
                    return (
                      <div
                        key={p.id}
                        className="dir-card"
                        style={{ background: c.bg, borderColor: c.border, animationDelay: `${i * 0.04}s` }}
                        onClick={() => setSelected({ type: 'student', data: p })}
                      >
                        {/* top row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                          <img src={p.image} alt={p.firstname} className="avatar-img" />
                          <span className="job-badge" style={{ background: c.label, color: c.labelText }}>
                            {p.role}
                          </span>
                        </div>

                        <div className="name-text">{p.firstname} {p.lastname}</div>
                        <div className="email-text">{p.email}</div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '0.875rem' }}>
                          <span className="meta-text">{p.age} yrs</span>
                          <span className="meta-text">·</span>
                          <span className="meta-text">{p.height} cm</span>
                        </div>

                        <button
                          className="btn-ghost"
                          onClick={(e) => { e.stopPropagation(); setOpenItems(openItems === p.id ? null : p.id); }}
                        >
                          {openItems === p.id ? '↑ Hide items' : `↓ Items (${p.items?.length ?? 0})`}
                        </button>

                        {openItems === p.id && (
                          <div
                            className="items-panel"
                            style={{ display: 'flex', gap: '8px', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', marginBottom: '0.5rem', flexWrap: 'wrap' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(p.items ?? []).map(item => (
                              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <img src={item.image} alt={item.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                                <span style={{ fontSize: '0.65rem', color: '#444' }}>{item.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {isRegistered(p) && (
                          <button
                            className="btn-delete"
                            onClick={(e) => { e.stopPropagation(); handleDeleteStudent(p); }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
            </div>
          )}

          {/* teachers */}
          {activeTab === 'teachers' && (
            <div className="grid-layout">
              {filteredTeachers.length === 0
                ? <div className="empty-state"><span>◌</span>No results for &quot;{search}&quot;</div>
                : filteredTeachers.map((t, i) => {
                    const c = getColors('teacher');
                    return (
                      <div
                        key={t.id}
                        className="dir-card"
                        style={{ background: c.bg, borderColor: c.border, animationDelay: `${i * 0.04}s` }}
                        onClick={() => setSelected({ type: 'teacher', data: t })}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                          <img src={t.image} alt={t.name} className="avatar-img" />
                          <span className="job-badge" style={{ background: c.label, color: c.labelText }}>
                            teacher
                          </span>
                        </div>

                        <div className="name-text">{t.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#555', marginBottom: '2px' }}>{t.role}</div>
                        <div style={{ fontSize: '0.68rem', color: '#333', marginBottom: '0.875rem' }}>{t.department}</div>

                        {isRegistered(t) && (
                          <button
                            className="btn-delete"
                            onClick={(e) => { e.stopPropagation(); handleDeleteTeacher(t); }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
            </div>
          )}

        </div>
      </main>

      {/* detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>

            <img
              src={selected.data.image}
              alt={selected.data.firstname || selected.data.name}
              className="modal-avatar"
            />
            <div className="modal-name">
              {selected.data.firstname
                ? `${selected.data.firstname} ${selected.data.lastname}`
                : selected.data.name}
            </div>
            {selected.type === 'student' && selected.data.role && (
              <span className="job-badge" style={{ background: 'rgba(191,127,255,0.15)', color: '#fff' }}>
                {selected.data.role}
              </span>
            )}
            {selected.type === 'teacher' && selected.data.role && (
              <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                {selected.data.role}{selected.data.department ? ` · ${selected.data.department}` : ''}
              </div>
            )}

            <p className="modal-section-label">Details</p>
            <div className="modal-info-grid">
              {Object.entries(selected.data)
                .filter(([key]) => !HIDDEN_KEYS.has(key))
                .map(([key, val]) => (
                  <div className="modal-info-item" key={key}>
                    <div className="modal-info-key">{prettyLabel(key)}</div>
                    <div className="modal-info-val">{renderValue(val)}</div>
                  </div>
                ))}
            </div>

            {selected.type === 'student' && selected.data.items?.length > 0 && (
              <>
                <p className="modal-section-label">Items</p>
                <div className="modal-items-row">
                  {selected.data.items.map(item => (
                    <div className="modal-item-thumb" key={item.id}>
                      <img src={item.image} alt={item.name} />
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* register modal */}
      {showRegister && (
        <div className="modal-overlay" onClick={() => setShowRegister(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRegister(false)}>✕</button>

            <div className="modal-name">New user</div>
            <p className="count-label" style={{ marginBottom: '1.5rem' }}>Register a student or teacher</p>

            <form onSubmit={handleRegisterSubmit}>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">First name</label>
                  <input
                    className="form-input"
                    name="firstName"
                    value={regForm.firstName}
                    onChange={handleRegChange}
                    placeholder="Anand"
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Last name</label>
                  <input
                    className="form-input"
                    name="lastName"
                    value={regForm.lastName}
                    onChange={handleRegChange}
                    placeholder="Amarzaya"
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  name="email"
                  value={regForm.email}
                  onChange={handleRegChange}
                  placeholder="name@gmail.com"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  name="password"
                  value={regForm.password}
                  onChange={handleRegChange}
                  placeholder="••••••"
                  minLength={6}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Birth date</label>
                  <input
                    className="form-input"
                    type="date"
                    name="birth_date"
                    value={regForm.birth_date}
                    onChange={handleRegChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Type</label>
                  <select
                    className="form-input"
                    name="type"
                    value={regForm.type}
                    onChange={handleRegChange}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>
              </div>

              {regError && <div className="form-error">{regError}</div>}

              <button type="submit" className="form-submit" disabled={regLoading}>
                {regLoading ? 'Registering…' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}