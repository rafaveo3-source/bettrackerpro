import React, { useState, useMemo } from 'react';
import { useBetStore, Bet } from '../store/useBetStore';
import { Search, Filter, Download, ArrowUpDown, ChevronDown, RefreshCcw, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const History: React.FC = () => {
  const { history, removeBet, activeBankrollId, getMetrics, displayMode, unitSize, bankrolls } = useBetStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [minOdd, setMinOdd] = useState('');
  const [minStake, setMinStake] = useState('');
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Bet; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const activeBR = bankrolls.find(b => b.id === activeBankrollId);

  // ✅ Helper de Formatação (Moeda vs Unidade)
  const formatCurrency = (val: number) => {
    if (displayMode === 'units') {
        const units = val / (unitSize || 100);
        return `${units >= 0 ? '+' : ''}${units.toFixed(2)}u`;
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: activeBR?.currency || 'BRL' }).format(val);
  };

  const handleEdit = (bet: Bet) => {
    const event = new CustomEvent('editBet', { detail: bet });
    window.dispatchEvent(event);
  };

  const filteredHistory = useMemo(() => {
    return history
      .filter(b => b.bankrollId === activeBankrollId)
      .filter(bet => {
        const matchesSearch = bet.event.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              bet.selection.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || bet.status === statusFilter;
        const matchesSport = sportFilter === 'all' || bet.sport === sportFilter;

        const betDateStr = bet.date; 
        const matchesDateStart = !dateStart || betDateStr >= dateStart;
        const matchesDateEnd = !dateEnd || betDateStr <= dateEnd;
        const matchesOdd = !minOdd || bet.odds >= parseFloat(minOdd);
        const matchesStake = !minStake || bet.stake >= parseFloat(minStake);

        return matchesSearch && matchesStatus && matchesSport && matchesDateStart && matchesDateEnd && matchesOdd && matchesStake;
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [history, activeBankrollId, searchTerm, statusFilter, sportFilter, dateStart, dateEnd, minOdd, minStake, sortConfig]);

  const handleSort = (key: keyof Bet) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportCSV = () => {
    if (filteredHistory.length === 0) return;

    const headers = ['Data', 'Evento', 'Seleção', 'Esporte', 'Mercado', 'Odd', 'Stake', 'Lucro', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredHistory.map(bet => [
        bet.date,
        `"${bet.event.replace(/"/g, '""')}"`,
        `"${bet.selection.replace(/"/g, '""')}"`,
        bet.sport,
        bet.market,
        bet.odds,
        bet.stake,
        bet.profit,
        bet.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historico_apostas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper para renderizar status
  const StatusBadge = ({ status }: { status: string }) => {
      let styles = '';
      let label = '';
      
      switch(status) {
          case 'won': case 'half-won':
              styles = 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
              label = 'Green';
              break;
          case 'lost': case 'half-lost':
              styles = 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
              label = 'Red';
              break;
          case 'refunded':
              styles = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
              label = 'Reembolso';
              break;
          case 'cashout':
              styles = 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
              label = 'Cashout';
              break;
          default:
              styles = 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20';
              label = 'Pendente';
      }

      return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${styles}`}>
              {label}
          </span>
      );
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Histórico de Operações</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Performance & Auditoria</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${showAdvanced ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500' : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'}`}
            >
                <Filter size={16} /> Filtros
            </button>
            <button onClick={exportCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-4 py-3 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider shadow-lg shadow-slate-900/10">
                <Download size={16} /> CSV
            </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdvanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shadow-sm">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Data Início</label>
                        <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:text-white transition-colors" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Data Fim</label>
                        <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:text-white transition-colors" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Odd Mínima</label>
                        <input type="number" step="0.01" value={minOdd} onChange={e => setMinOdd(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:text-white transition-colors" placeholder="1.50" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Stake Mínima</label>
                        <input type="number" value={minStake} onChange={e => setMinStake(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:text-white transition-colors" placeholder="100" />
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por time, evento ou seleção..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm font-medium"
                />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
                 <div className="relative min-w-[180px]">
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full appearance-none bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer text-sm font-bold"
                    >
                        <option value="all">Todos Status</option>
                        <option value="won">Green (Vencida)</option>
                        <option value="lost">Red (Perdida)</option>
                        <option value="pending">Pendente</option>
                        <option value="half-won">Meio Green</option>
                        <option value="half-lost">Meio Red</option>
                        <option value="refunded">Reembolsada</option>
                        <option value="cashout">Cashout</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>
        </div>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="md:hidden space-y-4">
        {filteredHistory.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800">
                <RefreshCcw className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={32} />
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Nenhuma aposta encontrada.</p>
            </div>
        ) : (
            filteredHistory.map(bet => (
                <div key={bet.id} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${bet.profit > 0 ? 'bg-emerald-500' : bet.profit < 0 ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{bet.sport}</span>
                             </div>
                             <span className="text-[10px] text-slate-500 font-mono">{bet.date.split('-').reverse().join('/')}</span>
                        </div>
                        <StatusBadge status={bet.status} />
                    </div>
                    
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 pr-8">{bet.event}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{bet.market} • <span className="font-mono text-slate-700 dark:text-slate-300">@{bet.odds.toFixed(2)}</span></p>
                    
                    <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Stake</p>
                            <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(bet.stake)}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Resultado</p>
                             <p className={`text-lg font-mono font-black ${bet.profit > 0 ? 'text-emerald-600 dark:text-emerald-400' : bet.profit < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-500'}`}>
                                {bet.profit > 0 ? '+' : ''}{formatCurrency(bet.profit)}
                             </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                         <button onClick={() => handleEdit(bet)} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 uppercase tracking-wide">
                            <Pencil size={12} /> Editar
                         </button>
                         <button onClick={() => confirm('Excluir?') && removeBet(bet.id)} className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 uppercase tracking-wide">
                            <Trash2 size={12} /> Excluir
                         </button>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-[#020617] text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                {[{ label: 'Data', key: 'date' }, { label: 'Evento', key: 'event' }, { label: 'Odd', key: 'odds' }, { label: `Stake`, key: 'stake' }, { label: 'Lucro', key: 'profit' }, { label: 'Status', key: 'status' }].map((header) => (
                  <th 
                    key={header.key}
                    onClick={() => handleSort(header.key as keyof Bet)}
                    className="px-6 py-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1">
                      {header.label}
                      <ArrowUpDown size={12} className={`text-slate-400 ${sortConfig.key === header.key ? 'opacity-100 text-emerald-500' : 'opacity-0 group-hover:opacity-50'}`} />
                    </div>
                  </th>
                ))}
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-500">
                    <p className="font-medium">Nenhuma aposta encontrada.</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((bet) => (
                  <tr key={bet.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-400">{bet.date.split('-').reverse().join('/')}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 dark:text-white font-bold text-sm">{bet.event}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide font-bold mt-0.5">{bet.sport} • {bet.market}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-700 dark:text-slate-300">@{bet.odds.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">{formatCurrency(bet.stake)}</td>
                    <td className={`px-6 py-4 font-mono font-bold ${bet.profit > 0 ? 'text-emerald-600 dark:text-emerald-500' : bet.profit < 0 ? 'text-red-600 dark:text-red-500' : 'text-slate-500'}`}>
                      {bet.profit > 0 ? '+' : ''}{formatCurrency(bet.profit)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={bet.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(bet)} className="text-slate-400 hover:text-emerald-500 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <Pencil size={16} />
                            </button>
                            <button onClick={() => confirm('Excluir esta aposta?') && removeBet(bet.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;