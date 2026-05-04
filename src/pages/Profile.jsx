import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Code, Eye, ThumbsUp, ThumbsDown, Star, Calendar, Shield, Award, MessageSquare, Edit3, Save, X, UserPlus, UserMinus, Search, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ScriptCard from '../components/ScriptCard';
import toast from 'react-hot-toast';

const BADGE_CONFIG = {
  trusted: { label: 'Trusted', color: '#10b981', icon: '✅' },
  friend: { label: 'Friend', color: '#8b5cf6', icon: '💜' },
  og: { label: 'OG', color: '#f59e0b', icon: '⭐' },
  vip: { label: 'VIP', color: '#ef4444', icon: '👑' },
  contributor: { label: 'Contributor', color: '#3b82f6', icon: '🔧' },
  staff: { label: 'Staff', color: '#ec4899', icon: '🛡️' },
  verified: { label: 'Verified', color: '#06b6d4', icon: '✓' },
  developer: { label: 'Developer', color: '#14b8a6', icon: '💻' },
  supporter: { label: 'Supporter', color: '#f97316', icon: '❤️' },
};
const ALL_BADGES = Object.keys(BADGE_CONFIG);

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showBadgePanel, setShowBadgePanel] = useState(false);
  const [activeTab, setActiveTab] = useState('scripts');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCount, setShowCount] = useState(15);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [avatarModal, setAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarScale, setAvatarScale] = useState(1);
  const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 });

  const avatarFileRef = useState(null);
  const canvasRef = useState(null);

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  const isOwnProfile = currentUser?.username?.toLowerCase() === username?.toLowerCase();

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/profile/${encodeURIComponent(username)}`)
      .then(r => { if (!r.ok) throw new Error('User not found'); return r.json(); })
      .then(data => {
        setProfileData(data);
        setBioText(data.user.bio || '');
        setAvatarUrl(data.user.avatar || '');
        setFollowerCount((data.user.followers || []).length);
        setFollowingCount((data.user.following || []).length);
        if (currentUser) {
          setIsFollowing((data.user.followers || []).some(id => String(id) === String(currentUser.id)));
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [username, currentUser]);

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Max 2MB');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
      setAvatarScale(1);
      setAvatarOffset({ x: 0, y: 0 });
      setAvatarModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarCrop = () => {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = async () => {
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s / avatarScale) / 2 - avatarOffset.x * (s / avatarScale / size);
      const sy = (img.height - s / avatarScale) / 2 - avatarOffset.y * (s / avatarScale / size);
      ctx.drawImage(img, sx, sy, s / avatarScale, s / avatarScale, 0, 0, size, size);
      const dataUrl = canvas.toDataURL('image/webp', 0.85);
      try {
        const res = await fetch('/api/profile/avatar', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, avatar: dataUrl })
        });
        if (!res.ok) throw new Error('Upload failed');
        const updated = await res.json();
        setProfileData(prev => ({ ...prev, user: { ...prev.user, avatar: updated.avatar } }));
        setAvatarUrl(updated.avatar);
        setAvatarModal(false);
        setAvatarPreview(null);
        toast.success('Avatar updated!');
      } catch (err) { toast.error(err.message); }
    };
    img.src = avatarPreview;
  };

  const handleSaveBio = async () => {
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, bio: bioText, avatar: avatarUrl })
      });
      if (!res.ok) throw new Error('Failed to save');
      const updated = await res.json();
      setProfileData(prev => ({ ...prev, user: { ...prev.user, bio: updated.bio, avatar: updated.avatar } }));
      setEditingBio(false);
      toast.success('Profile updated');
    } catch (e) { toast.error(e.message); }
  };

  const handleFollow = async () => {
    if (!currentUser) return toast.error('Login required');
    try {
      const res = await fetch('/api/follow', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, targetUserId: profileData.user.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIsFollowing(data.following);
      setFollowerCount(data.followerCount);
      toast.success(data.following ? 'Following!' : 'Unfollowed');
    } catch (e) { toast.error(e.message); }
  };

  const handleRep = async (type) => {
    if (!currentUser) return toast.error('Login required');
    try {
      const res = await fetch('/api/reputation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, targetUserId: profileData.user.id, type })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfileData(prev => ({ ...prev, user: { ...prev.user, reputation: data.reputation } }));
      toast.success('Rep updated');
    } catch (e) { toast.error(e.message); }
  };

  const handleBadge = async (action, badge) => {
    try {
      const res = await fetch(`/api/badges/${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.id, targetUserId: profileData.user.id, badge })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfileData(prev => ({ ...prev, user: { ...prev.user, badges: data.badges || [] } }));
      toast.success(`Badge ${action === 'grant' ? 'granted' : 'revoked'}`);
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}><p className="text-muted">Loading...</p></div>;
  if (error) return (
    <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}>
      <User size={48} className="text-muted" style={{ margin: '0 auto 16px' }} />
      <h2>User Not Found</h2>
      <p className="text-muted">@{username} doesn't exist</p>
    </div>
  );

  const { user: pu, scripts } = profileData;
  const badges = pu.badges || [];
  const reputation = pu.reputation || 0;
  const roleColors = { owner: '#ef4444', admin: '#f59e0b', support: '#10b981', user: '#6366f1' };
  const rc = roleColors[pu.role] || roleColors.user;

  const filteredScripts = scripts.filter(s =>
    !searchQuery || s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || s.game?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalViews = scripts.reduce((s, sc) => s + (sc.views || 0), 0);
  const totalLikes = scripts.reduce((s, sc) => s + (sc.likes || 0), 0);
  const allRatings = scripts.flatMap(sc => sc.ratings || []);
  const avgRating = allRatings.length ? (allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length).toFixed(1) : '—';

  const joined = pu.createdAt ? new Date(pu.createdAt) : null;
  const joinedStr = joined ? `${joined.toLocaleString('default', { month: 'short' })} ${joined.getFullYear()}` : 'Unknown';

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div onClick={() => isOwnProfile && document.getElementById('avatar-upload')?.click()} style={{
          width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          background: `linear-gradient(135deg, ${rc}, ${rc}88)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${rc}40`, cursor: isOwnProfile ? 'pointer' : 'default', position: 'relative'
        }}>
          {pu.avatar ? (
            <img src={pu.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
          ) : (
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', fontFamily: 'Outfit' }}>{pu.username.charAt(0).toUpperCase()}</span>
          )}
          {isOwnProfile && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}><Edit3 size={18} color="#fff" /></div>}
        </div>
        {isOwnProfile && <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: 'none' }} />}

        {/* Stats counters */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', paddingTop: '8px' }}>
          {[
            { val: followerCount, label: 'Followers' },
            { val: followingCount, label: 'Following' },
            { val: scripts.length, label: 'Scripts' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--text-color)' }}>{s.val}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Name + Badges + Follow */}
      <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'Outfit' }}>{pu.username}</h1>
        {badges.map(b => {
          const cfg = BADGE_CONFIG[b];
          return cfg ? <span key={b} title={cfg.label} style={{ fontSize: '0.85rem' }}>{cfg.icon}</span> : null;
        })}
        {!isOwnProfile && currentUser && (
          <button onClick={handleFollow} style={{
            padding: '4px 14px', borderRadius: '20px', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
            background: isFollowing ? 'transparent' : 'var(--primary-color)',
            color: isFollowing ? 'var(--text-muted)' : '#fff',
            border: isFollowing ? '1px solid var(--border-color)' : 'none',
            display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s'
          }}>
            {isFollowing ? <><UserMinus size={12} /> Unfollow</> : <><UserPlus size={12} /> Follow</>}
          </button>
        )}
      </div>

      {/* Meta line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Calendar size={12} /> Joined {joinedStr}</span>
        {reputation !== 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: reputation > 0 ? 'var(--success)' : 'var(--danger)' }}>
            <TrendingUp size={12} /> {reputation > 0 ? '+' : ''}{reputation} rep
          </span>
        )}
        {!isOwnProfile && currentUser && pu.id !== 0 && (
          <div style={{ display: 'flex', gap: '3px' }}>
            <button onClick={() => handleRep('up')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', padding: '2px' }} title="+rep"><ThumbsUp size={13} /></button>
            <button onClick={() => handleRep('down')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px' }} title="-rep"><ThumbsDown size={13} /></button>
          </div>
        )}
      </div>

      {/* Bio */}
      {editingBio ? (
        <div style={{ marginBottom: '12px' }}>
          <textarea className="input-field" placeholder="Bio..." value={bioText} maxLength={500}
            onChange={e => setBioText(e.target.value)} rows={2} style={{ borderRadius: '8px', fontSize: '0.82rem', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <button className="btn btn-primary" onClick={handleSaveBio} style={{ padding: '5px 12px', fontSize: '0.76rem' }}><Save size={12} /> Save</button>
            <button className="btn btn-secondary" onClick={() => setEditingBio(false)} style={{ padding: '5px 12px', fontSize: '0.76rem' }}><X size={12} /> Cancel</button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
          {pu.bio || (isOwnProfile ? 'No bio yet — click edit to add one' : 'No bio yet')}
        </p>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {isOwnProfile && !editingBio && (
          <button className="btn btn-secondary" onClick={() => setEditingBio(true)} style={{ padding: '5px 12px', fontSize: '0.74rem' }}><Edit3 size={11} /> Edit Profile</button>
        )}
        {isStaff && !isOwnProfile && pu.id !== 0 && (
          <button className="btn btn-secondary" onClick={() => setShowBadgePanel(!showBadgePanel)} style={{ padding: '5px 12px', fontSize: '0.74rem' }}>
            <Award size={11} /> {showBadgePanel ? 'Close Badges' : 'Manage Badges'}
          </button>
        )}
      </div>

      {/* Badge Panel */}
      {showBadgePanel && isStaff && (
        <motion.div style={{ marginBottom: '16px', padding: '14px', background: 'var(--bg-color-lighter)', borderRadius: '10px', border: '1px solid var(--border-color)' }}
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <h4 style={{ marginBottom: '10px', fontSize: '0.82rem' }}>Manage Badges</h4>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {ALL_BADGES.map(b => {
              const cfg = BADGE_CONFIG[b];
              const has = badges.includes(b);
              return (
                <button key={b} onClick={() => handleBadge(has ? 'revoke' : 'grant', b)}
                  style={{
                    padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                    background: has ? `${cfg.color}20` : 'var(--bg-color)', color: has ? cfg.color : 'var(--text-muted)',
                    border: `1px solid ${has ? cfg.color + '40' : 'var(--border-color)'}`, transition: 'all 0.15s'
                  }}>
                  {cfg.icon} {cfg.label} {has ? '✗' : '+'}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        {['Scripts', 'Activity', 'Statistics'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())}
            style={{
              padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.84rem', fontWeight: 500,
              color: activeTab === tab.toLowerCase() ? 'var(--text-color)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.toLowerCase() ? '2px solid var(--primary-color)' : '2px solid transparent',
              transition: 'all 0.15s'
            }}>{tab}</button>
        ))}
      </div>

      {/* Scripts Tab */}
      {activeTab === 'scripts' && (
        <>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="input-field" placeholder="Search scripts..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px', borderRadius: '8px', maxWidth: '280px' }} />
          </div>

          <h3 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Recent Scripts</h3>

          {filteredScripts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <Code size={36} style={{ marginBottom: '10px', opacity: 0.4 }} />
              <p>No scripts posted yet</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px' }}>
                {filteredScripts.slice(0, showCount).map((script, i) => (
                  <motion.div key={script.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                    <ScriptCard script={script} />
                  </motion.div>
                ))}
              </div>
              {filteredScripts.length > showCount && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button className="btn btn-secondary" onClick={() => setShowCount(prev => prev + 15)} style={{ padding: '10px 32px', borderRadius: '8px', fontSize: '0.85rem' }}>Load more</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
          <Clock size={36} style={{ marginBottom: '10px', opacity: 0.4 }} />
          <p>No recent activity</p>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Scripts', value: scripts.length, icon: <Code size={16} />, color: 'var(--primary-color)' },
            { label: 'Total Views', value: totalViews.toLocaleString(), icon: <Eye size={16} />, color: 'var(--accent-color)' },
            { label: 'Total Likes', value: totalLikes, icon: <ThumbsUp size={16} />, color: 'var(--success)' },
            { label: 'Avg Rating', value: avgRating, icon: <Star size={16} />, color: 'var(--warning)' },
            { label: 'Reputation', value: reputation >= 0 ? `+${reputation}` : reputation, icon: <TrendingUp size={16} />, color: reputation >= 0 ? 'var(--success)' : 'var(--danger)' },
            { label: 'Followers', value: followerCount, icon: <UserPlus size={16} />, color: 'var(--secondary-color)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '16px 10px', background: 'var(--bg-color-lighter)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ color: s.color, marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color, fontFamily: 'Outfit' }}>{s.value}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Avatar Crop Modal */}
      {avatarModal && avatarPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setAvatarModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-color-light)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ marginBottom: '16px', fontFamily: 'Outfit', fontSize: '1.1rem' }}>Crop Avatar</h3>
            <div style={{ width: '200px', height: '200px', margin: '0 auto 16px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--primary-color)', position: 'relative' }}>
              <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${avatarScale}) translate(${avatarOffset.x}px, ${avatarOffset.y}px)` }} draggable={false} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Zoom</label>
              <input type="range" min="1" max="3" step="0.05" value={avatarScale} onChange={e => setAvatarScale(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary-color)' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" onClick={handleAvatarCrop} style={{ flex: 1, padding: '10px' }}>Confirm</button>
              <button className="btn btn-secondary" onClick={() => { setAvatarModal(false); setAvatarPreview(null); }} style={{ flex: 1, padding: '10px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
