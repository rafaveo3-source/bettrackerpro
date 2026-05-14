import React, { useState, useMemo } from 'react';
import { Clock, Target, Flag, Goal, TrendingUp, ShieldAlert, BarChart3, Eye, CheckCircle2, AlertTriangle, Crown, ChevronRight, Calculator, Zap, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBetStore } from '../store/useBetStore';

// ==========================================
// FUNÇÕES AUXILIARES MATEMÁTICAS
// ==========================================
const factorial = (n: number): number => {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
};

const poisson = (lambda: number, k: number) => {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

// 🔥 COMPONENTE DE ANIMAÇÃO DE NÚMEROS 🔥
const AnimatedNumber = ({ value, prefix = "", suffix = "", className = "" }: { value: string | number, prefix?: string, suffix?: string, className?: string }) => (
    <AnimatePresence mode="popLayout">
        <motion.span
            key={value}
            initial={{ opacity: 0.5, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`inline-block font-mono ${className}`}
        >
            {prefix}{value}{suffix}
        </motion.span>
    </AnimatePresence>
);

// 🔥 COMPONENTE DE SLIDER APPLE PRO 🔥
interface SliderGroupProps {
  label: string;
  value: number;
  max: number;
  setter: (val: number) => void;
  colorClass: string;
}

const SliderGroup: React.FC<SliderGroupProps> = ({ label, value, max, setter, colorClass }) => (
  <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] p-4 rounded-xl shadow-sm min-w-0">
    <div className="flex justify-between items-center mb-3">
       <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest truncate mr-2">{label}</label>
       <span className={`text-lg font-bold font-mono ${colorClass}`}>{value}</span>
    </div>
    <input 
      type="range" min="0" max={max} value={value} 
      onChange={(e) => setter(Number(e.target.value))} 
      className={`w-full h-2 bg-slate-100 dark:bg-[#000000] rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500 transition-all`} 
    />
  </div>
);

const LiveTerminal: React.FC = () => {
  const { isPro } = useBetStore();
  const navigate = useNavigate();

  // 🔥 OVERLAY DE VITRINE PRO 🔥
  const ProBlurOverlay = ({ title, desc }: { title: string, desc: string }) => (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 dark:bg-[#000000]/60 backdrop-blur-md rounded-2xl">
          <div className="bg-white dark:bg-[#1C1C1E] border border-indigo-500/30 p-8 rounded-2xl max-w-md text-center shadow-xl flex flex-col items-center mx-4">
              <div className="bg-indigo-500/10 p-4 rounded-xl mb-4 text-indigo-600 dark:text-indigo-400">
                  <Crown size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2 uppercase">
                  {title} <span className="text-indigo-500">PRO</span>
              </h2>
              <p className="text-slate-500 dark:text-[#8E8E93] mb-6 text-sm leading-relaxed font-medium">
                  {desc}
              </p>
              <button onClick={() => navigate('/pro')} className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 font-bold py-4 px-8 rounded-xl transition-all shadow-sm text-xs tracking-widest uppercase">
                  Desbloquear Acesso
              </button>
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

  // Inputs do Usuário (Odds da Casa de Aposta)
  const [bookieOddGoal, setBookieOddGoal] = useState<string>('');
  const [bookieOddCorner, setBookieOddCorner] = useState<string>('');

  const applyPreset = (type: 'blitz_casa' | 'blitz_fora' | 'equilibrado') => {
      if (type === 'blitz_casa') {
          setMinute(75); setTargetHalf('FT'); setScoreH(0); setScoreA(1); setCornersH(6); setCornersA(1); setApH(85); setApA(20); setSotH(5); setSotA(1);
      } else if (type === 'blitz_fora') {
          setMinute(75); setTargetHalf('FT'); setScoreH(1); setScoreA(0); setCornersH(2); setCornersA(7); setApH(25); setApA(90); setSotH(2); setSotA(6);
      } else {
          setMinute(30); setTargetHalf('HT'); setScoreH(0); setScoreA(0); setCornersH(2); setCornersA(2); setApH(25); setApA(25); setSotH(1); setSotA(1);
      }
      setBookieOddGoal('');
      setBookieOddCorner('');
  };

  const handleHalfToggle = (half: 'HT' | 'FT') => {
      setTargetHalf(half);
      if (half === 'HT' && minute > 45) setMinute(45);
  };

  const { goalStats, cornerStats, gameScript, momentum } = useMemo(() => {
    const extraTime = targetHalf === 'HT' ? 3 : 6; 
    const maxTime = (targetHalf === 'HT' ? 45 : 90) + extraTime;
    const timeLeft = Math.max(0, maxTime - minute);

    const safeMin = Math.max(1, minute);
    const apRateH = apH / safeMin;
    const apRateA = apA / safeMin;
    const totalPPM = apRateH + apRateA; // Pressure Per Minute

    const closedRec = { status: 'FECHADO', conf: 'NULA', color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-[#1C1C1E] border-slate-200 dark:border-[#2C2C2E]' };

    if (timeLeft <= 0) {
      return {
        goalStats: { p05: 0, odd05: 0, p15: 0, odd15: 0, expTotal: scoreH + scoreA, rec: closedRec },
        cornerStats: { p05: 0, odd05: 0, p10Win: 0, p10Void: 0, odd10: 0, expTotal: cornersH + cornersA, rec: closedRec },
        gameScript: "FORA DA JANELA",
        momentum: { ppm: totalPPM, level: 'Baixo', color: 'text-slate-500' }
      };
    }

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

    const getRecommendation = (prob: number) => {
        if (prob >= 0.65) return { status: 'APROVADO', conf: 'ALTA', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' };
        if (prob >= 0.45) return { status: 'MODERADO', conf: 'MÉDIA', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30' };
        return { status: 'RISCO', conf: 'BAIXA', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' };
    };

    let script = "";
    if (Math.abs(scoreDiff) >= 3) script = "Jogo resolvido. Tendência de Over despenca.";
    else if (totalPPM < 0.8) script = "Jogo lento e sem padrão. Fique fora dos Overs.";
    else if (baseGoalH * stateModH > (baseGoalA * stateModA) * 2.5) script = "Blitz do Mandante: Pressão aguda. Cenário forte para gols.";
    else if (baseGoalA * stateModA > (baseGoalH * stateModH) * 2.5) script = "Blitz do Visitante: Domínio total. Excelente para linhas asiáticas.";
    else script = "Trocação Franca: Ambas as equipes criando perigo constante.";

    let momentumLvl = { ppm: totalPPM, level: 'Baixo', color: 'text-slate-500' };
    if (totalPPM >= 1.5) momentumLvl = { ppm: totalPPM, level: 'Esmagamento (Extremo)', color: 'text-emerald-500' };
    else if (totalPPM >= 1.0) momentumLvl = { ppm: totalPPM, level: 'Intenso', color: 'text-indigo-500' };
    else if (totalPPM >= 0.6) momentumLvl = { ppm: totalPPM, level: 'Moderado', color: 'text-amber-500' };

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
      gameScript: script,
      momentum: momentumLvl
    };
  }, [minute, scoreH, scoreA, cornersH, cornersA, apH, apA, sotH, sotA, targetHalf]);

  // Funções de Cálculo EV
  const calcEV = (prob: number, odd: number) => ((prob * odd) - 1) * 100;
  const calcKelly = (evRaw: number, odd: number) => {
      if (evRaw <= 0 || odd <= 1) return 0;
      return ((evRaw / (odd - 1)) / 4) * 100; // Kelly Seguro (1/4)
  };

  const userGoalOddNum = parseFloat(bookieOddGoal) || 0;
  const evGoal = userGoalOddNum > 1 ? calcEV(goalStats.p05, userGoalOddNum) : null;
  const kellyGoal = evGoal !== null && evGoal > 0 ? calcKelly(evGoal / 100, userGoalOddNum) : 0;

  const userCornerOddNum = parseFloat(bookieOddCorner) || 0;
  const evCorner = userCornerOddNum > 1 ? calcEV(cornerStats.p10Win, userCornerOddNum) : null;
  const kellyCorner = evCorner !== null && evCorner > 0 ? calcKelly(evCorner / 100, userCornerOddNum) : 0;

  const cardClass = "bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col";
  const inputClass = "w-full bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] text-slate-900 dark:text-white rounded-xl px-3 py-2.5 md:py-2 outline-none focus:border-indigo-500 transition-colors text-base md:text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-[#636366] min-w-0";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 md:px-8 pt-8 font-sans">
        
      {!isPro && <ProBlurOverlay title="Oráculo Live" desc="O Terminal Quantitativo cruza Pressão por Minuto, xG e Desvio Padrão para calcular Fair Lines e encontrar o +EV exato durante o jogo." />}
      
      <div className={!isPro ? 'pointer-events-none select-none blur-[4px] opacity-60' : ''}>
        {/* HEADER */}
        <div className="flex flex-col gap-2 mb-8 border-b border-slate-200 dark:border-[#2C2C2E] pb-6">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
            Live Quant Terminal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Oráculo Live
          </h1>
          <p className="text-slate-500 dark:text-[#8E8E93] text-sm font-medium mt-1">Calculadora de Valor Esperado (+EV) e Precificação de Linhas em Tempo Real.</p>
        </div>

        {/* HUD: COCKPIT DE RESULTADOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* CARD GOLS (EV+) */}
          <div className={cardClass}>
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-[#2C2C2E] pb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <Goal size={18} className="text-emerald-500"/> Precificação de Gols
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Alvo: +0.5 Gols</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-[#000000] p-4 rounded-xl border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
                  <p className="text-slate-500 dark:text-[#8E8E93] text-[9px] uppercase font-bold tracking-widest mb-1">Prob. Matemática</p>
                  <AnimatedNumber value={(goalStats.p05 * 100).toFixed(1)} suffix="%" className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight" />
                </div>
                <div className="bg-slate-50 dark:bg-[#000000] p-4 rounded-xl border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
                  <p className="text-slate-500 dark:text-[#8E8E93] text-[9px] uppercase font-bold tracking-widest mb-1">Odd Justa (Fair Line)</p>
                  <AnimatedNumber value={goalStats.odd05.toFixed(2)} prefix="@" className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 tracking-tight" />
                </div>
            </div>

            {/* CÁLCULO DE VALOR (EV+) */}
            <div className={`mt-auto border rounded-xl p-5 space-y-4 transition-colors ${evGoal !== null && evGoal > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : evGoal !== null && evGoal <= 0 ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' : 'bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#2C2C2E]'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="w-full sm:w-1/2">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-1.5 block">Odd na Casa de Aposta</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">@</span>
                            <input 
                                type="number" step="0.01" placeholder="Ex: 1.80"
                                value={bookieOddGoal} onChange={(e) => setBookieOddGoal(e.target.value)}
                                className={`${inputClass} pl-8`}
                            />
                        </div>
                    </div>
                    <div className="w-full sm:w-1/2 flex flex-col sm:items-end">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-1.5">Valor Esperado (+EV)</p>
                        {evGoal === null ? (
                            <span className="text-lg font-bold font-mono text-slate-400 dark:text-slate-600">--</span>
                        ) : (
                            <span className={`text-2xl font-bold font-mono tracking-tight ${evGoal > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500'}`}>
                                {evGoal > 0 ? '+' : ''}{evGoal.toFixed(2)}%
                            </span>
                        )}
                    </div>
                </div>

                {evGoal !== null && evGoal > 0 && (
                    <div className="border-t border-emerald-500/20 pt-4 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5"><Target size={12}/> Stake Sugerida (Kelly 1/4)</span>
                        <span className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm">{kellyGoal.toFixed(2)}%</span>
                    </div>
                )}
            </div>
          </div>

          {/* CARD CANTOS (EV+) */}
          <div className={cardClass}>
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-[#2C2C2E] pb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <Flag size={18} className="text-indigo-500"/> Escanteios Asiáticos
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Alvo: Asiático +1.0</span>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50 dark:bg-[#000000] p-4 rounded-xl border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
                  <p className="text-slate-500 dark:text-[#8E8E93] text-[9px] uppercase font-bold tracking-widest mb-1">Prob. Green Direto</p>
                  <AnimatedNumber value={(cornerStats.p10Win * 100).toFixed(1)} suffix="%" className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight" />
                </div>
                <div className="bg-slate-50 dark:bg-[#000000] p-4 rounded-xl border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
                  <p className="text-slate-500 dark:text-[#8E8E93] text-[9px] uppercase font-bold tracking-widest mb-1">Odd Justa (Fair Line)</p>
                  <AnimatedNumber value={cornerStats.odd10.toFixed(2)} prefix="@" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight" />
                </div>
            </div>

            {/* CÁLCULO DE VALOR (EV+) */}
            <div className={`mt-auto border rounded-xl p-5 space-y-4 transition-colors ${evCorner !== null && evCorner > 0 ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : evCorner !== null && evCorner <= 0 ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' : 'bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#2C2C2E]'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="w-full sm:w-1/2">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-1.5 block">Odd na Casa de Aposta</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">@</span>
                            <input 
                                type="number" step="0.01" placeholder="Ex: 1.80"
                                value={bookieOddCorner} onChange={(e) => setBookieOddCorner(e.target.value)}
                                className={`${inputClass} pl-8`}
                            />
                        </div>
                    </div>
                    <div className="w-full sm:w-1/2 flex flex-col sm:items-end">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-1.5">Valor Esperado (+EV)</p>
                        {evCorner === null ? (
                            <span className="text-lg font-bold font-mono text-slate-400 dark:text-slate-600">--</span>
                        ) : (
                            <span className={`text-2xl font-bold font-mono tracking-tight ${evCorner > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-500'}`}>
                                {evCorner > 0 ? '+' : ''}{evCorner.toFixed(2)}%
                            </span>
                        )}
                    </div>
                </div>

                {evCorner !== null && evCorner > 0 && (
                    <div className="border-t border-indigo-500/20 pt-4 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5"><Target size={12}/> Stake Sugerida (Kelly 1/4)</span>
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm">{kellyCorner.toFixed(2)}%</span>
                    </div>
                )}
            </div>
          </div>

        </div>

        {/* MOMENTUM & SCRIPT DO JOGO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className={`p-3 rounded-xl ${momentum.ppm >= 1.0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 'bg-slate-50 dark:bg-[#000000] text-slate-400'}`}>
                    <Activity size={20} />
                </div>
                <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-[#8E8E93] mb-0.5">Momentum (PPM)</p>
                    <p className={`font-bold font-mono ${momentum.color}`}>{momentum.ppm.toFixed(2)} <span className="font-sans text-xs ml-1 uppercase">({momentum.level})</span></p>
                </div>
            </div>
            <div className="md:col-span-2 bg-indigo-600 dark:bg-indigo-500 text-white p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                <BarChart3 size={24} className="shrink-0" />
                <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-200 mb-0.5">Game Script Identificado</p>
                    <p className="text-sm font-bold tracking-wide">{gameScript}</p>
                </div>
            </div>
        </div>

        {/* PAINEL DE CONTROLE DE ESTATÍSTICAS (THUMB ZONE) */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm">
          
          {/* TIME & HALF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-slate-100 dark:border-[#2C2C2E] pb-8">
              <div className="w-full">
                <div className="flex justify-between mb-3">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Minuto do Jogo</label>
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-2xl">{minute}'</span>
                </div>
                <input type="range" min="1" max={targetHalf === 'HT' ? 45 : 99} value={minute} onChange={(e) => setMinute(Number(e.target.value))} className="w-full h-2.5 bg-slate-200 dark:bg-[#2C2C2E] rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>

              <div className="flex bg-slate-100 dark:bg-[#000000] p-1.5 rounded-xl border border-slate-200 dark:border-[#2C2C2E] h-[52px]">
                <button onClick={() => handleHalfToggle('HT')} className={`flex-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${targetHalf === 'HT' ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-[#3A3A3C]' : 'text-slate-500 dark:text-[#8E8E93]'}`}>1º Tempo (HT)</button>
                <button onClick={() => handleHalfToggle('FT')} className={`flex-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${targetHalf === 'FT' ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-[#3A3A3C]' : 'text-slate-500 dark:text-[#8E8E93]'}`}>2º Tempo (FT)</button>
              </div>
          </div>

          {/* DADOS DOS TIMES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] border-l-4 border-indigo-500 pl-3 mb-2 flex items-center justify-between">
                    Mandante (Casa)
                    <button onClick={() => applyPreset('blitz_casa')} className="text-[8px] bg-slate-100 dark:bg-[#2C2C2E] text-slate-500 dark:text-[#8E8E93] px-2 py-1 rounded border border-slate-200 dark:border-[#3A3A3C]">Simular Blitz</button>
                </h4>
                <SliderGroup label="Gols Marcados" value={scoreH} max={10} setter={setScoreH} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Escanteios" value={cornersH} max={25} setter={setCornersH} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Ataques Perigosos" value={apH} max={150} setter={setApH} colorClass="text-indigo-600 dark:text-indigo-400" />
                <SliderGroup label="Chutes no Alvo" value={sotH} max={20} setter={setSotH} colorClass="text-emerald-600 dark:text-emerald-500" />
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] border-l-4 border-indigo-500 pl-3 mb-2 flex items-center justify-between">
                    Visitante (Fora)
                    <button onClick={() => applyPreset('blitz_fora')} className="text-[8px] bg-slate-100 dark:bg-[#2C2C2E] text-slate-500 dark:text-[#8E8E93] px-2 py-1 rounded border border-slate-200 dark:border-[#3A3A3C]">Simular Blitz</button>
                </h4>
                <SliderGroup label="Gols Marcados" value={scoreA} max={10} setter={setScoreA} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Escanteios" value={cornersA} max={25} setter={setCornersA} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Ataques Perigosos" value={apA} max={150} setter={setApA} colorClass="text-indigo-600 dark:text-indigo-400" />
                <SliderGroup label="Chutes no Alvo" value={sotA} max={20} setter={setSotA} colorClass="text-emerald-600 dark:text-emerald-500" />
              </div>
          </div>
          
          <div className="mt-8 flex justify-center">
              <button onClick={() => applyPreset('equilibrado')} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] px-6 py-2.5 rounded-lg shadow-sm">
                  Resetar (Jogo Equilibrado)
              </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LiveTerminal;