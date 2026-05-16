import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
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
// 🔥 PRO GATE: Bloqueio Seguro (Apenas o Card, sem re-renders pesados)
// =====================================================================
const ProGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isPro = useBetStore(s => s.isPro);
  const navigate = useNavigate();

  if (isPro) {
    return <>{children}</>;
  }

  // Para usuários FREE: Renderiza o aviso limpo e protege o DOM.
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
        <button onClick={() => navigate('/pro')} className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
          Desbloquear Módulo
        </button>
      </div>
    </div>
  );
};

// =====================================================================
// 🔥 PROTECTED ROUTE: Evita aninhamento complexo de rotas (Gargalo RRv6)
// =====================================================================
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useBetStore(s => s.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // O Layout agora abraça diretamente o componente renderizado.
  return <Layout>{children}</Layout>;
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
        {/* ================================== */}
        {/* ROTAS PÚBLICAS                     */}
        {/* ================================== */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/update-password" element={<UpdatePassword />} />

        {/* ================================== */}
        {/* ROTAS PRIVADAS (FREE & PRO)        */}
        {/* ================================== */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/mindset" element={<ProtectedRoute><Mindset /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/bankrolls" element={<ProtectedRoute><Bankroll /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><PerformanceCalendar /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/pro" element={<ProtectedRoute><ProPage /></ProtectedRoute>} /> 
        
        {/* ================================== */}
        {/* ROTAS EXCLUSIVAS (PRO GATE)        */}
        {/* ================================== */}
        <Route path="/scout" element={<ProtectedRoute><ProGate><ScoutIA /></ProGate></ProtectedRoute>} /> 
        <Route path="/terminal-live" element={<ProtectedRoute><ProGate><LiveTerminal /></ProGate></ProtectedRoute>} />
        <Route path="/calculators" element={<ProtectedRoute><ProGate><Calculators /></ProGate></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><ProGate><SystemLibrary /></ProGate></ProtectedRoute>} />

        {/* ================================== */}
        {/* FALLBACK (Rota Inexistente)        */}
        {/* ================================== */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
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
