import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  Shield, 
  LayoutGrid, 
  TrendingUp, 
  Target, 
  CheckCircle2,
  ChevronDown,
  Lock
} from 'lucide-react';
import { useBetStore } from '../store/useBetStore';

// ✅ IMPORTAÇÃO DOS GERENCIADORES DEDICADOS
import ManageLeagues from '../components/ManageLeagues';
import ManageTeams from '../components/ManageTeams';
import ManageMarkets from '../components/ManageMarkets';
import ManageMethods from '../components/ManageMethods';
import ManageStrategies from '../components/ManageStrategies';

const SystemLibrary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leagues' | 'teams' | 'markets' | 'strategies' | 'methods'>('leagues');
  const navigate = useNavigate();
  
  // Store Global
  const { 
    userLeagues, 
    userTeams, 
    customMarkets, 
    customStrategies, 
    methods: userMethods,
    isPro // 🔥 Pegue o estado isPro
  } = useBetStore();

  const tabs = [
    { id: 'leagues', label: 'Ligas', icon: Globe, count: userLeagues.length, pro: false }, // Ligas liberado (básico)
    { id: 'teams', label: 'Times', icon: Shield, count: userTeams.length, pro: true },
    { id: 'markets', label: 'Mercados', icon: LayoutGrid, count: customMarkets.length, pro: true },
    { id: 'strategies', label: 'Estratégias', icon: TrendingUp, count: customStrategies.length, pro: true },
    { id: 'methods', label: 'Métodos', icon: Target, count: userMethods.length, pro: true },
  ];

  // Intercepta o clique na aba: se for PRO e não tiver acesso, manda pra página de upgrade
  const handleTabClick = (tabId: string, isProTab: boolean) => {
    if (isProTab && !isPro) {
        navigate('/pro');
        return;
    }
    setActiveTab(tabId as any);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-200 pb-20 md:pl-20 pt-20 md:pt-8 px-4 md:px-8 transition-colors duration-300 font-sans">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
          Strategic Intelligence Core
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-2">
          Biblioteca Estratégica
          <span className="text-slate-300 dark:text-slate-700 text-2xl not-italic">///</span>
        </h1>
        
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">
          Gerencie estruturas globais, métodos profissionais e modelos de importação.
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* NAVEGAÇÃO HÍBRIDA */}
        <div className="mb-8">
          
          {/* MOBILE: Select Dropdown */}
          <div className="md:hidden relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              {React.createElement(tabs.find(t => t.id === activeTab)?.icon || Globe, { size: 18 })}
            </div>
            <select
              value={activeTab}
              onChange={(e) => {
                  const selectedTab = tabs.find(t => t.id === e.target.value);
                  handleTabClick(e.target.value, selectedTab?.pro || false);
              }}
              className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white py-3 pl-10 pr-10 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-colors"
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} ({tab.count}) {tab.pro && !isPro ? '(PRO)' : ''}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <ChevronDown size={18} />
            </div>
          </div>

          {/* DESKTOP: Abas Horizontais */}
          <div className="hidden md:flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto max-w-full custom-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const showLock = tab.pro && !isPro; 

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id, tab.pro)}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 shrink-0
                    ${isActive 
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}
                  `}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  
                  {/* Badge de Contagem */}
                  {tab.count > 0 && (
                    <span className={`
                      text-[10px] px-2 py-0.5 rounded-full font-black ml-1
                      ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}
                    `}>
                      {tab.count}
                    </span>
                  )}

                  {/* Cadeado PRO */}
                  {showLock && (
                      <Lock size={12} className="ml-1 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTEÚDO DINÂMICO */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AnimatePresence mode="wait">
            
            {activeTab === 'leagues' && (
              <motion.div key="leagues" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ManageLeagues />
              </motion.div>
            )}

            {activeTab === 'teams' && (
              <motion.div key="teams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ManageTeams />
              </motion.div>
            )}

            {activeTab === 'markets' && (
              <motion.div key="markets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ManageMarkets />
              </motion.div>
            )}

            {/* ABA ESTRATÉGIAS OTIMIZADA */}
            {activeTab === 'strategies' && (
              <motion.div key="strategies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                
                {/* 1. SEÇÃO: MINHAS ESTRATÉGIAS */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <CheckCircle2 size={18} className="text-emerald-500" /> Minhas Estratégias Ativas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customStrategies.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-slate-400 text-sm bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        Nenhuma estratégia de progressão ativa no momento.
                      </div>
                    ) : (
                      customStrategies.map(s => (
                        <div key={s.id} className="px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex justify-between items-center shadow-sm">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded font-bold uppercase">Ativa</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. SEÇÃO: MENU DE MODELOS */}
                <ManageStrategies />

              </motion.div>
            )}

            {activeTab === 'methods' && (
              <motion.div key="methods" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ManageMethods />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SystemLibrary;