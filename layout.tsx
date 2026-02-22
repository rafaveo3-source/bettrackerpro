import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NewBetModal from './components/NewBetModal';
import { Plus, Lock, Rocket, Target, ShieldAlert, BarChart3, Wallet, BrainCircuit, X } from 'lucide-react';
import { useBetStore, Bet } from './store/useBetStore';
import Auth from './pages/Auth';
import Joyride, { Step, CallBackProps, STATUS, TooltipRenderProps } from 'react-joyride';

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

// ========================================================
// 🎨 COMPONENTE CUSTOMIZADO DO TOOLTIP (NÍVEL PRO)
// ========================================================
const CustomTooltip = ({
  index,
  step,
  tooltipProps,
  primaryProps,
  backProps,
  skipProps,
  isLastStep,
}: TooltipRenderProps) => {
  return (
    <div
      {...tooltipProps}
      className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-2xl max-w-[360px] w-full"
    >
      {/* Indicador de Progresso (Dots) */}
      <div className="flex gap-1.5 mb-5 justify-center">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-emerald-500' : 'w-1.5 bg-slate-200 dark:bg-slate-800'}`} />
        ))}
      </div>

      {/* Título com Ícone */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
          {step.title}
        </h3>
      </div>

      {/* Corpo de Texto */}
      <div className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-6">
        {step.content}
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between mt-auto">
        <button
          {...skipProps}
          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-widest transition-colors flex items-center gap-1"
        >
          <X size={12} /> Pular Tour
        </button>

        <div className="flex gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="px-4 py-2 rounded-xl text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 uppercase tracking-widest transition-colors"
            >
              Voltar
            </button>
          )}
          <button
            {...primaryProps}
            className="px-5 py-2 rounded-xl text-[10px] font-black text-white bg-emerald-500 hover:bg-emerald-400 uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            {isLastStep ? 'Finalizar' : 'Avançar'}
          </button>
        </div>
      </div>
    </div>
  );
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
  hasSeenTutorial,
  completeTutorial
} = useBetStore();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
     const interval = setInterval(() => setLocked(isTiltLocked()), 1000);
     return () => clearInterval(interval);
  }, [isTiltLocked]);

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

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => { setToast(null); }, 3000);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

  // ========================================================
  // 🔥 CONFIGURAÇÃO DO TUTORIAL INTERATIVO (COPY FOCADA EM BETS)
  // ========================================================
  const tutorialSteps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      title: <><Rocket className="text-emerald-500" /> Start do Sistema</>,
      content: 'Bem-vindo ao BetTracker PRO. Esqueça planilhas amadoras. Vamos blindar o seu capital e escalar sua consistência no mercado esportivo.',
      disableBeacon: true,
    },
    {
      target: '.tour-sidebar-dashboard',
      placement: 'right',
      title: <><BarChart3 className="text-blue-500" /> Cockpit de Análise</>,
      content: 'Onde o dinheiro é medido. Aqui você acompanha sua Win Rate real, descobre o EV+ das suas operações e mede seu Max Drawdown para evitar quebras de banca.',
    },
    {
      target: '.tour-sidebar-bankroll',
      placement: 'right',
      title: <><Wallet className="text-amber-500" /> Gestão de Caixas</>,
      content: 'Nunca misture o dinheiro. Crie múltiplos Portfólios para separar sua banca de cantos, gestão conservadora, ou caixa alavancado de alta exposição.',
    },
    {
      target: '.tour-sidebar-metas', // ATENÇÃO: Iremos adicionar essa classe na Sidebar
      placement: 'right',
      title: <><Target className="text-purple-500" /> Sistema Take Profit</>,
      content: 'O mercado não tem fim, mas sua meta deve ter. Configure alvos financeiros e o sistema travará a banca automaticamente quando você atingir o lucro desejado.',
    },
    {
      target: '.tour-sidebar-mindset',
      placement: 'right',
      title: <><BrainCircuit className="text-orange-500" /> Módulo Psicológico</>,
      content: 'Mais de 80% das bancas quebram por descontrole emocional (Tilt). Registre como você se sentiu e veja como sua mente impacta o seu ROI a longo prazo.',
    },
    {
      target: '.tour-fab-button',
      placement: 'top-end',
      title: <><ShieldAlert className="text-emerald-500" /> Registre o Green</>,
      content: 'Acabou a operação? Clique aqui. Cadastre a Stake e a Odd. O motor do BetTracker fará todo o cruzamento de dados matemáticos de forma automática.',
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      completeTutorial();
    }
  };

  if (!isAuthenticated) return <Auth />;

  return (
    <div className="flex min-h-screen font-sans bg-slate-50 dark:bg-slate-950 transition-colors duration-300 w-full overflow-x-hidden">
      
      {/* MOTOR DO TUTORIAL INJETADO E CUSTOMIZADO */}
      {!hasSeenTutorial && isAuthenticated && (
        <Joyride
          steps={tutorialSteps}
          run={true}
          continuous={true}
          showProgress={false} // Desabilitado o padrão, pois criamos um na mão
          showSkipButton={true}
          callback={handleJoyrideCallback}
          tooltipComponent={CustomTooltip} // <-- Chama o componente Tailwind lindão
          styles={{
            options: {
              zIndex: 1000,
              overlayColor: 'rgba(2, 6, 23, 0.85)', // Fundo mais escuro, focando no app
            }
          }}
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
          <button onClick={() => { setBetToEdit(undefined); setIsModalOpen(true); }} className="tour-fab-button fixed bottom-6 right-6 lg:bottom-10 lg:right-10 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-[#020617] p-4 lg:p-5 rounded-[2rem] shadow-2xl shadow-emerald-500/20 transition-all hover:scale-110 active:scale-95 z-50 flex items-center gap-3 group border-4 border-white dark:border-slate-900">
            <Plus size={24} />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-black uppercase text-xs tracking-widest hidden md:inline-block">Registrar Entrada</span>
          </button>
      )}

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