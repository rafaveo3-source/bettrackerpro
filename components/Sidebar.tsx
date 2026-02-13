import React from 'react';
import { LayoutDashboard, BarChart3, Target, Brain, History, Wallet, CalendarDays, Calculator, Settings, LogOut, Menu, X } from 'lucide-react';
import { useBetStore } from '../store/useBetStore';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const menuItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'metas', label: 'Metas', icon: Target },
  { key: 'mindset', label: 'Mindset', icon: Brain },
  { key: 'historico', label: 'Histórico', icon: History },
  { key: 'bancas', label: 'Bancas', icon: Wallet },
  { key: 'calendar', label: 'Calendário', icon: CalendarDays },
  { key: 'calculators', label: 'Calculadoras', icon: Calculator },
  { key: 'settings', label: 'Configurações', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen }) => {
  const { user, logout } = useBetStore();

  const openView = (view: string) => {
    setView(view);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="lg:hidden fixed top-5 left-5 z-50 bg-slate-900 text-white p-3 rounded-xl"
        aria-label="Abrir menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed top-0 left-0 h-full w-72 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 z-40 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 pt-8 pb-6 border-b border-slate-200 dark:border-white/10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-black">BetTracker</p>
            <h2 className="text-lg font-black text-slate-900 dark:text-white truncate">{user?.name || 'Operador'}</h2>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map(({ key, label, icon: Icon }) => {
              const active = currentView === key;
              return (
                <button
                  key={key}
                  onClick={() => openView(key)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    active
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-white/10">
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} />
              <span className="text-sm font-semibold">Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
