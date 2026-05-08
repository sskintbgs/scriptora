import { useState, useEffect, useRef } from 'react';
import { api } from '../api/db';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldAlert, CheckCircle, Edit, Trash2, X, Save, Eye, ThumbsUp, XCircle, Search, MessageSquare, Star, Key, Unlock, Filter, ArrowLeft, Send, Tag, Clock, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const PRIORITIES = ['low','medium','high','urgent'];
const PRI_COLORS = { low:'var(--text-muted)', medium:'var(--warning)', high:'var(--danger)', urgent:'#dc2626' };

const Admin = () => {
  const { user } = useAuth();
  const [scripts, setScripts] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [mainTab, setMainTab] = useState(user?.role === 'support' ? 'tickets' : 'scripts');
  const [editingScript, setEditingScript] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScript, setSelectedScript] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketFilter, setTicketFilter] = useState('all');
  const chatEnd = useRef(null);
  const isSupport = user?.role === 'support' || user?.role === 'admin' || user?.role === 'owner';

  useEffect(() => { 
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [activeTicket?.messages]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'owner') refreshScripts();
    if (isSupport) {
      loadTickets();
      const iv = setInterval(loadTickets, 3000);
      return () => clearInterval(iv);
    }
  }, [user]);

  const refreshScripts = () => api.getAllScripts().then(s => setScripts(s || []));
  const loadTickets = async () => {
    try { 
      const r = await fetch(`/api/tickets?userId=${user.id}`); 
      if(r.ok) {
        const data = await r.json();
        setTickets(data);
        setActiveTicket(prev => prev ? data.find(t => t.id === prev.id) || null : null);
      }
    } catch{}
  };

  const handleVerify = async (id) => {
    try {
      await api.verifyScript(id, user);
      toast.success('Script verified');
      refreshScripts();
    } catch (err) { toast.error(err.message); }
  };

  const handleUnverify = async (id) => {
    try {
      await api.unverifyScript(id, user);
      toast.success('Script unverified');
      refreshScripts();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Permanently delete this script?')) {
      try {
        await api.deleteScript(id, user);
        toast.success('Script deleted');
        setSelectedScript(null);
        refreshScripts();
      } catch (err) { toast.error(err.message); }
    }
  };

  const handleDeleteComment = async (scriptId, commentId) => {
    try {
      await api.deleteComment(scriptId, commentId, user);
      toast.success('Comment deleted');
      refreshScripts();
      if (selectedScript) {
        setSelectedScript({
          ...selectedScript,
          comments: selectedScript.comments.filter(c => c.id !== commentId)
        });
      }
    } catch (err) { toast.error(err.message); }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateScript(editingScript.id, {
        title: editingScript.title, game: editingScript.game,
        description: editingScript.description, code: editingScript.code,
        status: editingScript.status
      }, user);
      toast.success('Script updated');
      setEditingScript(null);
      refreshScripts();
    } catch (err) { toast.error(err.message); }
  };

  if (user?.role !== 'admin' && user?.role !== 'owner' && user?.role !== 'support') {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <ShieldAlert size={64} className="text-danger" style={{ margin: '0 auto 24px' }} />
        <h1>Access Denied</h1>
        <p className="text-muted">Staff access required.</p>
      </div>
    );
  }

  const handleTicketReply = async (id) => {
    if(!ticketReply.trim()) return;
    try {
      const r = await fetch(`/api/tickets/${id}/reply`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: user.id, username: user.username, message: ticketReply, isStaff: true }) });
      const d = await r.json(); if(!r.ok) throw new Error(d.error);
      setTicketReply(''); setActiveTicket(d); loadTickets();
    } catch(e) { toast.error(e.message); }
  };
  const handleTicketStatus = async (id, status) => {
    try {
      const r = await fetch(`/api/tickets/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: user.id, status }) });
      if(r.ok) { const d = await r.json(); setActiveTicket(d); loadTickets(); toast.success(`Ticket ${status}`); }
    } catch{}
  };
  const handleTicketPriority = async (id, priority) => {
    try {
      const r = await fetch(`/api/tickets/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: user.id, priority }) });
      if(r.ok) { const d = await r.json(); setActiveTicket(d); loadTickets(); toast.success(`Priority set to ${priority}`); }
    } catch{}
  };
  const handleClaimTicket = async (id) => {
    try {
      const r = await fetch(`/api/tickets/${id}/claim`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: user.id, username: user.username }) });
      if(r.ok) { const d = await r.json(); setActiveTicket(d); loadTickets(); toast.success('Ticket claimed'); }
    } catch{}
  };

  const filteredScripts = scripts.filter(s => {
    const matchesTab = activeTab === 'pending' ? !s.verified : activeTab === 'verified' ? s.verified : true;
    const matchesSearch = !searchQuery || 
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.game?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.id).includes(searchQuery);
    return matchesTab && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
    if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
    if (sortBy === 'comments') return (b.comments?.length || 0) - (a.comments?.length || 0);
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  const pendingCount = scripts.filter(s => !s.verified).length;
  const verifiedCount = scripts.filter(s => s.verified).length;
  const totalComments = scripts.reduce((s, sc) => s + (sc.comments?.length || 0), 0);
  const avgRating = (() => {
    const all = scripts.flatMap(s => s.ratings || []);
    return all.length ? (all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1) : '—';
  })();

  return (
    <div className="container" style={{ padding: '40px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '2rem', marginBottom: '6px' }}>
            <Shield className="text-primary" size={30} /> Admin Dashboard
          </h1>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>Manage scripts, moderate content, handle support.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Pending', value: pendingCount, color: 'var(--warning)' },
            { label: 'Verified', value: verifiedCount, color: 'var(--success)' },
            { label: 'Tickets', value: tickets.length, color: 'var(--primary-color)' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding: '10px 18px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {(user?.role === 'admin' || user?.role === 'owner') && (
          <button className={`btn ${mainTab === 'scripts' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMainTab('scripts')} style={{ padding: '8px 18px' }}>
            <Edit size={14} style={{ marginRight: '4px' }} /> Scripts
          </button>
        )}
        <button className={`btn ${mainTab === 'tickets' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMainTab('tickets')} style={{ padding: '8px 18px' }}>
          <MessageSquare size={14} style={{ marginRight: '4px' }} /> Tickets ({tickets.filter(t => t.status !== 'closed').length})
        </button>
      </div>

      {/* ===== TICKETS TAB ===== */}
      {mainTab === 'tickets' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {activeTicket ? (
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color-lighter)' }}>
                <button onClick={() => setActiveTicket(null)} style={{ background:'none', color:'var(--text-muted)', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:'4px', cursor:'pointer', border:'none', padding:0, marginBottom:'6px' }}>
                  <ArrowLeft size={13} /> Back to tickets
                </button>
                <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'8px' }}>
                  <div>
                    <h3 style={{ fontSize:'1.05rem', margin:'0 0 6px 0' }}>{activeTicket.subject}</h3>
                    <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', alignItems:'center' }}>
                      <span className="badge" style={{ background: activeTicket.status === 'open' ? 'rgba(245,158,11,0.1)' : activeTicket.status === 'replied' ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', color: activeTicket.status === 'open' ? 'var(--warning)' : activeTicket.status === 'replied' ? 'var(--success)' : 'var(--text-muted)', fontSize:'0.66rem' }}>
                        {activeTicket.status}
                      </span>
                      <span className="badge" style={{ background:'rgba(99,102,241,0.06)', color:'var(--text-muted)', fontSize:'0.66rem' }}>{activeTicket.category}</span>
                      <span className="text-muted" style={{ fontSize:'0.7rem' }}>by @{activeTicket.username}</span>
                      {activeTicket.claimedBy && <span style={{ fontSize:'0.68rem', color:'var(--success)' }}><UserCheck size={11} /> {activeTicket.claimedBy}</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'5px', alignItems:'center', flexWrap:'wrap' }}>
                    <select className="input-field" value={activeTicket.priority || 'medium'} onChange={e => handleTicketPriority(activeTicket.id, e.target.value)}
                      style={{ margin:0, padding:'4px 8px', fontSize:'0.75rem', width:'auto', borderRadius:'8px', color: PRI_COLORS[activeTicket.priority] || 'var(--text-muted)' }}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                    {!activeTicket.claimedBy && <button className="btn btn-secondary" onClick={() => handleClaimTicket(activeTicket.id)} style={{ padding:'5px 10px', fontSize:'0.72rem' }}><UserCheck size={12} /> Claim</button>}
                    {activeTicket.status !== 'closed' && <button className="btn btn-danger" onClick={() => handleTicketStatus(activeTicket.id, 'closed')} style={{ padding:'5px 10px', fontSize:'0.72rem' }}>Close</button>}
                    {activeTicket.status === 'closed' && <button className="btn btn-secondary" onClick={() => handleTicketStatus(activeTicket.id, 'open')} style={{ padding:'5px 10px', fontSize:'0.72rem' }}>Reopen</button>}
                  </div>
                </div>
              </div>
              <div style={{ padding:'16px 20px', maxHeight:'450px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'10px', background:'var(--bg-color)' }}>
                {activeTicket.messages.map(msg => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} style={{ alignSelf: msg.isStaff ? 'flex-end' : 'flex-start', maxWidth:'75%' }}>
                    <div style={{ padding:'10px 14px', borderRadius: msg.isStaff ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: msg.isStaff ? 'var(--primary-color)' : 'var(--bg-color-lighter)', color: msg.isStaff ? '#fff' : 'var(--text-color)', border: msg.isStaff ? 'none' : '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <div style={{ display:'flex', gap:'5px', alignItems:'center', marginBottom:'4px' }}>
                        <span style={{ fontSize:'0.72rem', fontWeight:700, color: msg.isStaff ? 'rgba(255,255,255,0.9)' : 'var(--primary-color)' }}>{msg.isStaff && <Shield size={10} style={{ marginRight: '3px', verticalAlign: 'middle' }} />}{msg.username}</span>
                        <span style={{ fontSize:'0.6rem', color: msg.isStaff ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>{new Date(msg.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p style={{ fontSize:'0.88rem', lineHeight:1.5, margin:0, wordBreak:'break-word', whiteSpace:'pre-wrap' }}>{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEnd} />
              </div>
              {activeTicket.status !== 'closed' && (
                <div style={{ padding:'10px 18px', borderTop:'1px solid var(--border-color)', display:'flex', gap:'8px', background:'var(--bg-color-lighter)' }}>
                  <input type="text" className="input-field" placeholder="Staff reply..." value={ticketReply} onChange={e => setTicketReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleTicketReply(activeTicket.id)} style={{ flex:1, borderRadius:'10px', margin:0 }} />
                  <button className="btn btn-primary" onClick={() => handleTicketReply(activeTicket.id)} style={{ padding:'8px 14px' }}><Send size={14} /></button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ display:'flex', gap:'6px', marginBottom:'12px', flexWrap:'wrap' }}>
                {['all','open','replied','closed'].map(s => (
                  <button key={s} onClick={() => setTicketFilter(s)} className={`btn ${ticketFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding:'5px 12px', fontSize:'0.78rem', textTransform:'capitalize' }}>
                    {s} ({s === 'all' ? tickets.length : tickets.filter(t => t.status === s).length})
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {(ticketFilter === 'all' ? tickets : tickets.filter(t => t.status === ticketFilter))
                  .sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                  .map(ticket => (
                  <motion.div key={ticket.id} className="glass-card" style={{ padding:'12px 16px', cursor:'pointer' }}
                    whileHover={{ y:-2 }} onClick={() => { setActiveTicket(ticket); setTicketReply(''); }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'10px' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', gap:'5px', alignItems:'center', marginBottom:'4px', flexWrap:'wrap' }}>
                          <span className="badge" style={{ background: ticket.status === 'open' ? 'rgba(245,158,11,0.1)' : ticket.status === 'replied' ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', color: ticket.status === 'open' ? 'var(--warning)' : ticket.status === 'replied' ? 'var(--success)' : 'var(--text-muted)', fontSize:'0.63rem' }}>{ticket.status}</span>
                          <span style={{ fontSize:'0.65rem', color: PRI_COLORS[ticket.priority] || 'var(--text-muted)' }}>{(ticket.priority || 'medium').toUpperCase()}</span>
                          <span className="text-muted" style={{ fontSize:'0.65rem' }}>@{ticket.username}</span>
                          {ticket.claimedBy && <span style={{ fontSize:'0.63rem', color:'var(--success)' }}><UserCheck size={10} /> {ticket.claimedBy}</span>}
                        </div>
                        <h4 style={{ fontSize:'0.88rem', marginBottom:'2px' }}>{ticket.subject}</h4>
                        <p className="text-muted" style={{ fontSize:'0.7rem', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'400px' }}>{ticket.messages[ticket.messages.length-1]?.text}</p>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{ticket.messages.length} msgs</div>
                        <div style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>{new Date(ticket.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {tickets.length === 0 && <div className="glass-card" style={{ padding:'40px', textAlign:'center' }}><p className="text-muted">No tickets yet.</p></div>}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ===== SCRIPTS TAB ===== */}
      {mainTab === 'scripts' && (user?.role === 'admin' || user?.role === 'owner') && (
        <>
      {/* Edit Modal */}
      <AnimatePresence>
        {editingScript && (
          <motion.div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem' }}>Editing: {editingScript.title}</h2>
              <button className="btn btn-secondary" onClick={() => setEditingScript(null)} style={{ padding: '6px 12px' }}><X size={14} /></button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Title</label>
                  <input type="text" className="input-field" value={editingScript.title} onChange={e => setEditingScript({...editingScript, title: e.target.value})} required style={{ margin: 0 }} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Game</label>
                  <input type="text" className="input-field" value={editingScript.game} onChange={e => setEditingScript({...editingScript, game: e.target.value})} required style={{ margin: 0 }} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Status</label>
                  <select className="input-field" value={editingScript.status} onChange={e => setEditingScript({...editingScript, status: e.target.value})} style={{ margin: 0 }}>
                    <option value="working">Working</option>
                    <option value="patched">Patched</option>
                  </select>
                </div>
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Description</label>
                <textarea className="input-field" value={editingScript.description} onChange={e => setEditingScript({...editingScript, description: e.target.value})} rows="3" required style={{ margin: 0 }} />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Source Code</label>
                <textarea className="input-field" value={editingScript.code} onChange={e => setEditingScript({...editingScript, code: e.target.value})} rows="5" style={{ fontFamily: 'Consolas, monospace', fontSize: '0.85rem', margin: 0 }} required />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}><Save size={16} /> Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingScript(null)} style={{ padding: '10px 20px' }}>Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Inspector Modal */}
      <AnimatePresence>
        {selectedScript && (
          <>
            <motion.div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedScript(null)} />
            <motion.div style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              zIndex: 301, width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto',
              background: 'var(--bg-color-light)', border: '1px solid var(--border-color)',
              borderRadius: '14px', padding: '24px'
            }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3>Comments on "{selectedScript.title}"</h3>
                <button onClick={() => setSelectedScript(null)} className="btn btn-secondary" style={{ padding: '5px 9px' }}>✕</button>
              </div>
              {(!selectedScript.comments || selectedScript.comments.length === 0) ? (
                <p className="text-muted">No comments on this script.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedScript.comments.map((c, i) => (
                    <div key={c.id || i} className="glass-card" style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '0.85rem' }}>@{c.username}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="text-muted" style={{ fontSize: '0.72rem' }}>{c.date}</span>
                          <button onClick={() => handleDeleteComment(selectedScript.id, c.id)}
                            className="btn btn-danger" style={{ padding: '3px 6px', fontSize: '0.72rem' }}>
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.88rem' }}>{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!editingScript && (
        <motion.div className="admin-table-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', gap: '6px', padding: '12px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color-lighter)', alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { key: 'pending', label: `Pending (${pendingCount})` },
              { key: 'verified', label: `Verified (${verifiedCount})` },
              { key: 'all', label: `All (${scripts.length})` },
            ].map(t => (
              <button key={t.key} className={`btn ${activeTab === t.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab(t.key)} style={{ padding: '5px 12px', fontSize: '0.8rem' }}>{t.label}</button>
            ))}
            <select className="input-field" value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ maxWidth: '140px', margin: 0, padding: '5px 10px', fontSize: '0.8rem' }}>
              <option value="date">Sort: Date</option>
              <option value="views">Sort: Views</option>
              <option value="likes">Sort: Likes</option>
              <option value="comments">Sort: Comments</option>
            </select>
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="input-field" placeholder="Search..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '30px', maxWidth: '200px', margin: 0, fontSize: '0.82rem' }} />
            </div>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title / Game</th>
                <th>Author</th>
                <th>Stats</th>
                <th>Key</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScripts.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px' }} className="text-muted">No scripts found.</td></tr>
              ) : filteredScripts.map(script => {
                const avg = script.ratings?.length ? (script.ratings.reduce((s,r) => s+r.rating, 0)/script.ratings.length).toFixed(1) : '—';
                return (
                <tr key={script.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{script.id}</td>
                  <td>
                    <div style={{ fontWeight: 500, marginBottom: '2px', fontSize: '0.88rem' }}>{script.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)' }}>{script.game}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{script.author}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Eye size={12} /> {script.views || 0}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><ThumbsUp size={12} /> {script.likes || 0}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--warning)' }}><Star size={11} fill="currentColor" /> {avg}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', color: 'var(--accent-color)' }}
                        onClick={() => setSelectedScript(script)}>
                        <MessageSquare size={12} /> {script.comments?.length || 0}
                      </span>
                    </div>
                  </td>
                  <td>
                    {script.key === true ? (
                      <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', fontSize: '0.68rem' }}><Key size={9} /> Key</span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', fontSize: '0.68rem' }}><Unlock size={9} /> Free</span>
                    )}
                  </td>
                  <td>
                    {script.verified ? (
                      <span className="badge verified" style={{ fontSize: '0.68rem' }}><CheckCircle size={10} /> Verified</span>
                    ) : (
                      <span className="badge pending" style={{ fontSize: '0.68rem' }}><ShieldAlert size={10} /> Pending</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      {!script.verified ? (
                        <button className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={() => handleVerify(script.id)} title="Verify"><CheckCircle size={13} /></button>
                      ) : (
                        <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleUnverify(script.id)} title="Unverify"><XCircle size={13} /></button>
                      )}
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setSelectedScript(script)} title="View Comments"><MessageSquare size={13} /></button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setEditingScript({...script})} title="Edit"><Edit size={13} /></button>
                      <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(script.id)} title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </motion.div>
      )}
      </>
      )}
    </div>
  );
};

export default Admin;
