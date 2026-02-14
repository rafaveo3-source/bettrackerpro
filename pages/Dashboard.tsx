import React from 'react';
import { useBetStore, Bet } from '../store/useBetStore';
import { Wallet, TrendingUp, Target, Activity, DollarSign, Trash2, Pencil, Sparkles, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const { currentBankrollBalance, bankrolls, activeBankrollId, getMetrics, history, removeBet } = useBetStore();
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
  
  let runningBalance = activeBR?.initialBalance || 0;
  // Limita o gráfico para não ficar pesado, pegando os últimos 50 registros ou criando pontos
  const chartData = sortedHistory.map(bet => {
    runningBalance += bet.profit;
    return { date: bet.date.split('-').slice(1).reverse().join('/'), balance: runningBalance };
  });

  if (chartData.length === 0) chartData.push({ date: 'Start', balance: activeBR?.initialBalance || 0 });

  const KPICard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
    <div className="glass-card rounded-[1.8rem] p-6 group hover:border-slate-600 transition-all duration-300 relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-xl bg-slate-900/80 shadow-inner ${color}`}>
                <Icon size={20} />
            </div>
            {trend !== undefined && (
                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {Math.abs(trend).toFixed(1)}%
                </div>
            )}
        </div>
        <div className="relative z-10">
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
            <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
            <p className="text-slate-600 text-[10px] font-bold mt-2 uppercase tracking-wide opacity-80">{subtext}</p>
        </div>
        <div className={`absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 ${color} text-current`}>
            <Icon size={120} />
        </div>
    </div>
  );

  const initialBal = activeBR?.initialBalance || 1;
  const growth = ((currentBankrollBalance - initialBal) / initialBal) * 100;

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER TERMINAL STYLE */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-widest mb-1">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></span>
             Live Market Data • {activeBR?.name.toUpperCase()}
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Dashboard <span className="text-slate-700">///</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Saldo Atual</p>
                <p className="text-2xl font-black text-emerald-400 font-mono">{formatCurrency(currentBankrollBalance)}</p>
            </div>
            <div className="h-10 w-[1px] bg-slate-800 hidden md:block"></div>
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl">
                <Activity className="text-slate-500" size={20} />
            </div>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Equity Total" value={formatCurrency(currentBankrollBalance)} subtext="Capital Disponível" icon={Wallet} color="text-emerald-400" trend={growth} />
        <KPICard title="Yield (ROI)" value={`${metrics.roi.toFixed(2)}%`} subtext="Retorno sobre Investido" icon={TrendingUp} color="text-blue-400" />
        <KPICard title="Win Rate" value={`${metrics.winRate.toFixed(0)}%`} subtext={`De ${metrics.totalBets} entradas`} icon={Target} color="text-purple-400" />
        <KPICard title="P&L Líquido" value={formatCurrency(metrics.totalProfit)} subtext="Resultado Financeiro" icon={DollarSign} color={metrics.totalProfit >= 0 ? "text-emerald-400" : "text-red-400"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[500px]">
        {/* CHART SECTION */}
        <div className="lg:col-span-2 glass-card rounded-[2rem] p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Layers size={14} className="text-slate-500" /> Curva de Equidade
                </h3>
                <div className="flex gap-2">
                    {['1S', '1M', '3M', 'YTD'].map(p => (
                        <button key={p} className="text-[9px] font-bold bg-slate-900 border border-slate-800 text-slate-400 px-2 py-1 rounded hover:text-white hover:border-slate-600 transition-colors">{p}</button>
                    ))}
                </div>
            </div>
            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                        <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                        <Tooltip 
                            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                        />
                        <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={3} fill="url(#colorBal)" animationDuration={1500} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* FEED SECTION */}
        <div className="glass-card rounded-[2rem] p-0 overflow-hidden flex flex-col border-none bg-gradient-to-b from-slate-900 to-[#020617]">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Últimas Operações</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                {bankrollHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-4 opacity-50">
                        <Sparkles size={32} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Sem dados</p>
                    </div>
                ) : (
                    bankrollHistory.slice().reverse().slice(0, 10).map(bet => (
                        <div key={bet.id} className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/30 border border-slate-800/50 hover:bg-slate-800 transition-all hover:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className={`w-1 h-8 rounded-full ${bet.status === 'won' ? 'bg-emerald-500' : bet.status === 'lost' ? 'bg-red-500' : 'bg-slate-600'}`}></div>
                                <div>
                                    <p className="text-white font-bold text-xs truncate max-w-[120px]">{bet.event}</p>
                                    <p className="text-[9px] text-slate-500 uppercase font-mono mt-0.5">{bet.market} • {bet.date.split('-').slice(1).reverse().join('/')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-xs font-black font-mono ${bet.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {bet.profit >= 0 ? '+' : ''}{bet.profit.toFixed(2)}
                                </p>
                                <div className="flex gap-2 justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(bet)} className="text-slate-500 hover:text-white"><Pencil size={10} /></button>
                                    <button onClick={() => confirm('Apagar?') && removeBet(bet.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={10} /></button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <button className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-all">Ver Histórico Completo</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;