import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="container" style={{ padding: '80px 24px', display: 'flex', justifyContent: 'center' }}>
      <motion.div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <LogIn size={48} className="text-primary" style={{ margin: '0 auto 16px' }} />
          <h2>Welcome Back</h2>
          <p className="text-muted">Login to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Username</label>
            <input type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="input-group" style={{ marginBottom: '32px' }}>
            <label className="input-label">Password</label>
            <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>Login</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p className="text-muted">Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)' }}>Register here</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(username, email, password);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="container" style={{ padding: '80px 24px', display: 'flex', justifyContent: 'center' }}>
      <motion.div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <UserPlus size={48} className="text-primary" style={{ margin: '0 auto 16px' }} />
          <h2>Create Account</h2>
          <p className="text-muted">Join the community</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Username</label>
            <input type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group" style={{ marginBottom: '32px' }}>
            <label className="input-label">Password</label>
            <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            Register
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p className="text-muted">Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)' }}>Login here</Link></p>
        </div>
      </motion.div>
    </div>
  );
};
