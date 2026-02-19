import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBetStore, MoodType } from '../store/useBetStore';
import {
  Book,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  BrainCircuit,
  Lock,
  Crown,
  ShieldAlert,
  Clock,
  AlertTriangle
} from 'lucide-react';
import TiltModal from '../components/TiltModal';
import { motion, AnimatePresence } from 'framer-motion';

const Mindset: React.FC = () => {
  const {
    addMindsetEntry,
    deleteMindsetEntry,
    updateMindsetEntry,
    mindsetHistory,
    history,
    isPro,
    activateTiltLock,
    tiltLockUntil
  } = useBetStore();

  const navigate = useNavigate();

  const [selectedMood, setSelectedMood] = useState<MoodType>('disciplined');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<MoodType | 'all'>('all');
  const [showTiltModal, setShowTiltModal] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  // ==========================================
  // COMPONENTE DE BLOQUEIO PRO
  // ==========================================
  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto pt-10 px-4 pb-20">
        <div className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:to-cyan-500/10 opacity-50" />
          
          <div className="bg-white dark:bg-slate-800 p-5 rounded-full mb-6 relative z-10 shadow-sm border border-slate-100 dark:border-slate-700">
              <BrainCircuit size={40} className="text-emerald-500" />
          </div>
          
          <div className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 relative z-10 border border-amber-200 dark:border-amber-500/20">
             <Crown size={12} /> Recurso Exclusivo
          </div>

          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 relative z-10">
              Inteligência Emocional
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-8 text-base leading-relaxed relative z-10">
              O descontrole emocional é o maior responsável por perdas de capital. O Módulo de Psicologia correlaciona seu estado mental aos seus resultados e possui um sistema de <strong>Trava de Segurança (Circuit Breaker)</strong> para proteger seus ativos.
          </p>

          <button 
             onClick={() => navigate('/pro')}
             className="bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-black py-4 px-10 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 relative z-10 uppercase tracking-widest text-sm flex items-center gap-2"
          >
              <Lock size={16} /> Desbloquear Módulo PRO
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // CÓDIGO DO MÓDULO (SÓ RODA SE FOR PRO)
  // ==========================================

  const moods = [
    { id: 'confident', label: 'Confiante', icon: '🦁', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { id: 'disciplined', label: 'Disciplinado', icon: '🧘‍♂️', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { id: 'anxious', label: 'Ansioso', icon: '😰', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    { id: 'tilted', label: 'Tilted', icon: '🤬', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' }
  ];

  const moodInsights = useMemo(() => {
    const stats: any = {};
    moods.forEach(m => (stats[m.id] = { count: 0, totalProfit: 0 }));

    mindsetHistory.forEach(entry => {
      if (stats[entry.mood]) stats[entry.mood].count++;

      const betsOnDay = history.filter(
        bet =>
          bet.date.startsWith(entry.date) &&
          bet.status !== 'pending' &&
          bet.status !== 'void'
      );

      const dayProfit = betsOnDay.reduce((acc, bet) => acc + bet.profit, 0);

      if (stats[entry.mood]) stats[entry.mood].totalProfit += dayProfit;
    });

    return moods.map(m => {
      const data = stats[m.id];
      const avg = data.count > 0 ? data.totalProfit / data.count : 0;
      return { ...m, ...data, avg };
    });
  }, [mindsetHistory, history]);

  const bestMood = [...moodInsights].sort((a, b) => b.avg - a.avg)[0];
  const worstMood = [...moodInsights].sort((a, b) => a.avg - b.avg)[0];
  const totalEntries = mindsetHistory.length;

  const mentalScore = useMemo(() => {
    const counts: any = {};
    moods.forEach(m => (counts[m.id] = 0));
    mindsetHistory.forEach(e => counts[e.mood]++);

    const score = (counts.confident * 2) + (counts.disciplined * 1.5) - (counts.anxious * 1.2) - (counts.tilted * 2);
    let normalized = 50 + score * 5;
    if (normalized > 100) normalized = 100;
    if (normalized < 0) normalized = 0;
    
    return normalized;
  }, [mindsetHistory]);

  const filteredHistory = useMemo(() => {
    return mindsetHistory.filter(e => {
      const matchesSearch = e.note.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMood = filterMood === 'all' || e.mood === filterMood;
      return matchesSearch && matchesMood;
    });
  }, [mindsetHistory, searchQuery, filterMood]);

  const handleSave = () => {
    if (!note.trim()) return;

    if (editingId) {
      updateMindsetEntry(editingId, { mood: selectedMood, note });
      setEditingId(null);
    } else {
      addMindsetEntry({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        mood: selectedMood,
        note,
        tags: []
      });

      if (selectedMood === 'tilted') setShowTiltModal(true);
    }
    setNote('');
  };

  const isLocked = tiltLockUntil && new Date() < new Date(tiltLockUntil);
  const handleEmergencyLock = (hours: number) => {
      activateTiltLock(hours);
      setShowLockConfirm(false);
  };

  return (
    <div className="space-y-10 pb-24 max-w-7xl mx-auto px-4 md:px-8 pt-8">

      {/* HEADER PADRONIZADO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-widest mb-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            System: Online • Mindset Engine
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Psicologia & Performance <span className="text-slate-400 dark:text-slate-700 text-lg ml-2">///</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest mt-2">
            Monitoramento emocional e impacto direto na performance operacional
          </p>
        </div>

        {/* EMERGENCY TILT LOCK BUTTON */}
        <div className="relative">
            <button 
                onClick={() => isLocked ? null : setShowLockConfirm(!showLockConfirm)}
                disabled={isLocked}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${
                    isLocked 
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700' 
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20 hover:shadow-red-500/40 active:scale-95 border border-red-500'
                }`}
            >
                {isLocked ? <Clock size={16} /> : <ShieldAlert size={16} />}
                {isLocked ? 'Sistema Bloqueado' : 'Trava de Emergência'}
            </button>

            {/* Popup Confirmação de Trava */}
            <AnimatePresence>
                {showLockConfirm && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl z-50"
                    >
                        <div className="flex items-start gap-3 mb-4 text-red-500">
                            <AlertTriangle size={24} className="shrink-0" />
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                Perda de Controle? O sistema bloqueará novas operações pelo período selecionado, ativando um bloqueio forçado para preservar sua liquidez e proteger seu capital.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleEmergencyLock(12)} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-lg text-xs font-bold transition-colors">12 Horas</button>
                            <button onClick={() => handleEmergencyLock(24)} className="bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-700 dark:text-red-400 py-2 rounded-lg text-xs font-bold transition-colors">24 Horas</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </header>

      {/* INSIGHTS */}
      <section className="grid md:grid-cols-4 gap-6">
        <InsightCard
          title="Zona de Performance"
          value={bestMood?.label || '-'}
          description={`Lucro médio: R$ ${bestMood?.avg.toFixed(2) || '0.00'}`}
          positive
        />
        <InsightCard
          title="Zona de Perigo"
          value={worstMood?.label || '-'}
          description={`Lucro médio: R$ ${worstMood?.avg.toFixed(2) || '0.00'}`}
          negative
        />
        <InsightCard
          title="Score Mental"
          value={mentalScore.toFixed(0)}
          description="Saúde emocional da operação (0-100)"
          color={mentalScore > 60 ? 'text-emerald-500' : mentalScore < 40 ? 'text-red-500' : 'text-amber-500'}
        />
        <InsightCard
          title="Sessões Registradas"
          value={totalEntries}
          description="Diários de bordo salvos"
        />
      </section>

      {/* FORMULÁRIO DE REGISTRO */}
      <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-[2rem] shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6">Como está seu controle emocional hoje?</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {moods.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMood(m.id as MoodType)}
              className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${
                selectedMood === m.id
                  ? `${m.bg} ${m.border} scale-105 shadow-sm`
                  : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="text-3xl">{m.icon}</div>
              <div className={`text-xs font-bold ${selectedMood === m.id ? m.color : 'text-slate-500 dark:text-slate-400'}`}>
                {m.label}
              </div>
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Descreva seu estado mental, fatores de risco e motivações analíticas das operações de hoje..."
          className="w-full p-6 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 min-h-[140px] text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
        />

        <div className="flex justify-between items-center mt-6">
          <span className="text-xs text-slate-400 font-medium">
            {note.length} caracteres
          </span>

          <button
            onClick={handleSave}
            className="px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg"
          >
            <Book size={16} />
            {editingId ? 'Atualizar Sessão' : 'Registrar Diário'}
          </button>
        </div>
      </section>

      {/* TIMELINE DE DIÁRIOS (MOBILE FIX APLICADO) */}
      <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-[2rem] shadow-sm flex flex-col">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Diário de Bordo</h3>
            
            {/* CORREÇÃO DO LAYOUT VAZANDO NO MOBILE AQUI 👇 */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <input
                    placeholder="Buscar palavra-chave..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full sm:w-48 px-4 py-3 sm:py-2.5 rounded-xl border text-sm font-medium bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500"
                />
                <select
                    value={filterMood}
                    onChange={e => setFilterMood(e.target.value as any)}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl border text-sm font-bold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
                >
                    <option value="all">Todas Emoções</option>
                    {moods.map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
            {filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-medium text-sm">
                    Nenhum registro encontrado. Comece a catalogar seu emocional.
                </div>
            ) : (
                filteredHistory.map(entry => {
                    const moodConfig = moods.find(m => m.id === entry.mood);
                    
                    return (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-5 rounded-2xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 group transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${moodConfig?.bg} border ${moodConfig?.border}`}>
                                    {moodConfig?.icon}
                                </div>
                                <div>
                                    <p className={`text-xs font-black uppercase tracking-wider ${moodConfig?.color}`}>{moodConfig?.label}</p>
                                    <p className="text-[10px] text-slate-500 font-bold">{entry.date} às {entry.time}</p>
                                </div>
                            </div>

                            <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingId(entry.id);
                                        setSelectedMood(entry.mood);
                                        setNote(entry.note);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:text-emerald-500 transition-colors"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    onClick={() => deleteMindsetEntry(entry.id)}
                                    className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-0">
                            {entry.note}
                        </p>
                    </motion.div>
                    )
                })
            )}
            </AnimatePresence>
        </div>
      </section>

      <TiltModal isOpen={showTiltModal} onClose={() => setShowTiltModal(false)} />
    </div>
  );
};

/* INSIGHT CARD (Refinado) */
const InsightCard = ({ title, value, description, positive, negative, color }: any) => (
  <div className="p-6 rounded-[1.5rem] border bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
    <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-3">
      {title}
    </p>

    <div className="flex items-center gap-3">
      <h3 className={`text-2xl font-black ${color ? color : 'text-slate-900 dark:text-white'}`}>
        {value}
      </h3>
      {positive && (
        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-500">
            <TrendingUp size={16} />
        </div>
      )}
      {negative && (
        <div className="p-1.5 bg-red-100 dark:bg-red-500/10 rounded-lg text-red-600 dark:text-red-500">
            <TrendingDown size={16} />
        </div>
      )}
    </div>

    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
      {description}
    </p>
  </div>
);

export default Mindset;