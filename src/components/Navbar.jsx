import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Terminal, Upload, Shield, Code, User, LogOut, TrendingUp, Menu, X, Cpu, Download, MessageSquare, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Poll notifications
  useEffect(() => {
    if (!user) return;
    const poll = () => fetch(`/api/notifications/${user.id}`).then(r => r.ok ? r.json() : []).then(n => setUnreadCount(n.filter(x => !x.read).length)).catch(() => {});
    poll();
    const iv = setInterval(poll, 30000);
    return () => clearInterval(iv);
  }, [user]);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: null },
    { to: '/scripts', label: 'Scripts', icon: <Code size={18} /> },
    { to: '/trending', label: 'Trending', icon: <TrendingUp size={18} /> },
    { to: '/executors', label: 'Executors', icon: <Cpu size={18} /> },
    { to: '/rdd', label: 'RDD', icon: <Download size={18} /> },
    ...(user ? [{ to: '/upload', label: 'Upload', icon: <Upload size={18} /> }] : []),
    ...(user ? [{ to: '/contact', label: 'Contact', icon: <MessageSquare size={18} /> }] : []),
    ...((user?.role === 'admin' || user?.role === 'owner' || user?.role === 'support') ? [{ to: '/admin', label: 'Admin', icon: <Shield size={18} /> }] : []),
    ...((user?.role === 'owner' || user?.role === 'admin') ? [{ to: '/owner', label: 'Panel', icon: <Shield size={18} /> }] : []),
  ];

  return (
    <>
      <nav className="navbar glass">
        <div className="container">
          <Link to="/" className="navbar-brand">
            <motion.div initial={{ rotate: -10 }} animate={{ rotate: 0 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Terminal className="text-primary" size={28} />
            </motion.div>
            <span className="text-gradient">Scriptora</span>
          </Link>

          {/* Desktop Nav */}
          <div className="navbar-nav navbar-desktop">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className={`nav-link ${isActive(link.to)}`}>
                {link.icon} {link.label}
              </Link>
            ))}

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                <Link to="/notifications" style={{ position: 'relative', color: 'var(--text-muted)', padding: '6px' }} title="Notifications">
                  <Bell size={18} />
                  {unreadCount > 0 && <span style={{ position: 'absolute', top: '0', right: '0', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--danger)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </Link>
                <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  <User size={16} /> {user.username}
                </Link>
                <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '8px 12px' }} title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', marginLeft: '16px' }}>
                Login / Register
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="navbar-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="mobile-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="mobile-drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="mobile-drawer-header">
                <span className="text-gradient" style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.3rem' }}>Scriptora</span>
                <button onClick={() => setMobileOpen(false)} style={{ background: 'none', color: 'var(--text-color)' }}>
                  <X size={24} />
                </button>
              </div>

              <div className="mobile-drawer-links">
                {navLinks.map(link => (
                  <Link key={link.to} to={link.to} className={`mobile-nav-link ${isActive(link.to)}`}>
                    {link.icon} {link.label}
                  </Link>
                ))}
              </div>

              <div className="mobile-drawer-footer">
                {user ? (
                  <>
                    <Link to="/dashboard" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                      <User size={16} /> {user.username}
                    </Link>
                    <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
                      <LogOut size={16} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Login</Link>
                    <Link to="/register" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Register</Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
