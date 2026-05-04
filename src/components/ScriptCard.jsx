import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Shield, ShieldAlert, Code, CheckCircle, ThumbsUp, Share2, Key, Unlock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/db';
import { copyToClipboard } from '../utils/clipboard';
import toast from 'react-hot-toast';

const ScriptCard = ({ script }) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(script.likes || 0);
  const [liked, setLiked] = useState(script.likedBy?.some(id => String(id) === String(user?.id)) || false);

  const isOwnScript = user && String(script.authorId) === String(user.id);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error('Login to like scripts');
    if (isOwnScript) return toast.error('Cannot like your own script');
    try {
      const result = await api.likeScript(script.id, user);
      setLikes(result.likes);
      setLiked(result.liked);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/script/${script.id}`;
    const ok = await copyToClipboard(url);
    if (ok) toast.success('Script URL copied!');
    else toast.error('Failed to copy URL');
  };

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyToClipboard(script.code);
    if (ok) toast.success('Script copied to clipboard!');
    else toast.error('Failed to copy script');
  };

  const avgRating = script.ratings?.length
    ? (script.ratings.reduce((acc, r) => acc + r.rating, 0) / script.ratings.length).toFixed(1)
    : null;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card"
      style={{ padding: '14px' }}
    >
      <div className="script-card-header" style={{ marginBottom: '8px' }}>
        <div style={{ minWidth: 0 }}>
          <span className="script-game" style={{ fontSize: '0.68rem', marginBottom: '2px' }}>{script.game}</span>
          <h3 className="script-title" style={{ fontSize: '0.95rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{script.title}</h3>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flexShrink: 0 }}>
          {script.verified ? (
            <span className="badge verified" title="Verified Safe">
              <Shield size={10} style={{ marginRight: '2px', verticalAlign: 'text-bottom' }} />
              Verified
            </span>
          ) : (
            <span className="badge pending" title="Pending">
              <ShieldAlert size={10} style={{ marginRight: '2px', verticalAlign: 'text-bottom' }} />
              Pending
            </span>
          )}
          {script.key === true ? (
            <span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Key size={10} style={{ marginRight: '2px' }} /> Key
            </span>
          ) : script.key === false ? (
            <span className="badge" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Unlock size={10} style={{ marginRight: '2px' }} /> Keyless
            </span>
          ) : null}
        </div>
      </div>

      <p className="script-desc" style={{ fontSize: '0.78rem', marginBottom: '10px', WebkitLineClamp: 2 }}>{script.description}</p>

      <div className="script-meta" style={{ gap: '8px', fontSize: '0.75rem', marginBottom: '10px' }}>
        <div className="meta-item">
          <Eye size={12} />
          {(script.views || 0).toLocaleString()}
        </div>
        <div className="meta-item"
          style={{
            cursor: isOwnScript ? 'not-allowed' : 'pointer',
            color: liked ? 'var(--primary-color)' : undefined,
            opacity: isOwnScript ? 0.5 : 1
          }}
          onClick={handleLike}
          title={isOwnScript ? 'Cannot like your own script' : liked ? 'Unlike' : 'Like'}
        >
          <ThumbsUp size={12} fill={liked ? 'currentColor' : 'none'} />
          {likes}
        </div>
        {avgRating && (
          <div className="meta-item" style={{ color: 'var(--warning)' }}>
            <Star size={11} fill="currentColor" /> {avgRating}
          </div>
        )}
        <div className="meta-item" style={{ marginLeft: 'auto' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            by <Link to={`/@${script.author}`} style={{ color: 'var(--text-color)', fontWeight: 500 }} onClick={e => e.stopPropagation()}>{script.author}</Link>
          </span>
        </div>
      </div>

      {/* Executor Compatibility */}
      {script.executors && script.executors.length > 0 && (
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {script.executors.slice(0, 3).map(exec => (
            <span key={exec} style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)', border: '1px solid rgba(99,102,241,0.2)' }}>{exec}</span>
          ))}
          {script.executors.length > 3 && (
            <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>+{script.executors.length - 3}</span>
          )}
        </div>
      )}

      <div className="script-actions" style={{ display: 'flex', gap: '5px' }}>
        <button className="btn btn-secondary" onClick={handleShare} title="Share" style={{ padding: '5px 8px', fontSize: '0.78rem' }}>
          <Share2 size={12} />
        </button>
        <Link to={`/script/${script.id}`} className="btn btn-secondary" style={{ flex: 1, padding: '5px 8px', fontSize: '0.78rem' }}>
          <Code size={12} /> View
        </Link>
        <button className="btn btn-primary" onClick={handleCopy} style={{ flex: 1, padding: '5px 8px', fontSize: '0.78rem' }}>
          <CheckCircle size={12} /> Copy
        </button>
      </div>
    </motion.div>
  );
};

export default ScriptCard;
