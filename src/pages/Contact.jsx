import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Shield, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATS = [
  { value: 'general', label: 'General' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'report', label: 'Report User' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'account', label: 'Account Issue' },
];

const Contact = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('open');
  const [form, setForm] = useState({ subject: '', message: '', category: 'general' });
  const chatEnd = useRef(null);

  useEffect(() => { if (user) loadTickets(); }, [user]);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeTicket?.messages]);

  const loadTickets = async () => {
    try { const r = await fetch(`/api/tickets/user/${user.id}`); if (r.ok) setTickets(await r.json()); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return toast.error('Fill in all fields');
    setLoading(true);
    try {
      const r = await fetch('/api/tickets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, username: user.username, ...form })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success('Ticket created');
      setForm({ subject: '', message: '', category: 'general' });
      setShowForm(false);
      loadTickets();
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      const r = await fetch(`/api/tickets/${id}/reply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, username: user.username, message: replyText, isStaff: false })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setReplyText('');
      setActiveTicket(d);
      loadTickets();
    } catch (err) { toast.error(err.message); }
  };

  if (!user) return <Navigate to="/login" />;

  const counts = { all: tickets.length, open: tickets.filter(t => t.status === 'open' || t.status === 'replied').length, closed: tickets.filter(t => t.status === 'closed').length };
  const filtered = tickets
    .filter(t => filter === 'all' ? true : filter === 'open' ? (t.status === 'open' || t.status === 'replied') : t.status === 'closed')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const statusColor = (s) => s === 'open' ? '#f59e0b' : s === 'replied' ? '#10b981' : '#6b7280';

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '36px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Outfit' }}>Support Tickets</h2>
        {!showForm && !activeTicket && (
          <button onClick={() => setShowForm(true)} style={{
            padding: '7px 16px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
            background: 'var(--primary-color)', color: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}><Plus size={14} /> New Ticket</button>
        )}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '18px', background: 'var(--bg-color-lighter)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>New Ticket</span>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="input-field" style={{ marginBottom: '8px', borderRadius: '6px', fontSize: '0.82rem' }}>
                  {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <input type="text" className="input-field" placeholder="Subject" maxLength={100}
                  value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  style={{ marginBottom: '8px', borderRadius: '6px', fontSize: '0.82rem' }} />
                <textarea className="input-field" placeholder="Describe your issue..." rows={3} maxLength={2000}
                  value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  style={{ resize: 'vertical', borderRadius: '6px', fontSize: '0.82rem', minHeight: '70px' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="submit" disabled={loading} style={{
                    padding: '7px 18px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
                    background: 'var(--primary-color)', color: '#fff', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', opacity: loading ? 0.6 : 1
                  }}><Send size={13} /> {loading ? 'Sending...' : 'Submit'}</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat view */}
      {activeTicket ? (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Chat header */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color-lighter)' }}>
            <button onClick={() => setActiveTicket(null)} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0,
              fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '6px'
            }}><ArrowLeft size={12} /> back</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 3px', fontSize: '0.95rem' }}>{activeTicket.subject}</h3>
                <div style={{ display: 'flex', gap: '6px', fontSize: '0.68rem' }}>
                  <span style={{ color: statusColor(activeTicket.status), fontWeight: 600 }}>{activeTicket.status.toUpperCase()}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{CATS.find(c => c.value === activeTicket.category)?.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ padding: '12px 14px', maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activeTicket.messages.map(msg => (
              <div key={msg.id} style={{ alignSelf: msg.isStaff ? 'flex-start' : 'flex-end', maxWidth: '78%' }}>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: msg.isStaff ? '2px 10px 10px 10px' : '10px 2px 10px 10px',
                  background: msg.isStaff ? 'rgba(16,185,129,0.06)' : 'rgba(99,102,241,0.06)',
                  border: `1px solid ${msg.isStaff ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)'}`,
                }}>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: msg.isStaff ? '#10b981' : '#6366f1' }}>
                      {msg.isStaff && <Shield size={9} style={{ marginRight: '2px', verticalAlign: 'middle' }} />}{msg.username}
                    </span>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{new Date(msg.date).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatEnd} />
          </div>

          {/* Reply box */}
          {activeTicket.status !== 'closed' ? (
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '6px', background: 'var(--bg-color-lighter)' }}>
              <input type="text" className="input-field" placeholder="Reply..." value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReply(activeTicket.id)}
                style={{ flex: 1, borderRadius: '6px', margin: 0, fontSize: '0.82rem' }} />
              <button onClick={() => handleReply(activeTicket.id)} style={{
                padding: '6px 12px', borderRadius: '6px', background: 'var(--primary-color)', color: '#fff',
                border: 'none', cursor: 'pointer'
              }}><Send size={13} /></button>
            </div>
          ) : (
            <div style={{ padding: '10px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ticket closed</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}>
            {[
              { key: 'open', label: `Open (${counts.open})` },
              { key: 'all', label: `All (${counts.all})` },
              { key: 'closed', label: `Closed (${counts.closed})` },
            ].map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                padding: '9px 18px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 500,
                color: filter === tab.key ? 'var(--text-color)' : 'var(--text-muted)',
                borderBottom: filter === tab.key ? '2px solid var(--primary-color)' : '2px solid transparent',
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Ticket list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.85rem' }}>{filter === 'open' ? 'No open tickets' : filter === 'closed' ? 'No closed tickets' : 'No tickets yet'}</p>
              <p style={{ fontSize: '0.72rem' }}>Click "New Ticket" to get help</p>
            </div>
          ) : (
            <div>
              {filtered.map((ticket, i) => {
                const last = ticket.messages[ticket.messages.length - 1];
                const hasStaffReply = ticket.messages.some(m => m.isStaff);
                return (
                  <motion.div key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    onClick={() => { setActiveTicket(ticket); setReplyText(''); }}
                    style={{
                      padding: '12px 14px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor(ticket.status), flexShrink: 0 }} />
                          <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{ticket.subject}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          <span>{CATS.find(c => c.value === ticket.category)?.label}</span>
                          <span>·</span>
                          <span>{ticket.messages.length} msg{ticket.messages.length !== 1 ? 's' : ''}</span>
                          {hasStaffReply && <span style={{ color: '#10b981' }}>· staff replied</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {new Date(ticket.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Contact;
