import React, { useState, useEffect } from 'react';
import { Activity, Clock, Target, Flag, Goal, Calculator, TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react';

const LiveTerminal: React.FC = () => {
  // Estados dos Inputs do Usuário (Baseados na Bet365)
  const [minute, setMinute] = useState<number>(65);
  const [targetHalf, setTargetHalf] = useState<'HT' | 'FT'>('FT');
  const [ap, setAp] = useState<number>(70);
  const [sot, setSot] = useState<number>(4);
  const [scoreDiff, setScoreDiff] = useState<number>(1); // Diferença de gols no placar

  // Estados dos Resultados Matemáticos
  const [probGoal, setProbGoal] = useState<number>(0);
  const [oddGoal, setOddGoal] = useState<number>(0);
  const [probCorner, setProbCorner] = useState<number>(0);
  const [oddCorner, setOddCorner] = useState<number>(0);

  // O "Motor" matemático rodando em tempo real no frontend
  useEffect(() => {
    // 1. Definição do Tempo Restante (Com acréscimos)
    const maxTime = targetHalf === 'HT' ? 48 : 96;
    const timeLeft = Math.max(0, maxTime - minute);

    if (timeLeft <= 0) {
      setProbGoal(0); setOddGoal(0);
      setProbCorner(0); setOddCorner(0);
      return;
    }

    // 2. Cálculo de Eficiência e Pressão por Minuto
    const efficiency = (sot + 1) / (Math.max(1, ap) + 10);
    
    // Taxa base de eventos por minuto
    let goalRatePerMin = (ap / 100) * 0.025 * (0.6 + (efficiency * 3.5));
    let cornerRatePerMin = (ap / 100) * 0.15 * (0.6 + (efficiency * 1));

    // 3. Modificadores de Jogo (Late Game Chaos & Placar)
    let timeMultiplier = 1.0;
    if (minute > 75 && targetHalf === 'FT') {
        timeMultiplier = Math.min(1.6, Math.exp((minute - 75) / 20));
    } else if (minute > 38 && targetHalf === 'HT') {
        timeMultiplier = 1.3; // Mini-abafa de fim de 1º tempo
    }

    let scoreMultiplier = scoreDiff !== 0 ? 1.35 : 0.85; // Desespero de quem perde vs Jogo empatado

    // 4. Aplicação dos Modificadores
    goalRatePerMin *= (timeMultiplier * scoreMultiplier);
    cornerRatePerMin *= timeMultiplier;

    // 5. Cálculo do Valor Esperado (Lambda) para o tempo restante
    const lambdaGoals = goalRatePerMin * timeLeft;
    const lambdaCorners = cornerRatePerMin * timeLeft;

    // 6. Distribuição de Poisson: Chance de sair MAIS DE 0.5 (pelo menos 1)
    // Fórmula: P(X > 0) = 1 - e^(-lambda)
    const pGoal = 1 - Math.exp(-lambdaGoals);
    const pCorner = 1 - Math.exp(-lambdaCorners);

    // Ajuste de Limites de Sanidade (Clamps)
    const finalProbGoal = Math.max(0.01, Math.min(0.99, pGoal));
    const finalProbCorner = Math.max(0.01, Math.min(0.99, pCorner));

    setProbGoal(finalProbGoal * 100);
    setProbCorner(finalProbCorner * 100);
    setOddGoal(1 / finalProbGoal);
    setOddCorner(1 / finalProbCorner);

  }, [minute, ap, sot, scoreDiff, targetHalf]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
          MOTOR POISSON ATIVO
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
          <Calculator size={28} className="text-emerald-500"/> Terminal Live <span className="text-slate-700 text-lg">///</span>
        </h1>
        <p className="text-slate-400 text-sm">Insira os dados da Bet365 para descobrir a Odd Justa matemática.</p>
      </div>

      {/* DASHBOARD DE RESULTADOS (HUD) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD GOLS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-lg">
           <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
           <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             <Goal size={14}/> Próximo Gol (+0.5 Gols)
           </h3>
           <div className="flex items-end justify-between">
              <div>
                 <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Probabilidade Real</p>
                 <p className="text-4xl font-black text-white">{probGoal.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                 <p className="text-orange-500/80 text-[10px] uppercase font-bold tracking-widest mb-1">Odd Justa</p>
                 <p className="text-3xl font-mono font-black text-orange-400">@{oddGoal.toFixed(2)}</p>
              </div>
           </div>
           {/* BARRA DE PROGRESSO VISUAL */}
           <div className="w-full bg-slate-950 h-2 rounded-full mt-5 overflow-hidden">
               <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${probGoal}%` }}></div>
           </div>
        </div>

        {/* CARD CANTOS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-lg">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
           <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             <Flag size={14}/> Próximo Canto (+0.5 Cantos)
           </h3>
           <div className="flex items-end justify-between">
              <div>
                 <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Probabilidade Real</p>
                 <p className="text-4xl font-black text-white">{probCorner.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                 <p className="text-emerald-500/80 text-[10px] uppercase font-bold tracking-widest mb-1">Odd Justa</p>
                 <p className="text-3xl font-mono font-black text-emerald-400">@{oddCorner.toFixed(2)}</p>
              </div>
           </div>
           {/* BARRA DE PROGRESSO VISUAL */}
           <div className="w-full bg-slate-950 h-2 rounded-full mt-5 overflow-hidden">
               <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${probCorner}%` }}></div>
           </div>
        </div>
      </div>

      {/* PAINEL DE CONTROLES (INPUTS) */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-3xl p-6 md:p-8 mt-6">
         <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
             <Activity size={16} className="text-indigo-500" /> Estatísticas Ao Vivo (Bet365)
         </h4>

         <div className="space-y-8">
            {/* TOGGLE HT/FT */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="flex-1">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Alvo da Análise</p>
                   <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-full md:w-64">
                      <button onClick={() => setTargetHalf('HT')} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${targetHalf === 'HT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>HT (1º Tempo)</button>
                      <button onClick={() => setTargetHalf('FT')} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${targetHalf === 'FT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>FT (Fim de Jogo)</button>
                   </div>
               </div>

               <div className="flex-1">
                   <div className="flex justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> Minuto Atual</label>
                      <span className="text-indigo-400 font-mono font-bold">{minute}'</span>
                   </div>
                   <input type="range" min="1" max={targetHalf === 'HT' ? 45 : 90} value={minute} onChange={(e) => setMinute(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* SLIDER: Ataques Perigosos */}
                <div>
                   <div className="flex justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><TrendingUp size={12}/> Ataques Perigosos</label>
                      <span className="text-emerald-400 font-mono font-bold">{ap}</span>
                   </div>
                   <input type="range" min="0" max="150" value={ap} onChange={(e) => setAp(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                </div>

                {/* SLIDER: Chutes no Alvo */}
                <div>
                   <div className="flex justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Target size={12}/> Chutes no Alvo</label>
                      <span className="text-emerald-400 font-mono font-bold">{sot}</span>
                   </div>
                   <input type="range" min="0" max="25" value={sot} onChange={(e) => setSot(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                </div>

                {/* SLIDER: Placar */}
                <div>
                   <div className="flex justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><AlertTriangle size={12}/> Diferença de Gols</label>
                      <span className="text-amber-400 font-mono font-bold">{scoreDiff} {scoreDiff === 0 ? '(Empate)' : ''}</span>
                   </div>
                   <input type="range" min="0" max="5" value={scoreDiff} onChange={(e) => setScoreDiff(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                </div>
            </div>
         </div>
      </div>

      {/* DICA OPERACIONAL */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl flex gap-4">
          <ShieldAlert size={24} className="text-indigo-400 shrink-0" />
          <p className="text-xs text-indigo-200/80 leading-relaxed font-medium">
             <strong>Como usar:</strong> Olhe os gráficos da Bet365 e mova os controles acima. O Terminal calculará a <strong className="text-indigo-400">Odd Justa</strong>. Vá até o mercado da casa de aposta. Se a odd que a Bet365 está oferecendo for <strong>MAIOR</strong> que a Odd Justa calculada aqui, faça a aposta. Isso é EV+ matemático.
          </p>
      </div>

    </div>
  );
};

export default LiveTerminal;