import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

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
// 🔥 PRO GATE: Otimizado para não congelar contas FREE
// =====================================================================
const ProGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isPro = useBetStore(s => s.isPro);
  const navigate = useNavigate();

  if (isPro) {
    return <>{children}</>;
  }

  // FIX: Se for FREE, não renderizamos o {children} (ex: ScoutIA) com Blur por cima.
  // Isso impede que componentes gigantes rodem no fundo e travem a tela.
  return (
    <div className="relative w-full min-h-[70vh] flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-slate-50 dark:bg-[#1C1C1E]/30">
      <div className="absolute inset-0 z-0 bg-indigo-500/5 dark:bg-indigo-500/10 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full mx-4 bg-white dark:bg-[#1C1C1E] border border-indigo-500/20 dark:border-indigo-500/30 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
           <Lock size={32} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Acesso Restrito</h2>
        <p className="text-sm text-slate-500 dark:text-[#8E8E93] mb-8 leading-relaxed font-medium">
          Este módulo de inteligência é exclusivo para membros PRO. Eleve sua gestão e tome decisões matemáticas precisas.
        </p>
        <button
          onClick={() => navigate('/pro')}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
        >
          Desbloquear Módulo
        </button>
      </div>
    </div>
  );
};

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
        <Route path="/scout" element={<ProGate><ScoutIA /></ProGate>} /> 
        <Route path="/terminal-live" element={<ProGate><LiveTerminal /></ProGate>} />
        <Route path="/calculators" element={<ProGate><Calculators /></ProGate>} />
        <Route path="/library" element={<ProGate><SystemLibrary /></ProGate>} />
        
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/mindset" element={<Mindset />} />
        <Route path="/history" element={<History />} />
        <Route path="/bankrolls" element={<Bankroll />} />
        <Route path="/calendar" element={<PerformanceCalendar />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/pro" element={<ProPage />} /> 
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

const AppContent: React.FC = () => {
  const { setSession, isAuthenticated, checkProStatus, isDarkMode } = useBetStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session).then(() => {
        if (session) checkProStatus();
        setIsInitializing(false); 
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkProStatus();
    });

    return () => subscription.unsubscribe();
  }, [setSession, checkProStatus]);

  if (isInitializing) {
    return <div className="min-h-screen bg-slate-50 dark:bg-[#000000] flex items-center justify-center" />;
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
