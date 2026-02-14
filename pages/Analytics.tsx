import React from 'react';
import { useBetStore } from '../store/useBetStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const Analytics: React.FC = () => {
  const { history, activeBankrollId } = useBetStore();

  const bankrollBets = history.filter(b => b.bankrollId === activeBankrollId && b.status !== 'void' && b.status !== 'refunded');

  // Process Data: Profit by Sport
  const sportPerformance: Record<string, number> = {};
  bankrollBets.forEach(bet => {
    if (bet.status === 'pending') return;
    if (!sportPerformance[bet.sport]) sportPerformance[bet.sport] = 0;
    sportPerformance[bet.sport] += bet.profit;
  });

  const barData = Object.keys(sportPerformance).map(sport => ({
    name: sport,
    profit: sportPerformance[sport]
  }));

  // Process Data: Profit by Method
  const methodPerformance: Record<string, number> = {};
  bankrollBets.forEach(bet => {
    if (bet.status === 'pending') return;
    const method = bet.method || 'Sem Método';
    if (!methodPerformance[method]) methodPerformance[method] = 0;
    methodPerformance[method] += bet.profit;
  });

  const methodBarData = Object.keys(methodPerformance).map(method => ({
    name: method,
    profit: methodPerformance[method]
  }));

  // Process Data: Status Distribution
  const statusCount = { won: 0, lost: 0, pending: 0, refunded: 0 };
  const allBets = history.filter(b => b.bankrollId === activeBankrollId);
  
  allBets.forEach(bet => {
    if (['won', 'half-won'].includes(bet.status)) statusCount.won++;
    else if (['lost', 'half-lost'].includes(bet.status)) statusCount.lost++;
    else if (bet.status === 'refunded' || bet.status === 'void') statusCount.refunded++;
    else statusCount.pending++;
  });
  
  const pieData = [
    { name: 'Green', value: statusCount.won, color: '#10b981' },
    { name: 'Red', value: statusCount.lost, color: '#ef4444' },
    { name: 'Reembolso', value: statusCount.refunded, color: '#64748b' },
    { name: 'Pendente', value: statusCount.pending, color: '#eab308' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Análise de Dados</h1>
        <p className="text-slate-500 dark:text-slate-400">Análise detalhada da sua performance nesta banca.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit by Sport */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Lucro por Esporte</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                        {/* ✅ Tooltip Corrigido */}
                        <Tooltip 
                            cursor={{fill: '#94a3b8', opacity: 0.1}}
                            contentStyle={{ 
                                backgroundColor: '#0f172a', 
                                borderColor: '#334155', 
                                borderRadius: '8px', 
                                color: '#fff' 
                            }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#94a3b8' }}
                        />
                        <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                            {barData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Profit by Method */}
         <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Lucro por Método</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={methodBarData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} horizontal={false} />
                        <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={100} />
                        {/* ✅ Tooltip Corrigido */}
                        <Tooltip 
                            cursor={{fill: '#94a3b8', opacity: 0.1}}
                            contentStyle={{ 
                                backgroundColor: '#0f172a', 
                                borderColor: '#334155', 
                                borderRadius: '8px', 
                                color: '#fff' 
                            }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#94a3b8' }}
                        />
                        <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                            {methodBarData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Win/Loss Distribution */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Distribuição de Resultados</h3>
            <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        {/* ✅ Tooltip Corrigido */}
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#0f172a', 
                                borderColor: '#334155', 
                                borderRadius: '8px', 
                                color: '#fff' 
                            }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;