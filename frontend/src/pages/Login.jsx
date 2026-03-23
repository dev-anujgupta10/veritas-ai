import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', password: '', code: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const res = await axios.post(`${endpoint}`, formData);
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <Sparkles style={{ color: 'var(--accent-pink)', width: '40px', height: '40px' }} />
        </div>
        <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '10px' }}>Veritas AI</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '14px' }}>
          Don't Just Read, Verify.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Name" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password (8-50 chars)" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              minLength={8}
              maxLength={50}
              style={{ width: '100%', padding: '12px 16px', paddingRight: '45px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ 
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', 
                background: 'transparent', border: 'none', color: 'var(--text-secondary)', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Verification Code (Dummy)" 
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            />
          )}

          {error && <div style={{ color: 'var(--accent-red)', fontSize: '14px', textAlign: 'left' }}>{error}</div>}

          <button 
            type="submit" 
            className="anim-glow"
            disabled={loading}
            style={{ 
              marginTop: '10px', width: '100%', padding: '14px', borderRadius: '8px', 
              background: 'linear-gradient(45deg, var(--accent-pink), var(--accent-red))', 
              color: '#fff', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
            }}
          >
            {loading ? <div className="spinner"></div> : (isLogin ? 'Login to Verify' : 'Create Account')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: '500' }}
          >
            {isLogin ? 'Sign up' : 'Login'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
