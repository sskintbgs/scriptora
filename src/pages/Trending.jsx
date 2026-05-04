import { useState, useEffect } from 'react';
import { Flame, TrendingUp, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import ScriptCard from '../components/ScriptCard';
import { api } from '../api/db';

const Trending = () => {
  const [scripts, setScripts] = useState([]);

  useEffect(() => {
    // getScripts returns verified scripts sorted by views
    api.getScripts().then(setScripts);
  }, []);

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Flame size={64} className="text-primary" style={{ margin: '0 auto 16px' }} />
        </motion.div>
        <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>Trending Scripts</h1>
        <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Discover the most popular, highest-viewed, and highly rated scripts currently dominating the platform.
        </p>
      </div>

      <section style={{ marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <TrendingUp className="text-primary" size={28} />
          <h2>Top 10 Most Viewed</h2>
        </div>
        
        <div className="grid-3">
          {scripts.slice(0, 10).map((script, index) => (
            <motion.div
              key={script.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ScriptCard script={script} />
            </motion.div>
          ))}
        </div>
      </section>
      
      <section style={{ marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <Star className="text-warning" size={28} />
          <h2>Highest Rated</h2>
        </div>
        
        <div className="grid-3">
          {[...scripts].sort((a, b) => {
            const getAvg = (s) => s.ratings?.length ? s.ratings.reduce((acc, r) => acc + r.rating, 0) / s.ratings.length : 0;
            return getAvg(b) - getAvg(a);
          }).slice(0, 6).map((script, index) => (
            <motion.div
              key={`rated-${script.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <ScriptCard script={script} />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Trending;
