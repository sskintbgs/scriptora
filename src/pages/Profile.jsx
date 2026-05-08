import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api/db';
import { useAuth } from '../context/AuthContext';
import { Code, Eye, ThumbsUp, Star, Calendar, Shield, MessageSquare, ArrowLeft, ExternalLink, RefreshCw, Trash2, Ban, AlertTriangle, Award, Mail, Fingerprint, Clock, Image, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ScriptCard from '../components/ScriptCard';

const CSS = `
  .pf-page { padding: 0 0 70px; }
  .pf-container { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
  @media (max-width: 480px) { .pf-container { padding: 0 14px; } }

  .pf-back {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.82rem; color: #525878; text-decoration: none;
    padding-top: 28px; margin-bottom: 24px; transition: color 0.15s;
    font-family: inherit;
  }
  .pf-back:hover { color: #9aa0bc; }

  .pf-hero {
    position: relative; overflow: hidden;
    background: #0f111a; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 18px; padding: 36px 32px; margin-bottom: 28px;
  }
  .pf-hero::before {
    content: ''; position: absolute; top: -60%; left: -20%;
    width: 80%; height: 200%;
    background: radial-gradient(ellipse, rgba(129,140,248,0.07) 0%, transparent 65%);
    pointer-events: none;
  }
  @media (max-width: 560px) { .pf-hero { padding: 24px 20px; } }

  .pf-hero-row {
    display: flex; gap: 20px; align-items: flex-start;
    position: relative; z-index: 1; flex-wrap: wrap;
  }

  .pf-avatar {
    width: 80px; height: 80px; border-radius: 20px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 2rem; font-weight: 900; color: #fff;
    background: linear-gradient(135deg, #818cf8, #38bdf8);
    box-shadow: 0 8px 28px rgba(129,140,248,0.3);
    user-select: none;
  }
  @media (max-width: 400px) { .pf-avatar { width: 64px; height: 64px; font-size: 1.6rem; border-radius: 16px; } }

  .pf-hero-info { flex: 1; min-width: 200px; }
  .pf-username {
    font-size: clamp(1.3rem, 4vw, 1.8rem);
    font-weight: 900; letter-spacing: -0.03em; color: #eaedf8; margin-bottom: 8px;
  }
  .pf-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
  .pf-role-badge {
    font-size: 0.68rem; font-weight: 700; padding: 3px 10px;
    border-radius: 99px; display: inline-flex; align-items: center; gap: 3px;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .pf-join-date {
    font-size: 0.78rem; color: #525878;
    display: flex; align-items: center; gap: 5px;
  }

  .pf-stats {
    display: flex; gap: 10px; margin-top: 22px;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    scrollbar-width: none; padding-bottom: 2px;
    position: relative; z-index: 1;
  }
  .pf-stats::-webkit-scrollbar { display: none; }
  .pf-stat {
    flex: 0 0 auto; min-width: 82px;
    background: #161924; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px; padding: 12px 14px; text-align: center;
  }
  .pf-stat-val {
    font-size: 1.25rem; font-weight: 800;
    font-variant-numeric: tabular-nums; line-height: 1.2;
  }
  .pf-stat-label {
    font-size: 0.62rem; color: #525878;
    text-transform: uppercase; letter-spacing: 0.05em; margin-top: 3px;
    display: flex; align-items: center; justify-content: center; gap: 3px;
  }

  .pf-section { margin-bottom: 36px; }
  .pf-section-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; margin-bottom: 18px; flex-wrap: wrap;
  }
  .pf-section-head h2 {
    font-size: 1.1rem; font-weight: 800; letter-spacing: -0.02em;
    color: #eaedf8; display: flex; align-items: center; gap: 8px; margin: 0;
  }
  .pf-count {
    font-size: 0.7rem; color: #525878;
    background: #161924; border: 1px solid rgba(255,255,255,0.06);
    padding: 3px 10px; border-radius: 99px;
  }

  .pf-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 12px;
  }
  @media (max-width: 580px) { .pf-grid { grid-template-columns: 1fr; } }

  .pf-empty {
    text-align: center; padding: 52px 24px;
    background: #0f111a; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
  }
  .pf-empty p { color: #525878; font-size: 0.88rem; margin-top: 8px; }

  /* Shimmer */
  .pf-shimmer-wrap {
    background: #0f111a; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 18px; padding: 36px 32px; margin-bottom: 28px;
  }
  @media (max-width: 560px) { .pf-shimmer-wrap { padding: 24px 20px; } }
  .pf-shimmer {
    border-radius: 8px;
    background: linear-gradient(90deg, #161924 0%, #1e2233 50%, #161924 100%);
    background-size: 200% 100%;
    animation: pf-sh 1.5s ease-in-out infinite;
  }
  @keyframes pf-sh { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* Centered states */
  .pf-centered { text-align: center; padding: 90px 24px; }
  .pf-centered h2 { color: #eaedf8; margin-bottom: 8px; font-size: 1.35rem; }
  .pf-centered p { color: #525878; margin-bottom: 24px; font-size: 0.9rem; }
  .pf-action-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 22px; border-radius: 10px;
    font: inherit; font-size: 0.88rem; font-weight: 600;
    background: rgba(129,140,248,0.12); border: 1px solid rgba(129,140,248,0.25);
    color: #818cf8; text-decoration: none; cursor: pointer;
    transition: background 0.15s;
  }
  .pf-action-btn:hover { background: rgba(129,140,248,0.2); }
`;

const ROLE_STYLES = {
  owner:   { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  admin:   { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  support: { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', border: 'rgba(52,211,153,0.25)' },
  user:    { bg: 'rgba(129,140,248,0.12)', color: '#818cf8', border: 'rgba(129,140,248,0.25)' },
};

let pfCssInjected = false;

/** Race a promise against a timeout so it always settles */
const withTimeout = (promise, ms = 8000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ]);

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile]   = useState(null);
  const [scripts, setScripts]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  if (!pfCssInjected && typeof document !== 'undefined') {
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
    pfCssInjected = true;
  }

  const load = () => {
    const target = username?.replace('@', '');
    if (!target) { setLoading(false); return; }

    setLoading(true);
    setTimedOut(false);

    const userPromise = withTimeout(api.getUserByUsername(target));
    const scriptsPromise = withTimeout(
      api.getScriptsByUsername
        ? api.getScriptsByUsername(target)
        : api.getScripts().then(all =>
            all.filter(s => s.author === target && s.verified)
          )
    );

    Promise.all([userPromise, scriptsPromise])
      .then(([prof, userScripts]) => {
        setProfile(prof || null);
        setScripts(Array.isArray(userScripts) ? userScripts : []);
      })
      .catch(err => {
        if (err?.message === 'timeout') setTimedOut(true);
        setProfile(null);
        setScripts([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [username]);

  /* ── Derived stats ── */
  const totalViews    = scripts.reduce((s, sc) => s + (sc.views || 0), 0);
  const totalLikes    = scripts.reduce((s, sc) => s + (sc.likes || 0), 0);
  const totalComments = scripts.reduce((s, sc) => s + (sc.comments?.length || 0), 0);
  const allRatings    = scripts.flatMap(sc => sc.ratings || []);
  const avgRating     = allRatings.length
    ? (allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length).toFixed(1)
    : null;
  const verified = scripts.filter(s => s.verified).length;

  const roleStyle    = ROLE_STYLES[profile?.role] || ROLE_STYLES.user;
  const isOwnProfile = currentUser?.username === profile?.username
                    || currentUser?.id === profile?.id;

  const statItems = [
    { label: 'Scripts',  value: scripts.length,             color: '#818cf8', icon: <Code size={10} /> },
    { label: 'Views',    value: totalViews.toLocaleString(), color: '#38bdf8', icon: <Eye size={10} /> },
    { label: 'Likes',    value: totalLikes,                  color: '#34d399', icon: <ThumbsUp size={10} /> },
    ...(avgRating ? [{ label: 'Avg Rating', value: avgRating, color: '#fbbf24', icon: <Star size={10} /> }] : []),
    { label: 'Comments', value: totalComments,               color: '#c084fc', icon: <MessageSquare size={10} /> },
    { label: 'Reputation', value: profile?.reputation || 0,   color: '#fbbf24', icon: <Star size={10} /> },
    { label: 'Verified', value: verified,                    color: '#34d399', icon: <Shield size={10} /> },
  ];

  /* ─── Loading ─── */
  if (loading) return (
    <div className="pf-page">
      <div className="pf-container">
        <div style={{ paddingTop: 28, marginBottom: 24 }} />
        <div className="pf-shimmer-wrap">
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 24 }}>
            <div className="pf-shimmer" style={{ width: 80, height: 80, borderRadius: 20, flexShrink: 0 }} />
            <div style={{ flex: 1, paddingTop: 6 }}>
              <div className="pf-shimmer" style={{ width: '42%', height: 28, marginBottom: 12 }} />
              <div className="pf-shimmer" style={{ width: '20%', height: 20 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[0,1,2,3].map(i => (
              <div key={i} className="pf-shimmer"
                style={{ width: 82, height: 60, borderRadius: 10, flexShrink: 0, opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        </div>
        <div className="pf-grid">
          {[0,1,2].map(i => (
            <div key={i} className="pf-shimmer"
              style={{ height: 156, borderRadius: 14, opacity: 1 - i * 0.25 }} />
          ))}
        </div>
      </div>
    </div>
  );

  /* ─── Timeout ─── */
  if (timedOut) return (
    <div className="pf-page">
      <div className="pf-container">
        <Link to="/scripts" className="pf-back"><ArrowLeft size={14} /> Back to Scripts</Link>
        <div className="pf-centered">
          <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
          <h2>Taking too long</h2>
          <p>The server didn't respond in time. Check your connection and try again.</p>
          <button className="pf-action-btn" onClick={load}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Not found ─── */
  if (!profile) return (
    <div className="pf-page">
      <div className="pf-container">
        <Link to="/scripts" className="pf-back"><ArrowLeft size={14} /> Back to Scripts</Link>
        <div className="pf-centered">
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <h2>User not found</h2>
          <p>The profile @{username?.replace('@', '')} doesn't exist.</p>
          <Link to="/scripts" className="pf-action-btn">Browse Scripts</Link>
        </div>
      </div>
    </div>
  );

  /* ─── Profile ─── */
  return (
    <div className="pf-page">
      <div className="pf-container">
        <Link to="/scripts" className="pf-back">
          <ArrowLeft size={15} /> Back to Scripts
        </Link>

        <motion.div className="pf-hero" style={{ padding: 0, overflow: 'hidden' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1] }}>
          
          {/* Banner */}
          <div style={{
            height: 220, width: '100%',
            background: profile.banner ? `url("${profile.banner}") center/cover` : 'linear-gradient(135deg, #1e2233, #0f111a)',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }} />

          <div style={{ padding: '0 32px 32px', marginTop: -50, position: 'relative' }}>
            <div className="pf-hero-row">
              <div className="pf-avatar" style={{
                width: 120, height: 120, borderRadius: '32px', border: '6px solid var(--bg-0)',
                background: profile.avatar ? `url(${profile.avatar}) center/cover` : 'linear-gradient(135deg, #818cf8, #38bdf8)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)'
              }}>
                {!profile.avatar && profile.username?.charAt(0).toUpperCase()}
              </div>

            <div className="pf-hero-info">
              <h1 className="pf-username">@{profile.username}</h1>
              <div className="pf-badges">
                {profile.role && (
                  <span className="pf-role-badge" style={{
                    background: roleStyle.bg, color: roleStyle.color,
                    border: `1px solid ${roleStyle.border}`,
                  }}>
                    <Shield size={9} /> {profile.role}
                  </span>
                )}
                {profile.badges?.map(badge => (
                  <span key={badge} className="pf-role-badge" style={{
                    background: 'rgba(255,255,255,0.05)', color: '#eaedf8',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <Award size={9} /> {badge}
                  </span>
                ))}
                {verified > 0 && (
                  <span className="pf-role-badge" style={{
                    background: 'rgba(52,211,153,0.1)', color: '#34d399',
                    border: '1px solid rgba(52,211,153,0.2)',
                  }}>
                    ✓ Script Author
                  </span>
                )}
              </div>
              {profile.joinDate && (
                <div className="pf-join-date" style={{ marginBottom: profile.bio ? '12px' : '0' }}>
                  <Calendar size={12} />
                  Joined {new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              )}
              {profile.bio && (
                <p style={{
                  fontSize: '0.88rem', color: '#9aa0bc', lineHeight: 1.6,
                  margin: '12px 0 16px', maxWidth: '500px', whiteSpace: 'pre-wrap'
                }}>
                  {profile.bio}
                </p>
              )}
              {isOwnProfile && (
                <Link to="/dashboard" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10,
                  font: 'inherit', fontSize: '0.8rem', fontWeight: 600,
                  color: '#818cf8', textDecoration: 'none',
                }}>
                  <ExternalLink size={13} /> Manage your account
                </Link>
              )}
            </div>
          </div>

          <div className="pf-stats">
            {statItems.map(s => (
              <div key={s.label} className="pf-stat">
                <div className="pf-stat-val" style={{ color: s.color }}>{s.value}</div>
                <div className="pf-stat-label">{s.icon} {s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
 
        {/* Admin Panel */}
        {(currentUser?.role === 'admin' || currentUser?.role === 'owner') && !isOwnProfile && (
          <motion.div className="pf-section" style={{
            background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.1)',
            borderRadius: '18px', padding: '24px', marginBottom: '28px'
          }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            
            <div className="pf-section-head">
              <h2 style={{ color: '#f87171' }}><Shield size={18} /> Admin Oversight</h2>
              {profile.banned && <span className="badge" style={{ background: '#ef4444', color: '#fff' }}>BANNED</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#525878', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Identity</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#9aa0bc' }}><Mail size={14} style={{ opacity: 0.5 }} /> {profile.email || 'No email provided'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#9aa0bc' }}><Fingerprint size={14} style={{ opacity: 0.5 }} /> ID: {profile.id}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#9aa0bc' }}><AlertTriangle size={14} style={{ opacity: 0.5 }} /> Warnings: {profile.warnings || 0}</div>
               </div>

               <div>
                  <div style={{ fontSize: '0.75rem', color: '#525878', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Account Controls</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="pf-action-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239,68,68,0.05)' }}
                      onClick={async () => {
                        let reason = '';
                        if (!profile.banned) {
                          reason = window.prompt('Enter ban reason (optional):');
                          if (reason === null) return;
                        } else {
                          if (!window.confirm('Unban this user?')) return;
                        }
                        await api.banUser(profile.id, currentUser.username, reason);
                        load();
                        toast.success(profile.banned ? 'User Unbanned' : 'User Banned');
                      }}>
                      <Ban size={14} /> {profile.banned ? 'Unban' : 'Ban User'}
                    </button>
                    
                    <button className="pf-action-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: '#fbbf24', color: '#fbbf24', background: 'rgba(245,158,11,0.05)' }}
                      onClick={async () => {
                        const days = window.prompt('Enter timeout duration in days (e.g. 1):', '1');
                        if (!days || isNaN(days)) return;
                        const reason = window.prompt('Enter timeout reason:');
                        if (reason === null) return;
                        await api.timeoutUser(profile.id, currentUser.username, reason, parseFloat(days));
                        load();
                        toast.success(`User timed out for ${days} days`);
                      }}>
                      <Clock size={14} /> Timeout
                    </button>

                    <button className="pf-action-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: '#fbbf24', color: '#fbbf24', background: 'rgba(245,158,11,0.05)' }}
                      onClick={async () => {
                        const reason = window.prompt('Enter warning reason:');
                        if (reason === null) return;
                        await api.warnUser(profile.id, currentUser.username, reason);
                        load();
                        toast.success('User Warned');
                      }}>
                      <AlertTriangle size={14} /> Warn
                    </button>

                    <button className="pf-action-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: '#a855f7', color: '#a855f7', background: 'rgba(168,85,247,0.05)' }}
                      onClick={async () => {
                        if (!window.confirm('Wipe all warnings for this user?')) return;
                        await api.wipeAllWarnings(profile.id, currentUser.username);
                        load();
                        toast.success('Warnings wiped');
                      }}>
                      <XCircle size={14} /> Wipe Warnings
                    </button>

                    <button className="pf-action-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: '#3b82f6', color: '#3b82f6', background: 'rgba(59,130,246,0.05)' }}
                      onClick={async () => {
                        if (!window.confirm('Reset this users avatar and banner?')) return;
                        await api.resetProfilePictures(profile.id, currentUser.username);
                        load();
                        toast.success('Profile pictures reset');
                      }}>
                      <Image size={14} /> Reset Avatar
                    </button>

                    <button className="pf-action-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: '#10b981', color: '#10b981', background: 'rgba(16,185,129,0.05)' }}
                      onClick={async () => {
                        const amount = window.prompt('Enter reputation amount (+ or -):', '1');
                        if (!amount || isNaN(amount)) return;
                        const reason = window.prompt('Enter reason for reputation change:');
                        if (reason === null) return;
                        await api.updateReputation(profile.id, currentUser.username, parseInt(amount), reason);
                        load();
                        toast.success(`Reputation updated by ${amount}`);
                      }}>
                      <Star size={14} /> Edit Rep
                    </button>

                    <button className="pf-action-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: '#3b82f6', color: '#3b82f6', background: 'rgba(59,130,246,0.05)' }}
                      onClick={async () => {
                        const badge = window.prompt('Enter badge name to grant (e.g. VIP, Trusted):');
                        if (!badge) return;
                        const repStr = window.prompt(`How much reputation to award for getting the "${badge}" badge? (e.g. 6)`, '6');
                        if (repStr === null) return;
                        const rep = parseInt(repStr) || 0;
                        try {
                          await api.grantBadge(currentUser.id, profile.id, badge);
                          if (rep !== 0) {
                            await api.updateReputation(profile.id, currentUser.username, rep, `Awarded ${badge} badge`);
                          }
                          load();
                          toast.success(`Badge "${badge}" granted${rep !== 0 ? ` with +${rep} rep!` : '!'}`);
                        } catch(err) {
                          toast.error(err.message);
                        }
                      }}>
                      <Award size={14} /> Grant Badge
                    </button>

                    <button className="pf-action-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239,68,68,0.05)' }}
                      onClick={async () => {
                        if (!window.confirm('DELETE ALL SCRIPTS? This cannot be undone.')) return;
                        const count = await api.deleteAllUserScripts(currentUser.id, profile.id);
                        load();
                        toast.success(`Deleted ${count} scripts`);
                      }}>
                      <Trash2 size={14} /> Clear All Scripts
                    </button>
                  </div>
               </div>
            </div>

            {profile.warningReasons?.length > 0 && (
              <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: '#525878', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Active Warnings</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {profile.warningReasons.map((w, idx) => (
                    <div key={w.id || idx} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', background: 'rgba(245,158,11,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.1)' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#eaedf8' }}>{w.reason}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9aa0bc', marginTop: '4px' }}>By {w.by} on {new Date(w.date).toLocaleDateString()}</div>
                      </div>
                      <button className="pf-action-btn" style={{ padding: '4px 8px', fontSize: '0.7rem', borderColor: '#34d399', color: '#34d399', background: 'rgba(52,211,153,0.1)' }}
                        onClick={async () => {
                          if (!window.confirm('Remove this warning?')) return;
                          await api.removeWarning(profile.id, currentUser.username, w.id);
                          load();
                          toast.success('Warning Removed');
                        }}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', marginTop: '20px' }}>

               <div style={{ fontSize: '0.75rem', color: '#525878', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Badge Management</div>
               <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['trusted', 'og', 'vip', 'contributor', 'staff', 'developer', 'verified', 'supporter'].map(badge => {
                    const has = profile.badges?.includes(badge);
                    return (
                      <button key={badge} className="pf-action-btn" style={{ 
                        padding: '6px 10px', fontSize: '0.7rem', textTransform: 'capitalize',
                        background: has ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)',
                        borderColor: has ? '#34d399' : 'rgba(255,255,255,0.1)',
                        color: has ? '#34d399' : '#525878'
                      }} onClick={async () => {
                        if (has) await api.revokeBadge(currentUser.id, profile.id, badge);
                        else await api.grantBadge(currentUser.id, profile.id, badge);
                        load();
                        toast.success(`Badge ${has ? 'Revoked' : 'Granted'}`);
                      }}>
                        {has ? '✓ ' : '+ '} {badge}
                      </button>
                    );
                  })}
               </div>
            </div>
          </motion.div>
        )}

        <motion.div className="pf-section"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, ease: [0.16, 1, 0.3, 1] }}>

          <div className="pf-section-head">
            <h2><Code size={18} style={{ color: '#818cf8' }} /> Scripts</h2>
            <span className="pf-count">{scripts.length} total</span>
          </div>

          {scripts.length === 0 ? (
            <div className="pf-empty">
              <Code size={28} style={{ color: '#525878', margin: '0 auto', display: 'block' }} />
              <p>
                {isOwnProfile
                  ? "You haven't uploaded any scripts yet."
                  : "This user hasn't uploaded any scripts yet."}
              </p>
              {isOwnProfile && (
                <Link to="/upload" className="pf-action-btn"
                  style={{ marginTop: 14, display: 'inline-flex' }}>
                  + Upload Your First Script
                </Link>
              )}
            </div>
          ) : (
            <div className="pf-grid">
              {scripts.map((script, i) => (
                <motion.div key={script.id}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + Math.min(i * 0.06, 0.4), ease: [0.16, 1, 0.3, 1] }}>
                  <ScriptCard script={script} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
