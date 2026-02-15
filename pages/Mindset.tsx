import React, { useState, useMemo } from 'react';
import { useBetStore, MoodType } from '../store/useBetStore';
import { 
  Book, Clock, ShieldAlert, Search, Sparkles, 
  BrainCircuit, TrendingUp, TrendingDown, 
  AlertTriangle, Pencil, Trash2, X 
} from 'lucide-react';
import TiltModal from '../components/TiltModal';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Mindset: React.FC = () => {
  const { 
    addMindsetEntry, 
    deleteMindsetEntry, 
    updateMindsetEntry,
    mindsetHistory, 
    history 
  } = useBetStore();

  const [selectedMood, setSelectedMood] = useState<MoodType>('disciplined');
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTiltModal, setShowTiltModal] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const moods = [
    { id: 'confident', label: 'Confiante', icon: '🦁', color: '#eab308' },
    { id: 'disciplined', label: 'Disciplinado', icon: '🧘‍♂️', color: '#10b981' },
    { id: 'anxious', label: 'Ansioso', icon: '😰', color: '#3b82f6' },
    { id: 'tilted', label: 'Tilted', icon: '🤬', color: '#ef4444' },
  ];

  const filteredHistory = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return mindsetHistory.filter(e => 
      e.note.toLowerCase().includes(q) || 
      e.mood.toLowerCase().includes(q)
    );
  }, [mindsetHistory, searchQuery]);

  const moodInsights = useMemo(() => {
    const stats: Record<string, { count: number, totalProfit: number }> = {};
    moods.forEach(m => stats[m.id] = { count: 0, totalProfit: 0 });

    mindsetHistory.forEach(entry => {
      if (stats[entry.mood]) stats[entry.mood].count++;

      const entryDate = entry.date;
      const betsOnDay = history.filter(
        bet => bet.date.startsWith(entryDate) && 
        bet.status !== 'pending' && 
        bet.status !== 'void'
      );

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
    color: m.color
  }));

  const handleSave = () => {
    if (!note.trim()) return;

    if (editingId) {
      updateMindsetEntry(editingId, {
        mood: selectedMood,
        note
      });
      setEditingId(null);
    } else {
      addMindsetEntry({ 
        date: new Date().toISOString().split('T')[0], 
        time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}), 
        mood: selectedMood, 
        note, 
        tags: [] 
      });
      if (selectedMood === 'tilted') setShowTiltModal(true);
    }

    setNote('');
  };

  const handleEdit = (entry: any) => {
    setEditingId(entry.id);
    setSelectedMood(entry.mood);
    setNote(entry.note);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNote('');
    setSelectedMood('disciplined');
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">

      {/* HEADER */}
<header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

  <div>
    {/* Label superior discreta */}
    <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-widest mb-1">
      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
      Cognitive Performance Engine
    </div>

    {/* Headline principal */}
    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
      Psicologia & Performance <span className="text-slate-400 dark:text-slate-700 text-lg">///</span>
    </h1>

    {/* Subheadline */}
    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">
      Monitoramento emocional e impacto direto na sua performance operacional.
    </p>
  </div>

  {/* Botão lateral */}
  <button 
    onClick={() => setShowTiltModal(true)} 
    className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-500 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest"
  >
    <ShieldAlert size={16} className="inline mr-2"/>
    Protocolo de Emergência
  </button>

</header>

      {/* INSIGHTS CARDS */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#0f172a]/60 p-6 rounded-2xl border">
          <p className="text-xs font-bold text-slate-500 uppercase">Zona de Performance</p>
          <h3 className="font-bold mt-2">
            Você lucra mais quando está <span className="text-emerald-500">{bestMood?.label}</span>
          </h3>
        </div>

        <div className="bg-white dark:bg-[#0f172a]/60 p-6 rounded-2xl border">
          <p className="text-xs font-bold text-slate-500 uppercase">Zona de Perigo</p>
          <h3 className="font-bold mt-2">
            Cuidado quando se sente <span className="text-red-500">{worstMood?.label}</span>
          </h3>
        </div>

        <div className="bg-white dark:bg-[#0f172a]/60 p-6 rounded-2xl border">
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData}>
              <Tooltip contentStyle={{ background: '#0f172a', color: '#fff' }} />
              <Bar dataKey="count">
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FORM */}
      <section className="bg-white dark:bg-[#0f172a]/60 p-8 rounded-3xl border">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {moods.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMood(m.id as MoodType)}
              className={`p-4 rounded-xl border ${
                selectedMood === m.id 
                ? 'bg-slate-100 dark:bg-slate-800 border-purple-500'
                : 'border-transparent'
              }`}
            >
              <div className="text-2xl">{m.icon}</div>
              <div className="text-xs font-bold mt-2">{m.label}</div>
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Diário de bordo..."
          className="w-full p-6 rounded-xl border bg-slate-50 dark:bg-slate-900 min-h-[120px]"
        />

        <div className="flex justify-end gap-3 mt-4">
          {editingId && (
            <button
              onClick={handleCancelEdit}
              className="px-6 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold uppercase"
            >
              <X size={14} className="inline mr-1" />
              Cancelar
            </button>
          )}

          <button
            onClick={handleSave}
            className="px-8 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-bold uppercase"
          >
            <Book size={14} className="inline mr-1" />
            {editingId ? 'Atualizar Sessão' : 'Registrar Sessão'}
          </button>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="bg-white dark:bg-[#0f172a]/60 p-6 rounded-3xl border h-[500px] overflow-y-auto">
        <div className="space-y-4">
          <AnimatePresence>
            {filteredHistory.map(entry => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 group relative"
              >
                <div className="flex justify-between">
                  <div className="text-sm font-bold">
                    {moods.find(m => m.id === entry.mood)?.icon} {entry.date}
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleEdit(entry)}>
                      <Pencil size={14}/>
                    </button>
                    <button onClick={() => deleteMindsetEntry(entry.id)}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>

                <p className="text-sm mt-2">{entry.note}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      <TiltModal isOpen={showTiltModal} onClose={() => setShowTiltModal(false)} />
    </div>
  );
};

export default Mindset;
