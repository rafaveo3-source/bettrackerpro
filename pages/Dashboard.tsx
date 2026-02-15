import React, { useState, useMemo, useEffect } from 'react';
import { useBetStore, Bet } from '../store/useBetStore';
import {
  Wallet,
  Target,
  Activity,
  DollarSign,
  Trash2,
  Pencil,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  BarChart4,
  AlertOctagon,
  Scale
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const Dashboard: React.FC = () => {
  const {
    currentBankrollBalance,
    bankrolls,
    activeBankrollId,
    getMetrics,
    history,
    removeBet,
    displayMode,
    unitSize
  } = useBetStore();

  /* =========================
     DETECTA TEMA ATUAL
  ========================== */

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(
        document.documentElement.classList.contains('dark')
      );
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const axisColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipText = isDark ? '#ffffff' : '#0f172a';

  const [period, setPeriod] =
    useState<'1S' | '1M' | '3M' | 'YTD' | 'ALL'>('ALL');

  const metrics = getMetrics();
  const activeBR = bankrolls.find(
    b => b.id === activeBankrollId
  );

  /* -----------------------------
     FORMAT VALUE (INTACTO)
  ----------------------------- */
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

  const handleEdit = (bet: Bet) => {
    window.dispatchEvent(
      new CustomEvent('editBet', { detail: bet })
    );
  };

  /* -----------------------------
     HISTORY (INALTERADO)
  ----------------------------- */
  const bankrollHistory = history.filter(
    b =>
      b.bankrollId === activeBankrollId &&
      b.status !== 'void'
  );

  const sortedHistory = [...bankrollHistory].sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime()
  );

  const filteredHistory = useMemo(() => {
    if (period === 'ALL') return sortedHistory;

    const now = new Date();
    let limitDate = new Date();

    switch (period) {
      case '1S':
        limitDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        limitDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        limitDate.setMonth(now.getMonth() - 3);
        break;
      case 'YTD':
        limitDate = new Date(
          now.getFullYear(),
          0,
          1
        );
        break;
    }

    return sortedHistory.filter(
      bet => new Date(bet.date) >= limitDate
    );
  }, [sortedHistory, period]);

  let runningBalance =
    activeBR?.initialBalance || 0;

  if (
    period !== 'ALL' &&
    filteredHistory.length > 0
  ) {
    const betsBefore = sortedHistory.filter(
      bet =>
        new Date(bet.date) <
        new Date(filteredHistory[0].date)
    );

    runningBalance += betsBefore.reduce(
      (acc, b) => acc + b.profit,
      0
    );
  }

  const chartData = filteredHistory.map(
    bet => {
      runningBalance += bet.profit;

      return {
        date: bet.date
          .split('-')
          .slice(1)
          .reverse()
          .join('/'),
        balance: runningBalance
      };
    }
  );

  if (chartData.length === 0)
    chartData.push({
      date: 'Start',
      balance:
        activeBR?.initialBalance || 0
    });

  const heatmapData = useMemo(() => {
    const days = 30;
    const data = [];

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(
        d.getDate() - (days - 1 - i)
      );

      const dateStr =
        d.toISOString().split('T')[0];

      const dayBets =
        bankrollHistory.filter(b =>
          b.date.startsWith(dateStr)
        );

      const dayProfit =
        dayBets.reduce(
          (acc, b) => acc + b.profit,
          0
        );

      data.push({
        date: dateStr,
        profit: dayProfit,
        count: dayBets.length
      });
    }

    return data;
  }, [bankrollHistory]);

  const initialBal =
    activeBR?.initialBalance || 1;

  const growth =
    ((currentBankrollBalance -
      initialBal) /
      initialBal) *
    100;

  return (
    <div className="space-y-8 pb-12 w-full overflow-x-hidden">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">

        <div>
          <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            System: Online • {activeBR?.name.toUpperCase()}
          </div>

          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Dashboard <span className="text-slate-400 dark:text-slate-700 text-lg">///</span>
          </h1>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Liquidez Líquida
            </p>
            <p className="text-3xl font-black text-emerald-500 dark:text-emerald-400 font-mono tracking-tight">
              {formatValue(currentBankrollBalance)}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
            <Activity className="text-emerald-500" size={18} />
          </div>
        </div>
      </header>

      {/* CHART + SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CHART */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">

          <div className="flex justify-between mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Layers size={14} /> Curva de Performance
            </h3>

            <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
              {['1S','1M','3M','YTD','ALL'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p as any)}
                  className={`text-[10px] font-bold px-3 py-1 rounded ${
                    period === p
                      ? 'bg-white dark:bg-slate-800 shadow'
                      : 'text-slate-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke={gridColor}
                  strokeDasharray="4 4"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
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
                  tickFormatter={(val) =>
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
                  formatter={(value: number) => [formatValue(value), 'Equity']}
                />

                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorBal)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
