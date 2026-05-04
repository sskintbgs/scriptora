import { useState, useEffect } from 'react';
import { api } from '../api/db';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Activity, AlertTriangle, Ban, CheckCircle, Key, Search, Shield, Eye, ThumbsUp, Globe, Star, MessageSquare, TrendingUp, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Owner = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [userFilter, setUserFilter] = useState('all');

  useEffect(() => {
    if (user?.role === 'owner' || user?.role === 'admin') refreshData();
  }, [user]);

  const refreshData = async () => {
    const [fetchedUsers, fetchedLogs, fetchedStats] = await Promise.all([
      api.getAllUsers(), api.getLogs(), api.getStats()
    ]);
    setUsers(fetchedUsers);
    setLogs(fetchedLogs);
    setStats(fetchedStats);
  };

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <ShieldAlert size={64} className="text-danger" style={{ margin: '0 auto 24px' }} />
        <h1>Access Denied</h1>
        <p className="text-muted">Insufficient permissions.</p>
      </div>
    );
  }

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.updateUserRole(id, newRole, user.username);
      toast.success(`Role updated to ${newRole}`);
      refreshData();
    } catch (err) { toast.error(err.message); }
  };

  const handleWarn = async (id) => {
    if (!window.confirm('Warn this user?')) return;
    try { await api.warnUser(id, user.username); toast.success('User warned'); refreshData(); }
    catch (err) { toast.error(err.message); }
  };

  const handleBan = async (id) => {
    const target = users.find(u => u.id === id);
    const action = target?.banned ? 'unban' : 'ban';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this user?`)) return;
    try { await api.banUser(id, user.username); toast.success(`User ${action}ned`); refreshData(); }
    catch (err) { toast.error(err.message); }
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt("New password (min 6 chars):");
    if (!newPassword) return;
    try { await api.adminResetPassword(user.id, id, newPassword); toast.success("Password reset"); refreshData(); }
    catch (err) { toast.error(err.message); }
  };

  const isOwner = user?.role === 'owner';
  
  const filteredUsers = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      String(u.id).includes(searchQuery) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = userFilter === 'all' ? true : 
      userFilter === 'admin' ? u.role === 'admin' :
      userFilter === 'banned' ? u.banned :
      userFilter === 'warned' ? (u.warnings || 0) > 0 : true;
    return matchSearch && matchFilter;
  });

  const filteredLogs = logs.filter(log => {
    const matchFilter = logFilter === 'all' ? true : log.action.toLowerCase().includes(logFilter.toLowerCase());
    const matchSearch = !logSearch || 
      log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.actor || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(logSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const adminCount = users.filter(u => u.role === 'admin').length;
  const bannedCount = users.filter(u => u.banned).length;
  const warnedCount = users.filter(u => (u.warnings || 0) > 0).length;

  return (
    <div className="container" style={{ padding: '40px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '2rem', marginBottom: '4px' }}>
            <ShieldAlert className={isOwner ? "text-danger" : "text-warning"} size={30} />
            {isOwner ? "Owner Panel" : "Admin Panel"}
          </h1>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>Manage users, logs, and platform stats.</p>
        </div>
        <button className="btn btn-secondary" onClick={refreshData} style={{ padding: '8px 14px' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '28px' }}>
        {[
          { label: 'Users', value: stats.totalUsers || 0, icon: <Users size={18} />, color: 'var(--primary-color)' },
          { label: 'Scripts', value: stats.totalScripts || 0, icon: <Shield size={18} />, color: 'var(--secondary-color)' },
          { label: 'Verified', value: stats.verifiedScripts || 0, icon: <CheckCircle size={18} />, color: 'var(--success)' },
          { label: 'Pending', value: stats.pendingScripts || 0, icon: <AlertTriangle size={18} />, color: 'var(--warning)' },
          { label: 'Views', value: (stats.totalViews || 0).toLocaleString(), icon: <Eye size={18} />, color: 'var(--accent-color)' },
          { label: 'Likes', value: stats.totalLikes || 0, icon: <ThumbsUp size={18} />, color: 'var(--success)' },
          { label: 'Online', value: stats.onlineUsers || 0, icon: <Globe size={18} />, color: 'var(--success)' },
          { label: 'Visitors', value: stats.totalVisitors || 0, icon: <TrendingUp size={18} />, color: 'var(--accent-color)' },
          { label: 'Admins', value: adminCount, icon: <Shield size={18} />, color: 'var(--primary-color)' },
          { label: 'Banned', value: bannedCount, icon: <Ban size={18} />, color: 'var(--danger)' },
        ].map((stat, i) => (
          <motion.div key={i} className="glass-card" style={{ padding: '14px', textAlign: 'center' }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <div style={{ color: stat.color, marginBottom: '4px' }}>{stat.icon}</div>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, fontFamily: 'Outfit' }}>{stat.value}</p>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase' }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {[
          { key: 'overview', label: 'Overview', icon: <TrendingUp size={14} /> },
          { key: 'users', label: `Users (${users.length})`, icon: <Users size={14} /> },
          { key: 'logs', label: `Logs (${logs.length})`, icon: <Activity size={14} /> },
        ].map(t => (
          <button key={t.key} className={`btn ${activeSection === t.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSection(t.key)} style={{ padding: '7px 14px', fontSize: '0.82rem' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeSection === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1rem' }}>Recent Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                {logs.slice(0, 15).map(log => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>{log.action}</span>
                    <span className="text-muted">{log.actor}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1rem' }}>Platform Health</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Database Status</span>
                  <span className="badge verified" style={{ fontSize: '0.72rem' }}>● Online</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Active Users</span>
                  <span style={{ fontWeight: 600 }}>{stats.onlineUsers || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Total Visitors</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-color)' }}>{stats.totalVisitors || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Warned Users</span>
                  <span style={{ fontWeight: 600, color: warnedCount > 0 ? 'var(--warning)' : undefined }}>{warnedCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Banned Users</span>
                  <span style={{ fontWeight: 600, color: bannedCount > 0 ? 'var(--danger)' : undefined }}>{bannedCount}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Users */}
      {activeSection === 'users' && (
        <motion.div className="admin-table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color-lighter)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['all', 'admin', 'banned', 'warned'].map(f => (
                <button key={f} className={`btn ${userFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setUserFilter(f)} style={{ padding: '4px 10px', fontSize: '0.78rem', textTransform: 'capitalize' }}>{f}</button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="input-field" placeholder="Search users..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '30px', maxWidth: '220px', margin: 0, fontSize: '0.82rem' }} />
            </div>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Warns</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{u.id}</td>
                  <td style={{ fontWeight: 500, fontSize: '0.88rem' }}>{u.username}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.email || '—'}</td>
                  <td>
                    <span className={`badge ${u.role === 'owner' ? 'pending' : u.role === 'admin' ? 'verified' : ''}`} style={{ fontSize: '0.68rem' }}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ color: u.warnings > 0 ? 'var(--warning)' : 'var(--text-muted)', fontSize: '0.85rem' }}>{u.warnings || 0}</td>
                  <td>
                    {u.banned ? (
                      <span className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '0.68rem' }}>Banned</span>
                    ) : (
                      <span className="badge verified" style={{ fontSize: '0.68rem' }}>Active</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {(isOwner || u.role !== 'owner') && (
                        <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleResetPassword(u.id)} title="Reset Password"><Key size={12} /></button>
                      )}
                      {isOwner && u.role !== 'owner' && (
                        <>
                          <select className="input-field" value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                            style={{ margin: 0, padding: '3px 6px', fontSize: '0.7rem', width: 'auto', borderRadius: '6px' }}>
                            <option value="user">User</option>
                            <option value="support">Support</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleWarn(u.id)} title="Warn"><AlertTriangle size={12} className="text-warning" /></button>
                          <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleBan(u.id)} title={u.banned ? "Unban" : "Ban"}>
                            {u.banned ? <CheckCircle size={12} /> : <Ban size={12} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Logs */}
      {activeSection === 'logs' && (
        <motion.div className="admin-table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color-lighter)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {['all', 'login', 'script', 'user', 'role', 'banned', 'password', 'comment', 'registration'].map(f => (
                <button key={f} className={`btn ${logFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setLogFilter(f)} style={{ padding: '3px 8px', fontSize: '0.72rem', textTransform: 'capitalize' }}>{f}</button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="input-field" placeholder="Search logs..." value={logSearch}
                onChange={e => setLogSearch(e.target.value)} style={{ paddingLeft: '30px', maxWidth: '200px', margin: 0, fontSize: '0.82rem' }} />
            </div>
          </div>
          <table className="admin-table">
            <thead>
              <tr><th>Date</th><th>Action</th><th>Actor</th><th>Details</th></tr>
            </thead>
            <tbody>
              {filteredLogs.slice(0, 150).map(log => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{new Date(log.date).toLocaleString()}</td>
                  <td style={{ fontWeight: 500, color: 'var(--primary-color)', fontSize: '0.85rem' }}>{log.action}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{log.actor || '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{log.details}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px' }} className="text-muted">No logs found.</td></tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
};

export default Owner;
