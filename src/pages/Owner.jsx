import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/db';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Activity, AlertTriangle, Ban, CheckCircle, Key, Search, Shield, Eye, ThumbsUp, Globe, TrendingUp, RefreshCw, Clock, Layers, Fingerprint, Trash2, Copy, Zap, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

/* ── shared modal overlay styles ── */
const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 9999,
  background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
};

const modalCard = {
  width: '100%', position: 'relative',
  background: 'var(--bg-color-lighter, #111)',
  border: '1px solid var(--border-color)',
  borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
};

/* ── small field label ── */
const FieldLabel = ({ children }) => (
  <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
    {children}
  </span>
);

/* ── pill button ── */
const Pill = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '5px 12px', fontSize: '0.76rem', borderRadius: '999px', cursor: 'pointer',
    border: active ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
    background: active ? 'var(--primary-color)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
    transition: 'all 0.15s', fontWeight: active ? 600 : 400,
  }}>{children}</button>
);

/* ── toggle switch ── */
const Toggle = ({ value, onChange }) => (
  <div onClick={() => onChange(!value)} style={{
    width: '40px', height: '22px', borderRadius: '11px', position: 'relative',
    background: value ? 'var(--primary-color)' : 'var(--border-color)',
    transition: 'background 0.2s', flexShrink: 0, cursor: 'pointer',
  }}>
    <div style={{
      position: 'absolute', top: '3px', left: value ? '21px' : '3px',
      width: '16px', height: '16px', borderRadius: '50%',
      background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    }} />
  </div>
);

