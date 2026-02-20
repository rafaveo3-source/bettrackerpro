import React, { useEffect, useState } from 'react';
import { useBetStore, ProgressionStrategy } from '../store/useBetStore';
import { TrendingUp, ArrowRight, Zap, BarChart3, Download, Check, Lock, Eye, Crosshair, ShieldAlert, GitMerge, AlertCircle, X, CircleDollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ManageStrategies = () => {
  const { 
    globalStrategies, 
    fetchGlobalStrategies, 
    customStrategies, 
    importProgressionStrategy,
    isPro 
  } = useBetStore();
  
  const navigate = useNavigate();
  
  // Controle do Modal de Blueprint de Gestão
  const [selectedBlueprint, setSelectedBlueprint] = useState<ProgressionStrategy | null>(null);

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

  // =========================================================
  // 🧠 CÉREBRO DA GESTÃO (Inteligência Específica por Estratégia)
  // =========================================================
  const getBlueprintData = (strategy: ProgressionStrategy) => {
      const name = strategy.name.toLowerCase();

      if (name.includes('soros') || name.includes('alavancagem') || name.includes('composto')) {
        return {
          setup: { oddTarget: "@1.30 a @1.50", steps: "3 a 5 níveis", type: "Juros Compostos" },
          roadmap: [
            "Passo 1: Investir 1% a 2% do capital inicial.",
            "Passo 2: Reinvestir o montante total (Stake + Lucro da operação anterior).",
            "Passo 3: Repetir o processo até o alvo definido no ciclo.",
            "Fechamento: Ao atingir a meta, resgatar o lucro e reiniciar com a stake base."
          ],
          stopLoss: "O Stop Loss deste modelo é sempre a Stake Inicial (1%). Se o mercado for contra (Red), assuma a perda da unidade e reinicie um novo ciclo.",
          markets: ["Mercados de Baixa Variância (Ex: Dupla Chance)"]
        };
      }
      
      if (name.includes('martingale') || name.includes('recuperação')) {
         return {
          setup: { oddTarget: "@2.00+", steps: "Máx 3 Níveis", type: "Cobertura de Risco" },
          roadmap: [
            "Passo 1: Exposição primária de 0.5% a 1% da unidade.",
            "Passo 2 (Em caso de Red): Exposição ajustada para cobrir a perda anterior.",
            "Passo 3 (Em caso de Red): Último nível de cobertura programada.",
            "Retorno ao Padrão: Assim que houver um acerto (Green), retorne imediatamente à stake inicial."
          ],
          stopLoss: "PERIGO MÁXIMO DE DRAWDOWN: Respeite rigorosamente o limite de 3 níveis de cobertura. Um ciclo de perdas prolongado forçará o esgotamento do portfólio.",
          markets: ["Odds pares (Ex: Over 2.5 Gols ou Handicaps Asiáticos)"]
        };
      }

      if (name.includes('alembert') || name.includes('ciclo')) {
         return {
          setup: { oddTarget: "@2.00", steps: "Variável", type: "Gestão Progressiva" },
          roadmap: [
            "Defina o valor base da sua Unidade Financeira.",
            "Pós-Red: Aumente a próxima exposição em +1 Unidade Base.",
            "Pós-Green: Reduza a próxima exposição em -1 Unidade Base.",
            "Conclusão: O ciclo encerra ao retornar à estaca zero com saldo positivo."
          ],
          stopLoss: "Defina um limite de variação negativa (Stop Diário) de no máximo 5 Unidades. Se atingido, interrompa a sessão para evitar abalo emocional.",
          markets: ["Handicap Asiático", "Linhas de Match Odds equilibradas"]
        };
      }

      if (name.includes('conservador') || name.includes('flat')) {
         return {
          setup: { oddTarget: "@1.70 a @2.20", steps: "Longo Prazo", type: "Stake Fixa (Flat)" },
          roadmap: [
            "Divida o portfólio em 50 a 100 partes iguais (Unidades).",
            "Mantenha a exposição travada em 1U a 2U por evento de forma estrita.",
            "O crescimento do capital depende exclusivamente do Win Rate e do ROI médio ao final do mês."
          ],
          stopLoss: "Drawdown Máximo sugerido de 15%. Se o patrimônio recuar para 85% da banca inicial, pause as operações e reavalie seus critérios de análise técnica.",
          markets: ["Procura por Valor Esperado Positivo (+EV) em qualquer mercado."]
        };
      }

      return { 
          setup: { oddTarget: "Variável", steps: "Gestão Padrão", type: "Modelo Estratégico" },
          roadmap: [
            "Siga rigorosamente a divisão de stake e alocação do modelo.",
            "Valide as operações utilizando as calculadoras de controle.",
            "Mantenha o histórico alimentado para monitoramento de ROI."
          ], 
          stopLoss: "Gestão de Caixa: Não exponha mais de 5% do capital total em um único dia operacional.",
          markets: strategy.markets || ["Mercados Específicos do Setup"]
      };
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      
      {/* HEADER DA ABA */}
      <div className="bg-white dark:bg-[#0f172a] p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <div className="flex items-center gap-2 text-blue-500 text-[9px] font-mono font-bold uppercase tracking-widest mb-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></span>
                Financial Control
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase italic tracking-tighter">
            Modelos de Alavancagem & Gestão
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Escolha um modelo matemático validado para estruturar o crescimento do seu capital.
            </p>
        </div>
      </div>

      {/* GRID DE ESTRATÉGIAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {globalStrategies.map((strategy) => {
          const isImported = customStrategies.some(cs => cs.name === strategy.name);

          return (
            <div key={strategy.id} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg transition-all group relative">
              
              {/* TAG PRO (Se não for PRO e não estiver logado) */}
              {!isPro && (
                  <div className="absolute -top-3 -right-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2 rounded-full shadow-lg z-10">
                      <Lock size={14} />
                  </div>
              )}

              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner group-hover:scale-105 transition-transform">
                    {strategy.channel === 'exchange' ? <BarChart3 size={24} className="text-purple-500" /> : <Zap size={24} className="text-amber-500" />}
                  </div>
                  {getRiskBadge(strategy.risk)}
                </div>
                
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-tight uppercase">{strategy.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed line-clamp-3">
                  {strategy.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {strategy.markets && strategy.markets.map((m: string) => (
                    <span key={m} className="text-[9px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-auto">
                
                {/* BOTÃO 1: VER BLUEPRINT (COM BLOQUEIO PRO) */}
                <button 
                  onClick={() => {
                    if (!isPro) {
                       navigate('/pro');
                       return;
                    }
                    setSelectedBlueprint(strategy);
                  }}
                  className={`w-full font-black uppercase tracking-widest py-3 rounded-xl text-[10px] flex items-center justify-center gap-2 transition-all
                    ${!isPro 
                        ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-800'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 shadow-md'}
                  `}
                >
                  {!isPro ? ( 
                    <> <Lock size={12} /> Blueprint Matemático </>
                  ) : (
                    <> <Eye size={14} /> Blueprint de Gestão </>
                  )}
                </button>

                {/* BOTÃO 2: IMPORTAR ESTADO */}
                <button 
                  onClick={() => isPro && importProgressionStrategy(strategy.id)}
                  disabled={isImported || !isPro} 
                  className={`w-full font-black uppercase tracking-widest py-3 rounded-xl text-[10px] flex items-center justify-center gap-2 transition-all border
                    ${isImported 
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/20 cursor-default' 
                      : !isPro 
                        ? 'bg-transparent text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50 hidden'
                        : 'bg-transparent text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/10'}
                  `}
                >
                  {isImported && <><Check size={14} /> Salvo no Perfil</>}
                  {!isImported && isPro && <><Download size={14} /> Importar</>}
                </button>

                {/* BOTÃO 3: USAR COMO META (LIBERADO PRA TODOS) */}
                <button 
                  onClick={() => handleUseStrategy(strategy)}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-3 rounded-xl text-[10px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Linkar em Meta <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================
          MODAL: BLUEPRINT MATEMÁTICO (EXCLUSIVO PRO)
          ========================================================= */}
      <AnimatePresence>
        {selectedBlueprint && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedBlueprint(null)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-[#0b101e] w-full max-w-2xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    {/* Header Modal */}
                    <div className="bg-slate-50 dark:bg-[#0f172a] p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest border border-purple-200 dark:border-purple-500/30">
                                    Modelo Financeiro
                                </span>
                                {getRiskBadge(selectedBlueprint.risk)}
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                {selectedBlueprint.name}
                            </h2>
                            <p className="text-xs text-slate-500 font-bold tracking-widest mt-1 uppercase">Ambiente Ideal: {selectedBlueprint.channel}</p>
                        </div>
                        <button onClick={() => setSelectedBlueprint(null)} className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Corpo do Modal com Scroll */}
                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                        
                        {/* 1. Setup de Risco */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                                <Crosshair size={16} className="text-blue-500 mx-auto mb-2" />
                                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Odd Alvo</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{getBlueprintData(selectedBlueprint).setup.oddTarget}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                                <GitMerge size={16} className="text-amber-500 mx-auto mb-2" />
                                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Ciclos / Passos</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{getBlueprintData(selectedBlueprint).setup.steps}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                                <CircleDollarSign size={16} className="text-emerald-500 mx-auto mb-2" />
                                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Perfil da Gestão</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{getBlueprintData(selectedBlueprint).setup.type}</p>
                            </div>
                        </div>

                        {/* 2. Roadmap / Regras de Ciclo */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <Zap size={16}/> Roadmap da Operação
                            </h4>
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5">
                                <ul className="space-y-4">
                                    {getBlueprintData(selectedBlueprint).roadmap.map((rule, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <div className="mt-0.5 bg-blue-500 text-white w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0">
                                                {idx + 1}
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{rule}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* 3. Stop Loss e Reset */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <ShieldAlert size={16}/> Regra de Ouro (Stop Loss)
                            </h4>
                            <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-xl p-4 flex items-start gap-3">
                                <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-red-900/80 dark:text-red-200/80 leading-relaxed">
                                    {getBlueprintData(selectedBlueprint).stopLoss}
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Footer Modal */}
                    <div className="bg-slate-50 dark:bg-[#0f172a] p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                            {customStrategies.some(cs => cs.name === selectedBlueprint.name) ? '✅ Gestão em uso' : 'Pronto para aplicar?'}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button 
                                onClick={() => handleUseStrategy(selectedBlueprint)}
                                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                Criar Meta
                            </button>
                            <button 
                                onClick={() => {
                                    importProgressionStrategy(selectedBlueprint.id);
                                    setSelectedBlueprint(null);
                                }}
                                disabled={customStrategies.some(cs => cs.name === selectedBlueprint.name)}
                                className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white disabled:text-slate-500 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Download size={16}/> Importar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageStrategies;