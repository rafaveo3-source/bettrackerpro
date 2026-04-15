import React, { useState, useMemo } from 'react';
import { Clock, Target, Flag, Goal, TrendingUp, ShieldAlert, BarChart3, Eye, CheckCircle2, AlertTriangle, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBetStore } from '../store/useBetStore';

// ==========================================
// FUNÇÕES AUXILIARES MATEMÁTICAS
// ==========================================
const poisson = (lambda: number, k: number) => {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

const factorial = (n: number): number => {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
};

// 🔥 COMPONENTE DE ANIMAÇÃO DE NÚMEROS (PULSO SUAVE) 🔥
const AnimatedNumber = ({ value, prefix = "", suffix = "", className = "" }: { value: string | number, prefix?: string, suffix?: string, className?: string }) => (
    <AnimatePresence mode="popLayout">
        <motion.span
            key={value}
            initial={{ opacity: 0.5, scale: 0.90, y: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`inline-block ${className}`}
        >
            {prefix}{value}{suffix}
        </motion.span>
    </AnimatePresence>
);

// 🔥 COMPONENTE DE SLIDER INDEPENDENTE (ZERO LAG) 🔥
interface SliderGroupProps {
  label: string;
  value: number;
  max: number;
  setter: (val: number) => void;
  colorClass: string;
}

const SliderGroup: React.FC<SliderGroupProps> = ({ label, value, max, setter, colorClass }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1.5">
       <label className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest">{label}</label>
       <span className={`font-mono font-black ${colorClass}`}>{value}</span>
    </div>
    <input 
      type="range" min="0" max={max} value={value} 
      onChange={(e) => setter(Number(e.target.value))} 
      className={`w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all accent-current ${colorClass}`} 
    />
  </div>
);

// ==========================================
// ORÁCULO LIVE (MOTOR PRINCIPAL)
// ==========================================
const OraculoLive: React.FC = () => {
  // 🛡️ CONTROLE DE ACESSO PRO 🛡️
  const { isPro } = useBetStore();
  const navigate = useNavigate();

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

  // 🔥 PRESETS PRO (CENÁRIOS RÁPIDOS) 🔥
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

  const { goalStats, cornerStats, gameScript } = useMemo(() => {
    const extraTime = targetHalf === 'HT' ? 3 : 6; 
    const maxTime = (targetHalf === 'HT' ? 45 : 90) + extraTime;
    const timeLeft = Math.max(0, maxTime - minute);

    const closedRec = { status: 'FECHADO', conf: 'NULA', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700' };

    if (timeLeft <= 0) {
      return {
        goalStats: { p05: 0, odd05: 0, p15: 0, odd15: 0, expTotal: scoreH + scoreA, rec: closedRec },
        cornerStats: { p05: 0, odd05: 0, p10Win: 0, p10Void: 0, odd10: 0, expTotal: cornersH + cornersA, rec: closedRec },
        gameScript: "Mercado Fechado ou Fora da Janela."
      };
    }

    const safeMin = Math.max(1, minute);
    
    const apRateH = apH / safeMin;
    const apRateA = apA / safeMin;
    const sotRateH = sotH / safeMin;
    const sotRateA = sotA / safeMin;

    let baseGoalH = (apRateH * 0.015) + (sotRateH * 0.15);
    let baseGoalA = (apRateA * 0.015) + (sotRateA * 0.15);
    let baseCornerH = (apRateH * 0.12) + (sotRateH * 0.1);
    let baseCornerA = (apRateA * 0.12) + (sotRateA * 0.1);

    const scoreDiff = scoreH - scoreA;
    let stateModH = 1.0;
    let stateModA = 1.0;

    if (Math.abs(scoreDiff) >= 3) {
      stateModH = 0.6; stateModA = 0.6;
    } else if (scoreDiff < 0) {
      stateModH = 1.35; stateModA = 0.8;
    } else if (scoreDiff > 0) {
      stateModH = 0.8; stateModA = 1.35;
    }

    let timeMod = 1.0;
    if (targetHalf === 'FT' && minute > 75) timeMod = Math.exp((minute - 75) / 25);
    else if (targetHalf === 'HT' && minute > 38) timeMod = 1.2;

    const lambdaGoal = (baseGoalH * stateModH + baseGoalA * stateModA) * timeLeft * timeMod;
    const lambdaCorner = (baseCornerH * stateModH + baseCornerA * stateModA) * timeLeft * timeMod;

    const pGoal0 = poisson(lambdaGoal, 0);
    const pGoal1 = poisson(lambdaGoal, 1);
    const pGoal05 = 1 - pGoal0;
    const pGoal15 = 1 - pGoal0 - pGoal1;

    const pCorner0 = poisson(lambdaCorner, 0);
    const pCorner1 = poisson(lambdaCorner, 1);
    const pCorner05 = 1 - pCorner0;
    const pCorner10Void = pCorner1;
    const pCorner10Win = 1 - pCorner0 - pCorner1;

    const calcOdd = (prob: number) => prob > 0.01 ? 1 / prob : 99.0;
    const oddAsiatica10 = pCorner10Win > 0.01 ? (1 - pCorner10Void) / pCorner10Win : 99.0;

    // --- LÓGICA DE RECOMENDAÇÃO (CORES ADAPTADAS PARA CLARO/ESCURO) ---
    const getRecommendation = (prob: number) => {
        if (prob >= 0.65) return { status: 'APROVADO', conf: 'ALTA', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' };
        if (prob >= 0.45) return { status: 'MODERADO', conf: 'MÉDIA', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20' };
        return { status: 'RISCO / FORA', conf: 'BAIXA', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20' };
    };

    let script = "";
    const totalApRate = apRateH + apRateA;
    if (Math.abs(scoreDiff) >= 3) script = "❄️ GAME KILL: Jogo resolvido. A tendência de Over despenca.";
    else if (totalApRate < 0.8) script = "💤 CEMITÉRIO: Jogo lento. Fique fora dos Overs.";
    else if (baseGoalH * stateModH > (baseGoalA * stateModA) * 2.5) script = `🔥 BLITZ MANDANTE: O Desespero do time da casa elevou a projeção.`;
    else if (baseGoalA * stateModA > (baseGoalH * stateModH) * 2.5) script = `🔥 BLITZ VISITANTE: Pressão absurda do visitante. Valor em cantos.`;
    else script = "⚔️ LÁ E CÁ: Trocação franca com defesas abertas. Excelente cenário.";

    return {
      goalStats: {
        p05: Math.min(0.99, Math.max(0.01, pGoal05)), odd05: Math.min(99, calcOdd(pGoal05)),
        p15: Math.min(0.99, Math.max(0.01, pGoal15)), odd15: Math.min(99, calcOdd(pGoal15)),
        expTotal: scoreH + scoreA + lambdaGoal, rec: getRecommendation(pGoal05)
      },
      cornerStats: {
        p05: Math.min(0.99, Math.max(0.01, pCorner05)), odd05: Math.min(99, calcOdd(pCorner05)),
        p10Win: Math.min(0.99, Math.max(0.01, pCorner10Win)), p10Void: Math.min(0.99, Math.max(0.01, pCorner10Void)), odd10: Math.min(99, oddAsiatica10),
        expTotal: cornersH + cornersA + lambdaCorner, rec: getRecommendation(pCorner05)
      },
      gameScript: script
    };
  }, [minute, scoreH, scoreA, cornersH, cornersA, apH, apA, sotH, sotA, targetHalf]);

  // 🛡️ RENDERIZAÇÃO DO PAYWALL SE O USUÁRIO FOR FREE 🛡️
  if (!isPro) {
      return (
          <div className="w-full h-[80vh] flex items-center justify-center p-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-10 text-center flex flex-col items-center justify-center max-w-2xl w-full shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5 opacity-50" />
                  <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-full mb-6 relative z-10 shadow-sm border border-slate-100 dark:border-slate-700">
                      <Crown size={40} className="text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-3 relative z-10">
                      Oráculo Live <span className="text-emerald-500">PRO</span>
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 text-base relative z-10 leading-relaxed">
                      O motor quantitativo ao vivo que cruza xG, Posse de Bola e Ataques Perigosos para calcular a Odd Justa de Gols e Escanteios Asiáticos em tempo real. Uma ferramenta exclusiva para assinantes PRO.
                  </p>
                  <button onClick={() => navigate('/pro')} className="bg-slate-900 text-white dark:bg-gradient-to-r dark:from-emerald-500 dark:to-emerald-400 dark:text-slate-950 font-black py-4 px-10 rounded-xl shadow-lg shadow-slate-900/20 dark:shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 relative z-10 text-sm tracking-widest uppercase">
                      Desbloquear Oráculo
                  </button>
              </div>
          </div>
      );
  }

  // 👇 DAQUI PARA BAIXO, SÓ USUÁRIOS PRO ACESSAM 👇
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 px-4 md:px-0">
      
      {/* HEADER */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-500 text-[9px] font-mono font-bold uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-500 rounded-full animate-pulse"></span>
          ORÁCULO LIVE HFT
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
          <Eye size={32} className="text-indigo-600 dark:text-indigo-500"/> Oráculo Live <span className="text-slate-300 dark:text-slate-700 text-lg">///</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Arraste os controles para precificar Linhas Asiáticas e Valor Esperado (EV+).</p>
      </div>

      {/* DASHBOARD HUD: RESULTADOS PREDITIVOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* CARD GOLS */}
        <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl flex flex-col h-full relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
           <h3 className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3"><Goal size={14}/> Mercado de Gols</h3>
           
           <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                 <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-1">Linha +0.5 Gols</p>
                 <div className="flex items-end gap-2">
                    <AnimatedNumber value={(goalStats.p05 * 100).toFixed(1)} suffix="%" className="text-2xl font-black text-slate-900 dark:text-white" />
                    <AnimatedNumber value={goalStats.odd05.toFixed(2)} prefix="@" className="text-sm font-mono font-bold text-orange-600 dark:text-orange-400 mb-1" />
                 </div>
              </div>
              <div>
                 <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-1">Linha +1.5 Gols</p>
                 <div className="flex items-end gap-2">
                    <AnimatedNumber value={(goalStats.p15 * 100).toFixed(1)} suffix="%" className="text-2xl font-black text-slate-900 dark:text-white" />
                    <AnimatedNumber value={goalStats.odd15.toFixed(2)} prefix="@" className="text-sm font-mono font-bold text-orange-600 dark:text-orange-400 mb-1" />
                 </div>
              </div>
           </div>

           {/* VEREDITO GOLS E PROJEÇÃO TOTAL */}
           <div className={`mt-auto border rounded-xl p-3 flex flex-col gap-1 shadow-sm dark:shadow-none ${goalStats.rec.bg}`}>
               <div className="flex justify-between items-center mb-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
                   <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Projeção Total de Gols ({targetHalf}):</span>
                   <AnimatedNumber value={goalStats.expTotal.toFixed(2)} className="text-sm font-black text-orange-600 dark:text-orange-400" />
               </div>
               <div className="flex justify-between items-center mt-1">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Veredito do Motor:</span>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${goalStats.rec.color}`}>{goalStats.rec.conf} CONFIANÇA</span>
               </div>
               {goalStats.rec.status === 'APROVADO' ? (
                   <p className="text-xs text-emerald-800 dark:text-emerald-100/70 font-medium flex items-center gap-1.5 mt-1"><CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0"/> <span><strong>RECOMENDADO:</strong> Aposte se a odd for maior que <strong className="text-slate-900 bg-white border border-slate-200 dark:text-white dark:bg-slate-900 dark:border-transparent px-1.5 rounded">@{goalStats.odd05.toFixed(2)}</strong>.</span></p>
               ) : goalStats.rec.status === 'MODERADO' ? (
                   <p className="text-xs text-amber-800 dark:text-amber-100/70 font-medium flex items-center gap-1.5 mt-1"><AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0"/> <span><strong>ATENÇÃO:</strong> Aposte se a odd for maior que <strong className="text-slate-900 bg-white border border-slate-200 dark:text-white dark:bg-slate-900 dark:border-transparent px-1.5 rounded">@{goalStats.odd05.toFixed(2)}</strong>.</span></p>
               ) : goalStats.rec.status === 'FECHADO' ? (
                   <p className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-1"><ShieldAlert size={14} className="text-slate-500 shrink-0"/> <span>Mercado encerrado ou fora da janela.</span></p>
               ) : (
                   <p className="text-xs text-red-800 dark:text-red-100/70 font-medium flex items-center gap-1.5 mt-1"><ShieldAlert size={14} className="text-red-600 dark:text-red-400 shrink-0"/> <span><strong>NÃO RECOMENDADO:</strong> Fique de fora. Risco altíssimo.</span></p>
               )}
           </div>
        </div>

        {/* CARD CANTOS (ASIÁTICOS) */}
        <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl flex flex-col h-full relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
           <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3"><Flag size={14}/> Escanteios Asiáticos</h3>
           
           <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                 <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-1">Linha Limpa (+0.5)</p>
                 <div className="flex items-end gap-2">
                    <AnimatedNumber value={(cornerStats.p05 * 100).toFixed(1)} suffix="%" className="text-2xl font-black text-slate-900 dark:text-white" />
                    <AnimatedNumber value={cornerStats.odd05.toFixed(2)} prefix="@" className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-1" />
                 </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 shadow-inner">
                 <p className="text-emerald-700 dark:text-emerald-500/80 text-[9px] uppercase font-bold tracking-widest mb-1">Linha Asiática (+1.0)</p>
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">Prob Green:</span>
                    <AnimatedNumber value={(cornerStats.p10Win * 100).toFixed(1)} suffix="%" className="text-xs font-black text-emerald-600 dark:text-emerald-400" />
                 </div>
                 <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1 mb-1">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">Reembolso:</span>
                    <AnimatedNumber value={(cornerStats.p10Void * 100).toFixed(1)} suffix="%" className="text-[10px] font-bold text-slate-600 dark:text-slate-300" />
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-600 dark:text-slate-500 font-bold uppercase">Odd Justa:</span>
                    <AnimatedNumber value={cornerStats.odd10.toFixed(2)} prefix="@" className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400" />
                 </div>
              </div>
           </div>

           {/* VEREDITO CANTOS E PROJEÇÃO TOTAL */}
           <div className={`mt-auto border rounded-xl p-3 flex flex-col gap-1 shadow-sm dark:shadow-none ${cornerStats.rec.bg}`}>
               <div className="flex justify-between items-center mb-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
                   <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Projeção Total de Cantos ({targetHalf}):</span>
                   <AnimatedNumber value={cornerStats.expTotal.toFixed(2)} className="text-sm font-black text-emerald-600 dark:text-emerald-400" />
               </div>
               <div className="flex justify-between items-center mt-1">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Veredito Asiático (+1.0):</span>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${cornerStats.rec.color}`}>{cornerStats.rec.conf} CONFIANÇA</span>
               </div>
               {cornerStats.rec.status === 'APROVADO' ? (
                   <p className="text-xs text-emerald-800 dark:text-emerald-100/70 font-medium flex items-center gap-1.5 mt-1"><CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0"/> <span><strong>RECOMENDADO:</strong> Entre se a odd for maior que <strong className="text-slate-900 bg-white border border-slate-200 dark:text-white dark:bg-slate-900 dark:border-transparent px-1.5 rounded">@{cornerStats.odd10.toFixed(2)}</strong>.</span></p>
               ) : cornerStats.rec.status === 'MODERADO' ? (
                   <p className="text-xs text-amber-800 dark:text-amber-100/70 font-medium flex items-center gap-1.5 mt-1"><AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0"/> <span><strong>ATENÇÃO:</strong> Entre se a casa oferecer <strong className="text-slate-900 bg-white border border-slate-200 dark:text-white dark:bg-slate-900 dark:border-transparent px-1.5 rounded">@{cornerStats.odd10.toFixed(2)}</strong> ou mais.</span></p>
               ) : cornerStats.rec.status === 'FECHADO' ? (
                   <p className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-1"><ShieldAlert size={14} className="text-slate-500 shrink-0"/> <span>Mercado encerrado ou fora da janela.</span></p>
               ) : (
                   <p className="text-xs text-red-800 dark:text-red-100/70 font-medium flex items-center gap-1.5 mt-1"><ShieldAlert size={14} className="text-red-600 dark:text-red-400 shrink-0"/> <span><strong>NÃO RECOMENDADO:</strong> Valor EV negativo. Risco alto de Red.</span></p>
               )}
           </div>
        </div>

      </div>

      {/* SCRIPT DO JOGO */}
      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-4 rounded-2xl flex items-center gap-3 shadow-sm dark:shadow-inner">
         <BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
         <p className="text-xs sm:text-sm text-indigo-800 dark:text-indigo-300 font-black tracking-wide uppercase">{gameScript}</p>
      </div>

      {/* ========================================== */}
      {/* PAINEL DE SLIDERS CONTROLS               */}
      {/* ========================================== */}
      <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-8 relative shadow-sm dark:shadow-xl">
         
         {/* 🔥 BOTÕES DE PRESET (QUICK LOAD) 🔥 */}
         <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
             <span className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Simular Cenários Rápidos:</span>
             <button onClick={() => applyPreset('blitz_casa')} className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5">Blitz Mandante</button>
             <button onClick={() => applyPreset('blitz_fora')} className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5">Blitz Visitante</button>
             <button onClick={() => applyPreset('equilibrado')} className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5">Equilibrado</button>
         </div>

         <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="w-full sm:w-1/2">
               <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> Minuto Atual</label>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black text-xl">{minute}'</span>
               </div>
               <input type="range" min="1" max={targetHalf === 'HT' ? 45 : 99} value={minute} onChange={(e) => setMinute(Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500 hover:h-3 transition-all" />
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-64 shrink-0 shadow-inner">
               <button onClick={() => handleHalfToggle('HT')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${targetHalf === 'HT' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>HT (1º Tempo)</button>
               <button onClick={() => handleHalfToggle('FT')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${targetHalf === 'FT' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>FT (Fim de Jogo)</button>
            </div>
         </div>

         {/* COLUNAS CASA x VISITANTE */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            
            {/* LADO CASA */}
            <div className="space-y-2">
               <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                   Time da Casa 
                   <div className="flex gap-4">
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-mono">{scoreH} G</span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">{cornersH} C</span>
                   </div>
               </h4>
               <SliderGroup label="Gols do Casa" value={scoreH} max={10} setter={setScoreH} colorClass="text-amber-600 dark:text-amber-400" />
               <SliderGroup label="Escanteios do Casa" value={cornersH} max={25} setter={setCornersH} colorClass="text-emerald-600 dark:text-emerald-400" />
               <div className="border-t border-slate-100 dark:border-slate-800/50 my-2 pt-2"></div>
               <SliderGroup label="Ataques Perigosos" value={apH} max={150} setter={setApH} colorClass="text-indigo-600 dark:text-indigo-400" />
               <SliderGroup label="Chutes no Alvo" value={sotH} max={20} setter={setSotH} colorClass="text-sky-600 dark:text-sky-400" />
            </div>

            {/* LADO VISITANTE */}
            <div className="space-y-2">
               <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                   Time Visitante
                   <div className="flex gap-4">
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-mono">{scoreA} G</span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">{cornersA} C</span>
                   </div>
               </h4>
               <SliderGroup label="Gols do Visitante" value={scoreA} max={10} setter={setScoreA} colorClass="text-amber-600 dark:text-amber-400" />
               <SliderGroup label="Escanteios do Visitante" value={cornersA} max={25} setter={setCornersA} colorClass="text-emerald-600 dark:text-emerald-400" />
               <div className="border-t border-slate-100 dark:border-slate-800/50 my-2 pt-2"></div>
               <SliderGroup label="Ataques Perigosos" value={apA} max={150} setter={setApA} colorClass="text-indigo-600 dark:text-indigo-400" />
               <SliderGroup label="Chutes no Alvo" value={sotA} max={20} setter={setSotA} colorClass="text-sky-600 dark:text-sky-400" />
            </div>

         </div>
      </div>
    </div>
  );
};

export default OraculoLive;