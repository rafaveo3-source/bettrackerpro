import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Scale, Percent, ArrowRightLeft, 
  Target, TrendingUp, AlertTriangle, Lock, Crown, 
  Crosshair, DollarSign, Goal,
  Clock, ShieldAlert, FileText,
  PiggyBank, LineChart, Calendar, Zap, CheckCircle2,
  TrendingDown, PlusCircle, Trash2, RefreshCcw, LayoutGrid, BarChart4,
  ChevronDown, Cpu, MousePointerClick, Info, Navigation, Trophy, Skull, Coins, Lightbulb, CloudLightning
} from 'lucide-react';
import { useBetStore, supabase } from '../store/useBetStore';
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
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // 🔥 OVERLAY DE VITRINE (EFEITO BLUR) PARA USUÁRIOS FREE 🔥
  const ProBlurOverlay = ({ title, desc }: { title: string, desc: string }) => (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 dark:bg-[#020617]/50 backdrop-blur-md rounded-2xl">
          <div className="bg-white dark:bg-[#1C1C1E] border border-emerald-500/30 p-8 rounded-2xl max-w-md text-center shadow-xl flex flex-col items-center mx-4">
              <div className="bg-emerald-500/10 p-4 rounded-xl mb-4 text-emerald-600 dark:text-emerald-400">
                  <Crown size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                  {title} <span className="text-emerald-500">PRO</span>
              </h2>
              <p className="text-slate-500 dark:text-[#8E8E93] mb-6 text-sm leading-relaxed">
                  {desc}
              </p>
              <button onClick={() => navigate('/pro')} className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold py-3.5 px-8 rounded-xl transition-all shadow-sm text-xs tracking-widest uppercase">
                  Desbloquear Acesso
              </button>
          </div>
      </div>
  );

  // ==============================================
  // 🔥 MOTOR EXTRATOR DE ESTATÍSTICAS REAIS
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

  const availableMethodsList = useMemo(() => {
      const list = new Set<string>();
      if (Array.isArray(methods)) methods.forEach(m => list.add(typeof m === 'string' ? m : m.name));
      if (settings?.methods && Array.isArray(settings.methods)) settings.methods.forEach((m: any) => list.add(typeof m === 'string' ? m : m.name));
      if (user?.methods && Array.isArray(user.methods)) user.methods.forEach((m: any) => list.add(typeof m === 'string' ? m : m.name));
      extractedMethods.forEach(em => list.add(em.name));
      return Array.from(list).sort();
  }, [methods, settings, user, extractedMethods]);

  // ==============================================
  // 🔥 ESTADOS DO PLANEJADOR E CLOUD SYNC
  // ==============================================
  const [autoSyncBankroll, setAutoSyncBankroll] = useState(() => localStorage.getItem('autoSyncBankroll') === 'true');
  const [useAvailableBankroll, setUseAvailableBankroll] = useState(() => localStorage.getItem('useAvailableBankroll') === 'true'); 
  const [growthMode, setGrowthMode] = useState<'compound' | 'fixed'>(() => (localStorage.getItem('growthMode') as 'compound' | 'fixed') || 'compound'); 
  
  const [compBankroll, setCompBankroll] = useState(() => localStorage.getItem('compBankroll') || (currentBankrollBalance > 0 ? Number(currentBankrollBalance).toFixed(2) : '1000.00'));
  const [compTarget, setCompTarget] = useState(() => localStorage.getItem('compTarget') || (currentBankrollBalance > 0 ? Number(currentBankrollBalance * 2).toFixed(2) : '2000.00'));
  const [compDays, setCompDays] = useState(() => localStorage.getItem('compDays') || '30');

  const [simMethods, setSimMethods] = useState(() => {
      const saved = localStorage.getItem('proPlannerMethods');
      if (saved) {
          try { return JSON.parse(saved); } catch (e) { return null; }
      }
      return [ { id: 1, name: '', winRate: 60, avgOdd: 1.85, entries: 3, stake: 2, badRun: 7, isSynced: false } ];
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
      const loadState = async () => {
          if (!user) return;
          try {
              const { data } = await supabase.from('user_settings').select('planner_state').eq('user_id', user.id).single();
              if (data && data.planner_state) {
                  const ps = data.planner_state;
                  if (ps.compBankroll) setCompBankroll(ps.compBankroll);
                  if (ps.compTarget) setCompTarget(ps.compTarget);
                  if (ps.compDays) setCompDays(ps.compDays);
                  if (ps.simMethods) setSimMethods(ps.simMethods);
                  if (ps.autoSyncBankroll !== undefined) setAutoSyncBankroll(ps.autoSyncBankroll);
                  if (ps.useAvailableBankroll !== undefined) setUseAvailableBankroll(ps.useAvailableBankroll);
                  if (ps.growthMode) setGrowthMode(ps.growthMode);
              } else {
                  setCompBankroll(localStorage.getItem('compBankroll') || (currentBankrollBalance > 0 ? Number(currentBankrollBalance).toFixed(2) : '1000.00'));
                  setCompTarget(localStorage.getItem('compTarget') || (currentBankrollBalance > 0 ? Number(currentBankrollBalance * 2).toFixed(2) : '2000.00'));
                  setCompDays(localStorage.getItem('compDays') || '30');
                  const localMethods = localStorage.getItem('proPlannerMethods');
                  if (localMethods) setSimMethods(JSON.parse(localMethods));
                  setAutoSyncBankroll(localStorage.getItem('autoSyncBankroll') === 'true');
                  setUseAvailableBankroll(localStorage.getItem('useAvailableBankroll') !== 'false');
                  setGrowthMode((localStorage.getItem('growthMode') as 'compound' | 'fixed') || 'compound');
              }
          } catch (e) {
              console.log("Fallback para LocalStorage via Catch");
          } finally {
              setIsInitialized(true);
          }
      };
      loadState();
  }, [user]);

  useEffect(() => {
      if (!isInitialized || !user) return;
      localStorage.setItem('compBankroll', compBankroll);
      localStorage.setItem('compTarget', compTarget);
      localStorage.setItem('compDays', compDays);
      localStorage.setItem('proPlannerMethods', JSON.stringify(simMethods));
      localStorage.setItem('autoSyncBankroll', String(autoSyncBankroll));
      localStorage.setItem('useAvailableBankroll', String(useAvailableBankroll));
      localStorage.setItem('growthMode', growthMode);

      const saveToCloud = async () => {
          setIsCloudSyncing(true);
          try {
              const state = { compBankroll, compTarget, compDays, simMethods, autoSyncBankroll, useAvailableBankroll, growthMode };
              await supabase.from('user_settings').update({ planner_state: state }).eq('user_id', user.id);
          } catch (e) {
              console.log("Erro ao salvar na nuvem.");
          } finally {
              setIsCloudSyncing(false);
          }
      };
      const timeoutId = setTimeout(saveToCloud, 1500);
      return () => clearTimeout(timeoutId);
  }, [compBankroll, compTarget, compDays, simMethods, autoSyncBankroll, useAvailableBankroll, growthMode, isInitialized, user]);

  useEffect(() => {
      if (autoSyncBankroll && isInitialized) {
          setCompBankroll(Number(currentBankrollBalance).toFixed(2));
      }
  }, [currentBankrollBalance, autoSyncBankroll, isInitialized]);

  const handleBankrollManualChange = (val: string) => {
      setCompBankroll(val);
      setAutoSyncBankroll(false); 
  };

  // 🔥 LÓGICA DE BANCA LIVRE E EXTREMOS 🔥
  const bankrollNum = parseFloat(compBankroll) || 0;
  const targetNum = parseFloat(compTarget) || 0;
  const daysNum = parseFloat(compDays) || 1;
  const isCompound = growthMode === 'compound';

  const pendingExposure = useMemo(() => {
      return (history || []).filter(b => b.status === 'pending').reduce((acc, b) => acc + Number(b.stake || 0), 0);
  }, [history]);

  const availableBankroll = Math.max(0, bankrollNum - pendingExposure);
  const calculationBankroll = useAvailableBankroll ? availableBankroll : bankrollNum;

  const isBankrollBusted = bankrollNum <= 1 && compBankroll !== ''; 
  const isTargetReached = bankrollNum >= targetNum && targetNum > 0;
  const progressPercent = targetNum > 0 ? Math.min(100, Math.max(0, (bankrollNum / targetNum) * 100)) : 0;

  const addSimMethod = () => setSimMethods([...simMethods, { id: Date.now(), name: '', winRate: 60, avgOdd: 1.85, entries: 2, stake: 2, badRun: 7, isSynced: false }]);
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
          alert(`Alguns métodos possuem menos de 10 entradas concluídas no Diário.\n\nPara evitar distorções de curto prazo, o sistema respeitou a validação externa (manual) que você digitou.`);
      }
  };

  // ==============================================
  // 🔥 MOTOR DE CÁLCULO E PROJEÇÃO
  // ==============================================
  const dailyGrowthNeededRaw = bankrollNum > 0 && targetNum > bankrollNum && !isTargetReached 
      ? (isCompound 
          ? (Math.pow(targetNum / bankrollNum, 1 / daysNum) - 1)
          : ((targetNum - bankrollNum) / daysNum) / bankrollNum)
      : 0;
      
  const dailyGrowthNeededPct = dailyGrowthNeededRaw * 100;
  
  const dailyTargetMoney = isCompound 
      ? bankrollNum * dailyGrowthNeededRaw 
      : (targetNum - bankrollNum) / daysNum;

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

      const activeCalculationBankroll = isCompound ? calculationBankroll : bankrollNum;
      
      const currentStakeValue = activeCalculationBankroll * (m.stake / 100);
      const evMoney = currentStakeValue * evRaw;

      const drawdownRiskMoney = currentStakeValue * (m.badRun || 5);
      const drawdownRiskPct = bankrollNum > 0 ? (drawdownRiskMoney / bankrollNum) * 100 : 0;
      
      let riskBadge = null;
      if (evRaw <= 0) {
          riskBadge = <span className="text-[8px] font-bold text-red-500 uppercase bg-red-500/10 px-2 py-0.5 rounded whitespace-nowrap">EV Negativo</span>;
      } else if (drawdownRiskPct >= 50) {
          riskBadge = <span className="text-[8px] font-bold text-red-500 uppercase bg-red-500/10 px-2 py-0.5 rounded flex items-center justify-center gap-1 whitespace-nowrap"><AlertTriangle size={10}/> Ruína</span>;
      } else if (m.stake > safeStakePct * 2) {
          riskBadge = <span className="text-[8px] font-bold text-amber-600 dark:text-amber-500 uppercase bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded whitespace-nowrap">Risco Alto</span>;
      } else {
          riskBadge = <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-500 uppercase bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded whitespace-nowrap">Segura</span>;
      }

      const dailyGrowth = evRaw * (m.stake / 100) * m.entries * 100;
      const dailyGrowthMoney = evMoney * m.entries;

      return { 
          ...m, evPct, evMoney, safeStakePct, requiredStakePct, dailyGrowth, dailyGrowthMoney,
          stakeValue: currentStakeValue, riskBadge, drawdownRiskMoney, drawdownRiskPct 
      };
  });

  const aggregateDailyGrowth = processedMethods.reduce((acc, m) => acc + m.dailyGrowth, 0);
  const aggregateDailyGrowthMoney = processedMethods.reduce((acc, m) => acc + m.dailyGrowthMoney, 0);
  
  const projectedBankroll = isCompound 
      ? bankrollNum * Math.pow(1 + (aggregateDailyGrowth / 100), daysNum)
      : bankrollNum + (aggregateDailyGrowthMoney * daysNum);

  const isGoalAchievable = isCompound 
      ? aggregateDailyGrowth >= dailyGrowthNeededPct && targetNum > bankrollNum
      : aggregateDailyGrowthMoney >= dailyTargetMoney && targetNum > bankrollNum;

  let etaText = "";
  let etaColor = "";
  if (isTargetReached) {
     etaText = "ALVO ALCANÇADO!";
     etaColor = "text-emerald-600 dark:text-emerald-500";
  } else if (isBankrollBusted) {
     etaText = "BANCA QUEBRADA!";
     etaColor = "text-red-600 dark:text-red-500";
  } else if (aggregateDailyGrowth <= 0) {
     etaText = "Crescimento Nulo/Negativo";
     etaColor = "text-red-600 dark:text-red-500";
  } else {
     const estimatedDays = isCompound 
         ? Math.ceil(Math.log(targetNum / bankrollNum) / Math.log(1 + aggregateDailyGrowth / 100))
         : Math.ceil((targetNum - bankrollNum) / aggregateDailyGrowthMoney);

     const diff = estimatedDays - daysNum;
     if (diff <= 0) {
         etaText = `Estimativa: ${estimatedDays} dias (${Math.abs(diff)} adiantado 🚀)`;
         etaColor = "text-emerald-600 dark:text-emerald-500";
     } else {
         etaText = `Estimativa: ${estimatedDays} dias (${diff} atraso ⚠️)`;
         etaColor = "text-amber-600 dark:text-amber-500";
     }
  }

  const generateChartPoints = () => {
      const pointsTarget = [];
      const pointsProjected = [];
      const width = 1000;
      const height = 200;
      
      const allTargetVals = [];
      const allProjectedVals = [];

      for (let day = 0; day <= daysNum; day++) {
          let yTVal = 0;
          let yPVal = 0;

          if (isCompound) {
              yTVal = bankrollNum * Math.pow(1 + dailyGrowthNeededRaw, day);
              yPVal = bankrollNum * Math.pow(1 + (aggregateDailyGrowth / 100), day);
          } else {
              yTVal = bankrollNum + (dailyTargetMoney * day);
              yPVal = bankrollNum + (aggregateDailyGrowthMoney * day);
          }
          
          allTargetVals.push(yTVal);
          allProjectedVals.push(yPVal);
      }

      const actualMax = Math.max(...allTargetVals, ...allProjectedVals);
      const actualMin = Math.min(...allTargetVals, ...allProjectedVals);

      const padding = (actualMax - actualMin) * 0.15;
      let maxY = actualMax + padding;
      let minY = actualMin - padding;

      if (maxY === minY) {
          maxY += 10;
          minY -= 10;
      }

      const rangeY = maxY - minY;

      for (let day = 0; day <= daysNum; day++) {
          const x = (day / daysNum) * width;
          const yT = height - ((allTargetVals[day] - minY) / rangeY) * height;
          pointsTarget.push(`${x},${yT}`);

          const yP = height - ((allProjectedVals[day] - minY) / rangeY) * height;
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

  const [kellyOdds, setKellyOdds] = useState('2.00'); 
  const [kellyProb, setKellyProb] = useState('55'); 
  const [kellyFraction, setKellyFraction] = useState('1'); 
  const kellyResult = (() => { const b = parseFloat(kellyOdds) - 1; const p = parseFloat(kellyProb) / 100; if (b <= 0) return "0.00"; return (((b * p - (1 - p)) / b) * parseFloat(kellyFraction) * 100).toFixed(2); })();
  const kellyMoney = (parseFloat(kellyResult) / 100) * calculationBankroll;

  const [valOdds, setValOdds] = useState('2.10'); 
  const [valProb, setValProb] = useState('50'); 
  const valEVRaw = (parseFloat(valProb) / 100 * parseFloat(valOdds)) - 1; 
  const valEVPercent = valEVRaw * 100;
  const valueKellySuggestion = valEVRaw > 0 && parseFloat(valOdds) > 1 ? ((valEVRaw / (parseFloat(valOdds) - 1)) / 4) * 100 : 0; 

  const [arbOdds1, setArbOdds1] = useState('2.05'); 
  const [arbOdds2, setArbOdds2] = useState('2.05'); 
  const [arbTotalStake, setArbTotalStake] = useState('1000');
  const arbImplied = (1 / parseFloat(arbOdds1)) + (1 / parseFloat(arbOdds2)); 
  const arbRoi = ((1 / arbImplied) - 1) * 100;
  const arbStake1 = (parseFloat(arbTotalStake) * (1 / parseFloat(arbOdds1))) / arbImplied; 
  const arbStake2 = (parseFloat(arbTotalStake) * (1 / parseFloat(arbOdds2))) / arbImplied;
  const arbProfit = (arbStake1 * parseFloat(arbOdds1)) - parseFloat(arbTotalStake);

  const [stakePercentState, setStakePercentState] = useState('1'); 
  const stakeValue = (parseFloat(stakePercentState) / 100) * calculationBankroll;

  const [convDec, setConvDec] = useState('2.00'); 
  const [convAm, setConvAm] = useState('+100'); 
  const [convProb, setConvProb] = useState('50.00');
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

  const inputClass = "bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-[#3A3A3C] focus:border-indigo-500 text-slate-900 dark:text-white px-1 py-1 outline-none font-mono text-xs w-full text-center transition-colors";
  const cardClass = "bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm";
  const sectionTitleClass = "text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2";

  return (
    <div className="space-y-6 pb-20 w-full overflow-x-hidden font-sans">
        
      <datalist id="methods-list">
          {availableMethodsList.map(name => {
              const hist = extractedMethods.find(ex => ex.name.toLowerCase() === name.toLowerCase());
              return <option key={name} value={name}>{hist && hist.resolved >= 10 ? ` (${hist.resolved} entradas)` : ''}</option>;
          })}
      </datalist>

      <div className="flex flex-col gap-2 px-4 md:px-0">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
            Strategic Math Engine
          </div>
          <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Calculadoras Pro
              </h1>
              {isCloudSyncing && <CloudLightning size={16} className="text-indigo-500 animate-pulse" title="Sincronizando com a Nuvem" />}
          </div>
      </div>
      
      <div className="flex w-full overflow-x-auto bg-slate-100 dark:bg-[#000000] p-1 rounded-xl border border-slate-200 dark:border-[#2C2C2E] px-4 md:px-1 custom-scrollbar mx-4 md:mx-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[100px] flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all gap-1.5 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-[#3A3A3C]'
                : 'text-slate-500 dark:text-[#8E8E93] hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.pro && !isPro && <Lock size={12} className="opacity-50" />}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
        <div className="lg:col-span-2 space-y-6 min-w-0 w-full relative">
            
            {/* ========================================== */}
            {/* 🔥 ABA: PLANEJADOR DE METAS PRO 🔥 */}
            {/* ========================================== */}
            {activeTab === 'compound' && (
                <div className="relative">
                    {!isPro && <ProBlurOverlay title="Plano de Metas" desc="Descubra a Stake Matemática exata para bater a sua meta financeira e audite seu histórico de apostas automaticamente." />}
                    <div className={`space-y-6 ${!isPro ? 'pointer-events-none select-none blur-md opacity-50' : ''}`}>
                        
                        {/* CARD 1: O ALVO E A BANCA */}
                        <div className={`${cardClass} relative overflow-hidden`}>
                            <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest flex items-center gap-1.5">
                                            <LayoutGrid size={14}/> Dashboard Base
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="flex bg-slate-50 dark:bg-[#000000] p-1 rounded-lg border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
                                                <button onClick={() => setGrowthMode('compound')} className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${growthMode === 'compound' ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#8E8E93] hover:text-slate-700 dark:hover:text-slate-300'}`}>Compostos</button>
                                                <button onClick={() => setGrowthMode('fixed')} className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${growthMode === 'fixed' ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#8E8E93] hover:text-slate-700 dark:hover:text-slate-300'}`}>Fixa</button>
                                            </div>
                                            <button 
                                                onClick={() => setAutoSyncBankroll(!autoSyncBankroll)} 
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-colors ${autoSyncBankroll ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#2C2C2E] text-slate-500 dark:text-[#8E8E93]'}`}
                                            >
                                                <RefreshCcw size={10} className={autoSyncBankroll ? 'animate-spin-slow' : ''} /> 
                                                {autoSyncBankroll ? 'Auto-Sync ON' : 'Auto-Sync OFF'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full">
                                        <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#8E8E93] mb-2 flex items-center gap-1">
                                            {isCompound ? 'Banca Base (Juros Compostos)' : 'Banca Base Inicial (Fixa)'}
                                        </p>
                                        <input type="number" value={compBankroll} onChange={e => handleBankrollManualChange(e.target.value)} className={`bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] text-2xl font-bold tracking-tight rounded-xl px-4 py-3 w-full outline-none focus:border-indigo-500 transition-colors ${autoSyncBankroll && !isTargetReached && !isBankrollBusted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`} />
                                    </div>

                                    <div className="w-full bg-slate-100 dark:bg-[#2C2C2E] h-1.5 rounded-full mt-5 overflow-hidden">
                                        <div className={`h-full transition-all duration-1000 ${isBankrollBusted ? 'bg-red-500 w-full' : isTargetReached ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: isBankrollBusted ? '100%' : `${progressPercent}%` }}></div>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-[#8E8E93] mt-2 text-right">{progressPercent.toFixed(1)}% concluído</p>
                                </div>

                                <div className="flex gap-4">
                                    <div className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] p-4 rounded-xl flex-1 flex flex-col justify-center">
                                        <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase block mb-1">Meta Desejada</label>
                                        <input type="number" value={compTarget} onChange={e => setCompTarget(e.target.value)} className="bg-transparent text-xl font-bold text-slate-900 dark:text-white outline-none w-full" />
                                    </div>
                                    <div className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] p-4 rounded-xl flex-1 flex flex-col justify-center">
                                        <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase block mb-1">Prazo (Dias)</label>
                                        <input type="number" value={compDays} onChange={e => setCompDays(e.target.value)} className="bg-transparent text-xl font-bold text-slate-900 dark:text-white outline-none w-full" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD STATUS EXTREMOS */}
                        <AnimatePresence>
                            {isTargetReached && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 mb-6">
                                    <div className="bg-emerald-100 dark:bg-emerald-500/20 p-4 rounded-full shrink-0">
                                        <Trophy size={32} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold tracking-tight mb-2">Meta Batida com Sucesso!</h3>
                                        <p className="text-sm font-medium leading-relaxed mb-4 opacity-90">Você transformou sua banca e atingiu o objetivo. Saque seus lucros e redefina a meta acima.</p>
                                        <button onClick={() => setCompTarget(String(bankrollNum * 2))} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors shadow-sm">
                                            Dobrar a Meta
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {isBankrollBusted && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 mb-6">
                                    <div className="bg-red-100 dark:bg-red-500/20 p-4 rounded-full shrink-0">
                                        <Skull size={32} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold tracking-tight mb-2">Banca Quebrada</h3>
                                        <p className="text-sm font-medium leading-relaxed mb-4 opacity-90">O capital atual não possui liquidez matemática para sustentar a projeção. Faça um novo aporte.</p>
                                        <button onClick={() => { setCompBankroll(String(targetNum / 2)); setAutoSyncBankroll(false); }} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors shadow-sm">
                                            Novo Aporte
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* OCULTA AS OPERAÇÕES SE A META BATEU OU QUEBROU */}
                        {!isTargetReached && !isBankrollBusted && (
                            <>
                                {/* CARD 2: RESULTADO MATEMÁTICO (PLANO DE AÇÃO) E GPS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={`${cardClass} flex flex-col justify-center relative overflow-hidden`}>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-2 flex items-center gap-1.5"><Navigation size={14} className="text-indigo-500"/> GPS de Crescimento</p>
                                        <h3 className={`text-xl sm:text-2xl font-bold tracking-tight mb-2 relative z-10 ${etaColor}`}>
                                            {etaText}
                                        </h3>
                                        <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400 relative z-10">
                                            Para manter o curso, seu lucro <strong className="text-slate-900 dark:text-white">Hoje</strong> precisa ser de <strong>R$ {dailyTargetMoney.toFixed(2)}</strong>.
                                        </p>
                                    </div>

                                    <div className={`rounded-2xl p-6 flex flex-col justify-center border shadow-sm ${
                                        isGoalAchievable 
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' 
                                        : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                                    }`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isGoalAchievable ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>A Meta de Hoje (Dia 1)</p>
                                        <h3 className={`text-2xl font-bold tracking-tight mb-2 ${isGoalAchievable ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                            Fazer + R$ {dailyTargetMoney.toFixed(2)}
                                        </h3>
                                        <p className={`text-xs font-medium leading-relaxed ${isGoalAchievable ? 'text-emerald-600/90 dark:text-emerald-400/90' : 'text-amber-700/90 dark:text-amber-400/90'}`}>
                                            {isCompound ? `Sua meta global exige crescimento de ` : `Sua meta global exige lucro de R$ `}
                                            <strong>{isCompound ? `${dailyGrowthNeededPct.toFixed(2)}%` : dailyTargetMoney.toFixed(2)} ao dia</strong>. 
                                            {isGoalAchievable ? ` A estratégia projetou bater o alvo. Execute o volume planejado.` : ` Sua estratégia atual não alcança essa meta. Aumente o volume ou as odds.`}
                                        </p>
                                    </div>
                                </div>

                                {/* CARD 3: A PLANILHA DE MÉTODOS EDITÁVEL */}
                                <div className={`${cardClass} overflow-hidden p-0 md:p-0`}>
                                    <div className="p-6 md:p-8">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2"><BarChart4 size={18} className="text-indigo-500"/> Simulador de Cenários</h3>
                                                <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] uppercase font-bold tracking-wider mt-1">A coluna "Aposte Isso" te diz o valor da Próxima Entrada.</p>
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#000000] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2C2C2E]">
                                                    <span className="text-[9px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest flex items-center gap-1" title="Se ligado, as próximas stakes descontam o valor que já está investido no mercado (Risco Exposto)."><Coins size={12}/> Simultâneo</span>
                                                    <button 
                                                        onClick={() => setUseAvailableBankroll(!useAvailableBankroll)}
                                                        className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${useAvailableBankroll ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-[#3A3A3C]'}`}
                                                    >
                                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${useAvailableBankroll ? 'translate-x-4' : 'translate-x-1'}`}/>
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={handleAutoFill} className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-[#3A3A3C] px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"><RefreshCcw size={12}/> Auditar</button>
                                                    <button onClick={addSimMethod} className="text-[10px] font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"><Plus size={14}/> Método</button>
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {useAvailableBankroll && pendingExposure > 0 && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 mb-6 flex items-center gap-3">
                                                    <AlertTriangle size={16} className="text-amber-600 dark:text-amber-500 shrink-0" />
                                                    <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                                                        Você possui <strong>R$ {pendingExposure.toFixed(2)}</strong> investidos no mercado. Stakes calculadas sobre a Banca Livre (<strong className="font-mono">R$ {availableBankroll.toFixed(2)}</strong>).
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        
                                        {/* 🔥 VISÃO DESKTOP (TABELA) 🔥 */}
                                        <div className="hidden md:block overflow-x-auto custom-scrollbar pb-2">
                                            <table className="w-full text-left min-w-[768px]">
                                                <thead>
                                                    <tr className="border-b border-slate-200 dark:border-[#2C2C2E] text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] font-bold">
                                                        <th className="pb-3 px-2 font-medium w-48">Método</th>
                                                        <th className="pb-3 text-center font-medium w-16">Win Rate %</th>
                                                        <th className="pb-3 text-center font-medium w-16">Odd Média</th>
                                                        <th className="pb-3 text-center font-medium w-16">Entr/Dia</th>
                                                        <th className="pb-3 text-center font-medium w-20">Max Bad Run</th>
                                                        <th className="pb-3 text-center font-medium w-24 text-indigo-500">EV Esperado</th>
                                                        <th className="pb-3 text-center font-medium w-20">Stake Meta %</th>
                                                        <th className="pb-3 text-center font-medium w-16">Sua Stake %</th>
                                                        <th className="pb-3 text-center font-medium text-emerald-500 w-28">Aposte Isso (R$)</th>
                                                        <th className="pb-3 text-center"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <AnimatePresence>
                                                        {processedMethods.map((m) => (
                                                            <motion.tr initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={`desktop-${m.id}`} className="border-b border-slate-100 dark:border-[#2C2C2E] hover:bg-slate-50 dark:hover:bg-[#000000] transition-colors group">
                                                                
                                                                <td className="py-3 px-2">
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <div className="relative">
                                                                            <input 
                                                                                list="methods-list"
                                                                                value={m.name} 
                                                                                onChange={e => updateSimMethod(m.id, 'name', e.target.value)} 
                                                                                className="bg-slate-100 dark:bg-[#2C2C2E] border border-transparent focus:border-indigo-500 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg font-bold text-xs w-full outline-none pr-6 transition-colors"
                                                                                placeholder="Ex: Oportunista..."
                                                                            />
                                                                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                                        </div>
                                                                        {m.isSynced ? (
                                                                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={10}/> Validado</span>
                                                                        ) : (
                                                                            <span className="text-[9px] font-bold text-slate-400 dark:text-[#636366] uppercase tracking-widest">● Simulação</span>
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
                                                                        </div>
                                                                        <span className="text-[9px] font-bold text-slate-500 mt-1 whitespace-nowrap">
                                                                            -R$ {m.drawdownRiskMoney.toFixed(0)} ({m.drawdownRiskPct.toFixed(0)}%)
                                                                        </span>
                                                                    </div>
                                                                </td>

                                                                <td className="py-3 px-1 text-center">
                                                                    <div className="flex flex-col items-center justify-center">
                                                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border whitespace-nowrap ${m.evPct > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
                                                                            {m.evPct > 0 ? '+' : ''}{m.evPct.toFixed(1)}%
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-500 dark:text-[#8E8E93] font-bold mt-1 tracking-widest whitespace-nowrap">
                                                                            {m.evMoney > 0 ? '+' : ''} R$ {m.evMoney.toFixed(2)}/bet
                                                                        </span>
                                                                    </div>
                                                                </td>

                                                                <td className="py-3 px-1 text-center">
                                                                    <div className="flex flex-col items-center">
                                                                        <span className={`font-mono font-bold text-sm ${m.requiredStakePct > m.safeStakePct ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                                                            {m.evPct > 0 ? m.requiredStakePct.toFixed(1) + '%' : 'N/A'}
                                                                        </span>
                                                                        {m.evPct > 0 && (
                                                                            <button onClick={() => updateSimMethod(m.id, 'stake', String(m.requiredStakePct.toFixed(1)))} className="text-[9px] uppercase font-bold tracking-widest text-indigo-500 hover:text-indigo-600 mt-1 flex items-center gap-1 whitespace-nowrap">
                                                                                Fixar
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
                                                                    <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 py-2 px-2 rounded-lg font-bold font-mono text-sm border border-emerald-100 dark:border-emerald-500/20 whitespace-nowrap">
                                                                        R$ {m.stakeValue.toFixed(2)}
                                                                    </div>
                                                                </td>

                                                                <td className="py-3 pr-2 text-right">
                                                                    <button onClick={() => removeSimMethod(m.id)} className="p-2 text-slate-300 dark:text-[#636366] hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                                                </td>
                                                            </motion.tr>
                                                        ))}
                                                    </AnimatePresence>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* 🔥 VISÃO MOBILE (CARDS) 🔥 */}
                                        <div className="md:hidden space-y-4 px-6 pb-6 pt-2">
                                            <AnimatePresence>
                                                {processedMethods.map((m) => (
                                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={`mobile-${m.id}`} className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-5 relative shadow-sm">
                                                        
                                                        <button onClick={() => removeSimMethod(m.id)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-[#1C1C1E] rounded-lg shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
                                                            <Trash2 size={14}/>
                                                        </button>

                                                        <div className="pr-12 mb-5">
                                                            <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-[#8E8E93] tracking-widest mb-2">Método / Estratégia</p>
                                                            <div className="relative">
                                                                <input list="methods-list" value={m.name} onChange={e => updateSimMethod(m.id, 'name', e.target.value)} className="w-full bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] text-slate-900 dark:text-white px-3 py-2.5 rounded-lg text-sm font-bold outline-none focus:border-indigo-500" placeholder="Ex: Oportunista..." />
                                                            </div>
                                                            <div className="mt-2">
                                                                {m.isSynced ? (
                                                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={12}/> Histórico Validado</span>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-[#636366] uppercase tracking-widest">● Simulação Manual</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-white dark:bg-[#1C1C1E] rounded-xl border border-slate-200 dark:border-[#2C2C2E]">
                                                            <div>
                                                                <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] uppercase font-bold tracking-widest text-center mb-1">WR %</p>
                                                                <input type="number" value={m.winRate} onChange={e => updateSimMethod(m.id, 'winRate', e.target.value)} className={inputClass} />
                                                            </div>
                                                            <div className="border-l border-r border-slate-100 dark:border-[#2C2C2E] px-1">
                                                                <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] uppercase font-bold tracking-widest text-center mb-1">Odd</p>
                                                                <input type="number" step="0.01" value={m.avgOdd} onChange={e => updateSimMethod(m.id, 'avgOdd', e.target.value)} className={inputClass} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] uppercase font-bold tracking-widest text-center mb-1">Entr/Dia</p>
                                                                <input type="number" min="1" value={m.entries} onChange={e => updateSimMethod(m.id, 'entries', e.target.value)} className={inputClass} />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                                            <div className="p-3 bg-white dark:bg-[#1C1C1E] rounded-xl border border-slate-200 dark:border-[#2C2C2E] text-center flex flex-col items-center justify-center">
                                                                <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] uppercase font-bold tracking-widest mb-1">Max Bad Run</p>
                                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                                    <input type="number" min="1" value={m.badRun || 5} onChange={e => updateSimMethod(m.id, 'badRun', e.target.value)} className={`${inputClass} !text-red-500 dark:!text-red-400 !px-0 !py-0 !w-8`} />
                                                                    <span className="text-[10px] font-bold text-slate-500">Reds</span>
                                                                </div>
                                                                <span className="text-[10px] font-medium text-slate-500 dark:text-[#8E8E93]">-R$ {m.drawdownRiskMoney.toFixed(0)} ({m.drawdownRiskPct.toFixed(0)}%)</span>
                                                            </div>
                                                            <div className="p-3 bg-white dark:bg-[#1C1C1E] rounded-xl border border-slate-200 dark:border-[#2C2C2E] text-center flex flex-col justify-center">
                                                                <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] uppercase font-bold tracking-widest mb-1.5">EV Esperado</p>
                                                                <span className={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border inline-block mx-auto mb-1.5 ${m.evPct > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>{m.evPct > 0 ? '+' : ''}{m.evPct.toFixed(1)}%</span>
                                                                <span className="text-[10px] text-slate-500 dark:text-[#8E8E93] font-bold">{m.evMoney > 0 ? '+' : ''} R$ {m.evMoney.toFixed(2)}/bet</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-[#1C1C1E] rounded-xl border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
                                                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-[#2C2C2E] pb-3">
                                                                <div className="flex-1 text-center">
                                                                    <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] uppercase font-bold tracking-widest mb-1">Stake Meta</p>
                                                                    <span className={`font-mono font-bold text-sm block ${m.requiredStakePct > m.safeStakePct ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{m.evPct > 0 ? m.requiredStakePct.toFixed(1) + '%' : 'N/A'}</span>
                                                                </div>
                                                                <div className="flex-1 text-center border-l border-slate-100 dark:border-[#2C2C2E]">
                                                                    <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] uppercase font-bold tracking-widest mb-1">Sua Stake</p>
                                                                    <div className="flex justify-center items-center gap-1">
                                                                        <input type="number" step="0.1" value={m.stake} onChange={e => updateSimMethod(m.id, 'stake', e.target.value)} className={`${inputClass} !w-12 !py-0`} />
                                                                        <span className="text-xs font-bold text-slate-500">%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-center pt-1">
                                                                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase font-bold tracking-widest mb-2">Aposte Isso</p>
                                                                <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 py-3 px-2 rounded-xl font-bold font-mono text-lg border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
                                                                    R$ {m.stakeValue.toFixed(2)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            
                                            <button onClick={addSimMethod} className="w-full mt-4 py-4 rounded-xl border border-slate-300 dark:border-[#3A3A3C] text-slate-600 dark:text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-[#2C2C2E] transition-colors bg-white dark:bg-[#1C1C1E] shadow-sm">
                                                <Plus size={16} /> Nova Simulação
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* CARD 4: GRÁFICO SVG NATIVO (REFINADO E DINÂMICO) */}
                                <div className={`${cardClass} bg-slate-900 dark:bg-[#1C1C1E] text-white overflow-hidden flex flex-col justify-between min-h-[260px] sm:min-h-[300px]`}>
                                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 mb-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">
                                                {isCompound ? 'Crescimento Exponencial' : 'Crescimento Linear'}
                                            </p>
                                            <h3 className={`text-3xl font-bold tracking-tight flex flex-col sm:block ${aggregateDailyGrowth < 0 && isCompound ? 'text-red-400' : aggregateDailyGrowthMoney < 0 && !isCompound ? 'text-red-400' : 'text-white'}`}>
                                                R$ {projectedBankroll.toFixed(2)} 
                                                <span className="text-sm text-indigo-300 font-medium sm:ml-2 mt-1 sm:mt-0 opacity-80 tracking-normal">em {daysNum} dias</span>
                                            </h3>
                                        </div>
                                        <div className="flex flex-row sm:flex-col gap-4 sm:gap-1 w-full sm:w-auto justify-start sm:justify-end border-t border-slate-800 dark:border-[#2C2C2E] sm:border-0 pt-4 sm:pt-0">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center sm:justify-end gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Curva Meta</p>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center sm:justify-end gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500"></span> Projeção</p>
                                        </div>
                                    </div>
                                    
                                    <div className="relative w-full h-[150px] mt-auto">
                                        <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                                            <defs>
                                                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            
                                            {/* Linhas de Grade de fundo para visual Institucional */}
                                            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                                                <line key={ratio} x1="0" y1={200 * ratio} x2="1000" y2={200 * ratio} stroke="#3A3A3C" strokeWidth="1" strokeDasharray="4,4" />
                                            ))}
                                            
                                            <polygon fill="url(#chartFill)" points={`0,200 ${chartPaths.projected} 1000,200`} />
                                            <polyline fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,5" points={chartPaths.target} />
                                            <polyline fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={chartPaths.projected} />
                                        </svg>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* 🔥 ABA: VALUE BET PRO (COM VITRINE) 🔥 */}
            {/* ========================================== */}
            {activeTab === 'value' && (
                <div className="relative">
                   {!isPro && <ProBlurOverlay title="Value Bet Finder" desc="Cruzamos a odd oferecida com a sua estatística real para achar o Valor Esperado e calcular o Critério de Kelly exato de investimento." />}
                   <div className={`${cardClass} ${!isPro ? 'pointer-events-none select-none blur-[4px] opacity-60' : ''}`}>
                       <h2 className={sectionTitleClass}><Target size={20} className="text-emerald-500"/> Value Bet Finder</h2>
                       <div className="grid grid-cols-2 gap-4 mb-8">
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase block mb-2 tracking-widest">Odd Oferecida</label>
                              <input type="number" value={valOdds} onChange={e => setValOdds(e.target.value)} className="w-full bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-mono font-bold text-lg transition-colors" />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase block mb-2 tracking-widest">Probabilidade Justa %</label>
                              <input type="number" value={valProb} onChange={e => setValProb(e.target.value)} className="w-full bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-mono font-bold text-lg transition-colors" />
                          </div>
                       </div>
                       <div className={`p-8 rounded-2xl border text-center ${valEVRaw > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'}`}>
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-slate-500 dark:text-[#8E8E93]">Valor Esperado (EV)</p>
                          <h3 className={`text-5xl font-bold tracking-tight ${valEVRaw > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500'}`}>
                            {valEVRaw > 0 ? '+' : ''}{valEVPercent.toFixed(2)}%
                          </h3>
                          <p className={`text-xs mt-4 font-bold ${valEVRaw > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {valEVRaw > 0 ? '✅ Aposta de Valor Encontrada' : '❌ Odds sem valor estatístico'}
                          </p>
                          
                          {valEVRaw > 0 && (
                              <div className="mt-6 pt-6 border-t border-emerald-500/20 flex flex-col items-center">
                                  <p className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-500 tracking-widest mb-2">Kelly Seguro (1/4) Sugerido</p>
                                  <span className="bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg text-sm">{valueKellySuggestion.toFixed(2)}% da Banca</span>
                              </div>
                          )}
                       </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* 🔥 ABA: ARBITRAGEM PRO (COM VITRINE) 🔥 */}
            {/* ========================================== */}
            {activeTab === 'arb' && (
                <div className="relative">
                   {!isPro && <ProBlurOverlay title="Calculadora de Arbitragem" desc="Ache oportunidades onde a divergência entre duas casas de apostas garante lucro 100% livre de risco." />}
                   <div className={`${cardClass} ${!isPro ? 'pointer-events-none select-none blur-[4px] opacity-60' : ''}`}>
                       <h2 className={sectionTitleClass}><Scale size={20} className="text-blue-500"/> Arbitragem (2-Way)</h2>
                       <div className="mb-6">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase block mb-2 tracking-widest">Investimento Total (R$)</label>
                          <input type="number" value={arbTotalStake} onChange={e => setArbTotalStake(e.target.value)} className="w-full bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-mono font-bold text-lg transition-colors" />
                       </div>
                       <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] p-4 rounded-xl">
                              <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase block mb-2 tracking-widest">Casa A (Odds)</label>
                              <input type="number" value={arbOdds1} onChange={e => setArbOdds1(e.target.value)} className="w-full bg-transparent font-mono font-bold text-2xl outline-none text-slate-900 dark:text-white mb-2" />
                              <div className="pt-3 border-t border-slate-200 dark:border-[#3A3A3C]">
                                 <p className="text-[9px] uppercase text-slate-500 dark:text-[#8E8E93] font-bold tracking-widest mb-1">Apostar:</p>
                                 <p className="text-emerald-600 dark:text-emerald-500 font-bold font-mono">R$ {isFinite(arbStake1) ? arbStake1.toFixed(2) : '0.00'}</p>
                              </div>
                          </div>
                          <div className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] p-4 rounded-xl">
                              <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase block mb-2 tracking-widest">Casa B (Odds)</label>
                              <input type="number" value={arbOdds2} onChange={e => setArbOdds2(e.target.value)} className="w-full bg-transparent font-mono font-bold text-2xl outline-none text-slate-900 dark:text-white mb-2" />
                              <div className="pt-3 border-t border-slate-200 dark:border-[#3A3A3C]">
                                 <p className="text-[9px] uppercase text-slate-500 dark:text-[#8E8E93] font-bold tracking-widest mb-1">Apostar:</p>
                                 <p className="text-emerald-600 dark:text-emerald-500 font-bold font-mono">R$ {isFinite(arbStake2) ? arbStake2.toFixed(2) : '0.00'}</p>
                              </div>
                          </div>
                       </div>
                       <div className={`p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 ${arbRoi > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] text-slate-500 dark:text-[#8E8E93]'}`}>
                          <span className="font-bold uppercase text-[10px] tracking-widest">Lucro Garantido (ROI)</span>
                          <span className="font-bold text-3xl tracking-tight">{arbRoi.toFixed(2)}%</span>
                       </div>
                       {arbRoi > 0 && <p className="text-center text-sm font-bold text-emerald-600 dark:text-emerald-500 mt-4">Lucro líquido: R$ {arbProfit.toFixed(2)}</p>}
                    </div>
                </div>
            )}

            {/* OUTRAS CALCULADORAS MANTIDAS NO CÓDIGO MAS OCULTADAS NA UI */}
            {activeTab === 'dutching' && (
                <div className={cardClass}>
                    <h2 className={sectionTitleClass}>Calculadora Dutching</h2>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#000000] p-4 rounded-xl border border-slate-200 dark:border-[#2C2C2E] w-full mb-8">
                        <span className="text-[10px] text-slate-500 dark:text-[#8E8E93] uppercase font-bold tracking-widest pl-1">Total Stake</span>
                        <input type="number" value={dutchTotalStake} onChange={(e) => setDutchTotalStake(e.target.value)} className="bg-transparent text-right w-full font-mono font-bold outline-none text-slate-900 dark:text-white text-xl" />
                    </div>
                    <div className="space-y-4">
                        {dutchSelections.map((sel, idx) => (
                            <div key={sel.id} className="bg-slate-50 dark:bg-[#000000] p-4 rounded-xl border border-slate-200 dark:border-[#2C2C2E] grid grid-cols-12 gap-3 items-center">
                                <div className="col-span-1 text-xs font-bold text-slate-400">{String.fromCharCode(65 + idx)}</div>
                                <div className="col-span-5"><input type="text" value={sel.name} onChange={e => { const n = [...dutchSelections]; n[idx].name = e.target.value; setDutchSelections(n); }} className="w-full bg-transparent outline-none text-sm font-bold text-slate-900 dark:text-white" /></div>
                                <div className="col-span-3"><input type="number" value={sel.odds} onChange={e => { const n = [...dutchSelections]; n[idx].odds = e.target.value; setDutchSelections(n); }} className="w-full bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] rounded-lg px-2 py-2 text-sm font-mono text-center text-slate-900 dark:text-white outline-none focus:border-indigo-500" placeholder="Odds" /></div>
                                <div className="col-span-3 text-right">
                                    <p className="text-emerald-600 dark:text-emerald-500 font-bold text-sm font-mono">R$ {sel.stake.toFixed(2)}</p>
                                    <button onClick={() => removeDutchSelection(sel.id)} className="text-[9px] text-red-500 hover:text-red-600 font-bold uppercase tracking-widest mt-1">Remover</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex gap-4">
                        <button onClick={addDutchSelection} className="flex-1 py-3.5 rounded-xl border border-slate-300 dark:border-[#3A3A3C] text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-[#2C2C2E] text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"><Plus size={16} /> Add Seleção</button>
                        <button onClick={calculateDutching} className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest shadow-sm transition-all active:scale-95">Calcular</button>
                    </div>
                </div>
            )}

            {activeTab === 'kelly' && (
                <div className={cardClass}>
                    <h2 className={sectionTitleClass}>Critério de Kelly</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase block mb-2 tracking-widest">Banca (Auto-Sync)</label>
                             <div className="p-4 bg-slate-50 dark:bg-[#000000] rounded-xl font-mono font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-transparent text-lg">R$ {calculationBankroll.toFixed(2)}</div>
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase block mb-2 tracking-widest">Fração de Risco</label>
                             <select value={kellyFraction} onChange={e => setKellyFraction(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none focus:border-indigo-500">
                                <option value="1">100% (Pleno)</option>
                                <option value="0.5">50% (Half)</option>
                                <option value="0.25">25% (Quarter)</option>
                               </select>
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase block mb-2 tracking-widest">Odds</label>
                             <input type="number" value={kellyOdds} onChange={e => setKellyOdds(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-[#000000] rounded-xl font-mono font-bold outline-none border border-slate-200 dark:border-[#2C2C2E] text-slate-900 dark:text-white focus:border-indigo-500 text-lg" />
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase block mb-2 tracking-widest">Probabilidade Real %</label>
                             <input type="number" value={kellyProb} onChange={e => setKellyProb(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-[#000000] rounded-xl font-mono font-bold outline-none border border-slate-200 dark:border-[#2C2C2E] text-slate-900 dark:text-white focus:border-indigo-500 text-lg" />
                        </div>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-8 rounded-2xl text-center border border-indigo-200 dark:border-indigo-500/20">
                        <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-2">Stake Recomendada</p>
                        <h3 className="text-5xl font-bold tracking-tight text-indigo-700 dark:text-indigo-400">{parseFloat(kellyResult) > 0 ? kellyResult : '0.00'}%</h3>
                        <p className="text-sm font-mono text-indigo-800 dark:text-indigo-300 mt-3 font-bold">R$ {parseFloat(kellyResult) > 0 ? kellyMoney.toFixed(2) : '0.00'}</p>
                    </div>
                </div>
            )}

            {activeTab === 'stake' && (
                <div className={cardClass}>
                   <h2 className={sectionTitleClass}><Percent size={20} className="text-indigo-500"/> Calculadora Stake Fixa</h2>
                   <div className="mb-8">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase block mb-2 tracking-widest">Porcentagem da Banca (%)</label>
                      <input type="number" value={stakePercentState} onChange={e => setStakePercentState(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-[#000000] rounded-xl font-mono font-bold text-3xl outline-none border border-slate-200 dark:border-[#2C2C2E] text-center text-indigo-500 focus:border-indigo-500" />
                   </div>
                   <div className="bg-slate-50 dark:bg-[#000000] p-8 rounded-2xl border border-slate-200 dark:border-[#2C2C2E] text-center">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-2">Valor da Aposta</p>
                      <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">R$ {stakeValue.toFixed(2)}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#636366] mt-4">Baseado na banca de R$ {calculationBankroll.toFixed(2)}</p>
                   </div>
                </div>
            )}

            {activeTab === 'odds' && (
                <div className={cardClass}>
                   <h2 className={sectionTitleClass}><ArrowRightLeft size={20} className="text-indigo-500"/> Conversor Universal</h2>
                   <div className="space-y-4">
                      <div className="bg-slate-50 dark:bg-[#000000] p-5 rounded-xl border border-slate-200 dark:border-[#2C2C2E] flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest">Decimal (Eu/Br)</label>
                          <input type="number" value={convDec} onChange={e => handleDecChange(e.target.value)} className="bg-transparent text-right font-mono font-bold text-xl outline-none w-32 text-indigo-600 dark:text-indigo-400 border-b border-transparent focus:border-indigo-500 transition-colors" />
                      </div>
                      <div className="bg-slate-50 dark:bg-[#000000] p-5 rounded-xl border border-slate-200 dark:border-[#2C2C2E] flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest">Americana (US)</label>
                          <span className="font-mono font-bold text-xl text-slate-900 dark:text-white">{convAm}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#000000] p-5 rounded-xl border border-slate-200 dark:border-[#2C2C2E] flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest">Probabilidade Implícita</label>
                          <span className="font-mono font-bold text-xl text-slate-900 dark:text-white">{convProb}%</span>
                      </div>
                   </div>
                </div>
            )}
            
        </div>

        {/* SIDEBAR DINÂMICA DE INFORMAÇÕES */}
        <div className="lg:col-span-1 space-y-6 w-full min-w-0">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200 dark:border-[#2C2C2E] p-6 md:p-8 shadow-sm sticky top-6">
                <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-tight text-sm">
                    {sidebarContent.title}
                </h4>
                
                <div className="p-5 bg-slate-50 dark:bg-[#000000] rounded-xl border border-slate-200 dark:border-[#2C2C2E]">
                    <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] mb-3 uppercase font-bold tracking-widest">Instruções:</p>
                    {sidebarContent.rules.map((rule, idx) => (
                        <p key={idx} className="text-sm font-medium text-slate-700 dark:text-[#E5E5EA] leading-relaxed mb-4 last:mb-0">
                            {rule}
                        </p>
                    ))}
                </div>
            </div>
        </div> 

      </div> 
    </div> 
  );
};

export default Calculators;