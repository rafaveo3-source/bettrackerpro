import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

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
import SystemLibrary from './pages/SystemLibrary';
import ProPage from './pages/ProPage'; 
import ScoutIA from './pages/ScoutIA'; 
import LiveTerminal from './pages/LiveTerminal';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import UpdatePassword from './pages/UpdatePassword';

import { useBetStore, supabase } from './store/useBetStore';
import { Toaster } from './components/ui/Toaster';

const ProGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isPro = useBetStore(s => s.isPro);
  const navigate = useNavigate();

  if (isPro) return <>{children}</>;

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
      setSession(session).then(() => {
        if (session) checkProStatus();
      });
    });

    return () => subscription.unsubscribe();
  }, [setSession, checkProStatus]);

  if (isInitializing) {
    return <div className="min-h-screen bg-slate-50 dark:bg-[#000000]" />;
  }

  // =========================================================
  // 🔴 SE NÃO ESTIVER LOGADO (Renderiza apenas o lado público)
  // =========================================================
  if (!isAuthenticated) {
    return (
      <>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          {/* Qualquer outra URL joga pro Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </>
    );
  }

  // =========================================================
  // 🟢 SE ESTIVER LOGADO (Renderiza apenas o lado privado)
  // =========================================================
  return (
    <>
      <Layout>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/mindset" element={<Mindset />} />
          <Route path="/history" element={<History />} />
          <Route path="/bankrolls" element={<Bankroll />} />
          <Route path="/calendar" element={<PerformanceCalendar />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pro" element={<ProPage />} /> 

          {/* Bloqueados via ProGate */}
          <Route path="/scout" element={<ProGate><ScoutIA /></ProGate>} /> 
          <Route path="/terminal-live" element={<ProGate><LiveTerminal /></ProGate>} />
          <Route path="/calculators" element={<ProGate><Calculators /></ProGate>} />
          <Route path="/library" element={<ProGate><SystemLibrary /></ProGate>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
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
