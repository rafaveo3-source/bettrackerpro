import React, { useState, useMemo, useEffect } from 'react';
import { useBetStore, Goal, Bet } from '../store/useBetStore';
import { Target, ArrowLeft, Plus, Wallet, Sparkles, Trophy, Info, Edit3, Trash2, Lock, BarChart2, ChevronDown, CheckCircle2, XCircle, Clock, Zap, AlertCircle } from 'lucide-react'; 
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
      setGoalName(`META: ${strategy.name}`); // Nome inteligente mantendo seu padrão
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

  // --- LÓGICA DE CÁLCULO AUTOMÁTICO E LINK DE APOSTAS ---
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
    let statusColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
    
    if (progress >= 100 || goal.status === 'completed') { 
        status = 'Concluída'; 
        statusColor = 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20'; 
    } else if (probabilityScore < 50) { 
        status = 'Improvável'; 
        statusColor = 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'; 
    } else if (probabilityScore < 80) { 
        status = 'Em Risco'; 
        statusColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'; 
    }

    // 🔥 FILTRO INTELIGENTE
    const titleLower = goal.title.toLowerCase();
    let linkedStrategyName = goal.title;
    
    if (titleLower.startsWith('meta:')) {
        linkedStrategyName = goal.title.substring(5).trim();
    } else if (titleLower.startsWith('missão:')) {
        linkedStrategyName = goal.title.substring(7).trim();
    }
    
    const targetName = linkedStrategyName.toLowerCase();

    const strategyBets = bankrollBets.filter(b => {
        const betStrategy = (b.strategy || '').toLowerCase();
        const betMethod = (b.method || '').toLowerCase();
        return (betStrategy === targetName) || (betMethod === targetName);
    });

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

  const cardClass = "bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm transition-all";
  const inputClass = "bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-indigo-500 transition-colors w-full";

  if (view === 'config') {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 max-w-6xl mx-auto w-full overflow-x-hidden font-sans">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-[#2C2C2E] pb-6">
          <div>
            <button onClick={() => { setView('list'); setEditingGoalId(null); }} className="flex items-center gap-2 text-slate-500 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white transition-colors font-bold text-[10px] uppercase tracking-widest mb-4">
              <ArrowLeft size={14} /> Voltar
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {editingGoalId ? 'Recalibrar Alvo' : 'Nova Diretriz'}
            </h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          <div className="lg:col-span-2 space-y-6">
            <section className={cardClass}>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-500/20"><Edit3 size={18} /></div>
                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-lg">Configuração</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-2 block">Nome do Objetivo</label>
                  <input 
                    type="text" 
                    value={goalName} 
                    onChange={e => setGoalName(e.target.value)} 
                    placeholder="Ex: META: Alavancagem 10k" 
                    className={inputClass} 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-2 block">Banca Vinculada</label>
                    <div className="relative">
                        <select 
                            value={linkedBankrollId} 
                            onChange={e => setLinkedBankrollId(e.target.value)} 
                            className={`${inputClass} appearance-none cursor-pointer pr-10`}
                        >
                        {bankrolls.map(b => <option key={b.id} value={b.id}>{b.name} ({b.currency})</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-2 block">Categoria</label>
                    <div className="relative">
                        <select 
                            value={goalCategory} 
                            onChange={e => setGoalCategory(e.target.value)} 
                            className={`${inputClass} appearance-none cursor-pointer pr-10`}
                        >
                        <option value="Long Term">Longo Prazo</option>
                        <option value="Short Term">Curto Prazo</option>
                        <option value="Safety">Blindagem</option>
                        <option value="Growth Strategy">Estratégia de Crescimento</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-2 block">Alvo Financeiro (Take Profit)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 font-bold">$</span>
                      <input 
                        type="number" 
                        value={goalTarget} 
                        onChange={e => setGoalTarget(e.target.value)} 
                        className={`${inputClass} pl-8 font-mono text-lg`} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-2 block">Data Limite</label>
                    <input 
                        type="date" 
                        value={goalDeadline} 
                        onChange={e => setGoalDeadline(e.target.value)} 
                        className={inputClass} 
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className={cardClass}>
                <h4 className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                  Simulação de Performance
                </h4>

                <div className="space-y-6">
                  <div>
                    <p className="text-slate-500 dark:text-[#8E8E93] text-[10px] uppercase font-bold tracking-widest mb-1">Meta Diária Necessária</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-mono">{formatCurrency(projectionData.dailyNeed)}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-[#2C2C2E] pt-5">
                    <div>
                      <p className="text-slate-500 dark:text-[#8E8E93] text-[10px] uppercase font-bold tracking-widest mb-1">Dias Restantes</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{projectionData.days}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-[#8E8E93] text-[10px] uppercase font-bold tracking-widest mb-1">ROI / Dia</p>
                      <p className={`text-xl font-bold font-mono ${projectionData.roiNeeded > 2 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {projectionData.roiNeeded.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  {projectionData.roiNeeded > 3 && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3 mt-4">
                      <Info className="text-red-500 shrink-0 mt-0.5" size={16} />
                      <p className="text-xs text-red-700 dark:text-red-400 font-medium leading-relaxed">Risco Alto: A meta exige um ROI diário agressivo.</p>
                    </div>
                  )}
                </div>
            </div>

            <button onClick={handleCreateOrUpdate} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-sm transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              {editingGoalId ? 'Atualizar Parâmetros' : 'Inicializar Meta'} <Target size={16} />
            </button>
          </aside>
        </div>
      </motion.div>
    );
  }

  // --- RENDER LIST VIEW ---
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 w-full overflow-x-hidden font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-[#2C2C2E] pb-6">
        <div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
              Strategic Performance Engine
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Metas & Objetivos
            </h1>
            <p className="text-slate-500 dark:text-[#8E8E93] text-sm font-medium">
              Gestão de Performance Orientada a Resultados. (Auto-Lock ao bater a meta)
            </p>
          </div>
        </div>
        <button onClick={() => setView('config')} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl flex justify-center items-center gap-2 font-bold uppercase text-xs tracking-widest transition-colors shadow-sm">
          <Plus size={16} /> Criar Nova Meta
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeGoals.length === 0 ? (
            <div className={`${cardClass} flex flex-col items-center justify-center text-center py-16`}>
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] flex items-center justify-center text-slate-400 dark:text-[#8E8E93] mb-6"><Target size={32} /></div>
              <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-3 tracking-tight">
                Nenhuma Meta Ativa
              </h3>
              <p className="text-slate-500 dark:text-[#8E8E93] text-sm max-w-sm leading-relaxed font-medium">
                Traders consistentes operam com direção clara. Defina um alvo estratégico. Quando o alvo for batido, ele trava para garantir seu lucro.
              </p>
            </div>
          ) : (
            activeGoals.map(goal => {
              const stats = getGoalAnalytics(goal);
              if (!stats) return null;
              const isExpanded = expandedGoalId === goal.id;

              return (
                <motion.div layout key={goal.id} className={`${cardClass} group relative overflow-hidden hover:border-slate-300 dark:hover:border-[#3A3A3C] !p-0`}>
                  
                  {/* CABEÇALHO DO CARD DA META */}
                  <div className="p-6 md:p-8 cursor-pointer" onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}>
                    <div className="flex flex-wrap justify-between items-start mb-8 relative z-10 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-[#000000] text-indigo-600 dark:text-indigo-400 rounded-xl border border-slate-200 dark:border-[#2C2C2E]"><Target size={20} /></div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
                              {goal.title} <ChevronDown size={18} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-[9px] bg-slate-100 dark:bg-[#2C2C2E] text-slate-500 dark:text-[#8E8E93] px-2 py-1 rounded border border-slate-200 dark:border-[#3A3A3C] font-bold uppercase tracking-widest">{goal.category}</span>
                            <div className={`px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${stats.statusColor}`}>
                              {stats.status === 'Improvável' && <Info size={12} />}
                              {stats.status === 'Em Risco' && <BarChart2 size={12} />}
                              {stats.status === 'Concluída' && <Trophy size={12} />}
                              {stats.status === 'No Caminho' && <Target size={12} />}
                              {stats.status}
                              <span className="opacity-70 border-l border-current pl-1.5 ml-0.5">{stats.probabilityScore.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(goal); }} className="p-2.5 text-slate-500 dark:text-[#8E8E93] hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-[#000000] rounded-lg border border-slate-200 dark:border-[#2C2C2E] transition-colors"><Edit3 size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); confirm('Excluir?') && deleteGoal(goal.id); }} className="p-2.5 text-slate-500 dark:text-[#8E8E93] hover:text-red-500 dark:hover:text-red-400 bg-slate-50 dark:bg-[#000000] rounded-lg border border-slate-200 dark:border-[#2C2C2E] transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {/* VISUALIZAÇÃO DOS GRÁFICOS (REDUZIDA SE EXPANDIDO) */}
                    {!isExpanded && (
                      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 border-t border-slate-100 dark:border-[#2C2C2E] pt-6">
                        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-[#2C2C2E]" />
                            <motion.circle 
                              initial={{ strokeDashoffset: 301 }} 
                              animate={{ strokeDashoffset: 301 * (1 - stats.progress / 100) }} 
                              cx="56" cy="56" r="48" 
                              stroke="currentColor" strokeWidth="8" fill="transparent" 
                              strokeDasharray="301" 
                              className={`${stats.status === 'Improvável' ? 'text-red-500' : 'text-indigo-500'} transition-all duration-1000`} 
                              strokeLinecap="round" 
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.progress.toFixed(0)}%</span>
                            <span className="text-[8px] font-bold uppercase text-slate-500 dark:text-[#8E8E93] tracking-widest mt-0.5">{stats.daysLeft} Dias</span>
                          </div>
                        </div>

                        <div className="flex-1 w-full space-y-5">
                          <div className="flex justify-between items-end pb-4 border-b border-slate-100 dark:border-[#2C2C2E]">
                            <div className="space-y-2 w-full mr-6">
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-[#2C2C2E] rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${stats.progress}%` }}
                                  transition={{ duration: 1 }}
                                  className={`h-full ${stats.status === 'Improvável' ? 'bg-red-500' : stats.status === 'Em Risco' ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                />
                              </div>
                              <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#8E8E93]">
                                <span>Progresso</span>
                                <span>{stats.progress.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <p className="text-[9px] text-slate-400 dark:text-[#8E8E93] font-bold uppercase tracking-widest mb-1">Take Profit</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-mono">{formatCurrency(goal.target, stats.currency)}</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-[#8E8E93] font-medium">
                              <Wallet size={14} className="text-indigo-500" /> 
                              <span className="uppercase tracking-widest text-[9px] font-bold">Banca: {stats.bankrollName}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] text-slate-400 dark:text-[#8E8E93] font-bold uppercase tracking-widest mb-1">Saldo Atual</p>
                                <p className="text-base font-bold text-slate-900 dark:text-white tracking-tight font-mono">{formatCurrency(stats.current, stats.currency)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ==========================================
                      MÓDULO EXPANDÍVEL (MISSION HUB / HISTÓRICO)
                      ========================================== */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-50 dark:bg-[#000000] border-t border-slate-100 dark:border-[#2C2C2E] p-6 md:p-8"
                      >
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* LADO ESQUERDO: ROADMAP DA ESTRATÉGIA */}
                            <div>
                               <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                                  <Zap size={14}/> Instruções da Operação
                               </h4>
                               {stats.linkedStrategyName && customStrategies.some(cs => cs.name.toLowerCase() === stats.linkedStrategyName.toLowerCase()) ? (
                                   <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-5 border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
                                       <p className="text-xs text-slate-600 dark:text-[#E5E5EA] leading-relaxed font-medium mb-4">
                                          Siga o modelo importado para atingir este objetivo com previsibilidade. Ao criar um novo registro, selecione a gestão "{stats.linkedStrategyName}" para que o sistema consolide os dados.
                                       </p>
                                       <ul className="space-y-3 border-t border-slate-100 dark:border-[#2C2C2E] pt-4">
                                           <li className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-white"><CheckCircle2 size={14} className="text-emerald-500"/> Respeite a Stake do Plano</li>
                                           <li className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-white"><CheckCircle2 size={14} className="text-emerald-500"/> Busque apenas o mercado da estratégia</li>
                                           <li className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-white"><AlertCircle size={14} className="text-red-500"/> Respeite o Stop Loss e o Take Profit</li>
                                       </ul>
                                   </div>
                               ) : (
                                   <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-5 border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
                                       <p className="text-xs text-slate-600 dark:text-[#E5E5EA] leading-relaxed font-medium">
                                          Crescimento de Patrimônio Livre. Vincule um método ao registrar a operação para que o sistema apresente a auditoria detalhada abaixo.
                                       </p>
                                   </div>
                               )}

                               {/* Resumo Financeiro Pequeno */}
                               <div className="mt-4 grid grid-cols-2 gap-4">
                                   <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
                                       <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 dark:text-[#8E8E93] mb-1">Progresso Atual</p>
                                       <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.progress.toFixed(0)}%</p>
                                   </div>
                                   <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
                                       <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 dark:text-[#8E8E93] mb-1">Restam</p>
                                       <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-mono">{formatCurrency(stats.missing, stats.currency)}</p>
                                   </div>
                               </div>
                            </div>

                            {/* LADO DIREITO: HISTÓRICO LINKADO */}
                            <div>
                               <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                                  <Target size={14}/> Diário de Entradas (Filtro Inteligente)
                               </h4>
                               
                               <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                   {stats.strategyBets.length === 0 ? (
                                       <div className="text-center py-8 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#636366] border border-dashed border-slate-200 dark:border-[#3A3A3C] rounded-xl bg-white dark:bg-[#1C1C1E]">
                                          Nenhum registro atrelado a este portfólio/método.
                                       </div>
                                   ) : (
                                       stats.strategyBets.map((bet: Bet) => (
                                           <div key={bet.id} className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] p-4 rounded-xl flex justify-between items-center shadow-sm hover:border-indigo-500/30 transition-colors">
                                               <div className="flex-1 min-w-0 pr-4">
                                                   <p className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">{bet.event}</p>
                                                   <p className="text-[9px] text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mt-1 truncate font-bold">{bet.selection}</p>
                                               </div>
                                               <div className="text-right shrink-0">
                                                   <p className={`text-sm font-bold font-mono tracking-tight ${bet.profit > 0 ? 'text-emerald-600 dark:text-emerald-400' : bet.profit < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                                       {bet.profit > 0 ? '+' : ''}{formatCurrency(bet.profit, stats.currency)}
                                                   </p>
                                                   <p className="text-[10px] text-slate-400 dark:text-[#636366] font-mono mt-1 font-bold">@ {bet.odds.toFixed(2)}</p>
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
          <div className={cardClass}>
            <div className="flex items-center gap-3 mb-8">
              <Trophy className="text-amber-500" size={20} />
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-lg">Galeria de Troféus</h3>
            </div>
            
            <div className="space-y-4">
              {completedGoals.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-slate-200 dark:border-[#3A3A3C] rounded-xl bg-slate-50 dark:bg-[#000000]">
                  <Lock size={20} className="mx-auto text-slate-400 dark:text-[#636366] mb-3" />
                  <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] font-bold uppercase tracking-widest">Aguardando Vitórias</p>
                </div>
              ) : (
                completedGoals.map(goal => (
                  <div key={goal.id} className="flex items-center justify-between bg-white dark:bg-[#000000] p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500 opacity-5 rounded-full transform translate-x-4 -translate-y-4"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-500 text-white shadow-sm">
                            <Trophy size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase truncate max-w-[120px]">{goal.title}</p>
                          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mt-1">Alvo Atingido</p>
                        </div>
                    </div>
                    <div className="text-right relative z-10">
                        <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(goal.target)}</p>
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