import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Plane } from 'lucide-react';
import './AuthPages.css';

// ===================== LOGIN =====================
export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <AuthLayout title="Welcome back" subtitle="Sign in to continue your journey">
    <form onSubmit={handleSubmit} className="auth-form">
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-group">
        <label className="form-label">Email</label>
        <div className="input-icon-wrap">
          <Mail size={16} className="input-icon" />
          <input type="email" className="form-input with-icon" placeholder="you@example.com"
            value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <div className="input-icon-wrap">
          <Lock size={16} className="input-icon" />
          <input type={showPass ? 'text' : 'password'} className="form-input with-icon with-icon-right"
            placeholder="Your password" value={form.password}
            onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
          <button type="button" className="input-icon-right" onClick={() => setShowPass(s => !s)}>
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? <span className="btn-spinner"></span> : <><span>Sign In</span><ArrowRight size={16} /></>}
      </button>
      <p className="auth-switch">Don't have an account? <Link to="/register">Create one free →</Link></p>
    </form>
  </AuthLayout>;
}

// ===================== REGISTER =====================
export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <AuthLayout title="Start your journey" subtitle="Create your free TripWise account">
    <form onSubmit={handleSubmit} className="auth-form">
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-group">
        <label className="form-label">Full Name</label>
        <div className="input-icon-wrap">
          <User size={16} className="input-icon" />
          <input type="text" className="form-input with-icon" placeholder="Ankit Singh"
            value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <div className="input-icon-wrap">
          <Mail size={16} className="input-icon" />
          <input type="email" className="form-input with-icon" placeholder="you@example.com"
            value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <div className="input-icon-wrap">
          <Lock size={16} className="input-icon" />
          <input type={showPass ? 'text' : 'password'} className="form-input with-icon with-icon-right"
            placeholder="Min. 6 characters" value={form.password}
            onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
          <button type="button" className="input-icon-right" onClick={() => setShowPass(s => !s)}>
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Confirm Password</label>
        <div className="input-icon-wrap">
          <Lock size={16} className="input-icon" />
          <input type={showPass ? 'text' : 'password'} className="form-input with-icon"
            placeholder="Same as above" value={form.confirmPassword}
            onChange={e => setForm(f => ({...f, confirmPassword: e.target.value}))} required />
        </div>
      </div>
      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? <span className="btn-spinner"></span> : <><span>Create Account ✈️</span><ArrowRight size={16} /></>}
      </button>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in →</Link></p>
    </form>
  </AuthLayout>;
}

// Shared layout
function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-bg">
          <div className="auth-orb auth-orb-1"></div>
          <div className="auth-orb auth-orb-2"></div>
        </div>
        <div className="auth-left-content">
          <Link to="/" className="auth-brand">
            <Plane size={28} />
            <span>TripWise</span>
          </Link>
          <div className="auth-hero-text">
            <h2>"Travel is the only thing you buy<br/>that makes you richer."</h2>
            <p>— TripWise Community</p>
          </div>
          <div className="auth-destinations">
            {['🗼 Paris', '🗽 New York', '🏯 Tokyo', '🌴 Bali', '🏛️ Rome'].map(d => (
              <span key={d} className="auth-dest-tag">{d}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
          </div>
          {children}
          <Link to="/" className="auth-back">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
