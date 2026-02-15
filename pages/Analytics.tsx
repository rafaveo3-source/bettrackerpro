import React from 'react';
import { useBetStore } from '../store/useBetStore';
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
} from 'recharts';
import { BarChart4 } from 'lucide-react';

const Analytics: React.FC = () => {
  const {
    history,
    activeBankrollId,
    displayMode,
    unitSize,
    bankrolls
  } = useBetStore();

  const activeBR = bankrolls.find(
    b => b.id === activeBankrollId
  );

  const formatValue = (value: number) => {
    if (displayMode === 'units') {
      const units = value / (unitSize || 100);
      return `${units >= 0 ? '+' : ''}${units.toFixed(
        2
      )}u`;
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: activeBR?.currency || 'BRL'
    }).format(value);
  };

  const bankrollBets = history.filter(
    b =>
      b.bankrollId === activeBankrollId &&
      b.status !== 'void' &&
      b.status !== 'refunded'
  );

  /* -----------------------------
     PROFIT BY SPORT
  ----------------------------- */

  const sportPerformance: Record<string, number> = {};

  bankrollBets.forEach(bet => {
    if (bet.status === 'pending') return;
    if (!sportPerformance[bet.sport])
      sportPerformance[bet.sport] = 0;
    sportPerformance[bet.sport] += bet.profit;
  });

  const barData = Object.keys(
    sportPerformance
  ).map(sport => ({
    name: sport,
    profit: sportPerformance[sport]
  }));

  /* -----------------------------
     PROFIT BY METHOD
  ----------------------------- */

  const methodPerformance: Record<
    string,
    number
  > = {};

  bankrollBets.forEach(bet => {
    if (bet.status === 'pending') return;
    const method = bet.method || 'Sem Método';
    if (!methodPerformance[method])
      methodPerformance[method] = 0;
    methodPerformance[method] += bet.profit;
  });

  const methodBarData = Object.keys(
    methodPerformance
  ).map(method => ({
    name: method,
    profit: methodPerformance[method]
  }));

  /* -----------------------------
     STATUS DISTRIBUTION
  ----------------------------- */

  const statusCount = {
    won: 0,
    lost: 0,
    pending: 0,
    refunded: 0
  };

  const allBets = history.filter(
    b => b.bankrollId === activeBankrollId
  );

  allBets.forEach(bet => {
    if (
      ['won', 'half-won'].includes(
        bet.status
      )
    )
      statusCount.won++;
    else if (
      ['lost', 'half-lost'].includes(
        bet.status
      )
    )
      statusCount.lost++;
    else if (
      bet.status === 'refunded' ||
      bet.status === 'void'
    )
      statusCount.refunded++;
    else if (bet.status === 'pending')
      statusCount.pending++;
    else if (bet.status === 'cashout') {
      if (bet.profit >= 0)
        statusCount.won++;
      else statusCount.lost++;
    }
  });

  const pieData = [
    {
      name: 'Green',
      value: statusCount.won,
      color: '#10b981'
    },
    {
      name: 'Red',
      value: statusCount.lost,
      color: '#ef4444'
    },
    {
      name: 'Reembolso',
      value: statusCount.refunded,
      color: '#64748b'
    },
    {
      name: 'Pendente',
      value: statusCount.pending,
      color: '#eab308'
    }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">

      {/* HEADER PADRÃO DO SISTEMA */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LUCRO POR ESPORTE */}
        <div className="bg-white dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">

          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <BarChart4 size={14} />
            Lucro por Esporte
          </h3>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  strokeOpacity={0.08}
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val =>
                    displayMode === 'units'
                      ? `${(
                          val / unitSize
                        ).toFixed(0)}u`
                      : val
                  }
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      '#0b1220',
                    borderRadius: '12px'
                  }}
                  formatter={(value: number) => [
                    formatValue(value),
                    'Lucro'
                  ]}
                />

                <Bar
                  dataKey="profit"
                  radius={[8, 8, 0, 0]}
                >
                  {barData.map(
                    (entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.profit >= 0
                            ? '#10b981'
                            : '#ef4444'
                        }
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LUCRO POR MÉTODO */}
        <div className="bg-white dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">

          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
            Lucro por Método
          </h3>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={methodBarData}
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  strokeOpacity={0.08}
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val =>
                    displayMode === 'units'
                      ? `${(
                          val / unitSize
                        ).toFixed(0)}u`
                      : val
                  }
                />

                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      '#0b1220',
                    borderRadius: '12px'
                  }}
                  formatter={(value: number) => [
                    formatValue(value),
                    'Lucro'
                  ]}
                />

                <Bar
                  dataKey="profit"
                  radius={[0, 8, 8, 0]}
                >
                  {methodBarData.map(
                    (entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.profit >= 0
                            ? '#10b981'
                            : '#ef4444'
                        }
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DISTRIBUIÇÃO */}
        <div className="bg-white dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:col-span-2">

          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
            Distribuição de Resultados
          </h3>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map(
                    (entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.color}
                        stroke="none"
                      />
                    )
                  )}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      '#0b1220',
                    borderRadius: '12px'
                  }}
                />

                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
