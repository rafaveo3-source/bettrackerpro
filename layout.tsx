
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NewBetModal from './components/NewBetModal';
import { Plus, Lock } from 'lucide-react';
import { useBetStore, Bet } from './store/useBetStore';
import Auth from './pages/Auth';

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
  const { isDarkMode, primaryColor, isAuthenticated, isTiltLocked, tiltLockUntil } = useBetStore();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
     const interval = setInterval(() => setLocked(isTiltLocked()), 1000);
     return () => clearInterval(interval);
  }, [isTiltLocked]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
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

  if (!isAuthenticated) return <Auth />;

  return (
    <div className="flex min-h-screen font-sans">
      <Sidebar currentView={currentView} setView={setView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 lg:ml-72 transition-all duration-300">
        {locked && (
            <div className="bg-red-600 text-white px-4 py-3 text-center text-[10px] font-black flex items-center justify-center gap-2 sticky top-0 z-50 uppercase tracking-widest shadow-xl">
                <Lock size={14} /> Protocolo de Tilt Ativo. Bloqueio até {new Date(tiltLockUntil!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
        )}

        <div className="p-6 pt-24 lg:p-12 lg:pt-12 max-w-[1400px] mx-auto">
          {children}
        </div>
      </div>

      {!locked && (
          <button onClick={() => { setBetToEdit(undefined); setIsModalOpen(true); }} className="fixed bottom-10 right-10 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-[#020617] p-5 rounded-[2rem] shadow-2xl shadow-emerald-500/20 transition-all hover:scale-110 active:scale-95 z-40 flex items-center gap-3 group border-4 border-white dark:border-slate-900">
            <Plus size={24} />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-black uppercase text-xs tracking-widest">Registrar Entrada</span>
          </button>
      )}

      <NewBetModal isOpen={isModalOpen} betToEdit={betToEdit} onClose={() => { setIsModalOpen(false); setBetToEdit(undefined); }} />
    </div>
  );
};

export default Layout;
