import React, { useEffect, useState } from 'react';
import { useBetStore, SystemMethod } from '../store/useBetStore';
import { Target, Check, Search, Loader2, Download, TrendingUp, Info, Trash2, Lock, Eye, CheckCircle2, ShieldAlert, Crosshair, X, BarChart4 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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
    isPro 
  } = useBetStore();

  const navigate = useNavigate();
  const [newMethodName, setNewMethodName] = useState('');
  
  // Controle do Modal de Playbook
  const [selectedPlaybook, setSelectedPlaybook] = useState<SystemMethod | null>(null);

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

  // =========================================================
  // 🧠 CÉREBRO DO PLAYBOOK (Inteligência Específica por Método)
  // =========================================================
  const getPlaybookData = (method: SystemMethod) => {
      // 1. Se vier do banco (no futuro), usa o do banco
      if (method.entry_rules && method.entry_rules.length > 0) {
        return {
          entry: method.entry_rules,
          checklist: method.validation_checklist || [],
          exit: method.exit_plan || ""
        }
      }

      // 2. Playbooks Específicos e Detalhados
      const name = method.name.toLowerCase();

      if (name.includes('gol precoce') || name.includes('back favorito')) {
        return {
          entry: ["Minuto ideal: 15' ao 35' do 1T", "Odd do Favorito: @1.70 a @2.20", "Favorito sofreu gol em contra-ataque ou bola parada (zebra momentânea)"],
          checklist: ["Posse de bola do Favorito > 65%", "Finalizações > 5 após sofrer o gol", "Linha defensiva do adversário recuada"],
          exit: "Cashout imediato de proteção se o favorito tomar cartão vermelho ou não empatar até os 75'."
        };
      }
      if (name.includes('surebet') || name.includes('arbitragem')) {
         return {
          entry: ["Encontrar spread > 1% entre casas de apostas", "Odds invertidas (ex: Over 2.5 @2.10 na Casa A, Under 2.5 @2.05 na Casa B)", "Alta liquidez no mercado"],
          checklist: ["Limites de aposta da sua conta verificados", "Saldo disponível em ambas as casas", "Odds não configuram erro evidente da casa (palpable error)"],
          exit: "Sem cashout. Operação fechada matematicamente no pré-live, garantindo o lucro independentemente do resultado final da partida."
        };
      }
      if (name.includes('kelly')) {
         return {
          entry: ["Aposta possui EV Positivo (+EV) matemático", "Odd oferecida pela casa > Odd Justa precificada", "Confiança alta na sua precificação base"],
          checklist: ["Usar Kelly Fracionado (0.25x a 0.5x) para reduzir variância", "Banca exata atualizada na calculadora", "Risco máximo não ultrapassa 5% da banca total"],
          exit: "Aposta levada até o fim (Full Time). O foco é a vantagem matemática a longo prazo e não o resultado individual da partida."
        };
      }
      if (name.includes('expected goals') || name.includes('xg')) {
         return {
          entry: ["xG Acumulado > 1.5 e zero gols na partida", "Odd de Over 0.5 HT ou FT desajustada pelo tempo", "Pressão contínua nos últimos 10 minutos"],
          checklist: ["Diferença de xG (Time A - Time B) > 1.0", "Goleiro adversário com alta nota (fazendo milagres)", "Ataques Perigosos por Minuto (APPM) > 1.2"],
          exit: "Cashout aos 85' se a intensidade de chutes e cantos cair drasticamente, caso contrário, assumir o red final."
        };
      }
      if (name.includes('btts') || name.includes('ambas marcam')) {
         return {
          entry: ["Odd justa @1.70+", "Times com média histórica de BTTS > 65% na temporada", "Confronto de Defesa Fraca x Ataque Forte"],
          checklist: ["Ambos times têm forte motivação (Must Win alto)", "Desfalques chave na linha defensiva", "Gramado e clima em excelentes condições de jogo"],
          exit: "Geralmente levado até o final. Considerar cashout apenas se houver expulsão prematura do principal atacante ou criador de jogadas."
        };
      }
      if (name.includes('cartões') || name.includes('disciplina')) {
         return {
          entry: ["Árbitro com perfil rigoroso (Média > 5 cartões/jogo)", "Clássicos regionais ou jogos de alto risco de rebaixamento", "Odd de Over Cartões desajustada no pré-live"],
          checklist: ["Times com histórico de faltas > 25/jogo", "Rivalidade histórica alta (H2H pegado)", "Jogadores com histórico indisciplinar escalados (ex: volantes pegadores)"],
          exit: "Levado até o fim da partida. Historicamente, os minutos finais (acréscimos) concentram a maior taxa de cartões por cera ou reclamação."
        };
      }
      if (name.includes('clv') || name.includes('closing line')) {
         return {
          entry: ["Apostar na abertura das odds (Early Market)", "Identificação de informação privilegiada (ex: desfalque não precificado pela casa)", "Tendência de queda clara (Drop) em exchanges asiáticas"],
          checklist: ["Monitorar odds em casas de referência (Pinnacle/ISN)", "Apostar antes do mercado recreativo ajustar a linha", "Registrar o CLV exato no momento do fechamento da partida"],
          exit: "Sem cashout. O lucro é oriundo da vantagem estatística de longo prazo batendo a linha de fechamento."
        };
      }
      if (name.includes('asiático progressivo')) {
         return {
          entry: ["Minuto 15' a 25' do 1T se o jogo estiver muito agitado", "Odd @1.80+ na linha Over 2.0 (proteção de void no 2 gols)", "Gol precoce de um underdog alterando o cenário"],
          checklist: ["Chutes no alvo > 3 nos primeiros minutos", "Times jogando para frente em transição rápida (pouco toque de lado)", "Linhas de zaga altas"],
          exit: "Cashout de proteção ou fechamento em void (devolução) se o jogo esfriar bruscamente e a posse de bola ficar lenta no meio campo."
        };
      }
      if (name.includes('late goals') || name.includes('gols ao vivo')) {
         return {
          entry: ["Minuto 80'+ da partida", "Odd @1.80 a @2.50 para sair mais 1 gol", "Time favorito perdendo e sufocando o adversário dentro da área"],
          checklist: ["Sequência de escanteios nos últimos 5 mins", "Adversário totalmente recuado (linha de defesa dentro da grande área)", "Bolas cruzadas/rebatidas constantes gerando rebote"],
          exit: "Sem cashout. Operação com perfil de alto risco e alta recompensa voltada estritamente para o famoso gol nos acréscimos."
        };
      }

      // 3. Fallback Genérico (Caso adicione um método não mapeado acima)
      const fallbackEntry = method.type === 'in_play' 
        ? ["Minuto ideal de operação: 70' ao 85'", "Odd Mínima aceitável: @1.80+", "Cenário de jogo favorável, intenso e com volume"]
        : ["Analisar histórico recente (H2H)", "Buscar odd desajustada no mercado (Drop)", "Confirmar escalações e possíveis desfalques impactantes"];
        
      const fallbackChecklist = ["Posse de bola dominante > 60%", "Mais de 5 finalizações no alvo", "Ataques Perigosos por Minuto (APPM) > 1.2"];
      
      const fallbackExit = method.risk.toLowerCase() === 'alto' 
        ? "Não há cashout sugerido. Operar com gestão de stake rigorosa (baixa unidade) e levar até a resolução." 
        : "Realizar cashout imediato caso o cenário do jogo mude contra a análise (ex: expulsão, perda abrupta de intensidade).";

      return { entry: fallbackEntry, checklist: fallbackChecklist, exit: fallbackExit };
  };

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* COLUNA ESQUERDA: MEUS MÉTODOS */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-2 mb-4">
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
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold px-6 py-3 sm:py-2 rounded-xl text-sm transition-colors whitespace-nowrap active:scale-95 shadow-lg shadow-emerald-500/20"
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
                      className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl group hover:border-emerald-500/30 transition-all shadow-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{m.name}</span>
                        {stats.count > 0 ? (
                           <span className={`text-[10px] font-black uppercase tracking-wider ${getRoiColor(stats.roiTotal)}`}>
                             ROI: {stats.roiTotal.toFixed(1)}% ({stats.count} bets)
                           </span>
                        ) : (
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sem histórico</span>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => {
                            if (window.confirm('Deseja realmente remover este método? O histórico de apostas associado a ele não será apagado, mas o método não aparecerá mais nas opções.')) {
                                removeMethod(m.id);
                            }
                        }}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                        title="Remover Método"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* COLUNA DIREITA: BIBLIOTECA VALIDADA (PLAYBOOK) */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-2 mb-1">
            <Target className="text-blue-500" />
            Métodos Validados
          </h2>
          <p className="text-xs font-medium text-slate-500 mb-6">Playbooks completos e validados por especialistas.</p>

          {isLoadingSystemMethods ? (
            <div className="flex justify-center py-20 flex-1 items-center">
              <Loader2 className="animate-spin text-blue-500" size={30} />
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {globalSystemMethods.map(method => {
                const isImported = userMethods.some(um => um.name === method.name);

                return (
                  <div key={method.id} className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{method.name}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">{method.market} • {method.type === 'in_play' ? 'Ao Vivo' : 'Pré-Live'}</p>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-1 rounded-full border uppercase tracking-widest ${getRiskColor(method.risk)}`}>
                        Risco {method.risk}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
                      
                      {/* BOTÃO PLAYBOOK (Detalhes da Estratégia) */}
                      <button 
                        onClick={() => {
                            if (!isPro) {
                                navigate('/pro');
                                return;
                            }
                            setSelectedPlaybook(method);
                        }}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                            isPro 
                            ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 shadow-md' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                         {!isPro ? <><Lock size={12}/> Ver Playbook</> : <><Eye size={14}/> Detalhes</>}
                      </button>

                      {/* BOTÃO IMPORTAR */}
                      <button 
                        onClick={() => {
                          if (!isPro) { navigate('/pro'); return; }
                          importSystemMethod(method.id);
                        }}
                        disabled={isImported}
                        className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-all
                          ${isImported 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 cursor-default' 
                            : !isPro
                               ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                               : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'}
                        `}
                      >
                        {isImported ? <Check size={14} /> : !isPro ? <Lock size={14} /> : <Download size={14} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DO PLAYBOOK ESTRATÉGICO (EXCLUSIVO PRO) */}
      <AnimatePresence>
        {selectedPlaybook && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setSelectedPlaybook(null)}
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
                                    <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest border border-blue-200 dark:border-blue-500/30">
                                        Playbook Oficial
                                    </span>
                                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest ${getRiskColor(selectedPlaybook.risk)}`}>
                                        Risco {selectedPlaybook.risk}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                    {selectedPlaybook.name}
                                </h2>
                                <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-1">Mercado: {selectedPlaybook.market}</p>
                            </div>
                            <button onClick={() => setSelectedPlaybook(null)} className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Corpo do Modal com Scroll */}
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                            
                            {/* Descrição e Simulação */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-2">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Info size={14}/> Conceito Base</h4>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                        {selectedPlaybook.description || "Uma estratégia focada em encontrar valor matemático em momentos específicos do evento."}
                                    </p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-2 flex items-center gap-1"><BarChart4 size={12}/> ROI Histórico</h4>
                                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">+{selectedPlaybook.roi_history?.all_time || '12.5'}%</span>
                                    <span className="text-[9px] font-bold text-emerald-700/60 dark:text-emerald-500/60 uppercase mt-1">Média validada a longo prazo</span>
                                </div>
                            </div>

                            {/* Playbook Rules */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Entrada */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                        <Crosshair size={16}/> Critérios de Entrada
                                    </h4>
                                    <ul className="space-y-3">
                                        {getPlaybookData(selectedPlaybook).entry.map((rule, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                <span className="font-medium">{rule}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Validação */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-orange-500 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                        <CheckCircle2 size={16}/> Checklist Radar (Estatísticas)
                                    </h4>
                                    <ul className="space-y-3">
                                        {getPlaybookData(selectedPlaybook).checklist.map((rule, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 bg-orange-50 dark:bg-orange-500/5 p-2 rounded-lg border border-orange-100 dark:border-orange-500/10">
                                                <Check size={16} className="text-orange-500 shrink-0" />
                                                <span className="font-medium">{rule}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                            </div>

                            {/* Plano de Saída (Gestão de Risco) */}
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-5">
                                <h4 className="text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-500 flex items-center gap-2 mb-3">
                                    <ShieldAlert size={16}/> Plano de Saída & Gestão (Stop Loss)
                                </h4>
                                <p className="text-sm text-red-900/80 dark:text-red-200/80 font-medium leading-relaxed">
                                    {getPlaybookData(selectedPlaybook).exit}
                                </p>
                            </div>

                        </div>

                        {/* Footer Modal */}
                        <div className="bg-slate-50 dark:bg-[#0f172a] p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                            <button 
                                onClick={() => {
                                    importSystemMethod(selectedPlaybook.id);
                                    setSelectedPlaybook(null);
                                }}
                                disabled={userMethods.some(um => um.name === selectedPlaybook.name)}
                                className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white disabled:text-slate-500 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                            >
                                {userMethods.some(um => um.name === selectedPlaybook.name) ? <><Check size={16}/> Já Importado</> : <><Download size={16}/> Importar para minha conta</>}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageMethods;