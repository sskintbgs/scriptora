import { useState, useEffect } from 'react';
import { Flame, TrendingUp, Star, Eye, ThumbsUp, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import ScriptCard from '../components/ScriptCard';
import { api } from '../api/db';

const CSS = `
  .tr-page { padding: 0 0 70px; }
  .tr-container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
  @media (max-width: 480px) { .tr-container { padding: 0 14px; } }

  /* Hero */
  .tr-hero {
    position: relative; overflow: hidden;
    padding: 72px 0 52px; text-align: center;
  }
  .tr-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%,
      rgba(251,191,36,0.1) 0%, rgba(129,140,248,0.06) 40%, transparent 70%);
    pointer-events: none;
  }
  .tr-hero-icon {
    width: 72px; height: 72px; border-radius: 20px;
    background: linear-gradient(135deg, rgba(251,191,36,0.18), rgba(251,191,36,0.06));
    border: 1px solid rgba(251,191,36,0.25);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
    box-shadow: 0 0 40px rgba(251,191,36,0.12);
  }
  .tr-hero h1 {
    font-size: clamp(1.8rem, 5vw, 3rem);
    font-weight: 900; letter-spacing: -0.04em;
    color: #eaedf8; margin-bottom: 12px; line-height: 1.1;
  }
  .tr-hero-grad {
    background: linear-gradient(135deg, #fbbf24, #f87171);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .tr-hero p {
    font-size: clamp(0.9rem, 2.5vw, 1.05rem);
    color: #9aa0bc; max-width: 520px; margin: 0 auto;
    line-height: 1.65;
  }
  @media (max-width: 480px) { .tr-hero { padding: 52px 0 36px; } }

  /* Tab selector */
  .tr-tabs {
    display: flex; gap: 4px;
    background: #0f111a;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 4px;
    margin-bottom: 32px;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .tr-tabs::-webkit-scrollbar { display: none; }
  .tr-tab {
    flex: 1; min-width: 120px;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 10px 16px; border-radius: 9px;
    font: inherit; font-size: 0.85rem; font-weight: 600;
    color: #525878; border: none; cursor: pointer;
    transition: all 0.2s; white-space: nowrap;
    background: transparent;
  }
  .tr-tab-active {
    background: #1e2233;
    color: #eaedf8;
    box-shadow: 0 1px 8px rgba(0,0,0,0.3);
  }

  /* Section header */
  .tr-section-head {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 22px; flex-wrap: wrap;
  }
  .tr-section-head h2 {
    font-size: 1.3rem; font-weight: 800;
    letter-spacing: -0.02em; color: #eaedf8;
  }
  .tr-count-badge {
    font-size: 0.7rem; font-weight: 700;
    background: rgba(129,140,248,0.12);
    color: #818cf8; border: 1px solid rgba(129,140,248,0.2);
    padding: 2px 9px; border-radius: 99px;
  }

  /* Grid */
  .tr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }
  @media (max-width: 620px) { .tr-grid { grid-template-columns: 1fr; } }

  /* Ranked list (top 10) */
  .tr-ranked-list { display: flex; flex-direction: column; gap: 10px; }
  .tr-ranked-item {
    display: flex; align-items: center; gap: 14px;
    background: #0f111a; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 14px 16px;
    cursor: pointer; text-decoration: none; color: inherit;
    transition: all 0.18s;
  }
  .tr-ranked-item:hover { border-color: rgba(255,255,255,0.1); background: #161924; transform: translateX(3px); }

  .tr-rank-num {
    width: 32px; height: 32px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.82rem; font-weight: 900; flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  .tr-item-info { flex: 1; min-width: 0; }
  .tr-item-game {
    font-size: 0.68rem; font-weight: 600;
    color: #818cf8; text-transform: uppercase; letter-spacing: 0.04em;
    margin-bottom: 3px;
  }
  .tr-item-title {
    font-size: 0.95rem; font-weight: 700; color: #eaedf8;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 4px;
  }
  .tr-item-meta {
    display: flex; gap: 12px; font-size: 0.72rem; color: #525878;
    flex-wrap: wrap;
  }
  .tr-item-meta span { display: flex; align-items: center; gap: 3px; }

  .tr-item-score {
    font-size: 1.05rem; font-weight: 800; flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  /* Star rating display */
  .tr-stars { display: flex; gap: 2px; }
  .tr-stars-avg {
    font-size: 0.82rem; font-weight: 700;
    color: #fbbf24; margin-left: 4px;
  }

  /* Section divider */
  .tr-divider {
    height: 1px; background: rgba(255,255,255,0.05);
    margin: 52px 0;
  }

  /* Loading shimmer */
  .tr-shimmer {
    background: linear-gradient(90deg, #0f111a 0%, #161924 50%, #0f111a 100%);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
    border-radius: 12px; height: 80px;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

let trCssInjected = false;

const TABS = [
  { id: 'viewed', label: 'Most Viewed', icon: <Eye size={14} /> },
  { id: 'rated', label: 'Highest Rated', icon: <Star size={14} /> },
  { id: 'liked', label: 'Most Liked', icon: <ThumbsUp size={14} /> },
];

const getRankStyle = (i) => {
  if (i === 0) return { background: 'rgba(251,191,36,0.15)', color: '#fbbf24' };
  if (i === 1) return { background: 'rgba(148,163,184,0.12)', color: '#94a3b8' };
  if (i === 2) return { background: 'rgba(192,132,252,0.12)', color: '#c084fc' };
  return { background: 'rgba(30,34,51,1)', color: '#525878' };
};

const getAvgRating = s =>
  s.ratings?.length ? s.ratings.reduce((acc, r) => acc + r.rating, 0) / s.ratings.length : 0;

const RankedItem = ({ script, index, metric }) => {
  const rankStyle = getRankStyle(index);
  const avg = getAvgRating(script);

  return (
    <motion.a
      href={`/script/${script.id}`}
      className="tr-ranked-item"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5), ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="tr-rank-num" style={rankStyle}>
        {index < 3 ? ['🥇','🥈','🥉'][index] : `#${index + 1}`}
      </div>

      <div className="tr-item-info">
        <div className="tr-item-game">{script.game}</div>
        <div className="tr-item-title">{script.title}</div>
        <div className="tr-item-meta">
          <span><Eye size={11} /> {(script.views || 0).toLocaleString()}</span>
          <span><ThumbsUp size={11} /> {script.likes || 0}</span>
          {avg > 0 && (
            <span><Star size={11} fill="currentColor" style={{ color: '#fbbf24' }} />
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>{avg.toFixed(1)}</span>
            </span>
          )}
        </div>
      </div>

      <div className="tr-item-score" style={{ color: rankStyle.color }}>
        {metric === 'viewed' && (script.views || 0).toLocaleString()}
        {metric === 'rated' && (avg > 0 ? avg.toFixed(1) : '—')}
        {metric === 'liked' && (script.likes || 0)}
        <div style={{ fontSize: '0.6rem', color: '#525878', fontWeight: 500, textAlign: 'right', marginTop: 2 }}>
          {metric === 'viewed' ? 'views' : metric === 'rated' ? '/ 5' : 'likes'}
        </div>
      </div>
    </motion.a>
  );
};

