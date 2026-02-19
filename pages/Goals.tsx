import React, { useState, useMemo, useEffect } from 'react';
import { useBetStore, Goal, Bet } from '../store/useBetStore';
import { Target, ArrowLeft, Plus, Wallet, Sparkles, Trophy, Info, Edit3, Trash2, Lock, BarChart2, ChevronDown, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const Goals: React.FC = () => {
  const { bankrolls, activeBankrollId, goals, history, addGoal, updateGoal, deleteGoal, customStrategies } = useBetStore();
  const [view, setView] = useState<'list' | 'config'>('list');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  
  // Controle de qual meta está expandida
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  const location = useLocation();

  const [goalName, setGoalName] = useState('');
  const [goalCategory, setGoalCategory] = useState('Long Term');
  const [goalTarget, setGoalTarget] = useState('10000');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [linkedBankrollId, setLinkedBankrollId] = useState(activeBankrollId);

  useEffect(() => {
    if (location.state && location.state.createFromStrategy) {
      const strategy = location.state.createFromStrategy;
      setView('config');
      setGoalName(`Missão: ${strategy.name}`); // Nome inteligente
      setGoalCategory('Growth Strategy');
      setLinkedBankrollId(activeBankrollId);

      const currentBankroll = bankrolls.find(b => b.id === activeBankrollId);
      if (currentBankroll) {
        let multiplier = 1.5;
        if (strategy.risk === 'alto') multiplier = 5;
        else if (strategy.risk === 'médio') multiplier = 2;
        
        const suggestedTarget = currentBankroll.initialBalance * multiplier;
        setGoalTarget(suggestedTarget.toString());
      }

      const date = new Date();
      date.setDate(date.getDate() + 30);
      setGoalDeadline(date.toISOString().split('T')[0]);

      window.history.replaceState({}, document.title);
    }
  }, [location, activeBankrollId, bankrolls]);

  useEffect(() => { 
      if (!editingGoalId) setLinkedBankrollId(activeBankrollId); 
  }, [activeBankrollId, editingGoalId]);

  const formatCurrency = (val: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(val);
  };

  // --- LÓGICA DE CÁLCULO AUTOMÁTICO ---
  const getGoalAnalytics = (goal: Goal) => {
    const bankroll = bankrolls.find(b => b.id === goal.bankroll_id);
    if (!bankroll) return null;

    const bankrollBets = history.filter(b => b.bankrollId === goal.bankroll_id && b.status !== 'void' && b.status !== 'refunded');
    const totalProfit = bankrollBets.reduce((acc, bet) => acc + bet.profit, 0);
    const currentBalance = bankroll.initialBalance + totalProfit;
    
    const progress = Math.min(100, Math.max(0, (currentBalance / goal.target) * 100));
    const missing = Math.max(0, goal.target - currentBalance);

    const daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
    
    const firstBet = bankrollBets[bankrollBets.length - 1]; 
    const daysSinceStart = firstBet ? Math.max(1, Math.ceil((new Date().getTime() - new Date(firstBet.date).getTime()) / (1000 * 3600 * 24))) : 1;
    const avgDailyProfit = totalProfit / daysSinceStart;
    
    let probabilityScore = 0;
    if (goal.target > currentBalance) {
        const projectedGain = avgDailyProfit * daysLeft;
        probabilityScore = Math.min(100, Math.max(0, (projectedGain / missing) * 100));
        if (avgDailyProfit <= 0) probabilityScore = 0;
    } else {
        probabilityScore = 100;
    }
    
    let status = 'No Caminho';
    let statusColor = 'text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10';
    
    if (progress >= 100 || goal.status === 'completed') { 
        status = 'Concluída'; 
        statusColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-200 dark:bg-emerald-500/20'; 
    } else if (probabilityScore < 50) { 
        status = 'Improvável'; 
        statusColor = 'text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-500/10'; 
    } else if (probabilityScore < 80) { 
        status = 'Em Risco'; 
        statusColor = 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/10'; 
    }

    // Identifica qual estratégia o usuário tentou linkar baseado no nome da meta
    const linkedStrategyName = goal.title.replace('Missão: ', '').trim();
    const strategyBets = bankrollBets.filter(b => b.strategy === linkedStrategyName || b.method === linkedStrategyName);

    return { 
      current: currentBalance, progress, currency: bankroll.currency, missing, daysLeft, probabilityScore, status, statusColor, bankrollName: bankroll.name,
      strategyBets, linkedStrategyName
    };
  };

  const handleCreateOrUpdate = () => {
    if (!goalName || !goalTarget || !goalDeadline) return;
    
    const payload = {
      title: goalName,
      category: goalCategory,
      target: parseFloat(goalTarget),
      deadline: goalDeadline,
      bankroll_id: linkedBankrollId,
      type: 'custom' as const
    };

    if (editingGoalId) {
      updateGoal(editingGoalId, payload);
    } else {
      addGoal(payload);
    }
    setEditingGoalId(null); setView('list');
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoalId(goal.id); setGoalName(goal.title); setGoalCategory(goal.category); setGoalTarget(goal.target.toString()); setGoalDeadline(goal.deadline); setLinkedBankrollId(goal.bankroll_id); setView('config');
  };

  // --- PROJEÇÕES (VIEW CONFIG) ---
  const projectionData = useMemo(() => {
    if (!goalDeadline || !goalTarget) return { days: 0, dailyNeed: 0, roiNeeded: 0 };
    const diff = new Date(goalDeadline).getTime() - new Date().getTime();
    const days = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    const br = bankrolls.find(b => b.id === linkedBankrollId);
    const profit = history.filter(b => b.bankrollId === linkedBankrollId && b.status !== 'void' && b.status !== 'refunded').reduce((acc, b) => acc + b.profit, 0);
    const currentBal = br ? br.initialBalance + profit : 0;
    const targetVal = parseFloat(goalTarget);
    const missing = Math.max(0, targetVal - currentBal);
    const dailyNeed = days > 0 ? missing / days : 0;
    const roiNeeded = (br && br.initialBalance > 0) ? (dailyNeed / br.initialBalance) * 100 : 0;
    return { days, dailyNeed, roiNeeded };
  }, [goalDeadline, goalTarget, linkedBankrollId, bankrolls, history]);

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed' || getGoalAnalytics(g)?.progress >= 100);

  if (view === 'config') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 max-w-6xl mx-auto w-full overflow-x-hidden">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <button onClick={() => { setView('list'); setEditingGoalId(null); }} className="flex items-center gap-3 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.2em]">
            <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors"><ArrowLeft size={16} /></div>
            Voltar
          </button>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
            {editingGoalId ? 'Recalibrar Alvo' : 'Nova Diretriz'}
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-8 md:p-10 relative overflow-hidden rounded-[2.5rem] shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px]"></div>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg"><Edit3 size={18} /></div>
                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">Configuração</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Nome do Objetivo</label>
                  <input 
                    type="text" 
                    value={goalName} 
                    onChange={e => setGoalName(e.target.value)} 
                    placeholder="Ex: Alavancagem 10k" 
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 rounded-xl px-5 py-4 text-slate-900 dark:text-white font-bold outline-none transition-all placeholder:text-slate-400" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Banca Vinculada</label>
                    <select 
                        value={linkedBankrollId} 
                        onChange={e => setLinkedBankrollId(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 rounded-xl px-5 py-4 text-slate-900 dark:text-white font-bold outline-none transition-all appearance-none cursor-pointer"
                    >
                      {bankrolls.map(b => <option key={b.id} value={b.id}>{b.name} ({b.currency})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Categoria</label>
                    <select 
                        value={goalCategory} 
                        onChange={e => setGoalCategory(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 rounded-xl px-5 py-4 text-slate-900 dark:text-white font-bold outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Long Term">Longo Prazo</option>
                      <option value="Short Term">Curto Prazo</option>
                      <option value="Safety">Blindagem</option>
                      <option value="Growth Strategy">Estratégia de Crescimento</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Alvo Financeiro (Take Profit)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 font-black">$</span>
                      <input 
                        type="number" 
                        value={goalTarget} 
                        onChange={e => setGoalTarget(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 rounded-xl pl-10 pr-5 py-4 text-slate-900 dark:text-white font-black text-lg outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Data Limite</label>
                    <input 
                        type="date" 
                        value={goalDeadline} 
                        onChange={e => setGoalDeadline(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 rounded-xl px-5 py-4 text-slate-900 dark:text-white font-bold outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="bg-gradient-to-b from-emerald-500/10 to-slate-100 dark:to-slate-900/50 rounded-3xl p-[1px] border border-emerald-500/20">
              <div className="bg-white dark:bg-[#0f172a] rounded-[1.4rem] p-6 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500"><Sparkles size={40} /></div>
                
                <h4 className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  Simulação de Performance
                </h4>

                <div className="space-y-6">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold mb-1">Meta Diária Necessária</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(projectionData.dailyNeed)}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold mb-1">Dias Restantes</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{projectionData.days}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold mb-1">ROI / Dia</p>
                      <p className={`text-xl font-bold ${projectionData.roiNeeded > 2 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {projectionData.roiNeeded.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  {projectionData.roiNeeded > 3 && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 flex items-start gap-2">
                      <Info className="text-red-500 shrink-0 mt-0.5" size={14} />
                      <p className="text-[10px] text-red-600 dark:text-red-300 leading-relaxed">Risco Alto: A meta exige um ROI diário agressivo.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button onClick={handleCreateOrUpdate} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              {editingGoalId ? 'Atualizar Parâmetros' : 'Inicializar Meta'} <Target size={16} />
            </button>
          </aside>
        </div>
      </motion.div>
    );
  }

  // --- RENDER LIST VIEW ---
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 w-full overflow-x-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-widest mb-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
              Strategic Performance Engine
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
              Metas & Objetivos <span className="text-slate-400 dark:text-slate-700 text-lg">///</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
              Gestão de Performance Orientada a Resultados. (Auto-Lock ao bater a meta)
            </p>
          </div>
        </div>
        <button onClick={() => setView('config')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold uppercase text-xs tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
          <Plus size={16} /> Criar Nova Meta
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeGoals.length === 0 ? (
            <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 mb-6"><Target size={32} /></div>
              <h3 className="text-slate-900 dark:text-white font-black text-lg mb-2 uppercase tracking-wider">
                Nenhuma Meta Ativa
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm leading-relaxed">
                Traders consistentes operam com direção clara. Defina um alvo estratégico. Quando o alvo for batido, ele trava para garantir seu lucro.
              </p>
            </div>
          ) : (
            activeGoals.map(goal => {
              const stats = getGoalAnalytics(goal);
              if (!stats) return null;
              const isExpanded = expandedGoalId === goal.id;

              return (
                <motion.div layout key={goal.id} className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 group relative overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm">
                  
                  {/* CABEÇALHO DO CARD DA META */}
                  <div className="flex flex-wrap justify-between items-start mb-8 relative z-10 gap-4 cursor-pointer" onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-xl border border-slate-200 dark:border-slate-700"><Target size={20} /></div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-2">
                            {goal.title} <ChevronDown size={18} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 font-bold uppercase">{goal.category}</span>
                          <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${stats.statusColor}`}>
                            {stats.status === 'Improvável' && <Info size={12} />}
                            {stats.status === 'Em Risco' && <BarChart2 size={12} />}
                            {stats.status === 'Concluída' && <Trophy size={12} />}
                            {stats.status === 'No Caminho' && <Target size={12} />}
                            {stats.status}
                            <span className="opacity-70">• {stats.probabilityScore.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(goal); }} className="p-2 text-slate-500 dark:text-slate-400 hover:text-white bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-900 dark:hover:bg-slate-800 transition-colors"><Edit3 size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); confirm('Excluir?') && deleteGoal(goal.id); }} className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-400 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-900 dark:hover:bg-slate-800 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* VISUALIZAÇÃO DOS GRÁFICOS (REDUZIDA SE EXPANDIDO) */}
                  {!isExpanded && (
                    <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                      <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-slate-800" />
                          <motion.circle 
                            initial={{ strokeDashoffset: 351 }} 
                            animate={{ strokeDashoffset: 351 * (1 - stats.progress / 100) }} 
                            cx="64" cy="64" r="56" 
                            stroke="currentColor" strokeWidth="8" fill="transparent" 
                            strokeDasharray="351.86" 
                            className={`${stats.status === 'Improvável' ? 'text-red-500' : 'text-emerald-500'} transition-all duration-1000`} 
                            strokeLinecap="round" 
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.progress.toFixed(0)}%</span>
                          <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-500 tracking-widest">{stats.daysLeft} Dias</span>
                        </div>
                      </div>

                      <div className="flex-1 w-full space-y-5">
                        <div className="flex justify-between items-end pb-4 border-b border-slate-200 dark:border-slate-800">
                          <div className="space-y-2 w-full mr-4">
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.progress}%` }}
                                transition={{ duration: 1 }}
                                className={`h-full ${stats.status === 'Improvável' ? 'bg-red-500' : stats.status === 'Em Risco' ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              <span>Progresso</span>
                              <span>{stats.progress.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Take Profit</p>
                            <p className="text-xl font-bold text-slate-400 dark:text-slate-500 tracking-tighter">{formatCurrency(goal.target, stats.currency)}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                            <Wallet size={12} className="text-emerald-500" /> 
                            <span className="uppercase tracking-wide text-[10px] font-bold">Banca: {stats.bankrollName}</span>
                          </div>
                          <div className="text-right">
                              <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Saldo Atual</p>
                              <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(stats.current, stats.currency)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ==========================================
                      MÓDULO EXPANDÍVEL (MISSION HUB / HISTÓRICO)
                      ========================================== */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-2 relative z-10"
                      >
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* LADO ESQUERDO: ROADMAP DA ESTRATÉGIA */}
                            <div>
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-4 flex items-center gap-2">
                                  <Zap size={14}/> Instruções da Operação
                               </h4>
                               {stats.linkedStrategyName && customStrategies.some(cs => cs.name === stats.linkedStrategyName) ? (
                                   <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                                       <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-3">
                                          Siga o modelo importado para bater essa meta de forma consistente. Ao lançar uma nova aposta, marque a estratégia "{stats.linkedStrategyName}" para que o sistema amarre os dados.
                                       </p>
                                       <ul className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                                           <li className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300"><CheckCircle2 size={14} className="text-emerald-500"/> Respeite a Stake do Plano</li>
                                           <li className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300"><CheckCircle2 size={14} className="text-emerald-500"/> Busque apenas o mercado da estratégia</li>
                                           <li className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300"><AlertCircle size={14} className="text-red-500"/> Respeite o Stop Loss e o Take Profit</li>
                                       </ul>
                                   </div>
                               ) : (
                                   <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                                       <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                          Esta meta é de crescimento livre. Selecione um método ao enviar as apostas para que o sistema mostre o histórico linkado aqui.
                                       </p>
                                   </div>
                               )}

                               {/* Resumo Financeiro Pequeno */}
                               <div className="mt-4 grid grid-cols-2 gap-3">
                                   <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-800">
                                       <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Progresso Atual</p>
                                       <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{stats.progress.toFixed(0)}%</p>
                                   </div>
                                   <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-800">
                                       <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Restam</p>
                                       <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.missing, stats.currency)}</p>
                                   </div>
                               </div>
                            </div>

                            {/* LADO DIREITO: HISTÓRICO LINKADO */}
                            <div>
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                                  <Target size={14}/> Diário de Entradas
                               </h4>
                               
                               <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                   {stats.strategyBets.length === 0 ? (
                                       <div className="text-center py-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                          Nenhuma aposta linkada a esta estratégia/método.
                                       </div>
                                   ) : (
                                       stats.strategyBets.map((bet: Bet) => (
                                           <div key={bet.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex justify-between items-center shadow-sm">
                                               <div className="flex-1 truncate pr-2">
                                                   <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{bet.event}</p>
                                                   <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5 truncate">{bet.selection}</p>
                                               </div>
                                               <div className="text-right shrink-0">
                                                   <p className={`text-sm font-black ${bet.profit > 0 ? 'text-emerald-500' : bet.profit < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                       {bet.profit > 0 ? '+' : ''}{formatCurrency(bet.profit, stats.currency)}
                                                   </p>
                                                   <p className="text-[9px] text-slate-400 font-mono mt-0.5">Odd {bet.odds}</p>
                                               </div>
                                           </div>
                                       ))
                                   )}
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              );
            })
          )}
        </div>

        {/* Sidebar Achievements */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="text-yellow-500" size={18} />
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">Galeria de Troféus</h3>
            </div>
            
            <div className="space-y-3">
              {completedGoals.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Lock size={20} className="mx-auto text-slate-400 dark:text-slate-700 mb-2" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-600 font-bold uppercase tracking-widest">Bloqueado</p>
                </div>
              ) : (
                completedGoals.map(goal => (
                  <div key={goal.id} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white dark:bg-emerald-400 opacity-5 rounded-full transform translate-x-4 -translate-y-4"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                            <Trophy size={18} />
                        </div>
                        <div>
                        <p className="text-xs font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-tight">{goal.title}</p>
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Alvo Atingido</p>
                        </div>
                    </div>
                    <div className="text-right relative z-10">
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(goal.target)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Goals;