// ─── Inline Key Generator Panel ────────────────────────────────────────────────
const KeyGenPanel = ({ apps, onGenerate, onClose }) => {
  const [form, setForm] = useState({
    appId: apps[0]?.id || '',
    count: 1,
    duration: '1 day',
    level: 'standard',
    isOneTime: false,
    note: '',
  });
  const [loading, setLoading] = useState(false);

  const durations = ['30 mins', '1 hour', '1 day', '7 days', '30 days', 'lifetime'];
  const levels = ['free', 'standard', 'premium', 'vip', 'owner'];
  const levelColors = { free: '#94a3b8', standard: '#60a5fa', premium: '#a78bfa', vip: '#f59e0b', owner: '#ef4444' };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.appId) return toast.error('Select an app first');
    if (!form.count || isNaN(form.count) || form.count < 1) return toast.error('Enter a valid count');
    setLoading(true);
    try { await onGenerate(form); }
    finally { setLoading(false); }
  };

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{ ...modalCard, maxWidth: '500px', padding: '32px' }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(var(--primary-rgb,99,102,241),0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={16} style={{ color: 'var(--primary-color)' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Generate Keys</h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure and bulk-create license keys</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* App + Count row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <FieldLabel>App</FieldLabel>
              <select className="input-field" value={form.appId} onChange={e => set('appId', e.target.value)} style={{ margin: 0, height: '38px' }}>
                {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <FieldLabel>Quantity</FieldLabel>
              <input type="number" min={1} max={500} className="input-field"
                value={form.count} onChange={e => set('count', Math.max(1, parseInt(e.target.value) || 1))}
                style={{ margin: 0, height: '38px' }} />
            </div>
          </div>

          {/* Duration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <FieldLabel>Duration</FieldLabel>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {durations.map(d => <Pill key={d} active={form.duration === d} onClick={() => set('duration', d)}>{d}</Pill>)}
            </div>
          </div>

          {/* Level */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <FieldLabel>Level</FieldLabel>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {levels.map(l => (
                <button key={l} onClick={() => set('level', l)} style={{
                  padding: '5px 14px', fontSize: '0.76rem', borderRadius: '999px', cursor: 'pointer',
                  border: `1px solid ${form.level === l ? levelColors[l] : 'var(--border-color)'}`,
                  background: form.level === l ? `${levelColors[l]}22` : 'transparent',
                  color: form.level === l ? levelColors[l] : 'var(--text-muted)',
                  fontWeight: form.level === l ? 700 : 400, transition: 'all 0.15s', textTransform: 'capitalize',
                }}>{l}</button>
              ))}
            </div>
          </div>

          {/* One-time toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500 }}>One-time use</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Key is revoked automatically after first validation</p>
            </div>
            <Toggle value={form.isOneTime} onChange={v => set('isOneTime', v)} />
          </div>

          {/* Note */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <FieldLabel>Note <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></FieldLabel>
            <input type="text" className="input-field" placeholder="e.g. Giveaway batch #3"
              value={form.note} onChange={e => set('note', e.target.value)} style={{ margin: 0 }} />
          </div>
        </div>

        {/* footer */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ minWidth: '130px' }}>
            {loading
              ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
              : <><Zap size={13} /> Generate {form.count > 1 ? `${form.count} Keys` : 'Key'}</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Bulk Copy Modal ─────────────────────────────────────────────────────────
const BulkCopyModal = ({ keyList, onClose }) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  // Guard: ensure keyList is always a safe array of strings
  const rawKeys = Array.isArray(keyList)
    ? keyList.map(k => (typeof k === 'string' ? k : k?.key || String(k))).filter(Boolean)
    : [];
  const noKeysFound = rawKeys.length === 1 && rawKeys[0] === '__no_keys_found__';
  const safeKeys = noKeysFound ? [] : rawKeys;

  const handleCopyAll = () => {
    if (!safeKeys.length) return;
    navigator.clipboard.writeText(safeKeys.join('\n')).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  };

  const handleCopyOne = (k, i) => {
    navigator.clipboard.writeText(k).then(() => {
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{ ...modalCard, maxWidth: '540px', padding: '28px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} style={{ color: '#22c55e' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                {safeKeys.length} {safeKeys.length === 1 ? 'Key' : 'Keys'} Generated
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Copy individually or grab them all at once</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={handleCopyAll} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              border: copiedAll ? '1px solid #22c55e' : '1px solid var(--primary-color)',
              background: copiedAll ? 'rgba(34,197,94,0.12)' : 'rgba(var(--primary-rgb,99,102,241),0.12)',
              color: copiedAll ? '#22c55e' : 'var(--primary-color)', transition: 'all 0.2s',
            }}>
              {copiedAll ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy All</>}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* key list */}
        <div style={{
          overflowY: 'auto', flex: 1, borderRadius: '10px',
          background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)',
        }}>
          {safeKeys.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
                {noKeysFound
                  ? "Keys were created but couldn't be read from the API response."
                  : 'No keys to display.'}
              </p>
              {noKeysFound && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Check the browser console (<kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>F12</kbd>) for the raw API response — your keys were generated and are visible in the Keys table.
                </p>
              )}
            </div>
          )}
          {safeKeys.map((k, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 14px', gap: '12px',
              borderBottom: i < safeKeys.length - 1 ? '1px solid var(--border-color)' : 'none',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)',
              transition: 'background 0.1s',
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--primary-color)', wordBreak: 'break-all', flex: 1 }}>{k}</span>
              <button onClick={() => handleCopyOne(k, i)} style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem',
                border: copiedIdx === i ? '1px solid #22c55e' : '1px solid var(--border-color)',
                background: copiedIdx === i ? 'rgba(34,197,94,0.1)' : 'transparent',
                color: copiedIdx === i ? '#22c55e' : 'var(--text-muted)', transition: 'all 0.15s',
              }}>
                {copiedIdx === i ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </div>
          ))}
        </div>

        <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '16px', alignSelf: 'flex-end' }}>
          Done
        </button>
      </motion.div>
    </div>
  );
};

