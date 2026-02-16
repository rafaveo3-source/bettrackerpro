
import React, { useState, useEffect } from 'react';
import Layout from './layout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import History from './pages/History';
import Bankroll from './pages/Bankroll';
import Settings from './pages/Settings';
import PerformanceCalendar from './pages/PerformanceCalendar';
import Calculators from './pages/Calculators';
import Mindset from './pages/Mindset';
import Goals from './pages/Goals';
import { useBetStore, supabase } from './store/useBetStore';
import SystemLibrary from './pages/SystemLibrary';
case 'biblioteca':
  return <SystemLibrary />;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const { setSession } = useBetStore();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return <Analytics />;
      case 'metas':
        return <Goals />;
      case 'mindset':
        return <Mindset />;
      case 'historico':
        return <History />;
      case 'bancas':
        return <Bankroll />;
      case 'calendar':
        return <PerformanceCalendar />;
      case 'calculators':
        return <Calculators />;
      case 'settings':
        return <Settings />;
        case 'system-library':
  return <SystemLibrary />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

export default App;
