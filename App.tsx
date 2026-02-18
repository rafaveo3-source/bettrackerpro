import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

// Layout do Sistema (Sidebar + Conteúdo)
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
import AuthPage from './pages/AuthPage'; // Certifique-se de ter criado este arquivo

// Store & Utils
import { useBetStore, supabase } from './store/useBetStore';
import { Toaster } from './components/ui/Toaster'; // Importe seu componente de Toast se tiver, ou remova

// ============================================================================
// COMPONENTE: SYSTEM ROUTES (O Sistema Protegido)
// ============================================================================
// Este componente encapsula toda a lógica do Layout com Sidebar e o Adapter
// de navegação que converte URLs em IDs de menu visual.
const SystemRoutes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- ADAPTADOR DE NAVEGAÇÃO ---
  // 1. Converte a URL atual para o ID que o Layout espera (para marcar o menu ativo)
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

  // 2. Converte o clique do Layout para navegação real
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
        
        {/* Redireciona qualquer rota desconhecida DENTRO do sistema para o dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

// ============================================================================
// COMPONENTE: APP CONTENT (Lógica de Autenticação e Rotas Principais)
// ============================================================================
const AppContent: React.FC = () => {
  const { setSession, isAuthenticated, checkProStatus, isDarkMode } = useBetStore();

  // Controle do Tema
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Controle de Sessão e Status PRO
  useEffect(() => {
    // 1. Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkProStatus(); // Checa se é PRO ao carregar
      }
    });

    // 2. Escutar mudanças de auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

        {/* --- ROTAS PROTEGIDAS (SISTEMA) --- */}
        <Route 
          path="/*" 
          element={
            isAuthenticated ? (
              <SystemRoutes />
            ) : (
              // Se tentar acessar /dashboard sem logar, manda pro Login
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
      
      {/* Toast Global para notificações */}
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