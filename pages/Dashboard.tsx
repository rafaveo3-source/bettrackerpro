import React, { useState, useMemo } from 'react';
import { useBetStore, Bet } from '../store/useBetStore';
import { Wallet, TrendingUp, Target, Activity, DollarSign, Trash2, Pencil, Sparkles, ArrowUpRight, ArrowDownRight, Layers, BarChart4, AlertOctagon, Scale } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const { currentBankrollBalance, bankrolls, activeBankrollId, getMetrics, history, removeBet } = useBetStore();
  const [period, setPeriod] = useState<'1S' | '1M' | '3M' | 'YTD' | 'ALL'>('ALL');
  
  const metrics = getMetrics();
  const activeBR = bankrolls.find(b => b.id === activeBankrollId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: activeBR?.currency || 'BRL' }).format(value);
  };

  const handleEdit = (bet: Bet) => {
    window.dispatchEvent(new CustomEvent('editBet', { detail: bet }));
  };

  const bankrollHistory = history.filter(b => b.bankrollId === activeBankrollId && b.status !== 'void');
  const sortedHistory = [...bankrollHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const filteredHistory = useMemo(() => {
      if (period === 'ALL') return sortedHistory;
      const now = new Date();
      let limitDate = new Date();
      switch(period) {
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
    return { date: bet.date.split('-').slice(1).reverse().join('/'), balance: runningBalance };
  });

  if (chartData.length === 0) chartData.push({ date: 'Start', balance: activeBR?.initialBalance || 0 });

  const heatmapData = useMemo(() => {
    const days = 30;
    const data = [];
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const dateStr = d.toISOString().split('T')[0];
        const dayBets = bankrollHistory.filter(b => b.date.startsWith(dateStr));
        const dayProfit = dayBets.reduce((acc, b) => acc + b.profit, 0);
        const count = dayBets.length;
        data.push({ date: dateStr, profit: dayProfit, count });
    }
    return data;
  }, [bankrollHistory]);

  const KPICard = ({ title, value, subtext, icon: Icon, color, trend, extraInfo }: any) => (
    <div className="glass-card rounded-[1.2rem] p-5 group hover:border-slate-600 transition-all duration-300 relative overflow-hidden bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900/80 shadow-inner ${color}`}>
                <Icon size={18} />
            </div>
            {trend !== undefined && (
                <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-md ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {Math.abs(trend).toFixed(1)}%
                </div>
            )}
        </div>
        <div className="relative z-10">
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight font-mono">{value}</h3>
            <div className="flex justify-between items-end mt-2">
                <p className="text-slate-600 dark:text-slate-400 text-[9px] font-bold uppercase tracking-wide opacity-80">{subtext}</p>
                {extraInfo && <span className="text-[9px] text-slate-500 font-mono">{extraInfo}</span>}
            </div>
        </div>
    </div>
  );

  const initialBal = activeBR?.initialBalance || 1;
  const growth = ((currentBankrollBalance - initialBal) / initialBal) * 100;

  return (
    <div className="space-y-6 pb-10 w-full max-w-full overflow-x-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-widest mb-1">
             <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
             System: Online • {activeBR?.name.toUpperCase()}
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Dashboard <span className="text-slate-400 dark:text-slate-700 text-lg">///</span>
          </h1>
        </div>
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Net Liquidity</p>
                <p className="text-2xl font-black text-emerald-500 dark:text-emerald-400 font-mono tracking-tight">{formatCurrency(currentBankrollBalance)}</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-help" title="System Health: Optimal">
                <Activity className="text-emerald-500" size={18} />
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Equity" value={formatCurrency(currentBankrollBalance)} subtext="Total Assets" icon={Wallet} color="text-emerald-500 dark:text-emerald-400" trend={growth} />
        <KPICard title="Sharpe Ratio" value={metrics.sharpeRatio.toFixed(2)} subtext="Risk-Adj Return" icon={Scale} color={metrics.sharpeRatio > 1 ? "text-emerald-500 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"} extraInfo={metrics.sharpeRatio > 2 ? 'Excellent' : 'Moderate'} />
        <KPICard title="Max Drawdown" value={formatCurrency(metrics.maxDrawdown)} subtext="Peak to Valley" icon={AlertOctagon} color="text-red-500 dark:text-red-400" extraInfo={`Risk: ${(metrics.maxDrawdown / initialBal * 100).toFixed(1)}%`} />
        <KPICard title="Win Rate" value={`${metrics.winRate.toFixed(0)}%`} subtext={`N = ${metrics.totalBets}`} icon={Target} color="text-purple-500 dark:text-purple-400" />
        <KPICard title="P&L" value={formatCurrency(metrics.totalProfit)} subtext="Net Profit" icon={DollarSign} color={metrics.totalProfit >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto">
        {/* CHART SECTION */}
        <div className="lg:col-span-2 glass-card rounded-[1.5rem] p-4 md:p-6 flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/40 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <Layers size={14} className="text-slate-500" /> Performance Curve
                </h3>
                <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
                    {['1S', '1M', '3M', 'YTD', 'ALL'].map(p => (
                        <button 
                            key={p} 
                            onClick={() => setPeriod(p as any)}
                            className={`flex-1 sm:flex-none text-[9px] font-bold px-3 py-1 rounded transition-colors ${
                                period === p 
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 w-full min-h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} width={40} />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#0f172a', 
                                borderColor: '#334155', 
                                borderRadius: '8px', 
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                color: '#fff'
                            }} 
                            itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace' }}
                            formatter={(value: number) => [formatCurrency(value), 'Equity']}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                        />
                        <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} fill="url(#colorBal)" animationDuration={1000} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="space-y-6 flex flex-col">
            {/* HEATMAP */}
            <div className="glass-card rounded-[1.5rem] p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/40 shadow-sm flex-1 overflow-x-auto">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BarChart4 size={14} className="text-slate-500" /> Market Consistency
                </h3>
                <div className="grid grid-cols-6 gap-2 min-w-[200px]">
                    {heatmapData.map((d, i) => (
                        <div key={i} title={`${d.date}: ${formatCurrency(d.profit)} (${d.count} bets)`} 
                             className={`h-8 rounded-md transition-all hover:scale-110 cursor-pointer ${
                                 d.count === 0 ? 'bg-slate-100 dark:bg-slate-800/50' : 
                                 d.profit > 0 ? 'bg-emerald-500' : 'bg-red-500'
                             }`}
                             style={{ opacity: d.count === 0 ? 1 : Math.min(1, Math.abs(d.profit) / (activeBR?.initialBalance * 0.05 || 100) + 0.3) }}
                        ></div>
                    ))}
                </div>
                <div className="flex justify-between mt-4 text-[9px] text-slate-500 font-mono uppercase">
                    <span>30 Days Ago</span>
                    <span>Today</span>
                </div>
            </div>

            {/* RECENT FEED */}
            <div className="glass-card rounded-[1.5rem] p-0 overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/40 shadow-sm h-[300px]">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Order Flow</h3>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
                    {bankrollHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-3 opacity-50">
                            <Sparkles size={24} />
                            <p className="text-[10px] font-black uppercase tracking-widest">No Activity</p>
                        </div>
                    ) : (
                        bankrollHistory.slice().reverse().slice(0, 15).map(bet => (
                            <div key={bet.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-default">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={`shrink-0 w-1 h-6 rounded-full ${bet.status === 'won' ? 'bg-emerald-500' : bet.status === 'lost' ? 'bg-red-500' : bet.status === 'refunded' ? 'bg-slate-400' : bet.status === 'cashout' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                                    <div className="overflow-hidden min-w-0">
                                        <p className="text-slate-700 dark:text-slate-300 font-bold text-[10px] truncate">{bet.event}</p>
                                        <p className="text-[8px] text-slate-500 uppercase font-mono">{bet.market}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                    <p className={`text-[10px] font-black font-mono ${bet.profit >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                        {bet.profit >= 0 ? '+' : ''}{bet.profit.toFixed(2)}
                                    </p>
                                    <div className="flex gap-2 justify-end mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(bet)} className="text-slate-400 hover:text-emerald-500"><Pencil size={8} /></button>
                                        <button onClick={() => confirm('Apagar?') && removeBet(bet.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={8} /></button>
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