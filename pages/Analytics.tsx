import React from 'react'
import { useBetStore } from '../store/useBetStore'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts'
import { BarChart4 } from 'lucide-react'

const Analytics: React.FC = () => {
  const {
    history,
    activeBankrollId,
    displayMode,
    unitSize,
    bankrolls
  } = useBetStore()

  const activeBR = bankrolls.find(
    b => b.id === activeBankrollId
  )

  const formatValue = (value: number) => {
    if (displayMode === 'units') {
      const units = value / (unitSize || 100)
      return `${units >= 0 ? '+' : ''}${units.toFixed(2)}u`
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: activeBR?.currency || 'BRL'
    }).format(value)
  }

  /* -----------------------------
   THEME DETECTION (UX FIX)
----------------------------- */
const [isDark, setIsDark] = React.useState(false)

React.useEffect(() => {
  const checkTheme = () => {
    setIsDark(
      document.documentElement.classList.contains('dark')
    )
  }

  checkTheme()

  const observer = new MutationObserver(checkTheme)

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })

  return () => observer.disconnect()
}, [])

const axisColor = isDark ? '#94a3b8' : '#475569'
const gridColor = isDark ? '#1e293b' : '#e2e8f0'
const tooltipBg = isDark ? '#0f172a' : '#ffffff'
const tooltipBorder = isDark ? '#1e293b' : '#e2e8f0'
const tooltipText = isDark ? '#ffffff' : '#0f172a'

  const bankrollBets = history.filter(
    b =>
      b.bankrollId === activeBankrollId &&
      b.status !== 'void' &&
      b.status !== 'refunded'
  )

  /* =============================
     PROFIT BY SPORT
  ============================== */

  const sportPerformance: Record<string, number> = {}

  bankrollBets.forEach(bet => {
    if (bet.status === 'pending') return
    if (!sportPerformance[bet.sport])
      sportPerformance[bet.sport] = 0
    sportPerformance[bet.sport] += bet.profit
  })

  const barData = Object.keys(
    sportPerformance
  ).map(sport => ({
    name: sport,
    profit: sportPerformance[sport]
  }))

  /* =============================
     PROFIT BY METHOD
  ============================== */

  const methodPerformance: Record<string, number> =
    {}

  bankrollBets.forEach(bet => {
    if (bet.status === 'pending') return
    const method = bet.method || 'Sem Método'
    if (!methodPerformance[method])
      methodPerformance[method] = 0
    methodPerformance[method] += bet.profit
  })

  const methodBarData = Object.keys(
    methodPerformance
  ).map(method => ({
    name: method,
    profit: methodPerformance[method]
  }))

  /* =============================
     STATUS DISTRIBUTION
  ============================== */

  const statusCount = {
    won: 0,
    lost: 0,
    pending: 0,
    refunded: 0
  }

  const allBets = history.filter(
    b => b.bankrollId === activeBankrollId
  )

  allBets.forEach(bet => {
    if (['won', 'half-won'].includes(bet.status))
      statusCount.won++
    else if (
      ['lost', 'half-lost'].includes(bet.status)
    )
      statusCount.lost++
    else if (
      bet.status === 'refunded' ||
      bet.status === 'void'
    )
      statusCount.refunded++
    else if (bet.status === 'pending')
      statusCount.pending++
    else if (bet.status === 'cashout') {
      bet.profit >= 0
        ? statusCount.won++
        : statusCount.lost++
    }
  })

  const pieData = [
    { name: 'Green', value: statusCount.won, color: '#10b981' },
    { name: 'Red', value: statusCount.lost, color: '#ef4444' },
    { name: 'Reembolso', value: statusCount.refunded, color: '#64748b' },
    { name: 'Pendente', value: statusCount.pending, color: '#eab308' }
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto bg-slate-50 dark:bg-[#0b1220]">

      {/* HEADER */}
      <header className="border-b border-slate-200 dark:border-slate-800 pb-6">

        <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Intelligence Module
        </div>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
          Análise de Dados
          <span className="text-slate-400 dark:text-slate-700 text-lg ml-2">
            ///
          </span>
        </h1>

        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest mt-2">
          Métricas detalhadas da sua performance nesta banca
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LUCRO POR ESPORTE */}
        <div className="rounded-3xl bg-white dark:bg-[#0f172a] ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-8">

          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <BarChart4 size={14} />
            Lucro por Esporte
          </h3>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid
  stroke={gridColor}
  strokeDasharray="3 3"
  vertical={false}
/>

<XAxis
  dataKey="name"
  stroke={axisColor}
  fontSize={11}
  tickLine={false}
  axisLine={false}
/>

<YAxis
  stroke={axisColor}
  fontSize={11}
  tickLine={false}
  axisLine={false}
  tickFormatter={val =>
    displayMode === 'units'
      ? `${(val / unitSize).toFixed(0)}u`
      : val
  }
/>

<Tooltip
  contentStyle={{
    backgroundColor: tooltipBg,
    border: `1px solid ${tooltipBorder}`,
    borderRadius: '12px',
    color: tooltipText
  }}
  itemStyle={{ color: tooltipText }}
  labelStyle={{ color: axisColor }}
  formatter={(value: number) => [
    formatValue(value),
    'Lucro'
  ]}
/>

                <Bar dataKey="profit" radius={[10, 10, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.profit >= 0
                          ? '#10b981'
                          : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LUCRO POR MÉTODO */}
        <div className="rounded-3xl bg-white dark:bg-[#0f172a] ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-8">

          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
            Lucro por Método
          </h3>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={methodBarData} layout="vertical">

                <CartesianGrid
  stroke={gridColor}
  strokeDasharray="3 3"
  horizontal={false}
/>

<XAxis
  type="number"
  stroke={axisColor}
  fontSize={11}
  tickLine={false}
  axisLine={false}
  tickFormatter={val =>
    displayMode === 'units'
      ? `${(val / unitSize).toFixed(0)}u`
      : val
  }
/>

<YAxis
  dataKey="name"
  type="category"
  stroke={axisColor}
  fontSize={11}
  tickLine={false}
  axisLine={false}
  width={140}
/>

<Tooltip
  contentStyle={{
    backgroundColor: tooltipBg,
    border: `1px solid ${tooltipBorder}`,
    borderRadius: '12px',
    color: tooltipText
  }}
  itemStyle={{ color: tooltipText }}
  labelStyle={{ color: axisColor }}
  formatter={(value: number) => [
    formatValue(value),
    'Lucro'
  ]}
/>

                <Bar dataKey="profit" radius={[0, 10, 10, 0]}>
                  {methodBarData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.profit >= 0
                          ? '#10b981'
                          : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DISTRIBUIÇÃO */}
        <div className="rounded-3xl bg-white dark:bg-[#0f172a] ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm p-8 lg:col-span-2">

          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
            Distribuição de Resultados
          </h3>

          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.color}
                      stroke="none"
                    />
                  ))}
                </Pie>

                <Tooltip
  contentStyle={{
    backgroundColor: tooltipBg,
    border: `1px solid ${tooltipBorder}`,
    borderRadius: '12px',
    color: tooltipText
  }}
  itemStyle={{ color: tooltipText }}
  labelStyle={{ color: axisColor }}
/>

                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Analytics
