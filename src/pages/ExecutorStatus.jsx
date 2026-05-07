import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, CheckCircle, XCircle, Shield, Globe, MessageCircle,
  DollarSign, RefreshCw, Search, Zap, Lock, Unlock, Layers,
  Monitor, Smartphone, Apple, X, ChevronDown, Filter,
} from "lucide-react";

const PRIORITY_EXECUTORS = ["Potassium", "Delta", "Xeno", "Solara"];

const TYPE_LABELS = {
  all: "All",
  wexecutor: "Windows",
  wexternal: "External",
  mexecutor: "Mac",
  aexecutor: "Android",
  iexecutor: "iOS",
};

const TYPE_ICONS = {
  wexecutor: <Monitor size={13} />,
  wexternal: <Shield size={13} />,
  mexecutor: <Apple size={13} />,
  aexecutor: <Smartphone size={13} />,
  iexecutor: <Smartphone size={13} />,
};

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "updated", label: "Updated" },
  { key: "outdated", label: "Outdated" },
  { key: "free", label: "Free" },
  { key: "paid", label: "Paid" },
  { key: "undetected", label: "Undetected" },
];

/* ─── Progress Bar ─── */
const ProgressBar = ({ label, value, delay = 0 }) => {
  const color =
    value >= 80 ? "var(--clr-green)" : value >= 50 ? "var(--clr-amber)" : "var(--clr-red)";
  return (
    <div style={{ marginBottom: 6 }}>
      <div className="es-row" style={{ fontSize: "0.7rem", color: "var(--t3)", marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}%</span>
      </div>
      <div className="es-bar-bg">
        <motion.div
          className="es-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({ label, value, color, icon, active, onClick }) => (
  <button
    className={`es-stat-card ${active ? "es-stat-active" : ""}`}
    onClick={onClick}
    style={{ "--stat-clr": color }}
  >
    <div className="es-stat-icon">{icon}</div>
    <div className="es-stat-value">{value}</div>
    <div className="es-stat-label">{label}</div>
  </button>
);

/* ─── Executor Card ─── */
const ExecCard = ({ exec, index, onClick }) => {
  const isPriority = PRIORITY_EXECUTORS.includes(exec.title);
  return (
    <motion.button
      className={`es-card ${isPriority ? "es-card-priority" : ""}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.45), ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      layout
    >
      {/* Header */}
      <div className="es-row" style={{ marginBottom: 8, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <h3 className="es-card-title">
            {exec.title}
            {isPriority && <Zap size={13} style={{ color: "var(--clr-amber)", flexShrink: 0 }} />}
          </h3>
          <span className="es-card-meta">
            v{exec.version || "?"} · {TYPE_LABELS[exec.extype] || exec.extype || "Unknown"}
          </span>
        </div>
        <span className={`es-badge ${exec.updateStatus ? "es-badge-green" : "es-badge-red"}`}>
          {exec.updateStatus ? "✓ Updated" : "✕ Outdated"}
        </span>
      </div>

      {/* Tags */}
      <div className="es-tags">
        <span className={`es-badge ${exec.detected ? "es-badge-red" : "es-badge-green"}`}>
          {exec.detected ? "Detected" : "Undetected"}
        </span>
        <span className={`es-badge ${exec.free ? "es-badge-cyan" : "es-badge-purple"}`}>
          {exec.free ? "Free" : exec.cost || "Paid"}
        </span>
        {exec.uncStatus && <span className="es-badge es-badge-indigo">UNC</span>}
      </div>

      {/* Progress */}
      {(exec.uncPercentage !== undefined || exec.suncPercentage !== undefined) && (
        <div style={{ marginTop: 10 }}>
          {exec.uncPercentage !== undefined && (
            <ProgressBar label="UNC" value={exec.uncPercentage} />
          )}
          {exec.suncPercentage !== undefined && (
            <ProgressBar label="sUNC" value={exec.suncPercentage} delay={0.1} />
          )}
        </div>
      )}

      {/* Feature chips */}
      <div className="es-features">
        {exec.decompiler && (
          <span className="es-feat"><Layers size={9} /> Decompiler</span>
        )}
        {exec.multiInject && (
          <span className="es-feat"><Layers size={9} /> Multi-Inject</span>
        )}
        {exec.keysystem && (
          <span className="es-feat" style={{ color: "var(--clr-amber)" }}><Lock size={9} /> Key System</span>
        )}
      </div>

      {/* Footer */}
      <div className="es-card-footer">{exec.updatedDate || "—"}</div>
    </motion.button>
  );
};

/* ─── Detail Sheet (mobile-first modal / bottom-sheet) ─── */
const DetailSheet = ({ exec, onClose }) => {
  if (!exec) return null;
  return (
    <>
      <motion.div
        className="es-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="es-sheet"
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
      >
        {/* Drag Handle (mobile affordance) */}
        <div className="es-sheet-handle" />

        {/* Header */}
        <div className="es-row" style={{ marginBottom: 16, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <h2 className="es-sheet-title">{exec.title}</h2>
            <p className="es-sheet-meta">
              v{exec.version} · {TYPE_LABELS[exec.extype] || exec.extype} · {exec.platform}
            </p>
          </div>
          <button className="es-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Info Grid */}
        <div className="es-info-grid">
          {[
            {
              label: "Status",
              value: exec.updateStatus ? "✓ Updated" : "✕ Outdated",
              color: exec.updateStatus ? "var(--clr-green)" : "var(--clr-red)",
            },
            {
              label: "Hyperion",
              value: exec.detected ? "Detected" : "Undetected",
              color: exec.detected ? "var(--clr-red)" : "var(--clr-green)",
            },
            {
              label: "Price",
              value: exec.free ? "Free" : exec.cost || "Paid",
              color: "var(--clr-cyan)",
            },
            {
              label: "UNC",
              value: `${exec.uncPercentage ?? "—"}%`,
              color: "var(--clr-indigo)",
            },
          ].map((item) => (
            <div key={item.label} className="es-info-cell">
              <div style={{ color: item.color, fontWeight: 700, fontSize: "0.88rem" }}>{item.value}</div>
              <div className="es-info-cell-label">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ marginBottom: 18 }}>
          <h4 className="es-section-title">Features</h4>
          <div className="es-tags">
            {exec.uncStatus && <span className="es-badge es-badge-green">UNC</span>}
            {exec.decompiler && <span className="es-badge es-badge-indigo">Decompiler</span>}
            {exec.multiInject && <span className="es-badge es-badge-cyan">Multi-Inject</span>}
            {exec.keysystem && <span className="es-badge es-badge-amber">Key System</span>}
            {exec.clientmods && <span className="es-badge es-badge-purple">Client Mods</span>}
            {exec.raknet && <span className="es-badge es-badge-green">RakNet</span>}
            {!exec.uncStatus && !exec.decompiler && !exec.multiInject && !exec.keysystem && !exec.clientmods && !exec.raknet && (
              <span style={{ fontSize: "0.78rem", color: "var(--t3)" }}>None listed</span>
            )}
          </div>
        </div>

        {/* Links */}
        <div className="es-links">
          {exec.websitelink && (
            <a href={exec.websitelink} target="_blank" rel="noopener noreferrer" className="es-link-btn es-link-primary">
              <Globe size={14} /> Website
            </a>
          )}
          {exec.discordlink && (
            <a href={exec.discordlink} target="_blank" rel="noopener noreferrer" className="es-link-btn">
              <MessageCircle size={14} /> Discord
            </a>
          )}
          {exec.purchaselink && (
            <a href={exec.purchaselink} target="_blank" rel="noopener noreferrer" className="es-link-btn">
              <DollarSign size={14} /> Purchase
            </a>
          )}
        </div>

        <div style={{ marginTop: 14, fontSize: "0.72rem", color: "var(--t3)" }}>
          Last updated: {exec.updatedDate || "—"}
        </div>
      </motion.div>
    </>
  );
};

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */
const ExecutorStatus = () => {
  const [executors, setExecutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedExecutor, setSelectedExecutor] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchExecutors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/executors");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setExecutors(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutors();
  }, []);

  const availableTypes = [
    "all",
    ...new Set(executors.filter((e) => !e.hidden && e.extype).map((e) => e.extype)),
  ];

  const filtered = executors
    .filter((e) => !e.hidden)
    .filter((e) => {
      if (statusFilter === "updated") return e.updateStatus === true;
      if (statusFilter === "outdated") return e.updateStatus === false;
      if (statusFilter === "free") return e.free === true;
      if (statusFilter === "paid") return e.free === false;
      if (statusFilter === "undetected") return e.detected === false;
      return true;
    })
    .filter((e) => (typeFilter === "all" ? true : e.extype === typeFilter))
    .filter(
      (e) =>
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.platform?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aP = PRIORITY_EXECUTORS.includes(a.title) ? -1 : 0;
      const bP = PRIORITY_EXECUTORS.includes(b.title) ? -1 : 0;
      if (aP !== bP) return aP - bP;
      return (b.updateStatus ? 1 : 0) - (a.updateStatus ? 1 : 0);
    });

  const visible = executors.filter((e) => !e.hidden);
  const stats = {
    total: visible.length,
    updated: visible.filter((e) => e.updateStatus).length,
    outdated: visible.filter((e) => !e.updateStatus).length,
    free: visible.filter((e) => e.free).length,
    undetected: visible.filter((e) => !e.detected).length,
  };

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0);

  return (
    <>
      <style>{`
        /* ─── Design Tokens ─── */
        :root {
          --bg-0: #0b0e14;
          --bg-1: #111520;
          --bg-2: #181d2a;
          --bg-3: #1f2536;
          --t1: #e8ecf4;
          --t2: #a0a8be;
          --t3: #5e6580;
          --border: rgba(255,255,255,0.06);
          --clr-indigo: #818cf8;
          --clr-green: #34d399;
          --clr-red: #f87171;
          --clr-amber: #fbbf24;
          --clr-cyan: #38bdf8;
          --clr-purple: #c084fc;
          --radius: 14px;
          --radius-sm: 8px;
        }

        @font-face {
          font-family: 'Geist';
          src: local('Geist'), local('GeistVF');
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body, #root {
          font-family: 'Geist', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg-0);
          color: var(--t1);
          -webkit-font-smoothing: antialiased;
        }

        .es-wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 20px 60px;
        }

        /* ─── Header ─── */
        .es-header { margin-bottom: 28px; }
        .es-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, var(--clr-indigo), var(--clr-cyan));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .es-header-sub {
          font-size: 0.78rem;
          color: var(--t3);
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .es-refresh {
          background: none;
          border: none;
          color: var(--clr-indigo);
          font: inherit;
          font-size: 0.78rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 0;
        }
        .es-refresh:hover { text-decoration: underline; }

        /* ─── Stat Cards ─── */
        .es-stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        @media (max-width: 600px) {
          .es-stats {
            grid-template-columns: repeat(3, 1fr);
          }
          .es-stats .es-stat-card:nth-child(4),
          .es-stats .es-stat-card:nth-child(5) {
            grid-column: span 1;
          }
        }
        .es-stat-card {
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 14px 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          font: inherit;
          color: inherit;
        }
        .es-stat-card:hover { background: var(--bg-2); border-color: rgba(255,255,255,0.1); }
        .es-stat-active {
          border-color: var(--stat-clr) !important;
          background: color-mix(in srgb, var(--stat-clr) 8%, var(--bg-1)) !important;
          box-shadow: 0 0 20px color-mix(in srgb, var(--stat-clr) 15%, transparent);
        }
        .es-stat-icon { margin-bottom: 4px; color: var(--stat-clr); display: flex; justify-content: center; }
        .es-stat-value {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--stat-clr);
          font-variant-numeric: tabular-nums;
          line-height: 1.2;
        }
        .es-stat-label {
          font-size: 0.62rem;
          color: var(--t3);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-top: 2px;
        }

        /* ─── Toolbar ─── */
        .es-toolbar {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        .es-search-wrap {
          position: relative;
          flex: 1;
          min-width: 160px;
        }
        .es-search-wrap svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--t3);
          pointer-events: none;
        }
        .es-search {
          width: 100%;
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: 99px;
          padding: 10px 14px 10px 36px;
          font: inherit;
          font-size: 0.85rem;
          color: var(--t1);
          outline: none;
          transition: border 0.2s;
        }
        .es-search::placeholder { color: var(--t3); }
        .es-search:focus { border-color: var(--clr-indigo); }

        .es-filter-toggle {
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: 99px;
          padding: 10px 14px;
          font: inherit;
          font-size: 0.82rem;
          color: var(--t2);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .es-filter-toggle:hover { border-color: rgba(255,255,255,0.12); }
        .es-filter-badge {
          background: var(--clr-indigo);
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
          width: 18px; height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        /* ─── Filter Panel ─── */
        .es-filter-panel {
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          margin-bottom: 16px;
          overflow: hidden;
        }
        .es-filter-section { margin-bottom: 12px; }
        .es-filter-section:last-child { margin-bottom: 0; }
        .es-filter-label {
          font-size: 0.7rem;
          color: var(--t3);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 8px;
        }
        .es-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .es-pill {
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 99px;
          padding: 6px 14px;
          font: inherit;
          font-size: 0.78rem;
          color: var(--t2);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .es-pill:hover { border-color: rgba(255,255,255,0.12); color: var(--t1); }
        .es-pill-active {
          background: color-mix(in srgb, var(--clr-indigo) 15%, var(--bg-2));
          border-color: var(--clr-indigo);
          color: var(--clr-indigo);
        }

        /* ─── Grid ─── */
        .es-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 12px;
        }
        @media (max-width: 680px) {
          .es-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ─── Card ─── */
        .es-card {
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          font: inherit;
          color: inherit;
          width: 100%;
          display: block;
        }
        .es-card:hover {
          border-color: rgba(255,255,255,0.12);
          background: var(--bg-2);
          transform: translateY(-1px);
        }
        .es-card:active { transform: scale(0.995); }
        .es-card-priority {
          border-color: rgba(129,140,248,0.25);
          background: linear-gradient(135deg, color-mix(in srgb, var(--clr-indigo) 4%, var(--bg-1)), var(--bg-1));
        }
        .es-card-priority:hover { border-color: rgba(129,140,248,0.4); }
        .es-card-title {
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 5px;
          line-height: 1.3;
        }
        .es-card-meta { font-size: 0.72rem; color: var(--t3); }
        .es-card-footer {
          font-size: 0.7rem;
          color: var(--t3);
          border-top: 1px solid var(--border);
          padding-top: 10px;
          margin-top: 10px;
        }

        /* ─── Helpers ─── */
        .es-row { display: flex; justify-content: space-between; align-items: center; }
        .es-tags { display: flex; gap: 6px; flex-wrap: wrap; }
        .es-features { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
        .es-feat {
          font-size: 0.68rem;
          color: var(--t3);
          display: flex;
          align-items: center;
          gap: 3px;
        }

        /* ─── Badges ─── */
        .es-badge {
          font-size: 0.68rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 99px;
          white-space: nowrap;
          line-height: 1.5;
          display: inline-block;
        }
        .es-badge-green  { background: rgba(52,211,153,0.1); color: var(--clr-green); border: 1px solid rgba(52,211,153,0.2); }
        .es-badge-red    { background: rgba(248,113,113,0.1); color: var(--clr-red); border: 1px solid rgba(248,113,113,0.2); }
        .es-badge-cyan   { background: rgba(56,189,248,0.1);  color: var(--clr-cyan); border: 1px solid rgba(56,189,248,0.2); }
        .es-badge-purple { background: rgba(192,132,252,0.1); color: var(--clr-purple); border: 1px solid rgba(192,132,252,0.2); }
        .es-badge-indigo { background: rgba(129,140,248,0.1); color: var(--clr-indigo); border: 1px solid rgba(129,140,248,0.2); }
        .es-badge-amber  { background: rgba(251,191,36,0.1);  color: var(--clr-amber); border: 1px solid rgba(251,191,36,0.2); }

        /* ─── Progress Bar ─── */
        .es-bar-bg {
          height: 4px;
          background: var(--bg-3);
          border-radius: 4px;
          overflow: hidden;
        }
        .es-bar-fill {
          height: 100%;
          border-radius: 4px;
        }

        /* ─── Overlay & Sheet ─── */
        .es-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 900;
        }
        .es-sheet {
          position: fixed;
          z-index: 901;
          background: var(--bg-1);
          border: 1px solid var(--border);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        /* Desktop centered modal */
        @media (min-width: 641px) {
          .es-sheet {
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 480px;
            max-height: 85vh;
            border-radius: var(--radius);
            padding: 28px;
          }
        }
        /* Mobile bottom sheet */
        @media (max-width: 640px) {
          .es-sheet {
            bottom: 0; left: 0; right: 0;
            max-height: 88vh;
            border-radius: 20px 20px 0 0;
            padding: 12px 20px 32px;
            transform: none !important;
          }
        }
        .es-sheet-handle {
          width: 36px;
          height: 4px;
          background: var(--bg-3);
          border-radius: 4px;
          margin: 0 auto 16px;
        }
        @media (min-width: 641px) {
          .es-sheet-handle { display: none; }
        }
        .es-sheet-title {
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .es-sheet-meta {
          font-size: 0.78rem;
          color: var(--t3);
          margin-top: 2px;
        }
        .es-close {
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 50%;
          width: 32px; height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--t2);
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .es-close:hover { background: var(--bg-3); color: var(--t1); }

        /* ─── Info Grid ─── */
        .es-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 18px;
        }
        .es-info-cell {
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 12px;
          text-align: center;
        }
        .es-info-cell-label {
          font-size: 0.65rem;
          color: var(--t3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }

        .es-section-title {
          font-size: 0.82rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--t2);
        }

        /* ─── Links ─── */
        .es-links { display: flex; gap: 8px; flex-wrap: wrap; }
        .es-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          font-size: 0.82rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          text-decoration: none;
          transition: all 0.15s;
          background: var(--bg-2);
          border: 1px solid var(--border);
          color: var(--t2);
        }
        .es-link-btn:hover { border-color: rgba(255,255,255,0.15); color: var(--t1); }
        .es-link-primary {
          background: var(--clr-indigo);
          border-color: var(--clr-indigo);
          color: #fff;
        }
        .es-link-primary:hover {
          background: color-mix(in srgb, var(--clr-indigo) 85%, #fff);
          color: #fff;
        }

        /* ─── Empty & Loading ─── */
        .es-center {
          text-align: center;
          padding: 60px 20px;
        }

        /* ─── Mobile adjustments ─── */
        @media (max-width: 480px) {
          .es-wrap { padding: 20px 14px 50px; }
          .es-header h1 { font-size: 1.4rem; }
          .es-stat-value { font-size: 1.15rem; }
          .es-card { padding: 14px; }
          .es-card-title { font-size: 0.92rem; }
        }
      `}</style>

      <div className="es-wrap">
        {/* Header */}
        <motion.div
          className="es-header"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Cpu size={26} style={{ color: "var(--clr-indigo)" }} />
            <h1>Executor Status</h1>
          </div>
          {lastUpdated && (
            <div className="es-header-sub">
              <span>{lastUpdated.toLocaleTimeString()}</span>
              <span>·</span>
              <button className="es-refresh" onClick={fetchExecutors}>
                <RefreshCw size={11} /> Refresh
              </button>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          className="es-stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
        >
          <StatCard label="Total" value={stats.total} color="var(--clr-indigo)" icon={<Cpu size={14} />}
            active={statusFilter === "total"} onClick={() => setStatusFilter("all")} />
          <StatCard label="Updated" value={stats.updated} color="var(--clr-green)" icon={<CheckCircle size={14} />}
            active={statusFilter === "updated"} onClick={() => setStatusFilter(statusFilter === "updated" ? "all" : "updated")} />
          <StatCard label="Outdated" value={stats.outdated} color="var(--clr-red)" icon={<XCircle size={14} />}
            active={statusFilter === "outdated"} onClick={() => setStatusFilter(statusFilter === "outdated" ? "all" : "outdated")} />
          <StatCard label="Free" value={stats.free} color="var(--clr-cyan)" icon={<Unlock size={14} />}
            active={statusFilter === "free"} onClick={() => setStatusFilter(statusFilter === "free" ? "all" : "free")} />
          <StatCard label="Undetected" value={stats.undetected} color="var(--clr-amber)" icon={<Shield size={14} />}
            active={statusFilter === "undetected"} onClick={() => setStatusFilter(statusFilter === "undetected" ? "all" : "undetected")} />
        </motion.div>

        {/* Toolbar: Search + Filter Toggle */}
        <div className="es-toolbar">
          <div className="es-search-wrap">
            <Search size={15} />
            <input
              className="es-search"
              type="text"
              placeholder="Search executors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="es-filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}>
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && <span className="es-filter-badge">{activeFilterCount}</span>}
            <ChevronDown size={14} style={{ transform: filtersOpen ? "rotate(180deg)" : "none", transition: "0.2s" }} />
          </button>
        </div>

        {/* Expandable Filter Panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              className="es-filter-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="es-filter-section">
                <div className="es-filter-label">Status</div>
                <div className="es-pills">
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f.key}
                      className={`es-pill ${statusFilter === f.key ? "es-pill-active" : ""}`}
                      onClick={() => setStatusFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="es-filter-section">
                <div className="es-filter-label">Platform</div>
                <div className="es-pills">
                  {availableTypes.map((t) => (
                    <button
                      key={t}
                      className={`es-pill ${typeFilter === t ? "es-pill-active" : ""}`}
                      onClick={() => setTypeFilter(t)}
                    >
                      {TYPE_ICONS[t]} {TYPE_LABELS[t] || t}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result count */}
        {!loading && !error && (
          <div style={{ fontSize: "0.75rem", color: "var(--t3)", marginBottom: 14 }}>
            Showing {filtered.length} of {visible.length} executors
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="es-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ display: "inline-block" }}
            >
              <RefreshCw size={26} style={{ color: "var(--clr-indigo)" }} />
            </motion.div>
            <p style={{ color: "var(--t3)", marginTop: 14, fontSize: "0.85rem" }}>
              Loading executors...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="es-center" style={{ background: "var(--bg-1)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <XCircle size={32} style={{ color: "var(--clr-red)", marginBottom: 10 }} />
            <h3 style={{ marginBottom: 4 }}>Connection failed</h3>
            <p style={{ color: "var(--t3)", fontSize: "0.85rem", marginBottom: 16 }}>{error}</p>
            <button className="es-link-btn es-link-primary" onClick={fetchExecutors} style={{ margin: "0 auto" }}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <div className="es-grid">
            {filtered.map((exec, idx) => (
              <ExecCard
                key={exec._id || exec.title}
                exec={exec}
                index={idx}
                onClick={() => setSelectedExecutor(exec)}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="es-center" style={{ background: "var(--bg-1)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <Search size={26} style={{ color: "var(--t3)", marginBottom: 10 }} />
            <p style={{ color: "var(--t3)", fontSize: "0.88rem" }}>No executors match your filters.</p>
          </div>
        )}

        {/* Detail Modal / Bottom Sheet */}
        <AnimatePresence>
          {selectedExecutor && (
            <DetailSheet exec={selectedExecutor} onClose={() => setSelectedExecutor(null)} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ExecutorStatus;
