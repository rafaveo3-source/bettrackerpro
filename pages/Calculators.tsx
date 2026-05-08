import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Scale, Percent, ArrowRightLeft, 
  Target, TrendingUp, AlertTriangle, Lock, Crown, 
  Crosshair, DollarSign, Goal,
  Clock, ShieldAlert, FileText,
  PiggyBank, LineChart, Calendar, Zap, CheckCircle2,
  TrendingDown, PlusCircle, Trash2, RefreshCcw, LayoutGrid, BarChart4,
  ChevronDown, Cpu, MousePointerClick, Info, Navigation, Trophy, Skull
} from 'lucide-react';
import { useBetStore } from '../store/useBetStore';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// MÓDULOS MATEMÁTICOS & MONTE CARLO V10
// ==========================================
const factorial = (n: number): number => {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  let result = 1; for (let i = 2; i <= n; i++) result *= i;
  return result;
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const Calculators: React.FC = () => {
  const { user, currentBankrollBalance, isPro, history = [], methods = [], settings } = useBetStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'compound'|'dutching'|'kelly'|'value'|'arb'|'stake'|'odds'>('compound');

  const ProLockScreen = () => (
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden shadow-sm mt-6 w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 opacity-50" />
          <div className="bg-white dark:bg-slate-800 p-4 rounded-full mb-4 relative z-10 shadow-sm border border-slate-200 dark:border-slate-700">
              <Crown size={32} className="text-amber-500 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2 relative z-10">
              Planejamento Quantitativo PRO
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm relative z-10">
              Construa um plano de metas, simule seu crescimento e audite sua estratégia com dados reais do seu histórico para saber exatamente qual stake usar amanhã.
          </p>
          <button onClick={() => navigate('/pro')} className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 font-black py-3 px-8 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 relative z-10 uppercase tracking-widest text-xs">
              Quero ser PRO
          </button>
      </div>
  );

  // ==============================================
  // 🔥 MOTOR EXTRATOR DE ESTATÍSTICAS REAIS (COM BAD RUN E VOLUME)
  // ==============================================
  const extractedMethods = useMemo(() => {
      const stats: Record<string, { wins: number, resolved: number, totalOdds: number, dates: string[], currentLosingStreak: number, maxLosingStreak: number }> = {};
      
      const sortedHistory = [...(history || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      sortedHistory.forEach(bet => {
          const mName = (bet.method || 'Sem Método').trim();
          if (!stats[mName]) stats[mName] = { wins: 0, resolved: 0, totalOdds: 0, dates: [], currentLosingStreak: 0, maxLosingStreak: 0 };
          
          const status = String(bet.status || '').toLowerCase();
          const isWin = ['won', 'win', 'green', 'half-won', 'half_green', 'half-green', 'meio-green'].includes(status);
          const isLoss = ['lost', 'loss', 'red', 'half-lost', 'half_red', 'half-red', 'meio-red'].includes(status);

          if (isWin || isLoss) {
              stats[mName].resolved++;
              stats[mName].totalOdds += Number(bet.odds || 0);
              
              const betDate = bet.date.split('T')[0];
              if (!stats[mName].dates.includes(betDate)) {
                  stats[mName].dates.push(betDate);
              }

              if (isWin) {
                  stats[mName].wins++;
                  stats[mName].currentLosingStreak = 0;
              } else if (isLoss) {
                  stats[mName].currentLosingStreak++;
                  if (stats[mName].currentLosingStreak > stats[mName].maxLosingStreak) {
                      stats[mName].maxLosingStreak = stats[mName].currentLosingStreak;
                  }
              }
          }
      });

      return Object.entries(stats).map(([name, data]) => {
          const uniqueDays = data.dates.length;
          const realEntriesPerDay = uniqueDays > 0 ? (data.resolved / uniqueDays) : 0;

          return {
              name, 
              winRate: data.resolved > 0 ? (data.wins / data.resolved) * 100 : 0, 
              avgOdd: data.resolved > 0 ? data.totalOdds / data.resolved : 0,
              resolved: data.resolved,
              realEntriesPerDay,
              realMaxBadRun: data.maxLosingStreak
          };
      });
  }, [history]);

  // ==============================================
  // 🔥 AUTOCOMPLETE: Lista de métodos do sistema
  // ==============================================
  const availableMethodsList = useMemo(() => {
      const list = new Set<string>();
      if (Array.isArray(methods)) methods.forEach(m => list.add(typeof m === 'string' ? m : m.name));
      if (settings?.methods && Array.isArray(settings.methods)) settings.methods.forEach((m: any) => list.add(typeof m === 'string' ? m : m.name));
      if (user?.methods && Array.isArray(user.methods)) user.methods.forEach((m: any) => list.add(typeof m === 'string' ? m : m.name));
      extractedMethods.forEach(em => list.add(em.name));
      return Array.from(list).sort();
  }, [methods, settings, user, extractedMethods]);

  // ==============================================
  // 🔥 ESTADOS DO PLANEJADOR (COM PERSISTÊNCIA ABSOLUTA)
  // ==============================================
  const [autoSyncBankroll, setAutoSyncBankroll] = useState(() => localStorage.getItem('autoSyncBankroll') === 'true');
  
  const [compBankroll, setCompBankroll] = useState(() => localStorage.getItem('compBankroll') || (currentBankrollBalance > 0 ? String(currentBankrollBalance) : '1000'));
  const [compTarget, setCompTarget] = useState(() => localStorage.getItem('compTarget') || (currentBankrollBalance > 0 ? String(currentBankrollBalance * 2) : '2000'));
  const [compDays, setCompDays] = useState(() => localStorage.getItem('compDays') || '30');

  // Inicialização segura dos métodos simulados
  const [simMethods, setSimMethods] = useState(() => {
      const saved = localStorage.getItem('proPlannerMethods');
      if (saved) {
          try { return JSON.parse(saved); } catch (e) { return null; }
      }
      return [ { id: 1, name: '', winRate: 60, avgOdd: 1.85, entries: 3, stake: 2, badRun: 7, isSynced: false } ];
  });

  // Efeito de Persistência (Salva tudo instantaneamente ao alterar)
  useEffect(() => {
      localStorage.setItem('compBankroll', compBankroll);
      localStorage.setItem('compTarget', compTarget);
      localStorage.setItem('compDays', compDays);
      localStorage.setItem('proPlannerMethods', JSON.stringify(simMethods));
      localStorage.setItem('autoSyncBankroll', String(autoSyncBankroll));
  }, [compBankroll, compTarget, compDays, simMethods, autoSyncBankroll]);

  useEffect(() => {
      if (autoSyncBankroll) {
          setCompBankroll(String(currentBankrollBalance));
      }
  }, [currentBankrollBalance, autoSyncBankroll]);

  const handleBankrollManualChange = (val: string) => {
      setCompBankroll(val);
      setAutoSyncBankroll(false); 
  };

  const bankrollNum = parseFloat(compBankroll) || 0;
  const targetNum = parseFloat(compTarget) || 0;
  const daysNum = parseFloat(compDays) || 1;

  // LÓGICA DE EVENTOS EXTREMOS (QUEBRA DE BANCA E META BATIDA)
  const isBankrollBusted = bankrollNum <= 1 && compBankroll !== ''; // Banca menor ou igual a 1 real (Quebrado)
  const isTargetReached = bankrollNum >= targetNum && targetNum > 0;
  const progressPercent = targetNum > 0 ? Math.min(100, Math.max(0, (bankrollNum / targetNum) * 100)) : 0;

  const addSimMethod = () => {
      setSimMethods([...simMethods, { id: Date.now(), name: '', winRate: 60, avgOdd: 1.85, entries: 2, stake: 2, badRun: 7, isSynced: false }]);
  };
  
  const removeSimMethod = (id: number) => setSimMethods(simMethods.filter(m => m.id !== id));

  const updateSimMethod = (id: number, field: string, value: string) => {
      setSimMethods(simMethods.map(m => {
          if (m.id !== id) return m;
          
          let updatedMethod = { ...m, [field]: field === 'name' ? value : Number(value) };
          
          if (field === 'name') {
              const cleanValue = value.replace(/ \(\d+ entr.*\)/g, '').trim();
              updatedMethod.name = cleanValue;

              const historicalData = extractedMethods.find(ex => ex.name.toLowerCase() === cleanValue.toLowerCase());
              
              if (historicalData && historicalData.resolved >= 10) {
                  updatedMethod.winRate = Number(historicalData.winRate.toFixed(1));
                  updatedMethod.avgOdd = Number(historicalData.avgOdd.toFixed(2));
                  updatedMethod.entries = Math.max(1, Math.round(historicalData.realEntriesPerDay));
                  updatedMethod.badRun = Math.max(5, historicalData.realMaxBadRun);
                  updatedMethod.isSynced = true;
              } else {
                  updatedMethod.isSynced = false;
              }
          } else if (['winRate', 'avgOdd', 'entries', 'badRun'].includes(field)) {
              updatedMethod.isSynced = false;
          }

          return updatedMethod;
      }));
  };

  // ==============================================
  // 🔥 BOTÃO DE CHOQUE DE REALIDADE (SYNC INTELIGENTE)
  // ==============================================
  const handleAutoFill = () => {
      let smallSampleWarnings = 0;

      const updatedMethods = simMethods.map(m => {
          if (!m.name || m.name.trim() === '') return m; 

          const historyData = extractedMethods.find(ex => ex.name.toLowerCase() === m.name.toLowerCase().trim());

          if (!historyData || historyData.resolved === 0) return { ...m, isSynced: false };

          if (historyData.resolved < 10) {
              smallSampleWarnings++;
              return { ...m, isSynced: false }; 
          }

          return {
              ...m,
              winRate: Number(historyData.winRate.toFixed(1)),
              avgOdd: Number(historyData.avgOdd.toFixed(2)),
              entries: Math.max(1, Math.round(historyData.realEntriesPerDay)),
              badRun: Math.max(5, historyData.realMaxBadRun),
              isSynced: true
          };
      });

      setSimMethods(updatedMethods);

      if (smallSampleWarnings > 0) {
          alert(`Alguns métodos possuem menos de 10 entradas concluídas no Diário.\n\nPara evitar distorções de curto prazo, o sistema respeitou a validação externa (manual) que você digitou.\nContinue registrando suas entradas!`);
      }
  };

  // ==============================================
  // 🔥 MOTOR DE CÁLCULO, PROJEÇÃO E RISCO DE RUÍNA
  // ==============================================
  const dailyGrowthNeededRaw = bankrollNum > 0 && targetNum > bankrollNum && !isTargetReached ? (Math.pow(targetNum / bankrollNum, 1 / daysNum) - 1) : 0;
  const dailyGrowthNeededPct = dailyGrowthNeededRaw * 100;
  const dailyTargetMoney = bankrollNum * dailyGrowthNeededRaw;

  const processedMethods = simMethods.map(m => {
      const evRaw = (m.winRate / 100 * m.avgOdd) - 1;
      const evPct = evRaw * 100;
      
      let safeStakePct = 0;
      if (evRaw > 0 && m.avgOdd > 1) {
          const kellyRaw = evRaw / (m.avgOdd - 1); 
          safeStakePct = Math.min((kellyRaw / 4) * 100, 5.0); 
      }

      let requiredStakePct = 0;
      if (evRaw > 0 && m.entries > 0 && !isTargetReached) {
          requiredStakePct = (dailyGrowthNeededRaw / (evRaw * m.entries)) * 100;
      }

      const currentStakeValue = bankrollNum * (m.stake / 100);
      const evMoney = currentStakeValue * evRaw;

      const drawdownRiskMoney = currentStakeValue * (m.badRun || 5);
      const drawdownRiskPct = bankrollNum > 0 ? (drawdownRiskMoney / bankrollNum) * 100 : 0;
      
      let riskBadge = null;
      if (evRaw <= 0) {
          riskBadge = <span className="text-[9px] font-black text-red-500 uppercase bg-red-500/10 px-1 py-0.5 rounded">EV Negativo</span>;
      } else if (drawdownRiskPct >= 50) {
          riskBadge = <span className="text-[9px] font-black text-red-500 uppercase bg-red-500/10 px-1 py-0.5 rounded flex items-center justify-center gap-0.5"><AlertTriangle size={8}/> Risco Ruína</span>;
      } else if (m.stake > safeStakePct * 2) {
          riskBadge = <span className="text-[9px] font-black text-amber-500 uppercase bg-amber-500/10 px-1 py-0.5 rounded">Risco Alto</span>;
      } else {
          riskBadge = <span className="text-[9px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-1 py-0.5 rounded">Gestão Segura</span>;
      }

      const dailyGrowth = evRaw * (m.stake / 100) * m.entries * 100;

      return { 
          ...m, 
          evPct, evMoney, safeStakePct, requiredStakePct, dailyGrowth, 
          stakeValue: currentStakeValue, riskBadge, drawdownRiskMoney, drawdownRiskPct 
      };
  });

  const aggregateDailyGrowth = processedMethods.reduce((acc, m) => acc + m.dailyGrowth, 0);
  const projectedBankroll = bankrollNum * Math.pow(1 + (aggregateDailyGrowth / 100), daysNum);
  const isGoalAchievable = aggregateDailyGrowth >= dailyGrowthNeededPct && targetNum > bankrollNum;

  // 🌟 LÓGICA DO GPS: RECÁLCULO DA ROTA (ETA Dinâmico)
  let etaText = "";
  let etaColor = "";
  
  if (isTargetReached) {
     etaText = "ALVO ALCANÇADO!";
     etaColor = "text-emerald-500 dark:text-emerald-400";
  } else if (isBankrollBusted) {
     etaText = "BANCA QUEBRADA!";
     etaColor = "text-red-500 dark:text-red-500";
  } else if (aggregateDailyGrowth <= 0) {
     etaText = "Crescimento Nulo/Negativo";
     etaColor = "text-red-500 dark:text-red-400";
  } else {
     const estimatedDays = Math.ceil(Math.log(targetNum / bankrollNum) / Math.log(1 + aggregateDailyGrowth / 100));
     const diff = estimatedDays - daysNum;
     
     if (diff <= 0) {
         etaText = `Estimativa: ${estimatedDays} dias (${Math.abs(diff)} dias adiantado 🚀)`;
         etaColor = "text-emerald-500 dark:text-emerald-400";
     } else {
         etaText = `Estimativa: ${estimatedDays} dias (${diff} dias de atraso ⚠️)`;
         etaColor = "text-amber-500 dark:text-amber-400";
     }
  }

  // ==============================================
  // 🔥 GRÁFICO DE PROJEÇÃO SVG NATIVO
  // ==============================================
  const generateChartPoints = () => {
      const pointsTarget = [];
      const pointsProjected = [];
      const width = 1000;
      const height = 200;
      
      const maxY = Math.max(targetNum, projectedBankroll) * 1.1;
      const minY = bankrollNum * 0.9;
      const rangeY = maxY - minY || 1;

      for (let day = 0; day <= daysNum; day++) {
          const x = (day / daysNum) * width;
          
          const yTVal = bankrollNum * Math.pow(1 + dailyGrowthNeededRaw, day);
          const yT = height - ((yTVal - minY) / rangeY) * height;
          pointsTarget.push(`${x},${yT}`);

          const yPVal = bankrollNum * Math.pow(1 + (aggregateDailyGrowth / 100), day);
          const yP = height - ((yPVal - minY) / rangeY) * height;
          pointsProjected.push(`${x},${yP}`);
      }

      return { target: pointsTarget.join(' '), projected: pointsProjected.join(' ') };
  };

  const chartPaths = generateChartPoints();

  // ==============================================
  // OUTRAS CALCULADORAS MANTIDAS
  // ==============================================
  const [dutchTotalStake, setDutchTotalStake] = useState('100');
  const [dutchSelections, setDutchSelections] = useState([{ id: 1, name: 'Seleção A', odds: '2.50', stake: 0, profit: 0 }, { id: 2, name: 'Seleção B', odds: '3.20', stake: 0, profit: 0 }]);
  const addDutchSelection = () => setDutchSelections([...dutchSelections, { id: Date.now(), name: `Seleção ${String.fromCharCode(65 + dutchSelections.length)}`, odds: '', stake: 0, profit: 0 }]);
  const removeDutchSelection = (id: number) => setDutchSelections(dutchSelections.filter(s => s.id !== id));
  const calculateDutching = () => {
    const totalStake = parseFloat(dutchTotalStake); if (!totalStake || totalStake <= 0) return;
    const impliedProbs = dutchSelections.map(s => parseFloat(s.odds) > 1 ? 1 / parseFloat(s.odds) : 0);
    const totalImplied = impliedProbs.reduce((a, b) => a + b, 0); if (totalImplied <= 0) return;
    setDutchSelections(dutchSelections.map((s, i) => {
      const stake = totalStake * (impliedProbs[i] / totalImplied); const odd = parseFloat(s.odds || '0');
      return { ...s, stake: stake || 0, profit: odd > 1 ? (stake * odd) - totalStake : 0 };
    }));
  };

  const [kellyOdds, setKellyOdds] = useState('2.00'); const [kellyProb, setKellyProb] = useState('55'); const [kellyFraction, setKellyFraction] = useState('1'); 
  const kellyResult = (() => { const b = parseFloat(kellyOdds) - 1; const p = parseFloat(kellyProb) / 100; if (b <= 0) return "0.00"; return (((b * p - (1 - p)) / b) * parseFloat(kellyFraction) * 100).toFixed(2); })();
  const kellyMoney = (parseFloat(kellyResult) / 100) * (currentBankrollBalance || 0);

  const [valOdds, setValOdds] = useState('2.10'); const [valProb, setValProb] = useState('50'); 
  const valEV = (parseFloat(valProb) / 100 * parseFloat(valOdds)) - 1; const valEVPercent = valEV * 100;

  const [arbOdds1, setArbOdds1] = useState('2.05'); const [arbOdds2, setArbOdds2] = useState('2.05'); const [arbTotalStake, setArbTotalStake] = useState('1000');
  const arbImplied = (1 / parseFloat(arbOdds1)) + (1 / parseFloat(arbOdds2)); const arbRoi = ((1 / arbImplied) - 1) * 100;
  const arbStake1 = (parseFloat(arbTotalStake) * (1 / parseFloat(arbOdds1))) / arbImplied; const arbStake2 = (parseFloat(arbTotalStake) * (1 / parseFloat(arbOdds2))) / arbImplied;
  const arbProfit = (arbStake1 * parseFloat(arbOdds1)) - parseFloat(arbTotalStake);

  const [stakePercentState, setStakePercentState] = useState('1'); const stakeValue = (parseFloat(stakePercentState) / 100) * (currentBankrollBalance || 0);
  const [convDec, setConvDec] = useState('2.00'); const [convAm, setConvAm] = useState('+100'); const [convProb, setConvProb] = useState('50.00');
  const handleDecChange = (val: string) => { setConvDec(val); const d = parseFloat(val); if (d > 1) { setConvProb(((1 / d) * 100).toFixed(2)); setConvAm(d >= 2 ? '+' + ((d - 1) * 100).toFixed(0) : (( -100 / (d - 1) )).toFixed(0)); } };

  const tabs = [
    { id: 'compound', label: 'Plano de Metas', pro: true, highlight: true }, 
    { id: 'dutching', label: 'Dutching', pro: false }, 
    { id: 'kelly', label: 'Kelly', pro: false },
    { id: 'value', label: 'Value Bet', pro: true }, 
    { id: 'arb', label: 'Arbitragem', pro: true },
    { id: 'stake', label: 'Stake %', pro: false }, 
    { id: 'odds', label: 'Odds Conv.', pro: false }
  ];

  const inputClass = "bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 text-slate-900 dark:text-white px-2 py-1 outline-none font-mono text-sm w-full text-center transition-colors";

  return (
    <div className="space-y-6 pb-20 w-full overflow-x-hidden">
        
      <datalist id="methods-list">
          {availableMethodsList.map(name => {
              const hist = extractedMethods.find(ex => ex.name.toLowerCase() === name.toLowerCase());
              return <option key={name} value={name}>{hist && hist.resolved >= 10 ? ` (${hist.resolved} entradas)` : ''}</option>;
          })}
      </datalist>

      <div className="flex flex-col gap-2 px-4 md:px-0">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
            Strategic Math Engine
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Calculadoras Pro <span className="text-slate-300 dark:text-slate-700 text-lg">///</span>
          </h1>
      </div>
      
      <div className="flex flex-wrap md:grid md:grid-cols-4 xl:grid-cols-7 gap-2 mb-6 px-4 md:px-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative flex-1 min-w-[90px] flex items-center justify-center px-2 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all gap-1.5 ${
              activeTab === tab.id
                ? (tab.highlight ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20')
                : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            {tab.pro && !isPro && <Lock size={12} className="opacity-50" />}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
        <div className="lg:col-span-2 space-y-6 min-w-0 w-full">
            
            {/* ========================================== */}
            {/* 🔥 ABA: PLANEJADOR DE METAS PRO 🔥 */}
            {/* ========================================== */}
            {activeTab === 'compound' && !isPro && <ProLockScreen />}
            {activeTab === 'compound' && isPro && (
                <div className="space-y-6">
                    {/* CARD 1: O ALVO E A BANCA (COM AUTO-SYNC E PROGRESS BAR) */}
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-1.5"><LayoutGrid size={14}/> Dashboard Base</span>
                                    {!isTargetReached && !isBankrollBusted && (
                                        <button 
                                            onClick={() => setAutoSyncBankroll(!autoSyncBankroll)} 
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] transition-colors ${autoSyncBankroll ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                            title="Sincronizará a banca da calculadora com sua banca real sempre que houver um green ou red."
                                        >
                                            <RefreshCcw size={10} className={autoSyncBankroll ? 'animate-spin-slow' : ''} /> 
                                            {autoSyncBankroll ? 'Auto-Sync ON' : 'Auto-Sync OFF'}
                                        </button>
                                    )}
                                </p>
                                <div className="flex items-end gap-3 mt-4">
                                    <div className="w-full">
                                        <p className="text-[9px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                                            Banca (Base para Juros Compostos)
                                        </p>
                                        <input type="number" value={compBankroll} onChange={e => handleBankrollManualChange(e.target.value)} className={`bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 text-2xl font-black rounded-xl px-4 py-2 w-full outline-none focus:border-indigo-500 transition-colors ${autoSyncBankroll && !isTargetReached && !isBankrollBusted ? 'text-emerald-600 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'text-slate-900 dark:text-white'}`} />
                                    </div>
                                </div>

                                {/* Barra de Progresso Visual */}
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-4 overflow-hidden shadow-inner">
                                    <div className={`h-full transition-all duration-1000 ${isBankrollBusted ? 'bg-red-500 w-full' : isTargetReached ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: isBankrollBusted ? '100%' : `${progressPercent}%` }}></div>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 text-right">{progressPercent.toFixed(1)}% concluído</p>
                            </div>

                            <div className="flex gap-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Meta Desejada</label>
                                    <input type="number" value={compTarget} onChange={e => setCompTarget(e.target.value)} className="bg-transparent text-xl font-black text-amber-500 outline-none w-full" />
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Prazo (Dias)</label>
                                    <input type="number" value={compDays} onChange={e => setCompDays(e.target.value)} className="bg-transparent text-xl font-black text-emerald-600 dark:text-emerald-400 outline-none w-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD STATUS EXTREMOS (VITÓRIA OU QUEBRA) */}
                    <AnimatePresence>
                        {isTargetReached && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500 text-white rounded-[2rem] p-8 shadow-xl shadow-emerald-500/20 flex flex-col sm:flex-row items-center gap-6 mb-6">
                                <div className="bg-white/20 p-4 rounded-full">
                                    <Trophy size={48} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Meta Batida com Sucesso!</h3>
                                    <p className="text-emerald-50 font-medium leading-relaxed">Você transformou sua banca e atingiu o objetivo. A magia dos Juros Compostos terminou o ciclo. Saque seus lucros, redefina a Meta Desejada e inicie um novo plano para voltar a simular.</p>
                                </div>
                            </motion.div>
                        )}

                        {isBankrollBusted && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-600 text-white rounded-[2rem] p-8 shadow-xl shadow-red-500/20 flex flex-col sm:flex-row items-center gap-6 mb-6">
                                <div className="bg-white/20 p-4 rounded-full">
                                    <Skull size={48} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Banca Quebrada 💥</h3>
                                    <p className="text-red-100 font-medium leading-relaxed">O capital atual não possui liquidez matemática para sustentar a projeção desta meta. Você foi pego por uma Bad Run severa ou usou stakes fora da gestão. Faça um novo aporte para reiniciar a estratégia.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* OCULTA AS OPERAÇÕES SE A META BATEU OU QUEBROU */}
                    {!isTargetReached && !isBankrollBusted && (
                        <>
                            {/* CARD 2: RESULTADO MATEMÁTICO (PLANO DE AÇÃO) E GPS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col justify-center relative overflow-hidden">
                                    <Navigation className="absolute bottom-0 right-0 w-40 h-40 text-slate-100 dark:text-slate-800/50 -mb-10 -mr-10 pointer-events-none" />
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 relative z-10 flex items-center gap-1.5"><Navigation size={12}/> GPS de Crescimento</p>
                                    <h3 className={`text-xl sm:text-2xl font-black mb-2 relative z-10 ${etaColor}`}>
                                        {etaText}
                                    </h3>
                                    <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400 relative z-10">
                                        Para manter o curso da meta estipulada, seu lucro <strong className="text-emerald-500">Hoje (Dia 1)</strong> precisa ser de no mínimo <strong>+R$ {dailyTargetMoney.toFixed(2)}</strong>.
                                    </p>
                                </div>

                                <div className={`rounded-[2rem] p-6 flex flex-col justify-center border shadow-sm ${
                                    isGoalAchievable 
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' 
                                    : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
                                }`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isGoalAchievable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>A Meta de Hoje (Dia 1)</p>
                                    <h3 className={`text-2xl font-black mb-2 ${isGoalAchievable ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                                        Fazer + R$ {dailyTargetMoney.toFixed(2)}
                                    </h3>
                                    <p className={`text-xs font-medium leading-relaxed ${isGoalAchievable ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-red-600/80 dark:text-red-400/80'}`}>
                                        Sua meta global exige crescimento de <strong>{dailyGrowthNeededPct.toFixed(2)}% ao dia</strong>. 
                                        {isGoalAchievable ? ` Sua estratégia projetou ${aggregateDailyGrowth.toFixed(2)}%. A meta de hoje é realista. Execute o volume planejado.` : ` Sua estratégia atual não alcança essa meta. Aumente o volume, as odds, ou aplique a Stake Necessária (se for segura).`}
                                    </p>
                                </div>
                            </div>

                            {/* CARD 3: A PLANILHA DE MÉTODOS EDITÁVEL */}
                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm overflow-hidden">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><BarChart4 size={16} className="text-indigo-500"/> Simulador de Cenários & Risco</h3>
                                        <p className="text-[10px] text-slate-500 mt-1">A coluna "Aposte Isso" te diz o valor exato da Próxima Entrada.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleAutoFill} className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"><RefreshCcw size={12}/> Auditar Dados</button>
                                        <button onClick={addSimMethod} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"><PlusCircle size={14}/> Add Método</button>
                                    </div>
                                </div>
                                
                                <div className="overflow-x-auto custom-scrollbar pb-2">
                                    <table className="w-full text-left min-w-[1050px]">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-800 text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                                                <th className="pb-3 pl-2 w-48">Método (Digite ou Selecione)</th>
                                                <th className="pb-3 text-center w-20">Win Rate (%)</th>
                                                <th className="pb-3 text-center w-20">Odd Média</th>
                                                <th className="pb-3 text-center w-20">Entr./Dia</th>
                                                <th className="pb-3 text-center w-24" title="Quantos Reds seguidos você aceita tomar antes de reavaliar?">Max Bad Run</th>
                                                <th className="pb-3 text-center w-28 text-indigo-500">EV Esperado em R$</th>
                                                <th className="pb-3 text-center w-24">Stake p/ Meta (%)</th>
                                                <th className="pb-3 text-center w-20">Sua Stake (%)</th>
                                                <th className="pb-3 text-center text-emerald-500 w-28">Aposte Isso (R$)</th>
                                                <th className="pb-3 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <AnimatePresence>
                                                {processedMethods.map((m) => (
                                                    <motion.tr initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={m.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group">
                                                        
                                                        <td className="py-3 pl-2">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="relative">
                                                                    <input 
                                                                        list="methods-list"
                                                                        value={m.name} 
                                                                        onChange={e => updateSimMethod(m.id, 'name', e.target.value)} 
                                                                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg font-black text-xs w-full outline-none focus:border-indigo-500 pr-8"
                                                                        placeholder="Ex: Oportunista..."
                                                                    />
                                                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                                </div>
                                                                {m.isSynced ? (
                                                                    <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">● Histórico Validado</span>
                                                                ) : (
                                                                    <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">● Simulação</span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="py-3 px-1"><input type="number" value={m.winRate} onChange={e => updateSimMethod(m.id, 'winRate', e.target.value)} className={inputClass} /></td>
                                                        <td className="py-3 px-1"><input type="number" step="0.01" value={m.avgOdd} onChange={e => updateSimMethod(m.id, 'avgOdd', e.target.value)} className={inputClass} /></td>
                                                        <td className="py-3 px-1"><input type="number" min="1" value={m.entries} onChange={e => updateSimMethod(m.id, 'entries', e.target.value)} className={inputClass} /></td>

                                                        <td className="py-3 px-1">
                                                            <div className="flex flex-col items-center">
                                                                <div className="flex items-center gap-1">
                                                                    <input type="number" min="1" value={m.badRun || 5} onChange={e => updateSimMethod(m.id, 'badRun', e.target.value)} className={`${inputClass} !text-red-500 dark:!text-red-400 !px-1`} title="Insira a Bad Run (Reds seguidos) esperada" />
                                                                    <span className="text-[10px] font-bold text-slate-500">Reds</span>
                                                                </div>
                                                                <span className="text-[9px] font-bold text-red-500 mt-1" title="Drawdown Máximo Estimado">
                                                                    -R$ {m.drawdownRiskMoney.toFixed(0)} ({m.drawdownRiskPct.toFixed(0)}%)
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="py-3 px-1 text-center">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${m.evPct > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
                                                                    {m.evPct > 0 ? '+' : ''}{m.evPct.toFixed(1)}%
                                                                </span>
                                                                <span className="text-[9px] text-slate-500 font-bold mt-1 tracking-widest">
                                                                    {m.evMoney > 0 ? '+' : ''} R$ {m.evMoney.toFixed(2)}/bet
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="py-3 px-1 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <span className={`font-mono font-black text-sm ${m.requiredStakePct > m.safeStakePct ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                                    {m.evPct > 0 ? m.requiredStakePct.toFixed(1) + '%' : 'N/A'}
                                                                </span>
                                                                {m.evPct > 0 && (
                                                                    <button onClick={() => updateSimMethod(m.id, 'stake', String(m.requiredStakePct.toFixed(1)))} className="text-[8px] uppercase tracking-widest text-slate-400 hover:text-indigo-500 mt-0.5 flex items-center gap-1">
                                                                        <MousePointerClick size={10}/> Aplicar
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="py-3 px-1">
                                                            <div className="flex flex-col items-center">
                                                                <input type="number" step="0.1" value={m.stake} onChange={e => updateSimMethod(m.id, 'stake', e.target.value)} className={inputClass} />
                                                                <div className="mt-1 w-full text-center flex justify-center">{m.riskBadge}</div>
                                                            </div>
                                                        </td>
                                                        
                                                        <td className="py-3 px-1 text-center">
                                                            <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 py-2 px-3 rounded-xl font-black font-mono text-base border border-emerald-100 dark:border-emerald-500/20 shadow-inner">
                                                                R$ {m.stakeValue.toFixed(2)}
                                                            </div>
                                                        </td>

                                                        <td className="py-3 pr-2 text-right">
                                                            <button onClick={() => removeSimMethod(m.id)} className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={14}/></button>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* CARD 4: GRÁFICO SVG NATIVO */}
                            <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                                <div className="relative z-10 flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Crescimento Exponencial</p>
                                        <h3 className="text-3xl font-black text-white">R$ {projectedBankroll.toFixed(2)} <span className="text-sm text-indigo-300 font-medium">projetado em {daysNum} dias</span></h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] uppercase font-bold text-slate-400 flex items-center justify-end gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Curva da Meta</p>
                                        <p className="text-[9px] uppercase font-bold text-slate-400 flex items-center justify-end gap-1 mt-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Projeção Real</p>
                                    </div>
                                </div>
                                
                                <div className="relative w-full h-[150px] mt-auto">
                                    <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                                        {/* Linha da Meta (Amber) */}
                                        <polyline fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,5" points={chartPaths.target} />
                                        {/* Linha da Projeção Real (Indigo) */}
                                        <polyline fill="none" stroke="#6366f1" strokeWidth="4" points={chartPaths.projected} />
                                    </svg>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ========================================== */}
            {/* OUTRAS CALCULADORAS MANTIDAS INTACTAS      */}
            {/* ========================================== */}
            {activeTab === 'dutching' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm w-full overflow-hidden">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-4">Calculadora Dutching</h2>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 w-full mb-6">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest pl-1">Total Stake</span>
                        <input type="number" value={dutchTotalStake} onChange={(e) => setDutchTotalStake(e.target.value)} className="bg-transparent text-right w-full font-mono font-bold outline-none text-slate-900 dark:text-white text-lg" />
                    </div>
                    <div className="space-y-3">
                        {dutchSelections.map((sel, idx) => (
                            <div key={sel.id} className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 grid grid-cols-12 gap-2 items-center shadow-sm dark:shadow-none">
                                <div className="col-span-1 text-xs font-bold text-slate-400">{String.fromCharCode(65 + idx)}</div>
                                <div className="col-span-5"><input type="text" value={sel.name} onChange={e => { const n = [...dutchSelections]; n[idx].name = e.target.value; setDutchSelections(n); }} className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200" /></div>
                                <div className="col-span-3"><input type="number" value={sel.odds} onChange={e => { const n = [...dutchSelections]; n[idx].odds = e.target.value; setDutchSelections(n); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm font-mono text-center text-slate-900 dark:text-white" placeholder="Odds" /></div>
                                <div className="col-span-3 text-right">
                                    <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">R$ {sel.stake.toFixed(2)}</p>
                                    <button onClick={() => removeDutchSelection(sel.id)} className="text-[9px] text-red-500 dark:text-red-400 hover:underline mt-1">Remover</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex gap-3">
                        <button onClick={addDutchSelection} className="flex-1 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-bold uppercase transition-colors"><Plus size={14} className="inline mr-1"/> Add Seleção</button>
                        <button onClick={calculateDutching} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase shadow-lg shadow-emerald-600/20 transition-all active:scale-95">Calcular</button>
                    </div>
                </div>
            )}

            {activeTab === 'kelly' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm w-full overflow-hidden">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-6">Critério de Kelly</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Banca</label>
                             <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-transparent">R$ {currentBankrollBalance.toFixed(2)}</div>
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Fração</label>
                             <select value={kellyFraction} onChange={e => setKellyFraction(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-transparent text-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none">
                                <option value="1">100%</option>
                                <option value="0.5">50%</option>
                                <option value="0.25">25%</option>
                               </select>
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Odds</label>
                             <input type="number" value={kellyOdds} onChange={e => setKellyOdds(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-bold outline-none border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Probabilidade %</label>
                             <input type="number" value={kellyProb} onChange={e => setKellyProb(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-bold outline-none border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
                        </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl text-center border border-purple-200 dark:border-purple-500/20">
                        <p className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-1">Stake Recomendada</p>
                        <h3 className="text-4xl font-black text-purple-700 dark:text-purple-400">{parseFloat(kellyResult) > 0 ? kellyResult : '0.00'}%</h3>
                        <p className="text-sm font-mono text-purple-800 dark:text-purple-300 mt-2 bg-purple-100 dark:bg-purple-500/20 inline-block px-3 py-1 rounded font-bold">R$ {parseFloat(kellyResult) > 0 ? kellyMoney.toFixed(2) : '0.00'}</p>
                    </div>
                </div>
            )}

            {activeTab === 'value' && !isPro && <ProLockScreen />}
            {activeTab === 'value' && isPro && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                   <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-6 flex items-center gap-2"><Target size={20} className="text-emerald-500"/> Value Bet Finder</h2>
                   <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Sua Odds</label>
                          <input type="number" value={valOdds} onChange={e => setValOdds(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-bold outline-none border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Probabilidade Real %</label>
                          <input type="number" value={valProb} onChange={e => setValProb(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-bold outline-none border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
                      </div>
                   </div>
                   <div className={`p-6 rounded-2xl border text-center ${valEV > 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/20'}`}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70 text-slate-700 dark:text-slate-300">Valor Esperado (EV)</p>
                      <h3 className={`text-4xl font-black ${valEV > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500'}`}>
                        {valEV > 0 ? '+' : ''}{valEVPercent.toFixed(2)}%
                      </h3>
                      <p className={`text-xs mt-2 font-bold ${valEV > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {valEV > 0 ? '✅ Aposta de Valor Encontrada' : '❌ Odds sem valor estatístico'}
                      </p>
                   </div>
                </div>
            )}

            {activeTab === 'arb' && !isPro && <ProLockScreen />}
            {activeTab === 'arb' && isPro && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                   <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-6 flex items-center gap-2"><Scale size={20} className="text-blue-500"/> Arbitragem (2-Way)</h2>
                   <div className="mb-4">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Investimento Total (R$)</label>
                      <input type="number" value={arbTotalStake} onChange={e => setArbTotalStake(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-bold outline-none border border-slate-200 dark:border-slate-800 text-lg text-slate-900 dark:text-white" />
                   </div>
                   <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Casa A (Odds)</label>
                          <input type="number" value={arbOdds1} onChange={e => setArbOdds1(e.target.value)} className="w-full bg-transparent font-mono font-black text-xl outline-none text-slate-900 dark:text-white" />
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                             <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400">Apostar:</p>
                             <p className="text-emerald-600 dark:text-emerald-500 font-bold">R$ {isFinite(arbStake1) ? arbStake1.toFixed(2) : '0.00'}</p>
                          </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Casa B (Odds)</label>
                          <input type="number" value={arbOdds2} onChange={e => setArbOdds2(e.target.value)} className="w-full bg-transparent font-mono font-black text-xl outline-none text-slate-900 dark:text-white" />
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                             <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400">Apostar:</p>
                             <p className="text-emerald-600 dark:text-emerald-500 font-bold">R$ {isFinite(arbStake2) ? arbStake2.toFixed(2) : '0.00'}</p>
                          </div>
                      </div>
                   </div>
                   <div className={`p-4 rounded-xl flex justify-between items-center ${arbRoi > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      <span className="font-bold uppercase text-xs tracking-widest">Lucro Garantido (ROI)</span>
                      <span className="font-black text-xl">{arbRoi.toFixed(2)}%</span>
                   </div>
                   {arbRoi > 0 && <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">Lucro líquido: R$ {arbProfit.toFixed(2)}</p>}
                </div>
            )}

            {activeTab === 'stake' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                   <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-6 flex items-center gap-2"><Percent size={20} className="text-orange-500"/> Calculadora Stake Fixa</h2>
                   <div className="mb-6">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Porcentagem da Banca (%)</label>
                      <input type="number" value={stakePercentState} onChange={e => setStakePercentState(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-black text-3xl outline-none border border-slate-200 dark:border-slate-800 text-center text-orange-500" />
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Valor da Aposta</p>
                      <h3 className="text-4xl font-black text-slate-900 dark:text-white">R$ {stakeValue.toFixed(2)}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Baseado na banca atual de R$ {currentBankrollBalance.toFixed(2)}</p>
                   </div>
                </div>
            )}

            {activeTab === 'odds' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                   <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-6 flex items-center gap-2"><ArrowRightLeft size={20} className="text-indigo-500"/> Conversor Universal</h2>
                   <div className="space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Decimal (Eu/Br)</label>
                          <input type="number" value={convDec} onChange={e => handleDecChange(e.target.value)} className="bg-transparent text-right font-mono font-black text-lg outline-none w-24 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Americana (US)</label>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{convAm}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Probabilidade Implícita</label>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{convProb}%</span>
                      </div>
                   </div>
                </div>
            )}
            
        </div>

        {/* SIDEBAR DE INFORMAÇÕES */}
        <div className="lg:col-span-1 space-y-6 w-full min-w-0">
            <div className="bg-white dark:bg-[#0f172a] rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm sticky top-6">
                <h4 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">A Máquina de Gestão</h4>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 uppercase font-bold tracking-wider">Como Operar:</p>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                        1. Ative o botão <strong className="text-emerald-500">Auto-Sync</strong> no Dashboard para que a banca base mude sempre que você tomar um Green ou Red.
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                        2. Digite sua Bad Run esperada (ex: 5). O motor avalia se a sua stake vai causar <strong className="text-red-500">Risco de Ruína</strong> (-R$) consumindo sua banca.
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        3. Pegue o valor exato na coluna <strong className="text-emerald-500">"Aposte Isso"</strong>. Como a banca auto-sincroniza, esse valor muda a cada nova aposta. Você está operando juros compostos reais.
                    </p>
                </div>
            </div>
        </div> 

      </div> 
    </div> 
  );
};

export default Calculators;