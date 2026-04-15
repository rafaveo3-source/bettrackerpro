import React, { useState, useMemo } from 'react';
import { Clock, Target, Flag, Goal, TrendingUp, ShieldAlert, BarChart3, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';

// Função auxiliar para calcular Poisson P(x=k)
const poisson = (lambda: number, k: number) => {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

const factorial = (n: number): number => {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
};

const LiveTerminal: React.FC = () => {
  // ==========================================
  // ESTADOS: SLIDERS DO USUÁRIO
  // ==========================================
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

  // ==========================================
  // MOTOR POISSON AVANÇADO (useMemo = ZERO LAG)
  // ==========================================
  const { goalStats, cornerStats, gameScript } = useMemo(() => {
    const extraTime = targetHalf === 'HT' ? 3 : 6; 
    const maxTime = (targetHalf === 'HT' ? 45 : 90) + extraTime;
    const timeLeft = Math.max(0, maxTime - minute);

    if (timeLeft <= 0) {
      return {
        goalStats: { p05: 0, odd05: 0, p15: 0, odd15: 0, expTotal: scoreH + scoreA, recommendation: 'FORA', conf: 'NULA' },
        cornerStats: { p05: 0, odd05: 0, p10Win: 0, p10Void: 0, odd10: 0, expTotal: cornersH + cornersA, recommendation: 'FORA', conf: 'NULA' },
        gameScript: "Mercado Fechado."
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

    // --- LÓGICA DE RECOMENDAÇÃO / CONFIANÇA ---
    const getRecommendation = (prob: number) => {
        if (prob >= 0.65) return { status: 'APROVADO', conf: 'ALTA', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
        if (prob >= 0.45) return { status: 'MODERADO', conf: 'MÉDIA', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
        return { status: 'RISCO / FORA', conf: 'BAIXA', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
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

  const SliderGroup = ({ label, value, max, setter, colorClass }: any) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5">
         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
         <span className={`font-mono font-black ${colorClass}`}>{value}</span>
      </div>
      <input 
        type="range" min="0" max={max} value={value} 
        onChange={(e) => setter(Number(e.target.value))} 
        className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all ${colorClass.replace('text-', 'accent-')}`} 
      />
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-indigo-500 text-[9px] font-mono font-bold uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
          ORÁCULO LIVE HFT
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
          <Eye size={32} className="text-indigo-500"/> Oráculo Live <span className="text-slate-700 text-lg">///</span>
        </h1>
        <p className="text-slate-400 text-sm">Arraste os controles sem travamentos para precificar Linhas Asiáticas e Valor Esperado (EV+).</p>
      </div>

      {/* DASHBOARD HUD: RESULTADOS PREDITIVOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* CARD GOLS */}
        <div className="bg-[#0b101e] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-full">
           <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-3"><Goal size={14}/> Mercado de Gols</h3>
           
           <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                 <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-1">Linha +0.5 Gols</p>
                 <div className="flex items-end gap-3">
                    <p className="text-2xl font-black text-white">{(goalStats.p05 * 100).toFixed(1)}%</p>
                    <p className="text-sm font-mono font-bold text-orange-400 mb-1">@{goalStats.odd05.toFixed(2)}</p>
                 </div>
              </div>
              <div>
                 <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-1">Linha +1.5 Gols</p>
                 <div className="flex items-end gap-3">
                    <p className="text-2xl font-black text-white">{(goalStats.p15 * 100).toFixed(1)}%</p>
                    <p className="text-sm font-mono font-bold text-orange-400 mb-1">@{goalStats.odd15.toFixed(2)}</p>
                 </div>
              </div>
           </div>

           {/* VEREDITO GOLS (CORRIGIDO) */}
           <div className={`mt-auto border rounded-xl p-3 flex flex-col gap-1 ${goalStats.rec.bg}`}>
               <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Veredito do Motor:</span>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${goalStats.rec.color}`}>{goalStats.rec.conf} CONFIANÇA</span>
               </div>
               {goalStats.rec.status === 'APROVADO' ? (
                   <p className="text-xs text-emerald-100/70 font-medium flex items-center gap-1.5 mt-1"><CheckCircle2 size={14} className="text-emerald-400"/> <strong>RECOMENDADO:</strong> Aposte se a odd da casa for maior que <strong className="text-white bg-slate-900 px-1.5 rounded">@{goalStats.odd05.toFixed(2)}</strong>.</p>
               ) : goalStats.rec.status === 'MODERADO' ? (
                   <p className="text-xs text-amber-100/70 font-medium flex items-center gap-1.5 mt-1"><AlertTriangle size={14} className="text-amber-400"/> <strong>ATENÇÃO:</strong> Aposte apenas se tiver margem de segurança (Odd &gt; <strong className="text-white bg-slate-900 px-1.5 rounded">@{goalStats.odd05.toFixed(2)}</strong>).</p>
               ) : (
                   <p className="text-xs text-red-100/70 font-medium flex items-center gap-1.5 mt-1"><ShieldAlert size={14} className="text-red-400"/> <strong>NÃO RECOMENDADO:</strong> Fique de fora. O risco de red é altíssimo.</p>
               )}
           </div>
        </div>

        {/* CARD CANTOS (ASIÁTICOS) */}
        <div className="bg-[#0b101e] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-full">
           <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-3"><Flag size={14}/> Escanteios Asiáticos</h3>
           
           <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                 <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-1">Linha Limpa (+0.5)</p>
                 <div className="flex items-end gap-3">
                    <p className="text-2xl font-black text-white">{(cornerStats.p05 * 100).toFixed(1)}%</p>
                    <p className="text-sm font-mono font-bold text-emerald-400 mb-1">@{cornerStats.odd05.toFixed(2)}</p>
                 </div>
              </div>
              <div className="bg-slate-900/50 p-2 rounded-xl border border-emerald-500/20">
                 <p className="text-emerald-500/80 text-[9px] uppercase font-bold tracking-widest mb-1">Linha Asiática (+1.0)</p>
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-slate-400">Prob Green:</span>
                    <span className="text-xs font-black text-emerald-400">{(cornerStats.p10Win * 100).toFixed(1)}%</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1">
                    <span className="text-[9px] text-slate-400">Reembolso:</span>
                    <span className="text-[10px] font-bold text-slate-300">{(cornerStats.p10Void * 100).toFixed(1)}%</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Odd Justa:</span>
                    <span className="text-sm font-mono font-black text-emerald-400">@{cornerStats.odd10.toFixed(2)}</span>
                 </div>
              </div>
           </div>

           {/* VEREDITO CANTOS */}
           <div className={`mt-auto border rounded-xl p-3 flex flex-col gap-1 ${cornerStats.rec.bg}`}>
               <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Veredito Asiático (+1.0):</span>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${cornerStats.rec.color}`}>{cornerStats.rec.conf} CONFIANÇA</span>
               </div>
               {cornerStats.rec.status === 'APROVADO' ? (
                   <p className="text-xs text-emerald-100/70 font-medium flex items-center gap-1.5 mt-1"><CheckCircle2 size={14} className="text-emerald-400 shrink-0"/> <span><strong>RECOMENDADO:</strong> Entre na Linha Asiática se a odd for maior que <strong className="text-white bg-slate-900 px-1.5 rounded">@{cornerStats.odd10.toFixed(2)}</strong>.</span></p>
               ) : cornerStats.rec.status === 'MODERADO' ? (
                   <p className="text-xs text-amber-100/70 font-medium flex items-center gap-1.5 mt-1"><AlertTriangle size={14} className="text-amber-400 shrink-0"/> <span><strong>ATENÇÃO:</strong> Entre apenas se a casa oferecer <strong className="text-white bg-slate-900 px-1.5 rounded">@{cornerStats.odd10.toFixed(2)}</strong> ou superior.</span></p>
               ) : (
                   <p className="text-xs text-red-100/70 font-medium flex items-center gap-1.5 mt-1"><ShieldAlert size={14} className="text-red-400 shrink-0"/> <span><strong>NÃO RECOMENDADO:</strong> Valor EV negativo. Risco alto de Red. Fique de fora.</span></p>
               )}
           </div>
        </div>

      </div>

      {/* SCRIPT DO JOGO */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-3 shadow-inner">
         <BarChart3 size={20} className="text-indigo-400 shrink-0" />
         <p className="text-xs sm:text-sm text-indigo-300 font-black tracking-wide uppercase">{gameScript}</p>
      </div>

      {/* ========================================== */}
      {/* PAINEL DE SLIDERS CONTROLS               */}
      {/* ========================================== */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-3xl p-5 md:p-8 relative shadow-xl">
         
         <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 border-b border-slate-800 pb-6">
            <div className="w-full sm:w-1/2">
               <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> Minuto Atual</label>
                  <span className="text-indigo-400 font-mono font-black text-xl">{minute}'</span>
               </div>
               <input type="range" min="1" max={targetHalf === 'HT' ? 45 : 99} value={minute} onChange={(e) => setMinute(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-3 transition-all" />
            </div>

            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-64 shrink-0 shadow-inner">
               <button onClick={() => setTargetHalf('HT')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${targetHalf === 'HT' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-300'}`}>HT (1º Tempo)</button>
               <button onClick={() => setTargetHalf('FT')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${targetHalf === 'FT' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-300'}`}>FT (Fim de Jogo)</button>
            </div>
         </div>

         {/* COLUNAS CASA x VISITANTE */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            
            {/* LADO CASA */}
            <div className="space-y-2">
               <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center justify-between gap-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                   Time da Casa 
                   <div className="flex gap-4">
                      <span className="text-xs text-amber-400 font-mono">{scoreH} G</span>
                      <span className="text-xs text-emerald-400 font-mono">{cornersH} C</span>
                   </div>
               </h4>
               <SliderGroup label="Gols do Casa" value={scoreH} max={10} setter={setScoreH} colorClass="text-amber-400" />
               <SliderGroup label="Escanteios do Casa" value={cornersH} max={25} setter={setCornersH} colorClass="text-emerald-400" />
               <div className="border-t border-slate-800/50 my-2 pt-2"></div>
               <SliderGroup label="Ataques Perigosos" value={apH} max={150} setter={setApH} colorClass="text-indigo-400" />
               <SliderGroup label="Chutes no Alvo" value={sotH} max={20} setter={setSotH} colorClass="text-sky-400" />
            </div>

            {/* LADO VISITANTE */}
            <div className="space-y-2">
               <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center justify-between gap-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                   Time Visitante
                   <div className="flex gap-4">
                      <span className="text-xs text-amber-400 font-mono">{scoreA} G</span>
                      <span className="text-xs text-emerald-400 font-mono">{cornersA} C</span>
                   </div>
               </h4>
               <SliderGroup label="Gols do Visitante" value={scoreA} max={10} setter={setScoreA} colorClass="text-amber-400" />
               <SliderGroup label="Escanteios do Visitante" value={cornersA} max={25} setter={setCornersA} colorClass="text-emerald-400" />
               <div className="border-t border-slate-800/50 my-2 pt-2"></div>
               <SliderGroup label="Ataques Perigosos" value={apA} max={150} setter={setApA} colorClass="text-indigo-400" />
               <SliderGroup label="Chutes no Alvo" value={sotA} max={20} setter={setSotA} colorClass="text-sky-400" />
            </div>

         </div>
      </div>
    </div>
  );
};

export default LiveTerminal;