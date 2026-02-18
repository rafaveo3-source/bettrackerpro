import React, { useEffect, useState } from 'react';
import { useBetStore } from '../store/useBetStore';
import { Target, Check, Search, Loader2, Download, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManageMethods = () => {
  const { 
    methods: userMethods,
    globalSystemMethods,
    fetchSystemMethods,
    importSystemMethod,
    removeMethod,
    addMethod,
    isLoadingSystemMethods 
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

  // Helper para cor do risco
  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'baixo': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'médio': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'alto': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* COLUNA ESQUERDA: MEUS MÉTODOS */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Check className="text-emerald-500" />
            Meus Métodos
          </h2>
          
          {/* Adicionar Novo */}
          <form onSubmit={handleAddMethod} className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newMethodName}
              onChange={(e) => setNewMethodName(e.target.value)}
              placeholder="Criar método personalizado..."
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
            <button 
              type="submit"
              disabled={!newMethodName.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Adicionar
            </button>
          </form>

          {/* Lista */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {userMethods.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  Nenhum método ativo.
                </div>
              ) : (
                userMethods.map(m => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl group hover:border-emerald-500/30 transition-all"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{m.name}</span>
                    <button 
                      onClick={() => removeMethod(m.id)}
                      className="text-xs text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity px-2"
                    >
                      Remover
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* COLUNA DIREITA: BIBLIOTECA VALIDADA */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-full">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <Target className="text-blue-500" />
            Métodos Validados
          </h2>
          <p className="text-xs text-slate-500 mb-6">Estratégias prontas com histórico de ROI verificado.</p>

          {isLoadingSystemMethods ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-500" size={30} />
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {globalSystemMethods.map(method => {
                const isImported = userMethods.some(um => um.name === method.name);
                return (
                  <div key={method.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{method.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{method.market} • {method.type === 'in_play' ? 'Ao Vivo' : 'Pré-Live'}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase ${getRiskColor(method.risk)}`}>
                        {method.risk}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">ROI 30d</p>
                        <p className="text-xs font-bold text-emerald-500">{(method.roi_history?.last_30 * 100).toFixed(1)}%</p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">ROI Total</p>
                        <p className="text-xs font-bold text-blue-500">{(method.roi_history?.all_time * 100).toFixed(1)}%</p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
                         <div className="flex items-center justify-center h-full">
                            <TrendingUp size={16} className="text-slate-300 dark:text-slate-600" />
                         </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => importSystemMethod(method.id)}
                      disabled={isImported}
                      className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all
                        ${isImported 
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-default' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'}
                      `}
                    >
                      {isImported ? (
                        <> <Check size={14} /> Importado </>
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