import React, { useEffect } from 'react';
import { useBetStore } from '../store/useBetStore';
import { TrendingUp, ArrowRight, Zap, BarChart3, Download, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageStrategies = () => {
  const { 
    globalStrategies, 
    fetchGlobalStrategies, 
    customStrategies, // ✅ Importado para verificar se já existe
    importProgressionStrategy // ✅ Importado para salvar na biblioteca
  } = useBetStore();
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchGlobalStrategies();
  }, []);

  const getRiskBadge = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'baixo': return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Baixo</span>;
      case 'médio': return <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Médio</span>;
      case 'alto': return <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Alto</span>;
      default: return null;
    }
  };

  const handleUseStrategy = (strategy: any) => {
    navigate('/goals', { state: { createFromStrategy: strategy } });
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="text-blue-500" />
          Modelos de Alavancagem & Gestão
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Escolha um modelo validado para estruturar o crescimento da sua banca.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {globalStrategies.map((strategy) => {
          // Verifica se já está importada
          const isImported = customStrategies.some(cs => cs.name === strategy.name);

          return (
            <div key={strategy.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                    {strategy.channel === 'exchange' ? <BarChart3 size={20} className="text-purple-500" /> : <Zap size={20} className="text-amber-500" />}
                  </div>
                  {getRiskBadge(strategy.risk)}
                </div>
                
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{strategy.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed min-h-[60px]">
                  {strategy.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {strategy.markets && strategy.markets.map((m: string) => (
                    <span key={m} className="text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                {/* BOTÃO 1: IMPORTAR PARA NOVA APOSTA */}
                <button 
                  onClick={() => importProgressionStrategy(strategy.id)}
                  disabled={isImported}
                  className={`w-full font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 border transition-all
                    ${isImported 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent cursor-default' 
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-500'}
                  `}
                >
                  {isImported ? (
                    <> <Check size={14} /> Ativo na Biblioteca </>
                  ) : (
                    <> <Download size={14} /> Importar </>
                  )}
                </button>

                {/* BOTÃO 2: USAR COMO META */}
                <button 
                  onClick={() => handleUseStrategy(strategy)}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-2.5 rounded-lg text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Criar Meta com Modelo <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ManageStrategies;