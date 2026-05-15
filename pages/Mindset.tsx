import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBetStore } from '../store/useBetStore';
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

// ==========================================
// CONFIGURAÇÕES MENTAIS E BLINDAGEM DE ERROS
// ==========================================
type MoodType = 'disciplined' | 'confident' | 'anxious' | 'angry' | 'tired' | string;

const moodConfig: Record<string, { label: string, color: string }> = {
  disciplined: { label: 'Disciplinado', color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
  confident:   { label: 'Confiante', color: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
  anxious:     { label: 'Ansioso / Hesitante', color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  angry:       { label: 'Irritado / Tilt', color: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' },
  tired:       { label: 'Exausto / Desatento', color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#2C2C2E] dark:text-[#E5E5EA] dark:border-[#3A3A3C]' },
};

// Se vier um log antigo ou corrompido, essa função garante que a tela não dê Black Screen
const getMoodConfig = (mood: string) => moodConfig[mood] || { label: mood || 'Desconhecido', color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#2C2C2E] dark:text-[#E5E5EA] dark:border-[#3A3A3C]' };

// ==========================================
// COMPONENTES DE INTERFACE GLOBAIS
// ==========================================
const ProBlurOverlay = ({ title, desc, navigate }: { title: string, desc: string, navigate: any }) => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 dark:bg-[#020617]/50 backdrop-blur-md rounded-2xl">
        <div className="bg-white dark:bg-[#1C1C1E] border border-orange-500/30 p-8 rounded-2xl max-w-md text-center shadow-xl flex flex-col items-center mx-4">
            <div className="bg-orange-500/10 p-4 rounded-xl mb-4 text-orange-600 dark:text-orange-400">
                <Crown size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                {title} <span className="text-orange-500">PRO</span>
            </h2>
            <p className="text-slate-500 dark:text-[#8E8E93] mb-6 text-sm leading-relaxed">
                {desc}
            </p>
            <button onClick={() => navigate('/pro')} className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-orange-600 dark:hover:bg-orange-500 font-bold py-3.5 px-8 rounded-xl transition-all shadow-sm text-xs tracking-widest uppercase">
                Desbloquear Acesso
            </button>
        </div>
    </div>
);

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

    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-[#636366] mt-3 pt-3 border-t border-slate-100 dark:border-[#2C2C2E]">
      {description}
    </p>
  </div>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const Mindset: React.FC = () => {
  const {
    addMindsetEntry,
    deleteMindsetEntry,
    updateMindsetEntry,
    mindsetHistory = [], 
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

  // 🔥 ESTATÍSTICAS E INSIGHTS MENTAIS 🔥
  const metrics = useMemo(() => {
    const total = mindsetHistory.length;
    if (total === 0) return { tiltCount: 0, disciplinedCount: 0, bestMood: 'N/A', worstMood: 'N/A', riskScore: 0 };

    const moodCounts = mindsetHistory.reduce((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const tiltCount = (moodCounts['angry'] || 0) + (moodCounts['anxious'] || 0);
    const disciplinedCount = (moodCounts['disciplined'] || 0) + (moodCounts['confident'] || 0);
    
    const riskScore = total > 0 ? (tiltCount / total) * 100 : 0;

    let maxCount = 0; let best = 'N/A';
    ['disciplined', 'confident'].forEach(m => { 
        if ((moodCounts[m]||0) > maxCount) { 
            maxCount = moodCounts[m]; 
            best = getMoodConfig(m).label; 
        } 
    });

    let maxBad = 0; let worst = 'N/A';
    ['angry', 'anxious', 'tired'].forEach(m => { 
        if ((moodCounts[m]||0) > maxBad) { 
            maxBad = moodCounts[m]; 
            worst = getMoodConfig(m).label; 
        } 
    });

    return { tiltCount, disciplinedCount, bestMood: best, worstMood: worst, riskScore };
  }, [mindsetHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    if (editingId) {
      updateMindsetEntry(editingId, { mood: selectedMood, note });
      setEditingId(null);
    } else {
      addMindsetEntry({
        mood: selectedMood,
        note,
        date: new Date().toISOString(),
      });
    }
    
    setNote('');
    setSelectedMood('disciplined');
  };

  const handleEdit = (entry: any) => {
    setEditingId(entry.id);
    setSelectedMood(entry.mood);
    setNote(entry.note);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredHistory = mindsetHistory.filter(entry => {
      const matchSearch = entry.note.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter = filterMood === 'all' || entry.mood === filterMood;
      return matchSearch && matchFilter;
  });

  const cardClass = "bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm transition-all";
  const isLocked = tiltLockUntil && new Date(tiltLockUntil) > new Date();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 w-full overflow-x-hidden font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-[#2C2C2E] pb-6">
        <div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
              Psychological Engine
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Diário Psicológico
            </h1>
            <p className="text-slate-500 dark:text-[#8E8E93] text-sm font-medium">
              Avalie seu estado emocional e evite operar em dias de alto risco.
            </p>
          </div>
        </div>
        
        {isLocked ? (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-6 py-3 rounded-xl flex items-center gap-3">
                <Lock size={18} className="text-red-500" />
                <div>
                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-0.5">Tilt Lock Ativo</p>
                    <p className="text-xs font-bold font-mono text-red-700 dark:text-red-300 tracking-tight">Até {new Date(tiltLockUntil!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
            </div>
        ) : (
            <div className="relative">
                <button 
                    onClick={() => setShowLockConfirm(!showLockConfirm)}
                    className="w-full md:w-auto bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 px-6 py-3 rounded-xl flex justify-center items-center gap-2 font-bold uppercase text-[10px] tracking-widest transition-colors shadow-sm"
                >
                <ShieldAlert size={14} /> Ativar Tilt Lock (Pânico)
                </button>

                <AnimatePresence>
                    {showLockConfirm && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#1C1C1E] border border-red-200 dark:border-red-500/30 rounded-2xl shadow-2xl p-5 z-50">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight mb-2">Bloqueio de Emergência</h4>
                            <p className="text-xs text-slate-500 dark:text-[#8E8E93] mb-4 font-medium leading-relaxed">Você está em Tilt. Isso vai bloquear a criação e edição de apostas em todo o sistema por 24 horas. Irreversível.</p>
                            <div className="flex gap-2">
                                <button onClick={() => setShowLockConfirm(false)} className="flex-1 bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-[#3A3A3C] text-slate-700 dark:text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-lg transition-colors">Cancelar</button>
                                <button onClick={() => { activateTiltLock(24); setShowLockConfirm(false); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-lg transition-colors shadow-sm">Travar Agora</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )}
      </header>

      {/* DASHBOARD DE INSIGHTS MENTAIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <InsightCard title="Taxa de Descontrole" value={`${metrics.riskScore.toFixed(0)}%`} description="Dias em Risco/Tilt" negative={metrics.riskScore > 30} color={metrics.riskScore > 30 ? 'text-red-600 dark:text-red-500' : ''} />
          <InsightCard title="Sessões de Foco" value={metrics.disciplinedCount} description="Dias sob Controle" positive />
          <InsightCard title="Melhor Estado" value={metrics.bestMood} description="Maior frequência positiva" color="text-indigo-600 dark:text-indigo-400" />
          <InsightCard title="Gatilho Principal" value={metrics.worstMood} description="O que mais te derruba" color="text-orange-600 dark:text-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          
          {/* BLOQUEIO PRO NA ÁREA PRINCIPAL */}
          {!isPro && <ProBlurOverlay title="Módulo Psicológico" desc="Descubra a correlação matemática entre o seu estado emocional e o seu lucro/prejuízo no mercado." navigate={navigate} />}
          
          <div className={`lg:col-span-1 space-y-6 ${!isPro ? 'pointer-events-none select-none blur-md opacity-50' : ''}`}>
            <section className={cardClass}>
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-[#2C2C2E] pb-4">
                    <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl border border-orange-100 dark:border-orange-500/20"><BrainCircuit size={18} /></div>
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-lg">Registro de Estado</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-3 block">1. Como você se sentiu hoje?</label>
                        <div className="grid grid-cols-1 gap-2">
                        {Object.keys(moodConfig).map((mood) => (
                            <button
                                key={mood}
                                type="button"
                                onClick={() => setSelectedMood(mood)}
                                className={`
                                    w-full text-left px-4 py-3 rounded-xl border transition-all text-xs font-bold tracking-wide uppercase
                                    ${selectedMood === mood 
                                        ? `${moodConfig[mood].color} shadow-sm ring-1 ring-current` 
                                        : 'bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#3A3A3C] text-slate-500 dark:text-[#8E8E93] hover:border-slate-300 dark:hover:border-slate-600'}
                                `}
                            >
                                {moodConfig[mood].label}
                            </button>
                        ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-2 flex items-center justify-between">
                            <span>2. Notas / Gatilhos (Opcional)</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="O que causou esse estado mental? Qual foi o gatilho principal?"
                            className="w-full bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium text-sm outline-none focus:border-indigo-500 transition-colors resize-none h-32 placeholder:text-slate-400"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!note.trim()}
                        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold py-4 rounded-xl shadow-sm transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {editingId ? 'Atualizar Diário' : 'Gravar no Diário'} <Book size={16} />
                    </button>
                </form>
            </section>

            {/* AVISO DE TILT CONSTANTE */}
            {metrics.riskScore > 40 && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-6 flex items-start gap-4">
                    <AlertTriangle className="text-red-500 shrink-0 mt-1" size={24} />
                    <div>
                        <h4 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-tight mb-1">Alerta Vermelho</h4>
                        <p className="text-xs text-red-600 dark:text-red-300 font-medium leading-relaxed">Seu nível de Tilt está muito alto recentemente. Considere diminuir a stake pela metade ou usar a Trava de Emergência antes que a banca quebre.</p>
                    </div>
                </div>
            )}
          </div>

          <section className={`lg:col-span-2 space-y-4 ${!isPro ? 'pointer-events-none select-none blur-md opacity-50' : ''}`}>
            
            {/* FILTROS DO HISTÓRICO */}
            <div className="flex flex-col sm:flex-row gap-3">
                <input 
                    type="text" 
                    placeholder="Buscar notas ou gatilhos..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                />
                <select 
                    value={filterMood}
                    onChange={(e) => setFilterMood(e.target.value)}
                    className="w-full sm:w-48 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer text-slate-700 dark:text-white"
                >
                    <option value="all">Todos os Estados</option>
                    {Object.keys(moodConfig).map((mood) => (
                        <option key={mood} value={mood}>{moodConfig[mood].label}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                {filteredHistory.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${cardClass} text-center py-16`}>
                        <BrainCircuit size={32} className="mx-auto text-slate-300 dark:text-[#3A3A3C] mb-4" />
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2 tracking-tight">Nenhum registro encontrado</h3>
                        <p className="text-slate-500 dark:text-[#8E8E93] text-sm font-medium">Seu diário psicológico está vazio ou a busca não retornou resultados.</p>
                    </motion.div>
                ) : (
                    filteredHistory.map((entry) => {
                        const config = getMoodConfig(entry.mood);
                        return (
                        <motion.div 
                            key={entry.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`${cardClass} group hover:border-slate-300 dark:hover:border-[#3A3A3C] relative overflow-hidden`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded text-[9px] uppercase tracking-widest font-bold border ${config.color}`}>
                                        {config.label}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-[#636366] uppercase tracking-widest flex items-center gap-1">
                                        <Clock size={10} />
                                        {new Date(entry.date).toLocaleDateString('pt-BR')} às {new Date(entry.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(entry)} className="p-2 bg-slate-50 dark:bg-[#000000] text-slate-500 dark:text-[#8E8E93] hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg border border-slate-200 dark:border-[#2C2C2E] transition-colors"><Pencil size={12} /></button>
                                    <button onClick={() => confirm('Excluir este registro?') && deleteMindsetEntry(entry.id)} className="p-2 bg-slate-50 dark:bg-[#000000] text-slate-500 dark:text-[#8E8E93] hover:text-red-500 dark:hover:text-red-400 rounded-lg border border-slate-200 dark:border-[#2C2C2E] transition-colors"><Trash2 size={12} /></button>
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

export default Mindset;