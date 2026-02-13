
import React from 'react';
import { LayoutDashboard, BarChart3, History, Wallet, Settings, Menu, X, LogOut, Sun, Moon, Calendar, Calculator, BrainCircuit, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBetStore } from '../store/useBetStore';
import { Logo } from './Logo';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen }) => {
  const { isDarkMode, toggleTheme, user, logout } = useBetStore();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'mindset', label: 'Mindset & Diário', icon: BrainCircuit },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'calculators', label: 'Calculadoras', icon: Calculator },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'bancas', label: 'Bancas', icon: Wallet },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="p-8 flex items-center gap-3">
        <Logo size={36} />
        <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
            BetTracker<span className="text-emerald-500">.</span>
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
         <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-[1.5rem] p-5 mb-4 shadow-xl">
            <p className="text-xs font-black text-white mb-1 uppercase tracking-widest">Premium Active</p>
            <p className="text-[10px] text-slate-500 mb-3 leading-relaxed font-bold uppercase">Acesso vitalício à rede neural de dados.</p>
            <button className="text-[10px] text-emerald-500 font-black hover:underline uppercase tracking-tighter">Explorar Tools</button>
         </div>

         <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs font-bold">
            <span className="flex items-center gap-2">{isDarkMode ? <Moon size={16} /> : <Sun size={16} />} Modo {isDarkMode ? 'Escuro' : 'Claro'}</span>
         </button>

        <button onClick={() => { setView('settings'); setIsOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-colors text-xs font-bold ${currentView === 'settings' ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}>
          <Settings size={16} /> Configurações
        </button>
        
        <div className="mt-4 flex items-center gap-3 px-2 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 overflow-hidden p-0.5 shadow-sm">
                <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=10b981&color=fff&bold=true`} alt="User" className="w-full h-full object-cover rounded-[0.6rem]"/>
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tighter italic">{user?.name || 'Visitante'}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Trader Pro</p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-500 p-2 transition-colors">
                <LogOut size={16} />
            </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-72 h-screen fixed left-0 top-0 z-30 shadow-2xl">
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-40 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">BetTracker</span>
         </div>
         <button onClick={() => setIsOpen(true)} className="text-slate-900 dark:text-slate-100 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <Menu size={24} />
         </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed left-0 top-0 w-72 h-full z-50 lg:hidden shadow-2xl">
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
