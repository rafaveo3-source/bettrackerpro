import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Scale, Percent, ArrowRightLeft, 
  Target, TrendingUp, AlertTriangle, Lock, Crown, 
  Crosshair, DollarSign, Goal,
  Clock, ShieldAlert, FileText,
  PiggyBank, LineChart, Calendar, Zap, CheckCircle2,
  TrendingDown, ArrowUpRight, ChevronRight, BarChart4
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
  const { user, currentBankrollBalance, isPro, bets = [] } = useBetStore();
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
              Conecte o seu histórico de apostas ao simulador de juros compostos para criar um plano de metas realista baseado na sua Taxa de Acerto (Win Rate) real.
          </p>
          <button onClick={() => navigate('/pro')} className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 font-black py-3 px-8 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 relative z-10 uppercase tracking-widest text-xs">
              Quero ser PRO
          </button>
      </div>
  );

  // ==============================================
  // 🔥 MOTOR EXTRATOR DE DADOS REAIS DO USUÁRIO
  // ==============================================
  const methodAnalytics = useMemo(() => {
      const stats: Record<string, { wins: number, resolved: number, totalOdds: number, profit: number }> = {};
      
      bets.forEach(bet => {
          const mName = bet.method || 'Sem Método';
          if (!stats[mName]) stats[mName] = { wins: 0, resolved: 0, totalOdds: 0, profit: 0 };
          
          if (['won', 'half-won', 'lost', 'half-lost', 'refunded'].includes(bet.status)) {
              stats[mName].resolved++;
              stats[mName].totalOdds += Number(bet.odds || 0);
              
              // Cálculo de Lucro Real baseado no histórico
              const s = Number(bet.stake || 0);
              const o = Number(bet.odds || 0);
              if (bet.status === 'won') stats[mName].profit += (s * o) - s;
              else if (bet.status === 'lost') stats[mName].profit -= s;
              else if (bet.status === 'half-won') stats[mName].profit += ((s * o) - s) / 2;
              else if (bet.status === 'half-lost') stats[mName].profit -= s / 2;

              if (bet.status === 'won' || bet.status === 'half-won') stats[mName].wins++;
          }
      });

      const processed = Object.entries(stats).map(([name, data]) => {
          const winRate = data.resolved > 0 ? (data.wins / data.resolved) * 100 : 0;
          const avgOdd = data.resolved > 0 ? data.totalOdds / data.resolved : 0;
          const ev = (winRate / 100 * avgOdd) - 1;
          return { name, winRate, avgOdd, profit: data.profit, ev: ev * 100, count: data.resolved };
      }).filter(m => m.count >= 1); // Pega qualquer método que tenha pelo menos 1 aposta resolvida

      return processed.sort((a, b) => b.count - a.count);
  }, [bets]);

  // Estados do Planejamento PRO
  const [compTarget, setCompTarget] = useState(currentBankrollBalance > 0 ? String(currentBankrollBalance * 2) : '2000');
  const [compDays, setCompDays] = useState('30');
  const [simStakePercent, setSimStakePercent] = useState('2'); // Stake sugerida padrão 2%
  
  // Variáveis Matemáticas do Dashboard
  const targetNum = parseFloat(compTarget) || 1;
  const daysNum = parseFloat(compDays) || 1;
  const stakeNum = parseFloat(simStakePercent) || 2;
  
  // Pega o melhor método ou um fallback se o usuário não tiver apostas
  const currentMethod = methodAnalytics.length > 0 
      ? methodAnalytics[0] 
      : { name: 'Insira Apostas Reais', winRate: 0, avgOdd: 0, ev: 0, profit: 0, count: 0 };

  const dailyGrowthNeeded = currentBankrollBalance > 0 && targetNum > currentBankrollBalance
      ? (Math.pow(targetNum / currentBankrollBalance, 1 / daysNum) - 1) * 100 
      : 0;

  const nextStakeValue = currentBankrollBalance * (stakeNum / 100);

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
  const kellyMoney = (parseFloat(kellyResult) / 100) * currentBankrollBalance;

  const [valOdds, setValOdds] = useState('2.10'); const [valProb, setValProb] = useState('50'); 
  const valEV = (parseFloat(valProb) / 100 * parseFloat(valOdds)) - 1; const valEVPercent = valEV * 100;

  const [arbOdds1, setArbOdds1] = useState('2.05'); const [arbOdds2, setArbOdds2] = useState('2.05'); const [arbTotalStake, setArbTotalStake] = useState('1000');
  const arbImplied = (1 / parseFloat(arbOdds1)) + (1 / parseFloat(arbOdds2)); const arbRoi = ((1 / arbImplied) - 1) * 100;
  const arbStake1 = (parseFloat(arbTotalStake) * (1 / parseFloat(arbOdds1))) / arbImplied; const arbStake2 = (parseFloat(arbTotalStake) * (1 / parseFloat(arbOdds2))) / arbImplied;
  const arbProfit = (arbStake1 * parseFloat(arbOdds1)) - parseFloat(arbTotalStake);

  const [stakePercentState, setStakePercentState] = useState('1'); const stakeValue = (parseFloat(stakePercentState) / 100) * currentBankrollBalance;
  const [convDec, setConvDec] = useState('2.00'); const [convAm, setConvAm] = useState('+100'); const [convProb, setConvProb] = useState('50.00');
  const handleDecChange = (val: string) => { setConvDec(val); const d = parseFloat(val); if (d > 1) { setConvProb(((1 / d) * 100).toFixed(2)); setConvAm(d >= 2 ? '+' + ((d - 1) * 100).toFixed(0) : (( -100 / (d - 1) )).toFixed(0)); } };

  const sidebarInfo = (() => {
    switch(activeTab) {
      case 'dutching': return { title: 'Gestão de Risco', text: 'O Dutching divide a sua exposição entre múltiplas seleções, diluindo o risco do investimento em um único evento.' };
      case 'compound': return { title: 'Gestão PRO Automatizada', text: 'Nós puxamos seus dados reais de acerto e odds direto do seu histórico. Cruze com juros compostos e descubra matematicamente o que você precisa fazer para bater sua meta financeira.' };
      default: return { title: 'Ferramentas Analíticas', text: 'Tome decisões baseadas em dados matemáticos precisos.' };
    }
  })();

  const tabs = [
    { id: 'compound', label: 'Gestão PRO', pro: true, highlight: true }, 
    { id: 'dutching', label: 'Dutching', pro: false }, 
    { id: 'kelly', label: 'Kelly', pro: false },
    { id: 'value', label: 'Value Bet', pro: true }, 
    { id: 'arb', label: 'Arbitragem', pro: true },
    { id: 'stake', label: 'Stake %', pro: false }, 
    { id: 'odds', label: 'Odds Conv.', pro: false }
  ];

  return (
    <div className="space-y-6 pb-20 w-full overflow-x-hidden">
        <div className="flex flex-col gap-2 px-4 md:px-0">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
            Strategic Math Engine
          </div>
          <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Calculadoras Pro <span className="text-slate-300 dark:text-slate-700 text-lg">///</span>
          </h1>
        </div>
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
            {/* 🔥 ABA: GESTÃO PRO (ORÁCULO) 🔥 */}
            {/* ========================================== */}
            {activeTab === 'compound' && !isPro && <ProLockScreen />}
            {activeTab === 'compound' && isPro && (
                <div className="space-y-6">
                    {/* CARD 1: O ALVO (SINCRONIZADO) */}
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Sua Banca em Tempo Real</p>
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white italic">R$ {currentBankrollBalance.toFixed(2)}</h2>
                                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                    <Clock size={14}/> Sincronizado com {bets.length} apostas
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Meta Desejada (R$)</label>
                                    <input type="number" value={compTarget} onChange={e => setCompTarget(e.target.value)} className="bg-transparent text-xl font-black text-amber-500 outline-none w-full" />
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Prazo (Dias)</label>
                                    <input type="number" value={compDays} onChange={e => setCompDays(e.target.value)} className="bg-transparent text-xl font-black text-emerald-600 dark:text-emerald-400 outline-none w-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: RECOMENDAÇÃO DE PRÓXIMA ENTRADA E CRESCIMENTO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                            <Zap className="absolute top-0 right-0 w-32 h-32 text-white/10 -mr-8 -mt-8" />
                            <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2"><ArrowUpRight size={16}/> Próxima Stake</h3>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-white/60 text-[10px] uppercase font-bold mb-1">Valor Calculado</p>
                                    <p className="text-3xl font-black">R$ {nextStakeValue.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white/60 text-[10px] uppercase font-bold mb-1">Gestão</p>
                                    <input 
                                        type="number" step="0.5" max="10" min="0.5" 
                                        value={simStakePercent} 
                                        onChange={(e) => setSimStakePercent(e.target.value)} 
                                        className="bg-transparent text-lg font-bold text-white text-right w-16 outline-none border-b border-white/20 focus:border-white transition-colors"
                                    />
                                    <span className="text-lg font-bold ml-1">%</span>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/10 text-[10px] font-medium leading-relaxed text-indigo-100">
                                Baseado nos juros compostos. Atualize este valor a cada operação finalizada no seu diário.
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col justify-center">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Esforço Diário Necessário</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">+{dailyGrowthNeeded.toFixed(2)}% <span className="text-sm text-slate-400 font-normal">/ dia</span></h3>
                            <p className="text-xs text-slate-600 dark:text-slate-500 leading-relaxed font-medium">
                                Para transformar R$ {currentBankrollBalance.toFixed(0)} em R$ {targetNum} em {daysNum} dias, sua banca precisa bater esse crescimento diário.
                            </p>
                        </div>
                    </div>

                    {/* CARD 3: LISTA DE MÉTODOS SINCRONIZADOS */}
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><BarChart4 size={16} className="text-indigo-500"/> Seus Métodos em Atividade</h3>
                        
                        <div className="space-y-3">
                            {methodAnalytics.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <p className="text-sm text-slate-500 font-medium">Você ainda não possui métodos com dados suficientes. Comece a registrar suas apostas!</p>
                                </div>
                            ) : (
                                methodAnalytics.map((m, i) => (
                                    <div key={i} className="group bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-indigo-500/30 transition-all cursor-default">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${m.ev > 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                                                {m.ev > 0 ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase italic truncate max-w-[120px] sm:max-w-[200px]">{m.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">{m.count} entradas · Odd Média @{m.avgOdd.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 sm:gap-8 items-center">
                                            <div className="text-center hidden sm:block">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Win Rate</p>
                                                <p className="text-sm font-mono font-black text-slate-700 dark:text-slate-200">{m.winRate.toFixed(1)}%</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Valor (EV)</p>
                                                <p className={`text-sm font-mono font-black ${m.ev > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{m.ev > 0 ? '+' : ''}{m.ev.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* CARD 4: CONSELHO DO ANALISTA */}
                    <div className={`p-6 rounded-[2rem] border flex gap-4 items-start ${currentMethod.ev > dailyGrowthNeeded ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-slate-900/80 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-slate-900/80 dark:border-amber-500/20 dark:text-amber-400'}`}>
                        <ShieldAlert size={24} className="shrink-0 mt-1" />
                        <div>
                            <h4 className="text-sm font-black uppercase mb-1 tracking-widest">Veredito do Oráculo</h4>
                            <p className="text-xs leading-relaxed opacity-90 font-medium">
                                {currentMethod.ev > dailyGrowthNeeded 
                                    ? `Excelente. O Edge (Valor Esperado) do seu melhor método atual ("${currentMethod.name}") é de ${currentMethod.ev.toFixed(1)}%. Isso é superior ao crescimento diário exigido pela sua meta. Mantenha a disciplina de execução.`
                                    : `Sua meta exige um crescimento de ${dailyGrowthNeeded.toFixed(1)}% ao dia, mas seu método com mais entradas ("${currentMethod.name}") entrega um EV de ${currentMethod.ev.toFixed(1)}%. Matematicamente, você precisará aumentar seu volume de apostas diárias ou estender o prazo para não quebrar a banca alavancando a stake.`
                                }
                            </p>
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
                <h4 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Informação PRO</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 uppercase font-bold tracking-wider">{sidebarInfo.title}</p>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        {sidebarInfo.text}
                    </p>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                       <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                       <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                         Lembre-se: Todas as calculadoras assumem liquidez. Verifique os limites da casa antes de operar. Resultados são probabilidades matemáticas.
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