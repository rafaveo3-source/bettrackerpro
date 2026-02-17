import React, { useState, useEffect } from 'react';
import { useBetStore } from '../store/useBetStore';
import { Shield, Check, Loader2, ChevronDown, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManageTeams = () => {
  const { 
    globalLeagues, 
    userLeagues, 
    currentLeagueTeams, 
    userTeams, 
    fetchLeagueTeams, 
    toggleUserTeam, 
    isLoadingTeams 
  } = useBetStore();

  // Filtra apenas as ligas que o usuário já ativou
  const myActiveLeagues = globalLeagues.filter(l => userLeagues.includes(l.id));
  
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');

  // Seleciona a primeira liga automaticamente se houver
  useEffect(() => {
    if (myActiveLeagues.length > 0 && !selectedLeagueId) {
      setSelectedLeagueId(myActiveLeagues[0].id);
    }
  }, [userLeagues, globalLeagues]);

  // Busca os times quando a liga muda
  useEffect(() => {
    if (selectedLeagueId) {
      fetchLeagueTeams(selectedLeagueId);
    }
  }, [selectedLeagueId]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8 text-slate-200">
      
      {/* HEADER */}
      <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-blue-500" size={24} />
            Gerenciar Times
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Selecione uma liga e ative os times que você costuma operar.
          </p>
        </div>

        {/* LEAGUE SELECTOR */}
        <div className="relative w-full md:w-72">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Trophy size={16} />
          </div>
          <select
            value={selectedLeagueId}
            onChange={(e) => setSelectedLeagueId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
            disabled={myActiveLeagues.length === 0}
          >
            {myActiveLeagues.length === 0 ? (
              <option>Nenhuma liga ativa</option>
            ) : (
              myActiveLeagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name} ({league.country})
                </option>
              ))
            )}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* TEAMS GRID */}
      <div className="min-h-[300px]">
        {myActiveLeagues.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
            <p className="text-slate-500">
              Você precisa ativar ligas em "Gerenciar Ligas" primeiro.
            </p>
          </div>
        ) : isLoadingTeams ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {currentLeagueTeams.length > 0 ? (
                currentLeagueTeams.map(team => {
                  const isActive = userTeams.includes(team.id);
                  return (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => toggleUserTeam(team.id)}
                      className={`
                        relative overflow-hidden cursor-pointer group rounded-xl border p-4 transition-all duration-300
                        ${isActive 
                          ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800'}
                      `}
                    >
                      <div className="flex justify-between items-center z-10 relative">
                        <span className={`font-semibold transition-colors ${isActive ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-200'}`}>
                          {team.name}
                        </span>
                        
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                          ${isActive ? 'bg-blue-500 text-white scale-100' : 'bg-slate-800 text-slate-600 scale-90 group-hover:scale-100'}
                        `}>
                          {isActive && <Check size={14} />}
                        </div>
                      </div>
                      
                      {/* Background Effect */}
                      {isActive && (
                        <motion.div 
                          layoutId="activeGlow"
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-50"
                        />
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-slate-500">
                  <p>Nenhum time encontrado nesta liga.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTeams;