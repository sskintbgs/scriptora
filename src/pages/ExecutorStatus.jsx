import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, CheckCircle, XCircle, Shield, Globe, MessageCircle, DollarSign, RefreshCw, Search, Zap, Lock, Unlock, Layers, Monitor, Smartphone, Apple } from 'lucide-react';

const PRIORITY_EXECUTORS = ['Potassium', 'Delta', 'Xeno', 'Solara'];

const TYPE_LABELS = {
  'all': 'All',
  'wexecutor': 'Windows',
  'wexternal': 'External',
  'mexecutor': 'Mac',
  'aexecutor': 'Android',
  'iexecutor': 'iOS',
};

const TYPE_ICONS = {
  'wexecutor': <Monitor size={13} />,
  'wexternal': <Shield size={13} />,
  'mexecutor': <Apple size={13} />,
  'aexecutor': <Smartphone size={13} />,
  'iexecutor': <Smartphone size={13} />,
};

const ExecutorStatus = () => {
  const [executors, setExecutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedExecutor, setSelectedExecutor] = useState(null);

  const fetchExecutors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/executors');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setExecutors(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExecutors(); }, []);

  // Get unique types from data
  const availableTypes = ['all', ...new Set(executors.filter(e => !e.hidden && e.extype).map(e => e.extype))];

  const filtered = executors
    .filter(e => !e.hidden)
    .filter(e => {
      if (statusFilter === 'updated') return e.updateStatus === true;
      if (statusFilter === 'outdated') return e.updateStatus === false;
      if (statusFilter === 'free') return e.free === true;
      if (statusFilter === 'paid') return e.free === false;
      if (statusFilter === 'undetected') return e.detected === false;
      return true;
    })
    .filter(e => {
      if (typeFilter === 'all') return true;
      return e.extype === typeFilter;
    })
    .filter(e =>
      e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.platform?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aP = PRIORITY_EXECUTORS.includes(a.title) ? -1 : 0;
      const bP = PRIORITY_EXECUTORS.includes(b.title) ? -1 : 0;
      if (aP !== bP) return aP - bP;
      return (b.updateStatus ? 1 : 0) - (a.updateStatus ? 1 : 0);
    });

  const visible = executors.filter(e => !e.hidden);
  const stats = {
    total: visible.length,
    updated: visible.filter(e => e.updateStatus).length,
    outdated: visible.filter(e => !e.updateStatus).length,
    free: visible.filter(e => e.free).length,
    undetected: visible.filter(e => !e.detected).length,
  };

  const getTypeLabel = (extype) => TYPE_LABELS[extype] || extype || 'Unknown';

  return (
    <div className="container" style={{ padding: '40px 16px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <Cpu className="text-primary" size={30} />
          <h1 style={{ fontSize: '2rem' }}>Executor Status</h1>
        </div>
        {lastUpdated && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {lastUpdated.toLocaleTimeString()} •
            <button onClick={fetchExecutors} style={{ background: 'none', color: 'var(--primary-color)', marginLeft: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem' }}>
              <RefreshCw size={11} /> Refresh
            </button>
          </p>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '20px' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--primary-color)', icon: <Cpu size={14} /> },
          { label: 'Updated', value: stats.updated, color: 'var(--success)', icon: <CheckCircle size={14} /> },
          { label: 'Outdated', value: stats.outdated, color: 'var(--danger)', icon: <XCircle size={14} /> },
          { label: 'Free', value: stats.free, color: 'var(--accent-color)', icon: <Unlock size={14} /> },
          { label: 'Undetected', value: stats.undetected, color: 'var(--warning)', icon: <Shield size={14} /> },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '12px', textAlign: 'center', cursor: 'pointer' }}
            onClick={() => setStatusFilter(statusFilter === s.label.toLowerCase() ? 'all' : s.label.toLowerCase())}>
            <div style={{ color: s.color, marginBottom: '2px' }}>{s.icon}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color, fontFamily: 'Outfit' }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Type Filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '4px' }}>Type:</span>
        {availableTypes.map(t => (
          <button key={t} className={`btn ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 12px', fontSize: '0.78rem', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setTypeFilter(t)}>
            {TYPE_ICONS[t]} {TYPE_LABELS[t] || t}
          </button>
        ))}
      </div>

      {/* Status Filter + Search */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'updated', 'outdated', 'free', 'paid', 'undetected'].map(f => (
          <button key={f} className={`btn ${statusFilter === f ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '5px 12px', fontSize: '0.78rem', textTransform: 'capitalize' }}
            onClick={() => setStatusFilter(f)}>{f}</button>
        ))}
        <div style={{ marginLeft: 'auto', position: 'relative', minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input-field" placeholder="Search..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '30px', margin: 0, fontSize: '0.85rem' }} />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <RefreshCw size={28} className="text-primary" />
          </motion.div>
          <p className="text-muted" style={{ marginTop: '14px' }}>Loading executors...</p>
        </div>
      )}

      {error && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <XCircle size={36} className="text-danger" style={{ margin: '0 auto 12px' }} />
          <h3>Connection failed</h3>
          <p className="text-muted" style={{ marginBottom: '12px' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchExecutors}><RefreshCw size={14} /> Retry</button>
        </div>
      )}

      {/* Executor Grid */}
      {!loading && !error && (
        <div className="grid-3">
          {filtered.map((exec, idx) => {
            const isPriority = PRIORITY_EXECUTORS.includes(exec.title);
            return (
              <motion.div key={exec._id || exec.title}
                className="glass-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.4), ease: [0.16, 1, 0.3, 1] }}
                style={{ cursor: 'pointer', borderColor: isPriority ? 'rgba(99,102,241,0.4)' : undefined }}
                onClick={() => setSelectedExecutor(exec)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {exec.title}
                      {isPriority && <Zap size={13} style={{ color: 'var(--warning)' }} />}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      v{exec.version || '?'} • {getTypeLabel(exec.extype)}
                    </span>
                  </div>
                  <span className={`badge ${exec.updateStatus ? 'verified' : 'pending'}`} style={{ fontSize: '0.68rem' }}>
                    {exec.updateStatus ? '✓ Updated' : '✕ Outdated'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span className="badge" style={{
                    background: exec.detected ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    color: exec.detected ? 'var(--danger)' : 'var(--success)',
                    border: `1px solid ${exec.detected ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`
                  }}>
                    {exec.detected ? 'Detected' : 'Undetected'}
                  </span>
                  <span className="badge" style={{
                    background: exec.free ? 'rgba(56,189,248,0.1)' : 'rgba(192,132,252,0.1)',
                    color: exec.free ? 'var(--accent-color)' : 'var(--secondary-color)',
                    border: `1px solid ${exec.free ? 'rgba(56,189,248,0.25)' : 'rgba(192,132,252,0.25)'}`
                  }}>
                    {exec.free ? 'Free' : exec.cost || 'Paid'}
                  </span>
                  {exec.uncStatus && (
                    <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)', border: '1px solid rgba(99,102,241,0.25)' }}>UNC</span>
                  )}
                </div>

                {(exec.uncPercentage !== undefined || exec.suncPercentage !== undefined) && (
                  <div style={{ marginBottom: '10px' }}>
                    {exec.uncPercentage !== undefined && (
                      <div style={{ marginBottom: '5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                          <span>UNC</span><span>{exec.uncPercentage}%</span>
                        </div>
                        <div style={{ height: '3px', background: 'var(--bg-color-lighter)', borderRadius: '2px', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${exec.uncPercentage}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            style={{ height: '100%', background: exec.uncPercentage >= 80 ? 'var(--success)' : exec.uncPercentage >= 50 ? 'var(--warning)' : 'var(--danger)', borderRadius: '2px' }} />
                        </div>
                      </div>
                    )}
                    {exec.suncPercentage !== undefined && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                          <span>sUNC</span><span>{exec.suncPercentage}%</span>
                        </div>
                        <div style={{ height: '3px', background: 'var(--bg-color-lighter)', borderRadius: '2px', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${exec.suncPercentage}%` }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                            style={{ height: '100%', background: exec.suncPercentage >= 80 ? 'var(--success)' : exec.suncPercentage >= 50 ? 'var(--warning)' : 'var(--danger)', borderRadius: '2px' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {exec.decompiler && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}><Layers size={9} /> Decompiler</span>}
                  {exec.multiInject && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}><Layers size={9} /> Multi-Inject</span>}
                  {exec.keysystem && <span style={{ fontSize: '0.68rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '3px' }}><Lock size={9} /> Key System</span>}
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                  {exec.updatedDate || '—'}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <Search size={28} className="text-muted" style={{ margin: '0 auto 10px' }} />
          <p className="text-muted">No executors match your filters.</p>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedExecutor && (
          <>
            <motion.div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedExecutor(null)}
            />
            <motion.div
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                zIndex: 301, width: '90%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto',
                background: 'var(--bg-color-light)', border: '1px solid var(--border-color)',
                borderRadius: '16px', padding: '28px'
              }}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div>
                  <h2 style={{ marginBottom: '3px', fontSize: '1.4rem' }}>{selectedExecutor.title}</h2>
                  <p className="text-muted" style={{ fontSize: '0.82rem' }}>v{selectedExecutor.version} • {getTypeLabel(selectedExecutor.extype)} • {selectedExecutor.platform}</p>
                </div>
                <button onClick={() => setSelectedExecutor(null)} className="btn btn-secondary" style={{ padding: '5px 9px', fontSize: '0.85rem' }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div className="glass-card" style={{ padding: '10px', textAlign: 'center' }}>
                  <div style={{ color: selectedExecutor.updateStatus ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: '0.85rem' }}>
                    {selectedExecutor.updateStatus ? '✓ Updated' : '✕ Outdated'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Status</div>
                </div>
                <div className="glass-card" style={{ padding: '10px', textAlign: 'center' }}>
                  <div style={{ color: selectedExecutor.detected ? 'var(--danger)' : 'var(--success)', fontWeight: 700, fontSize: '0.85rem' }}>
                    {selectedExecutor.detected ? 'Detected' : 'Undetected'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Hyperion</div>
                </div>
                <div className="glass-card" style={{ padding: '10px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.85rem' }}>
                    {selectedExecutor.free ? 'Free' : selectedExecutor.cost || 'Paid'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Price</div>
                </div>
                <div className="glass-card" style={{ padding: '10px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '0.85rem' }}>
                    {selectedExecutor.uncPercentage ?? '—'}%
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>UNC</div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '6px', fontSize: '0.85rem' }}>Features</h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {selectedExecutor.uncStatus && <span className="badge verified">UNC</span>}
                  {selectedExecutor.decompiler && <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)' }}>Decompiler</span>}
                  {selectedExecutor.multiInject && <span className="badge" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent-color)' }}>Multi-Inject</span>}
                  {selectedExecutor.keysystem && <span className="badge pending">Key System</span>}
                  {selectedExecutor.clientmods && <span className="badge" style={{ background: 'rgba(192,132,252,0.1)', color: 'var(--secondary-color)' }}>Client Mods</span>}
                  {selectedExecutor.raknet && <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>RakNet</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedExecutor.websitelink && (
                  <a href={selectedExecutor.websitelink} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '7px 12px', fontSize: '0.82rem' }}>
                    <Globe size={13} /> Website
                  </a>
                )}
                {selectedExecutor.discordlink && (
                  <a href={selectedExecutor.discordlink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: '0.82rem' }}>
                    <MessageCircle size={13} /> Discord
                  </a>
                )}
                {selectedExecutor.purchaselink && (
                  <a href={selectedExecutor.purchaselink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: '0.82rem' }}>
                    <DollarSign size={13} /> Purchase
                  </a>
                )}
              </div>

              <div style={{ marginTop: '14px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Last updated: {selectedExecutor.updatedDate || '—'}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExecutorStatus;
