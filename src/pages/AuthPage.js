import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const AuthPage = () => {
  const { login, registerUser, loginUser, loginWithGoogle, isLoggedIn } = useApp();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      setForm({ name: '', email: '', password: '' });
      setError('');
    }
  }, [isLoggedIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await loginUser({ email: form.email, password: form.password });
      } else {
        await registerUser({ name: form.name, email: form.email, password: form.password });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleGoogleCredentialResponse = async (response) => {
      setLoading(true);
      setError('');
      try {
        await loginWithGoogle(response.credential);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Google authentication failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const initializeGoogleSignIn = () => {
      if (window.google) {
        const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '679460937668-ic577i6t2f1gmu5vj9ga2kl3ka3v917g.apps.googleusercontent.com';
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        });

        const btnContainer = document.getElementById('google-signin-button');
        if (btnContainer) {
          window.google.accounts.id.renderButton(
            btnContainer,
            {
              theme: 'outline',
              size: 'large',
              width: btnContainer.offsetWidth || 420,
              text: 'continue_with',
              shape: 'rectangular',
            }
          );
        }
      }
    };

    // Load Google Identity Services script if not already present
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    }
  }, [mode, loginWithGoogle]);

  return (
    <div className="flex-row-between flex-wrap w-full" style={{ minHeight: '100vh', background: 'var(--bg-deep)', position: 'relative', overflow: 'hidden' }}>
      {/* Background elements */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0, 242, 254, 0.08) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />

      {/* Left Panel - Hero */}
      <div className="flex-1 flex-column" style={{ justifyContent: 'center', padding: '60px', minWidth: '320px', zIndex: 2 }}>
        {/* Logo */}
        <div className="flex-align-center mb-60" style={{ gap: '12px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#06050c'
          }}>⚡</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800 }}>
            DSA<span className="gradient-text-cyan">Forge</span>
          </span>
        </div>

        <div style={{ maxWidth: '520px' }}>
          <div className="mb-24" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(0, 242, 254, 0.06)', border: '1px solid rgba(0, 242, 254, 0.15)',
            borderRadius: '99px', padding: '6px 16px', fontSize: '13px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)'
          }}>
            <span className="dot-accent dot-green" />
            AI-Powered Placement Prep Platform
          </div>

          <h1 className="mb-20" style={{
            fontFamily: 'var(--font-display)', fontSize: '54px', fontWeight: 800,
            lineHeight: '1.1'
          }}>
            <span className="gradient-text-main">Forge</span> your path<br />to placement
          </h1>

          <p className="mb-48" style={{ fontSize: '17px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            AI-powered DSA analysis identifies your weak spots, builds personalized roadmaps, and predicts your placement readiness — so you study smarter, not harder.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
            {['🧠 AI Weakness Analysis', '🗺 Smart Roadmap', '📊 Readiness Score', '🤖 Doubt Solver', '🎯 Mock OA Generator', '🔥 Streak Tracker'].map(f => (
              <div key={f} className="card" style={{
                borderRadius: '12px', padding: '10px 16px', fontSize: '13px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.015)'
              }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-align-center" style={{ width: '500px', justifyContent: 'center', padding: '40px', minWidth: '320px', zIndex: 2 }}>
        <div className="card" style={{
          padding: '40px', width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          background: 'rgba(10, 8, 20, 0.7)',
          borderColor: 'var(--border-bright)'
        }}>
          <h2 className="mb-8" style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700 }}>
            {mode === 'login' ? 'Welcome back' : 'Start your journey'}
          </h2>
          <p className="mb-28" style={{ color: 'var(--text-secondary)', fontSize: '14.5px' }}>
            {mode === 'login' ? 'Continue your DSA practice streak' : 'Register to start tracking your DSA preparation progress'}
          </p>

          {/* Google Sign-In Button Container */}
          <div id="google-signin-button" style={{ width: '100%', marginBottom: '20px', display: 'flex', justifyContent: 'center' }} />

          <div className="flex-align-center mb-20" style={{ gap: '12px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {error && (
            <div className="mb-20 text-center" style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--accent-pink)',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-column" style={{ gap: '16px' }}>
            {mode === 'signup' && (
              <div>
                <label className="mb-6" style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block' }}>Full Name</label>
                <input className="input-field" type="text" placeholder="Aryan Sharma"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}
            <div>
              <label className="mb-6" style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block' }}>Email</label>
              <input className="input-field" type="email" placeholder="aryan@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="mb-6" style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block' }}>Password</label>
              <input className="input-field" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            <button type="submit" disabled={loading} className="btn-primary mt-8 w-full">
              {loading ? (
                <>
                  <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block' }} />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="mt-20 text-center" style={{ fontSize: '14.5px', color: 'var(--text-secondary)' }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{
              background: 'none', border: 'none', color: 'var(--accent-cyan)',
              cursor: 'pointer', fontWeight: 600, fontSize: '14.5px', textDecoration: 'underline'
            }}>
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
