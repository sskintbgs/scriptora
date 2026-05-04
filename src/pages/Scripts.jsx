import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, Filter, Search, Cpu } from 'lucide-react';
import ScriptCard from '../components/ScriptCard';
import { api } from '../api/db';

const EXECUTORS = ['All', 'Potassium', 'Madium', 'Delta', 'Xeno', 'Solara', 'Other', 'Unknown'];

const Scripts = () => {
  const [filter, setFilter] = useState('all');
  const [executorFilter, setExecutorFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [scripts, setScripts] = useState([]);

  useEffect(() => {
    api.getScripts().then(setScripts);
  }, []);

  const filteredScripts = scripts.filter(script => {
    // Status filter
    if (filter === 'verified' && !script.verified) return false;
    if (filter === 'working' && script.status !== 'working') return false;

    // Executor filter
    if (executorFilter !== 'All') {
      if (!script.executors?.includes(executorFilter)) return false;
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!script.title?.toLowerCase().includes(q) &&
          !script.game?.toLowerCase().includes(q) &&
          !script.author?.toLowerCase().includes(q) &&
          !script.description?.toLowerCase().includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="container" style={{ padding: '40px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '2rem', marginBottom: '8px' }}>
            <Code className="text-primary" size={30} />
            All Scripts
          </h1>
          <p className="text-muted">Browse our comprehensive collection of scripts</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={16} className="text-muted" />
          <select
            className="input-field"
            style={{ width: 'auto', padding: '8px 14px', borderRadius: '99px', fontSize: '0.85rem', margin: 0 }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Scripts</option>
            <option value="verified">Verified Only</option>
            <option value="working">Working Only</option>
          </select>
        </div>
      </div>

      {/* Executor Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        <Cpu size={16} className="text-muted" />
        {EXECUTORS.map(exec => (
          <button key={exec}
            className={`btn ${executorFilter === exec ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '5px 12px', fontSize: '0.8rem', borderRadius: '99px' }}
            onClick={() => setExecutorFilter(exec)}
          >
            {exec}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '28px', maxWidth: '500px' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text" className="input-field" placeholder="Search scripts, games, authors..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '38px', margin: 0, borderRadius: '12px' }}
        />
      </div>

      {filteredScripts.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Search size={36} className="text-muted" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px' }}>No scripts found</h3>
          <p className="text-muted">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid-3">
          {filteredScripts.map((script, index) => (
            <motion.div
              key={script.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
            >
              <ScriptCard script={script} />
            </motion.div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        Showing {filteredScripts.length} of {scripts.length} scripts
      </div>
    </div>
  );
};

export default Scripts;
