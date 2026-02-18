import React, { useEffect, useState } from 'react';
import { useBetStore } from '../store/useBetStore';
import { Target, Check, Search, Loader2, Download, TrendingUp, Info, Trash2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManageMethods = () => {
  const { 
    methods: userMethods,
    globalSystemMethods,
    fetchSystemMethods,
    importSystemMethod,
    removeMethod,
    addMethod,
    isLoadingSystemMethods,
    getMethodRealStats,
    isPro // 🔥 Pegue o isPro
  } = useBetStore();

  const [newMethodName, setNewMethodName] = useState('');

  useEffect(() => {
    fetchSystemMethods();
  }, []);

  const handleAddMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMethodName.trim()) {
      addMethod(newMethodName);
      setNewMethodName('');
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'baixo': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'médio': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'alto': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getRoiColor = (value: number) => {
    if (value > 0) return 'text-emerald-500';
    if (value < 0) return 'text-red-500';
    return 'text-slate-400';
  };

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* COLUNA ESQUERDA: MEUS MÉTODOS (Liberado para todos, é criação manual) */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Check className="text-emerald-500" />
            Meus Métodos
          </h2>
          
          <form onSubmit={handleAddMethod} className="flex flex-col sm:flex-row gap-2 mb-6">
            <input 
              type="text" 
              value={newMethodName}
              onChange={(e) => setNewMethodName(e.target.value)}
              placeholder="Criar método personalizado..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 sm:py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
            />
            <button 
              type="submit"
              disabled={!newMethodName.trim()}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold px-6 py-3 sm:py-2 rounded-xl text-sm transition-colors whitespace-nowrap"
            >
              Adicionar
            </button>
          </form>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {userMethods.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  Nenhum método ativo.
                </div>
              ) : (
                userMethods.map(m => {
                  const stats = getMethodRealStats(m.name);
                  
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl group hover:border-emerald-500/30 transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{m.name}</span>
                        {stats.count > 0 && (
                           <span className={`text-[10px] font-bold ${getRoiColor(stats.roiTotal)}`}>
                             ROI: {stats.roiTotal.toFixed(1)}% ({stats.count} bets)
                           </span>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => removeMethod(m.id)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                        title="Remover Método"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* COLUNA DIREITA: BIBLIOTECA VALIDADA (Bloqueio PRO na importação) */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-full">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <Target className="text-blue-500" />
            Métodos Validados
          </h2>
          <p className="text-xs text-slate-500 mb-6">Importe estratégias para começar a registrar seus resultados.</p>

          {isLoadingSystemMethods ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-500" size={30} />
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {globalSystemMethods.map(method => {
                const isImported = userMethods.some(um => um.name === method.name);
                const realStats = isImported ? getMethodRealStats(method.name) : { roi30d: 0, roiTotal: 0 };

                return (
                  <div key={method.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{method.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{method.market} • {method.type === 'in_play' ? 'Ao Vivo' : 'Pré-Live'}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase ${getRiskColor(method.risk)}`}>
                        {method.risk}
                      </span>
                    </div>

                    {method.description && (
                      <div className="mb-3 flex gap-2 items-start bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg">
                        <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{method.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Seu ROI 30d</p>
                        <p className={`text-xs font-bold ${getRoiColor(realStats.roi30d)}`}>
                          {realStats.roi30d > 0 ? '+' : ''}{realStats.roi30d.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Seu ROI Total</p>
                        <p className={`text-xs font-bold ${getRoiColor(realStats.roiTotal)}`}>
                          {realStats.roiTotal > 0 ? '+' : ''}{realStats.roiTotal.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-center flex items-center justify-center">
                          <TrendingUp size={16} className={isImported ? "text-blue-500" : "text-slate-200 dark:text-slate-700"} />
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        if (!isPro) {
                           alert("Importação de Métodos Profissionais é exclusiva PRO 💎");
                           return;
                        }
                        importSystemMethod(method.id);
                      }}
                      disabled={isImported}
                      className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all
                        ${isImported 
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 cursor-default' 
                          : !isPro
                             ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                             : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'}
                      `}
                    >
                      {isImported ? (
                        <> <Check size={14} /> Ativo em Meus Métodos </>
                      ) : !isPro ? (
                        <> <Lock size={12} /> Bloqueado (PRO) </>
                      ) : (
                        <> <Download size={14} /> Importar Estratégia </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageMethods;