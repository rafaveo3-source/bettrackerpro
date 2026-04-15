import React, { useState, useEffect } from 'react';
import { Activity, Clock, Target, Flag, Goal, Calculator, TrendingUp, AlertTriangle, ShieldAlert, BarChart3, Eye } from 'lucide-react';

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

const OraculoLive: React.FC = () => {
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
  // RESULTADOS MATEMÁTICOS
  // ==========================================
  const [goalStats, setGoalStats] = useState({ p05: 0, odd05: 0, p15: 0, odd15: 0, expTotal: 0 });
  const [cornerStats, setCornerStats] = useState({ p05: 0, odd05: 0, p10Win: 0, p10Void: 0, odd10: 0, expTotal: 0 });
  const [gameScript, setGameScript] = useState<string>("");

  // ==========================================
  // MOTOR POISSON AVANÇADO + GAME STATE
  // ==========================================
  useEffect(() => {
    const extraTime = targetHalf === 'HT' ? 3 : 6; 
    const maxTime = (targetHalf === 'HT' ? 45 : 90) + extraTime;
    const timeLeft = Math.max(0, maxTime - minute);

    if (timeLeft <= 0) {
      setGoalStats({ p05: 0, odd05: 0, p15: 0, odd15: 0, expTotal: scoreH + scoreA });
      setCornerStats({ p05: 0, odd05: 0, p10Win: 0, p10Void: 0, odd10: 0, expTotal: cornersH + cornersA });
      setGameScript("Mercado Fechado.");
      return;
    }

    const safeMin = Math.max(1, minute);
    
    // Frequência Base por Minuto
    const apRateH = apH / safeMin;
    const apRateA = apA / safeMin;
    const sotRateH = sotH / safeMin;
    const sotRateA = sotA / safeMin;

    // Taxa Crua (Lambda por minuto)
    let baseGoalH = (apRateH * 0.015) + (sotRateH * 0.15);
    let baseGoalA = (apRateA * 0.015) + (sotRateA * 0.15);
    let baseCornerH = (apRateH * 0.12) + (sotRateH * 0.1);
    let baseCornerA = (apRateA * 0.12) + (sotRateA * 0.1);

    // 🔥 GAME STATE MODIFIER (O Placar afeta o desespero e o ritmo) 🔥
    const scoreDiff = scoreH - scoreA;
    let stateModH = 1.0;
    let stateModA = 1.0;

    if (Math.abs(scoreDiff) >= 3) {
      // GAME KILL (Goleada): O jogo morre, ninguém ataca com intensidade real
      stateModH = 0.6; stateModA = 0.6;
    } else if (scoreDiff < 0) {
      // Casa Perdendo: Casa ataca desesperadamente, Visitante recua
      stateModH = 1.35; stateModA = 0.8;
    } else if (scoreDiff > 0) {
      // Visitante Perdendo: Visitante ataca, Casa recua
      stateModH = 0.8; stateModA = 1.35;
    }

    // Aplica o modificador de tempo (Abafa)
    let timeMod = 1.0;
    if (targetHalf === 'FT' && minute > 75) timeMod = Math.exp((minute - 75) / 25);
    else if (targetHalf === 'HT' && minute > 38) timeMod = 1.2;

    // Lambda Final Projetado para o Tempo Restante
    const lambdaGoal = (baseGoalH * stateModH + baseGoalA * stateModA) * timeLeft * timeMod;
    const lambdaCorner = (baseCornerH * stateModH + baseCornerA * stateModA) * timeLeft * timeMod;

    // =====================================
    // CÁLCULO DE PROBABILIDADES (POISSON)
    // =====================================
    // GOLS: P(0), P(1)
    const pGoal0 = poisson(lambdaGoal, 0);
    const pGoal1 = poisson(lambdaGoal, 1);
    
    // +0.5 Gols (Sair pelo menos 1)
    const pGoal05 = 1 - pGoal0;
    // +1.5 Gols (Sair pelo menos 2)
    const pGoal15 = 1 - pGoal0 - pGoal1;

    // CANTOS: P(0), P(1)
    const pCorner0 = poisson(lambdaCorner, 0);
    const pCorner1 = poisson(lambdaCorner, 1);
    
    // +0.5 Cantos (Sair pelo menos 1)
    const pCorner05 = 1 - pCorner0;
    // +1.0 Canto Asiático (Reembolso com 1, Win com 2+)
    const pCorner10Void = pCorner1;
    const pCorner10Win = 1 - pCorner0 - pCorner1;

    // Tratamento de Odd Justa (Evitar Infinity)
    const calcOdd = (prob: number) => prob > 0.01 ? 1 / prob : 99.0;
    // Odd Justa Asiática: (1 - Prob. Void) / Prob. Win
    const oddAsiatica10 = pCorner10Win > 0.01 ? (1 - pCorner10Void) / pCorner10Win : 99.0;

    setGoalStats({
      p05: Math.min(0.99, Math.max(0.01, pGoal05)),
      odd05: Math.min(99, calcOdd(pGoal05)),
      p15: Math.min(0.99, Math.max(0.01, pGoal15)),
      odd15: Math.min(99, calcOdd(pGoal15)),
      expTotal: scoreH + scoreA + lambdaGoal
    });

    setCornerStats({
      p05: Math.min(0.99, Math.max(0.01, pCorner05)),
      odd05: Math.min(99, calcOdd(pCorner05)),
      p10Win: Math.min(0.99, Math.max(0.01, pCorner10Win)),
      p10Void: Math.min(0.99, Math.max(0.01, pCorner10Void)),
      odd10: Math.min(99, oddAsiatica10),
      expTotal: cornersH + cornersA + lambdaCorner
    });

    // Script Leitura Tática
    const totalApRate = apRateH + apRateA;
    if (Math.abs(scoreDiff) >= 3) setGameScript("❄️ GAME KILL: Jogo resolvido. A tendência de Over despenca drasticamente.");
    else if (totalApRate < 0.8) setGameScript("💤 CEMITÉRIO: Jogo lento. Fique fora dos Overs.");
    else if (baseGoalH * stateModH > (baseGoalA * stateModA) * 2.5) setGameScript(`🔥 BLITZ MANDANTE: O Desespero do time da casa elevou a projeção ao limite.`);
    else if (baseGoalA * stateModA > (baseGoalH * stateModH) * 2.5) setGameScript(`🔥 BLITZ VISITANTE: Pressão absurda do visitante. Valor alto em cantos.`);
    else setGameScript("⚔️ LÁ E CÁ: Trocação franca com defesas abertas.");

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
        className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${colorClass.replace('text-', 'accent-')}`} 
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
        <p className="text-slate-400 text-sm">Arraste os controles para simular o cenário e precificar Linhas Asiáticas.</p>
      </div>

      {/* DASHBOARD HUD: RESULTADOS PREDITIVOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* CARD GOLS */}
        <div className="bg-[#0b101e] border border-slate-800 rounded-3xl p-6 shadow-xl">
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
           
           <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gols Previstos (Total FT/HT):</span>
              <span className="text-lg font-black text-orange-400">{goalStats.expTotal.toFixed(2)}</span>
           </div>
        </div>

        {/* CARD CANTOS (ASIÁTICOS) */}
        <div className="bg-[#0b101e] border border-slate-800 rounded-3xl p-6 shadow-xl">
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
           
           <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cantos Previstos (Total FT/HT):</span>
              <span className="text-lg font-black text-emerald-400">{cornerStats.expTotal.toFixed(2)}</span>
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
               <input type="range" min="1" max={targetHalf === 'HT' ? 45 : 99} value={minute} onChange={(e) => setMinute(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
            </div>

            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-64 shrink-0 shadow-inner">
               <button onClick={() => setTargetHalf('HT')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${targetHalf === 'HT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>HT (1º Tempo)</button>
               <button onClick={() => setTargetHalf('FT')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${targetHalf === 'FT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>FT (Fim de Jogo)</button>
            </div>
         </div>

         {/* COLUNAS CASA x VISITANTE */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            
            {/* LADO CASA */}
            <div className="space-y-2">
               <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700">Time da Casa</h4>
               <SliderGroup label="Gols" value={scoreH} max={10} setter={setScoreH} colorClass="text-amber-400" />
               <SliderGroup label="Escanteios" value={cornersH} max={25} setter={setCornersH} colorClass="text-emerald-400" />
               <SliderGroup label="Ataques Perigosos" value={apH} max={150} setter={setApH} colorClass="text-indigo-400" />
               <SliderGroup label="Chutes no Alvo" value={sotH} max={20} setter={setSotH} colorClass="text-sky-400" />
            </div>

            {/* LADO VISITANTE */}
            <div className="space-y-2">
               <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700">Time Visitante</h4>
               <SliderGroup label="Gols" value={scoreA} max={10} setter={setScoreA} colorClass="text-amber-400" />
               <SliderGroup label="Escanteios" value={cornersA} max={25} setter={setCornersA} colorClass="text-emerald-400" />
               <SliderGroup label="Ataques Perigosos" value={apA} max={150} setter={setApA} colorClass="text-indigo-400" />
               <SliderGroup label="Chutes no Alvo" value={sotA} max={20} setter={setSotA} colorClass="text-sky-400" />
            </div>

         </div>
      </div>
    </div>
  );
};

export default OraculoLive;