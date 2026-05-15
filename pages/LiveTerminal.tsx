import React, { useState, useMemo } from 'react';
import { 
    Clock, Target, Flag, TrendingUp, ShieldAlert, BarChart3, Eye, 
    CheckCircle2, AlertTriangle, Crown, ChevronRight, Zap, 
    ShieldCheck, Goal, Layers, RectangleHorizontal, Info
} from 'lucide-react';
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

const poisson = (lambda: number, k: number) => {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

// Probabilidade de sair MAIS de "k" eventos (Over k.5)
const poissonOver = (lambda: number, required: number) => {
    if (required <= 0) return 1;
    let cumulative = 0;
    for (let i = 0; i < required; i++) {
        cumulative += poisson(lambda, i);
    }
    return Math.max(0.01, Math.min(0.99, 1 - cumulative));
};

const calcFairOdd = (prob: number) => prob > 0.01 ? (1 / prob).toFixed(2) : '99.00';

// Componente de Animação de Números
const AnimatedNumber = ({ value, prefix = "", suffix = "", className = "" }: { value: string | number, prefix?: string, suffix?: string, className?: string }) => (
    <AnimatePresence mode="popLayout">
        <motion.span key={value} initial={{ opacity: 0.5, y: -2 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`inline-block font-mono ${className}`}>
            {prefix}{value}{suffix}
        </motion.span>
    </AnimatePresence>
);

// Slider Estilo Apple PRO
interface SliderGroupProps { label: string; value: number; max: number; setter: (val: number) => void; colorClass: string; }
const SliderGroup: React.FC<SliderGroupProps> = ({ label, value, max, setter, colorClass }) => (
  <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] p-3.5 sm:p-4 rounded-xl shadow-sm min-w-0">
    <div className="flex justify-between items-center mb-3">
       <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest truncate mr-2">{label}</label>
       <span className={`text-lg font-bold font-mono ${colorClass}`}>{value}</span>
    </div>
    <input type="range" min="0" max={max} value={value} onChange={(e) => setter(Number(e.target.value))} className={`w-full h-2.5 bg-slate-100 dark:bg-[#000000] rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500 transition-all`} />
  </div>
);

const LiveTerminal: React.FC = () => {
  const { isPro } = useBetStore();
  const navigate = useNavigate();

  // OVERLAY PRO
  const ProBlurOverlay = () => (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 dark:bg-[#000000]/60 backdrop-blur-md rounded-2xl">
          <div className="bg-white dark:bg-[#1C1C1E] border border-indigo-500/30 p-8 rounded-2xl max-w-md text-center shadow-xl flex flex-col items-center mx-4">
              <div className="bg-indigo-500/10 p-4 rounded-xl mb-4 text-indigo-600 dark:text-indigo-400 mx-auto"><Crown size={32} /></div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2 uppercase">Terminal Preditivo <span className="text-indigo-500">PRO</span></h2>
              <p className="text-slate-500 dark:text-[#8E8E93] mb-6 text-sm leading-relaxed font-medium">Acesse a IA que simula milhares de cenários e prevê o resultado exato (Gols, Cantos e Cartões) para montar a aposta perfeita no intervalo.</p>
              <button onClick={() => navigate('/pro')} className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 font-bold py-4 px-8 rounded-xl transition-all shadow-sm text-xs tracking-widest uppercase">Desbloquear Acesso</button>
          </div>
      </div>
  );

  const [minute, setMinute] = useState<number>(45);
  
  const [scoreH, setScoreH] = useState<number>(0);
  const [cornersH, setCornersH] = useState<number>(2);
  const [cardsH, setCardsH] = useState<number>(1);
  const [apH, setApH] = useState<number>(50);
  const [sotH, setSotH] = useState<number>(1);

  const [scoreA, setScoreA] = useState<number>(0);
  const [cornersA, setCornersA] = useState<number>(0);
  const [cardsA, setCardsA] = useState<number>(1);
  const [apA, setApA] = useState<number>(37);
  const [sotA, setSotA] = useState<number>(0);

  const applyPreset = (type: 'blitz_casa' | 'blitz_fora' | 'equilibrado') => {
      setMinute(45);
      if (type === 'blitz_casa') {
          setScoreH(0); setScoreA(1); setCornersH(5); setCornersA(1); setCardsH(1); setCardsA(3); setApH(70); setApA(20); setSotH(4); setSotA(1);
      } else if (type === 'blitz_fora') {
          setScoreH(1); setScoreA(0); setCornersH(1); setCornersA(5); setCardsH(3); setCardsA(1); setApH(20); setApA(70); setSotH(1); setSotA(4);
      } else {
          setScoreH(0); setScoreA(0); setCornersH(2); setCornersA(2); setCardsH(1); setCardsA(1); setApH(35); setApA(35); setSotH(1); setSotA(1);
      }
  };

  // ==========================================
  // O CÉREBRO PREDITIVO (NOVO MOTOR PANORÂMICO)
  // ==========================================
  const predictions = useMemo(() => {
    const maxTime = 95; // Foco sempre em projetar o final do jogo (FT) com acréscimos médios
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

    // Ajuste de "Desespero" pelo Placar
    const scoreDiff = scoreH - scoreA;
    let stateModH = 1.0; let stateModA = 1.0;
    if (Math.abs(scoreDiff) >= 3) { stateModH = 0.6; stateModA = 0.6; } // Game over
    else if (scoreDiff < 0) { stateModH = 1.25; stateModA = 0.85; } // Casa perdendo (ataca mais)
    else if (scoreDiff > 0) { stateModH = 0.85; stateModA = 1.25; } // Fora perdendo (ataca mais)

    // Ajuste Exponencial (Fim de Jogo)
    let timeMod = 1.0;
    if (minute > 75) timeMod = Math.exp((minute - 75) / 20);

    // ==========================================
    // FORÇAS (LAMBDAS) PARA O RESTANTE DO JOGO
    // Coeficientes ajustados para a realidade do futebol (média 2.5 gols, 10 cantos, 4.5 cartões)
    // ==========================================
    const lambdaGoalH = ((apRateH * 0.012) + (sotRateH * 0.08)) * stateModH * timeLeft * timeMod;
    const lambdaGoalA = ((apRateA * 0.012) + (sotRateA * 0.08)) * stateModA * timeLeft * timeMod;
    const lambdaGoalTotal = lambdaGoalH + lambdaGoalA;

    const lambdaCornerH = ((apRateH * 0.055) + (sotRateH * 0.04)) * stateModH * timeLeft * timeMod;
    const lambdaCornerA = ((apRateA * 0.055) + (sotRateA * 0.04)) * stateModA * timeLeft * timeMod;
    const lambdaCornerTotal = lambdaCornerH + lambdaCornerA;

    // Cartões são influenciados pela tensão do jogo (PPM) e faltas simuladas
    const lambdaCardH = (apRateA * 0.03 + 0.01) * timeLeft; // Sofre ataques = toma cartões
    const lambdaCardA = (apRateH * 0.03 + 0.01) * timeLeft;
    const lambdaCardTotal = lambdaCardH + lambdaCardA;

    // TOTAIS ESPERADOS (FT)
    const expGoalsFT = scoreH + scoreA + lambdaGoalTotal;
    const expCornersFT = cornersH + cornersA + lambdaCornerTotal;
    const expCardsFT = cardsH + cardsA + lambdaCardTotal;

    // ==========================================
    // CÁLCULO DE PROBABILIDADES DAS LINHAS (BOOKIES)
    // ==========================================
    const currentGoals = scoreH + scoreA;
    const currentCorners = cornersH + cornersA;
    const currentCards = cardsH + cardsA;

    // GOLS: Projetar as próximas 3 linhas asiáticas acima do placar atual
    const probGoal1 = poissonOver(lambdaGoalTotal, 1); // +0.5 gols
    const probGoal2 = poissonOver(lambdaGoalTotal, 2); // +1.5 gols
    const probGoal3 = poissonOver(lambdaGoalTotal, 3); // +2.5 gols

    // CANTOS: Projetar as linhas realistas (Ex: Se tem 2, projeto O7.5, O8.5, O9.5)
    // A linha base da casa de aposta geralmente é Floor(expCornersFT).
    const baseCornerLine = Math.max(currentCorners + 1, Math.floor(expCornersFT));
    
    // A quantidade de cantos NECESSÁRIOS para bater as linhas (Subtraindo os que já saíram)
    const reqC1 = Math.max(1, baseCornerLine - currentCorners);
    const reqC2 = reqC1 + 1;
    const reqC3 = reqC2 + 1;

    const probCorner1 = poissonOver(lambdaCornerTotal, reqC1);
    const probCorner2 = poissonOver(lambdaCornerTotal, reqC2);
    const probCorner3 = poissonOver(lambdaCornerTotal, reqC3);

    // CARTÕES: Linhas reais
    const baseCardLine = Math.max(currentCards + 1, Math.floor(expCardsFT));
    const reqCard1 = Math.max(1, baseCardLine - currentCards);
    const reqCard2 = reqCard1 + 1;

    const probCard1 = poissonOver(lambdaCardTotal, reqCard1);
    const probCard2 = poissonOver(lambdaCardTotal, reqCard2);

    // MATCH ODDS (1 X 2 FT)
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

    const probHomeScore = 1 - Math.exp(-lambdaGoalH);
    const probAwayScore = 1 - Math.exp(-lambdaGoalA);
    const probBtts = ((scoreH > 0) ? 1 : probHomeScore) * ((scoreA > 0) ? 1 : probAwayScore);

    // =====================================
    // CONSTRUTOR DE APOSTAS (BET BUILDER COMBOS)
    // =====================================
    const combos = [];
    
    // Combo 1: Favorito/Pressão + Gols
    if (scoreDiff <= 0 && lambdaGoalH > 0.8 && probGoal1 > 0.6) {
        const p = (probHomeWinFT + probDrawFT) * probGoal1;
        combos.push({ title: "Casa ou Empate + Mais de 0.5 Gols", prob: p, odd: calcFairOdd(p) });
    } else if (scoreDiff >= 0 && lambdaGoalA > 0.8 && probGoal1 > 0.6) {
        const p = (probAwayWinFT + probDrawFT) * probGoal1;
        combos.push({ title: "Fora ou Empate + Mais de 0.5 Gols", prob: p, odd: calcFairOdd(p) });
    }

    // Combo 2: BTTS + Cantos
    if (probBtts > 0.5 && probCorner1 > 0.6) {
        const p = probBtts * probCorner1;
        combos.push({ title: `Ambas Marcam + Mais de ${baseCornerLine - 0.5} Cantos`, prob: p, odd: calcFairOdd(p) });
    }

    // Combo 3: Amasso Total (Vitória + Gols + Cantos)
    if (lambdaGoalH > 1.2 && probCorner2 > 0.5) {
        const p = probHomeWinFT * probGoal2 * probCorner2;
        combos.push({ title: `Vitória Casa + Over 1.5 Gols + Over ${baseCornerLine + 0.5} Cantos`, prob: p, odd: calcFairOdd(p) });
    } else if (lambdaGoalA > 1.2 && probCorner2 > 0.5) {
        const p = probAwayWinFT * probGoal2 * probCorner2;
        combos.push({ title: `Vitória Fora + Over 1.5 Gols + Over ${baseCornerLine + 0.5} Cantos`, prob: p, odd: calcFairOdd(p) });
    }

    // Fallback combo se o jogo estiver lento
    if (combos.length === 0) {
        const pUnder = Math.exp(-lambdaGoalTotal);
        const pUnderCorner = 1 - probCorner1;
        const p = pUnder * pUnderCorner;
        combos.push({ title: `Under ${currentGoals + 1.5} Gols + Under ${baseCornerLine + 0.5} Cantos`, prob: p, odd: calcFairOdd(p) });
    }

    // =====================================
    // DIAGNÓSTICO DO SCRIPT E MOMENTUM
    // =====================================
    let script = "";
    if (Math.abs(scoreDiff) >= 3) script = "JOGO DECIDIDO: Foco na gestão de tempo. Linhas de Over perdem valor.";
    else if (totalPPM < 0.8) script = "JOGO TRUNCADO: Alta chance de Under. Frequência de ataques muito baixa.";
    else if (lambdaGoalH > lambdaGoalA * 2.5) script = "AMASSO DO MANDANTE: Pressão absurda da Casa. Excelente cenário para Gols/Cantos a favor.";
    else if (lambdaGoalA > lambdaGoalH * 2.5) script = "DOMÍNIO VISITANTE: Fora controlando as ações. Linhas a favor do Visitante têm valor.";
    else script = "TROCAÇÃO FRANCA (LÁ E CÁ): Transições rápidas de ambos os lados. Cenário ideal para BTTS e Cantos.";

    let momentumLvl = { ppm: totalPPM, level: 'Baixo', color: 'text-slate-500' };
    if (totalPPM >= 1.5) momentumLvl = { ppm: totalPPM, level: 'Esmagamento', color: 'text-emerald-500' };
    else if (totalPPM >= 1.0) momentumLvl = { ppm: totalPPM, level: 'Intenso', color: 'text-indigo-500' };
    else if (totalPPM >= 0.6) momentumLvl = { ppm: totalPPM, level: 'Moderado', color: 'text-amber-500' };

    return { 
        closed: false, script, momentum: momentumLvl, combos: combos.slice(0, 3),
        totals: { goals: expGoalsFT, corners: expCornersFT, cards: expCardsFT },
        lines: {
            goals: [
                { line: `Over ${currentGoals + 0.5}`, prob: probGoal1, odd: calcFairOdd(probGoal1) },
                { line: `Over ${currentGoals + 1.5}`, prob: probGoal2, odd: calcFairOdd(probGoal2) },
                { line: `Over ${currentGoals + 2.5}`, prob: probGoal3, odd: calcFairOdd(probGoal3) }
            ],
            corners: [
                { line: `Mais de ${baseCornerLine - 0.5}`, prob: probCorner1, odd: calcFairOdd(probCorner1) },
                { line: `Mais de ${baseCornerLine + 0.5}`, prob: probCorner2, odd: calcFairOdd(probCorner2) },
                { line: `Mais de ${baseCornerLine + 1.5}`, prob: probCorner3, odd: calcFairOdd(probCorner3) }
            ],
            cards: [
                { line: `Mais de ${baseCardLine - 0.5}`, prob: probCard1, odd: calcFairOdd(probCard1) },
                { line: `Mais de ${baseCardLine + 0.5}`, prob: probCard2, odd: calcFairOdd(probCard2) }
            ]
        },
        stats: { hWin: probHomeWinFT, draw: probDrawFT, aWin: probAwayWinFT, btts: probBtts } 
    };

  }, [minute, scoreH, scoreA, cornersH, cornersA, cardsH, cardsA, apH, apA, sotH, sotA]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 md:px-8 pt-8 font-sans">
        
      {!isPro && <ProBlurOverlay />}
      
      <div className={!isPro ? 'pointer-events-none select-none blur-[4px] opacity-60' : ''}>
        
        {/* HEADER EDUCATIVO (BCSGPT STYLE) */}
        <div className="flex flex-col gap-2 mb-6 border-b border-slate-200 dark:border-[#2C2C2E] pb-6">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
            Quant-Live Predictive Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Prognóstico Live (FT)
          </h1>
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-3 sm:p-4 rounded-xl flex items-start gap-3 mt-2 shadow-sm">
             <Info className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" size={18} />
             <p className="text-xs sm:text-sm text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
                <strong>Análise de Intervalo (HT) ao Final do Jogo (FT):</strong> Insira as estatísticas exatas da partida atual. A Inteligência Artificial vai projetar o 2º tempo e gerar a <strong>Fair Line (Odd Justa)</strong> dos principais mercados. Cruze nossa odd com a da Bet365 e aposte se houver valor (+EV).
             </p>
          </div>
        </div>

        {!predictions.closed ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              
              {/* PAINEL ESQUERDO: MESA DE OPERAÇÕES (LINHAS E ODDS) */}
              <div className="lg:col-span-7 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-5 sm:p-8 shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-[#2C2C2E] pb-4">
                      <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"><Layers size={18}/></div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Painel de Precificação (Fair Lines)</h3>
                  </div>

                  <div className="space-y-6 flex-1">
                      
                      {/* TABELA GOLS */}
                      <div>
                          <div className="flex items-center gap-2 mb-3 text-slate-500 dark:text-[#8E8E93]">
                             <Goal size={14}/> <h4 className="text-[10px] uppercase font-bold tracking-widest">Mercado de Gols (Projeção Total: <strong className="text-slate-900 dark:text-white">{predictions.totals?.goals.toFixed(2)}</strong>)</h4>
                          </div>
                          <div className="grid grid-cols-3 gap-2 sm:gap-4">
                              {predictions.lines?.goals.map((line, i) => (
                                  <div key={i} className="bg-slate-50 dark:bg-[#000000] p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-[#3A3A3C] text-center shadow-sm">
                                      <p className="text-[10px] font-bold uppercase text-slate-700 dark:text-white mb-2 truncate">{line.line}</p>
                                      <p className={`text-lg sm:text-xl font-bold font-mono tracking-tight mb-1 ${line.prob > 0.6 ? 'text-emerald-600 dark:text-emerald-400' : line.prob > 0.4 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                          {(line.prob * 100).toFixed(1)}%
                                      </p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Justa: <strong className="text-slate-900 dark:text-white text-xs">@{line.odd}</strong></p>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* TABELA CANTOS */}
                      <div>
                          <div className="flex items-center gap-2 mb-3 text-slate-500 dark:text-[#8E8E93]">
                             <Flag size={14}/> <h4 className="text-[10px] uppercase font-bold tracking-widest">Escanteios (Projeção Total: <strong className="text-slate-900 dark:text-white">{predictions.totals?.corners.toFixed(1)}</strong>)</h4>
                          </div>
                          <div className="grid grid-cols-3 gap-2 sm:gap-4">
                              {predictions.lines?.corners.map((line, i) => (
                                  <div key={i} className="bg-slate-50 dark:bg-[#000000] p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-[#3A3A3C] text-center shadow-sm">
                                      <p className="text-[10px] font-bold uppercase text-slate-700 dark:text-white mb-2 truncate">{line.line}</p>
                                      <p className={`text-lg sm:text-xl font-bold font-mono tracking-tight mb-1 ${line.prob > 0.6 ? 'text-indigo-600 dark:text-indigo-400' : line.prob > 0.4 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                          {(line.prob * 100).toFixed(1)}%
                                      </p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Justa: <strong className="text-slate-900 dark:text-white text-xs">@{line.odd}</strong></p>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* TABELA CARTÕES */}
                      <div>
                          <div className="flex items-center gap-2 mb-3 text-slate-500 dark:text-[#8E8E93]">
                             <RectangleHorizontal size={14} className="text-yellow-500" fill="currentColor"/> <h4 className="text-[10px] uppercase font-bold tracking-widest">Cartões (Projeção Total: <strong className="text-slate-900 dark:text-white">{predictions.totals?.cards.toFixed(1)}</strong>)</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              {predictions.lines?.cards.map((line, i) => (
                                  <div key={i} className="bg-slate-50 dark:bg-[#000000] p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-[#3A3A3C] flex items-center justify-between shadow-sm">
                                      <div>
                                          <p className="text-[10px] font-bold uppercase text-slate-700 dark:text-white mb-1 truncate">{line.line}</p>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Justa: <strong className="text-slate-900 dark:text-white text-xs">@{line.odd}</strong></p>
                                      </div>
                                      <p className={`text-xl font-bold font-mono tracking-tight ${line.prob > 0.6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-[#8E8E93]'}`}>
                                          {(line.prob * 100).toFixed(1)}%
                                      </p>
                                  </div>
                              ))}
                          </div>
                      </div>

                  </div>
              </div>

              {/* PAINEL DIREITO: BET BUILDER & MATCH ODDS */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                  
                  {/* BET BUILDER (COMBOS DE OURO) */}
                  <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm flex-1">
                      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-[#2C2C2E] pb-4">
                          <div className="bg-amber-50 dark:bg-amber-500/10 p-2.5 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"><Crown size={18}/></div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Criar Aposta (Bet Builder)</h3>
                      </div>
                      
                      <div className="space-y-3">
                          {predictions.combos?.map((combo, i) => (
                              <div key={i} className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm hover:border-amber-500/50 transition-colors">
                                  <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{combo.title}</p>
                                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Win Rate: <span className="text-amber-600 dark:text-amber-500">{(combo.prob * 100).toFixed(1)}%</span></p>
                                  </div>
                                  <div className="text-right shrink-0">
                                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Odd Justa</p>
                                      <p className="text-lg font-bold font-mono text-slate-900 dark:text-white tracking-tight">@{combo.odd}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* MATCH ODDS 1X2 */}
                  <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#8E8E93] tracking-widest mb-4">Probabilidades Finais (Match Odds)</p>
                      <div className="space-y-4">
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
                                  <motion.div className="h-full bg-slate-400" initial={{width:0}} animate={{width: `${(predictions.stats?.draw || 0) * 100}%`}} />
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
                          <div className="pt-3 border-t border-slate-100 dark:border-[#2C2C2E] mt-4 flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#8E8E93] tracking-widest">Ambas Marcam (BTTS)</span>
                              <span className={`text-sm font-bold font-mono tracking-tight ${(predictions.stats?.btts || 0) > 0.5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{((predictions.stats?.btts || 0) * 100).toFixed(1)}%</span>
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
                    <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-200 mb-0.5">Leitura Tática (Game Script)</p>
                    <p className="text-sm font-bold tracking-wide">{predictions.script}</p>
                </div>
            </div>
        </div>

        {/* PAINEL DE INPUTS (OS SLIDERS DO USUÁRIO) */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-slate-100 dark:border-[#2C2C2E] pb-6 gap-6">
              <div className="w-full md:w-auto">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#636366] mb-3 block">Ambiente de Teste (Mock):</span>
                  <div className="flex flex-wrap gap-2">
                    {['blitz_casa', 'blitz_fora', 'equilibrado'].map((p) => (
                        <button key={p} onClick={() => applyPreset(p as any)} className="flex-1 md:flex-none text-[9px] uppercase font-bold tracking-wider px-3 py-2 rounded-lg border border-slate-200 dark:border-[#3A3A3C] bg-slate-50 dark:bg-[#000000] text-slate-600 dark:text-[#8E8E93] hover:border-indigo-500 hover:text-indigo-600 transition-colors capitalize text-center">
                            {p.replace('_', ' ')}
                        </button>
                    ))}
                  </div>
              </div>
          </div>

          <div className="mb-10 w-full max-w-xl mx-auto">
              <div className="flex justify-between mb-3 px-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Minuto Atual da Partida</label>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black text-2xl">{minute}'</span>
              </div>
              <input type="range" min="1" max={90} value={minute} onChange={(e) => setMinute(Number(e.target.value))} className="w-full h-3 bg-slate-200 dark:bg-[#2C2C2E] rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>

          {/* SLIDERS (GRID) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] border-l-4 border-indigo-500 pl-3 mb-4">Estatísticas Mandante (Casa)</h4>
                <SliderGroup label="Gols Marcados" value={scoreH} max={10} setter={setScoreH} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Escanteios" value={cornersH} max={25} setter={setCornersH} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Cartões Recebidos" value={cardsH} max={10} setter={setCardsH} colorClass="text-amber-500" />
                <SliderGroup label="Ataques Perigosos" value={apH} max={150} setter={setApH} colorClass="text-indigo-600 dark:text-indigo-400" />
                <SliderGroup label="Chutes no Alvo" value={sotH} max={20} setter={setSotH} colorClass="text-emerald-600 dark:text-emerald-500" />
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] border-l-4 border-indigo-500 pl-3 mb-4">Estatísticas Visitante (Fora)</h4>
                <SliderGroup label="Gols Marcados" value={scoreA} max={10} setter={setScoreA} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Escanteios" value={cornersA} max={25} setter={setCornersA} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Cartões Recebidos" value={cardsA} max={10} setter={setCardsA} colorClass="text-amber-500" />
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
