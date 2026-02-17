import React, { useEffect, useState } from 'react';
import { useBetStore, GlobalMarket } from '../store/useBetStore';
import { LayoutGrid, Check, Search, Loader2, Tag, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManageMarkets = () => {
  const { 
    globalMarkets, 
    customMarkets, 
    fetchGlobalMarkets, 
    toggleUserMarket, 
    isLoadingMarkets 
  } = useBetStore();

  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchGlobalMarkets();
  }, []);

  // 1. Filtragem
  const filteredMarkets = globalMarkets.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.label.toLowerCase().includes(search.toLowerCase())
  );

  // 2. Agrupamento por Categoria (Label)
  const marketsByCategory = filteredMarkets.reduce((acc, market) => {
    if (!acc[market.label]) acc[market.label] = [];
    acc[market.label].push(market);
    return acc;
  }, {} as Record<string, GlobalMarket[]>);

  const categories = Object.keys(marketsByCategory).sort();

  // 3. Ações em Massa (Por Categoria)
  const handleSelectCategory = (categoryMarkets: GlobalMarket[]) => {
    // Adiciona apenas os que não estão ativos
    categoryMarkets.forEach(m => {
      if (!customMarkets.some(cm => cm.name === m.name)) {
        toggleUserMarket(m);
      }
    });
  };

  const handleDeselectCategory = (categoryMarkets: GlobalMarket[]) => {
    // Remove os que estão ativos
    categoryMarkets.forEach(m => {
      if (customMarkets.some(cm => cm.name === m.name)) {
        toggleUserMarket(m);
      }
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* HEADER & BUSCA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutGrid className="text-emerald-500" size={24} />
            Gerenciar Mercados
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Personalize os mercados disponíveis no menu de nova aposta.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar mercado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* LISTA DE CATEGORIAS */}
      {isLoadingMarkets ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-emerald-500" size={40} />
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {categories.length > 0 ? (
              categories.map(category => {
                const markets = marketsByCategory[category];
                // Verifica se todos desta categoria estão selecionados para estado visual
                const allSelected = markets.every(m => customMarkets.some(cm => cm.name === m.name));

                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Header da Categoria */}
                    <div className="bg-slate-50 dark:bg-slate-950/80 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-purple-500" />
                        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs md:text-sm">
                          {category}
                        </span>
                        <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {markets.length}
                        </span>
                      </div>

                      {/* Botões de Ação da Categoria */}
                      <div className="flex gap-2">
                        {!allSelected && (
                          <button 
                            onClick={() => handleSelectCategory(markets)}
                            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                          >
                            <CheckSquare size={12} /> Todos
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeselectCategory(markets)}
                          className="text-[10px] font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                        >
                          <Square size={12} /> Nenhum
                        </button>
                      </div>
                    </div>

                    {/* Grid de Opções */}
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {markets.map(market => {
                        const isActive = customMarkets.some(cm => cm.name === market.name);
                        return (
                          <div
                            key={market.id}
                            onClick={() => toggleUserMarket(market)}
                            className={`
                              cursor-pointer relative rounded-xl border px-3 py-2.5 flex items-center justify-between gap-2 transition-all duration-200 group
                              ${isActive 
                                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-500/30 shadow-sm' 
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-slate-700'}
                            `}
                          >
                            <span className={`text-xs font-semibold leading-tight ${isActive ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400'}`}>
                              {market.name}
                            </span>
                            
                            <div className={`
                              w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0
                              ${isActive ? 'bg-purple-500 text-white scale-100' : 'bg-slate-200 dark:bg-slate-800 text-transparent scale-90 group-hover:scale-100 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'}
                            `}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p>Nenhum mercado encontrado.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ManageMarkets;