import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/BotDashboard.css';

const PERMISSION_LABELS = {
  kick: 'Kick Members',
  ban: 'Ban Members',
  warn: 'Warn Members',
  mute: 'Mute Members',
  manage_tickets: 'Manage Tickets',
  config: 'Bot Config',
  reaction_roles: 'Reaction Roles',
};

const ALL_ROLES_DEFAULTS = [
  'Trial Support','Support','Moderator','Senior Moderator','Head Moderator',
  'Junior Operator','Operator','Head Operator','Admin',
];

export default function BotDashboard() {
  const { user } = useAuth(); // ✅ use AuthContext instead of localStorage
  const [config, setConfig] = useState(null);
  const [economy, setEconomy] = useState(null);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState('');

  const isAuthorized = user && (user.role === 'admin' || user.role === 'owner');

  useEffect(() => {
    if (!isAuthorized) return;
    fetchConfig();
    fetchEconomy();
    fetchStatus();
  }, [isAuthorized]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/bot/config');
      setConfig(await res.json());
    } catch { showToast('❌ Failed to load config'); }
  };

  const fetchEconomy = async () => {
    try {
      const res = await fetch('/api/bot/economy');
      setEconomy(await res.json());
    } catch {}
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/bot/status');
      setStatus(await res.json());
    } catch {}
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error();
      showToast('✅ Config saved!');
    } catch { showToast('❌ Save failed.'); }
    setSaving(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const updateChannel  = (key, val) => setConfig(c => ({ ...c, channels: { ...c.channels, [key]: val } }));
  const updateStatVC   = (key, val) => setConfig(c => ({ ...c, stat_channels: { ...c.stat_channels, [key]: val } }));
  const updatePerm     = (perm, roles) => setConfig(c => ({ ...c, permissions: { ...c.permissions, [perm]: roles } }));
  const updateOwnerIds = (val) => {
    const ids = val.split(',').map(s => s.trim()).filter(Boolean);
    setConfig(c => ({ ...c, OWNER_DISCORD_IDS: ids }));
  };

  if (!user) {
    return (
      <div className="bd-gate">
        <div className="bd-gate-card">
          <div className="bd-gate-icon">🔐</div>
          <h2>Login Required</h2>
          <p>Please log in to access the Bot Dashboard.</p>
          <a href="/login" className="bd-btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>Go to Login</a>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="bd-gate">
        <div className="bd-gate-card">
          <div className="bd-gate-icon">🔒</div>
          <h2>Access Denied</h2>
          <p>This page is only accessible to <strong>admins</strong> and <strong>owners</strong>.</p>
          <p style={{ marginTop: 8, color: '#888', fontSize: '0.85rem' }}>Logged in as: <code>{user.username}</code> ({user.role})</p>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'overview',    icon: '📊', label: 'Overview' },
    { id: 'owner',       icon: '👑', label: 'Owner Settings' },
    { id: 'channels',    icon: '📢', label: 'Channels' },
    { id: 'permissions', icon: '🛡️', label: 'Permissions' },
    { id: 'economy',     icon: '💰', label: 'Economy' },
    { id: 'stats',       icon: '📈', label: 'Stat VCs' },
  ];

  return (
    <div className="bd-root">
      {toast && <div className="bd-toast">{toast}</div>}

      {/* Sidebar */}
      <aside className="bd-sidebar">
        <div className="bd-sidebar-brand">
          <span className="bd-brand-icon">🤖</span>
          <span>Bot Dashboard</span>
        </div>
        <nav className="bd-nav">
          {TABS.map(t => (
            <button key={t.id} className={`bd-nav-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <span className="bd-nav-icon">{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <div className="bd-sidebar-footer">
          <div className="bd-user-pill">
            <span className="bd-user-role">{user.role}</span>
            <span className="bd-user-name">{user.username}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="bd-main">
        <header className="bd-header">
          <h1 className="bd-title">
            {TABS.find(t => t.id === activeTab)?.icon} {TABS.find(t => t.id === activeTab)?.label}
          </h1>
          {activeTab !== 'overview' && activeTab !== 'economy' && (
            <button className="bd-save-btn" onClick={saveConfig} disabled={saving}>
              {saving ? 'Saving…' : '💾 Save Changes'}
            </button>
          )}
        </header>

        <div className="bd-content">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="bd-overview">
              <div className="bd-status-banner" style={{ background: status?.online ? 'rgba(46,204,113,0.12)' : 'rgba(231,76,60,0.12)', borderColor: status?.online ? '#2ECC71' : '#E74C3C' }}>
                <span className={`bd-status-dot ${status?.online ? 'online' : 'offline'}`}></span>
                <span>Bot is <strong>{status?.online ? 'Online' : 'Offline'}</strong></span>
                {status?.tag && <span className="bd-tag">@{status.tag}</span>}
                {status?.guilds && <span className="bd-guilds">{status.guilds} servers</span>}
              </div>
              <div className="bd-stats-grid">
                {[
                  { icon: '👥', val: status?.members?.toLocaleString() ?? '–', label: 'Members' },
                  { icon: '📜', val: status?.commands ?? '–', label: 'Commands' },
                  { icon: '💰', val: economy ? Object.keys(economy).length : '–', label: 'Economy Users' },
                  { icon: '⏱️', val: status?.uptime ?? '–', label: 'Uptime' },
                ].map((s, i) => (
                  <div className="bd-stat-card" key={i}>
                    <div className="bd-stat-icon">{s.icon}</div>
                    <div className="bd-stat-val">{s.val}</div>
                    <div className="bd-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="bd-quick-ref">
                <h3>🚀 Quick Setup Guide</h3>
                <ol>
                  <li>Set your <strong>Owner Discord ID</strong> in the <strong>Owner Settings</strong> tab</li>
                  <li>Run <code>/startup</code> in Discord to create all staff roles</li>
                  <li>Set channels in the <strong>Channels</strong> tab</li>
                  <li>Set stat VCs in <strong>Stat VCs</strong> for live member counts</li>
                  <li>Use <code>/eco add @user 1000</code> to give money (owner only)</li>
                </ol>
              </div>
            </div>
          )}

          {/* OWNER SETTINGS */}
          {activeTab === 'owner' && config && (
            <div className="bd-section">
              <p className="bd-section-desc">
                Configure which Discord account IDs have <strong>owner-level bot privileges</strong> — ability to use <code>/eco</code> and immunity from rob/duel.
              </p>

              <div className="bd-info-box" style={{ marginBottom: 24 }}>
                👑 Owner Discord IDs can use <code>/eco add/remove/set/reset/view</code> and <strong>cannot be robbed or duelled against</strong>.
                Right-click your name in Discord → <strong>Copy User ID</strong> (enable Developer Mode in Discord settings first).
              </div>

              <div className="bd-field">
                <label>👑 Owner Discord User IDs</label>
                <input
                  type="text"
                  placeholder="Enter Discord IDs separated by commas: 123456789, 987654321"
                  value={(config.OWNER_DISCORD_IDS || []).join(', ')}
                  onChange={e => updateOwnerIds(e.target.value)}
                />
                <span className="bd-hint">
                  Current: <code>{(config.OWNER_DISCORD_IDS || []).join(', ') || 'None set'}</code>
                </span>
              </div>

              <div className="bd-field">
                <label>🤖 Bot Owner ID (Legacy)</label>
                <input
                  type="text"
                  placeholder="Single owner Discord ID"
                  value={config.OWNER_ID || ''}
                  onChange={e => setConfig(c => ({ ...c, OWNER_ID: e.target.value }))}
                />
                <span className="bd-hint">Current: <code>{config.OWNER_ID || 'Not set'}</code></span>
              </div>

              <div className="bd-field">
                <label>🌐 Website URL</label>
                <input
                  type="text"
                  placeholder="https://yoursite.com"
                  value={config.WEBSITE_URL || ''}
                  onChange={e => setConfig(c => ({ ...c, WEBSITE_URL: e.target.value }))}
                />
              </div>

              <div className="bd-field">
                <label>🔗 Discord Invite Link</label>
                <input
                  type="text"
                  placeholder="https://discord.gg/yourcode"
                  value={config.DISCORD_INVITE || ''}
                  onChange={e => setConfig(c => ({ ...c, DISCORD_INVITE: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* CHANNELS */}
          {activeTab === 'channels' && config && (
            <div className="bd-section">
              <p className="bd-section-desc">Paste Discord channel IDs. Right-click a channel → Copy ID (requires Developer Mode).</p>
              {[
                { key: 'welcome',        label: '👋 Welcome Channel',        ph: 'Channel ID for welcome messages' },
                { key: 'logs',           label: '📋 Moderation Logs',        ph: 'Channel ID for mod action logs' },
                { key: 'reaction_roles', label: '🎭 Reaction Roles Channel',  ph: 'Channel ID for role selection' },
              ].map(f => (
                <div className="bd-field" key={f.key}>
                  <label>{f.label}</label>
                  <input type="text" placeholder={f.ph} value={config.channels?.[f.key] || ''}
                    onChange={e => updateChannel(f.key, e.target.value)} />
                  <span className="bd-hint">Current: <code>{config.channels?.[f.key] || 'Not set'}</code></span>
                </div>
              ))}
            </div>
          )}

          {/* PERMISSIONS */}
          {activeTab === 'permissions' && config && (
            <div className="bd-section">
              <p className="bd-section-desc">Select which roles have access to each permission group.</p>
              {Object.entries(PERMISSION_LABELS).map(([perm, label]) => (
                <div className="bd-perm-group" key={perm}>
                  <div className="bd-perm-label">🔑 {label}</div>
                  <div className="bd-perm-roles">
                    {ALL_ROLES_DEFAULTS.map(role => {
                      const checked = (config.permissions?.[perm] || []).includes(role);
                      return (
                        <label key={role} className={`bd-role-chip ${checked ? 'active' : ''}`}>
                          <input type="checkbox" checked={checked} onChange={() => {
                            const cur = config.permissions?.[perm] || [];
                            updatePerm(perm, checked ? cur.filter(r => r !== role) : [...cur, role]);
                          }} />
                          {role}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ECONOMY */}
          {activeTab === 'economy' && (
            <div className="bd-section">
              <p className="bd-section-desc">Top 20 wealthiest members. Use <code>/eco add/remove @user amount</code> in Discord to manage balances.</p>
              {economy ? (
                <table className="bd-table">
                  <thead><tr><th>#</th><th>User ID</th><th>Wallet</th><th>Bank</th><th>Total</th></tr></thead>
                  <tbody>
                    {Object.entries(economy)
                      .map(([id, d]) => ({ id, wallet: d.balance || 0, bank: d.bank || 0, total: (d.balance || 0) + (d.bank || 0) }))
                      .sort((a, b) => b.total - a.total).slice(0, 20)
                      .map((u, i) => (
                        <tr key={u.id}>
                          <td>#{i + 1}</td>
                          <td><code>{u.id}</code></td>
                          <td>⏣ {u.wallet.toLocaleString()}</td>
                          <td>⏣ {u.bank.toLocaleString()}</td>
                          <td><strong>⏣ {u.total.toLocaleString()}</strong></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : <p>Loading…</p>}
            </div>
          )}

          {/* STAT VCs */}
          {activeTab === 'stats' && config && (
            <div className="bd-section">
              <p className="bd-section-desc">Voice channel IDs the bot will rename every 5 minutes with live stats.</p>
              {[
                { key: 'members', label: '👥 Member Count VC', ph: 'Will show: "👥 Members: 1,234"' },
                { key: 'scripts', label: '📜 Script Count VC', ph: 'Will show: "📜 Scripts: 567"' },
                { key: 'online',  label: '🟢 Online Count VC', ph: 'Will show: "🟢 Online: 89"' },
              ].map(f => (
                <div className="bd-field" key={f.key}>
                  <label>{f.label}</label>
                  <input type="text" placeholder={f.ph} value={config.stat_channels?.[f.key] || ''}
                    onChange={e => updateStatVC(f.key, e.target.value)} />
                  <span className="bd-hint">Current: <code>{config.stat_channels?.[f.key] || 'Not set'}</code></span>
                </div>
              ))}
              <div className="bd-info-box">💡 Create a voice channel, right-click → Copy ID, paste above. Bot needs <strong>Manage Channel</strong> permission.</div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
