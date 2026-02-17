import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Globe, 
  Shield, 
  LayoutGrid,
  Download,
  Check,
  CheckCircle2 // ✅ CORRIGIDO: Import adicionado para evitar o erro ReferenceError
} from 'lucide-react';
import { supabase } from '../store/useBetStore';
import { useBetStore } from '../store/useBetStore';

// Importação dos Novos Componentes de Gerenciamento
import ManageLeagues from '../components/ManageLeagues';
import ManageTeams from '../components/ManageTeams';

const SystemLibrary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leagues' | 'teams' | 'markets' | 'strategies' | 'methods'>('leagues');
  
  // Store Global
  const { 
    userLeagues, 
    userTeams, 
    customMarkets, 
    customStrategies, 
    methods: userMethods,
    importMarket,
    importSystemMethod,
    importProgressionStrategy
  } = useBetStore();

  // Estados Locais para Dados Globais
  const [globalMarkets, setGlobalMarkets] = useState<any[]>([]);
  const [globalMethods, setGlobalMethods] = useState<any[]>([]);
  const [globalStrategies, setGlobalStrategies] = useState<any[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(true);

  useEffect(() => {
    const fetchGlobalLibrary = async () => {
      const [m, sm, ps] = await Promise.all([
        supabase.from('markets').select('*').eq('is_active', true),
        supabase.from('system_methods').select('*'),
        supabase.from('progression_strategies').select('*'),
      ]);

      setGlobalMarkets(m.data || []);
      setGlobalMethods(sm.data || []);
      setGlobalStrategies(ps.data || []);
      setLoadingGlobal(false);
    };

    fetchGlobalLibrary();
  }, []);

  const tabs = [
    { id: 'leagues', label: 'Ligas', icon: Globe, count: userLeagues.length },
    { id: 'teams', label: 'Times', icon: Shield, count: userTeams.length },
    { id: 'markets', label: 'Mercados', icon: LayoutGrid, count: customMarkets.length },
    { id: 'strategies', label: 'Estratégias', icon: TrendingUp, count: customStrategies.length },
    { id: 'methods', label: 'Métodos', icon: Target, count: userMethods.length },
  ];

  // Componente de Card Reutilizável (Estilo Premium Clean)
  const GlobalItemCard = ({ item, isImported, onImport }: any) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-500/50 transition-all shadow-sm">
      <div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.name}</h4>
        {item.description && <p className="text-xs text-slate-500 mt-1">{item.description}</p>}
      </div>
      
      {isImported ? (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
          <Check size={12} /> Ativo
        </span>
      ) : (
        <button
          onClick={() => onImport(item.id)}
          className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 dark:hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:border-transparent"
        >
          <Download size={14} /> Importar
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-200 pb-20 md:pl-20 pt-20 md:pt-8 px-4 md:px-8 transition-colors duration-300 font-sans">
      
      {/* HEADER (Estilo Calendário) */}
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
        
        {/* FILTROS / ABAS (Estilo Clean) */}
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm inline-flex mb-8 overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200
                  ${isActive 
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}
                `}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`
                    text-[10px] px-1.5 py-0.5 rounded-full font-black ml-1
                    ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* CONTEÚDO */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AnimatePresence mode="wait">
            
            {/* ABA: LIGAS */}
            {activeTab === 'leagues' && (
              <motion.div
                key="leagues"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                <ManageLeagues />
              </motion.div>
            )}

            {/* ABA: TIMES */}
            {activeTab === 'teams' && (
              <motion.div
                key="teams"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                <ManageTeams />
              </motion.div>
            )}

            {/* ABA: MERCADOS */}
            {activeTab === 'markets' && (
              <motion.div
                key="markets"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Meus Mercados */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <CheckCircle2 size={18} className="text-emerald-500" /> Meus Mercados
                  </h3>
                  <div className="space-y-2">
                    {customMarkets.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        Nenhum mercado ativo
                      </div>
                    ) : (
                      customMarkets.map(m => (
                        <div key={m.id} className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                          {m.name}
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Biblioteca Global */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <Globe size={18} className="text-blue-500" /> Explorar Global
                  </h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {loadingGlobal ? <p className="text-slate-500 text-sm">Carregando...</p> : globalMarkets.map(m => (
                      <GlobalItemCard 
                        key={m.id} 
                        item={m} 
                        isImported={customMarkets.some(cm => cm.name === m.name)} 
                        onImport={() => importMarket(m.id)}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ABA: ESTRATÉGIAS */}
            {activeTab === 'strategies' && (
              <motion.div
                key="strategies"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <CheckCircle2 size={18} className="text-emerald-500" /> Minhas Estratégias
                  </h3>
                  <div className="space-y-2">
                    {customStrategies.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        Nenhuma estratégia ativa
                      </div>
                    ) : (
                      customStrategies.map(s => (
                        <div key={s.id} className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                          {s.name}
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <Globe size={18} className="text-blue-500" /> Modelos PRO
                  </h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {loadingGlobal ? <p className="text-slate-500 text-sm">Carregando...</p> : globalStrategies.map(s => (
                      <GlobalItemCard 
                        key={s.id} 
                        item={s} 
                        isImported={customStrategies.some(cs => cs.name === s.name)}
                        onImport={() => importProgressionStrategy(s.id)}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ABA: MÉTODOS */}
            {activeTab === 'methods' && (
              <motion.div
                key="methods"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <CheckCircle2 size={18} className="text-emerald-500" /> Meus Métodos
                  </h3>
                  <div className="space-y-2">
                    {userMethods.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        Nenhum método cadastrado
                      </div>
                    ) : (
                      userMethods.map(m => (
                        <div key={m.id} className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                          {m.name}
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <Globe size={18} className="text-blue-500" /> Métodos Validados
                  </h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {loadingGlobal ? <p className="text-slate-500 text-sm">Carregando...</p> : globalMethods.map(m => (
                      <GlobalItemCard 
                        key={m.id} 
                        item={m} 
                        isImported={userMethods.some(um => um.name === m.name)}
                        onImport={() => importSystemMethod(m.id)}
                      />
                    ))}
                  </div>
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