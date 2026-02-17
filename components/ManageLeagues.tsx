import React, { useEffect, useState } from 'react';
import { useBetStore, League } from '../store/useBetStore';
import { Search, Globe, Check, Loader2, MapPin, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManageLeagues = () => {
  const { 
    globalLeagues, 
    userLeagues, 
    fetchLeagues, 
    toggleUserLeague, 
    isLoadingLeagues 
  } = useBetStore();

  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLeagues();
  }, []);

  const filteredLeagues = globalLeagues.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.country.toLowerCase().includes(search.toLowerCase())
  );

  const leaguesByCountry = filteredLeagues.reduce((acc, league) => {
    if (!acc[league.country]) acc[league.country] = [];
    acc[league.country].push(league);
    return acc;
  }, {} as Record<string, League[]>);

  const sortedCountries = Object.keys(leaguesByCountry).sort();

  // Lógica de Seleção em Massa
  const handleSelectAll = async () => {
    const toSelect = filteredLeagues.filter(l => !userLeagues.includes(l.id));
    // Processa sequencialmente para garantir atualização do estado/banco
    for (const league of toSelect) {
      await toggleUserLeague(league.id);
    }
  };

  const handleDeselectAll = async () => {
    const toDeselect = filteredLeagues.filter(l => userLeagues.includes(l.id));
    for (const league of toDeselect) {
      await toggleUserLeague(league.id);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* HEADER CARD */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="text-emerald-500" size={24} />
              Gerenciar Ligas
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Ative as competições para agilizar suas apostas.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar país ou liga..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* AÇÕES EM MASSA */}
        <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={handleSelectAll}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            <CheckSquare size={14} /> Marcar Todos
          </button>
          <button 
            onClick={handleDeselectAll}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Square size={14} /> Desmarcar Todos
          </button>
        </div>
      </div>

      {/* LISTA */}
      {isLoadingLeagues ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-emerald-500" size={40} />
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {sortedCountries.length > 0 ? (
              sortedCountries.map(country => (
                <motion.div
                  key={country}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="bg-slate-50 dark:bg-slate-950/80 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400 dark:text-slate-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                      {country}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {leaguesByCountry[country].map(league => {
                      const isActive = userLeagues.includes(league.id);
                      return (
                        <div 
                          key={league.id} 
                          onClick={() => toggleUserLeague(league.id)}
                          className={`
                            flex items-center justify-between p-4 cursor-pointer group transition-colors
                            ${isActive 
                              ? 'bg-emerald-50/50 dark:bg-emerald-900/10' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                          `}
                        >
                          <span className={`text-sm font-medium transition-colors ${isActive ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>
                            {league.name}
                          </span>

                          {/* Toggle Visual */}
                          <div className={`
                            w-11 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0
                            ${isActive ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}
                          `}>
                            <div className={`
                              absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center
                              ${isActive ? 'translate-x-5' : 'translate-x-0'}
                            `}>
                                {isActive && <Check size={10} className="text-emerald-600" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p>Nenhuma liga encontrada.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ManageLeagues;