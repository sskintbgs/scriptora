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

      {/* Discord Community Section */}
      <section className="container" style={{ marginBottom: '60px' }}>
        <motion.div
          className="glass-card discord-banner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{
            padding: '40px 32px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(88, 101, 242, 0.15), rgba(155, 89, 182, 0.15))',
            border: '1px solid rgba(88, 101, 242, 0.3)',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: '-50%', left: '-30%', width: '160%', height: '200%',
            background: 'radial-gradient(ellipse, rgba(88,101,242,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
              Join the <span className="text-gradient">Community</span>
            </h2>
            <p className="text-muted" style={{ maxWidth: '500px', margin: '0 auto 24px', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Connect with script developers, get early updates, request features, and share your work with thousands of community members.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="https://discord.gg/DhZwz3fzbD"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  padding: '12px 28px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #5865F2, #9B59B6)',
                  border: 'none',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(88, 101, 242, 0.3)',
                }}
              >
                <svg width="20" height="16" viewBox="0 0 71 55" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.3 37.3 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32 .3 45.2v.1a58.8 58.8 0 0017.9 9 .2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 010-.4 30 30 0 001.1-.9.2.2 0 01.2 0c11.5 5.3 24 5.3 35.4 0a.2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1 58.6 58.6 0 0018-9v-.1c1.4-15-2.3-28-9.8-39.6a.2.2 0 00-.1-.1zM23.7 37.1c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7zm22.9 0c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7z"/>
                </svg>
                Join our Discord
              </a>
            </div>
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
              <div className="text-muted" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} /> {stats.totalUsers || 0}+ Members
              </div>
              <div className="text-muted" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} /> 24/7 Support
              </div>
              <div className="text-muted" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="online-dot"></span> Active Community
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Scriptora</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>
              <span className="online-dot"></span> {online} user{online !== 1 ? 's' : ''} online
            </p>
            <a href="https://discord.gg/DhZwz3fzbD" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.8rem', color: '#5865F2', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              💬 Join Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
