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
              styles = 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
              label = 'Lucro (Take Profit)';
              break;
          case 'lost': case 'half-lost':
              styles = 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
              label = 'Prejuízo (Stop Loss)';
              break;
          case 'refunded':
              styles = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
              label = 'Void / Devolvido';
              break;
          case 'cashout':
              styles = 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
              label = 'Fechamento Antecipado';
              break;
          default:
              styles = 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20';
              label = 'Exposição Aberta';
      }

      return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold border whitespace-nowrap ${styles}`}>
              {label}
          </span>
      );
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

        <div>
          {/* Label superior discreta */}
          <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-widest mb-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
            Operations Ledger
          </div>

          {/* Headline principal */}
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Diário de Operações <span className="text-slate-400 dark:text-slate-700 text-lg">///</span>
          </h1>

          {/* Subheadline */}
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">
            Auditoria completa de entradas, filtros avançados e extração de dados.
          </p>
        </div>

        {/* Botões laterais */}
        <div className="flex gap-2 w-full md:w-auto">
            <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border ${showAdvanced ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500' : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'}`}
            >
                <Filter size={14} /> Filtros de Data
            </button>

            <button 
                onClick={exportCSV} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-4 py-3 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10"
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
                <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shadow-sm">
                    <div className="md:col-span-4 flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
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
                        className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors"
                      >
                        Limpar Parâmetros
                      </button>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Data Início</label>
                        <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 dark:text-white transition-colors" />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Data Fim</label>
                        <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 dark:text-white transition-colors" />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Cotação (Odd) Mínima</label>
                        <input type="number" step="0.01" value={minOdd} onChange={e => setMinOdd(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 dark:text-white transition-colors" placeholder="1.50" />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Exposição (Stake) Mínima</label>
                        <input type="number" value={minStake} onChange={e => setMinStake(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 dark:text-white transition-colors" placeholder="100" />
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* RESUMO EXECUTIVO DO FILTRO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Volume de Operações
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {filteredHistory.length}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Resultado Líquido do Filtro
          </p>
          <p className={`text-xl font-black tracking-tight ${
            filteredHistory.reduce((acc, b) => acc + b.profit, 0) >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(filteredHistory.reduce((acc, b) => acc + b.profit, 0))}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Taxa de Acerto (Win Rate)
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {filteredHistory.length > 0
              ? `${(
                  (filteredHistory.filter(b => b.profit > 0).length /
                    filteredHistory.length) *
                  100
                ).toFixed(0)}%`
              : '0%'}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Retorno S/ Investimento (ROI)
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white">
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

      <div className="bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 shrink-0">
            {filteredHistory.length} dados lidos
          </div>
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Filtrar por ativo, mercado ou posição..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm font-medium"
                />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
                 <div className="relative min-w-[200px]">
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full appearance-none bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer text-[11px] font-black uppercase tracking-widest"
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
                    <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>
        </div>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="md:hidden space-y-4">
        {filteredHistory.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800">
                <RefreshCcw className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={32} />
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum registro encontrado no banco de dados.</p>
            </div>
        ) : (
            filteredHistory.map(bet => (
                <div key={bet.id} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${bet.profit > 0 ? 'bg-emerald-500' : bet.profit < 0 ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{bet.sport}</span>
                             </div>
                             <span className="text-[10px] text-slate-500 font-mono font-medium">{bet.date.split('-').reverse().join('/')}</span>
                        </div>
                        <StatusBadge status={bet.status} />
                    </div>
                    
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 pr-8 leading-tight">{bet.event}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-medium">{bet.market} • Posição: {bet.selection} • <span className="font-mono font-bold text-slate-700 dark:text-slate-300">Cotação: {bet.odds.toFixed(2)}</span></p>
                    
                    <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div>
                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Montante Alocado</p>
                            <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(bet.stake)}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Resultado Financeiro</p>
                             <p className={`text-lg font-mono font-black tracking-tighter ${bet.profit > 0 ? 'text-emerald-600 dark:text-emerald-400' : bet.profit < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-500'}`}>
                                {bet.profit > 0 ? '+' : ''}{formatCurrency(bet.profit)}
                             </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                         <button onClick={() => handleEdit(bet)} className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 uppercase tracking-widest p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                            <Pencil size={12} /> Modificar
                         </button>
                         <button onClick={() => confirm('Isso apagará o registro do banco de dados permanentemente. Continuar?') && removeBet(bet.id)} className="text-[10px] font-black text-red-600 dark:text-red-400 flex items-center gap-1 uppercase tracking-widest p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                            <Trash2 size={12} /> Apagar
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
            <thead className="bg-slate-50 dark:bg-[#020617] text-slate-700 dark:text-slate-200 font-bold uppercase text-[9px] tracking-widest border-b border-slate-200 dark:border-slate-800">
              <tr>
                {/* Ajuste de Nome da Coluna Stake para evitar quebra de linha */}
                {[{ label: 'Data', key: 'date' }, { label: 'Ativo / Evento', key: 'event' }, { label: 'Cotação', key: 'odds' }, { label: 'Stake Alocada', key: 'stake' }, { label: 'Resultado Líquido', key: 'profit' }, { label: 'Liquidação', key: 'status' }].map((header) => (
                  <th 
                    key={header.key}
                    onClick={() => handleSort(header.key as keyof Bet)}
                    className="px-6 py-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none group whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      {header.label}
                      <ArrowUpDown size={12} className={`text-slate-400 ${sortConfig.key === header.key ? 'opacity-100 text-emerald-500' : 'opacity-0 group-hover:opacity-50'}`} />
                    </div>
                  </th>
                ))}
                <th className="px-6 py-5 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-500">
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhum registro encontrado no banco de dados.</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((bet) => (
                  <tr key={bet.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] font-medium text-slate-600 dark:text-slate-400">{bet.date.split('-').reverse().join('/')}</td>
                    <td className="px-6 py-4 min-w-[250px]">
                      <div className="text-slate-900 dark:text-white font-bold text-xs leading-tight mb-1 pr-4 truncate max-w-[300px]">{bet.event}</div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-0.5 truncate max-w-[300px]">{bet.sport} • {bet.market} • {bet.selection}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">@{bet.odds.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono font-medium text-[11px] text-slate-900 dark:text-white whitespace-nowrap">{formatCurrency(bet.stake)}</td>
                    <td className={`px-6 py-4 font-mono font-black text-[13px] tracking-tight whitespace-nowrap ${bet.profit > 0 ? 'text-emerald-600 dark:text-emerald-500' : bet.profit < 0 ? 'text-red-600 dark:text-red-500' : 'text-slate-500'}`}>
                      {bet.profit > 0 ? '+' : ''}{formatCurrency(bet.profit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={bet.status} />
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(bet)} className="text-slate-400 hover:text-emerald-500 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Modificar">
                                <Pencil size={14} />
                            </button>
                            <button onClick={() => confirm('Isso apagará o registro do banco de dados permanentemente. Continuar?') && removeBet(bet.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Apagar">
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