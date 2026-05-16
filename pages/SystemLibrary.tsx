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
  Lock,
  Crown
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
    methods: userMethods
  } = useBetStore();

  const tabs = [
    { id: 'leagues', label: 'Ligas', icon: Globe, count: userLeagues.length, pro: false }, 
    { id: 'teams', label: 'Clubes', icon: Shield, count: userTeams.length, pro: true },
    { id: 'markets', label: 'Mercados', icon: LayoutGrid, count: customMarkets.length, pro: true },
    { id: 'strategies', label: 'Gestão/Planos', icon: TrendingUp, count: customStrategies.length, pro: true },
    { id: 'methods', label: 'Métodos/Setups', icon: Target, count: userMethods.length, pro: true },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#000000] text-slate-900 dark:text-slate-200 pb-20 md:pl-20 pt-20 md:pt-8 px-4 md:px-8 transition-colors duration-300 font-sans">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
          Strategic Intelligence Core
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          Biblioteca Estratégica
        </h1>
        
        <p className="text-slate-500 dark:text-[#8E8E93] text-sm mt-2 font-medium">
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
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="w-full appearance-none bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] text-slate-900 dark:text-white py-3.5 pl-10 pr-10 rounded-xl font-bold focus:outline-none focus:border-indigo-500 shadow-sm transition-colors text-sm"
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} ({tab.count})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <ChevronDown size={18} />
            </div>
          </div>

          {/* DESKTOP: Abas Horizontais (Apple Style) */}
          <div className="hidden md:flex w-full overflow-x-auto bg-slate-100 dark:bg-[#1C1C1E]/50 p-1 rounded-xl border border-slate-200 dark:border-[#2C2C2E] custom-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const showLock = false; 

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-200 shrink-0
                    ${isActive 
                      ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-[#3A3A3C]' 
                      : 'text-slate-500 dark:text-[#8E8E93] hover:text-slate-700 dark:hover:text-slate-300'}
                  `}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  
                  {/* Badge de Contagem */}
                  {tab.count > 0 && (
                    <span className={`
                      text-[9px] px-2 py-0.5 rounded font-black ml-1
                      ${isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-200 dark:bg-[#3A3A3C] text-slate-500 dark:text-[#8E8E93]'}
                    `}>
                      {tab.count}
                    </span>
                  )}

                  {/* Cadeado PRO */}
                  {showLock && (
                      <Lock size={12} className="ml-1 opacity-50" />
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
              <motion.div key="teams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
                <div>
                    <ManageTeams />
                </div>
              </motion.div>
            )}

            {activeTab === 'markets' && (
              <motion.div key="markets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
                <div>
                    <ManageMarkets />
                </div>
              </motion.div>
            )}

            {/* ABA ESTRATÉGIAS OTIMIZADA */}
            {activeTab === 'strategies' && (
              <motion.div key="strategies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative space-y-8">
                
                <div className="space-y-8">
                    {/* 1. SEÇÃO: MINHAS ESTRATÉGIAS */}
                    <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 tracking-tight flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-indigo-500" /> Meus Planos de Gestão Ativos
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customStrategies.length === 0 ? (
                          <div className="col-span-full text-center py-10 text-slate-500 dark:text-[#8E8E93] text-sm bg-slate-50 dark:bg-[#000000] rounded-xl border border-dashed border-slate-200 dark:border-[#3A3A3C]">
                            Nenhum plano de gestão de caixa importado no momento.
                          </div>
                        ) : (
                          customStrategies.map(s => (
                            <div key={s.id} className="p-4 bg-slate-50 dark:bg-[#000000] border border-slate-100 dark:border-[#2C2C2E] rounded-xl flex justify-between items-center shadow-sm">
                              <span className="text-sm font-bold text-slate-700 dark:text-[#E5E5EA]">{s.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 font-bold uppercase tracking-widest">Ativa</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 2. SEÇÃO: MENU DE MODELOS */}
                    <ManageStrategies />
                </div>
              </motion.div>
            )}

            {activeTab === 'methods' && (
              <motion.div key="methods" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
                <div>
                    <ManageMethods />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SystemLibrary;