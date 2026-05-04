import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/db';
import { useAuth } from '../context/AuthContext';
import { copyToClipboard } from '../utils/clipboard';
import { Shield, ShieldAlert, Eye, Calendar, User, CheckCircle, ArrowLeft, ExternalLink, Star, MessageSquare, Send, Key, Unlock, ThumbsUp, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ScriptDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    api.getScriptById(id).then(async data => {
      if (data) {
        const newViews = await api.incrementViews(id);
        data.views = newViews;
        setScript(data);
        if (user && data?.ratings) {
          const myRating = data.ratings.find(r => r.userId === user.id);
          if (myRating) setRating(myRating.rating);
        }
      }
      setLoading(false);
    });
  }, [id, user]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('You must be logged in to comment');
    if (!commentText.trim()) return;
    try {
      const newComment = await api.addComment(id, commentText, user);
      setScript({ ...script, comments: [...(script.comments || []), newComment] });
      setCommentText('');
      toast.success('Comment added');
    } catch (e) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.deleteComment(id, commentId, user);
      setScript({ ...script, comments: script.comments.filter(c => c.id !== commentId) });
      toast.success('Comment deleted');
    } catch (e) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  const handleRate = async (newRating) => {
    if (!user) return toast.error('You must be logged in to rate');
    try {
      await api.rateScript(id, newRating, user);
      setRating(newRating);
      const newRatings = [...(script.ratings || [])];
      const idx = newRatings.findIndex(r => r.userId === user.id);
      if (idx >= 0) newRatings[idx].rating = newRating;
      else newRatings.push({ userId: user.id, rating: newRating });
      setScript({ ...script, ratings: newRatings });
      toast.success(`Rated ${newRating} stars`);
    } catch (e) {
      toast.error('Failed to rate script');
    }
  };

  if (loading) return <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>Loading...</div>;

  if (!script) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2>Script not found</h2>
        <Link to="/scripts" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Back to Scripts
        </Link>
      </div>
    );
  }

  const avgRating = script.ratings?.length 
    ? (script.ratings.reduce((acc, r) => acc + r.rating, 0) / script.ratings.length).toFixed(1)
    : 0;

  const canModerate = user?.role === 'admin' || user?.role === 'owner';

  return (
    <div className="container" style={{ padding: '40px 16px' }}>
      <Link to="/scripts" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '28px', color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} /> Back to Scripts
      </Link>

      <motion.div className="detail-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span className="script-game" style={{ fontSize: '0.9rem' }}>{script.game}</span>
          {script.key === true ? (
            <span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Key size={11} style={{ marginRight: '3px' }} /> Key Required
            </span>
          ) : script.key === false ? (
            <span className="badge" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Unlock size={11} style={{ marginRight: '3px' }} /> Keyless
            </span>
          ) : null}
          {script.isUniversal && (
            <span className="badge" style={{ background: 'rgba(56,189,248,0.12)', color: 'var(--accent-color)', border: '1px solid rgba(56,189,248,0.25)' }}>Universal</span>
          )}
        </div>
        <h1 className="detail-title">{script.title}</h1>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div className="meta-item">
            <User size={16} className="text-primary" />
            <span>By <Link to={`/@${script.author}`} style={{ fontWeight: 600, color: 'var(--text-color)' }}>{script.author}</Link></span>
          </div>
          <div className="meta-item">
            <Calendar size={16} className="text-muted" />
            <span>{script.date}</span>
          </div>
          <div className="meta-item">
            <Eye size={16} className="text-muted" />
            <span>{(script.views || 0).toLocaleString()} views</span>
          </div>
          <div className="meta-item">
            <ThumbsUp size={16} className="text-success" />
            <span>{script.likes || 0} likes</span>
          </div>
          <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={16} className="text-warning" fill={avgRating > 0 ? "currentColor" : "none"} />
            <span>{avgRating} ({script.ratings?.length || 0} reviews)</span>
          </div>
          <div className="meta-item">
            <span className={`status-dot ${script.status}`}></span>
            <span style={{ textTransform: 'capitalize' }}>{script.status}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '10px 20px' }}
            onClick={async () => {
              const ok = await copyToClipboard(script.code);
              if (ok) toast.success("Script copied!");
              else toast.error("Failed to copy");
            }}>
            <CheckCircle size={18} /> Copy Script
          </button>
          {script.gameLink && (
            <a href={script.gameLink} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '10px 20px' }}>
              <ExternalLink size={18} /> Play Game
            </a>
          )}
        </div>
      </motion.div>

      <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <h3 style={{ marginBottom: '12px' }}>Description</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '32px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
            {script.description}
          </p>

          <h3 style={{ marginBottom: '12px' }}>Source Code</h3>
          <div className="code-block" style={{ marginBottom: '36px' }}>
            <div className="code-header">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Lua</span>
              <button 
                style={{ background: 'none', color: 'var(--text-color)', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem' }}
                onClick={async () => {
                  const ok = await copyToClipboard(script.code);
                  if (ok) toast.success("Copied!");
                  else toast.error("Failed");
                }}>
                <CheckCircle size={13} /> Copy
              </button>
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{script.code}</pre>
          </div>

          {/* Reviews & Comments */}
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={22} className="text-primary" />
            Reviews & Comments ({script.comments?.length || 0})
          </h3>
          
          {user ? (
            <form onSubmit={handleComment} style={{ marginBottom: '24px', display: 'flex', gap: '10px' }}>
              <input 
                type="text" className="input-field" 
                placeholder="Write a comment or review..." 
                value={commentText} onChange={e => setCommentText(e.target.value)}
                style={{ flex: 1, margin: 0 }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}><Send size={16} /></button>
            </form>
          ) : (
            <div style={{ padding: '14px', background: 'var(--bg-color-lighter)', borderRadius: '8px', marginBottom: '24px', textAlign: 'center' }}>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}><Link to="/login" style={{ color: 'var(--primary-color)' }}>Log in</Link> to leave a review.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence>
              {(!script.comments || script.comments.length === 0) ? (
                <p className="text-muted">No comments yet.</p>
              ) : (
                script.comments.map((comment, i) => (
                  <motion.div key={comment.id || i} className="glass-card" style={{ padding: '14px' }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <Link to={`/@${comment.username}`} style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '0.88rem' }}>
                        @{comment.username}
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{comment.date}</span>
                        {(canModerate || (user && String(comment.userId) === String(user.id))) && (
                          <button onClick={() => handleDeleteComment(comment.id)} style={{ background: 'none', color: 'var(--danger)', padding: '2px' }} title="Delete">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-color)', fontSize: '0.9rem', margin: 0 }}>{comment.text}</p>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '18px' }}>Security Status</h3>
            {script.verified ? (
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                <Shield size={36} className="text-success" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ color: 'var(--success)', marginBottom: '4px', fontSize: '0.95rem' }}>Verified Safe</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Reviewed by admins.</p>
              </div>
            ) : (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                <ShieldAlert size={36} className="text-warning" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ color: 'var(--warning)', marginBottom: '4px', fontSize: '0.95rem' }}>Pending Review</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Awaiting verification.</p>
              </div>
            )}
            
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '0.88rem' }}>Supported Executors</h4>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(script.executors && script.executors.length > 0) ? script.executors.map(exec => (
                  <span key={exec} className="badge" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.78rem', padding: '4px 10px' }}>{exec}</span>
                )) : (
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.78rem', padding: '4px 10px' }}>Unknown</span>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '14px', fontSize: '1rem' }}>Rate this Script</h3>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{ 
                    background: 'none', border: 'none', cursor: 'pointer', 
                    color: star <= (hoverRating || rating) ? 'var(--warning)' : 'var(--text-muted)', 
                    transition: 'color 0.15s, transform 0.15s',
                    transform: star <= hoverRating ? 'scale(1.2)' : 'scale(1)'
                  }}
                >
                  <Star size={28} fill={star <= (hoverRating || rating) ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--warning)', fontFamily: 'Outfit' }}>{avgRating}</span>
              <span className="text-muted" style={{ fontSize: '0.82rem', marginLeft: '6px' }}>/ 5 ({script.ratings?.length || 0} reviews)</span>
            </div>
            {!user && <p style={{ fontSize: '0.82rem', textAlign: 'center', color: 'var(--text-muted)', marginTop: '8px' }}>Login to rate</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ScriptDetails;
