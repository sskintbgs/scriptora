import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileCode, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/db';
import toast from 'react-hot-toast';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    game: '',
    gameLink: '',
    description: '',
    code: '',
    executors: []
  });

  const availableExecutors = ['All', 'Potassium', 'Madium', 'Delta', 'Xeno', 'Solara', 'Wave', 'Arceus X', 'KRNL', 'Fluxus', 'Hydrogen', 'Swift', 'Codex', 'Trigon', 'Synapse Z', 'Other'];

  if (!user) return <Navigate to="/login" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.executors.length === 0) {
      return toast.error('Please select at least one supported executor.');
    }
    try {
      await api.addScript(formData, user);
      setIsSubmitted(true);
      toast.success('Script submitted successfully!');
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (error) {
      toast.error('Failed to submit script');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleExecutorChange = (executor) => {
    setFormData(prev => {
      let newExecutors = [...prev.executors];
      if (newExecutors.includes(executor)) {
        newExecutors = newExecutors.filter(e => e !== executor);
      } else {
        // If "All" or "Unknown" is selected, maybe clear others, or just let them select anything
        if (executor === 'All' || executor === 'Unknown') {
          newExecutors = [executor];
        } else {
          newExecutors = newExecutors.filter(e => e !== 'All' && e !== 'Unknown');
          newExecutors.push(executor);
        }
      }
      return { ...prev, executors: newExecutors };
    });
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Submit a Script</h1>
        <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Share your script with thousands of users. All submissions are manually reviewed 
          by our staff before being marked as verified.
        </p>
      </div>

      <motion.div 
        className="upload-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="glass-card" style={{ padding: '40px' }}>
          {isSubmitted ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ textAlign: 'center', padding: '60px 0' }}
            >
              <CheckCircle size={64} className="text-success" style={{ margin: '0 auto 24px' }} />
              <h2 style={{ marginBottom: '16px' }}>Script Submitted Successfully!</h2>
              <p className="text-muted">Redirecting to your dashboard...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Script Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="input-field" placeholder="e.g. Blox Fruits Auto Farm Hub" required />
              </div>
              
              <div className="input-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                <div>
                  <label className="input-label">Game</label>
                  <input type="text" name="game" value={formData.game} onChange={handleChange} className="input-field" placeholder="e.g. Blox Fruits" required />
                </div>
                <div>
                  <label className="input-label">Game Link (URL)</label>
                  <input type="url" name="gameLink" value={formData.gameLink} onChange={handleChange} className="input-field" placeholder="https://roblox.com/games/..." required />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Supported Executors</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {availableExecutors.map(exec => (
                    <label key={exec} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: formData.executors.includes(exec) ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-color-lighter)', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${formData.executors.includes(exec) ? 'var(--primary-color)' : 'var(--border-color)'}`, transition: 'all 0.2s' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.executors.includes(exec)}
                        onChange={() => handleExecutorChange(exec)}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontSize: '0.9rem', color: formData.executors.includes(exec) ? 'var(--text-color)' : 'var(--text-muted)' }}>{exec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Description & Features</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field" 
                  style={{ minHeight: '150px' }} 
                  placeholder="Describe what your script does and list its features..."
                  required
                ></textarea>
              </div>

              <div className="input-group">
                <label className="input-label">Script Code (Lua)</label>
                <div className="file-upload-zone" style={{ padding: '20px' }}>
                  <textarea 
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="input-field" 
                    style={{ minHeight: '200px', fontFamily: 'monospace' }} 
                    placeholder="loadstring(game:HttpGet('...'))()"
                    required
                  ></textarea>
                </div>
              </div>

              <div style={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginTop: '32px', marginBottom: '32px' }}>
                <AlertCircle size={20} className="text-accent" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  By submitting this script, you agree to our Terms of Service. Malicious scripts, IP loggers, and dual hooks will result in a permanent ban.
                </p>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
                <UploadIcon size={20} />
                Submit Script for Review
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Upload;
