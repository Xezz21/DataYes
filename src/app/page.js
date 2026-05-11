import Link from 'next/link';

export default function Home() {
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
          --accent: #ffffff;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); opacity: 0.6; }
          70%  { transform: scale(1.08); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes grain {
          0%,100% { transform: translate(0,0); }
          10%  { transform: translate(-2%,-3%); }
          30%  { transform: translate(3%,2%); }
          50%  { transform: translate(-1%,4%); }
          70%  { transform: translate(2%,-2%); }
          90%  { transform: translate(-3%,1%); }
        }

        .grain::before {
          content: '';
          position: fixed;
          inset: -50%;
          width: 200%;
          height: 200%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.025;
          animation: grain 0.5s steps(1) infinite;
          pointer-events: none;
          z-index: 999;
        }

        .hero { animation: fadeUp 0.8s ease both; }
        .hero-sub { animation: fadeUp 0.8s 0.1s ease both; }
        .hero-links { animation: fadeUp 0.8s 0.2s ease both; }
        .section { animation: fadeUp 0.8s 0.3s ease both; }

        .avatar-wrap {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
        }
        .avatar-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.15);
          animation: pulse-ring 2.5s ease-out infinite;
        }
        .avatar-ring2 {
          position: absolute;
          inset: -14px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
          animation: pulse-ring 2.5s 0.8s ease-out infinite;
        }
        .avatar-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 1.75rem;
          font-weight: 800;
          color: #080808;
          position: relative;
          z-index: 1;
        }
        .spinner {
          position: absolute;
          inset: -20px;
          border-radius: 50%;
          border: 1px dashed rgba(255,255,255,0.1);
          animation: spin-slow 12s linear infinite;
          z-index: 0;
        }

        .pill-btn {
          display: inline-flex;
          align-items: center;
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
        }
        .pill-btn:hover { border-color: rgba(255,255,255,0.2); color: var(--text); }
        .pill-btn.primary {
          background: #fff;
          color: #080808;
          border-color: #fff;
          font-weight: 600;
        }
        .pill-btn.primary:hover { background: #e0e0e0; border-color: #e0e0e0; }

        .section-label {
          font-family: 'Syne', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.5rem;
        }
        .section-label::before {
          content: '';
          display: block;
          width: 2rem;
          height: 1px;
          background: var(--border);
        }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.5rem;
          transition: border-color 0.2s, transform 0.2s;
        }
        .card:hover {
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-2px);
        }

        .proj-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 0.9rem;
          color: #fff;
          margin-bottom: 1rem;
        }
        .badge {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 999px;
        }
        .badge.live { background: rgba(255,255,255,0.08); color: #a3e7a3; }
        .badge.archived { background: rgba(255,255,255,0.04); color: var(--muted); }

        .tag {
          font-size: 0.7rem;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          color: var(--muted);
          border: 1px solid var(--border);
        }

        .contact-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 3rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .contact-box::before {
          content: '';
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%);
          pointer-events: none;
        }

        footer {
          margin-top: 8rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
          text-align: center;
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          color: var(--muted);
          font-family: 'Syne', sans-serif;
        }

        h1 { font-family: 'Syne', sans-serif; font-weight: 800; }
        h2 { font-family: 'Syne', sans-serif; }
        h3 { font-family: 'Syne', sans-serif; font-weight: 700; }
      `}</style>

      <div className="grain" />

      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '5rem 1.5rem 2rem' }}>

        {/* hero */}
        <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
          <div className="avatar-wrap">
            <div className="spinner" />
            <div className="avatar-ring" />
            <div className="avatar-ring2" />
            <div className="avatar-circle">Z</div>
          </div>

          <h1 className="hero" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1.05, marginBottom: '0.5rem' }}>
            Zorigt
          </h1>
          <p className="hero-sub" style={{ color: '#666', fontSize: '1.05rem', marginBottom: '2rem', fontWeight: 300 }}>
            Web Developer
          </p>

          <div className="hero-links" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#projects" className="pill-btn">Work</a>
            <a href="#about" className="pill-btn">About</a>
            <Link href="/DataJson" className="pill-btn primary">Directory →</Link>
          </div>
        </div>

        {/* about */}
        <section id="about" className="section" style={{ marginBottom: '5rem' }}>
          <p className="section-label">01. About</p>
          <div className="card">
            <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#aaa', fontWeight: 300 }}>
              I build modern web experiences with clean code and thoughtful design.
              Passionate about creating intuitive interfaces that users love.
            </p>
          </div>
        </section>

        {/* projects */}
        <section id="projects" className="section" style={{ marginBottom: '5rem' }}>
          <p className="section-label">02. Projects</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div className="proj-icon">P1</div>
                <span className="badge live">Live</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#f0f0f0' }}>Portfolio System</h3>
              <p style={{ fontSize: '0.875rem', color: '#666', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                A cutting-edge web application built with modern technologies and focus on UX.
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span className="tag">React</span>
                <span className="tag">Next.js</span>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div className="proj-icon">P2</div>
                <span className="badge archived">Archived</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#f0f0f0' }}>Community Hub</h3>
              <p style={{ fontSize: '0.875rem', color: '#666', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                Urban-focused platform for connecting local communities and sharing resources.
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span className="tag">TypeScript</span>
                <span className="tag">MongoDB</span>
              </div>
            </div>
          </div>
        </section>

        {/* contact */}
        <section id="contact" className="section">
          <p className="section-label" style={{ justifyContent: 'center' }}>03. Get In Touch</p>
          <div className="contact-box">
            <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.05rem', fontWeight: 300 }}>
              Always open to new opportunities and interesting projects.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/contact" className="pill-btn primary" style={{ padding: '0.75rem 2rem' }}>
                Contact Me
              </Link>
              <Link href="/about" className="pill-btn" style={{ padding: '0.75rem 2rem' }}>
                Learn More
              </Link>
            </div>
          </div>
        </section>

        <footer>
          <p>© 2025 ZORIGT — BUILT WITH NEXT.JS & TAILWIND CSS</p>
        </footer>

      </div>
    </>
  );
}