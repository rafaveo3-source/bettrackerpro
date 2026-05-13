import React, { useState, useEffect } from 'react';
import { useBetStore } from '../store/useBetStore';
// 🔥 FIX: ChevronDown importado corretamente aqui embaixo 👇
import { ChevronLeft, ChevronRight, Activity, CircleDollarSign, Target, Trophy, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const PerformanceCalendar: React.FC = () => {
  const { history, currency, bankrolls, methods, displayMode, unitSize, activeBankrollId } = useBetStore(); 
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  const [selectedBankroll, setSelectedBankroll] = useState(activeBankrollId || 'all');
  const [selectedMethod, setSelectedMethod] = useState('all');

  useEffect(() => {
    if (activeBankrollId) {
      setSelectedBankroll(activeBankrollId);
    }
  }, [activeBankrollId]);

  const formatValue = (val: number) => {
    if (displayMode === 'units') {
      const units = val / (unitSize || 100);
      return `${units >= 0 ? '+' : ''}${units.toFixed(2)}u`;
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(val);
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 

  const filteredHistory = history.filter(bet => {
    const matchBankroll = selectedBankroll === 'all' || bet.bankrollId === selectedBankroll || bet.bankroll_id === selectedBankroll;
    const matchMethod = selectedMethod === 'all' || bet.method === selectedMethod;
    return matchBankroll && matchMethod && bet.status !== 'pending' && bet.status !== 'void' && bet.status !== 'refunded';
  });

  const currentMonthBets = filteredHistory.filter(bet => {
    const d = new Date(bet.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const dailyStats: Record<number, { profit: number, wins: number, count: number }> = {};
  
  currentMonthBets.forEach(bet => {
    const [bYear, bMonth, bDay] = bet.date.split('-').map(Number);
    if (bMonth - 1 === month && bYear === year) {
        if (!dailyStats[bDay]) dailyStats[bDay] = { profit: 0, wins: 0, count: 0 };
        dailyStats[bDay].profit += bet.profit;
        dailyStats[bDay].count += 1;
        if (['won', 'half-won'].includes(bet.status)) dailyStats[bDay].wins += 1;
    }
  });

  const totalProfit = currentMonthBets.reduce((acc, b) => acc + b.profit, 0);
  const totalStaked = currentMonthBets.reduce((acc, b) => acc + b.stake, 0);
  const totalWins = currentMonthBets.filter(b => ['won', 'half-won'].includes(b.status)).length;
  const totalBets = currentMonthBets.length;
  
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
  const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;
  const activeDays = Object.keys(dailyStats).length;
  const avgPerActiveDay = activeDays > 0 ? totalProfit / activeDays : 0;

  const selectedDateBets = selectedDate
    ? filteredHistory.filter(bet => {
        const [y, m, d] = bet.date.split('-').map(Number);
        return (
            selectedDate.getFullYear() === y &&
            selectedDate.getMonth() === m - 1 &&
            selectedDate.getDate() === d
        );
    })
    : [];

  const dayProfit = selectedDateBets.reduce((acc, b) => acc + b.profit, 0);

  const cardClass = "bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm";

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto w-full overflow-x-hidden font-sans">
      
      {/* Header Unificado */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-[#2C2C2E] pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
            Temporal Performance Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Calendário de Performance
          </h1>
          <p className="text-slate-500 dark:text-[#8E8E93] text-sm mt-2 font-medium">
            Análise temporal de ROI, consistência e ciclos de resultado.
          </p>
        </div>

        {/* Navegação de mês */}
        <div className="flex items-center gap-4 bg-white dark:bg-[#1C1C1E] p-2 rounded-xl border border-slate-200 dark:border-[#2C2C2E] shadow-sm w-full md:w-auto justify-between">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] rounded-lg text-slate-500 dark:text-[#8E8E93] transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[140px] text-center capitalize tracking-widest uppercase">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] rounded-lg text-slate-500 dark:text-[#8E8E93] transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className={`${cardClass} flex flex-col md:flex-row gap-6`}>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase mb-2 block tracking-widest">Filtrar Portfólio</label>
          <div className="relative">
              <select value={selectedBankroll} onChange={e => setSelectedBankroll(e.target.value)} className="w-full bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 dark:text-white cursor-pointer transition-colors appearance-none">
                <option value="all">Todos os Portfólios</option>
                {bankrolls.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase mb-2 block tracking-widest">Filtrar por Método</label>
          <div className="relative">
              <select value={selectedMethod} onChange={e => setSelectedMethod(e.target.value)} className="w-full bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 dark:text-white cursor-pointer transition-colors appearance-none">
                <option value="all">Todos os Métodos</option>
                {methods.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className={`${cardClass} flex flex-col justify-center relative`}>
          <p className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-1.5">Lucro Total</p>
          <h3 className={`text-2xl font-bold tracking-tight ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {totalProfit > 0 ? '+' : ''}{formatValue(totalProfit)}
          </h3>
          <CircleDollarSign className="absolute right-6 top-6 text-slate-200 dark:text-[#2C2C2E] opacity-50" size={32} />
        </div>
        <div className={`${cardClass} flex flex-col justify-center relative`}>
          <p className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-1.5">ROI Mensal</p>
          <h3 className={`text-2xl font-bold tracking-tight ${roi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
          </h3>
          <Activity className="absolute right-6 top-6 text-slate-200 dark:text-[#2C2C2E] opacity-50" size={32} />
        </div>
        <div className={`${cardClass} flex flex-col justify-center relative`}>
          <p className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-1.5">Taxa de Acerto</p>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {winRate.toFixed(0)}%
          </h3>
          <Target className="absolute right-6 top-6 text-slate-200 dark:text-[#2C2C2E] opacity-50" size={32} />
        </div>
        <div className={`${cardClass} flex flex-col justify-center relative`}>
          <p className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-1.5">Média / Dia Ativo</p>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatValue(avgPerActiveDay)}
          </h3>
          <Trophy className="absolute right-6 top-6 text-slate-200 dark:text-[#2C2C2E] opacity-50" size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] p-6 md:p-8 rounded-2xl shadow-sm">
          <div className="grid grid-cols-7 gap-2 mb-4 text-center">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-[10px] font-bold text-slate-400 dark:text-[#636366] uppercase tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const stats = dailyStats[day];
              const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
              const isDayToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              const hasData = !!stats;
              const isPositive = hasData && stats.profit >= 0;

              return (
                <motion.button
                  key={day}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(new Date(year, month, day))}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all
                    ${isSelected ? 'ring-2 ring-indigo-500/50 border-indigo-500 z-10 shadow-sm' : ''}
                    ${!isSelected && !isDayToday ? 'border-slate-100 dark:border-[#2C2C2E] hover:border-slate-300 dark:hover:border-[#3A3A3C]' : ''}
                    ${isDayToday && !isSelected ? 'border-indigo-400 dark:border-indigo-500' : ''}
                    ${hasData ? (isPositive ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-red-500 border-red-600 text-white') : 'bg-white dark:bg-[#000000]'}
                  `}
                >
                  <span className={`text-sm font-bold ${hasData ? 'text-white' : 'text-slate-400 dark:text-[#636366]'}`}>
                    {day}
                  </span>
                  {hasData && (
                    <span className={`text-[8px] font-bold mt-1 tracking-wider ${hasData ? 'text-white/90' : ''}`}>
                      {stats.profit > 0 ? '+' : ''}{formatValue(stats.profit)}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Details */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col h-[600px]">
          <div className="mb-6 border-b border-slate-100 dark:border-[#2C2C2E] pb-6 flex items-center justify-between">
            <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Relatório Diário</h3>
                <p className="text-slate-500 dark:text-[#8E8E93] text-[10px] font-bold uppercase tracking-widest mt-1">
                {selectedDate ? selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Selecione uma data'}
                </p>
            </div>
            <CalendarIcon size={24} className="text-indigo-500 opacity-50" />
          </div>

          <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {selectedDateBets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#636366] opacity-80">
                <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma operação consolidada</p>
              </div>
            ) : (
              selectedDateBets.map(bet => (
                <div key={bet.id} className="bg-slate-50 dark:bg-[#000000] rounded-xl p-4 border border-slate-200 dark:border-[#2C2C2E] flex justify-between items-center transition-colors">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{bet.event}</p>
                    <p className="text-[9px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mt-1">{bet.market} • <span className="font-mono text-slate-700 dark:text-slate-300">@{bet.odds}</span></p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold font-mono text-sm tracking-tight ${bet.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {bet.profit > 0 ? '+' : ''} {formatValue(bet.profit)}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-[#636366] uppercase tracking-widest mt-1">Expo {formatValue(bet.stake)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedDateBets.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#2C2C2E] flex justify-between items-center">
              <span className="text-slate-500 dark:text-[#8E8E93] font-bold uppercase tracking-widest text-[10px]">Desempenho no Dia</span>
              <span className={`font-bold tracking-tight text-lg ${dayProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {dayProfit > 0 ? '+' : ''} {formatValue(dayProfit)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceCalendar;