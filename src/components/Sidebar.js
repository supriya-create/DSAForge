import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const navItems = [
  { path: '/', id: 'dashboard', icon: '⚡', label: 'Dashboard', end: true },
  { path: '/tracker', id: 'tracker', icon: '📊', label: 'DSA Tracker' },
  { path: '/analysis', id: 'analysis', icon: '🧠', label: 'AI Analysis' },
  { path: '/roadmap', id: 'roadmap', icon: '🗺', label: 'Roadmap' },
  { path: '/problems', id: 'problems', icon: '🎯', label: 'Problems' },
  { path: '/mockoa', id: 'mockoa', icon: '📝', label: 'Mock OA' },
  { path: '/readiness', id: 'readiness', icon: '🏆', label: 'Readiness' },
  { path: '/doubt', id: 'doubt', icon: '🤖', label: 'AI Doubts' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, streak, totalSolved } = useApp();

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="flex-row-between" style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div className="flex-align-center" style={{ gap: '12px' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            boxShadow: 'var(--glow-cyan)', color: '#06050c', fontWeight: 800
          }}>⚡</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px' }}>
            DSA<span className="gradient-text-cyan">Forge</span>
          </span>
        </div>
        {/* Mobile close button */}
        <button onClick={onClose} className="mobile-close-btn" id="close-sidebar-mobile">
          ✕
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '24px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map(item => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.end}
            onClick={() => onClose && onClose()} // close sidebar drawer on mobile after navigating
            className={({ isActive }) => `sidebar-nav-btn ${isActive ? 'active' : ''}`}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Stats mini */}
      <div style={{
        padding: '16px 12px',
        margin: '0 14px 16px 14px',
        background: 'var(--bg-card2)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div className="text-center">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)' }}>{totalSolved}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>Solved</div>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
          <div className="text-center">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, color: 'var(--accent-orange)' }}>{streak}🔥</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>Streak</div>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div style={{ padding: '20px 18px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex-align-center" style={{ gap: '12px', marginBottom: '14px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '16px', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(157, 78, 221, 0.25)', color: '#fff'
          }}>{user?.avatar}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.college}
            </div>
          </div>
        </div>
        <button onClick={logout} className="btn-ghost" style={{ width: '100%', fontSize: '13px', padding: '11px', borderRadius: '12px' }}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
