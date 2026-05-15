import React, { useState, useMemo } from 'react';
import { Clock, Target, Flag, TrendingUp, ShieldAlert, BarChart3, Eye, AlertTriangle, Crown, ChevronRight, CheckCircle2, Zap, Percent, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBetStore } from '../store/useBetStore';

// ==========================================
// FUNÇÕES MATEMÁTICAS QUANTITATIVAS
// ==========================================
const factorial = (n: number): number => {
  if (n === 0 || n === 1) return 1;
  let result = 1; for (let i = 2; i <= n; i++) result *= i;
  return result;
};

// Poisson Simples
const poisson = (lambda: number, k: number) => {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

// Componente de Animação de Números
const AnimatedNumber = ({ value, prefix = "", suffix = "", className = "" }: { value: string | number, prefix?: string, suffix?: string, className?: string }) => (
    <AnimatePresence mode="popLayout">
        <motion.span key={value} initial={{ opacity: 0.5, y: -2 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`inline-block font-mono ${className}`}>
            {prefix}{value}{suffix}
        </motion.span>
    </AnimatePresence>
);

// Slider Estilo Apple PRO
interface SliderGroupProps {
  label: string; value: number; max: number; setter: (val: number) => void; colorClass: string;
}
const SliderGroup: React.FC<SliderGroupProps> = ({ label, value, max, setter, colorClass }) => (
  <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] p-4 rounded-xl shadow-sm min-w-0">
    <div className="flex justify-between items-center mb-3">
       <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest truncate mr-2">{label}</label>
       <span className={`text-lg font-bold font-mono ${colorClass}`}>{value}</span>
    </div>
    <input type="range" min="0" max={max} value={value} onChange={(e) => setter(Number(e.target.value))} className={`w-full h-2 bg-slate-100 dark:bg-[#000000] rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500 transition-all`} />
  </div>
);

const LiveTerminal: React.FC = () => {
  const { isPro } = useBetStore();
  const navigate = useNavigate();

  // OVERLAY PRO
  const ProBlurOverlay = () => (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 dark:bg-[#000000]/60 backdrop-blur-md rounded-2xl">
          <div className="bg-white dark:bg-[#1C1C1E] border border-indigo-500/30 p-8 rounded-2xl max-w-md text-center shadow-xl flex flex-col items-center mx-4">
              <div className="bg-indigo-500/10 p-4 rounded-xl mb-4 text-indigo-600 dark:text-indigo-400"><Crown size={32} /></div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2 uppercase">Terminal Preditivo <span className="text-indigo-500">PRO</span></h2>
              <p className="text-slate-500 dark:text-[#8E8E93] mb-6 text-sm leading-relaxed font-medium">Acesse a IA que simula milhares de cenários e prevê o resultado do jogo com base na pressão em tempo real.</p>
              <button onClick={() => navigate('/pro')} className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 font-bold py-4 px-8 rounded-xl transition-all shadow-sm text-xs tracking-widest uppercase">Desbloquear Acesso</button>
          </div>
      </div>
  );

  const [minute, setMinute] = useState<number>(65);
  const [targetHalf, setTargetHalf] = useState<'HT' | 'FT'>('FT');
  const [scoreH, setScoreH] = useState<number>(0);
  const [scoreA, setScoreA] = useState<number>(0);
  const [cornersH, setCornersH] = useState<number>(2);
  const [cornersA, setCornersA] = useState<number>(1);
  const [apH, setApH] = useState<number>(45);
  const [apA, setApA] = useState<number>(30);
  const [sotH, setSotH] = useState<number>(3);
  const [sotA, setSotA] = useState<number>(1);

  const applyPreset = (type: 'blitz_casa' | 'blitz_fora' | 'equilibrado') => {
      if (type === 'blitz_casa') {
          setMinute(75); setTargetHalf('FT'); setScoreH(0); setScoreA(1); setCornersH(6); setCornersA(1); setApH(85); setApA(20); setSotH(5); setSotA(1);
      } else if (type === 'blitz_fora') {
          setMinute(75); setTargetHalf('FT'); setScoreH(1); setScoreA(0); setCornersH(2); setCornersA(7); setApH(25); setApA(90); setSotH(2); setSotA(6);
      } else {
          setMinute(30); setTargetHalf('HT'); setScoreH(0); setScoreA(0); setCornersH(2); setCornersA(2); setApH(25); setApA(25); setSotH(1); setSotA(1);
      }
  };

  const handleHalfToggle = (half: 'HT' | 'FT') => {
      setTargetHalf(half);
      if (half === 'HT' && minute > 45) setMinute(45);
  };

  // ==========================================
  // O CÉREBRO PREDITIVO (NOVO MOTOR)
  // ==========================================
  const predictions = useMemo(() => {
    const extraTime = targetHalf === 'HT' ? 3 : 6; 
    const maxTime = (targetHalf === 'HT' ? 45 : 90) + extraTime;
    const timeLeft = Math.max(0, maxTime - minute);
    const safeMin = Math.max(1, minute);

    const apRateH = apH / safeMin;
    const apRateA = apA / safeMin;
    const totalPPM = apRateH + apRateA;

    if (timeLeft <= 0) {
      return { closed: true, script: "MERCADO ENCERRADO (FORA DA JANELA)", momentum: { ppm: 0, level: 'Neutro', color: 'text-slate-500' } };
    }

    const sotRateH = sotH / safeMin;
    const sotRateA = sotA / safeMin;

    // Fator de Ajuste (Quem tá perdendo ataca mais, quem tá ganhando se defende)
    const scoreDiff = scoreH - scoreA;
    let stateModH = 1.0; let stateModA = 1.0;
    if (Math.abs(scoreDiff) >= 3) { stateModH = 0.6; stateModA = 0.6; } // Game over
    else if (scoreDiff < 0) { stateModH = 1.35; stateModA = 0.8; } // Casa perdendo
    else if (scoreDiff > 0) { stateModH = 0.8; stateModA = 1.35; } // Fora perdendo

    // Time Decay (Urgência do fim de jogo)
    let timeMod = 1.0;
    if (targetHalf === 'FT' && minute > 75) timeMod = Math.exp((minute - 75) / 25);
    else if (targetHalf === 'HT' && minute > 35) timeMod = 1.2;

    // Força Ofensiva (Lambdas)
    const lambdaGoalH = ((apRateH * 0.015) + (sotRateH * 0.15)) * stateModH * timeLeft * timeMod;
    const lambdaGoalA = ((apRateA * 0.015) + (sotRateA * 0.15)) * stateModA * timeLeft * timeMod;
    
    const lambdaCornerH = ((apRateH * 0.12) + (sotRateH * 0.1)) * stateModH * timeLeft * timeMod;
    const lambdaCornerA = ((apRateA * 0.12) + (sotRateA * 0.1)) * stateModA * timeLeft * timeMod;

    const lambdaGoalTotal = lambdaGoalH + lambdaGoalA;
    const lambdaCornerTotal = lambdaCornerH + lambdaCornerA;

    // Matriz de Probabilidades Gols
    const pHomeNoGoals = Math.exp(-lambdaGoalH);
    const pAwayNoGoals = Math.exp(-lambdaGoalA);
    const pTotal0 = poisson(lambdaGoalTotal, 0);
    const pTotal1 = poisson(lambdaGoalTotal, 1);
    
    // Projeções Estatísticas Clássicas
    const probOver05 = 1 - pTotal0; // Prob de sair +1 gol
    const probOver15 = 1 - pTotal0 - pTotal1; // Prob de sair +2 gols
    const probHomeScore = 1 - pHomeNoGoals;
    const probAwayScore = 1 - pAwayNoGoals;
    const probBtts = probHomeScore * probAwayScore;

    // Projeção 1X2 Final
    let probHomeWinFT = 0; let probDrawFT = 0; let probAwayWinFT = 0;
    for (let i = 0; i <= 5; i++) {
        for (let j = 0; j <= 5; j++) {
            const p = poisson(lambdaGoalH, i) * poisson(lambdaGoalA, j);
            const finalH = scoreH + i;
            const finalA = scoreA + j;
            if (finalH > finalA) probHomeWinFT += p;
            else if (finalH === finalA) probDrawFT += p;
            else probAwayWinFT += p;
        }
    }

    // Projeção Cantos
    const pCorner0 = poisson(lambdaCornerTotal, 0);
    const pCorner1 = poisson(lambdaCornerTotal, 1);
    const pCorner2 = poisson(lambdaCornerTotal, 2);
    const probOver05Corner = 1 - pCorner0;
    const probOver15Corner = 1 - pCorner0 - pCorner1;

    // =====================================
    // MOTOR DE SINAIS (RECOMENDAÇÕES)
    // =====================================
    const recommendations: Array<{title: string, prob: number, fairOdd: number, type: 'goal' | 'corner' | 'match'}> = [];
    const calcOdd = (p: number) => p > 0.05 ? 1/p : 99;

    const currentGoals = scoreH + scoreA;
    const currentCorners = cornersH + cornersA;

    // Over Goals Asiático (Sempre +1 e +2 do placar atual)
    if (probOver05 > 0.6) recommendations.push({ title: `Over ${currentGoals + 0.5} Gols`, prob: probOver05, fairOdd: calcOdd(probOver05), type: 'goal' });
    if (probOver15 > 0.45) recommendations.push({ title: `Over ${currentGoals + 1.5} Gols`, prob: probOver15, fairOdd: calcOdd(probOver15), type: 'goal' });
    
    // Over Cantos Asiáticos
    if (probOver05Corner > 0.7) recommendations.push({ title: `Asiático +${currentCorners + 1.0} Cantos`, prob: probOver15Corner, fairOdd: calcOdd(probOver15Corner), type: 'corner' });
    if (probOver15Corner > 0.6) recommendations.push({ title: `Limite +${currentCorners + 0.5} Cantos`, prob: probOver05Corner, fairOdd: calcOdd(probOver05Corner), type: 'corner' });

    // BTTS (Ambas Marcam) se ninguém marcou ou só 1 marcou
    if ((scoreH === 0 || scoreA === 0) && probBtts > 0.5) recommendations.push({ title: "Ambas Marcam (Sim)", prob: probBtts, fairOdd: calcOdd(probBtts), type: 'goal' });

    // Match Odds (Quem tá amassando)
    if (scoreDiff <= 0 && lambdaGoalH > 0.8 && probHomeWinFT > 0.5) recommendations.push({ title: "Dupla Chance (Casa ou Empate)", prob: probHomeWinFT + probDrawFT, fairOdd: calcOdd(probHomeWinFT + probDrawFT), type: 'match' });
    if (scoreDiff >= 0 && lambdaGoalA > 0.8 && probAwayWinFT > 0.5) recommendations.push({ title: "Dupla Chance (Fora ou Empate)", prob: probAwayWinFT + probDrawFT, fairOdd: calcOdd(probAwayWinFT + probDrawFT), type: 'match' });
    if (lambdaGoalH > 1.0) recommendations.push({ title: "Próximo Gol: Casa", prob: probHomeScore, fairOdd: calcOdd(probHomeScore), type: 'match' });
    if (lambdaGoalA > 1.0) recommendations.push({ title: "Próximo Gol: Fora", prob: probAwayScore, fairOdd: calcOdd(probAwayScore), type: 'match' });

    // Ordena as melhores recomendações e pega as Top 3
    const topPicks = recommendations.sort((a, b) => b.prob - a.prob).slice(0, 3);

    // =====================================
    // DIAGNÓSTICO DO SCRIPT E MOMENTUM
    // =====================================
    let script = "";
    if (Math.abs(scoreDiff) >= 3) script = "❄️ GAME KILL: Jogo resolvido. A tendência para o Under é forte.";
    else if (totalPPM < 0.8) script = "💤 JOGO LENTO: Frequência baixa de ataques. Evite linhas de Gols.";
    else if (lambdaGoalH > lambdaGoalA * 2.5) script = "🔥 BLITZ MANDANTE: O time da casa está sufocando o adversário na defesa.";
    else if (lambdaGoalA > lambdaGoalH * 2.5) script = "🔥 BLITZ VISITANTE: Amasso do visitante. A defesa mandante vai ceder em breve.";
    else script = "⚔️ TROCAÇÃO FRANCA: Jogo aberto de transição rápida. Cenário perfeito para Gols e Cantos.";

    let momentumLvl = { ppm: totalPPM, level: 'Baixo', color: 'text-slate-500' };
    if (totalPPM >= 1.5) momentumLvl = { ppm: totalPPM, level: 'Esmagamento', color: 'text-emerald-500' };
    else if (totalPPM >= 1.0) momentumLvl = { ppm: totalPPM, level: 'Intenso', color: 'text-indigo-500' };
    else if (totalPPM >= 0.6) momentumLvl = { ppm: totalPPM, level: 'Moderado', color: 'text-amber-500' };

    return { 
        closed: false, script, momentum: momentumLvl, topPicks, 
        stats: { hWin: probHomeWinFT, draw: probDrawFT, aWin: probAwayWinFT, btts: probBtts, expGoals: scoreH + scoreA + lambdaGoalTotal, expCorners: cornersH + cornersA + lambdaCornerTotal } 
    };

  }, [minute, scoreH, scoreA, cornersH, cornersA, apH, apA, sotH, sotA, targetHalf]);


  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 md:px-8 pt-8 font-sans">
        
      {!isPro && <ProBlurOverlay title="Motor Preditivo IA" desc="Utilizamos a Matriz de Poisson adaptada com Decay de Tempo para prever o Resultado Final e encontrar apostas de Valor Esperado Positivo (+EV)." />}
      
      <div className={!isPro ? 'pointer-events-none select-none blur-[4px] opacity-60' : ''}>
        
        {/* HEADER */}
        <div className="flex flex-col gap-2 mb-8 border-b border-slate-200 dark:border-[#2C2C2E] pb-6">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
            Quant-Live Predictive Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Scanner de Oportunidades
          </h1>
          <p className="text-slate-500 dark:text-[#8E8E93] text-sm font-medium mt-1">Análise em tempo real de Fair Lines (Odds Justas) e Projeções de Fim de Jogo.</p>
        </div>

        {/* HUD: RELATÓRIO PREDITIVO (O CÉREBRO) */}
        {!predictions.closed ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              
              {/* PAINEL ESQUERDO: TOP INDICAÇÕES (+EV) */}
              <div className="lg:col-span-7 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-[#2C2C2E] pb-4">
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"><Target size={18}/></div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Sinais de Entrada (+EV)</h3>
                  </div>

                  <div className="space-y-4 flex-1">
                      {predictions.topPicks?.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#636366] border border-dashed border-slate-200 dark:border-[#3A3A3C] rounded-xl">
                              Sem oportunidades claras no momento.
                          </div>
                      ) : (
                          predictions.topPicks?.map((pick, idx) => (
                              <div key={idx} className="bg-slate-50 dark:bg-[#000000] p-4 rounded-xl border border-slate-200 dark:border-[#3A3A3C] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-indigo-500/50">
                                  <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${pick.type === 'goal' ? 'bg-orange-500/10 text-orange-500' : pick.type === 'corner' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-sky-500/10 text-sky-500'}`}>
                                          {pick.type === 'goal' ? <Goal size={16}/> : pick.type === 'corner' ? <Flag size={16}/> : <TrendingUp size={16}/>}
                                      </div>
                                      <div>
                                          <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{pick.title}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                              <span className={`text-[10px] font-black uppercase tracking-widest ${pick.prob >= 0.65 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                  {pick.prob >= 0.65 ? 'Confiança Alta' : 'Confiança Média'}
                                              </span>
                                              <span className="text-slate-400 text-[10px]">• {(pick.prob * 100).toFixed(0)}% Win Rate</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-200 dark:border-[#2C2C2E] pt-3 sm:pt-0">
                                      <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-[#8E8E93] tracking-widest">Odd Justa Sugerida</span>
                                      <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">@{pick.fairOdd.toFixed(2)}</span>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>

              {/* PAINEL DIREITO: PROJEÇÃO DO PLACAR E ESTATÍSTICAS */}
              <div className="lg:col-span-5 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-[#2C2C2E] pb-4">
                      <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"><BarChart3 size={18}/></div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Projeção da IA ({targetHalf})</h3>
                  </div>

                  <div className="space-y-5 flex-1">
                      {/* Expected Goals & Corners */}
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 dark:bg-[#000000] p-4 rounded-xl border border-slate-200 dark:border-[#3A3A3C] text-center shadow-sm">
                              <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-[#8E8E93] tracking-widest mb-1">Gols Finais Exp.</p>
                              <AnimatedNumber value={predictions.stats?.expGoals.toFixed(2) || 0} className="text-xl font-bold font-mono text-slate-900 dark:text-white" />
                          </div>
                          <div className="bg-slate-50 dark:bg-[#000000] p-4 rounded-xl border border-slate-200 dark:border-[#3A3A3C] text-center shadow-sm">
                              <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-[#8E8E93] tracking-widest mb-1">Cantos Finais Exp.</p>
                              <AnimatedNumber value={predictions.stats?.expCorners.toFixed(1) || 0} className="text-xl font-bold font-mono text-slate-900 dark:text-white" />
                          </div>
                      </div>

                      {/* Match Odds (1X2) Progress Bars */}
                      <div className="space-y-4 pt-2">
                          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#8E8E93] tracking-widest">Probabilidades do Placar (Match Odds)</p>
                          
                          <div>
                              <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                                  <span className="text-slate-700 dark:text-white">Vitória Mandante (1)</span>
                                  <span className="text-slate-500 dark:text-[#8E8E93] font-mono">{((predictions.stats?.hWin || 0) * 100).toFixed(1)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-[#2C2C2E] rounded-full overflow-hidden">
                                  <motion.div className="h-full bg-indigo-500" initial={{width:0}} animate={{width: `${(predictions.stats?.hWin || 0) * 100}%`}} />
                              </div>
                          </div>

                          <div>
                              <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                                  <span className="text-slate-700 dark:text-white">Empate (X)</span>
                                  <span className="text-slate-500 dark:text-[#8E8E93] font-mono">{((predictions.stats?.draw || 0) * 100).toFixed(1)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-[#2C2C2E] rounded-full overflow-hidden">
                                  <motion.div className="h-full bg-amber-500" initial={{width:0}} animate={{width: `${(predictions.stats?.draw || 0) * 100}%`}} />
                              </div>
                          </div>

                          <div>
                              <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                                  <span className="text-slate-700 dark:text-white">Vitória Visitante (2)</span>
                                  <span className="text-slate-500 dark:text-[#8E8E93] font-mono">{((predictions.stats?.aWin || 0) * 100).toFixed(1)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-[#2C2C2E] rounded-full overflow-hidden">
                                  <motion.div className="h-full bg-emerald-500" initial={{width:0}} animate={{width: `${(predictions.stats?.aWin || 0) * 100}%`}} />
                              </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-[#2C2C2E] mt-4 flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#8E8E93] tracking-widest">Ambas Marcam (BTTS)</span>
                              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{((predictions.stats?.btts || 0) * 100).toFixed(1)}%</span>
                          </div>
                      </div>
                  </div>
              </div>

            </div>
        ) : (
            <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-16 text-center shadow-sm mb-8">
                <ShieldAlert size={48} className="text-slate-300 dark:text-[#3A3A3C] mx-auto mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93]">Mercado Encerrado ou Fechado para Análise</p>
            </div>
        )}

        {/* MOMENTUM & SCRIPT DO JOGO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className={`p-3 rounded-xl ${predictions.momentum.ppm >= 1.0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border border-emerald-100 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-[#000000] text-slate-400 border border-slate-200 dark:border-[#3A3A3C]'}`}>
                    <Zap size={20} />
                </div>
                <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-[#8E8E93] mb-0.5">Momentum (PPM)</p>
                    <p className={`font-bold font-mono ${predictions.momentum.color}`}>{predictions.momentum.ppm.toFixed(2)} <span className="font-sans text-[10px] ml-1 uppercase">({predictions.momentum.level})</span></p>
                </div>
            </div>
            <div className="md:col-span-2 bg-indigo-600 dark:bg-indigo-500 text-white p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                <ShieldCheck size={24} className="shrink-0 text-indigo-200" />
                <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-200 mb-0.5">Leitura do Cenário (Game Script)</p>
                    <p className="text-sm font-bold tracking-wide">{predictions.script}</p>
                </div>
            </div>
        </div>

        {/* PAINEL DE CONTROLE DE ESTATÍSTICAS (INPUTS DO USUÁRIO) */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-slate-100 dark:border-[#2C2C2E] pb-6 gap-6">
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <span className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#636366] mb-1">Cenários Prontos:</span>
                  {['blitz_casa', 'blitz_fora', 'equilibrado'].map((p) => (
                      <button key={p} onClick={() => applyPreset(p as any)} className="flex-1 md:flex-none text-[10px] uppercase font-bold tracking-wider px-4 py-2 rounded-lg border border-slate-200 dark:border-[#3A3A3C] bg-slate-50 dark:bg-[#000000] text-slate-600 dark:text-[#8E8E93] hover:border-indigo-500 hover:text-indigo-600 transition-colors capitalize text-center">
                          {p.replace('_', ' ')}
                      </button>
                  ))}
              </div>

              <div className="flex bg-slate-100 dark:bg-[#000000] p-1.5 rounded-xl border border-slate-200 dark:border-[#2C2C2E] w-full md:w-[250px]">
                <button onClick={() => handleHalfToggle('HT')} className={`flex-1 rounded-lg text-[10px] font-bold uppercase tracking-widest py-2 transition-all ${targetHalf === 'HT' ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-[#3A3A3C]' : 'text-slate-500 dark:text-[#8E8E93]'}`}>1º Tempo</button>
                <button onClick={() => handleHalfToggle('FT')} className={`flex-1 rounded-lg text-[10px] font-bold uppercase tracking-widest py-2 transition-all ${targetHalf === 'FT' ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-[#3A3A3C]' : 'text-slate-500 dark:text-[#8E8E93]'}`}>2º Tempo</button>
              </div>
          </div>

          <div className="mb-10 w-full max-w-xl mx-auto">
              <div className="flex justify-between mb-3 px-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Minuto Atual</label>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black text-2xl">{minute}'</span>
              </div>
              <input type="range" min="1" max={targetHalf === 'HT' ? 45 : 99} value={minute} onChange={(e) => setMinute(Number(e.target.value))} className="w-full h-2.5 bg-slate-200 dark:bg-[#2C2C2E] rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>

          {/* DADOS DOS TIMES (SLIDERS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] border-l-4 border-indigo-500 pl-3 mb-2">Mandante (Casa)</h4>
                <SliderGroup label="Placar" value={scoreH} max={10} setter={setScoreH} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Escanteios" value={cornersH} max={25} setter={setCornersH} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Ataques Perigosos" value={apH} max={150} setter={setApH} colorClass="text-indigo-600 dark:text-indigo-400" />
                <SliderGroup label="Chutes no Alvo" value={sotH} max={20} setter={setSotH} colorClass="text-emerald-600 dark:text-emerald-500" />
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] border-l-4 border-indigo-500 pl-3 mb-2">Visitante (Fora)</h4>
                <SliderGroup label="Placar" value={scoreA} max={10} setter={setScoreA} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Escanteios" value={cornersA} max={25} setter={setCornersA} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Ataques Perigosos" value={apA} max={150} setter={setApA} colorClass="text-indigo-600 dark:text-indigo-400" />
                <SliderGroup label="Chutes no Alvo" value={sotA} max={20} setter={setSotA} colorClass="text-emerald-600 dark:text-emerald-500" />
              </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default LiveTerminal;
