import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

// Layout do Sistema
import Layout from './layout';

// Páginas do Sistema
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import History from './pages/History';
import Bankroll from './pages/Bankroll';
import Settings from './pages/Settings';
import PerformanceCalendar from './pages/PerformanceCalendar';
import Calculators from './pages/Calculators';
import Mindset from './pages/Mindset';
import Goals from './pages/Goals';
import SystemLibrary from './pages/SystemLibrary';
import ProPage from './pages/ProPage'; 
import ScoutIA from './pages/ScoutIA'; 
import LiveTerminal from './pages/LiveTerminal';

// Páginas Públicas
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import UpdatePassword from './pages/UpdatePassword';

import { useBetStore, supabase } from './store/useBetStore';
import { Toaster } from './components/ui/Toaster';

const SystemRoutes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentViewID = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/scout')) return 'scout'; 
    if (path.includes('/terminal-live')) return 'terminal';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/goals')) return 'metas';
    if (path.includes('/mindset')) return 'mindset';
    if (path.includes('/history')) return 'historico';
    if (path.includes('/bankrolls')) return 'bancas';
    if (path.includes('/calendar')) return 'calendar';
    if (path.includes('/calculators')) return 'calculators';
    if (path.includes('/library')) return 'biblioteca';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/pro')) return 'pro'; 
    return 'dashboard';
  };

  const handleSetView = (viewId: string) => {
    switch (viewId) {
      case 'dashboard': navigate('/dashboard'); break;
      case 'scout': navigate('/scout'); break; 
      case 'terminal': navigate('/terminal-live'); break;
      case 'analytics': navigate('/analytics'); break;
      case 'metas': navigate('/goals'); break;
      case 'mindset': navigate('/mindset'); break;
      case 'historico': navigate('/history'); break;
      case 'bancas': navigate('/bankrolls'); break;
      case 'calendar': navigate('/calendar'); break;
      case 'calculators': navigate('/calculators'); break;
      case 'biblioteca': navigate('/library'); break;
      case 'settings': navigate('/settings'); break;
      case 'pro': navigate('/pro'); break; 
      default: navigate('/dashboard'); break;
    }
  };

  return (
    <Layout currentView={getCurrentViewID()} setView={handleSetView}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/scout" element={<ScoutIA />} /> 
        <Route path="/terminal-live" element={<LiveTerminal />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/mindset" element={<Mindset />} />
        <Route path="/history" element={<History />} />
        <Route path="/bankrolls" element={<Bankroll />} />
        <Route path="/calendar" element={<PerformanceCalendar />} />
        <Route path="/calculators" element={<Calculators />} />
        <Route path="/library" element={<SystemLibrary />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/pro" element={<ProPage />} /> 
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

const AppContent: React.FC = () => {
  const { setSession, isAuthenticated, isDarkMode } = useBetStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Puxa a sessão primária
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        // 2. Hidrata todo o Zustand (o try/catch interno do setSession protege contra falhas)
        await setSession(session);
      } catch (error) {
        console.error("[AUTH] Erro fatal na hidratação inicial:", error);
        // Em caso de falha severa, garante que o app não trave carregando
        await setSession(null);
      } finally {
        // 3. Libera o roteamento incondicionalmente, mesmo se der erro.
        if (isMounted) setIsInitializing(false);
      }
    };

    // Roda a hidratação
    initializeAuth();

    // 4. Cadastra o listener de eventos (apenas para mudanças futuras)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 🔥 O SEGREDO: Ignora o INITIAL_SESSION para matar a concorrência de Promises 🔥
      if (event === 'INITIAL_SESSION') return;
      
      try {
        await setSession(session);
      } catch (error) {
        console.error("[AUTH] Erro durante a mudança de estado (onAuthStateChange):", error);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setSession]);

  if (isInitializing) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center" />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/*" element={isAuthenticated ? <SystemRoutes /> : <Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;