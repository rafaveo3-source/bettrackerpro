import React, { useState, useMemo, useDeferredValue } from 'react';
import { 
    Clock, Target, Flag, TrendingUp, ShieldAlert, BarChart3, Eye, 
    CheckCircle2, AlertTriangle, Crown, ChevronRight, Zap, 
    ShieldCheck, Goal, Layers, RectangleHorizontal, Info,
    Crosshair, Flame, Ban, BrainCircuit, Activity, Save, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBetStore, supabase } from '../store/useBetStore';

// ==========================================
// MATEMÁTICA QUANTITATIVA CORE
// ==========================================
const factorial = (n: number): number => {
  if (n === 0 || n === 1) return 1;
  let result = 1; for (let i = 2; i <= n; i++) result *= i;
  return result;
};

const poisson = (lambda: number, k: number) => {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

const poissonOver = (lambda: number, required: number) => {
    if (required <= 0) return 1;
    let cumulative = 0;
    for (let i = 0; i < required; i++) cumulative += poisson(lambda, i);
    return Math.max(0.01, Math.min(0.99, 1 - cumulative));
};

const calcFairOdd = (prob: number) => prob > 0.02 ? (1 / prob).toFixed(2) : '50.00';

const sigmoid = (x: number, k: number = 0.1, x0: number = 50) => {
    return 100 / (1 + Math.exp(-k * (x - x0)));
};

// ==========================================
// COMPONENTES UI (APPLE PRO THUMB ZONE)
// ==========================================
const AnimatedNumber = ({ value, prefix = "", suffix = "", className = "" }: { value: string | number, prefix?: string, suffix?: string, className?: string }) => (
    <AnimatePresence mode="popLayout">
        <motion.span key={value} initial={{ opacity: 0.5, y: -2 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`inline-block font-mono ${className}`}>
            {prefix}{value}{suffix}
        </motion.span>
    </AnimatePresence>
);

interface SliderGroupProps { label: string; value: number; max: number; setter: (val: number) => void; colorClass: string; }
const SliderGroup: React.FC<SliderGroupProps> = ({ label, value, max, setter, colorClass }) => (
  <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] p-3.5 sm:p-4 rounded-xl shadow-sm min-w-0">
    <div className="flex justify-between items-center mb-3">
       <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest truncate mr-2">{label}</label>
       <span className={`text-lg font-bold font-mono ${colorClass}`}>{value}</span>
    </div>
    <input 
      type="range" min="0" max={max} value={value} 
      onChange={(e) => setter(Number(e.target.value))} 
      className={`w-full h-2.5 bg-slate-200 dark:bg-[#000000] rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500 transition-all`} 
    />
  </div>
);

const ToggleSwitch = ({ label, state, setter, activeColor }: { label: string, state: boolean, setter: (val: boolean) => void, activeColor: string }) => (
    <button onClick={() => setter(!state)} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all min-w-[100px] ${state ? `${activeColor} shadow-sm scale-[1.02]` : 'bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#2C2C2E] text-slate-500 dark:text-[#8E8E93]'}`}>
        <span className="text-[10px] font-bold uppercase tracking-widest text-center leading-tight">{label}</span>
    </button>
);

const SensorButton = ({ label, active, onClick, color }: { label: string, active: boolean, onClick: () => void, color: string }) => (
    <button onClick={onClick} className={`flex-1 py-2.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${active ? `${color} shadow-sm border border-current` : 'bg-slate-50 dark:bg-[#000000] text-slate-500 dark:text-[#8E8E93] border border-slate-200 dark:border-[#2C2C2E]'}`}>
        {label}
    </button>
);

const LiveTerminal: React.FC = () => {
  const { session } = useBetStore();
  const navigate = useNavigate();
  const [isLogging, setIsLogging] = useState(false);

  // ==========================================
  // ESTADOS DO JOGO (INPUTS)
  // ==========================================
  const [minute, setMinute] = useState<number>(45);
  
  const [scoreH, setScoreH] = useState<number>(0);
  const [cornersH, setCornersH] = useState<number>(2);
  const [cardsH, setCardsH] = useState<number>(0);
  const [apH, setApH] = useState<number>(40);
  const [sotH, setSotH] = useState<number>(2);

  const [scoreA, setScoreA] = useState<number>(0);
  const [cornersA, setCornersA] = useState<number>(1);
  const [cardsA, setCardsA] = useState<number>(1);
  const [apA, setApA] = useState<number>(25);
  const [sotA, setSotA] = useState<number>(1);

  const [isFavLosing, setIsFavLosing] = useState(false);
  const [isKnockout, setIsKnockout] = useState(false);
  const [hasRedCard, setHasRedCard] = useState(false);
  const [recentEvent, setRecentEvent] = useState(false);
  
  const [gamePace, setGamePace] = useState<'slow' | 'normal' | 'chaotic'>('normal');
  const [gameDominance, setGameDominance] = useState<'home' | 'balanced' | 'away'>('balanced');

  const [oddGoal, setOddGoal] = useState<string>('');
  const [oddCorner, setOddCorner] = useState<string>('');

  const applyPreset = (type: 'sterile' | 'blitz' | 'dead') => {
      setMinute(65); setRecentEvent(false);
      if (type === 'sterile') {
          setScoreH(0); setScoreA(0); setCornersH(8); setCornersA(1); setCardsH(1); setCardsA(2); setApH(75); setApA(15); setSotH(1); setSotA(0); 
          setIsFavLosing(true); setGamePace('normal'); setGameDominance('home');
      } else if (type === 'blitz') {
          setScoreH(0); setScoreA(1); setCornersH(5); setCornersA(0); setCardsH(1); setCardsA(4); setApH(60); setApA(10); setSotH(6); setSotA(1); 
          setIsFavLosing(true); setGamePace('chaotic'); setGameDominance('home');
      } else {
          setScoreH(1); setScoreA(1); setCornersH(2); setCornersA(2); setCardsH(1); setCardsA(1); setApH(30); setApA(30); setSotH(2); setSotA(2); 
          setIsFavLosing(false); setGamePace('slow'); setGameDominance('balanced');
      }
      setOddGoal(''); setOddCorner('');
  };

  const deferredInput = useDeferredValue({ minute, scoreH, scoreA, cornersH, cornersA, cardsH, cardsA, apH, apA, sotH, sotA, isFavLosing, isKnockout, hasRedCard, recentEvent, gamePace, gameDominance, oddGoal, oddCorner });

  // ==========================================
  // O CÉREBRO PREDITIVO (INFERENTIAL ENGINE)
  // ==========================================
  const engine = useMemo(() => {
    const inputs = deferredInput;
    const maxTime = 96; 
    const timeLeft = Math.max(0, maxTime - inputs.minute);
    const playedTime = Math.max(1, inputs.minute);

    if (timeLeft <= 0) return { closed: true };

    // 0. DATA QUALITY CONTROL (Anomaly Detection)
    let isAnomaly = false;
    let anomalyReason = "";
    
    if (inputs.scoreH > inputs.sotH) { isAnomaly = true; anomalyReason = "Incoerência nos Dados: O time da Casa tem mais Gols marcados do que Chutes no Alvo."; }
    else if (inputs.scoreA > inputs.sotA) { isAnomaly = true; anomalyReason = "Incoerência nos Dados: O time Visitante tem mais Gols marcados do que Chutes no Alvo."; }
    else if (inputs.apH > 90 && inputs.sotH === 0 && inputs.cornersH === 0) { isAnomaly = true; anomalyReason = "Incoerência nos Dados: Pressão extrema da Casa (>90 AP) sem nenhum Chute ou Canto registrado."; }
    else if (inputs.apA > 90 && inputs.sotA === 0 && inputs.cornersA === 0) { isAnomaly = true; anomalyReason = "Incoerência nos Dados: Pressão extrema do Visitante (>90 AP) sem nenhum Chute ou Canto registrado."; }

    if (isAnomaly) {
        return { isAnomaly, anomalyReason, closed: false };
    }

    const apRateH = inputs.apH / playedTime;
    const apRateA = inputs.apA / playedTime;
    const sotRateH = inputs.sotH / playedTime;
    const sotRateA = inputs.sotA / playedTime;
    const totalPPM = apRateH + apRateA;

    // 1. SENSOR VALIDATION ENGINE (Avaliando viés humano)
    let validatedPace = 1.0;
    if (inputs.gamePace === 'chaotic') {
        if (totalPPM > 1.3) validatedPace = 1.25; 
        else if (totalPPM > 0.9) validatedPace = 1.1; 
        else validatedPace = 1.0; 
    } else if (inputs.gamePace === 'slow') {
        if (totalPPM < 0.8) validatedPace = 0.7;
        else if (totalPPM < 1.2) validatedPace = 0.9;
        else validatedPace = 1.0; 
    }

    let validatedDomH = 1.0; let validatedDomA = 1.0;
    if (inputs.gameDominance === 'home') {
        if (inputs.apH > inputs.apA * 1.5) { validatedDomH = 1.2; validatedDomA = 0.85; }
        else { validatedDomH = 1.05; validatedDomA = 0.95; }
    } else if (inputs.gameDominance === 'away') {
        if (inputs.apA > inputs.apH * 1.5) { validatedDomH = 0.85; validatedDomA = 1.2; }
        else { validatedDomH = 0.95; validatedDomA = 1.05; }
    }

    // 2. INFERÊNCIA DE QUALIDADE (Transição x Estéril)
    const effH = inputs.sotH / Math.max(1, inputs.apH);
    const effA = inputs.sotA / Math.max(1, inputs.apA);
    let qualModH = 1.0; let qualModA = 1.0;
    
    if (effH < 0.04 && inputs.apH > 35) qualModH = 0.5; 
    else if (effH > 0.15 && inputs.apH < 40) qualModH = 1.4; 
    
    if (effA < 0.04 && inputs.apA > 35) qualModA = 0.5;
    else if (effA > 0.15 && inputs.apA < 40) qualModA = 1.4;

    const xgProxyH = ((apRateH * 0.01) + (sotRateH * 0.15)) * qualModH;
    const xgProxyA = ((apRateA * 0.01) + (sotRateA * 0.15)) * qualModA;

    // 3. EVENT MEMORY & GAME STATE
    let eventVolatility = inputs.recentEvent ? 1.25 : 1.0;
    const scoreDiff = inputs.scoreH - inputs.scoreA;
    
    let mutH = 1.0; let mutA = 1.0;
    if (Math.abs(scoreDiff) >= 3) { mutH = 0.5; mutA = 0.5; }
    else if (scoreDiff < 0) { mutH = inputs.isFavLosing ? 1.4 : 1.2; mutA = 0.7; }
    else if (scoreDiff > 0) { mutH = 0.7; mutA = inputs.isFavLosing ? 1.4 : 1.2; }

    if (inputs.isKnockout && scoreDiff === 0 && inputs.minute > 65) {
        mutH *= 1.2; mutA *= 1.2;
    }

    const totalCards = inputs.cardsH + inputs.cardsA;
    let volatilityMod = totalCards >= 5 ? 0.85 : 1.0;

    if (inputs.hasRedCard) {
        if (scoreDiff !== 0) { mutH *= 0.6; mutA *= 0.6; }
    }

    let timeDecay = 1.0;
    if (inputs.minute > 75) {
        timeDecay = (inputs.isKnockout || inputs.isFavLosing) ? 1.3 : 0.7;
    }

    // 4. TRAP SCORE (SIGMOIDE CONTÍNUO)
    let rawTrapScore = 0;
    if (qualModH < 0.7 && inputs.gameDominance === 'home') rawTrapScore += 40; 
    if (qualModA < 0.7 && inputs.gameDominance === 'away') rawTrapScore += 40;
    if (Math.abs(scoreDiff) >= 3) rawTrapScore += 60; 
    if (inputs.gamePace === 'slow' && inputs.minute > 75) rawTrapScore += 35; 
    if (totalPPM < 0.6 && inputs.minute < 60) rawTrapScore += 30; 
    
    const trapScore = sigmoid(rawTrapScore, 0.15, 45); 
    const isTrap = trapScore > 60;
    const noBet = trapScore > 80;

    // 5. SIMULAÇÃO PROBABILÍSTICA DISCRETA (Matriz Bivariada)
    const baseLambdaMinH = (xgProxyH / 90) * validatedPace * eventVolatility * mutH * timeDecay * volatilityMod;
    const baseLambdaMinA = (xgProxyA / 90) * validatedPace * eventVolatility * mutA * timeDecay * volatilityMod;
    
    const lambdaGoalTotalH = baseLambdaMinH * timeLeft;
    const lambdaGoalTotalA = baseLambdaMinA * timeLeft;
    const lambdaGoalTotal = lambdaGoalTotalH + lambdaGoalTotalA;

    // Ajuste de Cantos (Menos impacto do AP estéril)
    const lambdaCornerH = ((apRateH * 0.08) + (qualModH * 0.04)) * validatedDomH * validatedPace * timeLeft;
    const lambdaCornerA = ((apRateA * 0.08) + (qualModA * 0.04)) * validatedDomA * validatedPace * timeLeft;
    const lambdaCornerTotal = lambdaCornerH + lambdaCornerA;

    const lambdaCardTotal = (totalPPM * 0.035) * validatedPace * timeLeft * (inputs.isKnockout ? 1.3 : 1.0);

    const expGoalsFT = inputs.scoreH + inputs.scoreA + lambdaGoalTotal;
    const expCornersFT = inputs.cornersH + inputs.cornersA + lambdaCornerTotal;
    const expCardsFT = inputs.cardsH + inputs.cardsA + lambdaCardTotal;

    // 6. MARKET VALIDATOR
    const currentGoals = inputs.scoreH + inputs.scoreA;
    const currentCorners = inputs.cornersH + inputs.cornersA;

    const probGoal1 = poissonOver(lambdaGoalTotal, 1); 
    const probGoal2 = poissonOver(lambdaGoalTotal, 2); 

    const baseCornerLine = Math.max(currentCorners + 1, Math.floor(expCornersFT));
    const reqC1 = Math.max(1, baseCornerLine - currentCorners);
    const probCorner1 = poissonOver(lambdaCornerTotal, reqC1); 
    const probCorner2 = poissonOver(lambdaCornerTotal, reqC1 + 1);

    // Bivariada Simples 1X2
    let probHomeWinFT = 0; let probDrawFT = 0; let probAwayWinFT = 0;
    for (let i = 0; i <= 5; i++) {
        for (let j = 0; j <= 5; j++) {
            const p = poisson(lambdaGoalTotalH, i) * poisson(lambdaGoalTotalA, j);
            if (inputs.scoreH + i > inputs.scoreA + j) probHomeWinFT += p;
            else if (inputs.scoreH + i === inputs.scoreA + j) probDrawFT += p;
            else probAwayWinFT += p;
        }
    }

    const probHScores = inputs.scoreH > 0 ? 1 : (1 - Math.exp(-lambdaGoalTotalH));
    const probAScores = inputs.scoreA > 0 ? 1 : (1 - Math.exp(-lambdaGoalTotalA));
    const bttsProb = Math.min(0.97, probHScores * probAScores * ((inputs.scoreH === 0 && inputs.scoreA === 0) ? 0.92 : 0.97));

    // 7. SYSTEM STABILITY SCORE (Antigo Confidence)
    let stabilityScore = 100 - trapScore;
    if (volatilityMod < 1.0) stabilityScore *= 0.85;

    const confLevel = noBet ? 'NO BET (BLOQUEADO)' : stabilityScore > 75 ? 'Alta Estabilidade' : stabilityScore > 50 ? 'Moderada' : 'Baixa Estabilidade';
    const confColor = noBet ? 'text-red-500' : stabilityScore > 75 ? 'text-emerald-500' : stabilityScore > 50 ? 'text-indigo-500' : 'text-amber-500';

    const calcEV = (prob: number, oddStr: string) => {
        const odd = parseFloat(oddStr);
        if (!odd || odd <= 1) return null;
        return ((prob * odd) - 1) * 100;
    };
    const evGoal = calcEV(probGoal1, inputs.oddGoal);
    const evCorner = calcEV(probCorner1, inputs.oddCorner);

    let finalNoBet = noBet;
    let finalReason = noBet ? "SCORE DE ARMADILHA ALTO: " + (trapScore > 80 ? "Condições matemáticas corrompidas. Aborte." : "Falso domínio detectado.") : "";

    if (!finalNoBet && ((evGoal !== null && evGoal <= 3) || (evCorner !== null && evCorner <= 3))) {
        finalNoBet = true;
        finalReason = "ODD ESMAGADA: O mercado ajustou a linha perfeitamente. Sem Edge Matemático (+EV) para cobrir a variância.";
    }

    // 8. COMBOS EV+ CORRELACIONADOS
    const combos = [];
    if (!finalNoBet) {
        if (scoreDiff <= 0 && lambdaGoalTotalH > 0.6 && probGoal1 > 0.55 && inputs.gameDominance === 'home') {
            const p = (probHomeWinFT + probDrawFT) * probGoal1 * 0.95; 
            combos.push({ title: "Casa ou Empate + Over 0.5 Gols", prob: p, odd: calcFairOdd(p), type: 'match' });
        } else if (scoreDiff >= 0 && lambdaGoalTotalA > 0.6 && probGoal1 > 0.55 && inputs.gameDominance === 'away') {
            const p = (probAwayWinFT + probDrawFT) * probGoal1 * 0.95;
            combos.push({ title: "Fora ou Empate + Over 0.5 Gols", prob: p, odd: calcFairOdd(p), type: 'match' });
        }

        if (bttsProb > 0.50 && probCorner1 > 0.60) {
            const p = bttsProb * probCorner1 * 0.88; 
            combos.push({ title: `Ambas Marcam + Mais de ${baseCornerLine - 0.5} Cantos`, prob: p, odd: calcFairOdd(p), type: 'goal' });
        }
    }

    // 9. DIAGNÓSTICO DO SCRIPT
    let script = "";
    if (isTrap || finalNoBet) script = `🚫 ${finalReason}`;
    else if (validatedPace > 1.1 && validatedDomH === 1.0 && validatedDomA === 1.0) script = "⚔️ JOGO CAÓTICO: Transições constantes, defesas expostas. Cenário operável para BTTS.";
    else if (qualModH > 1.2 && inputs.gameDominance === 'home') script = "🔥 TRANSIÇÃO LETAL (CASA): Eficiência brutal de ataque. Cenário forte para Gols a favor do Mandante.";
    else if (qualModA > 1.2 && inputs.gameDominance === 'away') script = "🔥 TRANSIÇÃO LETAL (FORA): Contra-ataques venenosos do Visitante. A defesa não vai suportar.";
    else if (validatedPace < 0.9) script = "♟️ RITMO MORNO: Posse estagnada. O tempo favorece as linhas de Under (Gols e Cantos).";
    else script = "⚖️ JOGO EQUILIBRADO: Siga estritamente a matemática das Fair Lines e o cálculo de EV+.";

    let bestTiming = "Aguarde os 65' a 70' para as odds derreterem.";
    if (inputs.recentEvent) bestTiming = "Aguarde o jogo estabilizar (5-10 min) após o evento recente.";
    else if (inputs.minute >= 75 && trapScore < 40 && (inputs.isKnockout || Math.abs(scoreDiff) <= 1)) bestTiming = "Abafa Final Identificado. Execução imediata recomendada se houver valor (+EV).";
    else if (inputs.minute > 80 && Math.abs(scoreDiff) >= 2) bestTiming = "Jogo Morto (Kill State). Fique de fora.";

    let momentumLvl = { ppm: totalPPM, level: 'Baixo', color: 'text-slate-500' };
    if (totalPPM >= 1.6) momentumLvl = { ppm: totalPPM, level: 'Esmagamento', color: 'text-emerald-500' };
    else if (totalPPM >= 1.0) momentumLvl = { ppm: totalPPM, level: 'Intenso', color: 'text-indigo-500' };
    else if (totalPPM >= 0.6) momentumLvl = { ppm: totalPPM, level: 'Moderado', color: 'text-amber-500' };

    return { 
        closed: false, isAnomaly: false, noBet: finalNoBet, isTrap, script, confLevel, confColor, combos, bestTiming, trapScore,
        totals: { goals: expGoalsFT, corners: expCornersFT, cards: expCardsFT },
        ev: { goal: evGoal, corner: evCorner },
        lines: {
            goals: [
                { line: `Over ${currentGoals + 0.5}`, prob: probGoal1, odd: calcFairOdd(probGoal1) },
                { line: `Over ${currentGoals + 1.5}`, prob: probGoal2, odd: calcFairOdd(probGoal2) }
            ],
            corners: [
                { line: `Asiático ${baseCornerLine}.0`, prob: probCorner1, odd: calcFairOdd(probCorner1) },
                { line: `Asiático ${baseCornerLine + 1}.0`, prob: probCorner2, odd: calcFairOdd(probCorner2) }
            ]
        },
        stats: { hWin: probHomeWinFT, draw: probDrawFT, aWin: probAwayWinFT, btts: bttsProb },
        momentum: momentumLvl, rawInputs: inputs
    };

  }, [deferredInput]);

  // ==========================================
  // RESOLUTION ENGINE LOGGING (FASE 1 - BETA)
  // ==========================================
  const handleSaveLog = async () => {
      if (engine.closed || engine.isAnomaly || !session) return;
      setIsLogging(true);
      try {
          const logData = {
              user_id: session.user.id,
              match_id: 'aguardando_api_integracao', // Prep para Fase 2
              status: 'pending_resolution',
              minute: engine.rawInputs.minute,
              score_home: engine.rawInputs.scoreH,
              score_away: engine.rawInputs.scoreA,
              corners_home: engine.rawInputs.cornersH,
              corners_away: engine.rawInputs.cornersA,
              ap_home: engine.rawInputs.apH,
              ap_away: engine.rawInputs.apA,
              sot_home: engine.rawInputs.sotH,
              sot_away: engine.rawInputs.sotA,
              pace_sensor: engine.rawInputs.gamePace,
              dominance_sensor: engine.rawInputs.gameDominance,
              pred_goal_prob: engine.lines.goals[0].prob,
              pred_corner_prob: engine.lines.corners[0].prob,
              pred_btts: engine.stats.btts,
              trap_score: engine.trapScore,
              created_at: new Date().toISOString()
          };
          
          const { error } = await supabase.from('quant_logs').insert([logData]);
          if (error) throw error;
          alert("Snapshot salvo! Obrigado por alimentar a base de dados para calibração.");
      } catch (err) {
          console.error("Erro ao salvar log:", err);
          alert("Ops! Crie a tabela 'quant_logs' no Supabase primeiro para habilitar o Tracking.");
      } finally {
          setIsLogging(false);
      }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors text-base font-bold placeholder:text-slate-400 dark:placeholder:text-[#636366] min-w-0";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 md:px-8 pt-8 font-sans relative">
        
      <div className="w-full">
        
        {/* HEADER EDUCATIVO */}
        <div className="flex flex-col gap-2 mb-6 border-b border-slate-200 dark:border-[#2C2C2E] pb-6">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
                Live Match Intelligence
              </div>
              <div className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Beta Access
              </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Assistente Analítico (FT)
          </h1>
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start gap-4 mt-2 shadow-sm">
             <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2.5 rounded-xl shrink-0"><BrainCircuit className="text-indigo-600 dark:text-indigo-400" size={20} /></div>
             <p className="text-xs sm:text-sm text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
                <strong>Simulador Probabilístico Contextual:</strong> A IA analisa <strong>Ameaça Real (xG Proxy), Fadiga e Contexto</strong> para validar Linhas Asiáticas. O sistema emitirá alertas de <i>Armadilha</i> caso identifique Posse Estéril. Use como suporte para cruzar com sua leitura tática.
             </p>
          </div>
        </div>

        {/* 🚨 ANOMALY DETECTION ALERT 🚨 */}
        <AnimatePresence>
            {!engine.closed && engine.isAnomaly && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-500 border border-amber-400 rounded-2xl p-6 shadow-[0_0_40px_rgba(245,158,11,0.2)] mb-8 flex flex-col sm:flex-row items-center gap-6">
                    <div className="bg-white/20 p-4 rounded-full shrink-0"><Database size={32} className="text-white"/></div>
                    <div className="text-center sm:text-left text-white">
                        <h3 className="text-xl font-black uppercase tracking-widest mb-1">Qualidade de Dados Comprometida</h3>
                        <p className="text-amber-100 font-medium leading-relaxed">{engine.anomalyReason}</p>
                        <p className="text-white text-[10px] uppercase tracking-widest mt-2 font-bold bg-black/20 inline-block px-3 py-1 rounded">Corrija os inputs para ativar o motor</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* 🚨 NO BET ENGINE ALERT 🚨 */}
        <AnimatePresence>
            {!engine.closed && !engine.isAnomaly && engine.noBet && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-600 border border-red-500 rounded-2xl p-6 shadow-[0_0_40px_rgba(220,38,38,0.2)] mb-8 flex flex-col sm:flex-row items-center gap-6">
                    <div className="bg-white/20 p-4 rounded-full shrink-0"><Ban size={32} className="text-white"/></div>
                    <div className="text-center sm:text-left text-white">
                        <h3 className="text-xl font-black uppercase tracking-widest mb-1">NO BET (Entrada Bloqueada)</h3>
                        <p className="text-red-100 font-medium leading-relaxed">{engine.script}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {!engine.closed && !engine.isAnomaly ? (
            <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 transition-opacity duration-500 ${engine.noBet ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
              
              {/* PAINEL ESQUERDO: AVALIAÇÃO DO SISTEMA (O CÉREBRO) */}
              <div className="lg:col-span-7 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col relative overflow-hidden">
                  
                  {/* Fundo de Risco Condicional */}
                  {engine.isTrap && <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20"></div>}
                  
                  <div className="flex items-center justify-between gap-3 mb-6 border-b border-slate-100 dark:border-[#2C2C2E] pb-4 relative z-10">
                      <div className="flex items-center gap-2">
                          <div className="bg-slate-50 dark:bg-[#000000] p-2 rounded-lg text-slate-700 dark:text-white border border-slate-200 dark:border-[#3A3A3C]"><ShieldCheck size={16}/></div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Diagnóstico Tático da IA</h3>
                      </div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border bg-white dark:bg-[#1C1C1E] shadow-sm ${engine.confColor} border-current`}>
                          Estabilidade: {engine.confLevel}
                      </div>
                  </div>

                  <div className="space-y-5 flex-1 relative z-10">
                      
                      <div className="p-5 rounded-2xl border bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#3A3A3C]">
                          <p className="text-sm md:text-base font-bold leading-relaxed text-slate-800 dark:text-[#E5E5EA]">
                              {engine.script}
                          </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 dark:bg-[#000000] p-4 rounded-xl border border-slate-200 dark:border-[#3A3A3C] flex flex-col shadow-sm">
                              <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-[#8E8E93] tracking-widest mb-1">Risco de Armadilha (Sigmoide)</span>
                              <span className={`text-lg font-black font-mono tracking-tight ${engine.trapScore > 50 ? 'text-red-500' : 'text-emerald-500'}`}>{engine.trapScore.toFixed(0)}/100</span>
                              <span className={`text-[10px] font-bold uppercase ${engine.trapScore > 50 ? 'text-red-500' : 'text-emerald-500'}`}>{engine.trapScore > 50 ? 'Perigo Iminente' : 'Zona Segura'}</span>
                          </div>
                          <div className="bg-slate-50 dark:bg-[#000000] p-4 rounded-xl border border-slate-200 dark:border-[#3A3A3C] flex flex-col shadow-sm">
                              <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-[#8E8E93] tracking-widest mb-1">Melhor Timing de Entrada</span>
                              <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug">{engine.bestTiming}</span>
                          </div>
                      </div>

                      {/* EDGE CHECKER (Validador de Odd) */}
                      {!engine.isTrap && (
                          <div className="mt-4 border-t border-slate-100 dark:border-[#2C2C2E] pt-5 space-y-4">
                              <h4 className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-widest flex items-center gap-1.5"><Crosshair size={14}/> Validador de Edge (+EV)</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* GOLS EDGE */}
                                  <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl p-4 shadow-sm flex flex-col">
                                      <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-[#8E8E93] mb-2 truncate">Linha Gols: {engine.lines.goals[0].line}</p>
                                      <div className="flex gap-2 mb-3">
                                          <div className="relative flex-1 min-w-0">
                                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">@</span>
                                              <input type="number" step="0.01" value={oddGoal} onChange={e => setOddGoal(e.target.value)} placeholder="Odd Atual" className="w-full min-w-0 bg-slate-50 dark:bg-[#000000] rounded-lg border border-slate-200 dark:border-[#2C2C2E] pl-6 pr-2 py-2 font-mono text-sm outline-none focus:border-indigo-500 font-bold" />
                                          </div>
                                          <div className="flex-1 bg-slate-50 dark:bg-[#000000] rounded-lg border border-slate-200 dark:border-[#2C2C2E] px-2 py-2 flex flex-col items-center justify-center min-w-0">
                                              <span className="text-[8px] font-bold text-slate-400 uppercase">Justa</span>
                                              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">@{engine.lines.goals[0].odd}</span>
                                          </div>
                                      </div>
                                      <div className={`mt-auto text-center py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${engine.ev.goal !== null && engine.ev.goal >= 3 ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : engine.ev.goal !== null ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-[#000000] dark:border-[#2C2C2E]'}`}>
                                          {engine.ev.goal !== null ? (engine.ev.goal >= 3 ? `+EV DETECTADO (${engine.ev.goal.toFixed(1)}%)` : 'SEM VALOR / NO BET') : 'Insira a Odd Atual'}
                                      </div>
                                  </div>

                                  {/* CANTOS EDGE */}
                                  <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl p-4 shadow-sm flex flex-col">
                                      <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-[#8E8E93] mb-2 truncate">Linha Cantos: {engine.lines.corners[0].line}</p>
                                      <div className="flex gap-2 mb-3">
                                          <div className="relative flex-1 min-w-0">
                                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">@</span>
                                              <input type="number" step="0.01" value={oddCorner} onChange={e => setOddCorner(e.target.value)} placeholder="Odd Atual" className="w-full min-w-0 bg-slate-50 dark:bg-[#000000] rounded-lg border border-slate-200 dark:border-[#2C2C2E] pl-6 pr-2 py-2 font-mono text-sm outline-none focus:border-indigo-500 font-bold" />
                                          </div>
                                          <div className="flex-1 bg-slate-50 dark:bg-[#000000] rounded-lg border border-slate-200 dark:border-[#2C2C2E] px-2 py-2 flex flex-col items-center justify-center min-w-0">
                                              <span className="text-[8px] font-bold text-slate-400 uppercase">Justa</span>
                                              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">@{engine.lines.corners[0].odd}</span>
                                          </div>
                                      </div>
                                      <div className={`mt-auto text-center py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${engine.ev.corner !== null && engine.ev.corner >= 3 ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' : engine.ev.corner !== null ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-[#000000] dark:border-[#2C2C2E]'}`}>
                                          {engine.ev.corner !== null ? (engine.ev.corner >= 3 ? `+EV DETECTADO (${engine.ev.corner.toFixed(1)}%)` : 'SEM VALOR / NO BET') : 'Insira a Odd Atual'}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              {/* PAINEL DIREITO: MESA DE PRECIFICAÇÃO E BUILDER */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                  
                  {/* BET BUILDER (COMBOS DE OURO) */}
                  {engine.combos.length > 0 && (
                      <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm flex-1">
                          <div className="flex items-center gap-3 mb-5 border-b border-slate-100 dark:border-[#2C2C2E] pb-3">
                              <div className="bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"><Crown size={14}/></div>
                              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Aposta Estratégica (EV+)</h3>
                          </div>
                          <div className="space-y-3">
                              {engine.combos.map((combo, i) => (
                                  <div key={i} className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] p-3.5 rounded-xl flex items-center justify-between gap-4 shadow-sm hover:border-amber-500/50 transition-colors">
                                      <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{combo.title}</p>
                                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Win Rate Estimado: <span className="text-amber-600 dark:text-amber-500">{(combo.prob * 100).toFixed(1)}%</span></p>
                                      </div>
                                      <div className="text-right shrink-0">
                                          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Odd Justa</p>
                                          <p className="text-base font-bold font-mono text-slate-900 dark:text-white tracking-tight bg-white dark:bg-[#1C1C1E] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#2C2C2E]">@{combo.odd}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* FAIR LINES PANEL */}
                  <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm flex-1">
                      <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-[#2C2C2E] pb-3">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                             <Layers size={14} className="text-indigo-500"/> Simulador FT (Fair Lines)
                          </h3>
                      </div>
                      
                      <div className="space-y-4">
                          {/* LINHAS GOLS */}
                          <div>
                              <div className="flex justify-between items-center bg-slate-100 dark:bg-[#000000] p-2 rounded-lg border border-slate-200 dark:border-[#3A3A3C] mb-2">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Goal size={10}/> Mercado de Gols</span>
                                  <span className="text-[9px] font-bold text-slate-500 uppercase">Exp. Final: {engine.totals.goals.toFixed(1)}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                  {engine.lines.goals.map((l, i) => (
                                      <div key={i} className="flex justify-between items-center p-2 rounded-lg border border-slate-100 dark:border-[#2C2C2E]">
                                          <span className="text-[10px] font-bold text-slate-700 dark:text-white truncate">{l.line}</span>
                                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${l.prob > 0.5 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-50 text-slate-500 dark:bg-[#000000] dark:text-[#8E8E93]'}`}>@{l.odd}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {/* LINHAS CANTOS */}
                          <div>
                              <div className="flex justify-between items-center bg-slate-100 dark:bg-[#000000] p-2 rounded-lg border border-slate-200 dark:border-[#3A3A3C] mb-2">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Flag size={10}/> Escanteios</span>
                                  <span className="text-[9px] font-bold text-slate-500 uppercase">Exp. Final: {engine.totals.corners.toFixed(1)}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                  {engine.lines.corners.map((l, i) => (
                                      <div key={i} className="flex justify-between items-center p-2 rounded-lg border border-slate-100 dark:border-[#2C2C2E]">
                                          <span className="text-[10px] font-bold text-slate-700 dark:text-white truncate pr-2">{l.line}</span>
                                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${l.prob > 0.5 ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' : 'bg-slate-50 text-slate-500 dark:bg-[#000000] dark:text-[#8E8E93]'}`}>@{l.odd}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {/* BTTS E 1X2 */}
                          <div className="pt-3 border-t border-slate-100 dark:border-[#2C2C2E]">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Simulação Probabilística Contextual (Match Odds)</p>
                              <div className="flex justify-between items-center py-1">
                                  <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-white tracking-widest">Vitória Casa (1)</span>
                                  <div className="flex items-center gap-2">
                                      <span className="text-[9px] text-slate-400 font-bold">{(engine.stats.hWin * 100).toFixed(1)}%</span>
                                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-[#8E8E93]">@{calcFairOdd(engine.stats.hWin)}</span>
                                  </div>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                  <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-white tracking-widest">Empate (X)</span>
                                  <div className="flex items-center gap-2">
                                      <span className="text-[9px] text-slate-400 font-bold">{(engine.stats.draw * 100).toFixed(1)}%</span>
                                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-[#8E8E93]">@{calcFairOdd(engine.stats.draw)}</span>
                                  </div>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                  <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-white tracking-widest">Vitória Fora (2)</span>
                                  <div className="flex items-center gap-2">
                                      <span className="text-[9px] text-slate-400 font-bold">{(engine.stats.aWin * 100).toFixed(1)}%</span>
                                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-[#8E8E93]">@{calcFairOdd(engine.stats.aWin)}</span>
                                  </div>
                              </div>
                              <div className="flex justify-between items-center py-1 mt-1 border-t border-slate-50 dark:border-[#000000] pt-2">
                                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-500 tracking-widest flex items-center gap-1.5"><Flame size={12}/> Ambas Marcam (BTTS)</span>
                                  <div className="flex items-center gap-2">
                                      <span className="text-[9px] text-slate-400 font-bold">{(engine.stats.btts * 100).toFixed(1)}%</span>
                                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-500">@{calcFairOdd(engine.stats.btts)}</span>
                                  </div>
                              </div>
                          </div>

                      </div>
                  </div>
              </div>

            </div>
        ) : (
            !engine.isAnomaly && (
                <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-16 text-center shadow-sm mb-8">
                    <ShieldAlert size={48} className="text-slate-300 dark:text-[#3A3A3C] mx-auto mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93]">Mercado Encerrado ou Fechado para Análise</p>
                </div>
            )
        )}

        {/* PAINEL DE INPUTS TÁTICOS E ESTATÍSTICOS (A ALIMENTAÇÃO DA IA) */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm">
          
          {/* FASE 1: LOG DE PREVISÕES E SNAPSHOTS */}
          <div className="mb-8 border-b border-indigo-500/20 pb-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                  <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Save size={14}/> Fase de Calibração (Tracking)</h3>
                  <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] font-medium">Salve os dados desta simulação. Na Fase 2 (Resolution Engine), cruzaremos essas projeções com os resultados finais reais das partidas para calibrar o motor matematicamente.</p>
              </div>
              <button onClick={handleSaveLog} disabled={isLogging || engine.closed || engine.isAnomaly} className="w-full md:w-auto bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all disabled:opacity-50">
                  {isLogging ? 'Salvando Snapshot...' : 'Salvar Log Analítico'}
              </button>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-slate-100 dark:border-[#2C2C2E] pb-6 gap-6">
              <div className="w-full md:w-auto">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#636366] mb-3 block">Modificadores Temporais & Eventos:</span>
                  <div className="flex flex-wrap gap-2">
                      <ToggleSwitch label="Favorito Atrás" state={isFavLosing} setter={setIsFavLosing} activeColor="bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300" />
                      <ToggleSwitch label="Mata-Mata / Desespero" state={isKnockout} setter={setIsKnockout} activeColor="bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-300" />
                      <ToggleSwitch label="Cartão Vermelho" state={hasRedCard} setter={setHasRedCard} activeColor="bg-red-50 border-red-200 text-red-700 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-300" />
                      <ToggleSwitch label="Gol / Red (< 5min)" state={recentEvent} setter={setRecentEvent} activeColor="bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300" />
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

          {/* SENSORES TÁTICOS (UX DE ELITE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 border-b border-slate-100 dark:border-[#2C2C2E] pb-8">
              <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-[#8E8E93] mb-3 block">Ritmo Atual da Partida</label>
                  <div className="flex gap-2">
                      <SensorButton label="Lento / Amarrado" active={gamePace === 'slow'} onClick={() => setGamePace('slow')} color="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-slate-800 dark:border-slate-200" />
                      <SensorButton label="Normal / Padrão" active={gamePace === 'normal'} onClick={() => setGamePace('normal')} color="bg-indigo-600 text-white border-indigo-600" />
                      <SensorButton label="Frenético / Lá e Cá" active={gamePace === 'chaotic'} onClick={() => setGamePace('chaotic')} color="bg-emerald-600 text-white border-emerald-600" />
                  </div>
              </div>
              <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-[#8E8E93] mb-3 block">Balanço de Domínio</label>
                  <div className="flex gap-2">
                      <SensorButton label="Pressão Casa" active={gameDominance === 'home'} onClick={() => setGameDominance('home')} color="bg-indigo-600 text-white border-indigo-600" />
                      <SensorButton label="Parelho / Neutro" active={gameDominance === 'balanced'} onClick={() => setGameDominance('balanced')} color="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-slate-800 dark:border-slate-200" />
                      <SensorButton label="Pressão Fora" active={gameDominance === 'away'} onClick={() => setGameDominance('away')} color="bg-emerald-600 text-white border-emerald-600" />
                  </div>
              </div>
          </div>

          {/* SLIDERS BÁSICOS (Estatísticas da Bet365) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] border-l-4 border-indigo-500 pl-3 mb-4">Mandante (Casa)</h4>
                <div className="grid grid-cols-2 gap-3 mb-2">
                    <SliderGroup label="Gols" value={scoreH} max={10} setter={setScoreH} colorClass="text-slate-900 dark:text-white" />
                    <SliderGroup label="Escanteios" value={cornersH} max={25} setter={setCornersH} colorClass="text-slate-900 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                    <SliderGroup label="Ataq. Perigosos" value={apH} max={150} setter={setApH} colorClass="text-indigo-600 dark:text-indigo-400" />
                    <SliderGroup label="Chutes no Alvo" value={sotH} max={20} setter={setSotH} colorClass="text-emerald-600 dark:text-emerald-500" />
                </div>
                <SliderGroup label="Cartões Recebidos" value={cardsH} max={10} setter={setCardsH} colorClass="text-amber-500" />
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] border-l-4 border-indigo-500 pl-3 mb-4">Visitante (Fora)</h4>
                <div className="grid grid-cols-2 gap-3 mb-2">
                    <SliderGroup label="Gols" value={scoreA} max={10} setter={setScoreA} colorClass="text-slate-900 dark:text-white" />
                    <SliderGroup label="Escanteios" value={cornersA} max={25} setter={setCornersA} colorClass="text-slate-900 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                    <SliderGroup label="Ataq. Perigosos" value={apA} max={150} setter={setApA} colorClass="text-indigo-600 dark:text-indigo-400" />
                    <SliderGroup label="Chutes no Alvo" value={sotA} max={20} setter={setSotA} colorClass="text-emerald-600 dark:text-emerald-500" />
                </div>
                <SliderGroup label="Cartões Recebidos" value={cardsA} max={10} setter={setCardsA} colorClass="text-amber-500" />
              </div>
          </div>
          
          <div className="mt-10 flex flex-wrap justify-center gap-4">
              <button onClick={() => applyPreset('dead')} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] px-4 py-2.5 rounded-lg shadow-sm">Zerar Dados</button>
              <button onClick={() => applyPreset('sterile')} className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-300 transition-colors bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-2.5 rounded-lg shadow-sm">Testar Pressão Estéril</button>
              <button onClick={() => applyPreset('blitz')} className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-4 py-2.5 rounded-lg shadow-sm">Testar Amasso (Blitz)</button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LiveTerminal;