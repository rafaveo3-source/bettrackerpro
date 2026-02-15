import React, { useState, useMemo } from 'react'
import { useBetStore, MoodType } from '../store/useBetStore'
import {
  Book,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  BrainCircuit
} from 'lucide-react'
import TiltModal from '../components/TiltModal'
import { motion, AnimatePresence } from 'framer-motion'

const Mindset: React.FC = () => {
  const {
    addMindsetEntry,
    deleteMindsetEntry,
    updateMindsetEntry,
    mindsetHistory,
    history
  } = useBetStore()

  const [selectedMood, setSelectedMood] =
    useState<MoodType>('disciplined')
  const [note, setNote] = useState('')
  const [editingId, setEditingId] =
    useState<string | null>(null)
  const [searchQuery, setSearchQuery] =
    useState('')
  const [filterMood, setFilterMood] =
    useState<MoodType | 'all'>('all')
  const [showTiltModal, setShowTiltModal] =
    useState(false)

  const moods = [
    { id: 'confident', label: 'Confiante', icon: '🦁' },
    { id: 'disciplined', label: 'Disciplinado', icon: '🧘‍♂️' },
    { id: 'anxious', label: 'Ansioso', icon: '😰' },
    { id: 'tilted', label: 'Tilted', icon: '🤬' }
  ]

  /* -----------------------------
     INSIGHTS
  ----------------------------- */

  const moodInsights = useMemo(() => {
    const stats: any = {}
    moods.forEach(m => (stats[m.id] = { count: 0, totalProfit: 0 }))

    mindsetHistory.forEach(entry => {
      if (stats[entry.mood]) stats[entry.mood].count++

      const betsOnDay = history.filter(
        bet =>
          bet.date.startsWith(entry.date) &&
          bet.status !== 'pending' &&
          bet.status !== 'void'
      )

      const dayProfit = betsOnDay.reduce(
        (acc, bet) => acc + bet.profit,
        0
      )

      if (stats[entry.mood])
        stats[entry.mood].totalProfit += dayProfit
    })

    return moods.map(m => {
      const data = stats[m.id]
      const avg =
        data.count > 0
          ? data.totalProfit / data.count
          : 0
      return { ...m, ...data, avg }
    })
  }, [mindsetHistory, history])

  const bestMood = [...moodInsights].sort(
    (a, b) => b.avg - a.avg
  )[0]

  const worstMood = [...moodInsights].sort(
    (a, b) => a.avg - b.avg
  )[0]

  const totalEntries = mindsetHistory.length

  const mentalScore = useMemo(() => {
    const counts: any = {}
    moods.forEach(m => (counts[m.id] = 0))
    mindsetHistory.forEach(e => counts[e.mood]++)

    return (
      counts.confident * 2 +
      counts.disciplined * 1.5 -
      counts.anxious * 1.2 -
      counts.tilted * 2
    )
  }, [mindsetHistory])

  /* -----------------------------
     FILTER
  ----------------------------- */

  const filteredHistory = useMemo(() => {
    return mindsetHistory.filter(e => {
      const matchesSearch =
        e.note
          .toLowerCase()
          .includes(searchQuery.toLowerCase())

      const matchesMood =
        filterMood === 'all' ||
        e.mood === filterMood

      return matchesSearch && matchesMood
    })
  }, [mindsetHistory, searchQuery, filterMood])

  /* -----------------------------
     SAVE
  ----------------------------- */

  const handleSave = () => {
    if (!note.trim()) return

    if (editingId) {
      updateMindsetEntry(editingId, {
        mood: selectedMood,
        note
      })
      setEditingId(null)
    } else {
      addMindsetEntry({
        date: new Date()
          .toISOString()
          .split('T')[0],
        time: new Date().toLocaleTimeString(
          'pt-BR',
          {
            hour: '2-digit',
            minute: '2-digit'
          }
        ),
        mood: selectedMood,
        note,
        tags: []
      })

      if (selectedMood === 'tilted')
        setShowTiltModal(true)
    }

    setNote('')
  }

  return (
    <div className="space-y-10 pb-24 max-w-7xl mx-auto">

      {/* HEADER PADRONIZADO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">

        <div>
          <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            System: Online • Mindset Engine
          </div>

          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Psicologia & Performance
            <span className="text-slate-400 dark:text-slate-700 text-lg ml-2">///</span>
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest mt-2">
            Monitoramento emocional e impacto direto na performance operacional
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
          <BrainCircuit
            className="text-emerald-500"
            size={18}
          />
        </div>
      </header>

      {/* INSIGHTS */}
      <section className="grid md:grid-cols-4 gap-6">
        <InsightCard
          title="Zona de Performance"
          value={bestMood?.label}
          description={`Lucro médio: R$ ${bestMood?.avg.toFixed(2)}`}
          positive
        />

        <InsightCard
          title="Zona de Perigo"
          value={worstMood?.label}
          description={`Lucro médio: R$ ${worstMood?.avg.toFixed(2)}`}
          negative
        />

        <InsightCard
          title="Score Mental"
          value={mentalScore.toFixed(1)}
          description="Estabilidade emocional operacional"
        />

        <InsightCard
          title="Sessões Registradas"
          value={totalEntries}
          description="Base histórica emocional"
        />
      </section>

      {/* FORM */}
      <section className="bg-white dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {moods.map(m => (
            <button
              key={m.id}
              onClick={() =>
                setSelectedMood(
                  m.id as MoodType
                )
              }
              className={`p-5 rounded-2xl border transition-all ${
                selectedMood === m.id
                  ? 'border-purple-500 scale-105'
                  : 'border-transparent'
              }`}
            >
              <div className="text-3xl">
                {m.icon}
              </div>
              <div className="text-xs font-bold mt-2">
                {m.label}
              </div>
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={e =>
            setNote(e.target.value)
          }
          placeholder="Descreva seu estado mental, gatilhos e decisões..."
          className="w-full p-6 rounded-2xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 min-h-[140px]"
        />

        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-slate-400">
            {note.length} caracteres
          </span>

          <button
            onClick={handleSave}
            className="px-8 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-bold uppercase"
          >
            <Book
              size={14}
              className="inline mr-1"
            />
            {editingId
              ? 'Atualizar Sessão'
              : 'Registrar Sessão'}
          </button>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="bg-white dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 max-h-[600px] overflow-y-auto">

        <div className="flex gap-3 flex-wrap mb-4">
          <input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={e =>
              setSearchQuery(e.target.value)
            }
            className="px-4 py-2 rounded-xl border text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          />

          <select
            value={filterMood}
            onChange={e =>
              setFilterMood(
                e.target.value as any
              )
            }
            className="px-4 py-2 rounded-xl border text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          >
            <option value="all">
              Todos
            </option>
            {moods.map(m => (
              <option
                key={m.id}
                value={m.id}
              >
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <AnimatePresence>
          {filteredHistory.map(
            entry => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-5 rounded-2xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 group"
              >
                <div className="flex justify-between">
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {
                      moods.find(
                        m =>
                          m.id ===
                          entry.mood
                      )?.icon
                    }{' '}
                    {entry.date}
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(
                          entry.id
                        )
                        setSelectedMood(
                          entry.mood
                        )
                        setNote(
                          entry.note
                        )
                      }}
                    >
                      <Pencil
                        size={14}
                      />
                    </button>

                    <button
                      onClick={() =>
                        deleteMindsetEntry(
                          entry.id
                        )
                      }
                    >
                      <Trash2
                        size={14}
                      />
                    </button>
                  </div>
                </div>

                <p className="text-sm mt-3 text-slate-600 dark:text-slate-300">
                  {entry.note}
                </p>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </section>

      <TiltModal
        isOpen={showTiltModal}
        onClose={() =>
          setShowTiltModal(false)
        }
      />
    </div>
  )
}

/* INSIGHT CARD */

const InsightCard = ({
  title,
  value,
  description,
  positive,
  negative
}: any) => (
  <div className="p-6 rounded-2xl border bg-white dark:bg-[#0f172a]/50 border-slate-200 dark:border-slate-800">
    <p className="text-xs uppercase text-slate-400 font-bold tracking-widest mb-2">
      {title}
    </p>

    <div className="flex items-center gap-2">
      {positive && (
        <TrendingUp
          size={18}
          className="text-emerald-500"
        />
      )}
      {negative && (
        <TrendingDown
          size={18}
          className="text-red-500"
        />
      )}
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
        {value}
      </h3>
    </div>

    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
      {description}
    </p>
  </div>
)

export default Mindset
