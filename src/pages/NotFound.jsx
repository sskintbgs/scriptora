import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();
  
  // Handle /@username routes that React Router might miss
  if (location.pathname.startsWith('/@')) {
    const username = location.pathname.slice(2);
    if (username && username.length > 0) {
      return <Navigate to={`/u/${username}`} replace />;
    }
  }

  return (
    <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div style={{ fontSize: '8rem', fontWeight: 800, fontFamily: 'Outfit', lineHeight: 1 }} className="text-gradient">
          404
        </div>
        <h2 style={{ marginTop: '16px', marginBottom: '12px', fontSize: '1.6rem' }}>Page Not Found</h2>
        <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto 32px', fontSize: '1rem' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            <Home size={18} /> Go Home
          </Link>
          <Link to="/scripts" className="btn btn-secondary" style={{ padding: '12px 24px' }}>
            <Search size={18} /> Browse Scripts
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
