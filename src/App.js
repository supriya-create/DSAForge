import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import AuthPage from './pages/AuthPage';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DSATracker from './pages/DSATracker';
import AIAnalysis from './pages/AIAnalysis';
import Roadmap from './pages/Roadmap';
import Problems from './pages/Problems';
import MockOA from './pages/MockOA';
import ReadinessScore from './pages/ReadinessScore';
import DoubtSolver from './pages/DoubtSolver';
import './styles/global.css';

const MainApp = () => {
  const { isLoggedIn, activeTab } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isLoggedIn) return <AuthPage />;

  const pages = {
    dashboard: <Dashboard />,
    tracker: <DSATracker />,
    analysis: <AIAnalysis />,
    roadmap: <Roadmap />,
    problems: <Problems />,
    mockoa: <MockOA />,
    readiness: <ReadinessScore />,
    doubt: <DoubtSolver />,
  };

  return (
    <div className="app-container">
      {/* Mobile Sticky Header */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
          ☰
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800 }}>
          DSA<span className="gradient-text-cyan">Forge</span>
        </span>
        <div style={{ width: '40px' }} /> {/* balancer spacing */}
      </div>

      {/* Sidebar mobile overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Page Content */}
      <main className="main-content">
        {pages[activeTab] || <Dashboard />}
      </main>
    </div>
  );
};

const App = () => (
  <AppProvider>
    <MainApp />
  </AppProvider>
);

export default App;
