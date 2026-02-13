
import React, { useState, useMemo } from 'react';
import { useBetStore, MoodType } from '../store/useBetStore';
import { Book, Clock, Lightbulb, ShieldAlert, Search, Sparkles } from 'lucide-react';
import TiltModal from '../components/TiltModal';
import { motion, AnimatePresence } from 'framer-motion';

const Mindset: React.FC = () => {
  const { addMindsetEntry, mindsetHistory } = useBetStore();
  const [selectedMood, setSelectedMood] = useState<MoodType>('disciplined');
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTiltModal, setShowTiltModal] = useState(false);

  const moods = [
    { id: 'confident', label: 'Confiante', icon: '🦁', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20' },
    { id: 'disciplined', label: 'Disciplinado', icon: '🧘‍♂️', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' },
    { id: 'anxious', label: 'Ansioso', icon: '😰', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20 hover:bg-blue-500/20' },
    { id: 'tilted', label: 'Tilted', icon: '🤬', color: 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20 hover:bg-red-500/20' },
  ];

  const filteredHistory = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return mindsetHistory.filter(e => e.note.toLowerCase().includes(q) || e.mood.toLowerCase().includes(q));
  }, [mindsetHistory, searchQuery]);

  const handleSave = () => {
    if (!note.trim()) return;
    addMindsetEntry({ date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}), mood: selectedMood, note, tags: [] });
    setNote('');
    if (selectedMood === 'tilted') setShowTiltModal(true);
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Psicologia do Trader</h1>
            <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">A mentalidade é 90% do resultado.</p>
        </div>
        <button onClick={() => setShowTiltModal(true)} className="bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-600 dark:text-red-500 px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all shadow-sm dark:shadow-xl shadow-red-500/5 active:scale-95 group">
            <ShieldAlert size={18} className="group-hover:rotate-12 transition-transform" /> Protocolo de Emergência
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <section className="bg-white dark:bg-[#0f172a]/80 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm dark:shadow-none">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tighter italic">Estado Mental Atual</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {moods.map(m => (
                        <button key={m.id} onClick={() => setSelectedMood(m.id as MoodType)} className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-500 ${selectedMood === m.id ? `${m.color} scale-105 shadow-lg border-current` : 'bg-slate-50 dark:bg-slate-900/50 border-transparent text-slate-400 dark:text-slate-500 opacity-60 hover:opacity-100'}`}>
                            <span className="text-4xl mb-3">{m.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="bg-white dark:bg-[#0f172a]/80 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm dark:shadow-none">
                 <div className="flex items-center gap-3 mb-8">
                    <Book size={20} className="text-emerald-500" />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Registro Reflexivo</h3>
                 </div>

                 <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl mb-8 border border-slate-200 dark:border-white/5 relative group">
                    <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.2em]">
                        <Sparkles size={14} /> Insight sugerido
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 italic text-sm font-medium leading-relaxed">"O que você aprendeu com o seu maior Red de hoje? Foi falta de gestão ou má leitura do mercado?"</p>
                 </div>

                 <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Hoje notei que as odds subiram rápido e eu entrei em pânico..." className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 text-slate-900 dark:text-white min-h-[250px] outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 font-medium leading-relaxed shadow-inner" />

                 <div className="flex justify-end mt-6">
                    <button onClick={handleSave} disabled={!note.trim()} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-20 disabled:grayscale text-white dark:text-[#020617] font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-emerald-500/10 active:scale-95 uppercase text-xs tracking-widest">
                        Gravar Reflexão
                    </button>
                 </div>
            </section>
        </div>

        <aside className="space-y-8">
            <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 max-h-[700px] flex flex-col shadow-sm dark:shadow-none">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px] italic">Flashbacks</h3>
                    <button onClick={() => setSearchQuery('')} className="text-[10px] text-emerald-600 dark:text-emerald-500 hover:text-slate-900 dark:hover:text-white font-black uppercase tracking-widest">RESET</button>
                </div>

                <div className="relative mb-8">
                    <Search className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-600" size={16} />
                    <input type="text" placeholder="Filtrar memórias..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-slate-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-inner" />
                </div>

                <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence initial={false}>
                        {filteredHistory.length === 0 ? (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-400 dark:text-slate-700 text-center py-10 text-[10px] font-black uppercase tracking-widest italic">Nenhum registro encontrado</motion.p>
                        ) : (
                            filteredHistory.slice(0, 15).map(entry => (
                                <motion.div key={entry.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-50 dark:bg-slate-950/30 rounded-3xl p-5 border border-slate-200 dark:border-white/5 group hover:border-emerald-500/20 dark:hover:border-white/10 transition-all shadow-sm dark:shadow-none">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] bg-white dark:bg-[#020617] text-slate-400 dark:text-slate-500 px-3 py-1.5 rounded-full font-black flex items-center gap-1.5 uppercase tracking-tighter shadow-sm border border-slate-100 dark:border-transparent">
                                            <Clock size={10} /> {entry.date.split('-').reverse().slice(0, 2).join('/')}, {entry.time}
                                        </span>
                                        <span className="text-xl" title={entry.mood}>{moods.find(m => m.id === entry.mood)?.icon}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium line-clamp-4 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                                        {entry.note}
                                    </p>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </section>

            <div className="bg-blue-50 dark:bg-blue-500/5 rounded-[2.5rem] p-8 border border-blue-100 dark:border-blue-500/10 shadow-sm dark:shadow-none">
                 <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="text-blue-500" size={18} />
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px]">Dica Mental</h4>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase leading-relaxed tracking-tighter">
                    "Escrever seus erros técnicos imediatamente reduz a carga emocional e evita que você tente 'recuperar' no susto."
                </p>
            </div>
        </aside>
      </div>
      <TiltModal isOpen={showTiltModal} onClose={() => setShowTiltModal(false)} />
    </div>
  );
};

export default Mindset;
