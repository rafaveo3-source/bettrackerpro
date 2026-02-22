import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NewBetModal from './components/NewBetModal';
import { Plus, Lock } from 'lucide-react';
import { useBetStore, Bet } from './store/useBetStore';
import Auth from './pages/Auth';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride'; // <-- ADICIONADO

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: string) => void;
}

const colorPalettes: Record<string, any> = {
  emerald: { 50: '236 253 245', 100: '209 250 229', 500: '16 185 129', 600: '5 150 105' },
  blue: { 50: '239 246 255', 100: '219 234 254', 500: '59 130 246', 600: '37 99 235' },
  purple: { 50: '250 245 255', 100: '243 232 255', 500: '168 85 247', 600: '147 51 234' },
  orange: { 50: '255 247 237', 100: '255 237 213', 500: '249 115 22', 600: '234 88 12' },
  gold: { 50: '255 251 235', 100: '254 243 199', 500: '245 158 11', 600: '217 119 6' }
};

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [betToEdit, setBetToEdit] = useState<Bet | undefined>(undefined);
  const { 
  isDarkMode, 
  primaryColor, 
  isAuthenticated, 
  isTiltLocked, 
  tiltLockUntil,
  toast,
  setToast,
  hasSeenTutorial, // <-- ADICIONADO
  completeTutorial // <-- ADICIONADO
} = useBetStore();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
     const interval = setInterval(() => setLocked(isTiltLocked()), 1000);
     return () => clearInterval(interval);
  }, [isTiltLocked]);

  // ✅ Aplicação correta do tema no HTML principal
  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    const palette = colorPalettes[primaryColor] || colorPalettes.gold;
    const root = document.documentElement;
    Object.entries(palette).forEach(([key, val]) => {
      root.style.setProperty(`--color-primary-${key}`, val as string);
    });
  }, [isDarkMode, primaryColor]);

  useEffect(() => {
    const handleEditBet = (e: any) => { setBetToEdit(e.detail); setIsModalOpen(true); };
    window.addEventListener('editBet', handleEditBet);
    return () => window.removeEventListener('editBet', handleEditBet);
  }, []);

  // 🔥 AUTO CLOSE TOAST
useEffect(() => {
  if (!toast) return;

  const timer = setTimeout(() => {
    setToast(null);
  }, 3000);

  return () => clearTimeout(timer);
}, [toast, setToast]);

// ========================================================
  // 🔥 CONFIGURAÇÃO DO TUTORIAL INTERATIVO (ONBOARDING)
  // ========================================================
  const tutorialSteps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      content: (
        <div className="text-left space-y-2">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Bem-vindo ao BetTracker PRO! 🚀</h3>
          <p className="text-sm text-slate-600 font-medium">Prepare-se para elevar sua gestão bancária a nível institucional. Vamos fazer um tour rápido de 1 minuto para você extrair o máximo do sistema.</p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '.tour-sidebar-dashboard', // Vamos colocar essa classe na Sidebar depois
      placement: 'right',
      content: 'Este é o seu Centro de Comando. Aqui você acompanha KPIs, Metas e a saúde geral do seu capital em tempo real.',
    },
    {
      target: '.tour-sidebar-bankroll',
      placement: 'right',
      content: 'Crie múltiplos portfólios (Bancas). Separe dinheiro de apostas esportivas, cassino, ou diferentes moedas.',
    },
    {
      target: '.tour-sidebar-mindset',
      placement: 'right',
      content: 'Controle Emocional. Registre seu humor diário e veja como ele impacta seus lucros. Se perder o controle, ative a trava de segurança.',
    },
    {
      target: '.tour-fab-button', // Adicionaremos essa classe no botão flutuante de Nova Aposta
      placement: 'top-end',
      content: 'Clique aqui para registrar novas operações, definir stake, odd e fazer o tracking de ROI.',
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    // Se o usuário completou ou pulou o tutorial, nós salvamos no Zustand
    if (finishedStatuses.includes(status)) {
      completeTutorial();
    }
  };

  if (!isAuthenticated) return <Auth />;

  return (
    <div className="flex min-h-screen font-sans bg-slate-50 dark:bg-slate-950 transition-colors duration-300 w-full overflow-x-hidden">
      
      {/* COMPONENTE DO TUTORIAL */}
      {!hasSeenTutorial && isAuthenticated && (
        <Joyride
          steps={tutorialSteps}
          run={true}
          continuous={true}
          showProgress={true}
          showSkipButton={true}
          callback={handleJoyrideCallback}
          styles={{
            options: {
              primaryColor: '#10b981', // Cor do Botão (Emerald 500)
              backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
              textColor: isDarkMode ? '#f8fafc' : '#0f172a',
              arrowColor: isDarkMode ? '#0f172a' : '#ffffff',
              overlayColor: 'rgba(0, 0, 0, 0.75)',
              zIndex: 1000,
            },
            buttonNext: { borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' },
            buttonBack: { color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' },
            buttonSkip: { color: '#ef4444', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' },
            tooltip: { borderRadius: '16px', border: isDarkMode ? '1px solid #1e293b' : '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
            tooltipContainer: { textAlign: 'left' }
          }}
          locale={{ back: 'Voltar', close: 'Fechar', last: 'Finalizar', next: 'Avançar', skip: 'Pular Tour' }}
        />
      )}

      <Sidebar currentView={currentView} setView={setView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 lg:ml-72 transition-all duration-300 min-w-0">
        {locked && (
            <div className="bg-red-600 text-white px-4 py-3 text-center text-[10px] font-black flex items-center justify-center gap-2 sticky top-0 z-50 uppercase tracking-widest shadow-xl">
                <Lock size={14} /> Protocolo de Tilt Ativo. Bloqueio até {new Date(tiltLockUntil!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
        )}

        <div className="p-4 pt-20 lg:p-12 lg:pt-12 max-w-[1400px] mx-auto w-full">
          {children}
        </div>
      </div>

      {!locked && (
          // 🔥 CLASSE 'tour-fab-button' ADICIONADA AO BOTÃO
          <button onClick={() => { setBetToEdit(undefined); setIsModalOpen(true); }} className="tour-fab-button fixed bottom-6 right-6 lg:bottom-10 lg:right-10 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-[#020617] p-4 lg:p-5 rounded-[2rem] shadow-2xl shadow-emerald-500/20 transition-all hover:scale-110 active:scale-95 z-50 flex items-center gap-3 group border-4 border-white dark:border-slate-900">
            <Plus size={24} />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-black uppercase text-xs tracking-widest hidden md:inline-block">Registrar Entrada</span>
          </button>
      )}

      {/* 🔥 GLOBAL TOAST */}
{toast && (
  <div className="fixed top-6 right-6 z-[999] animate-in fade-in slide-in-from-right duration-300">
    <div
      className={`px-6 py-4 rounded-2xl shadow-2xl border text-sm font-bold uppercase tracking-wider backdrop-blur-xl
      ${
        toast.type === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
          : 'bg-red-500/10 border-red-500/30 text-red-500'
      }`}
    >
      {toast.message}
    </div>
  </div>
)}

      <NewBetModal isOpen={isModalOpen} betToEdit={betToEdit} onClose={() => { setIsModalOpen(false); setBetToEdit(undefined); }} />
    </div>
  );
};

export default Layout;