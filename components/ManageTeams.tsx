import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ Importação adicionada
import { useBetStore } from '../store/useBetStore';
import { Shield, Check, Loader2, ChevronDown, Trophy, CheckSquare, Square, Lock } from 'lucide-react';

const ManageTeams = () => {
  const { 
    globalLeagues, 
    userLeagues, 
    currentLeagueTeams, 
    userTeams, 
    fetchLeagueTeams, 
    toggleUserTeam, 
    isLoadingTeams,
    isPro 
  } = useBetStore();
  
  const navigate = useNavigate(); // ✅ Inicialização corrigida

  const safeGlobalLeagues = Array.isArray(globalLeagues) ? globalLeagues : [];
  const safeUserLeagues = Array.isArray(userLeagues) ? userLeagues : [];
  const safeCurrentTeams = Array.isArray(currentLeagueTeams) ? currentLeagueTeams : [];
  const safeUserTeams = Array.isArray(userTeams) ? userTeams : [];

  const myActiveLeagues = safeGlobalLeagues.filter(l => safeUserLeagues.includes(l.id));
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');

  useEffect(() => {
    if (myActiveLeagues.length > 0 && !selectedLeagueId) {
      setSelectedLeagueId(myActiveLeagues[0].id);
    }
  }, [safeUserLeagues.length, safeGlobalLeagues.length]);

  useEffect(() => {
    if (selectedLeagueId) {
      fetchLeagueTeams(selectedLeagueId);
    }
  }, [selectedLeagueId]);

  const checkProAndExecute = (action: () => void) => {
      if (!isPro) {
          navigate('/pro'); // ✅ UX: Redireciona para venda
          return;
      }
      action();
  };

  const handleSelectAll = async () => {
    checkProAndExecute(async () => {
        const toSelect = safeCurrentTeams.filter(t => !safeUserTeams.includes(t.id));
        await Promise.all(toSelect.map(t => toggleUserTeam(t.id)));
    });
  };

  const handleDeselectAll = async () => {
     checkProAndExecute(async () => {
        const toDeselect = safeCurrentTeams.filter(t => safeUserTeams.includes(t.id));
        await Promise.all(toDeselect.map(t => toggleUserTeam(t.id)));
     });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* HEADER & SELECTOR */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6 transition-colors">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="text-blue-500" size={24} />
              Gerenciar Times
              {!isPro && <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] px-2 py-1 rounded-full uppercase ml-2 flex items-center gap-1"><Lock size={10}/> PRO</span>}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Selecione a liga e marque os times favoritos.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Trophy size={16} />
            </div>
            <select
              value={selectedLeagueId}
              onChange={(e) => setSelectedLeagueId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              disabled={myActiveLeagues.length === 0}
            >
              {myActiveLeagues.length === 0 ? (
                <option>Ative ligas primeiro...</option>
              ) : (
                myActiveLeagues.map(league => (
                  <option key={league.id} value={league.id}>
                    {league.name} ({league.country})
                  </option>
                ))
              )}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* AÇÕES EM MASSA */}
        {myActiveLeagues.length > 0 && (
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={handleSelectAll}
              className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${!isPro ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
            >
               {!isPro && <Lock size={12}/>} <CheckSquare size={14} /> Selecionar Todos
            </button>
            <button 
              onClick={handleDeselectAll}
              className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${!isPro ? 'text-slate-400 cursor-not-allowed' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              {!isPro && <Lock size={12}/>} <Square size={14} /> Limpar Seleção
            </button>
          </div>
        )}
      </div>

      {/* GRID DE TIMES */}
      <div className="min-h-[300px]">
        {myActiveLeagues.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-500">Vá em "Ligas" e ative algumas competições primeiro.</p>
          </div>
        ) : isLoadingTeams ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {safeCurrentTeams.length > 0 ? (
              safeCurrentTeams.map(team => {
                const isActive = safeUserTeams.includes(team.id);
                return (
                  <div
                    key={team.id}
                    onClick={() => checkProAndExecute(() => toggleUserTeam(team.id))}
                    className={`
                      relative overflow-hidden cursor-pointer group rounded-xl border p-4 transition-all duration-200 flex justify-between items-center select-none
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30 shadow-md ring-1 ring-blue-500/20' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-600 hover:shadow-sm'}
                      ${!isPro ? 'opacity-70 grayscale-[0.5]' : ''}
                    `}
                  >
                    <span className={`font-semibold text-sm transition-colors ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>
                      {team.name}
                    </span>
                    
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0
                      ${isActive 
                        ? 'bg-blue-500 text-white scale-100 shadow-sm' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 scale-90 group-hover:scale-100'}
                    `}>
                      {isActive ? <Check size={14} /> : (!isPro && <Lock size={12}/>)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 text-slate-500">
                <p>Nenhum time encontrado nesta liga.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTeams;