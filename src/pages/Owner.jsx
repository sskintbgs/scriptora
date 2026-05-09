import { useState, useEffect } from 'react';
import { api } from '../api/db';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Activity, AlertTriangle, Ban, CheckCircle, Key, Search, Shield, Eye, ThumbsUp, Globe, Star, MessageSquare, TrendingUp, RefreshCw, Clock, Layers, Fingerprint, Trash2, Copy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Owner = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [userSearch, setUserSearch] = useState('');
  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [userFilter, setUserFilter] = useState('all');
  const [keys, setKeys] = useState([]);
  const [keySearch, setKeySearch] = useState('');
  const [keyFilter, setKeyFilter] = useState('all'); 
  const [keyAppFilter, setKeyAppFilter] = useState('all'); // New: Filter keys by app
  const [apps, setApps] = useState([]);
  const [appLogs, setAppLogs] = useState([]); 
  const [appSearch, setAppSearch] = useState('');
  const [userAppFilter, setUserAppFilter] = useState('all'); // New: Filter users by app usage
  const [showSecret, setShowSecret] = useState({}); // { appId: true/false }

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
    
    if (user?.role === 'owner') {
      try {
        const [fetchedKeys, fetchedApps, fetchedKeyLogs] = await Promise.all([
          api.getKeys(user.id),
          api.getApps(user.id),
          fetch('/api/keylogs', { headers: { 'x-user-id': user.id } }).then(r => r.json())
        ]);
        setKeys(fetchedKeys);
        setApps(fetchedApps);
        setAppLogs(fetchedKeyLogs || []);
      } catch (err) { console.error(err); }
    }
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
    const reason = window.prompt('Enter warning reason:');
    if (reason === null) return;
    try { await api.warnUser(id, user.username, reason); toast.success('User warned'); refreshData(); }
    catch (err) { toast.error(err.message); }
  };

  const handleBan = async (id) => {
    const target = users.find(u => u.id === id);
    const action = target?.banned ? 'unban' : 'ban';
    
    let reason = '';
    if (!target?.banned) {
      reason = window.prompt('Enter ban reason (optional):');
      if (reason === null) return;
    } else {
      if (!window.confirm(`Unban this user?`)) return;
    }
    
    try { 
      await api.banUser(id, user.username, reason); 
      
      // If banning (not unbanning), ask to delete all posts
      if (!target?.banned) {
        if (window.confirm(`User "${target?.username}" has been banned. Do you also want to DELETE ALL their scripts?`)) {
          const deletedCount = await api.deleteAllUserScripts(user.id, id);
          toast.success(`Deleted ${deletedCount} scripts`);
        }
      }
      
      toast.success(`User ${action}ned`); 
      refreshData(); 
    }
    catch (err) { toast.error(err.message); }
  };

  const handleTimeout = async (id) => {
    const days = window.prompt('Enter timeout duration in days (e.g. 1):', '1');
    if (!days || isNaN(days)) return;
    const reason = window.prompt('Enter timeout reason:');
    if (reason === null) return;
    try { 
      await api.timeoutUser(id, user.username, reason, parseFloat(days)); 
      toast.success(`User timed out for ${days} days`); 
      refreshData(); 
    }
    catch (err) { toast.error(err.message); }
  };

  const handleCreateKey = async () => {
    if (apps.length === 0) return toast.error("Create an App first!");
    
    const appNames = apps.map((a, i) => `${i + 1}. ${a.name} (${a.id})`).join('\n');
    const appChoice = prompt(`Select an App (number):\n${appNames}`, "1");
    if (!appChoice) return;
    
    const selectedApp = apps[parseInt(appChoice) - 1];
    if (!selectedApp) return toast.error("Invalid choice");

    const count = prompt("How many keys to generate?", "1");
    if (!count || isNaN(count)) return;

    const durations = ["30 mins", "1 hour", "1 day", "7 days", "30 days", "lifetime"];
    const durationChoice = prompt(`Select Duration (number):\n${durations.map((d, i) => `${i + 1}. ${d}`).join('\n')}`, "3");
    const duration = durations[parseInt(durationChoice) - 1] || "1 day";

    const levels = ["Free", "Standard", "Premium", "VIP", "Owner"];
    const levelChoice = prompt(`Select Level (number):\n${levels.map((l, i) => `${i + 1}. ${l}`).join('\n')}`, "2");
    const level = (levels[parseInt(levelChoice) - 1] || "Standard").toLowerCase();

    const isOneTime = confirm("Is this a one-time use key? (Revokes after first validation)");

    const note = prompt("Enter a note for these keys (optional):");
    
    try {
      await api.createKey(user.id, selectedApp.id, note || '', null, duration, parseInt(count), level, isOneTime);
      toast.success(`Generated ${count} ${level} keys successfully!`);
      refreshData();
    } catch (err) { toast.error(err.message); }
  };

  const handleCreateApp = async () => {
    const name = prompt("Enter App Name:");
    if (!name) return;
    try {
      await api.createApp(user.id, name);
      toast.success("App created!");
      refreshData();
    } catch (err) { toast.error(err.message); }
  };

  const handleToggleAppStatus = async (appId) => {
    try {
      const res = await fetch('/api/apps/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: user.id, appId })
      });
      if (!res.ok) throw new Error("Failed to toggle app");
      toast.success("App status updated");
      refreshData();
    } catch (err) { toast.error(err.message); }
  };

  const handleUpdateAppVersion = async (appId, currentVersion, currentUrl) => {
    const version = prompt("Enter new version (e.g. 1.0.1):", currentVersion);
    if (!version) return;
    const downloadUrl = prompt("Enter new download URL:", currentUrl);
    if (downloadUrl === null) return;
    
    try {
      const res = await fetch('/api/apps/update-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: user.id, appId, version, downloadUrl })
      });
      if (!res.ok) throw new Error("Failed to update version");
      toast.success("App version updated!");
      refreshData();
    } catch (err) { toast.error(err.message); }
  };

  const handleRotateSecret = async (appId) => {
    if (!confirm("Are you sure? All existing scripts for this app will need the NEW secret to work!")) return;
    try {
      await api.rotateAppSecret(user.id, appId);
      toast.success("Secret rotated!");
      refreshData();
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteApp = async (appId, appName) => {
    if (!confirm(`Permanently delete App "${appName}"? THIS WILL DELETE ALL KEYS FOR THIS APP.`)) return;
    try {
      await api.deleteApp(user.id, appId);
      toast.success("App deleted");
      refreshData();
    } catch (err) { toast.error(err.message); }
  };

  const handleResetHWID = async (key) => {
    if (!confirm(`Reset HWID for key ${key}?`)) return;
    try {
      await api.resetKeyHWID(user.id, key);
      toast.success("HWID reset successfully");
      refreshData();
    } catch (err) { toast.error(err.message); }
  };

  const handleToggleKey = async (key, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'revoked' : 'active';
    try {
      await api.revokeKey(user.id, key, newStatus);
      toast.success(`Key ${newStatus === 'active' ? 'activated' : 'revoked'}`);
      refreshData();
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteKey = async (key) => {
    if (!confirm(`Permanently delete key ${key}?`)) return;
    try {
      await api.deleteKey(user.id, key);
      toast.success("Key deleted");
      refreshData();
    } catch (err) { toast.error(err.message); }
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt("New password (min 6 chars):");
    if (!newPassword) return;
    try { await api.adminResetPassword(user.id, id, newPassword); toast.success("Password reset"); refreshData(); }
    catch (err) { toast.error(err.message); }
  };

  const isOwner = user?.role === 'owner';
  
  const filteredUsers = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
      String(u.id).includes(userSearch) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase());
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

  const filteredApps = apps.filter(a => 
    a.name.toLowerCase().includes(appSearch.toLowerCase()) ||
    a.id.toLowerCase().includes(appSearch.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const bannedCount = users.filter(u => u.banned).length;
  const warnedCount = users.filter(u => (u.warnings || 0) > 0).length;

  const filteredKeysList = keys.filter(k => {
    const matchesSearch = k.key.toLowerCase().includes(keySearch.toLowerCase());
    const matchesStatus = keyFilter === 'all' || (keyFilter === 'used' ? k.lastUsed : !k.lastUsed);
    const matchesApp = keyAppFilter === 'all' || k.appId === keyAppFilter;
    return matchesSearch && matchesStatus && matchesApp;
  });

  const filteredUsersList = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) || u.id.includes(userSearch);
    const matchesRole = userFilter === 'all' || 
      (userFilter === 'admin' ? u.role === 'admin' :
       userFilter === 'banned' ? u.banned :
       userFilter === 'warned' ? (u.warnings || 0) > 0 : u.role === userFilter);
    const matchesApp = userAppFilter === 'all' || keys.some(k => k.appId === userAppFilter && k.hwid === u.hwid);
    return matchesSearch && matchesRole && matchesApp;
  });

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
          { key: 'logs', label: `Activity Logs`, icon: <Activity size={14} /> },
          { key: 'apps', label: `Apps (${apps.length})`, icon: <Layers size={14} /> },
          { key: 'keys', label: `Keys (${keys.length})`, icon: <Key size={14} /> },
        ].filter(t => (t.key !== 'keys' && t.key !== 'apps' && t.key !== 'logs' || isOwner)).map(t => (
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
            <div className="section-header" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1rem' }}>User Management</h2>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" className="input-field" placeholder="Search users..." value={userSearch}
                    onChange={e => setUserSearch(e.target.value)} style={{ paddingLeft: '30px', maxWidth: '200px', margin: 0, fontSize: '0.82rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select className="input-field" value={userAppFilter} onChange={e => setUserAppFilter(e.target.value)} style={{ margin: 0, fontSize: '0.82rem', padding: '4px 12px' }}>
                  <option value="all">All Apps</option>
                  {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select className="input-field" value={userFilter} onChange={e => setUserFilter(e.target.value)} style={{ margin: 0, fontSize: '0.82rem', padding: '4px 12px' }}>
                  <option value="all">All Roles</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Warns</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsersList.map(u => (
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
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleTimeout(u.id)} title="Timeout"><Clock size={12} className="text-warning" /></button>
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

      {/* Apps */}
      {activeSection === 'apps' && isOwner && (
        <motion.div className="admin-table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color-lighter)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleCreateApp} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              + Create New App
            </button>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="input-field" placeholder="Search apps..." value={appSearch}
                onChange={e => setAppSearch(e.target.value)} style={{ paddingLeft: '30px', maxWidth: '200px', margin: 0, fontSize: '0.82rem' }} />
            </div>
          </div>
          <table className="admin-table">
            <thead>
              <tr><th>App Name</th><th>App ID</th><th>Shared Secret</th><th>Keys</th><th>Created</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
            </thead>
            <tbody>
              {filteredApps.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary-color)' }}>{a.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: 'var(--bg-color-dark)', padding: '2px 6px', borderRadius: '4px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {showSecret[a.id] ? a.secret : '••••••••••••••••'}
                      </span>
                      <button className="btn btn-secondary" style={{ padding: '2px 6px' }} onClick={() => setShowSecret(prev => ({ ...prev, [a.id]: !prev[a.id] }))}>
                        {showSecret[a.id] ? <Eye size={10} /> : <Eye size={10} style={{ opacity: 0.5 }} />}
                      </button>
                      {showSecret[a.id] && (
                        <button className="btn btn-secondary" style={{ padding: '2px 6px' }} onClick={() => { navigator.clipboard.writeText(a.secret); toast.success("Copied!"); }}>
                          <Copy size={10} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{keys.filter(k => k.appId === a.id).length}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button className="btn" onClick={() => handleToggleAppStatus(a.id)} title={a.status === 'disabled' ? "Enable App" : "Disable App"}>
                        {a.status === 'disabled' ? <CheckCircle size={14} className="text-success" /> : <Ban size={14} className="text-warning" />}
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleUpdateAppVersion(a.id, a.version, a.downloadUrl)} title="Update Version">
                        <Zap size={12} className="text-warning" />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleRotateSecret(a.id)} title="Rotate Secret">
                        <Fingerprint size={12} className="text-warning" />
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDeleteApp(a.id, a.name)} title="Delete App">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredApps.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px' }} className="text-muted">No apps found.</td></tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Keys */}
      {activeSection === 'keys' && isOwner && (
        <motion.div className="admin-table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color-lighter)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleCreateKey} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                + Bulk Generate Keys
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select className="input-field" value={keyAppFilter} onChange={e => setKeyAppFilter(e.target.value)} style={{ margin: 0, fontSize: '0.82rem', padding: '4px 12px' }}>
                  <option value="all">All Apps</option>
                  {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select className="input-field" value={keyFilter} onChange={e => setKeyFilter(e.target.value)} style={{ margin: 0, fontSize: '0.82rem', padding: '4px 12px' }}>
                  <option value="all">All Status</option>
                  <option value="used">Used</option>
                  <option value="unused">Unused</option>
                </select>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="input-field" placeholder="Search keys..." value={keySearch}
                onChange={e => setKeySearch(e.target.value)} style={{ paddingLeft: '30px', maxWidth: '200px', margin: 0, fontSize: '0.82rem' }} />
            </div>
          </div>
          <table className="admin-table">
            <thead>
              <tr><th>Key</th><th>App</th><th>Level</th><th>Type</th><th>Note</th><th>HWID</th><th>Status</th><th>Expires</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
            </thead>
            <tbody>
              {filteredKeysList.map(k => (
                <tr key={k._id || k.key}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--primary-color)' }}>{k.key}</td>
                  <td style={{ fontSize: '0.75rem', fontWeight: 600 }}>{apps.find(a => a.id === k.appId)?.name || k.appId}</td>
                  <td>
                    <span className={`badge ${k.level === 'premium' ? 'verified' : k.level === 'vip' ? 'pending' : ''}`} style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                      {k.level || 'standard'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>
                    {k.isOneTime ? <span className="text-warning" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Zap size={10} /> 1-Time</span> : <span className="text-muted">Standard</span>}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{k.note || '—'}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={k.hwid}>
                    {k.hwid ? k.hwid : <span className="text-muted italic">Not locked</span>}
                  </td>
                  <td>
                    <span className={`badge ${k.status === 'active' ? 'verified' : 'pending'}`} style={{ fontSize: '0.68rem' }}>
                      {k.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem' }}>{k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : 'Never'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleResetHWID(k.key)} title="Reset HWID">
                        <RefreshCw size={12} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleToggleKey(k.key, k.status)} title={k.status === 'active' ? "Revoke" : "Activate"}>
                        {k.status === 'active' ? <Ban size={12} className="text-danger" /> : <CheckCircle size={12} className="text-success" />}
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => { navigator.clipboard.writeText(k.key); toast.success("Key copied!"); }} title="Copy Key">
                        <Copy size={12} />
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDeleteKey(k.key)} title="Delete Key">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredKeysList.length === 0 && (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '32px' }} className="text-muted">No keys found.</td></tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}
      {activeSection === 'logs' && isOwner && (
        <motion.div className="admin-table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="section-header" style={{ padding: '16px' }}>
            <h2 style={{ margin: 0 }}>Security & Activity Logs</h2>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Monitor all validation attempts and flagged hardware IDs.</p>
          </div>
          <table className="admin-table">
            <thead>
              <tr><th>Timestamp</th><th>App ID</th><th>Key</th><th>IP Address</th><th>HWID</th><th>Status</th><th>Note</th></tr>
            </thead>
            <tbody>
              {appLogs.map((log, i) => (
                <tr key={i}>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ fontSize: '0.75rem' }}>{log.appId}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.key}</td>
                  <td style={{ fontSize: '0.75rem' }}>{log.ip}</td>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{log.hwid}</td>
                  <td>
                    <span className={`badge ${log.success ? 'verified' : 'banned'}`} style={{ fontSize: '0.65rem' }}>
                      {log.success ? 'Success' : 'Failed'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: log.success ? 'inherit' : 'var(--danger)' }}>{log.error || 'N/A'}</td>
                </tr>
              ))}
              {appLogs.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px' }} className="text-muted">No security logs found.</td></tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
};

export default Owner;
