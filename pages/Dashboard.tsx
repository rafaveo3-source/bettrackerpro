import React, { useState, useMemo } from 'react';
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

  const [period, setPeriod] = useState<'1S' | '1M' | '3M' | 'YTD' | 'ALL'>('ALL');

  /* -----------------------------
    THEME DETECTION (HIGH CONTRAST)
  ----------------------------- */
  const [isDark, setIsDark] = useState(false);

  React.useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Cores ajustadas para máximo contraste no Light/Dark mode
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#1e293b' : '#cbd5e1';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipText = isDark ? '#ffffff' : '#0f172a';

  const metrics = getMetrics();
  const activeBR = bankrolls.find(b => b.id === activeBankrollId);

  /* -----------------------------
      FORMAT VALUE 
  ----------------------------- */
  const formatValue = (value: number) => {
    if (displayMode === 'units') {
      const units = value / (unitSize || 100);
      return `${units >= 0 ? '+' : ''}${units.toFixed(2)}u`;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: activeBR?.currency || 'BRL'
    }).format(value);
  };

  const handleEdit = (bet: Bet) => {
    window.dispatchEvent(new CustomEvent('editBet', { detail: bet }));
  };

  /* -----------------------------
      HISTORY ENGINE
  ----------------------------- */
  const bankrollHistory = history.filter(
    b => b.bankrollId === activeBankrollId && b.status !== 'void'
  );

  const sortedHistory = [...bankrollHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const filteredHistory = useMemo(() => {
    if (period === 'ALL') return sortedHistory;

    const now = new Date();
    let limitDate = new Date();

    switch (period) {
      case '1S': limitDate.setDate(now.getDate() - 7); break;
      case '1M': limitDate.setMonth(now.getMonth() - 1); break;
      case '3M': limitDate.setMonth(now.getMonth() - 3); break;
      case 'YTD': limitDate = new Date(now.getFullYear(), 0, 1); break;
    }
    return sortedHistory.filter(bet => new Date(bet.date) >= limitDate);
  }, [sortedHistory, period]);

  let runningBalance = activeBR?.initialBalance || 0;

  if (period !== 'ALL' && filteredHistory.length > 0) {
    const betsBefore = sortedHistory.filter(bet => new Date(bet.date) < new Date(filteredHistory[0].date));
    runningBalance += betsBefore.reduce((acc, b) => acc + b.profit, 0);
  }

  const chartData = filteredHistory.map(bet => {
    runningBalance += bet.profit;
    return {
      date: bet.date.split('-').slice(1).reverse().join('/'),
      balance: runningBalance
    };
  });

  if (chartData.length === 0) {
    chartData.push({ date: 'Start', balance: activeBR?.initialBalance || 0 });
  }

  const heatmapData = useMemo(() => {
    const days = 30;
    const data = [];

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayBets = bankrollHistory.filter(b => b.date.startsWith(dateStr));
      const dayProfit = dayBets.reduce((acc, b) => acc + b.profit, 0);
      data.push({ date: dateStr, profit: dayProfit, count: dayBets.length });
    }
    return data;
  }, [bankrollHistory]);

  /* -----------------------------
      KPI CARD PREMIUM
  ----------------------------- */
  const KPICard = ({ title, value, subtext, icon: Icon, color, trend, extraInfo }: any) => (
    <div className="rounded-3xl p-6 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-w-0">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3.5 rounded-2xl bg-slate-50 dark:bg-[#09090b] shadow-inner ${color}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>

        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg tracking-widest ${
              trend >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
            }`}
          >
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
        {title}
      </p>

      <h3 className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
        {value}
      </h3>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          {subtext}
        </p>

        {extraInfo && (
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-bold">
            {extraInfo}
          </span>
        )}
      </div>
    </div>
  );

  const initialBal = activeBR?.initialBalance || 1;
  const growth = ((currentBankrollBalance - initialBal) / initialBal) * 100;

  // Customização robusta do Tooltip (Resolve o erro do TS)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} className="p-3 border rounded-xl shadow-xl font-mono text-xs">
          <p className="font-bold mb-1 opacity-70">{label}</p>
          <p className="text-emerald-500 font-black text-sm">Eq: {formatValue(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-12 w-full overflow-x-hidden">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
            System Status: Online • {activeBR?.name.toUpperCase() || 'SEM PORTFÓLIO'}
          </div>

          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Visão Geral <span className="text-slate-300 dark:text-slate-700 text-lg">///</span>
          </h1>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Patrimônio Líquido</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              {formatValue(currentBankrollBalance)}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm">
            <Activity className="text-emerald-500" size={20} />
          </div>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
        <KPICard
          title="Equity"
          value={formatValue(currentBankrollBalance)}
          subtext="Ativos Totais"
          icon={Wallet}
          color="text-emerald-500"
          trend={growth}
        />
        <KPICard
          title="Sharpe Ratio"
          value={metrics.sharpeRatio.toFixed(2)}
          subtext="Retorno / Risco"
          icon={Scale}
          color="text-indigo-500"
          extraInfo={metrics.sharpeRatio > 2 ? 'Excelente' : 'Moderado'}
        />
        <KPICard
          title="Max Drawdown"
          value={formatValue(metrics.maxDrawdown)}
          subtext="Queda Máxima"
          icon={AlertOctagon}
          color="text-red-500"
          extraInfo={`Risco ${(metrics.maxDrawdown / initialBal * 100).toFixed(1)}%`}
        />
        <KPICard
          title="Win Rate"
          value={`${metrics.winRate.toFixed(0)}%`}
          subtext={`N = ${metrics.totalBets}`}
          icon={Target}
          color="text-blue-500"
        />
        <KPICard
          title="P&L"
          value={formatValue(metrics.totalProfit)}
          subtext="Lucro Líquido"
          icon={DollarSign}
          color={metrics.totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}
        />
      </div>

      {/* CHART + SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CHART */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm">

          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Layers size={16} className="text-indigo-500" /> Curva de Performance
            </h3>

            <div className="flex gap-1 bg-slate-50 dark:bg-[#09090b] p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              {['1S','1M','3M','YTD','ALL'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p as any)}
                  className={`text-[9px] font-black tracking-widest px-4 py-1.5 rounded-lg transition-all ${
                    period === p ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
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
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />

                <XAxis dataKey="date" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} dy={10} />

                <YAxis 
                  stroke={axisColor} 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={-10}
                  tickFormatter={(val) => displayMode === 'units' ? `${(val / unitSize).toFixed(0)}u` : val} 
                />

                <Tooltip content={<CustomTooltip />} cursor={{ stroke: gridColor, strokeWidth: 1, strokeDasharray: '4 4' }} />

                <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={4} fill="url(#colorBal)" dot={false} activeDot={{ r: 6, fill: '#10b981', stroke: tooltipBg, strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="space-y-6">

          {/* HEATMAP */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <BarChart4 size={16} className="text-orange-500" /> Consistência
            </h3>

            <div className="grid grid-cols-6 gap-2">
              {heatmapData.map((d, i) => (
                <div
                  key={i}
                  title={`${d.date} - ${d.count} Entradas`}
                  className={`h-8 rounded-lg transition-transform hover:scale-110 cursor-pointer ${
                    d.count === 0 ? 'bg-slate-100 dark:bg-slate-800/50' : d.profit > 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ORDER FLOW */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] h-[340px] flex flex-col shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Order Flow Real-Time</h3>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {bankrollHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50">
                  <Sparkles size={28} className="mb-3 text-slate-400" />
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Aguardando Liquidez</p>
                </div>
              ) : (
                bankrollHistory.slice().reverse().slice(0, 15).map(bet => (
                  <div key={bet.id} className="group flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                    <div className="min-w-0 pr-4">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">{bet.event}</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-1">{bet.market}</p>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end">
                      <p className={`text-sm font-black font-mono ${bet.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatValue(bet.profit)}
                      </p>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                        <button onClick={() => handleEdit(bet)} className="text-slate-400 hover:text-blue-500 bg-white dark:bg-slate-800 p-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-700"><Pencil size={12} /></button>
                        <button onClick={() => confirm('Apagar permanentemente?') && removeBet(bet.id)} className="text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 p-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-700"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;