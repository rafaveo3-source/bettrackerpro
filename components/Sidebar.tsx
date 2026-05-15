import React from 'react';
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
  Eye, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { useBetStore } from '../store/useBetStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Logo = () => (
  <div className="flex items-center gap-3 px-2">
    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-xl shadow-sm">
      B
    </div>
    <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white hidden md:block">
      BETTRACKER <span className="text-indigo-600 dark:text-indigo-500">PRO</span>
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
  // SELETORES ATÔMICOS: Previnem que o menu inteiro re-renderize à toa
  const user = useBetStore(s => s.user);
  const logout = useBetStore(s => s.logout);
  const isPro = useBetStore(s => s.isPro);
  const isDarkMode = useBetStore(s => s.isDarkMode);
  const toggleTheme = useBetStore(s => s.toggleTheme);
  const resetTutorial = useBetStore(s => s.resetTutorial);
  
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    if (window.confirm('Deseja encerrar a sessão segura?')) {
      await logout();
      navigate('/login', { replace: true });
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
  };

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-white dark:bg-[#000000] border-b border-slate-200 dark:border-[#2C2C2E] flex items-center justify-between px-4 z-50 transition-colors duration-300">
        <Logo />
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-900 dark:text-white p-2">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* SIDEBAR CONTAINER */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white dark:bg-[#000000] border-r border-slate-200 dark:border-[#2C2C2E] z-50 transition-transform duration-300 w-64 flex flex-col font-sans
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:pt-0 pt-16
      `}>
        
        <div className="hidden md:flex h-20 items-center px-6 border-b border-slate-200 dark:border-[#2C2C2E] transition-colors duration-300">
           <Logo />
        </div>

        <div className="p-6 border-b border-slate-200 dark:border-[#2C2C2E] transition-colors duration-300">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1C1C1E] overflow-hidden border border-slate-200 dark:border-[#3A3A3C] shrink-0">
                    <img 
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=4f46e5&color=fff`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Trader'}</p>
                    <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] uppercase tracking-wider font-bold">
                        {isPro ? (
                            <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><Crown size={10}/> Membro PRO</span>
                        ) : (
                            'Plano Básico'
                        )}
                    </p>
                </div>
            </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
            
            <button
                onClick={() => handleNavigation('dashboard')}
                className={`tour-sidebar-dashboard w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 group mb-4
                ${currentView === 'dashboard' 
                    ? 'bg-slate-100 text-slate-900 dark:bg-[#1C1C1E] dark:text-white' 
                    : 'text-slate-500 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1C1C1E]/50'}`}
            >
                <LayoutDashboard size={18} className={currentView === 'dashboard' ? 'text-indigo-600 dark:text-indigo-500' : 'text-slate-400 dark:text-[#636366] group-hover:text-slate-600 dark:group-hover:text-white'} />
                Visão Geral
            </button>

            <div className="mb-4 space-y-2">
                <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#636366] mb-2">Módulos de IA</p>
                
                <button
                    onClick={() => handleNavigation('scout')}
                    className={`tour-sidebar-scout w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 group
                    ${currentView === 'scout' 
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' 
                        : 'text-slate-500 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1C1C1E]/50'}`}
                >
                    <div className="flex items-center gap-3">
                        <Sparkles size={18} className={`${currentView === 'scout' ? 'text-indigo-600 dark:text-indigo-500' : 'text-slate-400 dark:text-[#636366] group-hover:text-indigo-500'}`} />
                        Scout IA
                    </div>
                    {!isPro && <Lock size={12} className="opacity-50" />}
                </button>

                <button
                    onClick={() => handleNavigation('terminal')}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 group
                    ${currentView === 'terminal' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                        : 'text-slate-500 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1C1C1E]/50'}`}
                >
                    <div className="flex items-center gap-3">
                        <Eye size={18} className={`${currentView === 'terminal' ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-400 dark:text-[#636366] group-hover:text-emerald-500'}`} />
                        Analista Live
                    </div>
                    {!isPro && <Lock size={12} className="opacity-50" />}
                </button>
            </div>

            <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#636366] mt-6 mb-2">Core System</p>

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
                            w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 group
                            ${isActive 
                                ? 'bg-slate-100 text-slate-900 dark:bg-[#1C1C1E] dark:text-white' 
                                : 'text-slate-500 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1C1C1E]/50'}
                        `}
                    >
                        <item.icon size={18} className={isActive ? 'text-indigo-600 dark:text-indigo-500' : 'text-slate-400 dark:text-[#636366] group-hover:text-slate-600 dark:group-hover:text-white'} />
                        {item.label}
                    </button>
                )
            })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-[#2C2C2E] bg-slate-50 dark:bg-[#000000] transition-colors duration-300">
            
            {!isPro && (
                <div className="mb-4 p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-indigo-500/20 dark:border-[#3A3A3C] text-center cursor-pointer shadow-sm group hover:border-indigo-500 transition-colors" onClick={() => handleNavigation('pro')}>
                    <Crown size={20} className="text-indigo-600 dark:text-indigo-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <h4 className="text-slate-900 dark:text-white font-bold text-sm tracking-tight mb-1">Seja Profissional</h4>
                    <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] mb-3 leading-relaxed">Libere as ferramentas Quantitativas IA.</p>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNavigation('pro');
                        }}
                        className="w-full bg-slate-900 text-white dark:bg-indigo-600 dark:text-white py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                        Fazer Upgrade <ArrowRight size={12}/>
                    </button>
                </div>
            )}

            <div className="flex gap-2">
                <button 
                    onClick={() => { resetTutorial(); if (window.innerWidth < 768) setIsOpen(true); }}
                    className="flex-1 flex items-center justify-center gap-2 text-slate-600 dark:text-[#8E8E93] hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1C1C1E] py-3 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-[#2C2C2E] shadow-sm bg-white dark:bg-[#000000]"
                    title="Rever Tutorial"
                >
                    <PlayCircle size={16} /> 
                </button>

                <button 
                    onClick={toggleTheme}
                    className="flex-1 flex items-center justify-center gap-2 text-slate-600 dark:text-[#8E8E93] hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1C1C1E] py-3 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-[#2C2C2E] shadow-sm bg-white dark:bg-[#000000]"
                    title="Alternar Tema"
                >
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                <button 
                    onClick={handleLogout}
                    className="flex-1 flex items-center justify-center gap-2 text-slate-600 dark:text-[#8E8E93] hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 py-3 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-[#2C2C2E] shadow-sm bg-white dark:bg-[#000000]"
                    title="Sair"
                >
                    <LogOut size={16} /> 
                </button>
            </div>
        </div>

      </aside>

      <AnimatePresence mode="sync">
        {isOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-40 md:hidden"
            />
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;