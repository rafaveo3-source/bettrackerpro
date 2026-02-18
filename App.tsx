import React, { useEffect } from 'react';
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

// Páginas Públicas
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import UpdatePassword from './pages/UpdatePassword';

import { useBetStore, supabase } from './store/useBetStore';
import { Toaster } from './components/ui/Toaster';

// ============================================================================
// COMPONENTE: SYSTEM ROUTES (O Sistema Protegido)
// ============================================================================
const SystemRoutes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentViewID = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/goals')) return 'metas';
    if (path.includes('/mindset')) return 'mindset';
    if (path.includes('/history')) return 'historico';
    if (path.includes('/bankrolls')) return 'bancas';
    if (path.includes('/calendar')) return 'calendar';
    if (path.includes('/calculators')) return 'calculators';
    if (path.includes('/library')) return 'biblioteca';
    if (path.includes('/settings')) return 'settings';
    return 'dashboard';
  };

  const handleSetView = (viewId: string) => {
    switch (viewId) {
      case 'dashboard': navigate('/dashboard'); break;
      case 'analytics': navigate('/analytics'); break;
      case 'metas': navigate('/goals'); break;
      case 'mindset': navigate('/mindset'); break;
      case 'historico': navigate('/history'); break;
      case 'bancas': navigate('/bankrolls'); break;
      case 'calendar': navigate('/calendar'); break;
      case 'calculators': navigate('/calculators'); break;
      case 'biblioteca': navigate('/library'); break;
      case 'settings': navigate('/settings'); break;
      default: navigate('/dashboard'); break;
    }
  };

  return (
    <Layout currentView={getCurrentViewID()} setView={handleSetView}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/mindset" element={<Mindset />} />
        <Route path="/history" element={<History />} />
        <Route path="/bankrolls" element={<Bankroll />} />
        <Route path="/calendar" element={<PerformanceCalendar />} />
        <Route path="/calculators" element={<Calculators />} />
        <Route path="/library" element={<SystemLibrary />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

// ============================================================================
// COMPONENTE: APP CONTENT
// ============================================================================
const AppContent: React.FC = () => {
  const { setSession, isAuthenticated, checkProStatus, isDarkMode } = useBetStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Check inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkProStatus();
      }
    });

    // Listener de mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // O evento PASSWORD_RECOVERY é disparado quando o usuário clica no link do e-mail
      if (event === 'PASSWORD_RECOVERY') {
         // O Supabase injeta a sessão automaticamente, não precisamos forçar nada aqui,
         // apenas garantir que o estado seja atualizado.
      }
      setSession(session);
      if (session) {
        checkProStatus();
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, checkProStatus]);

  return (
    <>
      <Routes>
        {/* --- ROTAS PÚBLICAS --- */}
        
        {/* Raiz: Se logado -> Dashboard, Senão -> Landing Page */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
        />

        {/* Login: Se logado -> Dashboard, Senão -> Auth Page */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />} 
        />

        {/* ✅ CORREÇÃO CRÍTICA: Rota de Redefinição de Senha 
            NÃO pode ser protegida por isAuthenticated ? ... : ... 
            Pois o usuário chega aqui via link de e-mail (token na URL) e o Supabase
            ainda está processando a sessão. Se bloquearmos, o token se perde.
        */}
        <Route 
          path="/update-password" 
          element={<UpdatePassword />} 
        />

        {/* --- ROTAS PROTEGIDAS (SISTEMA) --- */}
        <Route 
          path="/*" 
          element={
            isAuthenticated ? (
              <SystemRoutes />
            ) : (
              // Qualquer tentativa de acesso interno sem logar vai pro Login
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
      
      <Toaster />
    </>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;