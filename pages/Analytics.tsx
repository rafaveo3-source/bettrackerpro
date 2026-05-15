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
  const axisColor = isDarkMode ? '#636366' : '#94a3b8'; 
  const gridColor = isDarkMode ? '#2C2C2E' : '#e2e8f0';
  const tooltipBg = isDarkMode ? '#1C1C1E' : '#ffffff';
  const tooltipBorder = isDarkMode ? '#3A3A3C' : '#e2e8f0';
  const tooltipText = isDarkMode ? '#ffffff' : '#0f172a';

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

  // --- 2. LUCRO POR ESPORTE (CORRIGIDO: NORMALIZAÇÃO DE NOMES) ---
  const sportBarData = useMemo(() => {
    const perf: Record<string, number> = {};

    // Dicionário de tradução e padronização (Tudo minúsculo aqui para facilitar o Match)
    const normalizeSportName = (rawSport: string) => {
        if (!rawSport) return 'Outros';
        
        const s = rawSport.toLowerCase().trim();
        
        if (s.includes('football') || s.includes('futebol') || s.includes('soccer')) return 'Futebol';
        if (s.includes('basket') || s.includes('nba')) return 'Basquete';
        if (s.includes('tenis') || s.includes('tennis')) return 'Tênis';
        if (s.includes('volei') || s.includes('volleyball')) return 'Vôlei';
        if (s.includes('esport') || s.includes('e-sport')) return 'eSports';
        if (s.includes('mma') || s.includes('ufc') || s.includes('fight')) return 'MMA';
        if (s.includes('race') || s.includes('corrida')) return 'Corridas';

        // Se não cair nas regras acima, capitaliza a primeira letra da string original
        return rawSport.charAt(0).toUpperCase() + rawSport.slice(1).toLowerCase();
    };

    bankrollBets.forEach(bet => {
      if (bet.status === 'pending') return;
      
      const normalizedSport = normalizeSportName(bet.sport);
      perf[normalizedSport] = (perf[normalizedSport] || 0) + bet.profit;
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
      { name: 'Devolvido', value: counts.refunded, color: '#636366' },
      { name: 'Aberto', value: counts.pending, color: '#f59e0b' }
    ].filter(d => Number(d.value) > 0);
  }, [history, activeBankrollId]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} className="p-3 border rounded-xl shadow-lg">
          <p className="text-xs font-bold text-slate-500 dark:text-[#8E8E93] mb-1 uppercase tracking-wider">{label}</p>
          <p className={`text-sm font-bold font-mono ${payload[0].value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const cardClass = "bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm transition-all";
  const sectionTitleClass = "text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-6 flex items-center gap-2";

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 md:px-8 pt-8 font-sans transition-colors duration-300">

      {/* HEADER */}
      <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
            Intelligence Module
          </div>
          <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Data Analytics
          </h1>
          <p className="text-slate-500 dark:text-[#8E8E93] text-sm mt-2 font-medium">
            Visão microscópica do seu desempenho financeiro.
          </p>
        </div>
      </div>

      {!activeBR ? (
          <div className={`${cardClass} text-center py-16`}>
              <p className="text-slate-500 dark:text-[#8E8E93] font-bold uppercase tracking-widest text-sm">Selecione um portfólio para visualizar os dados.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* 1. GRÁFICO: EVOLUÇÃO DE BANCA (Largo) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`${cardClass} lg:col-span-2`}
            >
              <h3 className={sectionTitleClass}>
                <TrendingUp size={18} className="text-emerald-500" />
                Evolução do Capital
              </h3>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridColor} strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="date" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} dy={10} fontWeight="bold" />
                    <YAxis 
                        stroke={axisColor} 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        fontWeight="bold"
                        tickFormatter={(val) => displayMode === 'units' ? `${(val/unitSize).toFixed(0)}u` : `R$${val}`}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: gridColor, strokeWidth: 1, strokeDasharray: '4 4' }} />
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
                className={cardClass}
            >
              <h3 className={sectionTitleClass}>
                <BarChart4 size={18} className="text-indigo-500" />
                Lucro por Esporte
              </h3>

              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sportBarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke={gridColor} strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="name" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} dy={10} fontWeight="bold" />
                    <YAxis stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" tickFormatter={val => displayMode === 'units' ? `${(val / unitSize).toFixed(0)}u` : val} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? '#2C2C2E' : '#f1f5f9' }} />
                    <Bar dataKey="profit" radius={[4, 4, 0, 0]} maxBarSize={40}>
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
                className={cardClass}
            >
              <h3 className={sectionTitleClass}>
                <Activity size={18} className="text-blue-500" />
                Lucro por Método
              </h3>

              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={methodBarData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={gridColor} strokeDasharray="4 4" horizontal={false} />
                    <XAxis type="number" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" tickFormatter={val => displayMode === 'units' ? `${(val / unitSize).toFixed(0)}u` : val} />
                    <YAxis dataKey="name" type="category" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} width={100} fontWeight="bold" />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? '#2C2C2E' : '#f1f5f9' }} />
                    <Bar dataKey="profit" radius={[0, 4, 4, 0]} maxBarSize={30}>
                      {methodBarData.map((entry, index) => (
                        <Cell key={index} fill={entry.profit >= 0 ? '#3b82f6' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* 4. GRÁFICO: DISTRIBUIÇÃO PIE */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className={`${cardClass} lg:col-span-2 flex flex-col md:flex-row items-center`}
            >
              <div className="md:w-1/3 mb-6 md:mb-0 w-full text-center md:text-left">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                    <PieChartIcon size={18} className="text-amber-500" />
                    Distribuição
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-[#8E8E93] font-medium leading-relaxed">Proporção de resultados operacionais (Lucros x Prejuízos x Estornos) no portfólio.</p>
              </div>

              <div className="h-[280px] w-full md:w-2/3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%" 
                      innerRadius={60} 
                      outerRadius={90} 
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