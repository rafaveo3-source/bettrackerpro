import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
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

// Componente interno que tem acesso ao contexto do Router
const AppContent: React.FC = () => {
  const { setSession } = useBetStore();
  const navigate = useNavigate();
  const location = useLocation();

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

  // --- ADAPTADOR DE NAVEGAÇÃO ---
  // Isso garante que o seu Layout atual (que usa strings como 'dashboard', 'metas')
  // funcione sincronizado com as novas URLs do React Router.

  // 1. Converte a URL atual para o ID que o Layout espera (para marcar o menu ativo)
  const getCurrentViewID = () => {
    const path = location.pathname;
    switch (path) {
      case '/': return 'dashboard';
      case '/analytics': return 'analytics';
      case '/goals': return 'metas';
      case '/mindset': return 'mindset';
      case '/history': return 'historico';
      case '/bankrolls': return 'bancas';
      case '/calendar': return 'calendar';
      case '/calculators': return 'calculators';
      case '/library': return 'biblioteca';
      case '/settings': return 'settings';
      default: return 'dashboard';
    }
  };

  // 2. Converte o clique do Layout (ex: setView('metas')) para uma navegação de URL real
  const handleSetView = (viewId: string) => {
    switch (viewId) {
      case 'dashboard': navigate('/'); break;
      case 'analytics': navigate('/analytics'); break;
      case 'metas': navigate('/goals'); break;
      case 'mindset': navigate('/mindset'); break;
      case 'historico': navigate('/history'); break;
      case 'bancas': navigate('/bankrolls'); break;
      case 'calendar': navigate('/calendar'); break;
      case 'calculators': navigate('/calculators'); break;
      case 'biblioteca': navigate('/library'); break;
      case 'settings': navigate('/settings'); break;
      default: navigate('/'); break;
    }
  };

  return (
    <Layout currentView={getCurrentViewID()} setView={handleSetView}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/mindset" element={<Mindset />} />
        <Route path="/history" element={<History />} />
        <Route path="/bankrolls" element={<Bankroll />} />
        <Route path="/calendar" element={<PerformanceCalendar />} />
        <Route path="/calculators" element={<Calculators />} />
        <Route path="/library" element={<SystemLibrary />} />
        <Route path="/settings" element={<Settings />} />
        {/* Rota de fallback para 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

// Componente Principal que Envolve tudo com o Router
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;