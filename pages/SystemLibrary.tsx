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
  Check
} from 'lucide-react';
import { supabase } from '../store/useBetStore';
import { useBetStore } from '../store/useBetStore';

// Importação dos Novos Componentes de Gerenciamento
import ManageLeagues from '../components/ManageLeagues';
import ManageTeams from '../components/ManageTeams';

const SystemLibrary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leagues' | 'teams' | 'markets' | 'strategies' | 'methods'>('leagues');
  
  // Store Global (Dados do Usuário)
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

  // Estados Locais para Dados Globais (Biblioteca)
  const [globalMarkets, setGlobalMarkets] = useState<any[]>([]);
  const [globalMethods, setGlobalMethods] = useState<any[]>([]);
  const [globalStrategies, setGlobalStrategies] = useState<any[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(true);

  // Carregar dados globais para as abas que ainda não têm componentes dedicados
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

  // Componente de Item da Lista Global
  const GlobalItemCard = ({ item, type, isImported, onImport }: any) => (
    <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all group">
      <div>
        <h4 className="font-bold text-slate-200 text-sm">{item.name}</h4>
        {item.description && <p className="text-xs text-slate-500 mt-1">{item.description}</p>}
      </div>
      
      {isImported ? (
        <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <Check size={12} /> Ativo
        </span>
      ) : (
        <button
          onClick={() => onImport(item.id)}
          className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 group-hover:shadow-lg"
        >
          <Download size={14} /> Importar
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 md:pl-20 pt-20 md:pt-10 px-4 md:px-8">
      
      {/* HEADER DA PÁGINA */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex items-center gap-2 text-purple-500 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]"></span>
          Strategic Intelligence Core
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3 italic uppercase">
          <BookOpen className="text-purple-500" size={32} />
          Biblioteca
          <span className="text-slate-700 text-lg ml-2">///</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base font-medium max-w-2xl">
          Gerencie suas ligas ativas, importe estratégias validadas e configure seu arsenal de apostas.
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* NAVEGAÇÃO POR ABAS */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-2 md:gap-4 scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  relative flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-lg shadow-purple-900/50 border border-purple-500/50' 
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'}
                `}
              >
                <tab.icon size={18} className={isActive ? 'text-purple-200' : ''} />
                {tab.label}
                
                <span className={`
                  text-[10px] px-2 py-0.5 rounded-full font-black ml-1
                  ${isActive ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-500'}
                `}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ÁREA DE CONTEÚDO */}
        <div className="min-h-[500px] rounded-3xl animate-in fade-in zoom-in-95 duration-300">
          <AnimatePresence mode="wait">
            
            {/* ABA: LIGAS (Novo Componente) */}
            {activeTab === 'leagues' && (
              <motion.div
                key="leagues"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <ManageLeagues />
              </motion.div>
            )}

            {/* ABA: TIMES (Novo Componente) */}
            {activeTab === 'teams' && (
              <motion.div
                key="teams"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <ManageTeams />
              </motion.div>
            )}

            {/* ABA: MERCADOS */}
            {activeTab === 'markets' && (
              <motion.div
                key="markets"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {/* Meus Mercados */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" /> Meus Mercados Ativos
                  </h3>
                  <div className="space-y-2">
                    {customMarkets.length === 0 ? (
                      <p className="text-slate-500 text-sm">Nenhum mercado ativado.</p>
                    ) : (
                      customMarkets.map(m => (
                        <div key={m.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300">
                          {m.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Biblioteca Global */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Globe className="text-purple-500" /> Biblioteca Global
                  </h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {loadingGlobal ? <p>Carregando...</p> : globalMarkets.map(m => (
                      <GlobalItemCard 
                        key={m.id} 
                        item={m} 
                        isImported={customMarkets.some(cm => cm.name === m.name)} // Verifica por nome pois ID muda na importação
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {/* Minhas Estratégias */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" /> Minhas Estratégias
                  </h3>
                  <div className="space-y-2">
                    {customStrategies.length === 0 ? (
                      <p className="text-slate-500 text-sm">Nenhuma estratégia ativada.</p>
                    ) : (
                      customStrategies.map(s => (
                        <div key={s.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300">
                          {s.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Biblioteca Global */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Globe className="text-purple-500" /> Modelos Profissionais
                  </h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {loadingGlobal ? <p>Carregando...</p> : globalStrategies.map(s => (
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {/* Meus Métodos */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" /> Meus Métodos
                  </h3>
                  <div className="space-y-2">
                    {userMethods.length === 0 ? (
                      <p className="text-slate-500 text-sm">Nenhum método cadastrado.</p>
                    ) : (
                      userMethods.map(m => (
                        <div key={m.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300">
                          {m.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Biblioteca Global */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Globe className="text-purple-500" /> Métodos Validados
                  </h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {loadingGlobal ? <p>Carregando...</p> : globalMethods.map(m => (
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