import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Scale, Percent, ArrowRightLeft, 
  Target, TrendingUp, AlertTriangle, Lock, Crown, 
  Crosshair, DollarSign, Goal,
  Clock, ShieldAlert, FileText,
  PiggyBank, LineChart, Calendar, Zap, CheckCircle2
} from 'lucide-react';
import { useBetStore } from '../store/useBetStore';
import { motion, AnimatePresence } from 'framer-motion';

const Calculators: React.FC = () => {
  const { user, currentBankrollBalance, isPro, bets = [] } = useBetStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'dutching'|'kelly'|'value'|'arb'|'stake'|'odds'|'compound'>('compound');

  const ProLockScreen = () => (
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden shadow-sm mt-6">
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

  // ==============================================
  // 🔥 NOVO: MOTOR EXTRATOR DE DADOS REAIS DO USUÁRIO
  // ==============================================
  const userMethodsStats = useMemo(() => {
      const stats: Record<string, { wins: number, resolved: number, totalOdds: number, count: number }> = {};
      
      bets.forEach(bet => {
          const method = bet.method || 'Sem Método';
          if (!stats[method]) stats[method] = { wins: 0, resolved: 0, totalOdds: 0, count: 0 };
          
          stats[method].count++;
          if (bet.odds && bet.odds > 1) {
              stats[method].totalOdds += Number(bet.odds);
          }
          
          if (['won', 'half-won', 'lost', 'half-lost'].includes(bet.status)) {
              stats[method].resolved++;
              if (bet.status === 'won' || bet.status === 'half-won') {
                  stats[method].wins++;
              }
          }
      });

      const processed = Object.entries(stats).map(([name, data]) => {
          const winRate = data.resolved > 0 ? (data.wins / data.resolved) * 100 : 0;
          const avgOdd = data.count > 0 ? data.totalOdds / data.count : 0;
          const ev = (winRate / 100) * avgOdd - 1;
          return { name, winRate, avgOdd, count: data.count, resolved: data.resolved, ev: ev * 100 };
      }).filter(m => m.resolved >= 3); // Só mostra métodos com pelo menos 3 apostas resolvidas para ter relevância estatística

      // Se o usuário não tiver métodos suficientes, cria um método de exemplo (Mock)
      if (processed.length === 0) {
          return [{ name: "Método Exemplo (Insira Dados Reais)", winRate: 60, avgOdd: 1.85, count: 0, resolved: 0, ev: 11.0 }];
      }

      return processed.sort((a, b) => b.count - a.count);
  }, [bets]);

  // Estados do Simulador PRO
  const [compBankroll, setCompBankroll] = useState(currentBankrollBalance > 0 ? String(currentBankrollBalance) : '1000');
  const [compTarget, setCompTarget] = useState(currentBankrollBalance > 0 ? String(currentBankrollBalance * 2) : '2000');
  const [compDays, setCompDays] = useState('30');
  
  const [selectedMethodName, setSelectedMethodName] = useState<string>(userMethodsStats[0]?.name || '');
  const selectedMethod = userMethodsStats.find(m => m.name === selectedMethodName) || userMethodsStats[0];

  // O usuário pode sobrescrever a realidade para fazer "E se?"
  const [simWinRate, setSimWinRate] = useState<string>(selectedMethod?.winRate.toFixed(1) || '60');
  const [simAvgOdd, setSimAvgOdd] = useState<string>(selectedMethod?.avgOdd.toFixed(2) || '1.85');
  const [simStake, setSimStake] = useState<string>('2');
  const [simEntries, setSimEntries] = useState<string>('3');

  // Toda vez que ele muda de método no Dropdown, atualiza os inputs com os dados reais
  const handleMethodChange = (name: string) => {
      setSelectedMethodName(name);
      const m = userMethodsStats.find(x => x.name === name);
      if (m) {
          setSimWinRate(m.winRate.toFixed(1));
          setSimAvgOdd(m.avgOdd.toFixed(2));
      }
  };

  // Cálculos do Dashboard de Ação
  const bankrollNum = parseFloat(compBankroll) || 0;
  const targetNum = parseFloat(compTarget) || 0;
  const daysNum = parseFloat(compDays) || 1;
  const wRate = parseFloat(simWinRate) / 100 || 0;
  const avgOdd = parseFloat(simAvgOdd) || 0;
  const stakePct = parseFloat(simStake) / 100 || 0;
  const entriesPerDay = parseFloat(simEntries) || 0;

  // Valor Esperado Real (EV) da simulação atual
  const methodEV = (wRate * avgOdd) - 1; 

  // Crescimento Diário (%) = EV * Stake% * Entradas
  // Ex: EV de 5%, Stake 2%, 3 entradas = 0.05 * 0.02 * 3 = 0.003 = 0.3% ao dia
  const expectedDailyGrowthPct = methodEV > 0 ? (methodEV * stakePct * entriesPerDay * 100) : (methodEV * stakePct * entriesPerDay * 100);
  const projectedBankroll = bankrollNum * Math.pow(1 + (expectedDailyGrowthPct / 100), daysNum);

  // Crescimento Diário Necessário para bater a meta
  const reqDailyGrowthRaw = targetNum > bankrollNum && bankrollNum > 0 ? (Math.pow(targetNum / bankrollNum, 1 / daysNum) - 1) : 0;
  const requiredDailyGrowthPct = reqDailyGrowthRaw * 100;

  const isGoalAchievable = expectedDailyGrowthPct >= requiredDailyGrowthPct && targetNum > bankrollNum;

  // GERAÇÃO DO PLANO DE AÇÃO (A Máquina da Verdade)
  const generateActionPlan = () => {
      if (bankrollNum >= targetNum) return { title: 'Meta Inválida', text: 'A meta deve ser maior que a banca inicial.', color: 'text-slate-500' };
      if (methodEV <= 0) return { title: '⚠️ EV NEGATIVO DETECTADO', text: 'O seu Win Rate e Odd Média não geram lucro matemático a longo prazo. Pare de apostar neste método imediatamente e revise sua estratégia.', color: 'text-red-500' };
      
      if (isGoalAchievable) {
          return { 
              title: '🎯 PLANO REALISTA. VOCÊ VAI BATER A META!', 
              text: `Mantenha a disciplina. Executando ${entriesPerDay} entradas/dia com ${simStake}% de stake, sua banca chegará em R$ ${projectedBankroll.toFixed(2)}, superando sua meta de R$ ${targetNum}.`, 
              color: 'text-emerald-500' 
          };
      }

      // Se não for alcançável, calcula o que falta
      const reqEntries = reqDailyGrowthRaw / (methodEV * stakePct);
      const reqStake = reqDailyGrowthRaw / (entriesPerDay * methodEV);
      const reqEV = reqDailyGrowthRaw / (stakePct * entriesPerDay);
      const reqWinRate = (reqEV + 1) / avgOdd;

      let planText = `Você precisa crescer ${requiredDailyGrowthPct.toFixed(2)}% ao dia, mas seu método atual gera apenas ${expectedDailyGrowthPct.toFixed(2)}%. Para alcançar os R$ ${targetNum}, escolha UMA das opções abaixo:\n\n`;
      
      let options = 0;
      if (reqEntries <= 20) {
          planText += `📌 Opção A: Aumentar seu volume para ${Math.ceil(reqEntries)} entradas por dia, mantendo a stake de ${simStake}%.\n`;
          options++;
      }
      if (reqStake <= 0.05) { // Stake segura <= 5%
          planText += `📌 Opção B: Subir sua stake para ${(reqStake * 100).toFixed(1)}% por entrada, mantendo as ${entriesPerDay} entradas.\n`;
          options++;
      }
      if (reqWinRate <= 0.85) { // Win rate humano <= 85%
          planText += `📌 Opção C: Melhorar seu método para acertar ${(reqWinRate * 100).toFixed(1)}% das apostas (na odd de @${avgOdd}).\n`;
          options++;
      }

      if (options === 0) {
          planText = `🚨 ALERTA VERMELHO: A sua meta é uma utopia matemática. Para atingi-la em apenas ${daysNum} dias, você teria que usar uma Stake Suicida de ${(reqStake * 100).toFixed(1)}% ou fazer ${Math.ceil(reqEntries)} apostas por dia. Aumente o prazo ou diminua a meta para proteger seu capital.`;
      }

      return { title: '⚠️ CHOQUE DE REALIDADE (Falta Edge)', text: planText, color: 'text-amber-500' };
  };

  const actionPlan = generateActionPlan();

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

  const inputClass = "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-mono text-sm w-full";

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
            {/* 🔥 NOVA ABA: PLANILHA DE GESTÃO PRO 🔥 */}
            {/* ========================================== */}
            {activeTab === 'compound' && !isPro && <ProLockScreen />}
            {activeTab === 'compound' && isPro && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm w-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <LineChart size={24} className="text-indigo-500" />
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Simulador Automático</h2>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                            <Zap size={12} fill="currentColor"/> Dados sincronizados
                        </div>
                    </div>

                    {/* SESSÃO 1: OBJETIVO */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 bg-slate-50 dark:bg-[#09090b] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/50">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2"><PiggyBank size={12}/> Banca Atual</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                <input type="number" value={compBankroll} onChange={e => setCompBankroll(e.target.value)} className={`${inputClass} pl-8 font-black text-slate-700 dark:text-slate-300`} />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Target size={12}/> Meta Desejada</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                <input type="number" value={compTarget} onChange={e => setCompTarget(e.target.value)} className={`${inputClass} pl-8 font-black text-indigo-600 dark:text-indigo-400 focus:border-indigo-500`} />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Calendar size={12}/> Em Quantos Dias?</label>
                            <input type="number" value={compDays} onChange={e => setCompDays(e.target.value)} className={`${inputClass} font-black text-indigo-600 dark:text-indigo-400 focus:border-indigo-500`} />
                        </div>
                    </div>

                    {/* SESSÃO 2: MOTOR DE VALIDAÇÃO (SEUS MÉTODOS) */}
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2"><Crosshair size={14} className="text-slate-400"/> Validador de Estratégia</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        {/* Seletor de Método Sincronizado */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Escolha seu Método Validado:</label>
                            <select 
                                value={selectedMethodName} 
                                onChange={e => handleMethodChange(e.target.value)}
                                className="w-full bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg p-2.5 font-bold text-sm outline-none focus:border-indigo-500 shadow-sm"
                            >
                                {userMethodsStats.map(m => (
                                    <option key={m.name} value={m.name}>{m.name} ({m.resolved} registros)</option>
                                ))}
                            </select>
                            
                            <div className="flex gap-4 mt-4">
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Win Rate Real %</label>
                                    <input type="number" step="0.1" value={simWinRate} onChange={e => setSimWinRate(e.target.value)} className={`${inputClass} text-center font-bold text-emerald-600 dark:text-emerald-400`} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Odd Média Real</label>
                                    <input type="number" step="0.01" value={simAvgOdd} onChange={e => setSimAvgOdd(e.target.value)} className={`${inputClass} text-center font-bold text-emerald-600 dark:text-emerald-400`} />
                                </div>
                            </div>
                            <p className="text-[9px] text-slate-400 mt-2 text-center">*(Campos editáveis para simulações)*</p>
                        </div>

                        {/* Variáveis de Controle */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                            <div className="mb-4">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex justify-between"><span>Stake Fixa (%)</span> <span className="text-indigo-500 font-black">{simStake}%</span></label>
                                <input type="range" min="0.5" max="10" step="0.5" value={simStake} onChange={e => setSimStake(e.target.value)} className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex justify-between"><span>Entradas por Dia</span> <span className="text-indigo-500 font-black">{simEntries} apostas</span></label>
                                <input type="range" min="1" max="20" step="1" value={simEntries} onChange={e => setSimEntries(e.target.value)} className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                            </div>
                        </div>
                    </div>

                    {/* SESSÃO 3: O VEREDITO E PLANO DE AÇÃO */}
                    <div className={`p-6 rounded-2xl border shadow-lg relative overflow-hidden transition-colors duration-500 ${
                        actionPlan.color === 'text-emerald-500' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' :
                        actionPlan.color === 'text-red-500' ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' :
                        'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
                    }`}>
                        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20 bg-current pointer-events-none -mr-10 -mt-10" style={{ color: actionPlan.color }}></div>
                        
                        <h3 className={`text-sm sm:text-base font-black uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10 ${actionPlan.color}`}>
                            {actionPlan.color === 'text-emerald-500' ? <CheckCircle2 size={20}/> : <AlertTriangle size={20}/>} 
                            {actionPlan.title}
                        </h3>
                        
                        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium relative z-10">
                            {actionPlan.text}
                        </div>

                        {/* Comparativo Matemático (HUD) */}
                        <div className="mt-6 pt-4 border-t border-current opacity-80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center relative z-10" style={{ borderColor: 'inherit' }}>
                            <div>
                                <p className="text-[9px] uppercase font-bold tracking-widest mb-1">EV do Método</p>
                                <p className={`font-mono font-black ${methodEV > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{(methodEV * 100).toFixed(2)}%</p>
                            </div>
                            <div>
                                <p className="text-[9px] uppercase font-bold tracking-widest mb-1">Banca Final Estimada</p>
                                <p className="font-mono font-black text-slate-900 dark:text-white">R$ {projectedBankroll.toFixed(0)}</p>
                            </div>
                            <div>
                                <p className="text-[9px] uppercase font-bold tracking-widest mb-1">Cresc. Diário Real</p>
                                <p className={`font-mono font-black ${expectedDailyGrowthPct > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{expectedDailyGrowthPct.toFixed(2)}%</p>
                            </div>
                            <div>
                                <p className="text-[9px] uppercase font-bold tracking-widest mb-1">Cresc. Diário P/ Meta</p>
                                <p className="font-mono font-black text-slate-900 dark:text-white">{requiredDailyGrowthPct.toFixed(2)}%</p>
                            </div>
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