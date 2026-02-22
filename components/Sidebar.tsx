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
  Sun
} from 'lucide-react';
import { useBetStore } from '../store/useBetStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Componente de Logo
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
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const { user, logout, isPro, isDarkMode, toggleTheme } = useBetStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // 🔥 NOMENCLATURA INSTITUCIONAL (BLINDAGEM KIWIFY)
  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
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
      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-white dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-50 transition-colors duration-300">
        <Logo />
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-900 dark:text-white p-2">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white dark:bg-[#020617] border-r border-slate-200 dark:border-slate-800 z-40 transition-all duration-300 w-64 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:pt-0 pt-16
      `}>
        
        {/* Desktop Header */}
        <div className="hidden md:flex h-20 items-center px-6 border-b border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
           <Logo />
        </div>

        {/* User Profile Snippet */}
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
            {menuItems.map(item => {
                const isActive = currentView === item.id;
                
                // 🔥 LÓGICA DE ANCORAGEM DO TOUR ADICIONADA AQUI
                let tourClass = '';
                if (item.id === 'dashboard') tourClass = 'tour-sidebar-dashboard';
                if (item.id === 'bancas') tourClass = 'tour-sidebar-bankroll';
                if (item.id === 'mindset') tourClass = 'tour-sidebar-mindset';

                return (
                    <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id)}
                        // Note a variável ${tourClass} injetada na linha abaixo
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

        {/* Footer / CTA PRO */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
            
            {/* Tema Toggle */}
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

      {/* Overlay para fechar no mobile */}
      <AnimatePresence>
        {isOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden"
            />
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;