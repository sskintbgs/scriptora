import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, Filter, Search, Cpu, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import ScriptCard from '../components/ScriptCard';
import { api } from '../api/db';

const CSS = `
  .sc-page { padding: 36px 0 70px; }
  .sc-container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
  @media (max-width: 480px) { .sc-container { padding: 0 14px; } }

  /* Page header */
  .sc-header {
    display: flex; justify-content: space-between;
    align-items: flex-start; gap: 16px;
    margin-bottom: 28px; flex-wrap: wrap;
  }
  .sc-header h1 {
    font-size: clamp(1.5rem, 4vw, 2rem);
    font-weight: 900; letter-spacing: -0.03em;
    display: flex; align-items: center; gap: 10px;
    color: #eaedf8;
  }
  .sc-header p { font-size: 0.88rem; color: #525878; margin-top: 5px; }

  /* Toolbar */
  .sc-toolbar {
    display: flex; gap: 8px; margin-bottom: 14px;
    align-items: center; flex-wrap: wrap;
  }
  .sc-search-wrap { position: relative; flex: 1; min-width: 200px; }
  .sc-search-wrap svg {
    position: absolute; left: 14px; top: 50%;
    transform: translateY(-50%); color: #525878; pointer-events: none;
  }
  .sc-search {
    width: 100%;
    background: #0f111a; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 99px; padding: 11px 16px 11px 38px;
    font: inherit; font-size: 0.88rem; color: #eaedf8; outline: none;
    transition: border 0.2s;
  }
  .sc-search::placeholder { color: #525878; }
  .sc-search:focus { border-color: #818cf8; }

  .sc-filter-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 11px 16px; border-radius: 99px;
    background: #0f111a; border: 1px solid rgba(255,255,255,0.06);
    font: inherit; font-size: 0.85rem; font-weight: 600;
    color: #9aa0bc; cursor: pointer; transition: all 0.15s;
    white-space: nowrap;
  }
  .sc-filter-btn:hover { border-color: rgba(255,255,255,0.12); }
  .sc-filter-btn-active { border-color: #818cf8; color: #818cf8; }

  .sc-filter-count {
    background: #818cf8; color: #fff;
    font-size: 0.62rem; font-weight: 800;
    width: 18px; height: 18px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }

  /* Filter panel */
  .sc-panel {
    background: #0f111a; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px; padding: 18px; margin-bottom: 16px;
    overflow: hidden;
  }
  .sc-panel-row { margin-bottom: 14px; }
  .sc-panel-row:last-child { margin-bottom: 0; }
  .sc-panel-label {
    font-size: 0.68rem; font-weight: 700;
    color: #525878; text-transform: uppercase; letter-spacing: 0.07em;
    margin-bottom: 9px;
  }
  .sc-pills { display: flex; gap: 6px; flex-wrap: wrap; }
  .sc-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 14px; border-radius: 99px;
    background: #161924; border: 1px solid rgba(255,255,255,0.06);
    font: inherit; font-size: 0.8rem; font-weight: 600;
    color: #9aa0bc; cursor: pointer; transition: all 0.15s;
    white-space: nowrap;
  }
  .sc-pill:hover { border-color: rgba(255,255,255,0.12); color: #eaedf8; }
  .sc-pill-active {
    background: rgba(129,140,248,0.12);
    border-color: #818cf8; color: #818cf8;
  }

  /* Active filter chips (shown in toolbar) */
  .sc-active-filters {
    display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;
  }
  .sc-chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px 4px 12px; border-radius: 99px;
    font-size: 0.75rem; font-weight: 600;
    background: rgba(129,140,248,0.1);
    border: 1px solid rgba(129,140,248,0.25);
    color: #818cf8;
  }
  .sc-chip button {
    background: none; border: none; cursor: pointer;
    color: #818cf8; padding: 0; display: flex; align-items: center;
    opacity: 0.7; transition: opacity 0.15s;
  }
  .sc-chip button:hover { opacity: 1; }

  /* Result meta */
  .sc-result-meta {
    font-size: 0.75rem; color: #525878;
    margin-bottom: 16px;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 8px;
  }

  /* Grid */
  .sc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }
  @media (max-width: 620px) { .sc-grid { grid-template-columns: 1fr; } }

  /* Empty state */
  .sc-empty {
    text-align: center; padding: 60px 24px;
    background: #0f111a; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
  }
  .sc-empty h3 { color: #eaedf8; margin-bottom: 6px; font-size: 1rem; }
  .sc-empty p { color: #525878; font-size: 0.88rem; }

  /* Sort select */
  .sc-select {
    background: #0f111a; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 99px; padding: 10px 14px;
    font: inherit; font-size: 0.82rem; color: #9aa0bc;
    outline: none; cursor: pointer;
    -webkit-appearance: none; appearance: none;
    padding-right: 28px;
  }
  .sc-select-wrap { position: relative; display: inline-block; }
  .sc-select-wrap svg {
    position: absolute; right: 10px; top: 50%;
    transform: translateY(-50%); pointer-events: none; color: #525878;
  }
`;

