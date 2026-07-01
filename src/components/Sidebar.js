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

const Sidebar = () => {
  const { user, activeTab, setActiveTab, logout, streak, totalSolved } = useApp();

  return (
    <div style={{
      width: '240px', minHeight: '100vh', background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)', display: 'flex',
      flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
          }}>⚡</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800 }}>
            DSA<span className="gradient-text-cyan">Forge</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 12px', borderRadius: '10px', border: 'none',
            background: activeTab === item.id
              ? 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))'
              : 'transparent',
            color: activeTab === item.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === item.id ? 600 : 400,
            fontFamily: 'var(--font-body)', transition: 'all 0.2s',
            borderLeft: activeTab === item.id ? '2px solid var(--accent-cyan)' : '2px solid transparent',
            width: '100%', textAlign: 'left'
          }}>
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Stats mini */}
      <div style={{ padding: '12px', margin: '0 12px', marginBottom: '8px', background: 'var(--bg-card2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)' }}>{totalSolved}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Solved</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--accent-orange)' }}>{streak}🔥</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Streak</div>
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '15px', flexShrink: 0
          }}>{user?.avatar}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.college}</div>
          </div>
        </div>
        <button onClick={logout} className="btn-ghost" style={{ width: '100%', fontSize: '13px', padding: '8px' }}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
