import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, UserPlus, MessageSquare, Check, CheckCircle, XCircle, Code } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NOTIF_CONFIG = {
  follow: { icon: <UserPlus size={15} />, color: '#6366f1' },
  ticket_reply: { icon: <MessageSquare size={15} />, color: '#10b981' },
  script_verified: { icon: <CheckCircle size={15} />, color: '#10b981' },
  script_denied: { icon: <XCircle size={15} />, color: '#ef4444' },
  new_script: { icon: <Code size={15} />, color: '#8b5cf6' },
};

function notifText(n) {
  switch (n.type) {
    case 'follow': return <><Link to={`/u/${n.fromUser}`} style={{ fontWeight: 600, color: '#6366f1' }}>@{n.fromUser}</Link> started following you</>;
    case 'ticket_reply': return <>Staff replied to your ticket <span style={{ color: 'var(--text-muted)' }}>"{n.subject}"</span></>;
    case 'script_verified': return <>Your script <span style={{ fontWeight: 600, color: '#10b981' }}>"{n.scriptTitle}"</span> was verified!</>;
    case 'script_denied': return <>Your script <span style={{ fontWeight: 600, color: '#ef4444' }}>"{n.scriptTitle}"</span> was unverified</>;
    case 'new_script': return <><Link to={`/u/${n.fromUser}`} style={{ fontWeight: 600, color: '#8b5cf6' }}>@{n.fromUser}</Link> posted "{n.scriptTitle}"</>;
    default: return 'New notification';
  }
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d` : new Date(date).toLocaleDateString();
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/notifications/${user.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setNotifs)
      .finally(() => setLoading(false));
  }, [user]);

  const markRead = async (id) => {
    await fetch('/api/notifications/read', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, notifId: id })
    });
    setNotifs(prev => prev.map(n => String(n.id) === String(id) ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications/read', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, notifId: 'all' })
    });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All marked as read');
  };

  if (!user) return <Navigate to="/login" />;

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div style={{ maxWidth: '620px', margin: '0 auto', padding: '36px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={20} />
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontFamily: 'Outfit' }}>Notifications</h2>
          {unread > 0 && <span style={{ fontSize: '0.7rem', background: '#ef4444', color: '#fff', padding: '1px 7px', borderRadius: '8px', fontWeight: 600 }}>{unread}</span>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} style={{
            background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-muted)',
            padding: '5px 12px', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
          }}><Check size={12} /> Mark all read</button>
        )}
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading...</p> : notifs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Bell size={32} style={{ opacity: 0.2, marginBottom: '10px', color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nothing here yet</p>
        </div>
      ) : (
        <div>
          {notifs.map((n, i) => {
            const cfg = NOTIF_CONFIG[n.type] || { icon: <Bell size={15} />, color: 'var(--text-muted)' };
            return (
              <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                onClick={() => !n.read && markRead(n.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px',
                  borderBottom: '1px solid var(--border-color)',
                  background: n.read ? 'transparent' : 'rgba(99,102,241,0.03)',
                  cursor: n.read ? 'default' : 'pointer',
                }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${cfg.color}15`, color: cfg.color,
                }}>{cfg.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.4 }}>{notifText(n)}</p>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>{timeAgo(n.date)}</span>
                {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
