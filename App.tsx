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

// =====================================================================
// 🔥 CÃO DE GUARDA GLOBAL (ERROR BOUNDARY) 🔥
// Captura qualquer "congelamento" ou erro silencioso dentro das páginas
// =====================================================================
class GlobalErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 ERRO FATAL SILENCIOSO CAPTURADO:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-900 flex flex-col items-center justify-center p-8 text-white font-mono">
          <h1 className="text-4xl font-black mb-4">🚨 TELA CONGELADA DETECTADA 🚨</h1>
          <p className="text-lg mb-8 text-center max-w-2xl">O sistema impediu um congelamento. Um erro dentro da página que você tentou acessar causou um colapso na renderização.</p>
          <div className="bg-black/50 p-6 rounded-xl w-full max-w-4xl overflow-auto text-sm text-red-200">
            <strong>Causa do Erro:</strong><br />
            {this.state.error?.toString()}<br /><br />
            <strong>Rastreamento:</strong><br />
            {this.state.error?.stack}
          </div>
          <button onClick={() => window.location.href = '/dashboard'} className="mt-8 bg-white text-red-900 px-8 py-4 rounded-xl font-bold uppercase tracking-widest">
            Voltar para o Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      <GlobalErrorBoundary>
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
      </GlobalErrorBoundary>
    </Layout>
  );
};

const AppContent: React.FC = () => {
  const { setSession, isAuthenticated, checkProStatus, isDarkMode } = useBetStore();
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

    const initApp = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await setSession(session);
            if (session) await checkProStatus();
        } finally {
            if (isMounted) setIsInitializing(false);
        }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;
      await setSession(session);
      if (session) await checkProStatus();
    });

    return () => {
        isMounted = false;
        subscription.unsubscribe();
    };
  }, [setSession, checkProStatus]);

  if (isInitializing) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#000000] flex flex-col items-center justify-center gap-5">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 dark:text-[#8E8E93] text-[10px] font-bold uppercase tracking-widest animate-pulse">
                Carregando Sistema...
            </p>
        </div>
    );
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