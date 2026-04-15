import React, { useState, useEffect } from 'react';
import { Activity, Clock, Target, Flag, Goal, Calculator, TrendingUp, AlertTriangle, ShieldAlert, Crosshair, BarChart3, Eye } from 'lucide-react';

const OraculoLive: React.FC = () => {
  // ==========================================
  // ESTADOS: ESPELHAMENTO DA BET365
  // ==========================================
  const [minute, setMinute] = useState<number>(65);
  const [targetHalf, setTargetHalf] = useState<'HT' | 'FT'>('FT');

  // Placar & Cantos Atuais
  const [scoreH, setScoreH] = useState<number>(0);
  const [scoreA, setScoreA] = useState<number>(0);
  const [cornersH, setCornersH] = useState<number>(3);
  const [cornersA, setCornersA] = useState<number>(2);

  // xG (Opcional)
  const [xgH, setXgH] = useState<string>('');
  const [xgA, setXgA] = useState<string>('');

  // Ataques Perigosos
  const [apH, setApH] = useState<number>(45);
  const [apA, setApA] = useState<number>(30);

  // Posse de Bola (%)
  const [possH, setPossH] = useState<number>(60);
  const [possA, setPossA] = useState<number>(40);

  // Finalizações Totais / Chutes no Alvo (SOT)
  const [shotsH, setShotsH] = useState<number>(10);
  const [sotH, setSotH] = useState<number>(4);
  const [shotsA, setShotsA] = useState<number>(5);
  const [sotA, setSotA] = useState<number>(1);

  // ==========================================
  // RESULTADOS DO ORÁCULO
  // ==========================================
  const [probNextGoal, setProbNextGoal] = useState<number>(0);
  const [oddNextGoal, setOddNextGoal] = useState<number>(0);
  const [probNextCorner, setProbNextCorner] = useState<number>(0);
  const [oddNextCorner, setOddNextCorner] = useState<number>(0);
  
  const [expectedTotalGoals, setExpectedTotalGoals] = useState<number>(0);
  const [expectedTotalCorners, setExpectedTotalCorners] = useState<number>(0);
  const [gameScript, setGameScript] = useState<string>("Analisando cenário tático...");

  // ==========================================
  // MOTOR MATEMÁTICO (POISSON + REGRESSÃO XG)
  // ==========================================
  useEffect(() => {
    // 1. Tempo restante com acréscimos dinâmicos
    const extraTime = targetHalf === 'HT' ? 3 : 6; 
    const maxTime = (targetHalf === 'HT' ? 45 : 90) + extraTime;
    const timeLeft = Math.max(0, maxTime - minute);

    if (timeLeft <= 0) {
      setProbNextGoal(0); setOddNextGoal(0); setProbNextCorner(0); setOddNextCorner(0);
      setGameScript("Mercado Fechado: Jogo fora da janela útil de precificação.");
      return;
    }

    const safeMin = Math.max(1, minute);
    const xGHome = parseFloat(xgH) || 0;
    const xGAway = parseFloat(xgA) || 0;

    // 2. Cálculo de Frequência (Momentum por minuto)
    const apRateH = apH / safeMin;
    const apRateA = apA / safeMin;
    const shotRateH = shotsH / safeMin;
    const shotRateA = shotsA / safeMin;

    // Eficiência Ofensiva (Quantos chutes acertam o gol?)
    const effH = shotsH > 0 ? sotH / shotsH : 0;
    const effA = shotsA > 0 ? sotA / shotsA : 0;

    // 3. Taxa Base de GOLS (Lambda Goal / min)
    // Peso: AP (10%), Chutes no Alvo (40%), xG (50% se existir)
    let baseGoalRateH = (apRateH * 0.01) + ((sotH / safeMin) * 0.06);
    let baseGoalRateA = (apRateA * 0.01) + ((sotA / safeMin) * 0.06);

    if (xGHome > 0) baseGoalRateH = (baseGoalRateH * 0.5) + ((xGHome / safeMin) * 0.5);
    if (xGAway > 0) baseGoalRateA = (baseGoalRateA * 0.5) + ((xGAway / safeMin) * 0.5);

    // 4. Taxa Base de ESCANTEIOS (Lambda Corner / min)
    // Peso: AP (40%), Chutes Totais (40%), Posse (20%)
    let baseCornerRateH = (apRateH * 0.08) + (shotRateH * 0.15) + ((possH / 100) * 0.03);
    let baseCornerRateA = (apRateA * 0.08) + (shotRateA * 0.15) + ((possA / 100) * 0.03);

    // 5. Modificadores Táticos (Game State)
    let timeMod = 1.0;
    if (targetHalf === 'FT' && minute > 75) timeMod = Math.exp((minute - 75) / 30); // Abafa final
    if (targetHalf === 'HT' && minute > 38) timeMod = 1.2; 

    // Quem está perdendo ataca mais, quem está ganhando recua
    if (scoreH < scoreA) { baseGoalRateH *= 1.35; baseCornerRateH *= 1.4; baseGoalRateA *= 0.85; }
    else if (scoreA < scoreH) { baseGoalRateA *= 1.35; baseCornerRateA *= 1.4; baseGoalRateH *= 0.85; }

    // Aplica o tempo
    const lambdaGoalH = baseGoalRateH * timeMod;
    const lambdaGoalA = baseGoalRateA * timeMod;
    const lambdaCornerH = baseCornerRateH * timeMod;
    const lambdaCornerA = baseCornerRateA * timeMod;

    // 6. Projeção para o Tempo Restante
    const expGoalsRem = (lambdaGoalH + lambdaGoalA) * timeLeft;
    const expCornersRem = (lambdaCornerH + lambdaCornerA) * timeLeft;

    // Poisson: Chance de Sair Pelo Menos 1 Evento P(X >= 1) = 1 - e^(-lambda)
    const pGoal = 1 - Math.exp(-expGoalsRem);
    const pCorner = 1 - Math.exp(-expCornersRem);

    const finalPGoal = Math.max(0.01, Math.min(0.98, pGoal));
    const finalPCorner = Math.max(0.01, Math.min(0.98, pCorner));

    setProbNextGoal(finalPGoal * 100);
    setProbNextCorner(finalPCorner * 100);
    setOddNextGoal(1 / finalPGoal);
    setOddNextCorner(1 / finalPCorner);

    // 7. Projeção da Linha Final (Asiáticas)
    setExpectedTotalGoals(scoreH + scoreA + expGoalsRem);
    setExpectedTotalCorners(cornersH + cornersA + expCornersRem);

    // 8. Leitura do Oráculo (Script)
    const totalApRate = apRateH + apRateA;
    if (totalApRate < 0.8 && shotRateH + shotRateA < 0.2) setGameScript("❄️ CEMITÉRIO: Jogo completamente parado. Fique de fora de Overs.");
    else if (lambdaGoalH > lambdaGoalA * 2.5) setGameScript(`🔥 AMASSO MANDANTE: Casa massacrando. Foco em Gols/Cantos a favor do Mandante.`);
    else if (lambdaGoalA > lambdaGoalH * 2.5) setGameScript(`🔥 AMASSO VISITANTE: Visitante amassando. Foco em Gols/Cantos a favor do Visitante.`);
    else if (totalApRate >= 1.5) setGameScript("⚔️ LÁ E CÁ (TROCAÇÃO): Excelente para Overs de Cantos e Gols. Defesas abertas.");
    else setGameScript("⚖️ EQUILIBRADO: Jogo estudado. Procure assimetrias pontuais.");

  }, [minute, scoreH, scoreA, cornersH, cornersA, apH, apA, shotsH, sotH, shotsA, sotA, xgH, xgA, possH, possA, targetHalf]);

  // Sincronizar posse de bola
  const handlePossession = (team: 'H' | 'A', val: number) => {
      let v = Math.max(0, Math.min(100, val));
      if (team === 'H') { setPossH(v); setPossA(100 - v); }
      else { setPossA(v); setPossH(100 - v); }
  };

  const inputClass = "w-full bg-[#020617] border border-slate-700/50 text-slate-200 text-center font-mono font-bold text-lg py-2 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700";
  const labelClass = "text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1";

  // Função para formatar a sugestão de linha Asiática (ex: 2.8 vira 2.5)
  const getLineSuggestion = (expectedValue: number, currentTotal: number) => {
      if (expectedValue - currentTotal < 0.3) return "N/A";
      const suggestedLine = Math.floor(expectedValue * 2) / 2; // Arredonda para 0.5 mais próximo
      return `Over ${Math.max(currentTotal + 0.5, suggestedLine)}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-indigo-500 text-[9px] font-mono font-bold uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
          SISTEMA PREDITIVO HFT
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
          <Eye size={32} className="text-indigo-500"/> Oráculo Live <span className="text-slate-700 text-lg">///</span>
        </h1>
        <p className="text-slate-400 text-sm">Copie os dados exatamente como aparecem na Bet365 e veja o futuro do jogo.</p>
      </div>

      {/* DASHBOARD HUD: 4 CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD: PRÓXIMO GOL */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden shadow-lg group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
           <h3 className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Goal size={12}/> Próx. Gol (+0.5)</h3>
           <div className="flex flex-col gap-1 relative z-10">
              <p className="text-3xl font-black text-white">{probNextGoal.toFixed(1)}%</p>
              <p className="text-sm font-mono font-bold text-orange-400">Justa: @{oddNextGoal.toFixed(2)}</p>
           </div>
        </div>

        {/* CARD: PRÓXIMO CANTO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden shadow-lg group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
           <h3 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Flag size={12}/> Próx. Canto (+0.5)</h3>
           <div className="flex flex-col gap-1 relative z-10">
              <p className="text-3xl font-black text-white">{probNextCorner.toFixed(1)}%</p>
              <p className="text-sm font-mono font-bold text-emerald-400">Justa: @{oddNextCorner.toFixed(2)}</p>
           </div>
        </div>

        {/* CARD: LINHA ASIÁTICA GOLS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden shadow-lg flex flex-col justify-center">
           <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><TrendingUp size={12}/> Projeção (Gols)</h3>
           <p className="text-2xl font-black text-white mb-1">{expectedTotalGoals.toFixed(2)}</p>
           <p className="text-[10px] font-bold text-slate-500 uppercase">Linha Sugerida: <span className="text-orange-400">{getLineSuggestion(expectedTotalGoals, scoreH + scoreA)}</span></p>
        </div>

        {/* CARD: LINHA ASIÁTICA CANTOS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden shadow-lg flex flex-col justify-center">
           <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><TrendingUp size={12}/> Projeção (Cantos)</h3>
           <p className="text-2xl font-black text-white mb-1">{expectedTotalCorners.toFixed(2)}</p>
           <p className="text-[10px] font-bold text-slate-500 uppercase">Linha Sugerida: <span className="text-emerald-400">{getLineSuggestion(expectedTotalCorners, cornersH + cornersA)}</span></p>
        </div>

      </div>

      {/* SCRIPT DO JOGO */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-3 shadow-inner">
         <BarChart3 size={20} className="text-indigo-400 shrink-0" />
         <p className="text-xs sm:text-sm text-indigo-300 font-black tracking-wide uppercase">{gameScript}</p>
      </div>

      {/* ========================================== */}
      {/* PAINEL DE INPUTS: ESPELHO DA BET365 */}
      {/* ========================================== */}
      <div className="bg-[#0b101e] border border-slate-800 rounded-3xl p-5 md:p-8 relative shadow-xl">
         
         {/* CABEÇALHO DO PAINEL */}
         <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4 w-full sm:w-auto">
               <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 w-full sm:w-auto flex items-center justify-between gap-4 shadow-inner">
                  <Clock size={16} className="text-slate-400"/>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Minuto:</span>
                     <input type="number" min="1" max="99" value={minute} onChange={(e) => setMinute(Number(e.target.value))} className="w-12 bg-transparent text-white font-mono font-black text-lg outline-none text-center border-b border-dashed border-slate-600 focus:border-indigo-500" />
                  </div>
               </div>
            </div>

            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-64 shrink-0 shadow-inner">
               <button onClick={() => setTargetHalf('HT')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${targetHalf === 'HT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>HT (1º Tempo)</button>
               <button onClick={() => setTargetHalf('FT')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${targetHalf === 'FT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>FT (Fim de Jogo)</button>
            </div>
         </div>

         {/* GRID DE DADOS (VISUAL BET365) */}
         <div className="space-y-6">
            
            {/* CABEÇALHO DAS COLUNAS */}
            <div className="grid grid-cols-3 items-end mb-2">
               <div className="text-center"><p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Time Casa</p></div>
               <div className="text-center"></div>
               <div className="text-center"><p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Visitante</p></div>
            </div>

            {/* PLACAR E ESCANTEIOS (TOPO) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 shadow-inner">
               <div className="flex gap-2">
                  <div className="w-full"><p className={labelClass}>Gols</p><input type="number" value={scoreH} onChange={e => setScoreH(Number(e.target.value))} className={`${inputClass} text-amber-400`} /></div>
                  <div className="w-full"><p className={labelClass}>Cantos</p><input type="number" value={cornersH} onChange={e => setCornersH(Number(e.target.value))} className={`${inputClass} text-emerald-400`} /></div>
               </div>
               <div className="text-center"><p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Resultado Atual</p></div>
               <div className="flex gap-2">
                  <div className="w-full"><p className={labelClass}>Cantos</p><input type="number" value={cornersA} onChange={e => setCornersA(Number(e.target.value))} className={`${inputClass} text-emerald-400`} /></div>
                  <div className="w-full"><p className={labelClass}>Gols</p><input type="number" value={scoreA} onChange={e => setScoreA(Number(e.target.value))} className={`${inputClass} text-amber-400`} /></div>
               </div>
            </div>

            {/* xG (OPCIONAL) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
               <input type="text" placeholder="0.00" value={xgH} onChange={e => setXgH(e.target.value)} className={inputClass} />
               <div className="text-center"><p className="text-[10px] uppercase font-black tracking-widest text-slate-400">xG</p><p className="text-[8px] text-slate-600 uppercase font-bold">(Opcional)</p></div>
               <input type="text" placeholder="0.00" value={xgA} onChange={e => setXgA(e.target.value)} className={inputClass} />
            </div>

            {/* ATAQUES PERIGOSOS */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center bg-slate-900/40 p-3 rounded-2xl border border-slate-800/50">
               <input type="number" value={apH} onChange={e => setApH(Number(e.target.value))} className={inputClass} />
               <div className="text-center"><p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Ataques Perigosos</p></div>
               <input type="number" value={apA} onChange={e => setApA(Number(e.target.value))} className={inputClass} />
            </div>

            {/* POSSE DE BOLA */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
               <div className="relative">
                  <input type="number" value={possH} onChange={e => handlePossession('H', Number(e.target.value))} className={`${inputClass} pl-6`} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">%</span>
               </div>
               <div className="text-center"><p className="text-[10px] uppercase font-black tracking-widest text-slate-400">% de Posse</p></div>
               <div className="relative">
                  <input type="number" value={possA} onChange={e => handlePossession('A', Number(e.target.value))} className={`${inputClass} pl-6`} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">%</span>
               </div>
            </div>

            {/* FINALIZAÇÕES E CHUTES NO ALVO */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 shadow-inner">
               <div className="flex gap-2">
                  <div className="w-full"><p className={labelClass}>Totais</p><input type="number" value={shotsH} onChange={e => setShotsH(Number(e.target.value))} className={inputClass} /></div>
                  <div className="w-full"><p className={labelClass}>No Alvo</p><input type="number" value={sotH} onChange={e => setSotH(Number(e.target.value))} className={`${inputClass} text-sky-400`} /></div>
               </div>
               <div className="text-center"><p className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-slate-400">Finalizações<br/>(Totais / Alvo)</p></div>
               <div className="flex gap-2">
                  <div className="w-full"><p className={labelClass}>No Alvo</p><input type="number" value={sotA} onChange={e => setSotA(Number(e.target.value))} className={`${inputClass} text-sky-400`} /></div>
                  <div className="w-full"><p className={labelClass}>Totais</p><input type="number" value={shotsA} onChange={e => setShotsA(Number(e.target.value))} className={inputClass} /></div>
               </div>
            </div>

         </div>
      </div>
      
      {/* ALERTA DE RISCO */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex gap-4 mt-6">
          <ShieldAlert size={24} className="text-slate-500 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
             <strong>Aviso Quantitativo:</strong> O Oráculo Live não garante o green, ele garante a detecção de <strong>Valor Esperado (EV+)</strong>. Se a odd justa calculada pelo sistema for <strong className="text-emerald-400">@1.50</strong>, mas a casa estiver pagando <strong className="text-emerald-400">@1.80</strong>, entre. No longo prazo, a matemática sempre vence a casa de apostas.
          </p>
      </div>

    </div>
  );
};

export default OraculoLive;