// ─── Pagination Component ─────────────────────────────────────────────────────
const Pagination = ({ total, page, perPage, onPageChange }) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const delta = 2;
  const pages = [];
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) pages.push(i);

  const btnBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minWidth: '30px', height: '30px', padding: '0 6px',
    borderRadius: '7px', fontSize: '0.78rem', cursor: 'pointer',
    border: '1px solid var(--border-color)', background: 'transparent',
    color: 'var(--text-muted)', transition: 'all 0.15s',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '12px 16px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '10px' }}>
        {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} <span style={{ opacity: 0.5 }}>of</span> {total}
      </span>
      <button style={{ ...btnBase, opacity: page === 1 ? 0.35 : 1 }} onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        <ChevronLeft size={14} />
      </button>
      {page > delta + 1 && <>
        <button style={btnBase} onClick={() => onPageChange(1)}>1</button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0 2px' }}>…</span>
      </>}
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)} style={{
          ...btnBase,
          background: p === page ? 'var(--primary-color)' : 'transparent',
          borderColor: p === page ? 'var(--primary-color)' : 'var(--border-color)',
          color: p === page ? '#fff' : 'var(--text-muted)',
          fontWeight: p === page ? 700 : 400,
        }}>{p}</button>
      ))}
      {page < totalPages - delta && <>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0 2px' }}>…</span>
        <button style={btnBase} onClick={() => onPageChange(totalPages)}>{totalPages}</button>
      </>}
      <button style={{ ...btnBase, opacity: page === totalPages ? 0.35 : 1 }} onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
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
  const [keyAppFilter, setKeyAppFilter] = useState('all');
  const [apps, setApps] = useState([]);
  const [appLogs, setAppLogs] = useState([]);
  const [appSearch, setAppSearch] = useState('');
  const [userAppFilter, setUserAppFilter] = useState('all');
  const [showSecret, setShowSecret] = useState({});

  // Pagination state
  const [keyPage, setKeyPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const KEY_PER_PAGE = 25;
  const LOG_PER_PAGE = 50;
  const USER_PER_PAGE = 20;

  // Modal state
  const [showKeyGenPanel, setShowKeyGenPanel] = useState(false);
  const [bulkCopyKeys, setBulkCopyKeys] = useState(null); // array of key strings to show in copy modal

  useEffect(() => {
    if (user?.role === 'owner' || user?.role === 'admin') refreshData();
  }, [user]);

  // Reset pages when filters change
  useEffect(() => { setKeyPage(1); }, [keySearch, keyFilter, keyAppFilter]);
  useEffect(() => { setLogPage(1); }, [logSearch, logFilter]);
  useEffect(() => { setUserPage(1); }, [userSearch, userFilter, userAppFilter]);

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
      if (!target?.banned) {
        if (window.confirm(`User "${target?.username}" has been banned. Do you also want to DELETE ALL their scripts?`)) {
          const deletedCount = await api.deleteAllUserScripts(user.id, id);
          toast.success(`Deleted ${deletedCount} scripts`);
        }
      }
      toast.success(`User ${action}ned`);
      refreshData();
    } catch (err) { toast.error(err.message); }
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
    } catch (err) { toast.error(err.message); }
  };

  // Inline key gen handler — receives form values from KeyGenPanel
  const handleGenerateKeys = async ({ appId, count, duration, level, isOneTime, note }) => {
    try {
      // Snapshot existing key strings before generation
      const existingKeys = new Set(keys.map(k => k.key));

      const result = await api.createKey(user.id, appId, note || '', null, duration, count, level, isOneTime);
      console.log('[KeyGen] raw api.createKey result:', result);
      setShowKeyGenPanel(false);
      toast.success(`Generated ${count} ${level} key${count > 1 ? 's' : ''}!`);

      // Fetch fresh key list FIRST so we can diff it
      const freshKeys = await api.getKeys(user.id);
      setKeys(freshKeys);
      // Also refresh everything else
      refreshData();

      // Strategy 1: diff — keys that didn't exist before
      const diffed = freshKeys
        .map(k => k.key)
        .filter(k => !existingKeys.has(k));

      // Strategy 2: try to parse raw result in every known shape
      let fromResult = [];
      try {
        const r = result;
        if (Array.isArray(r)) {
          fromResult = r.map(k => (typeof k === 'string' ? k : k?.key || k?.value || k?.id)).filter(Boolean);
        } else if (r && typeof r === 'object') {
          const arr = r.keys || r.data || r.created || r.result || r.items || [];
          if (Array.isArray(arr) && arr.length) {
            fromResult = arr.map(k => (typeof k === 'string' ? k : k?.key || k?.value)).filter(Boolean);
          } else if (typeof r.key === 'string') {
            fromResult = [r.key];
          }
        }
      } catch (_) {}

      // Use whichever gives more results
      const keyStrings = diffed.length >= fromResult.length ? diffed : fromResult;

      // Always open modal regardless — show whatever we found
      const finalKeys = keyStrings.length > 0 ? keyStrings : diffed;
      console.log('[KeyGen] showing in modal:', finalKeys);
      setBulkCopyKeys(finalKeys.length > 0 ? finalKeys : ['__no_keys_found__']);
    } catch (err) { toast.error(err?.message || 'Generation failed'); }
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

  // ── Filtered lists ──
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

  const filteredKeysList = keys.filter(k => {
    const matchesSearch = k.key.toLowerCase().includes(keySearch.toLowerCase()) ||
      (k.note || '').toLowerCase().includes(keySearch.toLowerCase());
    const matchesStatus = keyFilter === 'all' || (keyFilter === 'used' ? k.lastUsed : !k.lastUsed);
    const matchesApp = keyAppFilter === 'all' || k.appId === keyAppFilter;
    return matchesSearch && matchesStatus && matchesApp;
  });

  const filteredUsersList = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      String(u.id).includes(userSearch) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userFilter === 'all' ||
      (userFilter === 'admin' ? u.role === 'admin' :
       userFilter === 'banned' ? u.banned :
       userFilter === 'warned' ? (u.warnings || 0) > 0 : u.role === userFilter);
    const matchesApp = userAppFilter === 'all' || keys.some(k => k.appId === userAppFilter && k.hwid === u.hwid);
    return matchesSearch && matchesRole && matchesApp;
  });

  // Paginated slices
  const pagedKeys = filteredKeysList.slice((keyPage - 1) * KEY_PER_PAGE, keyPage * KEY_PER_PAGE);
  const pagedLogs = filteredLogs.slice((logPage - 1) * LOG_PER_PAGE, logPage * LOG_PER_PAGE);
  const pagedUsers = filteredUsersList.slice((userPage - 1) * USER_PER_PAGE, userPage * USER_PER_PAGE);

  const adminCount = users.filter(u => u.role === 'admin').length;
  const bannedCount = users.filter(u => u.banned).length;
  const warnedCount = users.filter(u => (u.warnings || 0) > 0).length;

  return (
    <div className="container" style={{ padding: '40px 16px' }}>

      {/* Modals */}
      <AnimatePresence>
        {showKeyGenPanel && (
          <KeyGenPanel key="keygen"
            apps={apps}
            onGenerate={handleGenerateKeys}
            onClose={() => setShowKeyGenPanel(false)}
          />
        )}
        {bulkCopyKeys && (
          <BulkCopyModal key="bulkcopy"
            keyList={bulkCopyKeys}
            onClose={() => setBulkCopyKeys(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
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
          { key: 'logs', label: 'Activity Logs', icon: <Activity size={14} /> },
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
                {[
                  { label: 'Database Status', value: <span className="badge verified" style={{ fontSize: '0.72rem' }}>● Online</span> },
                  { label: 'Active Users', value: <span style={{ fontWeight: 600 }}>{stats.onlineUsers || 0}</span> },
                  { label: 'Total Visitors', value: <span style={{ fontWeight: 600, color: 'var(--accent-color)' }}>{stats.totalVisitors || 0}</span> },
                  { label: 'Warned Users', value: <span style={{ fontWeight: 600, color: warnedCount > 0 ? 'var(--warning)' : undefined }}>{warnedCount}</span> },
                  { label: 'Banned Users', value: <span style={{ fontWeight: 600, color: bannedCount > 0 ? 'var(--danger)' : undefined }}>{bannedCount}</span> },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>{label}</span>
                    {value}
                  </div>
                ))}
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
                  <option value="banned">Banned</option>
                  <option value="warned">Warned</option>
                </select>
              </div>
            </div>
          </div>
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Warns</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
            </thead>
            <tbody>
              {pagedUsers.map(u => (
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
                    {u.banned
                      ? <span className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '0.68rem' }}>Banned</span>
                      : <span className="badge verified" style={{ fontSize: '0.68rem' }}>Active</span>}
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
              {pagedUsers.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px' }} className="text-muted">No users found.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination total={filteredUsersList.length} page={userPage} perPage={USER_PER_PAGE} onPageChange={setUserPage} />
        </motion.div>
      )}

      {/* Logs */}
      {activeSection === 'logs' && isOwner && (
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
              {pagedLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{new Date(log.date).toLocaleString()}</td>
                  <td style={{ fontWeight: 500, color: 'var(--primary-color)', fontSize: '0.85rem' }}>{log.action}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{log.actor || '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{log.details}</td>
                </tr>
              ))}
              {pagedLogs.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px' }} className="text-muted">No logs found.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination total={filteredLogs.length} page={logPage} perPage={LOG_PER_PAGE} onPageChange={setLogPage} />
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
                        <Eye size={10} style={{ opacity: showSecret[a.id] ? 1 : 0.5 }} />
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
              <button className="btn btn-primary" onClick={() => {
                if (apps.length === 0) return toast.error("Create an App first!");
                setShowKeyGenPanel(true);
              }} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                <Zap size={13} /> Generate Keys
              </button>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{filteredKeysList.length} keys</span>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="input-field" placeholder="Search keys..." value={keySearch}
                  onChange={e => setKeySearch(e.target.value)} style={{ paddingLeft: '30px', maxWidth: '200px', margin: 0, fontSize: '0.82rem' }} />
              </div>
            </div>
          </div>
          <table className="admin-table">
            <thead>
              <tr><th>Key</th><th>App</th><th>Level</th><th>Type</th><th>Note</th><th>HWID</th><th>Status</th><th>Expires</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
            </thead>
            <tbody>
              {pagedKeys.map(k => (
                <tr key={k._id || k.key}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--primary-color)' }}>{k.key}</td>
                  <td style={{ fontSize: '0.75rem', fontWeight: 600 }}>{apps.find(a => a.id === k.appId)?.name || k.appId}</td>
                  <td>
                    <span className={`badge ${k.level === 'premium' ? 'verified' : k.level === 'vip' ? 'pending' : ''}`} style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                      {k.level || 'standard'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>
                    {k.isOneTime
                      ? <span className="text-warning" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Zap size={10} /> 1-Time</span>
                      : <span className="text-muted">Standard</span>}
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
              {pagedKeys.length === 0 && (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '32px' }} className="text-muted">No keys found.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination total={filteredKeysList.length} page={keyPage} perPage={KEY_PER_PAGE} onPageChange={setKeyPage} />
        </motion.div>
      )}

      {/* Security Logs (owner only, separate from activity logs) */}
      {activeSection === 'logs' && isOwner && appLogs.length > 0 && (
        <motion.div className="admin-table-container" style={{ marginTop: '24px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="section-header" style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color-lighter)' }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Security & Validation Logs</h2>
            <p className="text-muted" style={{ fontSize: '0.8rem', margin: '2px 0 0' }}>Monitor all key validation attempts and flagged hardware IDs.</p>
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
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
};

export default Owner;
