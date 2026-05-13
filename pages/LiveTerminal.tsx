import React, { useState, useMemo } from 'react';
import { Clock, Target, Flag, Goal, TrendingUp, ShieldAlert, BarChart3, Eye, CheckCircle2, AlertTriangle, Crown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBetStore } from '../store/useBetStore';

// ==========================================
// FUNÇÕES AUXILIARES MATEMÁTICOS
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
  <div className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] p-4 rounded-xl shadow-sm">
    <div className="flex justify-between items-center mb-3">
       <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest">{label}</label>
       <span className={`text-lg font-bold font-mono ${colorClass}`}>{value}</span>
    </div>
    <input 
      type="range" min="0" max={max} value={value} 
      onChange={(e) => setter(Number(e.target.value))} 
      className={`w-full h-1.5 bg-slate-200 dark:bg-[#2C2C2E] rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500`} 
    />
  </div>
);

const OraculoLive: React.FC = () => {
  const { isPro } = useBetStore();
  const navigate = useNavigate();

  // 🔥 OVERLAY DE VITRINE PRO 🔥
  const ProBlurOverlay = ({ title, desc }: { title: string, desc: string }) => (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 dark:bg-[#000000]/60 backdrop-blur-md rounded-2xl">
          <div className="bg-white dark:bg-[#1C1C1E] border border-indigo-500/30 p-8 rounded-2xl max-w-md text-center shadow-2xl flex flex-col items-center mx-4">
              <div className="bg-indigo-500/10 p-4 rounded-xl mb-4 text-indigo-600 dark:text-indigo-400">
                  <Crown size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2 uppercase">
                  {title} <span className="text-indigo-500">PRO</span>
              </h2>
              <p className="text-slate-500 dark:text-[#8E8E93] mb-6 text-sm leading-relaxed">
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

    const closedRec = { status: 'FECHADO', conf: 'NULA', color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-[#1C1C1E] border-slate-200 dark:border-[#2C2C2E]' };

    if (timeLeft <= 0) {
      return {
        goalStats: { p05: 0, odd05: 0, p15: 0, odd15: 0, expTotal: scoreH + scoreA, rec: closedRec },
        cornerStats: { p05: 0, odd05: 0, p10Win: 0, p10Void: 0, odd10: 0, expTotal: cornersH + cornersA, rec: closedRec },
        gameScript: "FORA DA JANELA"
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

    const getRecommendation = (prob: number) => {
        if (prob >= 0.65) return { status: 'APROVADO', conf: 'ALTA', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' };
        if (prob >= 0.45) return { status: 'MODERADO', conf: 'MÉDIA', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' };
        return { status: 'RISCO', conf: 'BAIXA', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' };
    };

    let script = "";
    if (Math.abs(scoreDiff) >= 3) script = "❄️ GAME KILL: Jogo resolvido. Tendência de Over despenca.";
    else if ((apRateH + apRateA) < 0.8) script = "💤 CEMITÉRIO: Jogo lento. Fique fora dos Overs.";
    else if (baseGoalH * stateModH > (baseGoalA * stateModA) * 2.5) script = "🔥 BLITZ MANDANTE: Desespero da casa elevou a projeção.";
    else if (baseGoalA * stateModA > (baseGoalH * stateModH) * 2.5) script = "🔥 BLITZ VISITANTE: Pressão absurda do visitante.";
    else script = "⚔️ LÁ E CÁ: Trocação franca com defesas abertas.";

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

  const cardClass = "bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm relative overflow-hidden";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-4 md:px-8 pt-8 font-sans">
        
      {!isPro && <ProBlurOverlay title="Oráculo Live" desc="Cálculo matricial de Odd Justa para Gols e Cantos Asiáticos em tempo real. Exclusivo PRO." />}
      
      <div className={!isPro ? 'pointer-events-none select-none blur-[4px] opacity-60' : ''}>
        {/* HEADER */}
        <div className="flex flex-col gap-2 mb-8 border-b border-slate-200 dark:border-[#2C2C2E] pb-6">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
            Quant-Live Module
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Eye size={32} className="text-indigo-600 dark:text-indigo-500"/> Oráculo Live
          </h1>
        </div>

        {/* DASHBOARD HUD: RESULTADOS PREDITIVOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          
          {/* CARD GOLS */}
          <div className={cardClass}>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-[#2C2C2E] pb-4"><Goal size={16} className="text-orange-500"/> Mercado de Gols</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-slate-500 dark:text-[#8E8E93] text-[10px] uppercase font-bold tracking-widest mb-2">Linha +0.5 Gols</p>
                  <div className="flex items-baseline gap-2">
                      <AnimatedNumber value={(goalStats.p05 * 100).toFixed(1)} suffix="%" className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter" />
                      <AnimatedNumber value={goalStats.odd05.toFixed(2)} prefix="@" className="text-sm font-bold text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-[#8E8E93] text-[10px] uppercase font-bold tracking-widest mb-2">Linha +1.5 Gols</p>
                  <div className="flex items-baseline gap-2">
                      <AnimatedNumber value={(goalStats.p15 * 100).toFixed(1)} suffix="%" className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter" />
                      <AnimatedNumber value={goalStats.odd15.toFixed(2)} prefix="@" className="text-sm font-bold text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
            </div>

            <div className={`mt-auto border rounded-xl p-4 space-y-3 ${goalStats.rec.bg}`}>
                <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Total Estimado Gols ({targetHalf}):</span>
                    <AnimatedNumber value={goalStats.expTotal.toFixed(2)} className="text-sm font-bold text-slate-900 dark:text-white" />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93]">Veredito IA:</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-current ${goalStats.rec.color}`}>{goalStats.rec.conf} Confiança</span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-[#E5E5EA] flex items-start gap-2">
                    <ChevronRight size={14} className="mt-0.5 shrink-0" />
                    <span>Aposte se a odd for maior que @{goalStats.odd05.toFixed(2)}</span>
                </p>
            </div>
          </div>

          {/* CARD CANTOS */}
          <div className={cardClass}>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-[#2C2C2E] pb-4"><Flag size={16} className="text-indigo-500"/> Escanteios Asiáticos</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-slate-500 dark:text-[#8E8E93] text-[10px] uppercase font-bold tracking-widest mb-2">L. Limpa (+0.5)</p>
                  <div className="flex items-baseline gap-2">
                      <AnimatedNumber value={(cornerStats.p05 * 100).toFixed(1)} suffix="%" className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter" />
                      <AnimatedNumber value={cornerStats.odd05.toFixed(2)} prefix="@" className="text-sm font-bold text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-[#000000] p-3 rounded-xl border border-slate-200 dark:border-[#3A3A3C]">
                  <p className="text-slate-500 dark:text-[#8E8E93] text-[9px] uppercase font-bold tracking-widest mb-2">Asiático (+1.0)</p>
                  <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Green:</span>
                      <AnimatedNumber value={(cornerStats.p10Win * 100).toFixed(1)} suffix="%" className="text-xs font-bold text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Odd Justa:</span>
                      <AnimatedNumber value={cornerStats.odd10.toFixed(2)} prefix="@" className="text-xs font-bold text-slate-900 dark:text-white" />
                  </div>
                </div>
            </div>

            <div className={`mt-auto border rounded-xl p-4 space-y-3 ${cornerStats.rec.bg}`}>
                <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Total Estimado Cantos ({targetHalf}):</span>
                    <AnimatedNumber value={cornerStats.expTotal.toFixed(2)} className="text-sm font-bold text-slate-900 dark:text-white" />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93]">Veredito IA:</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-current ${cornerStats.rec.color}`}>{cornerStats.rec.conf} Confiança</span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-[#E5E5EA] flex items-start gap-2">
                    <ChevronRight size={14} className="mt-0.5 shrink-0" />
                    <span>Aposte se a odd for maior que @{cornerStats.odd10.toFixed(2)}</span>
                </p>
            </div>
          </div>

        </div>

        {/* SCRIPT DO JOGO */}
        <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-500/20">
          <BarChart3 size={20} className="shrink-0" />
          <p className="text-xs sm:text-sm font-bold tracking-wide uppercase">{gameScript}</p>
        </div>

        {/* PAINEL DE CONTROLE */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm">
          
          {/* PRESETS */}
          <div className="flex flex-wrap gap-2 mb-8">
              <span className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#636366] mb-1">Cenários Rápidos:</span>
              {['blitz_casa', 'blitz_fora', 'equilibrado'].map((p) => (
                  <button key={p} onClick={() => applyPreset(p as any)} className="text-[10px] uppercase font-bold tracking-wider px-4 py-2 rounded-lg border border-slate-200 dark:border-[#3A3A3C] bg-white dark:bg-[#000000] text-slate-600 dark:text-[#8E8E93] hover:border-indigo-500 hover:text-indigo-600 transition-colors capitalize">
                      {p.replace('_', ' ')}
                  </button>
              ))}
          </div>

          {/* TIME & HALF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 border-b border-slate-100 dark:border-[#2C2C2E] pb-8">
              <div className="w-full">
                <div className="flex justify-between mb-3">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Minuto do Jogo</label>
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-2xl">{minute}'</span>
                </div>
                <input type="range" min="1" max={targetHalf === 'HT' ? 45 : 99} value={minute} onChange={(e) => setMinute(Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-[#2C2C2E] rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>

              <div className="flex bg-slate-100 dark:bg-[#000000] p-1 rounded-xl border border-slate-200 dark:border-[#2C2C2E] h-[52px]">
                <button onClick={() => handleHalfToggle('HT')} className={`flex-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${targetHalf === 'HT' ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#8E8E93]'}`}>1º Tempo (HT)</button>
                <button onClick={() => handleHalfToggle('FT')} className={`flex-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${targetHalf === 'FT' ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#8E8E93]'}`}>2º Tempo (FT)</button>
              </div>
          </div>

          {/* DADOS DOS TIMES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] border-l-4 border-indigo-500 pl-3 mb-4">Mandante (Casa)</h4>
                <SliderGroup label="Gols Marcados" value={scoreH} max={10} setter={setScoreH} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Escanteios" value={cornersH} max={25} setter={setCornersH} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Ataques Perigosos" value={apH} max={150} setter={setApH} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Chutes no Alvo" value={sotH} max={20} setter={setSotH} colorClass="text-slate-900 dark:text-white" />
              </div>

              <div className="space-y-6">
                <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] border-l-4 border-indigo-500 pl-3 mb-4">Visitante (Fora)</h4>
                <SliderGroup label="Gols Marcados" value={scoreA} max={10} setter={setScoreA} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup
  label="Escanteios"
  value={cornersA}
  max={25}
  setter={setCornersA}
  colorClass="text-slate-900 dark:text-white"
/>
                <SliderGroup label="Ataques Perigosos" value={apA} max={150} setter={setApA} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Chutes no Alvo" value={sotA} max={20} setter={setSotA} colorClass="text-slate-900 dark:text-white" />
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OraculoLive;