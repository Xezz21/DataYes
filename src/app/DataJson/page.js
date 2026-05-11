"use client";
import { useState, useEffect } from "react";
import data from '../../utils/data.json';
import teachers from '../../utils/teachers.json';

export default function Page() {
  const [students, setStudents] = useState(data);
  const [teacherList, setTeacherList] = useState(teachers);
  const [activeTab, setActiveTab] = useState("students");
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filteredStudents = students.filter(p =>
    `${p.firstname} ${p.lastname}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTeachers = teacherList.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const jobColors = {
    developer: { bg: '#1a1a2e', border: '#2a2a4a', dot: '#6c8fff', label: 'rgba(108,143,255,0.15)', labelText: '#6c8fff' },
    designer:  { bg: '#1e1a2e', border: '#3a2a4a', dot: '#bf7fff', label: 'rgba(191,127,255,0.15)', labelText: '#bf7fff' },
    manager:   { bg: '#1a2e1a', border: '#2a4a2a', dot: '#7fff9f', label: 'rgba(127,255,159,0.15)', labelText: '#7fff9f' },
    junior:    { bg: '#2e2a1a', border: '#4a3a1a', dot: '#ffcf7f', label: 'rgba(255,207,127,0.15)', labelText: '#ffcf7f' },
    teacher:   { bg: '#1a2e2e', border: '#1a4040', dot: '#7fffff', label: 'rgba(127,255,255,0.15)', labelText: '#7fffff' },
  };

  const getColors = (job) => jobColors[job] ?? jobColors.junior;

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

        .page-enter { animation: fadeUp 0.6s ease both; }

        .dir-card {
          border-radius: 16px;
          padding: 1.25rem;
          border: 1px solid var(--border);
          transition: border-color 0.25s, transform 0.25s;
          position: relative;
          overflow: hidden;
          animation: cardIn 0.5s ease both;
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
          </div>

          {/* students */}
          {activeTab === 'students' && (
            <div className="grid-layout">
              {filteredStudents.length === 0
                ? <div className="empty-state"><span>◌</span>No results for "{search}"</div>
                : filteredStudents.map((p, i) => {
                    const c = getColors(p.job);
                    return (
                      <div
                        key={p.id}
                        className="dir-card"
                        style={{ background: c.bg, borderColor: c.border, animationDelay: `${i * 0.04}s` }}
                      >
                        {/* top row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                          <img src={p.image} alt={p.firstname} className="avatar-img" />
                          <span className="job-badge" style={{ background: c.label, color: c.labelText }}>
                            {p.job}
                          </span>
                        </div>

                        <div className="name-text">{p.firstname} {p.lastname}</div>
                        <div className="email-text">{p.email}</div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '0.875rem' }}>
                          <span className="meta-text">{p.age} yrs</span>
                          <span className="meta-text">·</span>
                          <span className="meta-text">{p.height} cm</span>
                        </div>

                        <button className="btn-ghost" onClick={() => setOpenItems(openItems === p.id ? null : p.id)}>
                          {openItems === p.id ? '↑ Hide items' : `↓ Items (${p.items.length})`}
                        </button>

                        {openItems === p.id && (
                          <div className="items-panel" style={{ display: 'flex', gap: '8px', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            {p.items.map(item => (
                              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <img src={item.image} alt={item.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                                <span style={{ fontSize: '0.65rem', color: '#444' }}>{item.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <button className="btn-delete" onClick={() => { setStudents(students.filter(s => s.id !== p.id)); }}>
                          Remove
                        </button>
                      </div>
                    );
                  })}
            </div>
          )}

          {/* teachers */}
          {activeTab === 'teachers' && (
            <div className="grid-layout">
              {filteredTeachers.length === 0
                ? <div className="empty-state"><span>◌</span>No results for "{search}"</div>
                : filteredTeachers.map((t, i) => {
                    const c = getColors('teacher');
                    return (
                      <div
                        key={t.id}
                        className="dir-card"
                        style={{ background: c.bg, borderColor: c.border, animationDelay: `${i * 0.04}s` }}
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

                        <button className="btn-delete" onClick={() => setTeacherList(teacherList.filter(x => x.id !== t.id))}>
                          Remove
                        </button>
                      </div>
                    );
                  })}
            </div>
          )}

        </div>
      </main>
    </>
  );
}