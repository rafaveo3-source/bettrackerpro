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
  Crown
} from 'lucide-react';
import { useBetStore } from '../store/useBetStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Logo
const Logo = () => (
  <div className="flex items-center gap-2 px-2">
    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-[#020617] text-xl italic shadow-lg shadow-emerald-500/20">
      B
    </div>
    <span className="font-bold text-lg tracking-tight text-white hidden md:block">
      BETTRACKER <span className="text-emerald-500">PRO</span>
    </span>
  </div>
);

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const { user, logout, isPro } = useBetStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Análise', icon: BarChart2 },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'mindset', label: 'Mindset', icon: BrainCircuit },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'bancas', label: 'Bancas', icon: Wallet },
    { id: 'calendar', label: 'Calendário', icon: CalendarDays },
    { id: 'calculators', label: 'Calculadoras', icon: Calculator },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleNavigation = (id: string) => {
    setView(id);
    setIsOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair?')) {
      logout();
      navigate('/');
    }
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-[#020617] border-b border-slate-800 flex items-center justify-between px-4 z-50">
        <Logo />
        <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-[#020617] border-r border-slate-800 z-40 
          transition-transform duration-300 w-64 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          md:pt-0 pt-16
        `}
      >
        {/* Desktop Header */}
        <div className="hidden md:flex h-20 items-center px-6 border-b border-slate-800/50">
          <Logo />
        </div>

        {/* User */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=10b981&color=fff`
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {user?.name || 'Apostador'}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                {isPro ? (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <Crown size={10} /> Membro PRO
                  </span>
                ) : (
                  'Plano Gratuito'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium 
                  transition-all duration-200 group
                  ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                `}
              >
                <item.icon
                  size={18}
                  className={
                    isActive
                      ? 'text-emerald-500'
                      : 'text-slate-500 group-hover:text-white'
                  }
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/50 bg-[#020617]">
          {!isPro && (
            <div
              className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-center relative overflow-hidden group cursor-pointer"
              onClick={() => handleNavigation('pro')}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
              <Crown size={24} className="text-emerald-500 mx-auto mb-2" />
              <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-1">
                Seja Profissional
              </h4>
              <p className="text-[10px] text-slate-400 mb-3">
                Libere todas as ferramentas
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation('pro');
                }}
                className="w-full bg-white text-slate-950 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors"
              >
                Fazer Upgrade
              </button>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Overlay Mobile */}
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