const EXECUTORS = ['All', 'Potassium', 'Madium', 'Delta', 'Xeno', 'Solara', 'Other', 'Unknown'];
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Scripts' },
  { value: 'verified', label: 'Verified' },
  { value: 'working', label: 'Working' },
];
const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'likes', label: 'Most Liked' },
];

let scCssInjected = false;

const Scripts = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [executorFilter, setExecutorFilter] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [scripts, setScripts] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  if (!scCssInjected && typeof document !== 'undefined') {
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
    scCssInjected = true;
  }

  useEffect(() => { api.getScripts().then(setScripts); }, []);

  const filtered = useMemo(() => {
    let result = scripts.filter(script => {
      if (statusFilter === 'verified' && !script.verified) return false;
      if (statusFilter === 'working' && script.status !== 'working') return false;
      if (executorFilter !== 'All' && !script.executors?.includes(executorFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          script.title?.toLowerCase().includes(q) ||
          script.game?.toLowerCase().includes(q) ||
          script.author?.toLowerCase().includes(q) ||
          script.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });

    switch (sortBy) {
      case 'recent': result.sort((a, b) => new Date(b.date) - new Date(a.date)); break;
      case 'views': result.sort((a, b) => (b.views || 0) - (a.views || 0)); break;
      case 'likes': result.sort((a, b) => (b.likes || 0) - (a.likes || 0)); break;
      default:
        result.sort((a, b) => ((b.likes||0)*200 + (b.views||0) + ((b.ratings?.length||0)*50)) - ((a.likes||0)*200 + (a.views||0) + ((a.ratings?.length||0)*50)));
    }
    return result;
  }, [scripts, statusFilter, executorFilter, sortBy, searchQuery]);

  const activeCount = (statusFilter !== 'all' ? 1 : 0) + (executorFilter !== 'All' ? 1 : 0);
  const clearFilters = () => { setStatusFilter('all'); setExecutorFilter('All'); };

  return (
    <div className="sc-page">
      <div className="sc-container">
        {/* Header */}
        <div className="sc-header">
          <div>
            <h1>
              <Code size={24} style={{ color: '#818cf8' }} />
              All Scripts
            </h1>
            <p>Browse our comprehensive collection of community scripts</p>
          </div>
          <div className="sc-select-wrap">
            <select className="sc-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} />
          </div>
        </div>

        {/* Toolbar */}
        <div className="sc-toolbar">
          <div className="sc-search-wrap">
            <Search size={15} />
            <input className="sc-search" type="text" placeholder="Search scripts, games, authors..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <button className={`sc-filter-btn ${filtersOpen || activeCount > 0 ? 'sc-filter-btn-active' : ''}`}
            onClick={() => setFiltersOpen(v => !v)}>
            <SlidersHorizontal size={14} />
            Filters
            {activeCount > 0 && <span className="sc-filter-count">{activeCount}</span>}
            <ChevronDown size={13} style={{ transform: filtersOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>
        </div>

        {/* Active filter chips */}
        <AnimatePresence>
          {activeCount > 0 && (
            <motion.div className="sc-active-filters"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              {statusFilter !== 'all' && (
                <span className="sc-chip">
                  {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
                  <button onClick={() => setStatusFilter('all')}><X size={12} /></button>
                </span>
              )}
              {executorFilter !== 'All' && (
                <span className="sc-chip">
                  {executorFilter}
                  <button onClick={() => setExecutorFilter('All')}><X size={12} /></button>
                </span>
              )}
              <button onClick={clearFilters} style={{ fontSize: '0.75rem', color: '#525878', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
                Clear all
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div className="sc-panel"
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>
              <div className="sc-panel-row">
                <div className="sc-panel-label">Status</div>
                <div className="sc-pills">
                  {STATUS_OPTIONS.map(o => (
                    <button key={o.value} className={`sc-pill ${statusFilter === o.value ? 'sc-pill-active' : ''}`}
                      onClick={() => setStatusFilter(o.value)}>{o.label}</button>
                  ))}
                </div>
              </div>
              <div className="sc-panel-row">
                <div className="sc-panel-label"><Cpu size={11} style={{ display: 'inline', marginRight: 4 }} />Executor</div>
                <div className="sc-pills">
                  {EXECUTORS.map(exec => (
                    <button key={exec} className={`sc-pill ${executorFilter === exec ? 'sc-pill-active' : ''}`}
                      onClick={() => setExecutorFilter(exec)}>{exec}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result meta */}
        <div className="sc-result-meta">
          <span>Showing <strong style={{ color: '#eaedf8' }}>{filtered.length}</strong> of {scripts.length} scripts</span>
          {searchQuery && <span>Results for "<strong style={{ color: '#818cf8' }}>{searchQuery}</strong>"</span>}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="sc-empty">
            <Search size={32} style={{ color: '#525878', margin: '0 auto 12px', display: 'block' }} />
            <h3>No scripts found</h3>
            <p>Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="sc-grid">
            {filtered.map((script, i) => (
              <motion.div key={script.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.45), ease: [0.16, 1, 0.3, 1] }}>
                <ScriptCard script={script} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scripts;
