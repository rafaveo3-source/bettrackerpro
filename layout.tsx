import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NewBetModal from './components/NewBetModal';
import { Plus, Lock, Rocket, Target, ShieldAlert, BarChart3, Wallet, BrainCircuit, X, CalendarDays, Calculator, BookOpen, Sparkles } from 'lucide-react';
import { useBetStore, Bet } from './store/useBetStore';
import Joyride, { Step, CallBackProps, STATUS, TooltipRenderProps } from 'react-joyride';

interface LayoutProps {
  children: React.ReactNode;
}

const colorPalettes: Record<string, any> = {
  emerald: { 50: '236 253 245', 100: '209 250 229', 500: '16 185 129', 600: '5 150 105' },
  blue: { 50: '239 246 255', 100: '219 234 254', 500: '59 130 246', 600: '37 99 235' },
  purple: { 50: '250 245 255', 100: '243 232 255', 500: '168 85 247', 600: '147 51 234' },
  orange: { 50: '255 247 237', 100: '255 237 213', 500: '249 115 22', 600: '234 88 12' },
  gold: { 50: '255 251 235', 100: '254 243 199', 500: '245 158 11', 600: '217 119 6' }
};

const CustomTooltip = ({ index, step, tooltipProps, primaryProps, backProps, skipProps, isLastStep }: TooltipRenderProps) => {
  return (
    <div {...tooltipProps} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-5 md:p-6 shadow-2xl w-[calc(100vw-32px)] md:max-w-[360px] mx-auto">
      <div className="flex gap-1.5 mb-4 justify-center">
        {[...Array(10)].map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-emerald-500' : 'w-1.5 bg-slate-200 dark:bg-slate-800'}`} />
        ))}
      </div>
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
          {step.title}
        </h3>
      </div>
      <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-6">
        {step.content}
      </div>
      <div className="flex items-center justify-between mt-auto">
        <button {...skipProps} className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1">
          <X size={12} /> Pular
        </button>
        <div className="flex gap-2">
          {index > 0 && (
            <button {...backProps} className="px-4 py-2 rounded-xl text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 uppercase tracking-widest transition-colors">Voltar</button>
          )}
          <button {...primaryProps} className="px-5 py-2 rounded-xl text-[10px] font-black text-white bg-emerald-500 hover:bg-emerald-400 uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
            {isLastStep ? 'Finalizar' : 'Avançar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [betToEdit, setBetToEdit] = useState<Bet | undefined>(undefined);
  const { isDarkMode, primaryColor, isAuthenticated, isTiltLocked, tiltLockUntil, toast, setToast, hasSeenTutorial, completeTutorial } = useBetStore();
  const [locked, setLocked] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!hasSeenTutorial && location.pathname !== '/dashboard') {
        completeTutorial();
    }
  }, [location.pathname, hasSeenTutorial, completeTutorial]);

  useEffect(() => {
    if (!hasSeenTutorial && isAuthenticated && window.innerWidth < 768) {
      setIsSidebarOpen(true);
    }
  }, [hasSeenTutorial, isAuthenticated]);

  useEffect(() => {
     const interval = setInterval(() => setLocked(isTiltLocked()), 1000);
     return () => clearInterval(interval);
  }, [isTiltLocked]);

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); } 
    else { document.documentElement.classList.remove('dark'); }
    
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

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => { setToast(null); }, 3000);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

  const tutorialSteps: Step[] = useMemo(() => [
    { target: 'body', placement: 'center', title: <><Rocket className="text-emerald-500" /> Start do Sistema</>, content: 'Bem-vindo ao BetTracker PRO. Esqueça planilhas amadoras.', disableBeacon: true },
    { target: '.tour-sidebar-dashboard', placement: 'right', title: <><BarChart3 className="text-blue-500" /> Cockpit de Análise</>, content: 'Aqui você acompanha sua Win Rate real e descobre o EV+.' },
    { target: '.tour-sidebar-scout', placement: 'right', title: <><Sparkles className="text-indigo-500" /> Motor Scout IA (PRO)</>, content: 'Nossa Inteligência Artificial lê suas estatísticas e calcula covariância.' },
    { target: '.tour-sidebar-bankroll', placement: 'right', title: <><Wallet className="text-amber-500" /> Gestão de Caixas</>, content: 'Crie múltiplos Portfólios.' },
    { target: '.tour-fab-button', placement: 'top-end', title: <><ShieldAlert className="text-emerald-500" /> Registre o Green</>, content: 'Clique aqui para cadastrar a Stake e a Odd.' }
  ], []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      completeTutorial();
      if (window.innerWidth < 768) setIsSidebarOpen(false); 
    }
  };

  const isDashboard = location.pathname.includes('/dashboard');
  const shouldRunTour = !hasSeenTutorial && isAuthenticated && isDashboard;

  return (
    <div className="flex min-h-screen font-sans bg-slate-50 dark:bg-slate-950 transition-colors duration-300 w-full overflow-x-hidden relative">
      {shouldRunTour && (
        <Joyride
          steps={tutorialSteps}
          run={true}
          continuous={true}
          showProgress={false} 
          showSkipButton={true}
          callback={handleJoyrideCallback}
          tooltipComponent={CustomTooltip}
          floaterProps={{ disableAnimation: true }}
          styles={{ options: { zIndex: 10000, overlayColor: 'rgba(2, 6, 23, 0.85)' } }}
        />
      )}

      {/* FIREWALL: Sidebar agora roda sozinha */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

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
          <button onClick={() => { setBetToEdit(undefined); setIsModalOpen(true); }} className="tour-fab-button fixed bottom-6 right-6 lg:bottom-10 lg:right-10 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-[#020617] p-4 lg:p-5 rounded-[2rem] shadow-2xl shadow-emerald-500/20 transition-all hover:scale-110 active:scale-95 z-40 flex items-center gap-3 group border-4 border-white dark:border-slate-900">
            <Plus size={24} />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-black uppercase text-xs tracking-widest hidden md:inline-block">Registrar Entrada</span>
          </button>
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-[999] animate-in fade-in slide-in-from-right duration-300">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl border text-sm font-bold uppercase tracking-wider backdrop-blur-xl ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
            {toast.message}
          </div>
        </div>
      )}

      <NewBetModal isOpen={isModalOpen} betToEdit={betToEdit} onClose={() => { setIsModalOpen(false); setBetToEdit(undefined); }} />
    </div>
  );
};

export default Layout;
