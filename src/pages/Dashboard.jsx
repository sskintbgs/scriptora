import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/db';
import { User, Code, Eye, Star, Trash2, ThumbsUp, Settings, Copy, Shield, BarChart3, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { copyToClipboard } from '../utils/clipboard';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [myScripts, setMyScripts] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user) {
      api.getScriptsByUser(user.id).then(setMyScripts);
      if (user.role === 'owner') {
        api.getStats().then(setStats);
      }
    }
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this script?')) return;
    await api.deleteScript(id, user);
    setMyScripts(prev => prev.filter(s => String(s.id) !== String(id)));
    toast.success('Script deleted');
  };

  if (!user) return <Navigate to="/login" />;

  const myTotalViews = myScripts.reduce((s, sc) => s + (sc.views || 0), 0);
  const myTotalLikes = myScripts.reduce((s, sc) => s + (sc.likes || 0), 0);
  const myTotalComments = myScripts.reduce((s, sc) => s + (sc.comments?.length || 0), 0);
  const myAllRatings = myScripts.flatMap(sc => sc.ratings || []);
  const myAvgRating = myAllRatings.length ? (myAllRatings.reduce((s, r) => s + r.rating, 0) / myAllRatings.length).toFixed(1) : '—';

  return (
    <div className="container" style={{ padding: '40px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem', fontWeight: 700, color: 'white', fontFamily: 'Outfit',
          boxShadow: '0 6px 24px rgba(99,102,241,0.3)', flexShrink: 0
        }}>
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ marginBottom: '4px', fontSize: '1.6rem' }}>Welcome, {user.username}</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge" style={{
              background: user.role === 'owner' ? 'rgba(239,68,68,0.2)' : user.role === 'admin' ? 'rgba(245,158,11,0.2)' : user.role === 'support' ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)',
              color: user.role === 'owner' ? 'var(--danger)' : user.role === 'admin' ? 'var(--warning)' : user.role === 'support' ? 'var(--success)' : 'var(--primary-color)',
              padding: '4px 10px'
            }}>
              <Shield size={10} style={{ marginRight: '3px' }} />
              {user.role.toUpperCase()}
            </span>
            <Link to={`/u/${user.username}`} style={{ fontSize: '0.82rem', color: 'var(--primary-color)' }}>View Public Profile</Link>
          </div>
        </div>
      </div>

      {/* My Stats */}
      <motion.div className="glass-card" style={{ marginBottom: '24px', padding: '20px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}><BarChart3 size={18} /> Your Stats</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Scripts', value: myScripts.length, color: 'var(--primary-color)' },
            { label: 'Views', value: myTotalViews.toLocaleString(), color: 'var(--accent-color)' },
            { label: 'Likes', value: myTotalLikes, color: 'var(--success)' },
            { label: 'Avg Rating', value: myAvgRating, color: 'var(--warning)' },
            { label: 'Comments', value: myTotalComments, color: 'var(--secondary-color)' },
            { label: 'Verified', value: myScripts.filter(s => s.verified).length, color: 'var(--success)' },
            { label: 'Pending', value: myScripts.filter(s => !s.verified).length, color: 'var(--warning)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-color-lighter)', borderRadius: '10px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color, fontFamily: 'Outfit' }}>{s.value}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Platform Stats (Owner ONLY) */}
      {stats && user?.role === 'owner' && (
        <motion.div className="glass-card" style={{ marginBottom: '24px', padding: '20px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}><Shield size={18} /> Platform Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Users', value: stats.totalUsers, color: 'var(--primary-color)' },
              { label: 'Scripts', value: stats.totalScripts, color: 'var(--accent-color)' },
              { label: 'Verified', value: stats.verifiedScripts, color: 'var(--success)' },
              { label: 'Pending', value: stats.pendingScripts, color: 'var(--warning)' },
              { label: 'Total Views', value: (stats.totalViews || 0).toLocaleString(), color: 'var(--secondary-color)' },
              { label: 'Total Likes', value: (stats.totalLikes || 0).toLocaleString(), color: 'var(--danger)' },
              { label: 'Online', value: stats.onlineUsers || 0, color: 'var(--success)' },
              { label: 'Visitors', value: (stats.totalVisitors || 0).toLocaleString(), color: 'var(--warning)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-color-lighter)', borderRadius: '10px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color, fontFamily: 'Outfit' }}>{s.value}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Account Settings */}
      <motion.div className="glass-card" style={{ marginBottom: '32px' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
          <Settings size={22} /> Account Settings
        </h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const newUser = fd.get('username')?.trim() || undefined;
          const newEmail = fd.get('email')?.trim() || undefined;
          const newPass = fd.get('password')?.trim() || undefined;
          if (!newUser && !newEmail && !newPass) return toast.error('No changes to save');
          try {
            const updated = await api.updateUserCreds(user.id, newUser, newEmail, newPass);
            updateUser(updated);
            toast.success('Account updated!');
            e.target.reset();
          } catch (err) { toast.error(err.message); }
        }} style={{ maxWidth: '400px' }}>
          <div className="input-group">
            <label className="input-label">User ID (read-only)</label>
            <input type="text" className="input-field" value={user.id} disabled style={{ opacity: 0.5 }} />
          </div>
          <div className="input-group">
            <label className="input-label">Change Username</label>
            <input type="text" name="username" className="input-field" placeholder={user.username} minLength={3} />
          </div>
          <div className="input-group">
            <label className="input-label">Change Email</label>
            <input type="email" name="email" className="input-field" placeholder={user.email || 'your@email.com'} />
          </div>
          <div className="input-group">
            <label className="input-label">New Password</label>
            <input type="password" name="password" className="input-field" placeholder="Leave blank to keep" minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>Save Changes</button>
        </form>
      </motion.div>

      {/* My Scripts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '1.2rem' }}>My Scripts ({myScripts.length})</h2>
        <Link to="/upload" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.88rem' }}>+ Upload Script</Link>
      </div>

      {myScripts.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Code size={40} className="text-muted" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px' }}>No scripts yet</h3>
          <p className="text-muted">Share your first script with the community!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {myScripts.map((script, index) => (
            <motion.div key={script.id} className="glass-card" style={{ padding: '16px' }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span className="script-game" style={{ fontSize: '0.68rem' }}>{script.game}</span>
                    <span className={`badge ${script.verified ? 'verified' : 'pending'}`} style={{ fontSize: '0.65rem' }}>
                      {script.verified ? 'Verified' : 'Pending'}
                    </span>
                    {script.key ? (
                      <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', fontSize: '0.65rem' }}>Key</span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', fontSize: '0.65rem' }}>Keyless</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '6px' }}>{script.title}</h3>
                  <div style={{ display: 'flex', gap: '14px', color: 'var(--text-muted)', fontSize: '0.78rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> {(script.views || 0).toLocaleString()}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={12} /> {script.likes || 0}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={12} /> {script.ratings?.length || 0} ratings</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={12} /> {script.comments?.length || 0}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <Link to={`/script/${script.id}`} className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: '0.82rem' }}>View</Link>
                  <button className="btn btn-secondary" onClick={async () => {
                    const ok = await copyToClipboard(`${window.location.origin}/script/${script.id}`);
                    if (ok) toast.success('URL copied!'); else toast.error('Copy failed');
                  }} title="Copy URL" style={{ padding: '7px 10px' }}>
                    <Copy size={14} />
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(script.id)} style={{ padding: '7px 10px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
