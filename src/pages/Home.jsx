import { useState, useEffect } from 'react';
import { Search, Flame, TrendingUp, Users, Eye, ThumbsUp, Code, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ScriptCard from '../components/ScriptCard';
import { api } from '../api/db';
import { useAuth } from '../context/AuthContext';

/* ─── Shared mobile-first CSS injected once ─── */
const SHARED_CSS = `
  :root {
    --s-bg0: #08090e;
    --s-bg1: #0f111a;
    --s-bg2: #161924;
    --s-bg3: #1e2233;
    --s-t1: #eaedf8;
    --s-t2: #9aa0bc;
    --s-t3: #525878;
    --s-border: rgba(255,255,255,0.06);
    --s-indigo: #818cf8;
    --s-cyan: #38bdf8;
    --s-green: #34d399;
    --s-red: #f87171;
    --s-amber: #fbbf24;
    --s-purple: #c084fc;
    --s-radius: 14px;
    --s-radius-sm: 9px;
  }
  *, *::before, *::after { box-sizing: border-box; }

  /* ── Section header ── */
  .s-section-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 24px;
  }
  .s-section-head h2 {
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--s-t1);
  }

  /* ── Glass card ── */
  .s-glass {
    background: var(--s-bg1);
    border: 1px solid var(--s-border);
    border-radius: var(--s-radius);
  }

  /* ── Pill button ── */
  .s-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 16px;
    border-radius: 99px;
    font-size: 0.82rem;
    font-weight: 600;
    border: 1px solid var(--s-border);
    background: var(--s-bg2);
    color: var(--s-t2);
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .s-pill:hover { border-color: rgba(255,255,255,0.12); color: var(--s-t1); }
  .s-pill-active {
    background: color-mix(in srgb, var(--s-indigo) 15%, var(--s-bg2));
    border-color: var(--s-indigo);
    color: var(--s-indigo);
  }

  /* ── Script grid ── */
  .s-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }
  @media (max-width: 620px) { .s-grid { grid-template-columns: 1fr; } }

  /* ── Stats bar ── */
  .s-stats-row {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 2px;
  }
  .s-stats-row::-webkit-scrollbar { display: none; }
  .s-stat {
    flex: 0 0 auto;
    background: var(--s-bg1);
    border: 1px solid var(--s-border);
    border-radius: var(--s-radius-sm);
    padding: 14px 18px;
    text-align: center;
    min-width: 90px;
  }
  .s-stat-val {
    font-size: 1.3rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }
  .s-stat-label {
    font-size: 0.65rem;
    color: var(--s-t3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
  }

  /* ── Search ── */
  .s-search-wrap { position: relative; }
  .s-search-wrap svg {
    position: absolute; left: 16px; top: 50%;
    transform: translateY(-50%); color: var(--s-t3); pointer-events: none;
  }
  .s-search-input {
    width: 100%;
    background: var(--s-bg2);
    border: 1px solid var(--s-border);
    border-radius: 99px;
    padding: 14px 18px 14px 44px;
    font: inherit; font-size: 0.95rem;
    color: var(--s-t1); outline: none;
    transition: border 0.2s;
  }
  .s-search-input::placeholder { color: var(--s-t3); }
  .s-search-input:focus { border-color: var(--s-indigo); }

  /* ── Badge ── */
  .s-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 0.7rem; font-weight: 600;
    padding: 3px 10px; border-radius: 99px;
  }

  /* ── Rank chip ── */
  .s-rank {
    width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.78rem; font-weight: 800; flex-shrink: 0;
  }
  .s-rank-1 { background: rgba(251,191,36,0.15); color: var(--s-amber); }
  .s-rank-2 { background: rgba(148,163,184,0.12); color: #94a3b8; }
  .s-rank-3 { background: rgba(192,132,252,0.12); color: var(--s-purple); }
  .s-rank-n { background: var(--s-bg3); color: var(--s-t3); }

  /* ── "See all" link ── */
  .s-see-all {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 0.82rem; font-weight: 600;
    color: var(--s-indigo); text-decoration: none;
    transition: gap 0.15s;
  }
  .s-see-all:hover { gap: 7px; }

  /* ── Online dot ── */
  .s-online-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--s-green); display: inline-block;
    box-shadow: 0 0 6px var(--s-green);
    animation: pulse-dot 2s infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* ── Responsive page padding ── */
  .s-page { padding: 0 0 60px; }
  .s-container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
  @media (max-width: 480px) { .s-container { padding: 0 14px; } }

  /* ── Hero ── */
  .s-hero {
    position: relative;
    padding: 80px 0 60px;
    overflow: hidden;
    text-align: center;
  }
  .s-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 70% 60% at 50% 0%, rgba(129,140,248,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .s-hero-title {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1.1;
    margin-bottom: 16px;
    color: var(--s-t1);
  }
  .s-hero-grad {
    background: linear-gradient(135deg, var(--s-indigo), var(--s-cyan));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .s-hero-sub {
    font-size: clamp(0.9rem, 2.5vw, 1.1rem);
    color: var(--s-t2);
    max-width: 520px;
    margin: 0 auto 32px;
    line-height: 1.65;
  }
  @media (max-width: 480px) {
    .s-hero { padding: 56px 0 44px; }
  }

  /* ── Discord banner ── */
  .s-discord {
    position: relative; overflow: hidden;
    background: linear-gradient(135deg, rgba(88,101,242,0.12), rgba(155,89,182,0.12));
    border: 1px solid rgba(88,101,242,0.25);
    border-radius: var(--s-radius);
    padding: 48px 32px;
    text-align: center;
  }
  .s-discord::before {
    content: '';
    position: absolute; top: -40%; left: -20%; width: 140%; height: 180%;
    background: radial-gradient(ellipse, rgba(88,101,242,0.07) 0%, transparent 65%);
    pointer-events: none;
  }
  @media (max-width: 480px) {
    .s-discord { padding: 32px 20px; }
    .s-discord h2 { font-size: 1.4rem !important; }
  }

  /* ── Footer ── */
  .s-footer {
    border-top: 1px solid var(--s-border);
    padding: 28px 20px;
    text-align: center;
    color: var(--s-t3);
    font-size: 0.82rem;
    display: flex; flex-direction: column; gap: 8px; align-items: center;
  }
  .s-footer-links { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; justify-content: center; }
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = SHARED_CSS;
  document.head.appendChild(el);
  cssInjected = true;
}

const Home = () => {
  injectCSS();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [scripts, setScripts] = useState([]);
  const [stats, setStats] = useState({});
  const [online, setOnline] = useState(0);

  useEffect(() => {
    api.getScripts().then(setScripts);
    api.getPublicStats().then(s => { setStats(s); setOnline(s.onlineUsers || 1); });
    const uid = user?.id || 'anon-' + Math.random().toString(36).slice(2);
    const beat = () => api.heartbeat(uid).then(n => { if (n) setOnline(n); });
    beat();
    const iv = setInterval(beat, 30000);
    return () => clearInterval(iv);
  }, [user]);

  const filtered = scripts.filter(s =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.game?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popular = [...filtered]
    .sort((a, b) => ((b.likes||0)*200 + (b.views||0) + ((b.ratings?.length||0)*50)) - ((a.likes||0)*200 + (a.views||0) + ((a.ratings?.length||0)*50)))
    .slice(0, 6);

  const recent = [...filtered]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  const statItems = [
    { label: 'Scripts', value: stats.verifiedScripts || 0, color: 'var(--s-indigo)', icon: <Code size={11} /> },
    { label: 'Views', value: (stats.totalViews || 0).toLocaleString(), color: 'var(--s-cyan)', icon: <Eye size={11} /> },
    { label: 'Likes', value: stats.totalLikes || 0, color: 'var(--s-green)', icon: <ThumbsUp size={11} /> },
    { label: 'Online', value: online, color: 'var(--s-green)', icon: <span className="s-online-dot" /> },
    { label: 'Users', value: stats.totalUsers || 0, color: 'var(--s-purple)', icon: <Users size={11} /> },
  ];

  return (
    <div className="s-page">
      {/* Hero */}
      <section className="s-hero">
        <div className="s-container">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className="s-hero-title">
              Find the Best<br /><span className="s-hero-grad">Roblox Scripts</span>
            </h1>
            <p className="s-hero-sub">
              Verified scripts for every game. Upload, share, and discover top-tier scripts trusted by thousands.
            </p>
            <div className="s-search-wrap" style={{ maxWidth: 560, margin: '0 auto' }}>
              <Search size={18} />
              <input className="s-search-input" type="text" placeholder="Search scripts, games, or authors..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <div className="s-container" style={{ marginBottom: 40 }}>
        <motion.div className="s-stats-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {statItems.map(s => (
            <div key={s.label} className="s-stat">
              <div className="s-stat-val" style={{ color: s.color }}>{s.value}</div>
              <div className="s-stat-label">{s.icon} {s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Most Popular */}
      <div className="s-container" style={{ marginBottom: 52 }}>
        <div className="s-section-head" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Flame size={22} style={{ color: 'var(--s-indigo)' }} />
            <h2>Most Popular</h2>
          </div>
          <a href="/trending" className="s-see-all">View all <ArrowRight size={14} /></a>
        </div>
        <div className="s-grid">
          {popular.map((script, i) => (
            <motion.div key={script.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.07, 0.5), ease: [0.16, 1, 0.3, 1] }}>
              <ScriptCard script={script} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recently Added */}
      <div className="s-container" style={{ marginBottom: 52 }}>
        <div className="s-section-head" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={22} style={{ color: 'var(--s-cyan)' }} />
            <h2>Recently Added</h2>
          </div>
          <a href="/scripts" className="s-see-all">Browse all <ArrowRight size={14} /></a>
        </div>
        <div className="s-grid">
          {recent.map((script, i) => (
            <motion.div key={`r-${script.id}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + Math.min(i * 0.07, 0.4), ease: [0.16, 1, 0.3, 1] }}>
              <ScriptCard script={script} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Discord CTA */}
      <div className="s-container" style={{ marginBottom: 52 }}>
        <motion.div className="s-discord" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 44, marginBottom: 12, lineHeight: 1 }}>💬</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 10, color: 'var(--s-t1)' }}>
              Join the <span className="s-hero-grad">Community</span>
            </h2>
            <p style={{ color: 'var(--s-t2)', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.65, fontSize: '0.95rem' }}>
              Connect with script developers, get early updates, request features, and share your work with thousands of members.
            </p>
            <a href="https://discord.gg/DhZwz3fzbD" target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem',
              background: 'linear-gradient(135deg, #5865F2, #9B59B6)',
              color: '#fff', textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(88,101,242,0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(88,101,242,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 24px rgba(88,101,242,0.35)'; }}
            >
              <svg width="18" height="14" viewBox="0 0 71 55" fill="white"><path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.3 37.3 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32 .3 45.2v.1a58.8 58.8 0 0017.9 9 .2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 010-.4 30 30 0 001.1-.9.2.2 0 01.2 0c11.5 5.3 24 5.3 35.4 0a.2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1 58.6 58.6 0 0018-9v-.1c1.4-15-2.3-28-9.8-39.6a.2.2 0 00-.1-.1zM23.7 37.1c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7zm22.9 0c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7z"/></svg>
              Join our Discord
            </a>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
              {[
                [<Users size={13} />, `${stats.totalUsers || 0}+ Members`],
                [<Shield size={13} />, '24/7 Support'],
                [<span className="s-online-dot" />, 'Active Community'],
              ].map(([icon, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--s-t3)' }}>
                  {icon} {label}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="s-container">
        <div className="s-footer">
          <span>© {new Date().getFullYear()} Scriptora — All rights reserved</span>
          <div className="s-footer-links">
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="s-online-dot" /> {online} user{online !== 1 ? 's' : ''} online
            </span>
            <a href="https://discord.gg/DhZwz3fzbD" target="_blank" rel="noopener noreferrer"
              style={{ color: '#5865F2', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              💬 Join Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
