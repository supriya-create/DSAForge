import React from 'react';
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <Sidebar />
      <main style={{
        marginLeft: '240px', flex: 1, padding: '32px',
        minHeight: '100vh', overflowY: 'auto',
        background: 'radial-gradient(ellipse at 80% 10%, rgba(0,212,255,0.03) 0%, transparent 50%), radial-gradient(ellipse at 20% 90%, rgba(124,58,237,0.03) 0%, transparent 50%)'
      }}>
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
