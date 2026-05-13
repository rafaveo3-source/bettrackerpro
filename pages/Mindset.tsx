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
    mindsetHistory = [], 
    history = [], 
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

  // 🔥 OVERLAY DE VITRINE (EFEITO BLUR) PARA USUÁRIOS FREE 🔥
  const ProBlurOverlay = ({ title, desc }: { title: string, desc: string }) => (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 dark:bg-[#000000]/50 backdrop-blur-md rounded-[2rem]">
          <div className="bg-white dark:bg-[#1C1C1E] border border-emerald-500/30 p-8 rounded-2xl max-w-md text-center shadow-xl flex flex-col items-center mx-4">
              <div className="bg-emerald-500/10 p-4 rounded-xl mb-4 text-emerald-600 dark:text-emerald-400">
                  <Crown size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                  {title} <span className="text-emerald-500">PRO</span>
              </h2>
              <p className="text-slate-500 dark:text-[#8E8E93] mb-6 text-sm leading-relaxed">
                  {desc}
              </p>
              <button onClick={() => navigate('/pro')} className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold py-3.5 px-8 rounded-xl transition-all shadow-sm text-xs tracking-widest uppercase">
                  Desbloquear Acesso
              </button>
          </div>
      </div>
  );

  const moods = [
    { id: 'confident', label: 'Confiante', icon: '🦁', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-[#000000]', border: 'border-blue-200 dark:border-blue-500/30' },
    { id: 'disciplined', label: 'Disciplinado', icon: '🧘‍♂️', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-[#000000]', border: 'border-emerald-200 dark:border-emerald-500/30' },
    { id: 'anxious', label: 'Ansioso', icon: '😰', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-[#000000]', border: 'border-amber-200 dark:border-amber-500/30' },
    { id: 'tilted', label: 'Tilted', icon: '🤬', color: 'text-red-500', bg: 'bg-red-50 dark:bg-[#000000]', border: 'border-red-200 dark:border-red-500/30' }
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

  const cardClass = "bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm transition-all";

  return (
    <div className="space-y-8 pb-24 max-w-5xl mx-auto px-4 md:px-8 pt-8 relative font-sans">
      
      {!isPro && <ProBlurOverlay title="Inteligência Emocional" desc="O descontrole emocional é o maior responsável por perdas de capital. O Módulo de Psicologia correlaciona seu estado mental aos seus resultados e possui um sistema de Trava de Segurança (Circuit Breaker) para proteger seus ativos." />}

      <div className={!isPro ? 'pointer-events-none select-none blur-[4px] opacity-60' : ''}>
          {/* HEADER PADRONIZADO */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-[#2C2C2E] pb-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                System: Online • Mindset Engine
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Psicologia & Performance
              </h1>
              <p className="text-sm text-slate-500 dark:text-[#8E8E93] font-medium mt-2">
                Monitoramento emocional e impacto direto na performance operacional
              </p>
            </div>

            {/* EMERGENCY TILT LOCK BUTTON */}
            <div className="relative">
                <button 
                    onClick={() => isLocked ? null : setShowLockConfirm(!showLockConfirm)}
                    disabled={isLocked}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold uppercase tracking-widest text-xs transition-colors shadow-sm ${
                        isLocked 
                        ? 'bg-slate-100 dark:bg-[#2C2C2E] text-slate-400 dark:text-[#636366] cursor-not-allowed border border-transparent' 
                        : 'bg-red-600 hover:bg-red-500 text-white active:scale-95 border border-red-500'
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
                            className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl p-5 shadow-xl z-50"
                        >
                            <div className="flex items-start gap-3 mb-4 text-red-600 dark:text-red-400">
                                <AlertTriangle size={20} className="shrink-0" />
                                <p className="text-xs font-medium leading-relaxed">
                                    Perda de Controle? O sistema bloqueará novas operações pelo período selecionado, ativando um bloqueio forçado para preservar sua liquidez e proteger seu capital.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleEmergencyLock(12)} className="bg-slate-100 hover:bg-slate-200 dark:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C] text-slate-700 dark:text-white py-2.5 rounded-lg text-xs font-bold transition-colors">12 Horas</button>
                                <button onClick={() => handleEmergencyLock(24)} className="bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-700 dark:text-red-400 py-2.5 rounded-lg text-xs font-bold transition-colors">24 Horas</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          </header>

          {/* INSIGHTS */}
          <section className="grid md:grid-cols-4 gap-5 mt-8">
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
              description="Saúde emocional da operação"
              color={mentalScore > 60 ? 'text-emerald-500' : mentalScore < 40 ? 'text-red-500' : 'text-amber-500'}
            />
            <InsightCard
              title="Sessões"
              value={totalEntries}
              description="Diários de bordo salvos"
            />
          </section>

          {/* FORMULÁRIO DE REGISTRO */}
          <section className={`${cardClass} mt-6`}>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-[#2C2C2E] pb-4">Como está seu controle emocional hoje?</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {moods.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMood(m.id as MoodType)}
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${
                    selectedMood === m.id
                      ? `${m.bg} ${m.border} scale-[1.02] shadow-sm`
                      : 'bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#2C2C2E] hover:border-slate-300 dark:hover:border-[#3A3A3C]'
                  }`}
                >
                  <div className="text-2xl mb-1">{m.icon}</div>
                  <div className={`text-xs font-bold ${selectedMood === m.id ? m.color : 'text-slate-500 dark:text-[#8E8E93]'}`}>
                    {m.label}
                  </div>
                </button>
              ))}
            </div>

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Descreva seu estado mental, fatores de risco e motivações analíticas das operações de hoje..."
              className="w-full p-4 rounded-xl border bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#3A3A3C] min-h-[120px] text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors resize-none placeholder:text-slate-400 dark:placeholder:text-[#636366]"
            />

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-[#2C2C2E]">
              <span className="text-xs text-slate-500 dark:text-[#8E8E93] font-bold">
                {note.length} caracteres
              </span>

              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 font-bold uppercase tracking-widest transition-colors text-xs shadow-sm flex items-center gap-2"
              >
                <Book size={14} />
                {editingId ? 'Atualizar Sessão' : 'Registrar'}
              </button>
            </div>
          </section>

          {/* TIMELINE DE DIÁRIOS */}
          <section className={`${cardClass} mt-6 flex flex-col`}>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 dark:border-[#2C2C2E] pb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">Diário de Bordo</h3>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <input
                        placeholder="Buscar palavra-chave..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full sm:w-48 px-3 py-2 rounded-lg border text-xs font-medium bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#3A3A3C] text-slate-900 dark:text-white outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-[#636366]"
                    />
                    <select
                        value={filterMood}
                        onChange={e => setFilterMood(e.target.value as any)}
                        className="w-full sm:w-auto px-3 py-2 rounded-lg border text-xs font-bold bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#3A3A3C] text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                    >
                        <option value="all">Todas Emoções</option>
                        {moods.map(m => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence>
                {filteredHistory.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 dark:text-[#8E8E93] font-medium text-sm border border-dashed border-slate-200 dark:border-[#3A3A3C] rounded-xl">
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
                            className="p-5 rounded-xl border bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#2C2C2E] group transition-colors hover:border-slate-300 dark:hover:border-[#3A3A3C]"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${moodConfig?.bg} border ${moodConfig?.border}`}>
                                        {moodConfig?.icon}
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${moodConfig?.color}`}>{moodConfig?.label}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] font-medium mt-0.5">{entry.date} às {entry.time}</p>
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
                                        className="p-1.5 bg-slate-200 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-300 rounded-md hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => deleteMindsetEntry(entry.id)}
                                        className="p-1.5 bg-slate-200 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-300 rounded-md hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-slate-700 dark:text-[#E5E5EA] leading-relaxed font-medium">
                                {entry.note}
                            </p>
                        </motion.div>
                        )
                    })
                )}
                </AnimatePresence>
            </div>
          </section>
      </div>
      <TiltModal isOpen={showTiltModal} onClose={() => setShowTiltModal(false)} />
    </div>
  );
};

/* INSIGHT CARD (Refinado) */
const InsightCard = ({ title, value, description, positive, negative, color }: any) => (
  <div className="p-5 rounded-2xl border bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-[#2C2C2E] shadow-sm relative overflow-hidden">
    <p className="text-[10px] uppercase text-slate-500 dark:text-[#8E8E93] font-bold tracking-widest mb-2">
      {title}
    </p>

    <div className="flex items-center gap-2">
      <h3 className={`text-2xl font-bold tracking-tight ${color ? color : 'text-slate-900 dark:text-white'}`}>
        {value}
      </h3>
      {positive && (
        <div className="p-1 bg-emerald-50 dark:bg-emerald-500/10 rounded text-emerald-600 dark:text-emerald-500">
            <TrendingUp size={14} />
        </div>
      )}
      {negative && (
        <div className="p-1 bg-red-50 dark:bg-red-500/10 rounded text-red-600 dark:text-red-500">
            <TrendingDown size={14} />
        </div>
      )}
    </div>

    <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] font-medium mt-3 border-t border-slate-100 dark:border-[#2C2C2E] pt-3">
      {description}
    </p>
  </div>
);

export default Mindset;