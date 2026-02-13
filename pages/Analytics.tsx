import React from 'react';
import { useBetStore } from '../store/useBetStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const Analytics: React.FC = () => {
  const { history, activeBankrollId } = useBetStore();

  const bankrollBets = history.filter(b => b.bankrollId === activeBankrollId);

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
  const statusCount = { won: 0, lost: 0, pending: 0 };
  bankrollBets.forEach(bet => {
    if (['won', 'half-won'].includes(bet.status)) statusCount.won++;
    else if (['lost', 'half-lost'].includes(bet.status)) statusCount.lost++;
    else statusCount.pending++;
  });
  
  const pieData = [
    { name: 'Green', value: statusCount.won, color: '#10b748' },
    { name: 'Red', value: statusCount.lost, color: '#ef4444' },
    { name: 'Pendente', value: statusCount.pending, color: '#eab308' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                        <Tooltip 
                            cursor={{fill: '#1e293b', opacity: 0.4}}
                            contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                        />
                        <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                            {barData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b748' : '#ef4444'} />
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={100} />
                        <Tooltip 
                            cursor={{fill: '#1e293b', opacity: 0.4}}
                            contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                        />
                        <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                            {methodBarData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b748' : '#ef4444'} />
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
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
                {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-sm text-slate-500 dark:text-slate-300">{entry.name} ({entry.value})</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;