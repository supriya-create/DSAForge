import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './components/ui';
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

// Architecture change: navigation moved from a single activeTab state to React
// Router routes. Each page is now a first-class route, so deep links, browser
// history/back, and refresh all work. The visual appearance is unchanged.
const MainApp = () => {
  const { isLoggedIn, initializing } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // While the session is being resolved from the httpOnly cookie, render
  // nothing (prevents a flash of the auth screen for logged-in users).
  if (initializing) {
    return <div className="auth-loading" />;
  }

  if (!isLoggedIn) return <AuthPage />;

  return (
    <div className="app-container">
      {/* Mobile Sticky Header */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
          ☰
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          DSA<span className="gradient-text-cyan">Forge</span>
        </span>
        <div style={{ width: '44px' }} /> {/* balancer spacing */}
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
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tracker" element={<DSATracker />} />
          <Route path="/analysis" element={<AIAnalysis />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/mockoa" element={<MockOA />} />
          <Route path="/readiness" element={<ReadinessScore />} />
          <Route path="/doubt" element={<DoubtSolver />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <ToastProvider>
    <AppProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </AppProvider>
  </ToastProvider>
);

export default App;
