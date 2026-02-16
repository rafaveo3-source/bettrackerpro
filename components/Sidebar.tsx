import { BookOpen } from 'lucide-react';
import React from 'react';
import { LayoutDashboard, BarChart3, Target, Brain, History, Wallet, CalendarDays, Calculator, Settings, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { useBetStore } from '../store/useBetStore';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const menuItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'analytics', label: 'Análise', icon: BarChart3 },
  { key: 'metas', label: 'Metas', icon: Target },
  { key: 'mindset', label: 'Mindset', icon: Brain },
  { key: 'historico', label: 'Histórico', icon: History },
  { key: 'bancas', label: 'Bancas', icon: Wallet },
  { key: 'calendar', label: 'Calendário', icon: CalendarDays },
  { key: 'calculators', label: 'Calculadoras', icon: Calculator },

  // 🔥 Nova Biblioteca Inteligente
  { key: 'biblioteca', label: 'Biblioteca PRO', icon: Layers },

  { key: 'settings', label: 'Configurações', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen }) => {
  const { user, logout, isDarkMode, toggleTheme } = useBetStore();

  const openView = (view: string) => {
    setView(view);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-2.5 rounded-xl shadow-lg border border-slate-700"
        aria-label="Abrir menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay para fechar ao clicar fora */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } shadow-2xl lg:shadow-none`}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 pt-8 pb-6 border-b border-slate-200 dark:border-white/5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-black">BetTracker Pro</p>
            <h2 className="text-lg font-black text-slate-900 dark:text-white truncate mt-1">{user?.name || 'Operador'}</h2>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            {menuItems.map(({ key, label, icon: Icon }) => {
              const active = currentView === key;
              return (
                <button
                  key={key}
                  onClick={() => openView(key)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 group ${
                    active
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  <Icon size={18} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="text-sm">{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 space-y-2 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/30 m-4 rounded-2xl">
            {/* ✅ Botão de Tema */}
            <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
            >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                <span className="text-sm font-bold">{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>

            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-bold"
            >
              <LogOut size={16} />
              <span className="text-sm">Sair da Conta</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;