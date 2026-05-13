import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBetStore, Bet } from '../store/useBetStore';
import { Search, Filter, Download, ArrowUpDown, ChevronDown, RefreshCcw, Trash2, Pencil, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const History: React.FC = () => {
  const { history, removeBet, activeBankrollId, getMetrics, displayMode, unitSize, bankrolls, isPro } = useBetStore();
  const navigate = useNavigate();
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
        // LÓGICA PADRÃO BET365: "Pending" sempre no topo.
        const isAPending = a.status === 'pending';
        const isBPending = b.status === 'pending';

        if (isAPending && !isBPending) return -1; // A vai pro topo
        if (!isAPending && isBPending) return 1;  // B vai pro topo

        // Se ambos forem pending, ou ambos forem resolvidos, aplica a ordenação da coluna
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
    // 🔥 O SEQUESTRO DE RETENÇÃO (CADEADO PRO) 🔥
    if (!isPro) {
        if(window.confirm('A exportação profissional de dados para Excel é um recurso exclusivo do Plano PRO. Deseja fazer o upgrade agora?')) {
            navigate('/pro');
        }
        return;
    }

    if (filteredHistory.length === 0) return;

    const headers = ['Data', 'Ativo/Evento', 'Posição/Seleção', 'Mercado Base', 'Setup/Mercado', 'Odd(Cotação)', 'Montante(Stake)', 'Lucro Líquido', 'Status'];
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
    link.setAttribute('download', `registro_operacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper para renderizar status corporativo
  const StatusBadge = ({ status }: { status: string }) => {
      let styles = '';
      let label = '';
      
      switch(status) {
          case 'won': case 'half-won':
              styles = 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
              label = 'Lucro (TP)';
              break;
          case 'lost': case 'half-lost':
              styles = 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
              label = 'Prejuízo (SL)';
              break;
          case 'refunded':
              styles = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#2C2C2E] dark:text-[#E5E5EA] dark:border-[#3A3A3C]';
              label = 'Void / Devolvido';
              break;
          case 'cashout':
              styles = 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
              label = 'Fechamento';
              break;
          default:
              styles = 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
              label = 'Exposição Aberta';
      }

      return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold border whitespace-nowrap ${styles}`}>
              {label}
          </span>
      );
  };

  const cardClass = "bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm";
  const inputClass = "w-full bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors text-sm font-medium";

  return (
    <div className="space-y-6 pb-20 w-full font-sans overflow-x-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-[#2C2C2E] pb-6">

        <div>
          {/* Label superior discreta */}
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
            Operations Ledger
          </div>

          {/* Headline principal */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Diário de Operações
          </h1>

          {/* Subheadline */}
          <p className="text-slate-500 dark:text-[#8E8E93] text-sm mt-2 font-medium">
            Auditoria completa de entradas, filtros avançados e extração de dados.
          </p>
        </div>

        {/* Botões laterais */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors border shadow-sm ${showAdvanced ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400' : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-[#2C2C2E] text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-[#2C2C2E]'}`}
            >
                <Filter size={14} /> Filtros de Data
            </button>

            <button 
                onClick={exportCSV} 
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-5 py-3 rounded-xl transition-colors text-[10px] font-bold uppercase tracking-widest shadow-sm"
            >
                {/* Ícone condicional (Cadeado se for Free) */}
                {isPro ? <Download size={14} /> : <Lock size={14} className="text-emerald-500 dark:text-emerald-600" />} 
                Exportar CSV
            </button>
        </div>

      </header>

      <AnimatePresence>
        {showAdvanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className={`${cardClass} grid grid-cols-1 md:grid-cols-4 gap-4 mb-6`}>
                    <div className="md:col-span-4 flex justify-end border-b border-slate-100 dark:border-[#2C2C2E] pb-4 mb-2">
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setSportFilter('all');
                          setDateStart('');
                          setDateEnd('');
                          setMinOdd('');
                          setMinStake('');
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] px-3 py-1.5 rounded-lg"
                      >
                        Limpar Parâmetros
                      </button>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-2 block">Data Início</label>
                        <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-2 block">Data Fim</label>
                        <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-2 block">Cotação Mínima</label>
                        <input type="number" step="0.01" value={minOdd} onChange={e => setMinOdd(e.target.value)} className={inputClass} placeholder="1.50" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-2 block">Exposição Mínima</label>
                        <input type="number" value={minStake} onChange={e => setMinStake(e.target.value)} className={inputClass} placeholder="100" />
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* RESUMO EXECUTIVO DO FILTRO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className={cardClass}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] mb-2">
            Volume de Operações
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {filteredHistory.length}
          </p>
        </div>

        <div className={cardClass}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] mb-2">
            Resultado Líquido
          </p>
          <p className={`text-2xl font-bold tracking-tight ${
            filteredHistory.reduce((acc, b) => acc + b.profit, 0) >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(filteredHistory.reduce((acc, b) => acc + b.profit, 0))}
          </p>
        </div>

        <div className={cardClass}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] mb-2">
            Taxa de Acerto (WR)
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {filteredHistory.length > 0
              ? `${(
                  (filteredHistory.filter(b => b.profit > 0).length /
                    filteredHistory.length) *
                  100
                ).toFixed(0)}%`
              : '0%'}
          </p>
        </div>

        <div className={cardClass}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] mb-2">
            Retorno S/ Invest. (ROI)
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {filteredHistory.length > 0
              ? `${(
                  (filteredHistory.reduce((acc, b) => acc + b.profit, 0) /
                    filteredHistory.reduce((acc, b) => acc + b.stake, 0)) *
                  100
                ).toFixed(2)}%`
              : '0%'}
          </p>
        </div>
      </div>

      <div className={`${cardClass} space-y-4`}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#636366] mt-3 shrink-0">
            {filteredHistory.length} dados lidos
          </div>
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#636366]" size={18} />
                <input 
                    type="text" 
                    placeholder="Filtrar por ativo, mercado ou posição..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${inputClass} pl-12`}
                />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                 <div className="relative min-w-[200px]">
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={`${inputClass} appearance-none pr-10 cursor-pointer font-bold text-xs uppercase tracking-widest`}
                    >
                        <option value="all">Todas Operações</option>
                        <option value="won">Lucro (Take Profit)</option>
                        <option value="lost">Prejuízo (Stop Loss)</option>
                        <option value="pending">Exposição Aberta</option>
                        <option value="half-won">Lucro Parcial</option>
                        <option value="half-lost">Prejuízo Parcial</option>
                        <option value="refunded">Devolvida / Void</option>
                        <option value="cashout">Fechamento Manual</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>
        </div>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="md:hidden space-y-4">
        {filteredHistory.length === 0 ? (
            <div className={`${cardClass} text-center py-12`}>
                <RefreshCcw className="mx-auto text-slate-300 dark:text-[#3A3A3C] mb-3" size={32} />
                <p className="text-slate-500 dark:text-[#8E8E93] text-[10px] font-bold uppercase tracking-widest">Nenhum registro encontrado no banco de dados.</p>
            </div>
        ) : (
            filteredHistory.map(bet => (
                <div key={bet.id} className={`${cardClass} p-5 relative overflow-hidden group`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-1.5">
                             <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${bet.profit > 0 ? 'bg-emerald-500' : bet.profit < 0 ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93]">{bet.sport}</span>
                             </div>
                             <span className="text-xs text-slate-900 dark:text-white font-mono font-bold">{bet.date.split('-').reverse().join('/')}</span>
                        </div>
                        <StatusBadge status={bet.status} />
                    </div>
                    
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-tight pr-8 tracking-tight">{bet.event}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 font-medium">{bet.market} • Posição: {bet.selection} • <span className="font-mono font-bold text-slate-900 dark:text-white">Cotação: {bet.odds.toFixed(2)}</span></p>
                    
                    <div className="flex justify-between items-end border-t border-slate-100 dark:border-[#2C2C2E] pt-4">
                        <div>
                            <p className="text-[9px] text-slate-500 dark:text-[#8E8E93] uppercase font-bold tracking-widest mb-1.5">Montante Alocado</p>
                            <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(bet.stake)}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[9px] text-slate-500 dark:text-[#8E8E93] uppercase font-bold tracking-widest mb-1.5">Resultado Financeiro</p>
                             <p className={`text-xl font-mono font-bold tracking-tight ${bet.profit > 0 ? 'text-emerald-600 dark:text-emerald-400' : bet.profit < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                {bet.profit > 0 ? '+' : ''}{formatCurrency(bet.profit)}
                             </p>
                        </div>
                    </div>

                    {/* Ações (Editar/Deletar) - Visíveis ao toque/hover */}
                    <div className="absolute top-5 right-5 flex flex-col gap-2">
                         <button onClick={() => handleEdit(bet)} className="p-2 bg-slate-100 dark:bg-[#000000] border border-transparent dark:border-[#3A3A3C] text-slate-500 dark:text-[#8E8E93] rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm">
                            <Pencil size={14} />
                         </button>
                         <button onClick={() => confirm('Isso apagará o registro do banco de dados permanentemente. Continuar?') && removeBet(bet.id)} className="p-2 bg-slate-100 dark:bg-[#000000] border border-transparent dark:border-[#3A3A3C] text-slate-500 dark:text-[#8E8E93] rounded-lg hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm">
                            <Trash2 size={14} />
                         </button>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-[#000000] text-slate-500 dark:text-[#8E8E93] font-bold uppercase text-[9px] tracking-widest border-b border-slate-200 dark:border-[#2C2C2E]">
              <tr>
                {[{ label: 'Data', key: 'date' }, { label: 'Ativo / Evento', key: 'event' }, { label: 'Cotação', key: 'odds' }, { label: 'Stake Alocada', key: 'stake' }, { label: 'Resultado Líquido', key: 'profit' }, { label: 'Liquidação', key: 'status' }].map((header) => (
                  <th 
                    key={header.key}
                    onClick={() => handleSort(header.key as keyof Bet)}
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1C1C1E] transition-colors select-none group whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      {header.label}
                      <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === header.key ? 'opacity-100 text-indigo-500' : 'opacity-0 group-hover:opacity-50 text-slate-400'}`} />
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2C2C2E]">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-[#8E8E93]">
                    <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum registro encontrado no banco de dados.</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((bet) => (
                  <tr key={bet.id} className="hover:bg-slate-50 dark:hover:bg-[#000000] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] font-bold text-slate-900 dark:text-white">{bet.date.split('-').reverse().join('/')}</td>
                    <td className="px-6 py-4 min-w-[250px] max-w-[350px]">
                      <div className="text-slate-900 dark:text-white font-bold text-sm tracking-tight mb-1 truncate">{bet.event}</div>
                      <div className="text-[9px] text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest font-bold truncate">{bet.sport} • {bet.market} • {bet.selection}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-[11px] text-slate-900 dark:text-white">@{bet.odds.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono font-bold text-[11px] text-slate-900 dark:text-white whitespace-nowrap">{formatCurrency(bet.stake)}</td>
                    <td className={`px-6 py-4 font-mono font-bold text-sm tracking-tight whitespace-nowrap ${bet.profit > 0 ? 'text-emerald-600 dark:text-emerald-400' : bet.profit < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                      {bet.profit > 0 ? '+' : ''}{formatCurrency(bet.profit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={bet.status} />
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(bet)} className="text-slate-400 dark:text-[#8E8E93] hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-lg bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] shadow-sm transition-colors" title="Modificar">
                                <Pencil size={14} />
                            </button>
                            <button onClick={() => confirm('Isso apagará o registro do banco de dados permanentemente. Continuar?') && removeBet(bet.id)} className="text-slate-400 dark:text-[#8E8E93] hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 rounded-lg bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] shadow-sm" title="Apagar">
                                <Trash2 size={14} />
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