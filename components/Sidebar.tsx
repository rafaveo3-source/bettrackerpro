import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BarChart2, 
  Target, 
  BrainCircuit, 
  History, 
  Wallet, 
  CalendarDays, 
  Calculator, 
  Settings, 
  Menu, 
  X,
  BookOpen,
  LogOut,
  Crown,
  Moon,
  Sun,
  PlayCircle,
  Sparkles, 
  Activity, // 🔥 Importado para o Terminal Live
  Lock
} from 'lucide-react';
import { useBetStore } from '../store/useBetStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Logo = () => (
  <div className="flex items-center gap-2 px-2">
    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-[#020617] text-xl italic shadow-lg shadow-emerald-500/20">
      B
    </div>
    <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white hidden md:block">
      BETTRACKER <span className="text-emerald-500">PRO</span>
    </span>
  </div>
);

interface SidebarProps {
    currentView: string;
    setView: (view: string) => void;
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen }) => {
  const { user, logout, isPro, isDarkMode, toggleTheme, resetTutorial } = useBetStore();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    // SCOUT IA E TERMINAL RENDERIZADOS CUSTOMIZADAMENTE ABAIXO
    { id: 'analytics', label: 'Análise de Dados', icon: BarChart2 },
    { id: 'metas', label: 'Metas (Take Profit)', icon: Target },
    { id: 'mindset', label: 'Psicologia', icon: BrainCircuit },
    { id: 'historico', label: 'Diário de Operações', icon: History },
    { id: 'bancas', label: 'Portfólios', icon: Wallet },
    { id: 'calendar', label: 'Calendário', icon: CalendarDays },
    { id: 'calculators', label: 'Calculadoras', icon: Calculator },
    { id: 'biblioteca', label: 'Playbooks PRO', icon: BookOpen },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleNavigation = (id: string) => {
    setView(id);
    setIsOpen(false);
  };

  const handleLogout = () => {
    if(window.confirm('Deseja encerrar a sessão segura?')) {
        logout();
        navigate('/');
    }
  };

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-50 transition-colors duration-300">
        <Logo />
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-900 dark:text-white p-2">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      <aside className={`
        fixed top-0 left-0 h-full bg-white dark:bg-[#020617] border-r border-slate-200 dark:border-slate-800 z-50 transition-transform duration-300 w-64 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:pt-0 pt-16
      `}>
        
        <div className="hidden md:flex h-20 items-center px-6 border-b border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
           <Logo />
        </div>

        <div className="p-6 border-b border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                    <img 
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=10b981&color=fff`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Trader'}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                        {isPro ? (
                            <span className="text-emerald-500 flex items-center gap-1"><Crown size={10}/> Membro PRO</span>
                        ) : (
                            'Plano Gratuito'
                        )}
                    </p>
                </div>
            </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
            {/* BOTÃO DASHBOARD FIXO */}
            <button
                onClick={() => handleNavigation('dashboard')}
                className={`tour-sidebar-dashboard w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group mb-2
                ${currentView === 'dashboard' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
            >
                <LayoutDashboard size={18} className={currentView === 'dashboard' ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white'} />
                Visão Geral
            </button>

            {/* 🔥 BOTÃO KILLER 1: SCOUT HFT IA 🔥 */}
            <div className="tour-sidebar-scout relative mb-2">
               <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/10 blur-xl rounded-full"></div>
               <button
                   onClick={() => handleNavigation('scout')}
                   className={`relative w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 border overflow-hidden group shadow-lg
                   ${currentView === 'scout' 
                       ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-[1.02]' 
                       : 'bg-indigo-50 dark:bg-[#0f172a] text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/40 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'}`}
               >
                   <div className="flex items-center gap-3 relative z-10">
                       <Sparkles size={18} className={`${currentView === 'scout' ? 'animate-pulse text-white' : 'text-indigo-500 dark:text-indigo-400 group-hover:text-white'}`} />
                       Scout IA
                   </div>
                   {!isPro && <Lock size={12} className="opacity-50" />}
                   {isPro && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></div>}
               </button>
            </div>

            {/* 🔥 BOTÃO KILLER 2: TERMINAL LIVE 🔥 */}
            <div className="relative mb-4">
               <button
                   onClick={() => handleNavigation('terminal')}
                   className={`relative w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 border overflow-hidden group shadow-sm
                   ${currentView === 'terminal' 
                       ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02]' 
                       : 'bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-500 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-400'}`}
               >
                   <div className="flex items-center gap-3 relative z-10">
                       <Activity size={18} className={`${currentView === 'terminal' ? 'animate-pulse text-slate-950' : 'text-emerald-500 dark:text-emerald-500 group-hover:text-slate-950'}`} />
                       Terminal Live <span className="text-[8px] bg-slate-950 text-emerald-400 px-1.5 py-0.5 rounded ml-1">BETA</span>
                   </div>
                   {!isPro && <Lock size={12} className="opacity-50" />}
               </button>
            </div>

            {/* RESTANTE DOS BOTÕES */}
            {menuItems.filter(i => i.id !== 'dashboard').map(item => {
                const isActive = currentView === item.id;
                
                let tourClass = '';
                if (item.id === 'bancas') tourClass = 'tour-sidebar-bankroll';
                if (item.id === 'mindset') tourClass = 'tour-sidebar-mindset';
                if (item.id === 'metas') tourClass = 'tour-sidebar-metas';
                if (item.id === 'calendar') tourClass = 'tour-sidebar-calendar';
                if (item.id === 'calculators') tourClass = 'tour-sidebar-calculators';
                if (item.id === 'biblioteca') tourClass = 'tour-sidebar-biblioteca';

                return (
                    <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id)}
                        className={`
                            ${tourClass}
                            w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                            ${isActive 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20' 
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}
                        `}
                    >
                        <item.icon size={18} className={isActive ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-white'} />
                        {item.label}
                    </button>
                )
            })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
            
            <button 
                onClick={() => {
                    resetTutorial();
                    if (window.innerWidth < 768) setIsOpen(true); 
                }}
                className="w-full flex items-center justify-center gap-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-widest mb-2"
            >
                <PlayCircle size={16} /> Rever Tutorial
            </button>

            <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/50 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-widest mb-2"
            >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            </button>

            {!isPro && (
                <div className="mb-4 p-4 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden group cursor-pointer shadow-sm" onClick={() => handleNavigation('pro')}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                    <Crown size={24} className="text-emerald-500 mx-auto mb-2" />
                    <h4 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-widest mb-1">Seja Profissional</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">Libere todas as ferramentas</p>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNavigation('pro');
                        }}
                        className="w-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 dark:hover:bg-emerald-400 transition-colors"
                    >
                        Fazer Upgrade
                    </button>
                </div>
            )}

            <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
            >
                <LogOut size={16} /> Sair do Sistema
            </button>
        </div>

      </aside>

      <AnimatePresence>
        {isOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
            />
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;