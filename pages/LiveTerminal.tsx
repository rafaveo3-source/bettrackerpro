import React, { useState, useMemo } from 'react';
import {
  Clock,
  Flag,
  Goal,
  ShieldAlert,
  BarChart3,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Crown
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBetStore } from '../store/useBetStore';

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

const factorial = (n: number): number => {
  if (n === 0 || n === 1) return 1;

  let result = 1;

  for (let i = 2; i <= n; i++) {
    result *= i;
  }

  return result;
};

const poisson = (lambda: number, k: number) => {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

// ==========================================
// ANIMATED NUMBER
// ==========================================

const AnimatedNumber = ({
  value,
  prefix = '',
  suffix = '',
  className = ''
}: {
  value: string | number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) => (
  <AnimatePresence mode="popLayout">
    <motion.span
      key={value}
      initial={{ opacity: 0.5, scale: 0.95, y: -2 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`inline-block tabular-nums ${className}`}
    >
      {prefix}
      {value}
      {suffix}
    </motion.span>
  </AnimatePresence>
);

// ==========================================
// SLIDER GROUP
// ==========================================

interface SliderGroupProps {
  label: string;
  value: number;
  max: number;
  setter: (val: number) => void;
  colorClass: string;
}

const SliderGroup: React.FC<SliderGroupProps> = ({
  label,
  value,
  max,
  setter,
  colorClass
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-[11px] uppercase tracking-[0.18em] font-black text-slate-500">
        {label}
      </label>

      <span className={`font-mono font-black text-lg ${colorClass}`}>
        {value}
      </span>
    </div>

    <input
      type="range"
      min="0"
      max={max}
      value={value}
      onChange={(e) => setter(Number(e.target.value))}
      className={`w-full h-2 rounded-full appearance-none cursor-pointer bg-[#1C1C1F] hover:h-3 transition-all accent-current ${colorClass}`}
    />
  </div>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

const OraculoLive: React.FC = () => {
  const { isPro } = useBetStore();

  const navigate = useNavigate();

  // ==========================================
  // OVERLAY PRO
  // ==========================================

  const ProBlurOverlay = ({
    title,
    desc
  }: {
    title: string;
    desc: string;
  }) => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl rounded-[2rem]">
      <div className="bg-[#0B0B0C] border border-[#1F1F22] rounded-[2rem] p-8 max-w-md w-full shadow-[0_0_80px_rgba(0,0,0,0.6)] mx-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <Crown size={34} className="text-emerald-400" />
        </div>

        <h2 className="text-center text-2xl font-black tracking-tight text-white mb-3">
          {title} <span className="text-emerald-400">PRO</span>
        </h2>

        <p className="text-center text-sm text-slate-400 leading-relaxed mb-8">
          {desc}
        </p>

        <button
          onClick={() => navigate('/pro')}
          className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] text-xs transition-all shadow-[0_10px_40px_rgba(16,185,129,0.25)] active:scale-[0.98]"
        >
          Desbloquear Acesso
        </button>
      </div>
    </div>
  );

  // ==========================================
  // STATES
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
  // PRESETS
  // ==========================================

  const applyPreset = (
    type: 'blitz_casa' | 'blitz_fora' | 'equilibrado'
  ) => {
    if (type === 'blitz_casa') {
      setMinute(75);
      setTargetHalf('FT');

      setScoreH(0);
      setScoreA(1);

      setCornersH(6);
      setCornersA(1);

      setApH(85);
      setApA(20);

      setSotH(5);
      setSotA(1);
    } else if (type === 'blitz_fora') {
      setMinute(75);
      setTargetHalf('FT');

      setScoreH(1);
      setScoreA(0);

      setCornersH(2);
      setCornersA(7);

      setApH(25);
      setApA(90);

      setSotH(2);
      setSotA(6);
    } else {
      setMinute(30);
      setTargetHalf('HT');

      setScoreH(0);
      setScoreA(0);

      setCornersH(2);
      setCornersA(2);

      setApH(25);
      setApA(25);

      setSotH(1);
      setSotA(1);
    }
  };

  // ==========================================
  // HALF TOGGLE
  // ==========================================

  const handleHalfToggle = (half: 'HT' | 'FT') => {
    setTargetHalf(half);

    if (half === 'HT' && minute > 45) {
      setMinute(45);
    }
  };

  // ==========================================
  // ENGINE
  // ==========================================

  const { goalStats, cornerStats, gameScript } = useMemo(() => {
    const extraTime = targetHalf === 'HT' ? 3 : 6;

    const maxTime = (targetHalf === 'HT' ? 45 : 90) + extraTime;

    const timeLeft = Math.max(0, maxTime - minute);

    const closedRec = {
      status: 'FECHADO',
      conf: 'NULA',
      color: 'text-slate-500',
      bg: 'bg-[#111214] border-[#1F1F22]'
    };

    if (timeLeft <= 0) {
      return {
        goalStats: {
          p05: 0,
          odd05: 0,
          p15: 0,
          odd15: 0,
          expTotal: scoreH + scoreA,
          rec: closedRec
        },

        cornerStats: {
          p05: 0,
          odd05: 0,
          p10Win: 0,
          p10Void: 0,
          odd10: 0,
          expTotal: cornersH + cornersA,
          rec: closedRec
        },

        gameScript: 'Mercado Fechado.'
      };
    }

    const safeMin = Math.max(1, minute);

    const apRateH = apH / safeMin;
    const apRateA = apA / safeMin;

    const sotRateH = sotH / safeMin;
    const sotRateA = sotA / safeMin;

    let baseGoalH = apRateH * 0.015 + sotRateH * 0.15;
    let baseGoalA = apRateA * 0.015 + sotRateA * 0.15;

    let baseCornerH = apRateH * 0.12 + sotRateH * 0.1;
    let baseCornerA = apRateA * 0.12 + sotRateA * 0.1;

    const scoreDiff = scoreH - scoreA;

    let stateModH = 1;
    let stateModA = 1;

    if (Math.abs(scoreDiff) >= 3) {
      stateModH = 0.6;
      stateModA = 0.6;
    } else if (scoreDiff < 0) {
      stateModH = 1.35;
      stateModA = 0.8;
    } else if (scoreDiff > 0) {
      stateModH = 0.8;
      stateModA = 1.35;
    }

    let timeMod = 1;

    if (targetHalf === 'FT' && minute > 75) {
      timeMod = Math.exp((minute - 75) / 25);
    } else if (targetHalf === 'HT' && minute > 38) {
      timeMod = 1.2;
    }

    const lambdaGoal =
      (baseGoalH * stateModH + baseGoalA * stateModA) *
      timeLeft *
      timeMod;

    const lambdaCorner =
      (baseCornerH * stateModH + baseCornerA * stateModA) *
      timeLeft *
      timeMod;

    const pGoal0 = poisson(lambdaGoal, 0);
    const pGoal1 = poisson(lambdaGoal, 1);

    const pGoal05 = 1 - pGoal0;
    const pGoal15 = 1 - pGoal0 - pGoal1;

    const pCorner0 = poisson(lambdaCorner, 0);
    const pCorner1 = poisson(lambdaCorner, 1);

    const pCorner05 = 1 - pCorner0;

    const pCorner10Void = pCorner1;
    const pCorner10Win = 1 - pCorner0 - pCorner1;

    const calcOdd = (prob: number) =>
      prob > 0.01 ? 1 / prob : 99;

    const oddAsiatica10 =
      pCorner10Win > 0.01
        ? (1 - pCorner10Void) / pCorner10Win
        : 99;

    const getRecommendation = (prob: number) => {
      if (prob >= 0.65) {
        return {
          status: 'APROVADO',
          conf: 'ALTA',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/20'
        };
      }

      if (prob >= 0.45) {
        return {
          status: 'MODERADO',
          conf: 'MÉDIA',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20'
        };
      }

      return {
        status: 'RISCO',
        conf: 'BAIXA',
        color: 'text-red-400',
        bg: 'bg-red-500/10 border-red-500/20'
      };
    };

    let script = '';

    const totalApRate = apRateH + apRateA;

    if (Math.abs(scoreDiff) >= 3) {
      script =
        '❄️ GAME KILL → jogo resolvido. Mercado perde intensidade.';
    } else if (totalApRate < 0.8) {
      script =
        '💤 JOGO MORNO → baixa agressividade ofensiva.';
    } else if (
      baseGoalH * stateModH >
      baseGoalA * stateModA * 2.5
    ) {
      script =
        '🔥 BLITZ MANDANTE → pressão extrema do time da casa.';
    } else if (
      baseGoalA * stateModA >
      baseGoalH * stateModH * 2.5
    ) {
      script =
        '🔥 BLITZ VISITANTE → visitante dominando ações ofensivas.';
    } else {
      script =
        '⚔️ TROCAÇÃO → jogo aberto com bom ritmo ofensivo.';
    }

    return {
      goalStats: {
        p05: Math.min(0.99, Math.max(0.01, pGoal05)),
        odd05: Math.min(99, calcOdd(pGoal05)),

        p15: Math.min(0.99, Math.max(0.01, pGoal15)),
        odd15: Math.min(99, calcOdd(pGoal15)),

        expTotal: scoreH + scoreA + lambdaGoal,

        rec: getRecommendation(pGoal05)
      },

      cornerStats: {
        p05: Math.min(0.99, Math.max(0.01, pCorner05)),
        odd05: Math.min(99, calcOdd(pCorner05)),

        p10Win: Math.min(
          0.99,
          Math.max(0.01, pCorner10Win)
        ),

        p10Void: Math.min(
          0.99,
          Math.max(0.01, pCorner10Void)
        ),

        odd10: Math.min(99, oddAsiatica10),

        expTotal: cornersH + cornersA + lambdaCorner,

        rec: getRecommendation(pCorner05)
      },

      gameScript: script
    };
  }, [
    minute,
    scoreH,
    scoreA,
    cornersH,
    cornersA,
    apH,
    apA,
    sotH,
    sotA,
    targetHalf
  ]);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-24 px-4 md:px-0 relative">
      {!isPro && (
        <ProBlurOverlay
          title="Oráculo Live"
          desc="Motor quantitativo em tempo real para precificação de gols e linhas asiáticas."
        />
      )}

      <div
        className={`space-y-6 ${
          !isPro
            ? 'pointer-events-none select-none blur-[4px] opacity-60'
            : ''
        }`}
      >
        {/* HEADER */}

        <div className="flex flex-col gap-3 mb-8">
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            ORÁCULO LIVE HFT
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-3 leading-none">
            <Eye size={34} className="text-indigo-500" />
            Oráculo Live
          </h1>

          <p className="text-sm text-slate-400 font-medium max-w-2xl leading-relaxed">
            Precificação dinâmica de mercados ao vivo
            utilizando ritmo ofensivo, pressão e
            modelagem probabilística.
          </p>
        </div>

        {/* DASHBOARD */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* GOLS */}

          <div className="bg-[#0A0A0B] border border-[#1F1F22] rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.45)] relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20 bg-orange-500 pointer-events-none" />

            <div className="flex items-center gap-2 pb-4 mb-5 border-b border-[#1B1B1D] text-[11px] uppercase tracking-[0.2em] font-black text-orange-400">
              <Goal size={14} />
              Mercado de Gols
            </div>

            <div className="grid grid-cols-2 gap-5 mb-6">
              <div className="bg-[#111214] border border-[#1F1F22] rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black mb-2">
                  Over 0.5
                </p>

                <AnimatedNumber
                  value={(goalStats.p05 * 100).toFixed(1)}
                  suffix="%"
                  className="text-4xl font-black text-white leading-none"
                />

                <div className="mt-2">
                  <AnimatedNumber
                    value={goalStats.odd05.toFixed(2)}
                    prefix="@"
                    className="text-sm font-mono font-black text-orange-400"
                  />
                </div>
              </div>

              <div className="bg-[#111214] border border-[#1F1F22] rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black mb-2">
                  Over 1.5
                </p>

                <AnimatedNumber
                  value={(goalStats.p15 * 100).toFixed(1)}
                  suffix="%"
                  className="text-4xl font-black text-white leading-none"
                />

                <div className="mt-2">
                  <AnimatedNumber
                    value={goalStats.odd15.toFixed(2)}
                    prefix="@"
                    className="text-sm font-mono font-black text-orange-400"
                  />
                </div>
              </div>
            </div>

            <div
              className={`mt-auto rounded-2xl border p-4 ${goalStats.rec.bg}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-black">
                  Projeção
                </span>

                <AnimatedNumber
                  value={goalStats.expTotal.toFixed(2)}
                  className="text-lg font-black text-orange-400"
                />
              </div>

              <p
                className={`text-xs font-black uppercase tracking-[0.18em] ${goalStats.rec.color}`}
              >
                {goalStats.rec.conf} CONFIANÇA
              </p>
            </div>
          </div>

          {/* CANTOS */}

          <div className="bg-[#0A0A0B] border border-[#1F1F22] rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.45)] relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20 bg-emerald-500 pointer-events-none" />

            <div className="flex items-center gap-2 pb-4 mb-5 border-b border-[#1B1B1D] text-[11px] uppercase tracking-[0.2em] font-black text-emerald-400">
              <Flag size={14} />
              Escanteios Asiáticos
            </div>

            <div className="grid grid-cols-2 gap-5 mb-6">
              <div className="bg-[#111214] border border-[#1F1F22] rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black mb-2">
                  Over 0.5
                </p>

                <AnimatedNumber
                  value={(cornerStats.p05 * 100).toFixed(1)}
                  suffix="%"
                  className="text-4xl font-black text-white leading-none"
                />

                <div className="mt-2">
                  <AnimatedNumber
                    value={cornerStats.odd05.toFixed(2)}
                    prefix="@"
                    className="text-sm font-mono font-black text-emerald-400"
                  />
                </div>
              </div>

              <div className="bg-[#111214] border border-[#1F1F22] rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black mb-2">
                  Asiático +1
                </p>

                <AnimatedNumber
                  value={(cornerStats.p10Win * 100).toFixed(1)}
                  suffix="%"
                  className="text-4xl font-black text-white leading-none"
                />

                <div className="mt-2">
                  <AnimatedNumber
                    value={cornerStats.odd10.toFixed(2)}
                    prefix="@"
                    className="text-sm font-mono font-black text-emerald-400"
                  />
                </div>
              </div>
            </div>

            <div
              className={`mt-auto rounded-2xl border p-4 ${cornerStats.rec.bg}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-black">
                  Projeção
                </span>

                <AnimatedNumber
                  value={cornerStats.expTotal.toFixed(2)}
                  className="text-lg font-black text-emerald-400"
                />
              </div>

              <p
                className={`text-xs font-black uppercase tracking-[0.18em] ${cornerStats.rec.color}`}
              >
                {cornerStats.rec.conf} CONFIANÇA
              </p>
            </div>
          </div>
        </div>

        {/* SCRIPT */}

        <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 rounded-[1.5rem] p-5 flex items-center gap-4 backdrop-blur-sm">
          <BarChart3
            size={20}
            className="text-indigo-400 shrink-0"
          />

          <p className="text-xs sm:text-sm text-indigo-200 font-black tracking-wide uppercase">
            {gameScript}
          </p>
        </div>

        {/* CONTROLES */}

        <div className="bg-[#0A0A0B] border border-[#1F1F22] rounded-[2rem] p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.35)]">
          {/* PRESETS */}

          <div className="flex flex-wrap gap-3 mb-8 pb-8 border-b border-[#1B1B1D]">
            <button
              onClick={() =>
                applyPreset('blitz_casa')
              }
              className="h-11 px-5 rounded-2xl bg-[#141416] border border-[#26262B] text-white text-[11px] uppercase tracking-[0.18em] font-black transition-all hover:border-indigo-500 hover:bg-indigo-500/10 active:scale-[0.98]"
            >
              Blitz Mandante
            </button>

            <button
              onClick={() =>
                applyPreset('blitz_fora')
              }
              className="h-11 px-5 rounded-2xl bg-[#141416] border border-[#26262B] text-white text-[11px] uppercase tracking-[0.18em] font-black transition-all hover:border-indigo-500 hover:bg-indigo-500/10 active:scale-[0.98]"
            >
              Blitz Visitante
            </button>

            <button
              onClick={() =>
                applyPreset('equilibrado')
              }
              className="h-11 px-5 rounded-2xl bg-[#141416] border border-[#26262B] text-white text-[11px] uppercase tracking-[0.18em] font-black transition-all hover:border-indigo-500 hover:bg-indigo-500/10 active:scale-[0.98]"
            >
              Equilibrado
            </button>
          </div>

          {/* MINUTO */}

          <div className="flex flex-col lg:flex-row gap-6 justify-between mb-10">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[11px] uppercase tracking-[0.18em] font-black text-slate-500 flex items-center gap-2">
                  <Clock size={13} />
                  Minuto Atual
                </label>

                <span className="text-indigo-400 font-mono font-black text-2xl">
                  {minute}'
                </span>
              </div>

              <input
                type="range"
                min="1"
                max={
                  targetHalf === 'HT'
                    ? 45
                    : 99
                }
                value={minute}
                onChange={(e) =>
                  setMinute(
                    Number(e.target.value)
                  )
                }
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#1C1C1F] hover:h-3 transition-all accent-indigo-500"
              />
            </div>

            {/* TOGGLE */}

            <div className="bg-[#111214] border border-[#1F1F22] rounded-2xl p-1 flex w-full sm:w-[280px]">
              <button
                onClick={() =>
                  handleHalfToggle('HT')
                }
                className={
                  targetHalf === 'HT'
                    ? 'flex-1 h-12 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-lg'
                    : 'flex-1 h-12 rounded-xl text-slate-500 hover:text-white transition-colors text-[11px] font-black uppercase tracking-[0.2em]'
                }
              >
                HT
              </button>

              <button
                onClick={() =>
                  handleHalfToggle('FT')
                }
                className={
                  targetHalf === 'FT'
                    ? 'flex-1 h-12 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-lg'
                    : 'flex-1 h-12 rounded-xl text-slate-500 hover:text-white transition-colors text-[11px] font-black uppercase tracking-[0.2em]'
                }
              >
                FT
              </button>
            </div>
          </div>

          {/* GRID TIMES */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* CASA */}

            <div className="bg-[#111214] border border-[#1F1F22] rounded-[1.5rem] p-5">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#1F1F22]">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white">
                  Time da Casa
                </h3>

                <div className="flex gap-4">
                  <span className="text-xs font-mono text-amber-400">
                    {scoreH} G
                  </span>

                  <span className="text-xs font-mono text-emerald-400">
                    {cornersH} C
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                <SliderGroup
                  label="Gols"
                  value={scoreH}
                  max={10}
                  setter={setScoreH}
                  colorClass="text-amber-400"
                />

                <SliderGroup
                  label="Escanteios"
                  value={cornersH}
                  max={25}
                  setter={setCornersH}
                  colorClass="text-emerald-400"
                />

                <SliderGroup
                  label="Ataques"
                  value={apH}
                  max={150}
                  setter={setApH}
                  colorClass="text-indigo-400"
                />

                <SliderGroup
                  label="Chutes no Alvo"
                  value={sotH}
                  max={20}
                  setter={setSotH}
                  colorClass="text-sky-400"
                />
              </div>
            </div>

            {/* VISITANTE */}

            <div className="bg-[#111214] border border-[#1F1F22] rounded-[1.5rem] p-5">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#1F1F22]">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white">
                  Time Visitante
                </h3>

                <div className="flex gap-4">
                  <span className="text-xs font-mono text-amber-400">
                    {scoreA} G
                  </span>

                  <span className="text-xs font-mono text-emerald-400">
                    {cornersA} C
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                <SliderGroup
                  label="Gols"
                  value={scoreA}
                  max={10}
                  setter={setScoreA}
                  colorClass="text-amber-400"
                />

                <SliderGroup
                  label="Escanteios"
                  value={cornersA}
                  max={25}
                  setter={setCornersA}
                  colorClass="text-emerald-400"
                />

                <SliderGroup
                  label="Ataques"
                  value={apA}
                  max={150}
                  setter={setApA}
                  colorClass="text-indigo-400"
                />

                <SliderGroup
                  label="Chutes no Alvo"
                  value={sotA}
                  max={20}
                  setter={setSotA}
                  colorClass="text-sky-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OraculoLive;