import React, { useState, useMemo } from 'react';
import { useBetStore, MoodType } from '../store/useBetStore';
import { Book, Clock, ShieldAlert, Search, Sparkles, BrainCircuit, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import TiltModal from '../components/TiltModal';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Mindset: React.FC = () => {
  const { addMindsetEntry, mindsetHistory, history } = useBetStore();
  const [selectedMood, setSelectedMood] = useState<MoodType>('disciplined');
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTiltModal, setShowTiltModal] = useState(false);

  const moods = [
    { id: 'confident', label: 'Confiante', icon: '🦁', color: '#eab308' },
    { id: 'disciplined', label: 'Disciplinado', icon: '🧘‍♂️', color: '#10b981' },
    { id: 'anxious', label: 'Ansioso', icon: '😰', color: '#3b82f6' },
    { id: 'tilted', label: 'Tilted', icon: '🤬', color: '#ef4444' },
  ];

  const filteredHistory = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return mindsetHistory.filter(e => e.note.toLowerCase().includes(q) || e.mood.toLowerCase().includes(q));
  }, [mindsetHistory, searchQuery]);

  const moodInsights = useMemo(() => {
    const stats: Record<string, { count: number, totalProfit: number }> = {};
    moods.forEach(m => stats[m.id] = { count: 0, totalProfit: 0 });

    mindsetHistory.forEach(entry => {
      if (stats[entry.mood]) stats[entry.mood].count++;
      const entryDate = entry.date;
      const betsOnDay = history.filter(bet => bet.date.startsWith(entryDate) && bet.status !== 'pending' && bet.status !== 'void');
      const dayProfit = betsOnDay.reduce((acc, bet) => acc + bet.profit, 0);
      if (stats[entry.mood]) stats[entry.mood].totalProfit += dayProfit;
    });

    return moods.map(m => {
      const data = stats[m.id];
      const avgProfit = data.count > 0 ? data.totalProfit / data.count : 0;
      return { ...m, ...data, avgProfit };
    });
  }, [mindsetHistory, history]);

  const bestMood = [...moodInsights].sort((a, b) => b.avgProfit - a.avgProfit)[0];
  const worstMood = [...moodInsights].sort((a, b) => a.avgProfit - b.avgProfit)[0];

  const chartData = moodInsights.map(m => ({
    name: m.label,
    count: m.count,
    profit: m.avgProfit,
    color: m.color
  }));

  const handleSave = () => {
    if (!note.trim()) return;
    addMindsetEntry({ 
        date: new Date().toISOString().split('T')[0], 
        time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}), 
        mood: selectedMood, 
        note, 
        tags: [] 
    });
    setNote('');
    if (selectedMood === 'tilted') setShowTiltModal(true);
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
               <BrainCircuit className="text-purple-500" size={32} /> Psicologia & Performance
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">
                Análise de Correlação: Estado Mental x P&L
            </p>
        </div>
        <button onClick={() => setShowTiltModal(true)} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-500 px-6 py-3 rounded-xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 group">
            <ShieldAlert size={18} className="group-hover:animate-pulse" /> Protocolo de Emergência
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] border-l-4 border-l-emerald-500 relative overflow-hidden group shadow-sm">
             <div className="relative z-10">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><TrendingUp size={14} /> Zona de Performance</p>
                 <h3 className="text-slate-900 dark:text-white text-lg font-bold">Você lucra mais quando está <span className="text-emerald-500 uppercase italic">{bestMood?.label}</span></h3>
                 <p className="text-emerald-600/80 font-mono text-xs mt-2">Média: R$ {bestMood?.avgProfit.toFixed(2)} / dia</p>
             </div>
             <div className="absolute right-[-20px] bottom-[-20px] text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors">
                 <TrendingUp size={100} />
             </div>
          </div>

          <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] border-l-4 border-l-red-500 relative overflow-hidden group shadow-sm">
             <div className="relative z-10">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><TrendingDown size={14} /> Zona de Perigo</p>
                 <h3 className="text-slate-900 dark:text-white text-lg font-bold">Cuidado quando se sente <span className="text-red-500 uppercase italic">{worstMood?.label}</span></h3>
                 <p className="text-red-600/80 font-mono text-xs mt-2">Média: R$ {worstMood?.avgProfit.toFixed(2)} / dia</p>
             </div>
             <div className="absolute right-[-20px] bottom-[-20px] text-red-500/5 group-hover:text-red-500/10 transition-colors">
                 <AlertTriangle size={100} />
             </div>
          </div>

          <div className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] relative flex items-center justify-center shadow-sm">
             <ResponsiveContainer width="100%" height={100}>
                <BarChart data={chartData}>
                    {/* ✅ Tooltip Corrigido */}
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                        ))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
             <p className="absolute bottom-2 text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Frequência Emocional</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <section className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {moods.map(m => (
                        <button key={m.id} onClick={() => setSelectedMood(m.id as MoodType)} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${selectedMood === m.id ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 scale-105 shadow-xl' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}>
                            <span className="text-3xl mb-2 filter drop-shadow-lg">{m.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-white">{m.label}</span>
                        </button>
                    ))}
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl mb-6 border border-slate-200 dark:border-slate-800 relative group">
                    <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em]">
                        <Sparkles size={14} /> AI Insight Coach
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed italic">"Analisei seus últimos registros: Você tende a forçar entradas após as 14h quando está ansioso. Que tal encerrar o dia mais cedo hoje?"</p>
                </div>

                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Diário de bordo: O que influenciou sua tomada de decisão hoje?" className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-6 text-slate-900 dark:text-white min-h-[150px] outline-none focus:border-purple-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium leading-relaxed shadow-inner resize-none" />

                <div className="flex justify-end mt-4">
                    <button onClick={handleSave} disabled={!note.trim()} className="bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-20 disabled:cursor-not-allowed text-white dark:text-black font-black py-3 px-8 rounded-xl transition-all active:scale-95 uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <Book size={14} /> Registrar Sessão
                    </button>
                </div>
            </section>
        </div>

        <aside className="space-y-8">
            <section className="bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] h-[600px] flex flex-col shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px]">Timeline</h3>
                    <div className="relative">
                        <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-slate-900 dark:text-white focus:border-purple-500 outline-none w-28 transition-all focus:w-40" />
                        <Search className="absolute left-2.5 top-2 text-slate-400 dark:text-slate-600" size={10} />
                    </div>
                </div>

                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    <AnimatePresence initial={false}>
                        {filteredHistory.length === 0 ? (
                            <p className="text-slate-400 dark:text-slate-600 text-center py-10 text-[10px] font-black uppercase tracking-widest">Vazio</p>
                        ) : (
                            filteredHistory.slice(0, 15).map(entry => (
                                <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{moods.find(m => m.id === entry.mood)?.icon}</span>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1"><Clock size={8} /> {entry.date.split('-').slice(1).reverse().join('/')}</span>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 text-xs font-medium leading-relaxed line-clamp-3 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{entry.note}</p>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </aside>
      </div>
      <TiltModal isOpen={showTiltModal} onClose={() => setShowTiltModal(false)} />
    </div>
  );
};

export default Mindset;