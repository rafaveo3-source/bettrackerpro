import React, { useState, useMemo, useEffect } from 'react';
import { useBetStore, Goal } from '../store/useBetStore';
import { Target, ChevronLeft, ArrowLeft, Plus, Wallet, Sparkles, TrendingUp, Trophy, Info, Edit3, Trash2, Calendar, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Goals: React.FC = () => {
  const { bankrolls, activeBankrollId, goals, history, addGoal, updateGoal, deleteGoal } = useBetStore();
  const [view, setView] = useState<'list' | 'config'>('list');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Form states
  const [goalName, setGoalName] = useState('');
  const [goalCategory, setGoalCategory] = useState('Long Term');
  const [goalTarget, setGoalTarget] = useState('10000');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [linkedBankrollId, setLinkedBankrollId] = useState(activeBankrollId);

  useEffect(() => { setLinkedBankrollId(activeBankrollId); }, [activeBankrollId]);

  const formatCurrency = (val: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(val);
  };

  // --- LÓGICA DE CÁLCULO AUTOMÁTICO ---
  const getGoalProgress = (goal: Goal) => {
    const bankroll = bankrolls.find(b => b.id === goal.bankroll_id);
    if (!bankroll) return { current: 0, progress: 0, currency: 'BRL', missing: 0 };

    // Calcula lucro total vinculado a essa banca
    const bankrollBets = history.filter(b => b.bankrollId === goal.bankroll_id && b.status !== 'void');
    const totalProfit = bankrollBets.reduce((acc, bet) => acc + bet.profit, 0);
    
    // Saldo Atual Real = Inicial + Lucro
    const currentBalance = bankroll.initialBalance + totalProfit;
    
    const progress = Math.min(100, Math.max(0, (currentBalance / goal.target) * 100));
    const missing = Math.max(0, goal.target - currentBalance);

    return { 
      current: currentBalance, 
      progress, 
      currency: bankroll.currency,
      missing,
      initial: bankroll.initialBalance
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
      type: 'custom' as const // Forçando tipagem
    };

    if (editingGoalId) {
      updateGoal(editingGoalId, payload);
    } else {
      addGoal(payload);
    }
    setEditingGoalId(null); setView('list');
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setGoalName(goal.title);
    setGoalCategory(goal.category);
    setGoalTarget(goal.target.toString());
    setGoalDeadline(goal.deadline);
    setLinkedBankrollId(goal.bankroll_id);
    setView('config');
  };

  // --- PROJEÇÕES ---
  const projectionData = useMemo(() => {
    if (!goalDeadline || !goalTarget) return { days: 0, dailyNeed: 0, roiNeeded: 0 };
    
    const diff = new Date(goalDeadline).getTime() - new Date().getTime();
    const days = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    
    // Busca saldo atual da banca selecionada no form
    const br = bankrolls.find(b => b.id === linkedBankrollId);
    const currentBal = br ? br.initialBalance + history.filter(b => b.bankrollId === linkedBankrollId).reduce((acc, b) => acc + b.profit, 0) : 0;
    
    const targetVal = parseFloat(goalTarget);
    const missing = Math.max(0, targetVal - currentBal);
    
    const dailyNeed = days > 0 ? missing / days : 0;
    const roiNeeded = (br && br.initialBalance > 0) ? (dailyNeed / br.initialBalance) * 100 : 0;

    return { days, dailyNeed, roiNeeded };
  }, [goalDeadline, goalTarget, linkedBankrollId, bankrolls, history]);

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  // --- RENDER CONFIG VIEW ---
  if (view === 'config') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <button onClick={() => { setView('list'); setEditingGoalId(null); }} className="flex items-center gap-3 text-slate-500 hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.2em]">
            <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors"><ArrowLeft size={16} /></div>
            Voltar
          </button>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">
            {editingGoalId ? 'Recalibrar Alvo' : 'Nova Diretriz'}
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          <div className="lg:col-span-2 space-y-6">
            <section className="glass-card p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px]"></div>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><Edit3 size={18} /></div>
                <h3 className="font-bold text-white uppercase tracking-wider text-sm">Configuração</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nome do Objetivo</label>
                  <input type="text" value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="Ex: Alavancagem 10k" className="w-full bg-slate-900/50 border border-slate-700 focus:border-emerald-500 rounded-xl px-5 py-4 text-white font-bold outline-none transition-all placeholder:text-slate-700" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Banca Vinculada</label>
                    <select value={linkedBankrollId} onChange={e => setLinkedBankrollId(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 focus:border-emerald-500 rounded-xl px-5 py-4 text-white font-bold outline-none transition-all appearance-none cursor-pointer">
                      {bankrolls.map(b => <option key={b.id} value={b.id}>{b.name} ({b.currency})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Categoria</label>
                    <select value={goalCategory} onChange={e => setGoalCategory(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 focus:border-emerald-500 rounded-xl px-5 py-4 text-white font-bold outline-none transition-all appearance-none cursor-pointer">
                      <option value="Long Term">Longo Prazo</option>
                      <option value="Short Term">Curto Prazo (Tiro Curto)</option>
                      <option value="Safety">Blindagem de Capital</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Alvo Financeiro</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 font-black">$</span>
                      <input type="number" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 focus:border-emerald-500 rounded-xl pl-10 pr-5 py-4 text-white font-black text-lg outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Data Limite</label>
                    <input type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 focus:border-emerald-500 rounded-xl px-5 py-4 text-white font-bold outline-none transition-all" />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="bg-gradient-to-b from-emerald-500/20 to-slate-900/50 rounded-3xl p-[1px]">
              <div className="bg-[#0f172a] rounded-[1.4rem] p-6 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={40} /></div>
                
                <h4 className="text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  Simulação de Performance
                </h4>

                <div className="space-y-6">
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Meta Diária Necessária</p>
                    <p className="text-3xl font-black text-white">{formatCurrency(projectionData.dailyNeed)}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Dias Restantes</p>
                      <p className="text-xl font-bold text-white">{projectionData.days}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">ROI / Dia</p>
                      <p className={`text-xl font-bold ${projectionData.roiNeeded > 2 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {projectionData.roiNeeded.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  {projectionData.roiNeeded > 3 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
                      <Info className="text-red-500 shrink-0 mt-0.5" size={14} />
                      <p className="text-[10px] text-red-300 leading-relaxed">Risco Alto: A meta exige um ROI diário agressivo. Considere aumentar o prazo.</p>
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
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
            Metas & Objetivos <span className="text-xs not-italic bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 tracking-normal">BETA</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Gestão de Performance Orientada a Resultados</p>
        </div>
        <button onClick={() => setView('config')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold uppercase text-xs tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
          <Plus size={16} /> Criar Nova Meta
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeGoals.length === 0 ? (
            <div className="glass-card rounded-[2rem] p-16 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-800">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-6"><Target size={32} /></div>
              <h3 className="text-white font-bold text-lg mb-2 uppercase tracking-wide">Sem Tração</h3>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">O mercado pune quem não tem alvo. Defina sua primeira meta agora.</p>
            </div>
          ) : (
            activeGoals.map(goal => {
              const stats = getGoalProgress(goal);
              return (
                <motion.div layout key={goal.id} className="glass-card rounded-[2rem] p-8 group relative overflow-hidden hover:border-slate-600 transition-colors">
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-800 text-emerald-400 rounded-xl border border-slate-700"><Target size={20} /></div>
                      <div>
                        <h3 className="text-lg font-black text-white tracking-tight uppercase italic">{goal.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-bold uppercase">{goal.category}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Deadline: {goal.deadline.split('-').reverse().join('/')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(goal)} className="p-2 text-slate-400 hover:text-white bg-slate-900/50 rounded-lg hover:bg-slate-800 transition-colors"><Edit3 size={14} /></button>
                      <button onClick={() => confirm('Excluir?') && deleteGoal(goal.id)} className="p-2 text-slate-400 hover:text-red-400 bg-slate-900/50 rounded-lg hover:bg-slate-800 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    {/* Radial Progress */}
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                        <motion.circle 
                          initial={{ strokeDashoffset: 351 }} 
                          animate={{ strokeDashoffset: 351 * (1 - stats.progress / 100) }} 
                          cx="64" cy="64" r="56" 
                          stroke="currentColor" strokeWidth="8" fill="transparent" 
                          strokeDasharray="351.86" 
                          className="text-emerald-500 transition-all duration-1000" 
                          strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-black text-white tracking-tighter">{stats.progress.toFixed(0)}%</span>
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Concluído</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-1 w-full space-y-5">
                      <div className="flex justify-between items-end pb-4 border-b border-slate-800">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Saldo Atual</p>
                          <p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(stats.current, stats.currency)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Target</p>
                          <p className="text-xl font-bold text-slate-400 tracking-tighter">{formatCurrency(goal.target, stats.currency)}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 text-slate-400 font-medium">
                          <Wallet size={12} className="text-emerald-500" /> 
                          <span className="uppercase tracking-wide text-[10px] font-bold">Banca: {bankrolls.find(b => b.id === goal.bankroll_id)?.name}</span>
                        </div>
                        {stats.missing > 0 ? (
                          <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wide">Faltam {formatCurrency(stats.missing, stats.currency)}</span>
                        ) : (
                          <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wide flex items-center gap-1"><Trophy size={12} /> Meta Batida!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Sidebar Achievements */}
        <div className="space-y-6">
          <div className="glass-card rounded-[2rem] p-6">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="text-yellow-500" size={18} />
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">Galeria de Troféus</h3>
            </div>
            
            <div className="space-y-3">
              {completedGoals.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-xl">
                  <Lock size={20} className="mx-auto text-slate-700 mb-2" />
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Locked</p>
                </div>
              ) : (
                completedGoals.map(goal => (
                  <div key={goal.id} className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-500/10 text-yellow-500"><Trophy size={16} /></div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase">{goal.title}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{goal.deadline}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-blue-600/10 border border-blue-500/20 rounded-[2rem] p-6">
            <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold uppercase text-[10px] tracking-widest">
              <Info size={14} /> Insight Tático
            </div>
            <p className="text-xs text-blue-200 leading-relaxed font-medium">
              "Foque na consistência matemática. Uma meta de longo prazo é apenas uma sequência de dias positivos bem gerenciados."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Goals;