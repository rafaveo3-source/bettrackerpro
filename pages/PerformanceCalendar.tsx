import React, { useState } from 'react';
import { useBetStore } from '../store/useBetStore';
import { ChevronLeft, ChevronRight, TrendingUp, Target, Trophy, Activity, Volleyball, CircleDollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const PerformanceCalendar: React.FC = () => {
  const { history, currency } = useBetStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Metrics Helpers
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(val);

  // Month Navigation
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

  // Get bets for current month
  const currentMonthBets = history.filter(bet => {
    const d = new Date(bet.date);
    return d.getMonth() === month && d.getFullYear() === year && bet.status !== 'pending' && bet.status !== 'void';
  });

  // Calculate Daily Stats
  const dailyStats: Record<number, { profit: number, wins: number, count: number }> = {};
  
  currentMonthBets.forEach(bet => {
    const day = new Date(bet.date).getDate() + 1; // Correction for timezone often needed, but keeping simple for now assuming local input
    // Actually, bet.date is YYYY-MM-DD. Let's parse strictly.
    const [bYear, bMonth, bDay] = bet.date.split('-').map(Number);
    
    if (bMonth - 1 === month && bYear === year) {
         if (!dailyStats[bDay]) dailyStats[bDay] = { profit: 0, wins: 0, count: 0 };
         dailyStats[bDay].profit += bet.profit;
         dailyStats[bDay].count += 1;
         if (['won', 'half-won'].includes(bet.status)) dailyStats[bDay].wins += 1;
    }
  });

  // KPI Calculations for Header
  const totalProfit = currentMonthBets.reduce((acc, b) => acc + b.profit, 0);
  const totalStaked = currentMonthBets.reduce((acc, b) => acc + b.stake, 0);
  const totalWins = currentMonthBets.filter(b => ['won', 'half-won'].includes(b.status)).length;
  const totalBets = currentMonthBets.length;
  
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
  const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;
  const biggestWin = Math.max(0, ...currentMonthBets.map(b => b.profit));

  // Selected Date Details
  const selectedDateBets = selectedDate 
    ? history.filter(bet => bet.date === selectedDate.toISOString().split('T')[0])
    : [];

  const dayProfit = selectedDateBets.reduce((acc, b) => acc + b.profit, 0);

  return (
    <div className="space-y-6">
      {/* Header with Navigation and KPIs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendário de Desempenho</h1>
            <p className="text-slate-500 dark:text-slate-400">Acompanhe seu ROI diário e histórico de operações.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-[#0f172a] p-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-bold text-slate-900 dark:text-white min-w-[150px] text-center capitalize">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                <ChevronRight size={20} />
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] rounded-xl p-4 border border-slate-800 text-white relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-xs text-slate-400 font-bold uppercase">ROI Mensal</p>
                <h3 className={`text-2xl font-bold mt-1 ${roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                </h3>
             </div>
             <Activity className="absolute right-4 top-4 text-slate-800 opacity-50" size={60} />
        </div>
        <div className="bg-[#0f172a] rounded-xl p-4 border border-slate-800 text-white relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-xs text-slate-400 font-bold uppercase">Lucro Total</p>
                <h3 className="text-2xl font-bold mt-1 text-white">
                    {formatCurrency(totalProfit)}
                </h3>
             </div>
             <CircleDollarSign className="absolute right-4 top-4 text-slate-800 opacity-50" size={60} />
        </div>
        <div className="bg-[#0f172a] rounded-xl p-4 border border-slate-800 text-white relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-xs text-slate-400 font-bold uppercase">Taxa de Win</p>
                <h3 className="text-2xl font-bold mt-1 text-white">
                    {winRate.toFixed(0)}%
                </h3>
             </div>
             <Target className="absolute right-4 top-4 text-slate-800 opacity-50" size={60} />
        </div>
        <div className="bg-[#0f172a] rounded-xl p-4 border border-slate-800 text-white relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-xs text-slate-400 font-bold uppercase">Maior Green</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-500">
                    {formatCurrency(biggestWin)}
                </h3>
             </div>
             <Trophy className="absolute right-4 top-4 text-slate-800 opacity-50" size={60} />
        </div>
      </div>

      {/* Main Grid & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d} className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const stats = dailyStats[day];
                    const hasData = !!stats;
                    const isPositive = hasData && stats.profit >= 0;
                    const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month;

                    return (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            key={day}
                            onClick={() => setSelectedDate(new Date(year, month, day))}
                            className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all ${
                                isSelected 
                                    ? 'ring-2 ring-emerald-500 border-transparent' 
                                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                            } ${
                                hasData 
                                    ? isPositive ? 'bg-emerald-500/10 dark:bg-emerald-900/20' : 'bg-red-500/10 dark:bg-red-900/20' 
                                    : 'bg-slate-50 dark:bg-slate-900'
                            }`}
                        >
                            <span className={`text-sm font-bold ${hasData ? (isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400') : 'text-slate-400'}`}>
                                {day}
                            </span>
                            {hasData && (
                                <span className={`text-[10px] font-bold mt-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {isPositive ? '+' : ''}{stats.profit.toFixed(0)}
                                </span>
                            )}
                            {hasData && (
                                <div className="flex gap-0.5 mt-1">
                                    <div className={`w-1 h-1 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                    <div className={`w-1 h-1 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-red-500'} opacity-50`}></div>
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>

        {/* Sidebar Details */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-lg text-white">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                <div>
                    <h3 className="font-bold text-lg">Detalhes do Dia</h3>
                    <p className="text-slate-400 text-sm">
                        {selectedDate 
                            ? selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) 
                            : 'Selecione uma data'}
                    </p>
                </div>
                {selectedDate && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${dayProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {dayProfit > 0 ? '+' : ''}{formatCurrency(dayProfit)}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {selectedDateBets.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        <p>Nenhuma atividade neste dia.</p>
                    </div>
                ) : (
                    selectedDateBets.map(bet => (
                        <div key={bet.id} className="bg-slate-900 rounded-lg p-3 border border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                    <Volleyball size={14} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-slate-200">{bet.event}</p>
                                    <p className="text-xs text-slate-500">{bet.market} • Odd {bet.odds}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold text-sm ${bet.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {bet.profit > 0 ? '+' : ''} {formatCurrency(bet.profit)}
                                </p>
                                <p className="text-xs text-slate-500">Stake {bet.stake}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedDateBets.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Desempenho no Dia</span>
                        <span className={`font-bold ${dayProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {dayProfit >= 0 ? 'Positivo' : 'Negativo'}
                        </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                            className={`h-full ${dayProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                            style={{ width: '100%' }} // Simple visualization, could be improved with win rate bar
                        ></div>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default PerformanceCalendar;