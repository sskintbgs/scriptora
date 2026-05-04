import { useState, useEffect } from 'react';
import { Search, Flame, TrendingUp, Users, Eye, ThumbsUp, Code, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import ScriptCard from '../components/ScriptCard';
import { api } from '../api/db';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [scripts, setScripts] = useState([]);
  const [stats, setStats] = useState({});
  const [online, setOnline] = useState(0);

  useEffect(() => {
    api.getScripts().then(setScripts);
    api.getPublicStats().then(s => {
      setStats(s);
      setOnline(s.onlineUsers || 1);
    });

    const uid = user?.id || 'anon-' + Math.random().toString(36).slice(2);
    const beat = () => api.heartbeat(uid).then(n => { if (n) setOnline(n); });
    beat();
    const iv = setInterval(beat, 30000);
    return () => clearInterval(iv);
  }, [user]);

  const filteredScripts = scripts.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <section className="hero">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className="hero-title">
              Find the Best <span className="text-gradient">Roblox Scripts</span>
            </h1>
            <p className="hero-subtitle">
              Verified scripts for every game. Upload, share, and discover top-tier scripts trusted by thousands.
            </p>

            <div className="search-container">
              <Search className="search-icon" size={22} />
              <input
                type="text" className="search-input"
                placeholder="Search scripts, games, or authors..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="container">
        <motion.div className="stats-bar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <div className="stat-item">
            <div className="stat-value text-gradient">{stats.verifiedScripts || 0}</div>
            <div className="stat-label"><Code size={14} style={{ verticalAlign: 'text-bottom' }} /> Scripts</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--accent-color)' }}>{(stats.totalViews || 0).toLocaleString()}</div>
            <div className="stat-label"><Eye size={14} style={{ verticalAlign: 'text-bottom' }} /> Views</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.totalLikes || 0}</div>
            <div className="stat-label"><ThumbsUp size={14} style={{ verticalAlign: 'text-bottom' }} /> Likes</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{online}</div>
            <div className="stat-label"><span className="online-dot"></span>Online</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--secondary-color)' }}>{stats.totalUsers || 0}</div>
            <div className="stat-label"><Users size={14} style={{ verticalAlign: 'text-bottom' }} /> Users</div>
          </div>
        </motion.div>
      </section>

      <section className="container" style={{ marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <Flame className="text-primary" size={26} />
          <h2>Most Popular</h2>
        </div>
        <div className="grid-3">
          {[...filteredScripts].sort((a, b) => ((b.likes||0)*200 + (b.views||0) + ((b.ratings?.length||0)*50)) - ((a.likes||0)*200 + (a.views||0) + ((a.ratings?.length||0)*50))).slice(0, 6).map((script, index) => (
            <motion.div key={script.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}>
              <ScriptCard script={script} />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container" style={{ marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <TrendingUp className="text-secondary" size={26} />
          <h2>Recently Added</h2>
        </div>
        <div className="grid-3">
          {[...filteredScripts].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6).map((script, index) => (
            <motion.div key={`recent-${script.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 + index * 0.06 }}>
              <ScriptCard script={script} />
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Scriptora</p>
          <p style={{ marginTop: '4px', fontSize: '0.8rem' }}>
            <span className="online-dot"></span> {online} user{online !== 1 ? 's' : ''} online
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
