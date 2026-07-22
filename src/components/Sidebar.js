import React from 'react';
import { useApp } from '../context/AppContext';

const navItems = [
  { id: 'dashboard', icon: '⚡', label: 'Dashboard' },
  { id: 'tracker', icon: '📊', label: 'DSA Tracker' },
  { id: 'analysis', icon: '🧠', label: 'AI Analysis' },
  { id: 'roadmap', icon: '🗺', label: 'Roadmap' },
  { id: 'problems', icon: '🎯', label: 'Problems' },
  { id: 'mockoa', icon: '📝', label: 'Mock OA' },
  { id: 'readiness', icon: '🏆', label: 'Readiness' },
  { id: 'doubt', icon: '🤖', label: 'AI Doubts' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, activeTab, setActiveTab, logout, streak, totalSolved } = useApp();

  const handleTabClick = (id) => {
    setActiveTab(id);
    if (onClose) onClose(); // close sidebar drawer on mobile after clicking
  };

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
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>
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
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={`sidebar-nav-btn ${activeTab === item.id ? 'active' : ''}`}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
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
