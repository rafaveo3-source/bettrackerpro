import React, { useState, useMemo } from 'react';
import { useBetStore, Bet } from '../store/useBetStore';
import { useNavigate } from 'react-router-dom';
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
  Scale,
  Crown,
  AlertTriangle
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
    history = [],
    removeBet,
    displayMode,
    unitSize,
    isPro
  } = useBetStore();

  const navigate = useNavigate();
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

  const axisColor = isDark ? '#636366' : '#94a3b8';
  const gridColor = isDark ? '#2C2C2E' : '#e2e8f0';
  const tooltipBg = isDark ? '#1C1C1E' : '#ffffff';
  const tooltipBorder = isDark ? '#3A3A3C' : '#cbd5e1';
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
      BARRA DE ESCASSEZ (FREE ONLY)
  ----------------------------- */
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyBetsCount = history.filter(b => {
      const d = new Date(b.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;
  
  const MAX_FREE_BETS = 50;
  const isNearingLimit = monthlyBetsCount >= 40;
  const isAtLimit = monthlyBetsCount >= MAX_FREE_BETS;
  const progressPercent = Math.min((monthlyBetsCount / MAX_FREE_BETS) * 100, 100);

  /* -----------------------------
      KPI CARD PREMIUM (APPLE PRO)
  ----------------------------- */
  const KPICard = ({ title, value, subtext, icon: Icon, color, trend, extraInfo }: any) => (
    <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm min-w-0">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-100 dark:border-[#3A3A3C] ${color}`}>
          <Icon size={20} strokeWidth={2} />
        </div>

        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-md tracking-widest ${
              trend >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
            }`}
          >
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <p className="text-xs font-bold text-slate-500 dark:text-[#8E8E93] mb-1">
        {title}
      </p>

      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
        {value}
      </h3>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-[#2C2C2E]">
        <p className="text-[10px] text-slate-400 dark:text-[#636366] font-bold">
          {subtext}
        </p>

        {extraInfo && (
          <span className="text-[10px] text-slate-500 dark:text-[#8E8E93] font-mono font-bold">
            {extraInfo}
          </span>
        )}
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} className="p-3 border rounded-xl shadow-lg font-sans text-xs font-bold">
          <p className="mb-1 text-slate-500 dark:text-[#8E8E93]">{label}</p>
          <p className="text-indigo-600 dark:text-indigo-400 text-sm">Eq: {formatValue(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-12 w-full overflow-x-hidden font-sans">

      {/* HEADER E BARRA DE CONSUMO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-[#2C2C2E] pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
            System Status: Online • {activeBR?.name.toUpperCase() || 'SEM PORTFÓLIO'}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Visão Geral
          </h1>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] font-bold uppercase tracking-widest mb-0.5">Patrimônio Líquido</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatValue(currentBankrollBalance)}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] p-3 rounded-xl shadow-sm">
            <Activity className="text-indigo-500" size={20} />
          </div>
        </div>
      </header>

      {/* 🔥 MÓDULO DE ESCASSEZ (FREE USERS) 🔥 */}
      {!isPro && (
          <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center gap-6 justify-between transition-colors shadow-sm ${
              isAtLimit ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' : 
              isNearingLimit ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30' : 
              'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-[#2C2C2E]'
          }`}>
              <div className="flex-1 w-full">
                  <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-sm font-bold flex items-center gap-2 ${isAtLimit ? 'text-red-600 dark:text-red-400' : isNearingLimit ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                          {isAtLimit ? <AlertTriangle size={18}/> : isNearingLimit ? <AlertOctagon size={18}/> : <Activity size={18} className="text-indigo-500"/>}
                          Entradas do Mês (Plano Básico)
                      </h4>
                      <span className={`text-xs font-bold font-mono ${isAtLimit ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-[#8E8E93]'}`}>{monthlyBetsCount} / {MAX_FREE_BETS}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-[#2C2C2E] h-2 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${isAtLimit ? 'bg-red-500' : isNearingLimit ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className={`text-[11px] mt-3 font-medium ${isAtLimit ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-500 dark:text-[#8E8E93]'}`}>
                      {isAtLimit 
                          ? "Você atingiu o limite gratuito deste mês. Faça o upgrade para continuar registrando seu histórico sem interrupções." 
                          : isNearingLimit 
                              ? `Faltam apenas ${MAX_FREE_BETS - monthlyBetsCount} entradas. Faça o Upgrade PRO para não interromper sua catalogação.`
                              : "O plano gratuito permite até 50 registros operacionais por mês."}
                  </p>
              </div>
              <button onClick={() => navigate('/pro')} className="shrink-0 w-full md:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-6 py-3.5 rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap">
                  Desbloquear Ilimitado
              </button>
          </div>
      )}

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
        <KPICard title="Equity" value={formatValue(currentBankrollBalance)} subtext="Ativos Totais" icon={Wallet} color="text-indigo-500" trend={((currentBankrollBalance - (activeBR?.initialBalance || 1)) / (activeBR?.initialBalance || 1)) * 100} />
        <KPICard title="Sharpe Ratio" value={metrics.sharpeRatio.toFixed(2)} subtext="Retorno / Risco" icon={Scale} color="text-blue-500" extraInfo={metrics.sharpeRatio > 2 ? 'Excelente' : 'Moderado'} />
        <KPICard title="Max Drawdown" value={formatValue(metrics.maxDrawdown)} subtext="Queda Máxima" icon={AlertOctagon} color="text-red-500" extraInfo={`Risco ${(metrics.maxDrawdown / (activeBR?.initialBalance || 1) * 100).toFixed(1)}%`} />
        <KPICard title="Win Rate" value={`${metrics.winRate.toFixed(0)}%`} subtext={`N = ${metrics.totalBets}`} icon={Target} color="text-emerald-500" />
        <KPICard title="P&L" value={formatValue(metrics.totalProfit)} subtext="Lucro Líquido" icon={DollarSign} color={metrics.totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'} />
      </div>

      {/* CHART + SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CHART */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Layers size={18} className="text-indigo-500" /> Curva de Performance
            </h3>

            {/* Apple Style Segmented Control */}
            <div className="flex w-full sm:w-auto bg-slate-100 dark:bg-[#000000] p-1 rounded-xl border border-slate-200 dark:border-[#2C2C2E]">
              {['1S','1M','3M','YTD','ALL'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p as any)}
                  className={`flex-1 sm:flex-none text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${
                    period === p ? 'bg-white dark:bg-[#2C2C2E] shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-[#8E8E93] hover:text-slate-700 dark:hover:text-slate-300'
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
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                <CartesianGrid stroke={gridColor} strokeDasharray="4 4" vertical={false} />

                <XAxis dataKey="date" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} dy={10} fontWeight="bold" />

                <YAxis 
                  stroke={axisColor} 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={-10}
                  fontWeight="bold"
                  tickFormatter={(val) => displayMode === 'units' ? `${(val / unitSize).toFixed(0)}u` : val} 
                />

                <Tooltip content={<CustomTooltip />} cursor={{ stroke: gridColor, strokeWidth: 1, strokeDasharray: '4 4' }} />

                <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} fill="url(#colorBal)" dot={false} activeDot={{ r: 6, fill: '#6366f1', stroke: tooltipBg, strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="space-y-6">

          {/* HEATMAP */}
          <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight mb-6 flex items-center gap-2">
              <BarChart4 size={18} className="text-orange-500" /> Consistência
            </h3>

            <div className="grid grid-cols-6 gap-2">
              {heatmapData.map((d, i) => (
                <div
                  key={i}
                  title={`${d.date} - ${d.count} Entradas`}
                  className={`h-8 rounded-md transition-transform hover:scale-105 cursor-pointer border ${
                    d.count === 0 ? 'bg-slate-50 dark:bg-[#2C2C2E] border-transparent' : d.profit > 0 ? 'bg-emerald-500 border-emerald-600 dark:border-emerald-400' : 'bg-red-500 border-red-600 dark:border-red-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ORDER FLOW */}
          <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl h-[340px] flex flex-col shadow-sm">
            <div className="p-5 border-b border-slate-200 dark:border-[#2C2C2E] flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Order Flow Real-Time</h3>
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            </div>

            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
              {bankrollHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50">
                  <Sparkles size={28} className="mb-3 text-slate-400 dark:text-[#636366]" />
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-[#8E8E93]">Aguardando Liquidez</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-[#2C2C2E]">
                  {bankrollHistory.slice().reverse().slice(0, 15).map(bet => (
                    <div key={bet.id} className="group flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-[#2C2C2E]/50 transition-colors">
                      <div className="min-w-0 pr-4">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{bet.event}</p>
                        <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] font-medium mt-1">{bet.market}</p>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end">
                        <p className={`text-sm font-bold font-mono tracking-tight ${bet.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatValue(bet.profit)}
                        </p>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                          <button onClick={() => handleEdit(bet)} className="text-slate-400 hover:text-indigo-500 transition-colors"><Pencil size={12} /></button>
                          <button onClick={() => confirm('Apagar permanentemente?') && removeBet(bet.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;