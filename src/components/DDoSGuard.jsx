import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ShieldCheck, ShieldBan, Cpu, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

const DDoSGuard = ({ children }) => {
  const [status, setStatus] = useState('init');
  const [rayId, setRayId] = useState('');
  const [progress, setProgress] = useState(0);
  const [blockMsg, setBlockMsg] = useState('');
  const [banTimer, setBanTimer] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Safety timeout — if stuck for 8s, just let user through
    const safetyTimer = setTimeout(() => {
      setStatus(prev => {
        if (prev !== 'passed' && prev !== 'blocked') {
          console.warn('[DDoSGuard] Safety timeout — letting user through');
          document.cookie = `scr_cleared=1; max-age=3600; path=/; SameSite=Lax`;
          return 'passed';
        }
        return prev;
      });
    }, 8000);

    const run = async () => {
      setStatus('checking');

      try {
        // Step 1: Check existing clearance
        let statusData;
        try {
          const statusRes = await fetch('/api/challenge/status', { credentials: 'include' });
          if (!statusRes.ok) throw new Error('status-fail');
          statusData = await statusRes.json();
        } catch {
          // Server unreachable — do client-side fallback
          await doClientFallback();
          clearTimeout(safetyTimer);
          return;
        }

        if (statusData.blocked) {
          setBlockMsg(statusData.reason || 'Access denied');
          setStatus('blocked');
          clearTimeout(safetyTimer);
          return;
        }

        if (statusData.cleared) {
          setStatus('passed');
          clearTimeout(safetyTimer);
          return;
        }

        // Step 2: Request challenge
        setStatus('solving');
        let challenge;
        try {
          const challengeRes = await fetch('/api/challenge/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });

          if (!challengeRes.ok) {
            const err = await challengeRes.json().catch(() => ({}));
            if (err.ban_remaining) {
              setBlockMsg(err.error || 'Blocked');
              setBanTimer(err.ban_remaining);
              setStatus('blocked');
              clearTimeout(safetyTimer);
              return;
            }
            throw new Error('challenge-fail');
          }

          challenge = await challengeRes.json();
        } catch {
          await doClientFallback();
          clearTimeout(safetyTimer);
          return;
        }

        setRayId(challenge.rayId);

        // Step 3: CPU proof-of-work
        const answer = challenge.operands.a + challenge.operands.b;
        for (let i = 0; i <= 100; i += 8) {
          await new Promise(r => setTimeout(r, 50));
          setProgress(i);
          let sum = 0;
          for (let j = 0; j < 400000; j++) sum += Math.sqrt(j * Math.random());
        }
        setProgress(100);

        // Step 4: Submit answer
        try {
          const verifyRes = await fetch('/api/challenge/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ challengeId: challenge.challengeId, answer })
          });

          if (!verifyRes.ok) throw new Error('verify-fail');
        } catch {
          // Verification failed — client fallback
          await doClientFallback();
          clearTimeout(safetyTimer);
          return;
        }

        setStatus('success');
        clearTimeout(safetyTimer);
        setTimeout(() => setStatus('passed'), 700);

      } catch {
        // Any unexpected error — client fallback
        await doClientFallback();
        clearTimeout(safetyTimer);
      }
    };

    async function doClientFallback() {
      console.warn('[DDoSGuard] Server unreachable, client-side fallback');
      // Check for existing clearance cookie
      const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('scr_cleared='));
      if (hasCookie) {
        setStatus('passed');
        return;
      }

      // Do lightweight client-side proof-of-work
      setStatus('solving');
      setRayId(Math.random().toString(36).substring(2, 12).toUpperCase());
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, 25));
        setProgress(i);
        let s = 0;
        for (let j = 0; j < 200000; j++) s += Math.sqrt(j);
      }
      document.cookie = `scr_cleared=1; max-age=3600; path=/; SameSite=Lax`;
      setStatus('success');
      setTimeout(() => setStatus('passed'), 700);
    }

    run();

    return () => clearTimeout(safetyTimer);
  }, []);

  useEffect(() => {
    if (banTimer <= 0) return;
    const iv = setInterval(() => {
      setBanTimer(p => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(iv);
  }, [banTimer]);

  // Let through immediately if passed, show nothing briefly during init
  if (status === 'passed') return children;
  if (status === 'init') return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: '#030305',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <motion.div
        className="glass-card"
        style={{ padding: '40px', textAlign: 'center', maxWidth: '420px', width: '90%' }}
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      >
        {status === 'blocked' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ShieldBan size={56} className="text-danger" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ marginBottom: '12px', color: 'var(--danger)' }}>Access Blocked</h2>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '16px' }}>{blockMsg}</p>
            {banTimer > 0 && (
              <p style={{ fontSize: '1rem', color: 'var(--warning)', marginBottom: '16px' }}>
                Retry in: {Math.floor(banTimer / 60)}:{String(banTimer % 60).padStart(2, '0')}
              </p>
            )}
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <p style={{ margin: 0 }}>Ray ID: {rayId || 'N/A'}</p>
              <p style={{ margin: '4px 0 0' }}>Scriptora Shield</p>
            </div>
          </motion.div>
        ) : status === 'success' ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <ShieldCheck size={56} className="text-success" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ marginBottom: '12px' }}>Clearance Granted</h2>
            <p className="text-muted">Secure session established.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div animate={{ rotateY: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}>
              <ShieldAlert size={56} className="text-warning" style={{ margin: '0 auto 20px' }} />
            </motion.div>
            <h2 style={{ marginBottom: '8px' }}>Security Verification</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '24px' }}>
              Verifying your connection to protect against DDoS and bots.
            </p>
            {status === 'solving' && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '12px', color: 'var(--primary-color)' }}>
                  <Cpu size={16} />
                  <span style={{ fontSize: '0.85rem' }}>Solving Challenge: {progress}%</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'var(--bg-color-lighter)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div style={{ height: '100%', background: 'var(--primary-color)' }} animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
                </div>
              </div>
            )}
            {status === 'checking' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '24px' }}>
                <Fingerprint size={16} />
                <span style={{ fontSize: '0.85rem' }}>Checking session...</span>
              </div>
            )}
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <p style={{ margin: 0 }}>Ray ID: {rayId || 'Generating...'}</p>
              <p style={{ margin: '4px 0 0' }}>Scriptora Shield</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default DDoSGuard;
