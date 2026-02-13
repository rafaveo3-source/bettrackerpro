
import React, { useState, useMemo, useEffect } from 'react';
import { useBetStore, Goal } from '../store/useBetStore';
import { Target, ChevronLeft, ChevronRight, Plus, Calendar, TrendingUp, Trophy, Wallet, CheckCircle2, Clock, ArrowLeft, Info, Trash2, Edit3, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Goals: React.FC = () => {
  const { currentBankrollBalance, bankrolls, activeBankrollId, goals, addGoal, updateGoal, deleteGoal } = useBetStore();
  const [view, setView] = useState<'list' | 'config'>('list');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Form states
  const [goalName, setGoalName] = useState('');
  const [goalCategory, setGoalCategory] = useState('Long Term');
  const [goalTarget, setGoalTarget] = useState('10000');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [linkedBankrollId, setLinkedBankrollId] = useState(activeBankrollId);

  useEffect(() => { setLinkedBankrollId(activeBankrollId); }, [activeBankrollId]);

  const formatCurrency = (val: number, bankrollId?: string) => {
    const br = bankrolls.find(b => b.id === (bankrollId || activeBankrollId));
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: br?.currency || 'BRL' }).format(val);
  };

  const handleCreateOrUpdate = () => {
    if (!goalName || !goalTarget || !goalDeadline) return;
    if (editingGoalId) {
        updateGoal(editingGoalId, { title: goalName, category: goalCategory, target: parseFloat(goalTarget), deadline: goalDeadline, bankrollId: linkedBankrollId });
    } else {
        addGoal({ title: goalName, category: goalCategory, target: parseFloat(goalTarget), deadline: goalDeadline, bankrollId: linkedBankrollId, type: 'custom' });
    }
    setEditingGoalId(null); setView('list');
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoalId(goal.id); setGoalName(goal.title); setGoalCategory(goal.category); setGoalTarget(goal.target.toString()); setGoalDeadline(goal.deadline); setLinkedBankrollId(goal.bankrollId);
    setView('config');
  };

  const daysRemaining = useMemo(() => {
    if (!goalDeadline) return 0;
    const diff = new Date(goalDeadline).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }, [goalDeadline]);

  const dailyNeed = useMemo(() => daysRemaining > 0 ? parseFloat(goalTarget) / daysRemaining : 0, [goalTarget, daysRemaining]);
  const roiNeeded = useMemo(() => {
    const br = bankrolls.find(b => b.id === linkedBankrollId);
    return (br && br.initialBalance > 0) ? (dailyNeed / br.initialBalance) * 100 : 0;
  }, [dailyNeed, linkedBankrollId, bankrolls]);

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  if (view === 'config') {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20 max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <button onClick={() => { setView('list'); setEditingGoalId(null); }} className="flex items-center gap-3 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.2em]">
                    <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/5 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors"><ArrowLeft size={16} /></div>
                    Voltar para Metas
                </button>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                    {editingGoalId ? 'Redefinir Meta' : 'Configurar Nova Meta'}
                </h1>
                <div className="flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-[0.2em] bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                    Modo Editor Ativo <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white dark:bg-[#0f172a]/80 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 relative overflow-hidden shadow-sm dark:shadow-none">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px]"></div>
                        <div className="flex items-center gap-3 mb-10">
                            <div className="p-3 bg-emerald-500 text-white dark:text-[#020617] rounded-2xl shadow-xl shadow-emerald-500/20"><Edit3 size={20} /></div>
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg italic">1. Identidade & Categoria</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Título da Meta</label>
                                <input type="text" value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="Ex: Rumo aos 100k" className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-emerald-500 transition-all shadow-inner placeholder:text-slate-400" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Classificação</label>
                                <select value={goalCategory} onChange={e => setGoalCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer">
                                    <option value="Long Term">Estratégia Longo Prazo</option>
                                    <option value="Event">Campeonato / Copa</option>
                                    <option value="Safety">Fundo de Reserva</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-[#0f172a]/80 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="p-3 bg-blue-500 text-white dark:text-[#020617] rounded-2xl shadow-xl shadow-blue-500/20"><Wallet size={20} /></div>
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg italic">2. Planejamento Financeiro</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Capital Alvo (R$)</label>
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 font-black">R$</span>
                                    <input type="number" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl pl-16 pr-6 py-4 text-slate-900 dark:text-white text-xl font-black outline-none focus:border-emerald-500 transition-all shadow-inner" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Deadline Final</label>
                                <input type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-emerald-500 transition-all shadow-inner" />
                            </div>
                        </div>
                    </section>
                </div>

                <aside className="space-y-6">
                    <div className="bg-emerald-500 rounded-[3rem] p-1.5 shadow-2xl shadow-emerald-500/10">
                        <div className="bg-white dark:bg-[#0f172a] rounded-[2.8rem] p-8 border border-emerald-400 dark:border-white/5">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-[0.2em] text-[10px] mb-10">
                                <Sparkles size={14} /> Algoritmo de Projeção
                            </div>
                            
                            <div className="text-center mb-10">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-2">Necessidade de Lucro Diário</p>
                                <h2 className="text-4xl font-black text-emerald-500 tracking-tighter">{formatCurrency(dailyNeed)}</h2>
                                <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-3 font-bold uppercase tracking-tighter">Estimativa para {daysRemaining} dias de mercado</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-10 mb-10">
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase mb-1">Dias</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{daysRemaining}</p>
                                </div>
                                <div className="text-center border-l border-slate-100 dark:border-white/5">
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase mb-1">ROI/Dia</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{roiNeeded.toFixed(1)}%</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400 dark:text-slate-500">Progresso Requerido</span>
                                    <span className="text-emerald-500">0%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-900/50 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                                    <div className="bg-emerald-500 h-full w-0 shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleCreateOrUpdate} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white dark:text-[#020617] font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 group">
                        {editingGoalId ? 'ATUALIZAR PLANEJAMENTO' : 'SALVAR E ATIVAR META'} 
                        <CheckCircle2 size={20} className="group-hover:rotate-12 transition-transform" />
                    </button>

                    <button onClick={() => setView('list')} className="w-full text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white text-[10px] font-black uppercase tracking-widest py-3 transition-colors">
                        Descartar Alterações
                    </button>
                </aside>
            </div>
        </motion.div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Metas de Performance</h1>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Mercado Inteligente • Beta 1.0
          </div>
        </div>
        <button onClick={() => setView('config')} className="bg-emerald-500 hover:bg-emerald-400 text-white dark:text-[#020617] px-8 py-4 rounded-[1.5rem] flex items-center gap-3 font-black transition-all shadow-2xl shadow-emerald-500/20 active:scale-95">
            <Plus size={20} /> NOVA META ESTRATÉGICA
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            {activeGoals.length === 0 ? (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[3rem] p-24 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 dark:text-slate-800 mb-6 shadow-2xl"><Target size={40} /></div>
                    <h3 className="text-slate-900 dark:text-white font-black text-xl mb-2 uppercase tracking-tighter">Nenhum Objetivo Ativo</h3>
                    <p className="text-slate-500 text-sm max-w-xs font-medium uppercase leading-relaxed tracking-tighter">O sucesso começa com um plano. Clique no botão acima para definir sua primeira meta.</p>
                </div>
            ) : (
                activeGoals.map(goal => {
                    const progress = Math.min(100, (goal.current / goal.target) * 100);
                    return (
                        <div key={goal.id} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-10 group relative overflow-hidden transition-all hover:shadow-xl dark:hover:shadow-emerald-500/5">
                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-emerald-500 text-white dark:text-[#020617] rounded-2xl shadow-lg shadow-emerald-500/20"><Target size={24} /></div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">{goal.title}</h3>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1 opacity-70">{goal.category} • Vence em {goal.deadline.split('-').reverse().join('/')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => handleEdit(goal)} className="p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl transition-all shadow-sm"><Edit3 size={16} /></button>
                                    <button onClick={() => confirm('Excluir meta?') && deleteGoal(goal.id)} className="p-3 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl transition-all shadow-sm"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                                <div className="relative w-36 h-36 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-900" />
                                        <motion.circle initial={{ strokeDashoffset: 402 }} animate={{ strokeDashoffset: 402 * (1 - progress / 100) }} cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="402.12" className="text-emerald-500 transition-all" strokeLinecap="round" />
                                    </svg>
                                    <span className="absolute text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">{progress.toFixed(0)}%</span>
                                </div>
                                <div className="flex-1 space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1">Acumulado</p>
                                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-500 tracking-tighter italic">{formatCurrency(goal.current, goal.bankrollId)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1">Objetivo Final</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter italic">{formatCurrency(goal.target, goal.bankrollId)}</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-900/50 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/5">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"></motion.div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest pt-2">
                                        <span className="flex items-center gap-2"><Wallet size={10} className="text-emerald-500" /> Banca: {bankrolls.find(b => b.id === goal.bankrollId)?.name}</span>
                                        <span>Déficit: {formatCurrency(Math.max(0, goal.target - goal.current))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            <div className="bg-white/50 dark:bg-slate-900/50 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8 border-dashed border-2 border-slate-200 dark:border-white/10 opacity-70 hover:opacity-100 transition-opacity">
                <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl"><TrendingUp size={24} className="text-slate-400 dark:text-slate-500" /></div>
                <div>
                    <h3 className="text-slate-900 dark:text-white font-black uppercase tracking-tighter italic">Projeção Profissional</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Estimativa de crescimento de carreira baseada em volume médio mensal.</p>
                </div>
            </div>
        </div>

        <div className="space-y-8">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm dark:shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                    <Trophy className="text-yellow-500" size={20} />
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg italic">Achievements</h3>
                </div>
                <div className="space-y-4">
                    {completedGoals.length === 0 ? (
                        <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nenhum troféu ainda</p>
                        </div>
                    ) : (
                        completedGoals.map(goal => (
                            <div key={goal.id} className="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-500/5 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-500/10">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500 text-white dark:text-[#020617] shadow-lg shadow-emerald-500/20"><Trophy size={20} /></div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-900 dark:text-white italic">{goal.title}</p>
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-black uppercase mt-0.5 tracking-tighter">Concluído • {formatCurrency(goal.target)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-500/5 rounded-[2.5rem] p-8 border border-emerald-100 dark:border-emerald-500/10 shadow-sm dark:shadow-none">
                 <div className="flex items-center gap-3 mb-6">
                    <Info className="text-emerald-500" size={20} />
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Dica do Coach</h4>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase leading-relaxed tracking-tighter">
                    "Metas pequenas batidas geram dopamina técnica. Foque em 1% ao dia e deixe o juros compostos trabalhar por você."
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Goals;
