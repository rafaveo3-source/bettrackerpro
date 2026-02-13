
import React from 'react';
import { useBetStore, Bet } from '../store/useBetStore';
import { Wallet, TrendingUp, Target, Activity, DollarSign, Trash2, Pencil, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const { currentBankrollBalance, bankrolls, activeBankrollId, getMetrics, history, isDarkMode, removeBet } = useBetStore();
  const metrics = getMetrics();
  const activeBR = bankrolls.find(b => b.id === activeBankrollId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: activeBR?.currency || 'BRL' }).format(value);
  };

  const handleEdit = (bet: Bet) => {
    window.dispatchEvent(new CustomEvent('editBet', { detail: bet }));
  };

  const bankrollHistory = history.filter(b => b.bankrollId === activeBankrollId);
  const sortedHistory = [...bankrollHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let runningBalance = activeBR?.initialBalance || 0;
  const chartData = sortedHistory.map(bet => {
    runningBalance += bet.profit;
    return { date: bet.date, balance: runningBalance };
  });

  if (chartData.length === 0) chartData.push({ date: 'Início', balance: activeBR?.initialBalance || 0 });

  const KPICard = ({ title, value, subtext, icon: Icon, colorClass, trend }: any) => (
    <div className="glass-card rounded-[2.5rem] p-8 group hover:border-emerald-500/50 transition-all duration-500 relative overflow-hidden">
        <div className={`absolute -right-4 -bottom-4 opacity-[0.05] dark:opacity-[0.03] group-hover:opacity-[0.1] transition-opacity ${colorClass}`}>
            <Icon size={140} />
        </div>
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
                <div className={`p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 shadow-inner ${colorClass}`}>
                    <Icon size={24} />
                </div>
                {trend !== undefined && (
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-red-500/10 text-red-600 dark:text-red-500'}`}>
                        {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                    </span>
                )}
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tighter italic">{value}</h3>
            <p className="text-slate-400 dark:text-slate-600 text-[10px] font-bold mt-3 uppercase tracking-wider">{subtext}</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             Live Data Matrix
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Banca: {activeBR?.name}</h1>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl px-6 py-3 shadow-xl">
            <DollarSign className="text-emerald-500" size={18} />
            <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Capital Protegido</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Equity Total" value={formatCurrency(currentBankrollBalance)} subtext="Liquidez operacional" icon={Wallet} colorClass="text-emerald-500" trend={activeBR?.initialBalance ? ((currentBankrollBalance - activeBR.initialBalance) / activeBR.initialBalance) * 100 : 0} />
        <KPICard title="ROI Estratégico" value={`${metrics.roi.toFixed(1)}%`} subtext="Yield sobre volume" icon={TrendingUp} colorClass="text-blue-500" />
        <KPICard title="Hit Rate" value={`${metrics.winRate.toFixed(0)}%`} subtext="Acuracidade técnica" icon={Target} colorClass="text-purple-500" />
        <KPICard title="P&L Bruto" value={formatCurrency(metrics.totalProfit)} subtext="Resultado de mercado" icon={Activity} colorClass="text-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card rounded-[3rem] p-10">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-10 border-l-4 border-emerald-500 pl-4">Curva de Equidade</h3>
            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: isDarkMode ? '#0f172a' : '#fff', border: isDarkMode ? '1px solid #1e293b' : '1px solid #e2e8f0', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={5} fill="url(#colorBal)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="glass-card rounded-[3rem] p-8 overflow-hidden flex flex-col">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 text-center italic">Terminal de Entradas</h3>
            <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {bankrollHistory.slice(0, 8).map(bet => (
                    <div key={bet.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-3xl p-5 flex justify-between items-center group hover:bg-white dark:hover:bg-slate-900 transition-all hover:shadow-lg">
                        <div>
                            <p className="text-slate-900 dark:text-white font-black text-sm truncate max-w-[140px] italic">{bet.event}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-tighter">{bet.market}</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm font-black italic ${bet.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {bet.profit >= 0 ? '+' : ''}{bet.profit.toFixed(2)}
                            </p>
                            <div className="flex gap-3 justify-end mt-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => handleEdit(bet)} className="text-slate-400 hover:text-emerald-500"><Pencil size={14} /></button>
                                <button onClick={() => confirm('Apagar registro?') && removeBet(bet.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ))}
                {bankrollHistory.length === 0 && <div className="flex flex-col items-center justify-center py-20 text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest italic text-[10px] gap-4">
                    <Sparkles size={40} className="opacity-20" />
                    Aguardando Dados...
                </div>}
            </div>
            <button className="mt-8 w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-emerald-500 transition-colors">Relatório Completo</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