const Trending = () => {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('viewed');

  useEffect(() => {
    api.getScripts().then(data => { setScripts(data); setLoading(false); });
  }, []);

  // Inject CSS once
  if (!trCssInjected && typeof document !== 'undefined') {
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
    trCssInjected = true;
  }

  const byViews = [...scripts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
  const byRating = [...scripts].sort((a, b) => getAvgRating(b) - getAvgRating(a)).slice(0, 10);
  const byLikes = [...scripts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 10);

  const tabData = { viewed: byViews, rated: byRating, liked: byLikes };
  const current = tabData[activeTab];

  const topSix = [...scripts]
    .sort((a, b) => ((b.likes||0)*2 + (b.views||0)/100 + getAvgRating(b)*50) - ((a.likes||0)*2 + (a.views||0)/100 + getAvgRating(a)*50))
    .slice(0, 6);

  return (
    <div className="tr-page">
      {/* Hero */}
      <section className="tr-hero">
        <div className="tr-container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
            <div className="tr-hero-icon">
              <Flame size={32} style={{ color: '#fbbf24' }} />
            </div>
            <h1><span className="tr-hero-grad">Trending</span> Scripts</h1>
            <p>The most popular, highest-viewed, and top-rated scripts dominating the platform right now.</p>
          </motion.div>
        </div>
      </section>

      {/* Ranked section */}
      <div className="tr-container" style={{ marginBottom: 52 }}>
        {/* Tabs */}
        <div className="tr-tabs">
          {TABS.map(tab => (
            <button key={tab.id} className={`tr-tab ${activeTab === tab.id ? 'tr-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="tr-section-head">
          {activeTab === 'viewed' && <><TrendingUp size={20} style={{ color: '#818cf8' }} /><h2>Top 10 Most Viewed</h2></>}
          {activeTab === 'rated' && <><Star size={20} style={{ color: '#fbbf24' }} /><h2>Top 10 Highest Rated</h2></>}
          {activeTab === 'liked' && <><ThumbsUp size={20} style={{ color: '#34d399' }} /><h2>Top 10 Most Liked</h2></>}
          <span className="tr-count-badge">{current.length} scripts</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="tr-shimmer" style={{ opacity: 1 - i * 0.15 }} />)}
          </div>
        ) : (
          <div className="tr-ranked-list">
            {current.map((script, i) => (
              <RankedItem key={script.id} script={script} index={i} metric={activeTab} />
            ))}
          </div>
        )}
      </div>

      <div className="tr-container"><div className="tr-divider" /></div>

      {/* Top picks grid */}
      <div className="tr-container">
        <div className="tr-section-head">
          <Trophy size={20} style={{ color: '#fbbf24' }} />
          <h2>Top Picks</h2>
          <span className="tr-count-badge">Editor's choice</span>
        </div>
        <div className="tr-grid">
          {topSix.map((script, i) => (
            <motion.div key={`tp-${script.id}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + Math.min(i * 0.07, 0.4), ease: [0.16, 1, 0.3, 1] }}>
              <ScriptCard script={script} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Trending;
