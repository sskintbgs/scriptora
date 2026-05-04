import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Monitor, Apple, Smartphone, Clock, RefreshCw, Copy, ExternalLink, ChevronDown, Hash, Globe, ArrowDown, ArrowUp, Minus, CheckCircle } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import toast from 'react-hot-toast';

const BINARY_TYPES = [
  { value: 'WindowsPlayer', label: 'Windows Player', icon: <Monitor size={16} />, platform: 'Windows' },
  { value: 'WindowsStudio64', label: 'Windows Studio', icon: <Monitor size={16} />, platform: 'Windows' },
  { value: 'MacPlayer', label: 'Mac Player', icon: <Apple size={16} />, platform: 'Mac' },
  { value: 'MacStudio', label: 'Mac Studio', icon: <Apple size={16} />, platform: 'Mac' },
];

const RDD_BASE = 'https://rdd.weao.gg';

const RobloxDownloader = () => {
  const [versions, setVersions] = useState({ current: null, future: null, past: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBinary, setSelectedBinary] = useState('WindowsPlayer');
  const [channel, setChannel] = useState('LIVE');
  const [customHash, setCustomHash] = useState('');
  const [compressZip, setCompressZip] = useState(false);
  const [includeLauncher, setIncludeLauncher] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const [current, future, past] = await Promise.all([
        fetch('/api/roblox-versions/current').then(r => r.json()),
        fetch('/api/roblox-versions/future').then(r => r.json()),
        fetch('/api/roblox-versions/past').then(r => r.json()),
      ]);
      setVersions({ current, future, past });
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to fetch Roblox version data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVersions(); }, []);

  const buildDownloadUrl = (versionHash) => {
    const params = new URLSearchParams();
    params.set('channel', channel);
    params.set('binaryType', selectedBinary);
    if (versionHash) params.set('version', versionHash);
    if (compressZip) params.set('compress', 'true');
    if (includeLauncher) params.set('launcher', 'true');
    return `${RDD_BASE}?${params.toString()}`;
  };

  const getVersionForPlatform = (versionData) => {
    if (!versionData) return { hash: null, date: null };
    const isWin = selectedBinary.startsWith('Windows');
    return {
      hash: isWin ? versionData.Windows : versionData.Mac,
      date: isWin ? versionData.WindowsDate : versionData.MacDate,
    };
  };

  const currentVer = getVersionForPlatform(versions.current);
  const futureVer = getVersionForPlatform(versions.future);
  const pastVer = getVersionForPlatform(versions.past);

  const handleCopyLink = (hash) => {
    const url = buildDownloadUrl(hash);
    copyToClipboard(url).then(ok => {
      if (ok) toast.success('Download link copied!');
      else toast.error('Failed to copy');
    });
  };

  const handleDownload = (hash) => {
    const url = buildDownloadUrl(hash || '');
    window.open(url, '_blank');
  };

  return (
    <div className="container" style={{ padding: '40px 16px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <Download className="text-primary" size={32} />
          <h1 style={{ fontSize: '2rem' }}>Roblox Downloader</h1>
          <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)' }}>
            RDD
          </span>
        </div>
        <p className="text-muted" style={{ maxWidth: '700px' }}>
          Grab any version of Roblox — current, previous, or upcoming builds.
        </p>
        {lastRefresh && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Version data refreshed: {lastRefresh.toLocaleTimeString()} •
            <button onClick={fetchVersions} style={{ background: 'none', color: 'var(--primary-color)', marginLeft: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </p>
        )}
      </motion.div>

      {/* Configuration Panel */}
      <motion.div className="glass-card" style={{ marginBottom: '24px', padding: '24px' }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} className="text-primary" /> Configuration
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {/* Binary Type */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Binary Type</label>
            <div style={{ position: 'relative' }}>
              <select className="input-field" value={selectedBinary} onChange={e => setSelectedBinary(e.target.value)}
                style={{ margin: 0, paddingRight: '32px', appearance: 'none' }}>
                {BINARY_TYPES.map(bt => (
                  <option key={bt.value} value={bt.value}>{bt.label}</option>
                ))}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Channel */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Channel</label>
            <input type="text" className="input-field" value={channel} onChange={e => setChannel(e.target.value.toUpperCase())}
              placeholder="LIVE" style={{ margin: 0 }} />
          </div>

          {/* Custom Hash */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Version Hash (optional)</label>
            <input type="text" className="input-field" value={customHash} onChange={e => setCustomHash(e.target.value)}
              placeholder="Leave empty for latest" style={{ margin: 0, fontFamily: 'Consolas, monospace', fontSize: '0.85rem' }} />
          </div>
        </div>

        {/* Options Row */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={compressZip} onChange={e => setCompressZip(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }} />
            Compress ZIP (smaller but slower)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={includeLauncher} onChange={e => setIncludeLauncher(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }} />
            Include Launcher
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '10px 20px' }}
            onClick={() => handleDownload(customHash || currentVer.hash)}>
            <Download size={16} /> Download Latest
          </button>
          <button className="btn btn-secondary" style={{ padding: '10px 20px' }}
            onClick={() => handleDownload(pastVer.hash)}>
            <ArrowDown size={16} /> Download Previous
          </button>
          <button className="btn btn-secondary" style={{ padding: '10px 20px' }}
            onClick={() => handleCopyLink(customHash || currentVer.hash)}>
            <Copy size={16} /> Copy Link
          </button>
          {customHash && (
            <button className="btn btn-secondary" style={{ padding: '10px 20px' }}
              onClick={() => handleDownload(customHash)}>
              <Hash size={16} /> Download Custom Hash
            </button>
          )}
        </div>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <RefreshCw size={28} className="text-primary" />
          </motion.div>
          <p className="text-muted" style={{ marginTop: '12px' }}>Loading versions...</p>
        </div>
      )}

      {error && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary" onClick={fetchVersions} style={{ marginTop: '12px' }}><RefreshCw size={16} /> Retry</button>
        </div>
      )}

      {/* Version Cards */}
      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {/* Current */}
          <motion.div className="glass-card" style={{ padding: '24px', borderColor: 'rgba(16,185,129,0.3)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={18} style={{ color: 'var(--success)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '2px' }}>Current Version</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Latest live build</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <code style={{ fontSize: '0.82rem', color: 'var(--success)', wordBreak: 'break-all' }}>{currentVer.hash || 'Loading...'}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {currentVer.date || '—'}
              </span>
            </div>
            {/* All platforms for current */}
            {versions.current && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>All Platforms</div>
                <div style={{ display: 'grid', gap: '6px' }}>
                  {[
                    { label: 'Windows', hash: versions.current.Windows, date: versions.current.WindowsDate },
                    { label: 'Mac', hash: versions.current.Mac, date: versions.current.MacDate },
                    ...(versions.current.Android ? [{ label: 'Android', hash: versions.current.Android, date: versions.current.AndroidDate }] : []),
                    ...(versions.current.iOS ? [{ label: 'iOS', hash: versions.current.iOS, date: versions.current.iOSDate }] : []),
                  ].map(p => (
                    <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', padding: '4px 0' }}>
                      <span style={{ color: 'var(--text-muted)', minWidth: '60px' }}>{p.label}</span>
                      <code style={{ color: 'var(--text-color)', fontSize: '0.72rem', flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.hash || '—'}</code>
                      <button onClick={() => { copyToClipboard(p.hash); toast.success(`${p.label} hash copied`); }}
                        style={{ background: 'none', color: 'var(--text-muted)', marginLeft: '8px', padding: '2px', flexShrink: 0 }}><Copy size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.82rem' }}
                onClick={() => handleDownload(currentVer.hash)}><Download size={14} /> Download</button>
              <button className="btn btn-secondary" style={{ padding: '8px 10px' }}
                onClick={() => handleCopyLink(currentVer.hash)}><Copy size={14} /></button>
            </div>
          </motion.div>

          {/* Past / Previous */}
          <motion.div className="glass-card" style={{ padding: '24px', borderColor: 'rgba(245,158,11,0.3)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowDown size={18} style={{ color: 'var(--warning)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '2px' }}>Previous Version</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>For downgrading</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <code style={{ fontSize: '0.82rem', color: 'var(--warning)', wordBreak: 'break-all' }}>{pastVer.hash || 'Loading...'}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {pastVer.date || '—'}
              </span>
            </div>
            {versions.past && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>All Platforms</div>
                <div style={{ display: 'grid', gap: '6px' }}>
                  {[
                    { label: 'Windows', hash: versions.past.Windows, date: versions.past.WindowsDate },
                    { label: 'Mac', hash: versions.past.Mac, date: versions.past.MacDate },
                  ].map(p => (
                    <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', padding: '4px 0' }}>
                      <span style={{ color: 'var(--text-muted)', minWidth: '60px' }}>{p.label}</span>
                      <code style={{ color: 'var(--text-color)', fontSize: '0.72rem', flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.hash || '—'}</code>
                      <button onClick={() => { copyToClipboard(p.hash); toast.success(`${p.label} hash copied`); }}
                        style={{ background: 'none', color: 'var(--text-muted)', marginLeft: '8px', padding: '2px', flexShrink: 0 }}><Copy size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.82rem', background: 'var(--warning)', borderColor: 'var(--warning)' }}
                onClick={() => handleDownload(pastVer.hash)}><Download size={14} /> Download</button>
              <button className="btn btn-secondary" style={{ padding: '8px 10px' }}
                onClick={() => handleCopyLink(pastVer.hash)}><Copy size={14} /></button>
            </div>
          </motion.div>

          {/* Future */}
          <motion.div className="glass-card" style={{ padding: '24px', borderColor: 'rgba(99,102,241,0.3)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUp size={18} style={{ color: 'var(--primary-color)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '2px' }}>Upcoming Version</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Next potential update</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <code style={{ fontSize: '0.82rem', color: 'var(--primary-color)', wordBreak: 'break-all' }}>{futureVer.hash || 'Loading...'}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {futureVer.date || '—'}
              </span>
            </div>
            {versions.future && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>All Platforms</div>
                <div style={{ display: 'grid', gap: '6px' }}>
                  {[
                    { label: 'Windows', hash: versions.future.Windows, date: versions.future.WindowsDate },
                    { label: 'Mac', hash: versions.future.Mac, date: versions.future.MacDate },
                  ].map(p => (
                    <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', padding: '4px 0' }}>
                      <span style={{ color: 'var(--text-muted)', minWidth: '60px' }}>{p.label}</span>
                      <code style={{ color: 'var(--text-color)', fontSize: '0.72rem', flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.hash || '—'}</code>
                      <button onClick={() => { copyToClipboard(p.hash); toast.success(`${p.label} hash copied`); }}
                        style={{ background: 'none', color: 'var(--text-muted)', marginLeft: '8px', padding: '2px', flexShrink: 0 }}><Copy size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.82rem', background: 'var(--primary-color)' }}
                onClick={() => handleDownload(futureVer.hash)}><Download size={14} /> Download</button>
              <button className="btn btn-secondary" style={{ padding: '8px 10px' }}
                onClick={() => handleCopyLink(futureVer.hash)}><Copy size={14} /></button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Info Section */}
      <motion.div className="glass-card" style={{ padding: '24px' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>ℹ️ How it works</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '0.88rem', marginBottom: '6px', color: 'var(--success)' }}>Download Latest</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Fetches the current live Roblox build for your selected platform. Equivalent to what Roblox auto-updates to.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '0.88rem', marginBottom: '6px', color: 'var(--warning)' }}>Download Previous</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Downloads the previous Roblox build — useful for downgrading when the latest version breaks executor compatibility.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '0.88rem', marginBottom: '6px', color: 'var(--primary-color)' }}>Custom Hash</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Paste any version hash to download a specific historical build. Get hashes from the version cards above.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Attribution */}
      <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        <p>Downloads via <a href="https://rdd.weao.gg" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)' }}>RDD</a></p>
      </div>
    </div>
  );
};

export default RobloxDownloader;
