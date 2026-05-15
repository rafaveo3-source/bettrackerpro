import React, { useState, useMemo } from 'react';
import {
  Clock, Target, Flag, TrendingUp, ShieldAlert, Eye,
  CheckCircle2, AlertTriangle, Crown, ChevronRight, Zap,
  ShieldCheck, Goal, Layers, Info,
  Crosshair, Flame, Ban, BrainCircuit, Activity, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBetStore } from '../store/useBetStore';

// ==========================================
// MOTOR QUANTITATIVO DE INFERÊNCIA
// ==========================================
const factorial = (n: number): number => {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
};

const poisson = (lambda: number, k: number): number => {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(Math.min(k, 20));
};

const poissonOver = (lambda: number, required: number): number => {
  if (required <= 0) return 1;
  if (lambda <= 0) return 0.01;
  let cumulative = 0;
  for (let i = 0; i < required; i++) cumulative += poisson(lambda, i);
  return Math.max(0.01, Math.min(0.99, 1 - cumulative));
};

const calcFairOdd = (prob: number): string =>
  prob > 0.02 ? (1 / prob).toFixed(2) : '50.00';

// ==========================================
// COMPONENTES UI CORE
// ==========================================
const AnimatedNumber = ({
  value, prefix = "", suffix = "", className = ""
}: { value: string | number; prefix?: string; suffix?: string; className?: string }) => (
  <motion.span
    key={String(value)}
    initial={{ opacity: 0.5, y: -2 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className={`inline-block font-mono ${className}`}
  >
    {prefix}{value}{suffix}
  </motion.span>
);

interface SliderGroupProps {
  label: string;
  value: number;
  max: number;
  setter: (val: number) => void;
  colorClass: string;
}

const SliderGroup: React.FC<SliderGroupProps> = ({ label, value, max, setter, colorClass }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between items-center">
      <label className={`text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>{label}</label>
      <AnimatedNumber value={value} className={`text-sm font-black ${colorClass}`} />
    </div>
    <input
      type="range"
      min="0"
      max={max}
      value={value}
      onChange={(e) => setter(Number(e.target.value))}
      className="w-full h-2 bg-slate-200 dark:bg-[#2C2C2E] rounded-lg appearance-none cursor-pointer accent-indigo-600"
    />
  </div>
);

const ToggleSwitch = ({
  label, state, setter, activeColor
}: { label: string; state: boolean; setter: (val: boolean) => void; activeColor: string }) => (
  <button
    onClick={() => setter(!state)}
    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all min-w-[100px] ${
      state
        ? `${activeColor} shadow-sm scale-[1.02]`
        : 'bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#2C2C2E] text-slate-500 dark:text-[#8E8E93]'
    }`}
  >
    <span className="text-[10px] font-bold uppercase tracking-widest leading-snug text-center">{label}</span>
  </button>
);

const SensorButton = ({
  label, active, onClick, color
}: { label: string; active: boolean; onClick: () => void; color: string }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
      active
        ? `${color} shadow-sm border border-current`
        : 'bg-slate-50 dark:bg-[#000000] text-slate-500 dark:text-[#8E8E93] border border-slate-200 dark:border-[#2C2C2E]'
    }`}
  >
    {label}
  </button>
);

// ==========================================
// TIPOS
// ==========================================
type GamePace = 'slow' | 'normal' | 'chaotic';
type GameDominance = 'home' | 'balanced' | 'away';

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const LiveTerminal: React.FC = () => {
  const { isPro } = useBetStore();
  const navigate = useNavigate();

  const ProBlurOverlay = () => (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-8 bg-white/5 dark:bg-black/5 backdrop-blur-sm rounded-2xl">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-[#2C2C2E] max-w-sm w-full text-center">
        <h2 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">
          Analista Quantitativo PRO
        </h2>
        <p className="text-xs text-slate-500 dark:text-[#8E8E93] mb-6 leading-relaxed">
          Motor Inferencial que utiliza os dados visíveis da casa de apostas para prever o
          Resultado Final (FT), detectar Armadilhas Ocultas e revelar apostas com Valor
          Esperado (+EV).
        </p>
        <button
          onClick={() => navigate('/pro')}
          className="w-full bg-slate-900 dark:bg-white hover:opacity-90 text-white dark:text-slate-900 font-bold py-4 px-8 rounded-xl transition-all shadow-sm text-xs tracking-widest uppercase"
        >
          Desbloquear Engine
        </button>
      </div>
    </div>
  );

  // ==========================================
  // ESTADOS DO JOGO
  // ==========================================
  const [minute, setMinute] = useState(45);

  const [scoreH, setScoreH] = useState(0);
  const [cornersH, setCornersH] = useState(2);
  const [cardsH, setCardsH] = useState(0);
  const [apH, setApH] = useState(40);
  const [sotH, setSotH] = useState(2);

  const [scoreA, setScoreA] = useState(0);
  const [cornersA, setCornersA] = useState(1);
  const [cardsA, setCardsA] = useState(1);
  const [apA, setApA] = useState(25);
  const [sotA, setSotA] = useState(1);

  const [isFavLosing, setIsFavLosing] = useState(false);
  const [isKnockout, setIsKnockout] = useState(false);
  const [hasRedCard, setHasRedCard] = useState(false);

  const [gamePace, setGamePace] = useState<GamePace>('normal');
  const [gameDominance, setGameDominance] = useState<GameDominance>('balanced');

  const [oddGoal, setOddGoal] = useState('');
  const [oddCorner, setOddCorner] = useState('');

  const applyPreset = (type: 'sterile' | 'blitz' | 'dead') => {
    setMinute(65);
    if (type === 'sterile') {
      setScoreH(0); setScoreA(0);
      setCornersH(8); setCornersA(1);
      setCardsH(1); setCardsA(2);
      setApH(75); setApA(15);
      setSotH(1); setSotA(0);
      setIsFavLosing(true); setGamePace('normal'); setGameDominance('home');
    } else if (type === 'blitz') {
      setScoreH(0); setScoreA(1);
      setCornersH(5); setCornersA(0);
      setCardsH(1); setCardsA(4);
      setApH(60); setApA(10);
      setSotH(6); setSotA(1);
      setIsFavLosing(true); setGamePace('chaotic'); setGameDominance('home');
    } else {
      setScoreH(1); setScoreA(1);
      setCornersH(2); setCornersA(2);
      setCardsH(1); setCardsA(1);
      setApH(30); setApA(30);
      setSotH(2); setSotA(2);
      setIsFavLosing(false); setGamePace('slow'); setGameDominance('balanced');
    }
    setOddGoal(''); setOddCorner('');
  };

  // ==========================================
  // O CÉREBRO PREDITIVO (INFERENTIAL ENGINE v2)
  // ==========================================
  const engine = useMemo(() => {
    const maxTime = 96;
    const timeLeft = Math.max(0, maxTime - minute);
    const playedTime = Math.max(1, minute);

    if (timeLeft <= 0) return { closed: true };

    // ── 1. TAXAS BASE ──────────────────────────────────────────────
    const apRateH = apH / playedTime;
    const apRateA = apA / playedTime;
    const sotRateH = sotH / playedTime;
    const sotRateA = sotA / playedTime;

    // ── 2. SENSOR VALIDATION ENGINE (anti-viés humano) ─────────────
    // Verifica coerência entre percepção e dados. Reduz peso do sensor se contraditório.
    const dataIntensityH = (sotH * 2 + apH * 0.1 + cornersH * 0.5) / playedTime;
    const dataIntensityA = (sotA * 2 + apA * 0.1 + cornersA * 0.5) / playedTime;
    const totalDataIntensity = dataIntensityH + dataIntensityA;

    // Peso do sensor de ritmo calibrado contra dados (0 a 1)
    const paceIsConsistentWithData = (() => {
      if (gamePace === 'chaotic' && totalDataIntensity < 0.3) return 0.3; // usuário exagerou
      if (gamePace === 'slow' && totalDataIntensity > 0.6) return 0.3;   // dados contradizem
      return 1.0;
    })();

    // Sensor de dominância calibrado (0.6 a 1.0 de influência)
    const dominanceSensorWeight = 0.6 + 0.4 * paceIsConsistentWithData;

    // ── 3. MODIFICADORES DE DOMINÂNCIA (SUAVIZADOS) ─────────────────
    // Reduzido de 1.3/0.7 para 1.2/0.85 — sensor é modificador secundário
    let xgModH = 1.0; let xgModA = 1.0;
    if (gameDominance === 'home') {
      xgModH = 1.0 + 0.20 * dominanceSensorWeight;
      xgModA = 1.0 - 0.15 * dominanceSensorWeight;
    } else if (gameDominance === 'away') {
      xgModH = 1.0 - 0.15 * dominanceSensorWeight;
      xgModA = 1.0 + 0.20 * dominanceSensorWeight;
    }

    // ── 4. xG PROXY REFINADO (inferência de qualidade de finalização) ─
    // Lógica de qualidade: poucos AP + muitos SOT → transição perigosa (↑ xg/shot)
    // Muitos AP + poucos SOT → pressão estéril (↓ xg/shot)
    const shotQualityH = sotH > 0 && apH > 0 ? Math.min(1.5, (sotH / apH) * 10) : 0.5;
    const shotQualityA = sotA > 0 && apA > 0 ? Math.min(1.5, (sotA / apA) * 10) : 0.5;

    const xgProxyH = ((sotRateH * 0.6 * shotQualityH) + (apRateH * 0.4)) * xgModH;
    const xgProxyA = ((sotRateA * 0.6 * shotQualityA) + (apRateA * 0.4)) * xgModA;

    // ── 5. TIMING & DECAY ──────────────────────────────────────────
    const scoreDiff = scoreH - scoreA;
    const absScoreDiff = Math.abs(scoreDiff);

    // Decay base do ritmo (SUAVIZADO: era 1.4/0.6, agora 1.25/0.7)
    let paceMultiplier = 1.0;
    if (gamePace === 'chaotic') paceMultiplier = 1.0 + 0.25 * paceIsConsistentWithData;
    else if (gamePace === 'slow') paceMultiplier = 1.0 - 0.30 * paceIsConsistentWithData;

    // Aceleração Late Game
    let timeDecay = paceMultiplier;
    if (minute > 75) {
      const needsGoal = isKnockout || isFavLosing || absScoreDiff <= 1;
      if (gamePace !== 'slow' && needsGoal) timeDecay *= 1.25;
      else if (gamePace === 'slow' || absScoreDiff >= 2) timeDecay *= 0.75;
    }

    // Impacto de cartão vermelho (reduz mobilidade)
    if (hasRedCard) timeDecay *= 0.85;

    // Impacto de cartões (volatilidade geral)
    const totalCards = cardsH + cardsA;
    const volatilityMod = totalCards >= 6 ? 0.85 : 1.0;

    // ── 6. LAMBDAS OFENSIVOS ────────────────────────────────────────
    const lambdaGoalH = Math.max(0, xgProxyH * 0.12 * volatilityMod * timeDecay * timeLeft);
    const lambdaGoalA = Math.max(0, xgProxyA * 0.12 * volatilityMod * timeDecay * timeLeft);
    const lambdaGoalTotal = lambdaGoalH + lambdaGoalA;

    const lambdaCornerH = Math.max(0, apRateH * 0.15 * xgModH * timeDecay * timeLeft);
    const lambdaCornerA = Math.max(0, apRateA * 0.15 * xgModA * timeDecay * timeLeft);
    const lambdaCornerTotal = lambdaCornerH + lambdaCornerA;

    // Lambda de cartões (estimado via taxa histórica + contexto)
    const cardRateTotal = totalCards / playedTime;
    const tensionMod = (totalCards >= 3 ? 1.2 : 1.0) * (hasRedCard ? 0.7 : 1.0);
    const lambdaCardTotal = Math.max(0, cardRateTotal * tensionMod * timeLeft);

    const expGoalsFT = scoreH + scoreA + lambdaGoalTotal;
    const expCornersFT = cornersH + cornersA + lambdaCornerTotal;
    const expCardsFT = totalCards + lambdaCardTotal;

    // ── 7. MARKET LINES ────────────────────────────────────────────
    const currentGoals = scoreH + scoreA;
    const currentCorners = cornersH + cornersA;

    const probGoal1 = poissonOver(lambdaGoalTotal, 1);
    const probGoal2 = poissonOver(lambdaGoalTotal, 2);

    const baseCornerLine = Math.max(currentCorners + 1, Math.floor(expCornersFT));
    const reqC1 = Math.max(1, baseCornerLine - currentCorners);
    const probCorner1 = poissonOver(lambdaCornerTotal, reqC1);
    const probCorner2 = poissonOver(lambdaCornerTotal, reqC1 + 1);

    // ── 8. SIMULAÇÃO POISSON BIVARIADA (FT Match Odds) ─────────────
    // Nota: Discretização Poisson bivariada — exata para distribuições independentes
    // em janela temporal discreta. Monte Carlo real requereria iterações ~10k+.
    let probHomeWinFT = 0; let probDrawFT = 0; let probAwayWinFT = 0;
    const maxGoals = 8;
    for (let i = 0; i <= maxGoals; i++) {
      for (let j = 0; j <= maxGoals; j++) {
        const p = poisson(lambdaGoalH, i) * poisson(lambdaGoalA, j);
        const ftH = scoreH + i;
        const ftA = scoreA + j;
        if (ftH > ftA) probHomeWinFT += p;
        else if (ftH === ftA) probDrawFT += p;
        else probAwayWinFT += p;
      }
    }

    // ── 9. BTTS (COM AJUSTE DE CORRELAÇÃO) ──────────────────────────
    // Gols correlacionados negativamente (gol muda comportamento tático)
    // Penalizamos BTTS em ~8% para capturar dependência
    const probHScores = scoreH > 0 ? 1 : (1 - Math.exp(-lambdaGoalH));
    const probAScores = scoreA > 0 ? 1 : (1 - Math.exp(-lambdaGoalA));
    const correlationPenalty = (scoreH === 0 && scoreA === 0) ? 0.92 : 0.97; // maior correlação em 0x0
    const bttsProb = Math.min(0.97, probHScores * probAScores * correlationPenalty);

    // ── 10. TRAP SCORE PROBABILÍSTICO ───────────────────────────────
    // Score 0-100. Acima de 65 → NoBet.
    let trapScore = 0;
    let trapReasons: string[] = [];

    // Pressão estéril (AP alto + SOT baixo)
    const sterileH = apH > 40 && sotH <= 1 && gameDominance === 'home';
    const sterileA = apA > 40 && sotA <= 1 && gameDominance === 'away';
    if (sterileH || sterileA) {
      trapScore += 45;
      trapReasons.push(
        sterileH
          ? "PRESSÃO ESTÉRIL (Casa): Alto volume de ataque sem finalização efetiva. Risco de Falso Over."
          : "PRESSÃO ESTÉRIL (Fora): Visitante gira bola sem perigo real. Linhas infladas sem motivo."
      );
    }

    // Anomalia de escanteios sem ofensividade
    if (cornersH + cornersA > 9 && minute < 50 && (sotH + sotA) < 3) {
      trapScore += 35;
      trapReasons.push("ANOMALIA HT: Escanteios causais sem volume ofensivo real. Linha FT sub-avaliada para Under.");
    }

    // Jogo resolvido
    if (absScoreDiff >= 3) {
      trapScore += 70;
      trapReasons.push("GAME KILL: Partida definida. Queda drástica de intensidade esperada.");
    }

    // Ritmo lento na reta final sem necessidade de gol
    if (gamePace === 'slow' && minute > 70 && absScoreDiff >= 1 && paceIsConsistentWithData > 0.5) {
      trapScore += 40;
      trapReasons.push("COLAPSO TÁTICO: Ritmo lento na reta final. Times aceitaram o placar.");
    }

    // Sensor inconsistente com dados (viés do usuário detectado)
    if (paceIsConsistentWithData < 0.5) {
      trapScore += 15;
      trapReasons.push("ALERTA: Percepção tática diverge dos dados. Calibre o sensor de ritmo.");
    }

    const isTrap = trapScore >= 65;
    const trapReason = isTrap && trapReasons.length > 0 ? trapReasons[0] : "";

    // ── 11. EV CALCULATOR ───────────────────────────────────────────
    const calcEV = (prob: number, oddStr: string): number | null => {
      const odd = parseFloat(oddStr);
      if (!odd || odd <= 1.0) return null;
      return ((prob * odd) - 1) * 100;
    };

    const evGoal = calcEV(probGoal1, oddGoal);
    const evCorner = calcEV(probCorner1, oddCorner);

    let noBet = isTrap;
    let noBetReason = trapReason;

    if (!noBet && evGoal !== null && evGoal <= 3) {
      noBet = true;
      noBetReason = "ODD ESMAGADA (Gols): A casa não está dando margem. Sem Edge (+EV) suficiente.";
    }
    if (!noBet && evCorner !== null && evCorner <= 3) {
      noBet = true;
      noBetReason = "ODD ESMAGADA (Cantos): Sem vantagem esperada nessa linha. Passe o jogo.";
    }

    // ── 12. COMBOS EV+ (BET BUILDER) ────────────────────────────────
    const combos: { title: string; prob: number; odd: string; type: string }[] = [];
    if (!noBet) {
      if (scoreDiff <= 0 && lambdaGoalH > 0.6 && probGoal1 > 0.55 && gameDominance === 'home') {
        const p = (probHomeWinFT + probDrawFT) * probGoal1 * 0.95;
        combos.push({ title: "Casa ou Empate + Over 0.5 Gols", prob: p, odd: calcFairOdd(p), type: 'match' });
      } else if (scoreDiff >= 0 && lambdaGoalA > 0.6 && probGoal1 > 0.55 && gameDominance === 'away') {
        const p = (probAwayWinFT + probDrawFT) * probGoal1 * 0.95;
        combos.push({ title: "Fora ou Empate + Over 0.5 Gols", prob: p, odd: calcFairOdd(p), type: 'match' });
      }

      if (bttsProb > 0.50 && probCorner1 > 0.60) {
        // Correlação BTTS–Cantos: penaliza combinação em 12% (mercados têm sobreposição tática)
        const p = bttsProb * probCorner1 * 0.88;
        combos.push({
          title: `Ambas Marcam + Mais de ${baseCornerLine - 0.5} Cantos`,
          prob: p, odd: calcFairOdd(p), type: 'goal'
        });
      }

      if (probGoal2 > 0.45 && bttsProb > 0.45 && gamePace === 'chaotic') {
        const p = probGoal2 * bttsProb * 0.90;
        combos.push({ title: "Over 1.5 Gols + Ambas Marcam", prob: p, odd: calcFairOdd(p), type: 'goal' });
      }
    }

    // ── 13. CONFIDENCE SCORE (REFINADO) ─────────────────────────────
    // Considera: consistência de dados, força do sinal, volatilidade, risco trap
    const dataConsistency = paceIsConsistentWithData; // 0.3 a 1.0
    const signalStrength = Math.min(1, lambdaGoalTotal / 2); // normalizado
    const trapRisk = Math.min(1, trapScore / 100); // 0 a 1
    const volatility = gamePace === 'chaotic' ? 0.7 : gamePace === 'slow' ? 0.9 : 0.85;

    const rawConfidence = (
      dataConsistency * 30 +
      signalStrength * 30 +
      (1 - trapRisk) * 25 +
      volatility * 15
    ); // 0 a 100

    const confidenceScore = noBet ? 0 : rawConfidence;

    const confLevel = noBet
      ? 'NO BET (BLOQUEADO)'
      : confidenceScore > 72
        ? 'Excelente (Setup Elite)'
        : confidenceScore > 50
          ? 'Operável (Padrão)'
          : 'Risco Elevado';

    const confColor = noBet
      ? 'text-red-500'
      : confidenceScore > 72
        ? 'text-emerald-500'
        : confidenceScore > 50
          ? 'text-indigo-500'
          : 'text-amber-500';

    // ── 14. NARRATIVA TÁTICA ────────────────────────────────────────
    let script = "";
    if (noBet) {
      script = `🚫 ${noBetReason}`;
    } else if (paceIsConsistentWithData < 0.5) {
      script = "⚠️ SENSOR INCONSISTENTE: Os dados indicam um ritmo diferente do selecionado. O engine recalibrou o peso dos sensores automaticamente. Reavalie o campo de 'Ritmo' para maior precisão.";
    } else if (gamePace === 'chaotic' && gameDominance === 'balanced') {
      script = "⚔️ TROCAÇÃO FRANCA: Meio-campo destruído. Transições intensas dos dois lados. Cenário ideal para BTTS e Overs de Gols em mercados asiáticos.";
    } else if (gamePace === 'chaotic' && gameDominance === 'home') {
      script = "🔥 BLITZ MANDANTE: Amasso absoluto com finalização efetiva. Condições excelentes para Gols e Cantos a favor da Casa. Valide a odd antes de entrar.";
    } else if (gamePace === 'chaotic' && gameDominance === 'away') {
      script = "🔥 BLITZ VISITANTE: Domínio territorial com qualidade de finalização. Foque nos Mercados Asiáticos do Visitante.";
    } else if (gamePace === 'slow') {
      script = "♟️ RITMO MORNO: Jogo de xadrez lento. Posse defensiva prevalece. Procure Unders de Gols e Cantos ou passe o jogo.";
    } else {
      script = "⚖️ JOGO REGULAR: Sem viés agressivo detectado. Siga estritamente a matemática do validador de EV+ antes de entrar.";
    }

    return {
      closed: false,
      noBet,
      isTrap,
      trapScore,
      script,
      confLevel,
      confColor,
      confidenceScore,
      combos,
      sensorWarning: paceIsConsistentWithData < 0.5,
      totals: {
        goals: expGoalsFT,
        corners: expCornersFT,
        cards: expCardsFT,
      },
      ev: { goal: evGoal, corner: evCorner },
      lines: {
        goals: [
          { line: `Over ${currentGoals + 0.5}`, prob: probGoal1, odd: calcFairOdd(probGoal1) },
          { line: `Over ${currentGoals + 1.5}`, prob: probGoal2, odd: calcFairOdd(probGoal2) },
        ],
        corners: [
          { line: `Asiático ${baseCornerLine}.0`, prob: probCorner1, odd: calcFairOdd(probCorner1) },
          { line: `Asiático ${baseCornerLine + 1}.0`, prob: probCorner2, odd: calcFairOdd(probCorner2) },
        ],
      },
      stats: {
        hWin: probHomeWinFT,
        draw: probDrawFT,
        aWin: probAwayWinFT,
        btts: bttsProb,
      },
    };
  }, [
    minute, scoreH, scoreA, cornersH, cornersA, cardsH, cardsA,
    apH, apA, sotH, sotA, isFavLosing, isKnockout, hasRedCard,
    gamePace, gameDominance, oddGoal, oddCorner,
  ]);

  return (
    <div className="relative">
      {!isPro && <ProBlurOverlay />}

      <div className={!isPro ? 'pointer-events-none select-none blur-[4px] opacity-60' : ''}>

        {/* HEADER */}
        <div className="flex flex-col gap-2 mb-6 border-b border-slate-200 dark:border-[#2C2C2E] pb-6">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]" />
            Live Match Intelligence Engine v2
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Analista Quantitativo (FT)
          </h1>
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start gap-4 mt-2 shadow-sm">
            <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2.5 rounded-xl shrink-0">
              <BrainCircuit className="text-indigo-600 dark:text-indigo-400" size={20} />
            </div>
            <p className="text-xs sm:text-sm text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
              <strong>Sensor Validation Engine:</strong> O motor agora valida sua percepção tática
              contra os dados estatísticos brutos — se houver contradição, o sistema recalibra
              automaticamente o peso dos sensores e alerta o usuário. Menos viés, mais precisão.
            </p>
          </div>
        </div>

        {/* NO BET ALERT */}
        <AnimatePresence>
          {!engine.closed && engine.noBet && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-600 border border-red-500 rounded-2xl p-6 shadow-[0_0_40px_rgba(220,38,38,0.2)] mb-8 flex flex-col sm:flex-row items-center gap-6"
            >
              <div className="bg-white/20 p-4 rounded-full shrink-0">
                <Ban size={32} className="text-white" />
              </div>
              <div className="text-center sm:text-left text-white">
                <h3 className="text-xl font-black uppercase tracking-widest mb-1">
                  NO BET (Entrada Bloqueada)
                </h3>
                <p className="text-red-100 font-medium leading-relaxed">{engine.script}</p>
                {!engine.closed && engine.trapScore !== undefined && (
                  <p className="text-red-200 text-[10px] uppercase tracking-widest mt-2 font-bold">
                    Trap Score: {engine.trapScore}/100
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SENSOR WARNING (não-bloqueante) */}
        <AnimatePresence>
          {!engine.closed && !engine.noBet && engine.sensorWarning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-4 mb-6 flex items-start gap-4"
            >
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                <strong>Sensor Recalibrado:</strong> Os dados estatísticos contradizem o ritmo selecionado.
                O engine reduziu o peso do sensor automaticamente. Reavalie o campo de "Ritmo Atual".
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ANÁLISE PRINCIPAL */}
        {!engine.closed ? (
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 transition-opacity duration-500 ${engine.noBet ? 'opacity-40 pointer-events-none grayscale' : ''}`}>

            {/* PAINEL ESQUERDO: LEITURA DA IA */}
            <div className="lg:col-span-7 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col relative overflow-hidden">

              {engine.isTrap && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20" />
              )}

              <div className="flex items-center justify-between gap-3 mb-6 border-b border-slate-100 dark:border-[#2C2C2E] pb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-50 dark:bg-[#000000] p-2 rounded-lg text-slate-700 dark:text-white border border-slate-200 dark:border-[#3A3A3C]">
                    <ShieldCheck size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                    Leitura Tática da IA
                  </h3>
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border bg-white dark:bg-[#1C1C1E] shadow-sm ${engine.confColor} border-current`}>
                  {engine.confLevel}
                </div>
              </div>

              <div className="space-y-5 flex-1 relative z-10">
                <div className="p-5 rounded-2xl border bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#3A3A3C]">
                  <p className="text-sm md:text-base font-bold leading-relaxed text-slate-800 dark:text-[#E5E5EA]">
                    {engine.script}
                  </p>
                </div>

                {/* Confidence Breakdown */}
                {!engine.noBet && (
                  <div className="flex items-center gap-3 px-1">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-[#2C2C2E] rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          engine.confidenceScore > 72 ? 'bg-emerald-500' :
                          engine.confidenceScore > 50 ? 'bg-indigo-500' : 'bg-amber-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${engine.confidenceScore}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold font-mono ${engine.confColor}`}>
                      {engine.confidenceScore.toFixed(0)}
                    </span>
                  </div>
                )}

                {/* EDGE VALIDATOR */}
                {!engine.isTrap && (
                  <div className="mt-4 border-t border-slate-100 dark:border-[#2C2C2E] pt-5 space-y-4">
                    <h4 className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-widest flex items-center gap-1.5">
                      <Crosshair size={14} /> Validador de Edge (+EV)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* GOLS */}
                      <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl p-4 shadow-sm flex flex-col">
                        <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-[#8E8E93] mb-2 truncate">
                          Linha Gols: {engine.lines.goals[0].line}
                        </p>
                        <div className="flex gap-2 mb-3">
                          <div className="relative flex-1 min-w-0">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">@</span>
                            <input
                              type="number"
                              step="0.01"
                              value={oddGoal}
                              onChange={(e) => setOddGoal(e.target.value)}
                              placeholder="Odd Atual"
                              className="w-full min-w-0 bg-slate-50 dark:bg-[#000000] rounded-lg border border-slate-200 dark:border-[#2C2C2E] pl-6 pr-2 py-2 font-mono text-sm outline-none focus:border-indigo-500 font-bold"
                            />
                          </div>
                          <div className="flex-1 bg-slate-50 dark:bg-[#000000] rounded-lg border border-slate-200 dark:border-[#2C2C2E] px-2 py-2 flex flex-col items-center justify-center min-w-0">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Justa</span>
                            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">@{engine.lines.goals[0].odd}</span>
                          </div>
                        </div>
                        <div className={`mt-auto text-center py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${
                          engine.ev.goal !== null && engine.ev.goal >= 5
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            : engine.ev.goal !== null
                              ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                              : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-[#000000] dark:border-[#2C2C2E]'
                        }`}>
                          {engine.ev.goal !== null
                            ? engine.ev.goal >= 5
                              ? `+EV DETECTADO (${engine.ev.goal.toFixed(1)}%)`
                              : `SEM VALOR (${engine.ev.goal.toFixed(1)}%)`
                            : 'Insira a Odd Atual'}
                        </div>
                      </div>

                      {/* CANTOS */}
                      <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl p-4 shadow-sm flex flex-col">
                        <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-[#8E8E93] mb-2 truncate">
                          Linha Cantos: {engine.lines.corners[0].line}
                        </p>
                        <div className="flex gap-2 mb-3">
                          <div className="relative flex-1 min-w-0">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">@</span>
                            <input
                              type="number"
                              step="0.01"
                              value={oddCorner}
                              onChange={(e) => setOddCorner(e.target.value)}
                              placeholder="Odd Atual"
                              className="w-full min-w-0 bg-slate-50 dark:bg-[#000000] rounded-lg border border-slate-200 dark:border-[#2C2C2E] pl-6 pr-2 py-2 font-mono text-sm outline-none focus:border-indigo-500 font-bold"
                            />
                          </div>
                          <div className="flex-1 bg-slate-50 dark:bg-[#000000] rounded-lg border border-slate-200 dark:border-[#2C2C2E] px-2 py-2 flex flex-col items-center justify-center min-w-0">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Justa</span>
                            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">@{engine.lines.corners[0].odd}</span>
                          </div>
                        </div>
                        <div className={`mt-auto text-center py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${
                          engine.ev.corner !== null && engine.ev.corner >= 5
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
                            : engine.ev.corner !== null
                              ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                              : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-[#000000] dark:border-[#2C2C2E]'
                        }`}>
                          {engine.ev.corner !== null
                            ? engine.ev.corner >= 5
                              ? `+EV DETECTADO (${engine.ev.corner.toFixed(1)}%)`
                              : `SEM VALOR (${engine.ev.corner.toFixed(1)}%)`
                            : 'Insira a Odd Atual'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PAINEL DIREITO */}
            <div className="lg:col-span-5 flex flex-col gap-6">

              {/* BET BUILDER */}
              {engine.combos.length > 0 && (
                <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5 border-b border-slate-100 dark:border-[#2C2C2E] pb-3">
                    <div className="bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                      <Crown size={14} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                      Aposta Estratégica (EV+)
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {engine.combos.map((combo, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] p-3.5 rounded-xl flex items-center justify-between gap-4 shadow-sm hover:border-amber-500/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{combo.title}</p>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                            Odd Justa Sugerida:
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold font-mono text-slate-900 dark:text-white tracking-tight bg-white dark:bg-[#1C1C1E] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#2C2C2E]">
                            @{combo.odd}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAIR LINES */}
              <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm flex-1">
                <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-[#2C2C2E] pb-3">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <Layers size={14} className="text-indigo-500" /> Simulador FT (Fair Lines)
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* GOLS */}
                  <div>
                    <div className="flex justify-between items-center bg-slate-100 dark:bg-[#000000] p-2 rounded-lg border border-slate-200 dark:border-[#3A3A3C] mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Goal size={10} /> Mercado de Gols
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">
                        Exp. Final: {engine.totals.goals.toFixed(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {engine.lines.goals.map((l, i) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded-lg border border-slate-100 dark:border-[#2C2C2E]">
                          <span className="text-[10px] font-bold text-slate-700 dark:text-white truncate">{l.line}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            l.prob > 0.5
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-slate-50 text-slate-500 dark:bg-[#000000] dark:text-[#8E8E93]'
                          }`}>@{l.odd}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CANTOS */}
                  <div>
                    <div className="flex justify-between items-center bg-slate-100 dark:bg-[#000000] p-2 rounded-lg border border-slate-200 dark:border-[#3A3A3C] mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Flag size={10} /> Escanteios
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">
                        Exp. Final: {engine.totals.corners.toFixed(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {engine.lines.corners.map((l, i) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded-lg border border-slate-100 dark:border-[#2C2C2E]">
                          <span className="text-[10px] font-bold text-slate-700 dark:text-white truncate pr-2">{l.line}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                            l.prob > 0.5
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                              : 'bg-slate-50 text-slate-500 dark:bg-[#000000] dark:text-[#8E8E93]'
                          }`}>@{l.odd}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MATCH ODDS + BTTS */}
                  <div className="pt-2 border-t border-slate-100 dark:border-[#2C2C2E]">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Simulação Poisson Bivariada (Match Odds)
                    </p>
                    {[
                      { label: 'Vitória Casa (1)', val: engine.stats.hWin },
                      { label: 'Empate (X)', val: engine.stats.draw },
                      { label: 'Vitória Fora (2)', val: engine.stats.aWin },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center py-1">
                        <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-white tracking-widest">{row.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400 font-bold">{(row.val * 100).toFixed(1)}%</span>
                          <span className="text-xs font-mono font-bold text-slate-500 dark:text-[#8E8E93]">@{calcFairOdd(row.val)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-1 mt-1 border-t border-slate-50 dark:border-[#000000] pt-2">
                      <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-500 tracking-widest flex items-center gap-1.5">
                        <Flame size={12} /> Ambas Marcam (BTTS)
                      </span>
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
          <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-16 text-center shadow-sm mb-8">
            <ShieldAlert size={48} className="text-slate-300 dark:text-[#3A3A3C] mx-auto mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93]">
              Mercado Encerrado ou Fechado para Análise
            </p>
          </div>
        )}

        {/* PAINEL DE INPUTS */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm">

          {/* MODIFICADORES */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-slate-100 dark:border-[#2C2C2E] pb-6 gap-6">
            <div className="w-full md:w-auto">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#636366] mb-3 block">
                Modificadores de Contexto (Opcionais):
              </span>
              <div className="flex flex-wrap gap-2">
                <ToggleSwitch label="Favorito Atrás" state={isFavLosing} setter={setIsFavLosing} activeColor="bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300" />
                <ToggleSwitch label="Mata-Mata" state={isKnockout} setter={setIsKnockout} activeColor="bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-300" />
                <ToggleSwitch label="Cartão Vermelho" state={hasRedCard} setter={setHasRedCard} activeColor="bg-red-50 border-red-200 text-red-700 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-300" />
              </div>
            </div>
          </div>

          {/* MINUTO */}
          <div className="mb-10 w-full max-w-xl mx-auto">
            <div className="flex justify-between mb-3 px-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} /> Minuto Atual
              </label>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black text-2xl">{minute}'</span>
            </div>
            <input
              type="range"
              min="1"
              max={90}
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 dark:bg-[#2C2C2E] rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* SENSORES TÁTICOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 border-b border-slate-100 dark:border-[#2C2C2E] pb-8">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-[#8E8E93] mb-1 block">
                Ritmo Atual da Partida
              </label>
              <p className="text-[9px] text-slate-400 dark:text-[#636366] mb-3">
                O engine valida contra os dados. Contradições são recalibradas.
              </p>
              <div className="flex gap-2">
                <SensorButton label="Lento" active={gamePace === 'slow'} onClick={() => setGamePace('slow')} color="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-slate-800 dark:border-slate-200" />
                <SensorButton label="Normal" active={gamePace === 'normal'} onClick={() => setGamePace('normal')} color="bg-indigo-600 text-white border-indigo-600" />
                <SensorButton label="Caótico" active={gamePace === 'chaotic'} onClick={() => setGamePace('chaotic')} color="bg-emerald-600 text-white border-emerald-600" />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-[#8E8E93] mb-1 block">
                Balanço de Domínio
              </label>
              <p className="text-[9px] text-slate-400 dark:text-[#636366] mb-3">
                Modificador secundário — dados de AP e SOT têm prioridade.
              </p>
              <div className="flex gap-2">
                <SensorButton label="Casa" active={gameDominance === 'home'} onClick={() => setGameDominance('home')} color="bg-indigo-600 text-white border-indigo-600" />
                <SensorButton label="Neutro" active={gameDominance === 'balanced'} onClick={() => setGameDominance('balanced')} color="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-slate-800 dark:border-slate-200" />
                <SensorButton label="Fora" active={gameDominance === 'away'} onClick={() => setGameDominance('away')} color="bg-emerald-600 text-white border-emerald-600" />
              </div>
            </div>
          </div>

          {/* SLIDERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] border-l-4 border-indigo-500 pl-3 mb-4">
                Mandante (Casa)
              </h4>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <SliderGroup label="Gols" value={scoreH} max={10} setter={setScoreH} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Escanteios" value={cornersH} max={25} setter={setCornersH} colorClass="text-slate-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <SliderGroup label="Ataq. Perigosos" value={apH} max={150} setter={setApH} colorClass="text-indigo-600 dark:text-indigo-400" />
                <SliderGroup label="Chutes no Alvo" value={sotH} max={20} setter={setSotH} colorClass="text-emerald-600 dark:text-emerald-500" />
              </div>
              <SliderGroup label="Cartões" value={cardsH} max={10} setter={setCardsH} colorClass="text-amber-500" />
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] border-l-4 border-indigo-500 pl-3 mb-4">
                Visitante (Fora)
              </h4>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <SliderGroup label="Gols" value={scoreA} max={10} setter={setScoreA} colorClass="text-slate-900 dark:text-white" />
                <SliderGroup label="Escanteios" value={cornersA} max={25} setter={setCornersA} colorClass="text-slate-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <SliderGroup label="Ataq. Perigosos" value={apA} max={150} setter={setApA} colorClass="text-indigo-600 dark:text-indigo-400" />
                <SliderGroup label="Chutes no Alvo" value={sotA} max={20} setter={setSotA} colorClass="text-emerald-600 dark:text-emerald-500" />
              </div>
              <SliderGroup label="Cartões" value={cardsA} max={10} setter={setCardsA} colorClass="text-amber-500" />
            </div>
          </div>

          {/* PRESETS */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => applyPreset('dead')}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] px-4 py-2.5 rounded-lg shadow-sm"
            >
              Zerar Dados
            </button>
            <button
              onClick={() => applyPreset('sterile')}
              className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 hover:text-amber-800 transition-colors bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-2.5 rounded-lg shadow-sm"
            >
              Testar Pressão Estéril
            </button>
            <button
              onClick={() => applyPreset('blitz')}
              className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-4 py-2.5 rounded-lg shadow-sm"
            >
              Testar Amasso (Blitz)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTerminal;