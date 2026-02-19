import React, { useMemo } from 'react';
import { useBetStore } from '../store/useBetStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { BarChart4, PieChart as PieChartIcon, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const Analytics: React.FC = () => {
  const {
    history,
    activeBankrollId,
    displayMode,
    unitSize,
    bankrolls,
    isDarkMode
  } = useBetStore();

  const activeBR = bankrolls.find(b => b.id === activeBankrollId);

  // --- formatação centralizada ---
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

  // --- THEME VARIABLES ---
  const axisColor = isDarkMode ? '#64748b' : '#94a3b8'; 
  const gridColor = isDarkMode ? '#1e293b' : '#e2e8f0';
  const tooltipBg = isDarkMode ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDarkMode ? '#1e293b' : '#e2e8f0';
  const tooltipText = isDarkMode ? '#f8fafc' : '#0f172a';

  // --- DADOS BASE ---
  const bankrollBets = useMemo(() => {
    return history
      .filter(b => b.bankroll_id === activeBankrollId && b.status !== 'void' && b.status !== 'refunded')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [history, activeBankrollId]);

  // --- 1. GRÁFICO EVOLUÇÃO (LINHA DO TEMPO) - BUG DE FUSO HORÁRIO CORRIGIDO ---
  const timelineData = useMemo(() => {
    let runningBalance = activeBR?.initialBalance || 0;
    const data = [{ date: 'Início', balance: runningBalance }];
    
    // Usando Map para preservar a ordem de inserção cronológica exata
    const groupedByDay = new Map<string, number>();
    
    bankrollBets.forEach(bet => {
        if (bet.status === 'pending') return;
        
        // CORREÇÃO DO FUSO HORÁRIO: Pega a string original (YYYY-MM-DD) sem converter para fuso local
        // Assim, dia 18 não vira dia 17 as 21:00.
        const datePart = bet.date.split('T')[0]; 
        const parts = datePart.split('-');
        let dateStr = datePart;
        
        if (parts.length === 3) {
            dateStr = `${parts[2]}/${parts[1]}`; // Formato DD/MM seguro
        }

        const currentProfit = groupedByDay.get(dateStr) || 0;
        groupedByDay.set(dateStr, currentProfit + bet.profit);
    });

    groupedByDay.forEach((profit, dateStr) => {
        runningBalance += profit;
        data.push({ date: dateStr, balance: runningBalance });
    });

    return data;
  }, [bankrollBets, activeBR]);

  // --- 2. LUCRO POR ESPORTE ---
  const sportBarData = useMemo(() => {
    const perf: Record<string, number> = {};
    bankrollBets.forEach(bet => {
      if (bet.status === 'pending') return;
      perf[bet.sport] = (perf[bet.sport] || 0) + bet.profit;
    });
    return Object.keys(perf)
        .map(sport => ({ name: sport, profit: perf[sport] }))
        .sort((a,b) => b.profit - a.profit); 
  }, [bankrollBets]);

  // --- 3. LUCRO POR MÉTODO ---
  const methodBarData = useMemo(() => {
    const perf: Record<string, number> = {};
    bankrollBets.forEach(bet => {
      if (bet.status === 'pending') return;
      const m = bet.method || 'S/ Método';
      perf[m] = (perf[m] || 0) + bet.profit;
    });
    return Object.keys(perf)
        .map(method => ({ name: method, profit: perf[method] }))
        .sort((a,b) => b.profit - a.profit); 
  }, [bankrollBets]);

  // --- 4. DISTRIBUIÇÃO (PIE) ---
  const pieData = useMemo(() => {
    const counts = { won: 0, lost: 0, pending: 0, refunded: 0 };
    history.filter(b => b.bankroll_id === activeBankrollId).forEach(bet => {
      if (['won', 'half-won'].includes(bet.status)) counts.won++;
      else if (['lost', 'half-lost'].includes(bet.status)) counts.lost++;
      else if (['refunded', 'void'].includes(bet.status)) counts.refunded++;
      else if (bet.status === 'pending') counts.pending++;
      else if (bet.status === 'cashout') {
        bet.profit >= 0 ? counts.won++ : counts.lost++;
      }
    });

    return [
      { name: 'Green', value: counts.won, color: '#10b981' },
      { name: 'Red', value: counts.lost, color: '#ef4444' },
      { name: 'Devolvido', value: counts.refunded, color: '#64748b' },
      { name: 'Aberto', value: counts.pending, color: '#f59e0b' }
    ].filter(d => d.value > 0);
  }, [history, activeBankrollId]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
          <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{label}</p>
          <p className={`text-lg font-black ${payload[0].value >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 md:px-8 pt-8 transition-colors duration-300">

      {/* HEADER */}
      <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
            Intelligence Module
          </div>
          <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Data Analytics <span className="text-slate-400 dark:text-slate-700 text-lg">///</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">
            Visão microscópica do seu desempenho financeiro.
          </p>
        </div>
      </div>

      {!activeBR ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Selecione uma banca para ver os gráficos.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* 1. GRÁFICO: EVOLUÇÃO DE BANCA (Largo) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-sm"
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                Evolução do Capital
              </h3>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis 
                        stroke={axisColor} 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => displayMode === 'units' ? `${(val/unitSize).toFixed(0)}u` : `R$${val}`}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorBalance)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* 2. GRÁFICO: ESPORTES */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-sm"
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <BarChart4 size={16} className="text-blue-500" />
                Lucro por Esporte
              </h3>

              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sportBarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} tickFormatter={val => displayMode === 'units' ? `${(val / unitSize).toFixed(0)}u` : val} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="profit" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {sportBarData.map((entry, index) => (
                        <Cell key={index} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* 3. GRÁFICO: MÉTODOS */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-sm"
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Activity size={16} className="text-purple-500" />
                Lucro por Método
              </h3>

              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={methodBarData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} tickFormatter={val => displayMode === 'units' ? `${(val / unitSize).toFixed(0)}u` : val} />
                    <YAxis dataKey="name" type="category" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} width={100} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="profit" radius={[0, 6, 6, 0]} maxBarSize={30}>
                      {methodBarData.map((entry, index) => (
                        <Cell key={index} fill={entry.profit >= 0 ? '#3b82f6' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* 4. GRÁFICO: DISTRIBUIÇÃO PIE (MOBILE FIX APLICADO) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center"
            >
              <div className="md:w-1/3 mb-6 md:mb-0 w-full text-center md:text-left">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                    <PieChartIcon size={16} className="text-orange-500" />
                    Distribuição
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Proporção de resultados (Greens x Reds x Devolvidas) em todo o histórico da banca.</p>
              </div>

              {/* CORREÇÃO DO TAMANHO DA PIZZA E LEGENDA AQUI 👇 */}
              <div className="h-[280px] w-full md:w-2/3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%" 
                      innerRadius={55} 
                      outerRadius={85} 
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                        contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', color: tooltipText, fontSize: '12px', fontWeight: 'bold' }}
                        itemStyle={{ color: tooltipText }}
                    />
                    <Legend 
                        verticalAlign="bottom" 
                        align="center" 
                        layout="horizontal" 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: axisColor, paddingTop: '10px' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

          </div>
      )}
    </div>
  );
}

export default Analytics;