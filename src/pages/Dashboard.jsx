import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/db';
import { User, Code, Eye, Star, Trash2, ThumbsUp, Settings, Copy, Shield, BarChart3, MessageSquare, Image as ImageIcon, Check, X, Camera, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { copyToClipboard } from '../utils/clipboard';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [myScripts, setMyScripts] = useState([]);
  const [stats, setStats] = useState(null);
  const [maintenance, setMaintenance] = useState({ maintenanceMode: false, assetUploadsBlocked: false });
  const [editingImage, setEditingImage] = useState(null); // { type: 'avatar'|'banner', src: string, zoom: number }

  useEffect(() => {
    if (user) {
      api.getScriptsByUser(user.id).then(setMyScripts);
      if (user.role === 'owner') {
        api.getStats().then(setStats);
        api.getMaintenance().then(setMaintenance);
      }
    }
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this script?')) return;
    await api.deleteScript(id, user);
    setMyScripts(prev => prev.filter(s => String(s.id) !== String(id)));
    toast.success('Script deleted');
  };

  if (!user) return <Navigate to="/login" />;

  const myTotalViews = myScripts.reduce((s, sc) => s + (sc.views || 0), 0);
  const myTotalLikes = myScripts.reduce((s, sc) => s + (sc.likes || 0), 0);
  const myTotalComments = myScripts.reduce((s, sc) => s + (sc.comments?.length || 0), 0);
  const myAllRatings = myScripts.flatMap(sc => sc.ratings || []);
  const myAvgRating = myAllRatings.length ? (myAllRatings.reduce((s, r) => s + r.rating, 0) / myAllRatings.length).toFixed(1) : '—';

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      setEditingImage({ type, src: re.target.result, zoom: 1 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const finalizeImage = async () => {
    if (!editingImage) return;
    const img = new Image();
    img.src = editingImage.src;
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const zoom = editingImage.zoom || 1;
      
      if (editingImage.type === 'avatar') {
        const size = 400;
        canvas.width = size;
        canvas.height = size;
        
        const minSide = Math.min(img.width, img.height) / zoom;
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
      } else {
        canvas.width = 1200;
        canvas.height = 300;
        const aspect = img.width / img.height;
        const targetAspect = 4;
        let sw, sh, sx, sy;
        
        if (aspect > targetAspect) {
          sh = img.height / zoom;
          sw = sh * targetAspect;
        } else {
          sw = img.width / zoom;
          sh = sw / targetAspect;
        }
        sx = (img.width - sw) / 2;
        sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1200, 300);
      }

      try {
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        let updated;
        if (editingImage.type === 'avatar') {
          updated = await api.updateProfileAvatar(user.id, base64);
        } else {
          updated = await api.updateProfileBanner(user.id, base64);
        }
        updateUser(updated);
        setEditingImage(null);
        toast.success(`${editingImage.type === 'avatar' ? 'Avatar' : 'Banner'} updated!`);
      } catch (err) { toast.error(err.message); }
    };
  };

  return (
    <div className="container" style={{ padding: '40px 16px' }}>
      {/* Header / Banner Section */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 28, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          height: 220, width: '100%',
          background: user.banner ? `url("${user.banner}") center/cover` : 'linear-gradient(135deg, #1e2233, #0f111a)',
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <label htmlFor="banner-input" style={{
            position: 'absolute', inset: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0)', transition: 'background 0.3s',
            zIndex: 2
          }} className="banner-overlay">
             <div className="banner-edit-btn" style={{
               background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
               padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
               display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: '0.85rem',
               fontWeight: 600, opacity: 0, transition: 'all 0.3s', transform: 'translateY(10px)'
             }}>
               <ImageIcon size={18} /> Change Cover Image
             </div>
          </label>
          <input id="banner-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileSelect(e, 'banner')} />
          {!user.banner && <ImageIcon size={48} style={{ opacity: 0.1 }} />}
        </div>

        <div style={{ padding: '0 24px 24px', marginTop: -50, position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', zIndex: 5 }}>
            <div style={{
              width: 120, height: 120, borderRadius: '32px', border: '6px solid var(--bg-color)',
              background: user.avatar ? `url("${user.avatar}") center/cover` : 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800, color: '#fff',
              boxShadow: '0 12px 40px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden'
            }}>
              {!user.avatar && user.username?.charAt(0).toUpperCase()}
              
              <label htmlFor="avatar-input" style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer'
              }} className="pfp-overlay">
                <Camera size={32} />
              </label>
            </div>
            <label htmlFor="avatar-input" style={{
              position: 'absolute', bottom: -4, right: -4, width: 40, height: 40, borderRadius: '14px',
              background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: '4px solid var(--bg-color)', color: '#fff',
              boxShadow: '0 6px 16px rgba(99,102,241,0.5)', transition: 'all 0.2s', zIndex: 10
            }} title="Change Avatar" className="hover-scale">
              <Plus size={20} />
            </label>
            <input id="avatar-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileSelect(e, 'avatar')} />
          </div>
          
          <div style={{ flex: 1, minWidth: 240, paddingBottom: 10 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 4, letterSpacing: '-0.03em' }}>{user.username}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{user.email}</p>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)' }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>{user.role}</span>
                {user.role === 'owner' && <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>System Root</span>}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <Link to={`/@${user.username}`} className="btn btn-secondary" style={{ padding: '10px 18px', fontSize: '0.9rem', borderRadius: '12px' }}>
              <User size={16} /> Public Profile
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .banner-overlay:hover { background: rgba(0,0,0,0.2) !important; }
        .banner-overlay:hover .banner-edit-btn { opacity: 1 !important; transform: translateY(0) !important; }
        .pfp-overlay:hover { opacity: 1 !important; }
        @media (max-width: 768px) {
          .banner-edit-btn { opacity: 1 !important; transform: translateY(0) !important; bottom: 12px; top: auto; left: 12px; right: auto; position: absolute; }
        }
      `}</style>

      {/* Stats and Maintenance Panels ... (Same as before but keeping layout tight) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* My Stats */}
        <motion.div className="glass-card" style={{ padding: '24px' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}><BarChart3 size={20} /> Your Growth</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {[
              { label: 'Scripts', value: myScripts.length, color: 'var(--primary-color)' },
              { label: 'Total Views', value: myTotalViews.toLocaleString(), color: 'var(--accent-color)' },
              { label: 'Total Likes', value: myTotalLikes, color: 'var(--success)' },
              { label: 'Avg Rating', value: myAvgRating, color: 'var(--warning)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit', marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Platform Overview (Owner ONLY) */}
        {stats && user?.role === 'owner' && (
          <motion.div className="glass-card" style={{ padding: '24px' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}><Shield size={20} /> Platform Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {[
                { label: 'Users', value: stats.totalUsers, color: 'var(--primary-color)' },
                { label: 'Scripts', value: stats.totalScripts, color: 'var(--accent-color)' },
                { label: 'Verified', value: stats.verifiedScripts, color: 'var(--success)' },
                { label: 'Pending', value: stats.pendingScripts, color: 'var(--warning)' },
              ].map(s => (
                <div key={s.label} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit', marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Platform Maintenance (Owner ONLY) */}
      {user?.role === 'owner' && (
        <motion.div className="glass-card" style={{ marginBottom: '32px', padding: '24px', border: '1px solid rgba(239,68,68,0.2)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', color: '#f87171' }}>
            <Shield size={20} /> System Maintenance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justify: 'space-between', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <span>Maintenance Mode</span>
                  <input type="checkbox" className="toggle-switch" checked={maintenance.maintenanceMode} onChange={async (e) => {
                    const updated = await api.updateMaintenance(user.id, { maintenanceMode: e.target.checked });
                    setMaintenance(updated);
                    toast.success(`Maintenance Mode ${updated.maintenanceMode ? 'ON' : 'OFF'}`);
                  }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justify: 'space-between', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <span>Block Asset Uploads</span>
                  <input type="checkbox" className="toggle-switch" checked={maintenance.assetUploadsBlocked} onChange={async (e) => {
                    const updated = await api.updateMaintenance(user.id, { assetUploadsBlocked: e.target.checked });
                    setMaintenance(updated);
                    toast.success(`Uploads ${updated.assetUploadsBlocked ? 'BLOCKED' : 'ALLOWED'}`);
                  }} />
                </label>
              </div>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.1)' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#f87171' }}>Storage Purge</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Delete all custom assets to free up server space.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-danger" style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }} onClick={() => {
                  if (window.confirm('Purge all banners?')) api.purgeAssets(user.id, 'banners').then(r => toast.success(`Deleted ${r.count} banners`));
                }}>Banners</button>
                <button className="btn btn-danger" style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }} onClick={() => {
                  if (window.confirm('Purge all avatars?')) api.purgeAssets(user.id, 'avatars').then(r => toast.success(`Deleted ${r.count} avatars`));
                }}>Avatars</button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Account Settings */}
      <motion.div className="glass-card" style={{ marginBottom: '32px', padding: '24px' }}>
        <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem' }}>
          <Settings size={24} /> Account Settings
        </h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const newUser = fd.get('username')?.trim() || undefined;
          const newEmail = fd.get('email')?.trim() || undefined;
          const newPass = fd.get('password')?.trim() || undefined;
          const newBio = fd.get('bio')?.trim() || undefined;
          try {
            if (newUser || newEmail || newPass) {
              const updated = await api.updateUserCreds(user.id, newUser, newEmail, newPass);
              updateUser(updated);
            }
            if (newBio !== undefined && newBio !== user.bio) {
              const updated = await api.updateProfileBio(user.id, newBio);
              updateUser(updated);
            }
            toast.success('Settings updated!');
          } catch (err) { toast.error(err.message); }
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            <div className="input-group">
              <label className="input-label">Username</label>
              <input type="text" name="username" className="input-field" placeholder={user.username} />
            </div>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input type="email" name="email" className="input-field" placeholder={user.email} />
            </div>
            <div className="input-group">
              <label className="input-label">Bio / About Me</label>
              <textarea name="bio" className="input-field" placeholder="Tell the world about yourself..." style={{ height: '80px', resize: 'none' }}>{user.bio}</textarea>
            </div>
            <div className="input-group">
              <label className="input-label">New Password</label>
              <input type="password" name="password" className="input-field" placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>Save Changes</button>
        </form>
      </motion.div>

      {/* My Scripts ... (Same as before but keep it clean) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>My Scripts</h2>
        <Link to="/upload" className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: '12px' }}>+ New Script</Link>
      </div>

      {myScripts.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '64px 32px' }}>
          <Code size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
          <p className="text-muted">You haven't uploaded any scripts yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myScripts.map(script => (
            <div key={script.id} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
               <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.65rem' }}>{script.game}</span>
                    <span className={`badge ${script.verified ? 'verified' : 'pending'}`} style={{ fontSize: '0.65rem' }}>{script.verified ? 'Verified' : 'Pending'}</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{script.title}</h4>
               </div>
               <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to={`/script/${script.id}`} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>Manage</Link>
                  <button className="btn btn-danger" style={{ padding: '8px 12px' }} onClick={() => handleDelete(script.id)}><Trash2 size={16} /></button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Editor Modal with ZOOM */}
      <AnimatePresence>
        {editingImage && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.9)', padding: '20px', backdropFilter: 'blur(10px)'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" style={{ maxWidth: 500, width: '100%', padding: '32px', textAlign: 'center', background: 'var(--bg-color-light)' }}
            >
              <h2 style={{ marginBottom: 24, fontSize: '1.4rem', fontWeight: 800 }}>Adjust {editingImage.type === 'avatar' ? 'Avatar' : 'Banner'}</h2>
              
              <div style={{ 
                background: '#05070a', borderRadius: '24px', overflow: 'hidden', marginBottom: '24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                height: 300, position: 'relative', border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ 
                  width: '100%', height: '100%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: `scale(${editingImage.zoom})`, transition: 'transform 0.1s ease-out'
                }}>
                  <img src={editingImage.src} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Preview" />
                </div>
                
                {/* Visual Overlay */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {editingImage.type === 'avatar' ? (
                    <div style={{ width: 220, height: 220, borderRadius: '50%', border: '2px solid var(--primary-color)', boxShadow: '0 0 0 1000px rgba(0,0,0,0.7)' }} />
                  ) : (
                    <div style={{ width: '90%', height: '50%', border: '2px solid var(--primary-color)', boxShadow: '0 0 0 1000px rgba(0,0,0,0.7)' }} />
                  )}
                </div>
              </div>

              {/* Zoom Control */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', marginBottom: '8px' }}>
                  <Minus size={14} className="text-muted" />
                  <input 
                    type="range" min="1" max="3" step="0.01" 
                    value={editingImage.zoom} 
                    onChange={(e) => setEditingImage({ ...editingImage, zoom: parseFloat(e.target.value) })}
                    style={{ flex: 1, maxWidth: '200px', accentColor: 'var(--primary-color)' }}
                  />
                  <Plus size={14} className="text-muted" />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Use the slider to zoom and center your {editingImage.type}</p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" style={{ flex: 1, padding: '14px', borderRadius: '14px' }} onClick={() => setEditingImage(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" style={{ flex: 1, padding: '14px', borderRadius: '14px', fontWeight: 700 }} onClick={finalizeImage}>
                  Save & Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
