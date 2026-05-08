import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Scale, Percent, ArrowRightLeft, 
  Target, TrendingUp, AlertTriangle, Lock, Crown, 
  Crosshair, DollarSign, Goal,
  Clock, ShieldAlert, FileText,
  PiggyBank, LineChart, Calendar, Zap, CheckCircle2,
  TrendingDown, PlusCircle, Trash2, RefreshCcw, LayoutGrid, BarChart4
} from 'lucide-react';
import { useBetStore } from '../store/useBetStore';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// MÓDULOS MATEMÁTICOS & MONTE CARLO V10 (PRESERVADO)
// ==========================================
const factorial = (n: number): number => {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  let result = 1; for (let i = 2; i <= n; i++) result *= i;
  return result;
};

const poissonExact = (k: number, lambda: number): number => {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

const runMonteCarloV10 = (data: any, type: 'corner' | 'goal', targetAdd: number, textData: string = "", iterations = 20000) => {
    let hits = 0;
    const minute = Math.max(1, Math.min(95, data.min || 1));
    const isHT = minute <= 45;
    const maxTime = isHT ? 48 : 96;
    const timeLeft = Math.max(1, maxTime - minute);
    const totalCorners = data.totalCorners || 0;
    const totalGoals = data.totalGoals || 0;
    let ap = data.apPress || 0;
    let sot = data.sot || 0;
  
    const scoreDiff = (() => {
      if (!data.score || !data.score.includes('-')) return 0;
      const [h, a] = data.score.split('-').map(Number);
      return Math.abs(h - a); 
    })();
  
    const target = (type === 'corner' ? totalCorners : totalGoals) + targetAdd;
  
    const sourceWeight = textData.includes("SofaScore") || textData.includes("sofascore") ? 1.0 :
                         textData.includes("Flashscore") || textData.includes("flashscore") ? 0.95 :
                         textData.includes("CornerPro") || textData.includes("Tempo das Estatísticas") ? 0.98 :
                         0.85; 
  
    for (let i = 0; i < iterations; i++) {
      let sim = type === 'corner' ? totalCorners : totalGoals;
      let localAP = ap;
      let localSOT = sot;
      for (let t = 0; t < timeLeft; t++) {
        const momentumShift = (Math.random() - 0.5) * 4;
        localAP = Math.max(0, localAP + momentumShift);
        let prob = type === 'corner' ? (localAP / 100) * 0.15 : (localAP / 100) * 0.025; 
        const efficiency = (localSOT + 1) / (localAP + 10);
        prob *= (0.6 + (efficiency * (type === 'goal' ? 3 : 1)));
        if (minute + t > 75) prob *= 1.25;
        if (minute + t > 85) prob *= 1.40;
        if (scoreDiff !== 0) {
          if (data.needsGoal) prob *= 1.3;
          else prob *= 0.85; 
        }
        if (localAP < 20 && localSOT < 2) prob *= 0.5;
        prob = Math.max(0.001, Math.min(prob, type === 'corner' ? 0.35 : 0.12));
  
        if (Math.random() < prob) {
          sim++;
          localAP += type === 'corner' ? 4 : 2;
          localSOT += Math.random() < (type === 'goal' ? 0.8 : 0.3) ? 1 : 0;
        }
      }
      if (sim >= target) hits++;
    }
    let probFinal = hits / iterations;
    probFinal *= sourceWeight;
    return { probReal: probFinal * 100, fairOdd: probFinal > 0 ? 1 / probFinal : 0 };
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const Calculators: React.FC = () => {
  const { user, currentBankrollBalance, isPro, bets } = useBetStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'dutching'|'kelly'|'value'|'arb'|'stake'|'odds'|'compound'>('compound');

  const ProLockScreen = () => (
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden shadow-sm mt-6 w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 opacity-50" />
          <div className="bg-white dark:bg-slate-800 p-4 rounded-full mb-4 relative z-10 shadow-sm border border-slate-200 dark:border-slate-700">
              <Crown size={32} className="text-amber-500 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2 relative z-10">
              Gestor Quantitativo PRO
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm relative z-10">
              Simule projeções de crescimento, sincronize com seu histórico real e gerencie múltiplos métodos simultaneamente.
          </p>
          <button onClick={() => navigate('/pro')} className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 font-black py-3 px-8 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 relative z-10 uppercase tracking-widest text-xs">
              Quero ser PRO
          </button>
      </div>
  );

  // ==============================================
  // 🔥 MOTOR EXTRATOR DE DADOS (PROTEGIDO CONTRA NULL)
  // ==============================================
  const extractedMethods = useMemo(() => {
      const stats: Record<string, { wins: number, resolved: number, totalOdds: number }> = {};
      
      // Proteção: se 'bets' não existir ainda, usa array vazio
      (bets || []).forEach(bet => {
          const mName = bet.method || 'Sem Método';
          if (!stats[mName]) stats[mName] = { wins: 0, resolved: 0, totalOdds: 0 };
          
          if (['won', 'half-won', 'lost', 'half-lost'].includes(bet.status)) {
              stats[mName].resolved++;
              stats[mName].totalOdds += Number(bet.odds || 0);
              if (bet.status === 'won' || bet.status === 'half-won') stats[mName].wins++;
          }
      });

      return Object.entries(stats).map(([name, data]) => ({
          name, 
          winRate: data.resolved > 0 ? (data.wins / data.resolved) * 100 : 0, 
          avgOdd: data.resolved > 0 ? data.totalOdds / data.resolved : 0,
          resolved: data.resolved
      })).filter(m => m.resolved > 0);
  }, [bets]);

  // ==============================================
  // 🔥 ESTADOS DA PLANILHA PRO (MÚLTIPLOS MÉTODOS)
  // ==============================================
  const [compBankroll, setCompBankroll] = useState(currentBankrollBalance > 0 ? String(currentBankrollBalance) : '1000');
  const [compTarget, setCompTarget] = useState(currentBankrollBalance > 0 ? String(currentBankrollBalance * 2) : '2000');
  const [compDays, setCompDays] = useState('30');

  // Matriz de Métodos Editável
  const [simMethods, setSimMethods] = useState([
      { id: 1, name: 'Estratégia A', winRate: 65, avgOdd: 1.80, stake: 2, entries: 3 }
  ]);

  const addSimMethod = () => setSimMethods([...simMethods, { id: Date.now(), name: `Estratégia ${simMethods.length + 1}`, winRate: 60, avgOdd: 1.85, stake: 2, entries: 2 }]);
  const removeSimMethod = (id: number) => setSimMethods(simMethods.filter(m => m.id !== id));
  const updateSimMethod = (id: number, field: string, value: string) => {
      setSimMethods(simMethods.map(m => m.id === id ? { ...m, [field]: field === 'name' ? value : Number(value) } : m));
  };

  // Botão Mágico: Puxar do Histórico
  const syncWithHistory = () => {
      if (extractedMethods.length === 0) return alert("Nenhum dado real encontrado no histórico.");
      const synced = extractedMethods.map((m, i) => ({
          id: Date.now() + i,
          name: m.name,
          winRate: Number(m.winRate.toFixed(1)),
          avgOdd: Number(m.avgOdd.toFixed(2)),
          stake: 2, // Padrão Inicial
          entries: 2 // Padrão Inicial
      }));
      setSimMethods(synced);
  };

  // ==============================================
  // 🔥 CÁLCULOS DO DASHBOARD PRO
  // ==============================================
  const bankrollNum = parseFloat(compBankroll) || 0;
  const targetNum = parseFloat(compTarget) || 0;
  const daysNum = parseFloat(compDays) || 1;

  // Processa a matriz para achar o crescimento agregado
  const processedMethods = simMethods.map(m => {
      const ev = (m.winRate / 100 * m.avgOdd) - 1;
      const dailyGrowth = ev * (m.stake / 100) * m.entries; // Crescimento deste método ao dia
      const stakeValue = bankrollNum * (m.stake / 100); // Stake exata em R$ agora
      return { ...m, ev: ev * 100, dailyGrowth: dailyGrowth * 100, stakeValue };
  });

  // Somatório do crescimento de todos os métodos juntos
  const aggregateDailyGrowth = processedMethods.reduce((acc, m) => acc + m.dailyGrowth, 0);
  const projectedBankroll = bankrollNum * Math.pow(1 + (aggregateDailyGrowth / 100), daysNum);
  
  const dailyGrowthNeededRaw = bankrollNum > 0 && targetNum > bankrollNum ? (Math.pow(targetNum / bankrollNum, 1 / daysNum) - 1) : 0;
  const dailyGrowthNeeded = dailyGrowthNeededRaw * 100;
  
  const isGoalAchievable = aggregateDailyGrowth >= dailyGrowthNeeded && targetNum > bankrollNum;

  // ==============================================
  // ESTADOS DAS CALCULADORAS ANTIGAS
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
    { id: 'compound', label: 'Gestão PRO', pro: true, highlight: true }, 
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
            {/* 🔥 ABA: PLANILHA DE GESTÃO PRO 🔥 */}
            {/* ========================================== */}
            {activeTab === 'compound' && !isPro && <ProLockScreen />}
            {activeTab === 'compound' && isPro && (
                <div className="space-y-6">
                    {/* CARD 1: O ALVO */}
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <LayoutGrid size={14}/> Dashboard Global
                                </p>
                                <div className="flex items-end gap-3 mt-4">
                                    <div>
                                        <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">Banca Simulada (R$)</p>
                                        <input type="number" value={compBankroll} onChange={e => setCompBankroll(e.target.value)} className="bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 text-2xl font-black text-slate-900 dark:text-white rounded-xl px-4 py-2 w-full outline-none focus:border-indigo-500" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Meta (R$)</label>
                                    <input type="number" value={compTarget} onChange={e => setCompTarget(e.target.value)} className="bg-transparent text-xl font-black text-amber-500 outline-none w-full" />
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Prazo (Dias)</label>
                                    <input type="number" value={compDays} onChange={e => setCompDays(e.target.value)} className="bg-transparent text-xl font-black text-emerald-600 dark:text-emerald-400 outline-none w-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: RESULTADO MATEMÁTICO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden flex flex-col justify-center">
                            <Zap className="absolute top-0 right-0 w-32 h-32 text-white/10 -mr-8 -mt-8" />
                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1 relative z-10">Banca Final Estimada</p>
                            <h3 className="text-4xl font-black text-white relative z-10 mb-4">R$ {projectedBankroll.toFixed(2)}</h3>
                            <div className="flex gap-6 relative z-10 border-t border-indigo-500/50 pt-4">
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-indigo-200">Crescimento Combinado</p>
                                    <p className="text-lg font-black">{aggregateDailyGrowth.toFixed(2)}% / dia</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-indigo-200">Lucro Estimado</p>
                                    <p className="text-lg font-black">+ R$ {(projectedBankroll - bankrollNum).toFixed(0)}</p>
                                </div>
                            </div>
                        </div>

                        <div className={`rounded-[2rem] p-6 flex flex-col justify-center border shadow-sm ${
                            isGoalAchievable 
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' 
                            : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
                        }`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isGoalAchievable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>Status da Meta ({daysNum} dias)</p>
                            <h3 className={`text-2xl font-black mb-2 ${isGoalAchievable ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                                {isGoalAchievable ? 'Meta Realista ✅' : 'Meta Impossível ❌'}
                            </h3>
                            <p className={`text-xs font-medium leading-relaxed ${isGoalAchievable ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-red-600/80 dark:text-red-400/80'}`}>
                                Sua meta exige crescimento de <strong>{dailyGrowthNeeded.toFixed(2)}% ao dia</strong>. 
                                {isGoalAchievable ? ' A soma dos seus métodos supera essa taxa. Mantenha a execução.' : ' Seus métodos não entregam retorno suficiente. Edite o volume, stake ou win rate abaixo para criar um novo plano.'}
                            </p>
                        </div>
                    </div>

                    {/* CARD 3: A PLANILHA DE MÉTODOS EDITÁVEL */}
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><BarChart4 size={16} className="text-indigo-500"/> Matriz Operacional</h3>
                            <div className="flex gap-2">
                                <button onClick={syncWithHistory} className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"><RefreshCcw size={12}/> Puxar do Histórico</button>
                                <button onClick={addSimMethod} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"><PlusCircle size={14}/> Método</button>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto custom-scrollbar pb-2">
                            <table className="w-full text-left min-w-[750px]">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                                        <th className="pb-3 pl-2">Nome do Método</th>
                                        <th className="pb-3 text-center">Win Rate (%)</th>
                                        <th className="pb-3 text-center">Odd Média</th>
                                        <th className="pb-3 text-center">Entradas/Dia</th>
                                        <th className="pb-3 text-center">Stake (%)</th>
                                        <th className="pb-3 text-center text-indigo-500">Valor Atual (R$)</th>
                                        <th className="pb-3 text-center">EV Real</th>
                                        <th className="pb-3 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {processedMethods.map((m) => (
                                            <motion.tr initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={m.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group">
                                                <td className="py-2 pl-2"><input type="text" value={m.name} onChange={e => updateSimMethod(m.id, 'name', e.target.value)} className={`${inputClass} text-left font-black`} placeholder="Ex: Over HT" /></td>
                                                <td className="py-2 px-1"><input type="number" value={m.winRate} onChange={e => updateSimMethod(m.id, 'winRate', e.target.value)} className={inputClass} /></td>
                                                <td className="py-2 px-1"><input type="number" step="0.01" value={m.avgOdd} onChange={e => updateSimMethod(m.id, 'avgOdd', e.target.value)} className={inputClass} /></td>
                                                <td className="py-2 px-1"><input type="number" value={m.entries} onChange={e => updateSimMethod(m.id, 'entries', e.target.value)} className={inputClass} /></td>
                                                <td className="py-2 px-1"><input type="number" step="0.5" value={m.stake} onChange={e => updateSimMethod(m.id, 'stake', e.target.value)} className={inputClass} /></td>
                                                
                                                {/* Cálculo Automático da Próxima Stake em R$ */}
                                                <td className="py-2 px-1 text-center">
                                                    <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 py-1.5 px-2 rounded-lg font-black font-mono text-sm border border-indigo-100 dark:border-indigo-500/20">
                                                        R$ {m.stakeValue.toFixed(2)}
                                                    </div>
                                                </td>

                                                {/* EV Calculator */}
                                                <td className="py-2 px-1 text-center">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${m.ev > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
                                                        {m.ev > 0 ? '+' : ''}{m.ev.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-2 text-right">
                                                    <button onClick={() => removeSimMethod(m.id)} className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14}/></button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                            {simMethods.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    Nenhum método na planilha. Adicione um manualmente ou puxe do histórico.
                                </div>
                            )}
                        </div>
                    </div>
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
                        1. Digite o valor que você deseja atingir no final do mês.
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                        2. Adicione seus métodos na tabela, ou clique em <strong className="text-indigo-500">"Puxar do Histórico"</strong> para o sistema auto-preencher seu Win Rate real.
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        3. Ajuste o <strong className="text-emerald-500">Volume de Entradas</strong> e veja a data da sua meta se aproximar matematicamente.
                    </p>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                       <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                       <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                         Alerta: Essa projeção não garante lucro futuro. O crescimento agregado considera que você terá controle emocional para manter sua Taxa de Acerto constante.
                       </p>
                    </div>
                </div>
            </div>
        </div> 

      </div> 
    </div> 
  );
};

export default Calculators;