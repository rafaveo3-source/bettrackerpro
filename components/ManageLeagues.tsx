import React, { useEffect, useState } from 'react';
import { useBetStore, League } from '../store/useBetStore';
import { Search, Globe, Check, Loader2, MapPin } from 'lucide-react';
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

  // Filtragem
  const filteredLeagues = globalLeagues.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.country.toLowerCase().includes(search.toLowerCase())
  );

  // Agrupar por país
  const leaguesByCountry = filteredLeagues.reduce((acc, league) => {
    if (!acc[league.country]) acc[league.country] = [];
    acc[league.country].push(league);
    return acc;
  }, {} as Record<string, League[]>);

  const sortedCountries = Object.keys(leaguesByCountry).sort();

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6 text-slate-200">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="text-emerald-500" size={24} />
            Gerenciar Ligas
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Selecione as competições que você acompanha para agilizar suas apostas.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar país ou liga..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* LISTA */}
      {isLoadingLeagues ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-emerald-500" size={40} />
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {sortedCountries.length > 0 ? (
              sortedCountries.map(country => (
                <motion.div
                  key={country}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
                >
                  <div className="bg-slate-950/80 px-6 py-3 border-b border-slate-800 flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-500" />
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-xs">
                      {country}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800/50">
                    {leaguesByCountry[country].map(league => {
                      const isActive = userLeagues.includes(league.id);
                      return (
                        <div 
                          key={league.id} 
                          onClick={() => toggleUserLeague(league.id)}
                          className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                          <span className={`text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                            {league.name}
                          </span>

                          {/* Toggle Visual */}
                          <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-300 flex items-center justify-center ${isActive ? 'translate-x-6' : 'translate-x-0'}`}>
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
              <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
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