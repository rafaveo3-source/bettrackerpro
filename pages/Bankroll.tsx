import React, { useState } from 'react';
import { useBetStore, TransactionType } from '../store/useBetStore';
import {
  Wallet,
  Plus,
  CheckCircle2,
  Trash2,
  ArrowRightLeft,
  DollarSign,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Bankroll: React.FC = () => {
  const {
    bankrolls,
    activeBankrollId,
    addBankroll,
    removeBankroll,
    setActiveBankroll,
    currentBankrollBalance,
    addTransaction,
    removeTransaction,
    transactions
  } = useBetStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newBRName, setNewBRName] = useState('');
  const [newBRCurrency, setNewBRCurrency] = useState('BRL');
  const [newBRBalance, setNewBRBalance] = useState('');

  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<TransactionType>('deposit');
  const [txNote, setTxNote] = useState('');

  const [bankrollToDelete, setBankrollToDelete] = useState<string | null>(null);
  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false);

  const activeBR = bankrolls.find(b => b.id === activeBankrollId);
  const selectedBR = bankrolls.find(b => b.id === bankrollToDelete);

  const handleAddBankroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBRName || !newBRBalance) return;

    addBankroll(newBRName, newBRCurrency, parseFloat(newBRBalance));

    setNewBRName('');
    setNewBRBalance('');
    setShowAddForm(false);
  };

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(txAmount);

    if (!isNaN(val) && val > 0) {
      addTransaction({
        date: new Date().toISOString().split('T')[0],
        type: txType,
        amount: val,
        description:
          txNote ||
          (txType === 'deposit'
            ? 'Aporte de Capital'
            : 'Retirada de Capital')
      });

      setTxAmount('');
      setTxNote('');
    }
  };

  const formatCurrency = (val: number, curr?: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: curr || activeBR?.currency || 'BRL'
    }).format(val);
  };

  const confirmDelete = async () => {
    if (!selectedBR) return;
    if (!isDeleteConfirmed) return; 

    await removeBankroll(selectedBR.id);
    setBankrollToDelete(null);
    setIsDeleteConfirmed(false); 
  };

  const cardClass = "bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm";
  const inputClass = "bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-indigo-500 transition-colors";

  return (
    <div className="space-y-6 pb-20 w-full overflow-x-hidden font-sans">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-[#2C2C2E] pb-6">

        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
            Asset & Portfolio Management
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Gestão de Portfólios
          </h1>

          <p className="text-slate-500 dark:text-[#8E8E93] text-sm mt-2 font-medium">
            Controle de capital alocado, fluxo de caixa e estrutura financeira.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm w-full md:w-auto"
        >
          <Plus size={16} /> Novo Portfólio
        </button>

      </header>

      {/* RESUMO EXECUTIVO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className={cardClass}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] mb-1.5">
            Portfólios Ativos
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {bankrolls.length}
          </p>
        </div>

        <div className={cardClass}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] mb-1.5">
            Portfólio Selecionado
          </p>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight truncate">
            {activeBR?.name || '—'}
          </p>
        </div>

        <div className={cardClass}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] mb-1.5">
            Liquidez Atual
          </p>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(currentBankrollBalance)}
          </p>
        </div>

        <div className={cardClass}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] mb-1.5">
            Fluxo de Caixa
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {transactions.filter(t => t.bankrollId === activeBankrollId).length}
          </p>
        </div>
      </div>

      {/* 💰 MOVIMENTAÇÃO DE CAPITAL */}
      {activeBR && (
        <div className={cardClass}>
          
          <div className="flex items-center gap-3 mb-6">
            <ArrowRightLeft className="text-indigo-500" size={20} />
            <h3 className="font-bold uppercase text-sm tracking-widest text-slate-900 dark:text-white">
              Movimentação de Capital
            </h3>
          </div>

          <form onSubmit={handleTransaction} className="grid md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] mb-2">
                Tipo de Operação
              </label>
              <div className="relative">
                <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as TransactionType)}
                    className={`${inputClass} appearance-none cursor-pointer pr-10`}
                >
                    <option value="deposit">Aporte (+)</option>
                    <option value="withdrawal">Retirada (-)</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] mb-2">
                Montante
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] mb-2">
                Nota / Justificativa
              </label>
              <input
                type="text"
                placeholder="Ex: Reforço de Caixa"
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              className={`h-[46px] rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-sm ${
                txType === 'deposit'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-[#3A3A3C] dark:hover:bg-[#48484A]'
              }`}
            >
              {txType === 'deposit' ? 'Confirmar Aporte' : 'Confirmar Retirada'}
            </button>
          </form>
        </div>
      )}

      {/* 📜 HISTÓRICO DE TRANSAÇÕES */}
      {activeBR && (
        <div className={cardClass}>
          
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="text-emerald-500" size={20} />
            <h3 className="font-bold uppercase text-sm tracking-widest text-slate-900 dark:text-white">
              Histórico do Fluxo de Caixa
            </h3>
          </div>

          {transactions.filter(t => t.bankrollId === activeBankrollId).length === 0 ? (
            <p className="text-sm font-medium text-slate-500 dark:text-[#8E8E93] border border-dashed border-slate-200 dark:border-[#3A3A3C] rounded-xl p-8 text-center">
              Nenhuma movimentação financeira registrada neste portfólio.
            </p>
          ) : (
            <div className="space-y-3">
              {transactions
                .filter(t => t.bankrollId === activeBankrollId)
                .map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] rounded-xl p-4"
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
                        {tx.type === 'deposit' ? 'Aporte de Capital' : 'Retirada de Capital'}
                      </p>

                      <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] font-mono mt-1 font-bold">
                        {new Date(tx.date).toLocaleString('pt-BR')}
                      </p>

                      {tx.description && (
                        <p className="text-xs text-slate-600 dark:text-[#E5E5EA] mt-1.5 font-medium">
                          {tx.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <p
                        className={`font-bold font-mono text-base tracking-tight ${
                          tx.type === 'deposit'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-700 dark:text-[#E5E5EA]'
                        }`}
                      >
                        {tx.type === 'deposit' ? '+' : '-'}
                        {formatCurrency(tx.amount, activeBR.currency)}
                      </p>

                      <button
                        onClick={() => removeTransaction(tx.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] rounded-lg shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* BANKROLL GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bankrolls.map((br) => (
          <div
            key={br.id}
            onClick={() => setActiveBankroll(br.id)}
            className={`cursor-pointer p-6 rounded-2xl border-2 transition-all group relative overflow-hidden shadow-sm ${
              activeBankrollId === br.id
                ? 'bg-white dark:bg-[#1C1C1E] border-indigo-500'
                : 'bg-slate-50 dark:bg-[#000000] border-transparent hover:border-slate-300 dark:hover:border-[#3A3A3C]'
            }`}
          >
            {activeBankrollId === br.id && (
              <>
                <div className="absolute top-6 right-6 text-indigo-500">
                  <CheckCircle2 size={24} />
                </div>
                <div className="absolute top-6 left-6 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold px-2 py-1 rounded border border-indigo-200 dark:border-indigo-500/20 uppercase tracking-widest">
                  Em Operação
                </div>
              </>
            )}

            <div className="flex items-center gap-4 mb-6 mt-8">
              <div
                className={`p-3.5 rounded-xl border ${
                  activeBankrollId === br.id
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-[#2C2C2E] text-slate-500 dark:text-[#8E8E93]'
                }`}
              >
                <Wallet size={20} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                  {br.name}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] font-bold uppercase tracking-widest">
                  Base: {br.currency}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-[#2C2C2E]">
              <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] font-bold uppercase tracking-widest mb-1">
                Total Alocado (Liquidez)
              </p>
              <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-mono">
  {br.id === activeBankrollId && (
    <p
      className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
        currentBankrollBalance >= br.initialBalance
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400'
      }`}
    >
      {currentBankrollBalance >= br.initialBalance
        ? '▲ Em Crescimento'
        : '▼ Em Drawdown'}
    </p>
  )}

  {formatCurrency(
    br.id === activeBankrollId
      ? currentBankrollBalance
      : br.initialBalance,
    br.currency
  )}
</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setBankrollToDelete(br.id);
                setIsDeleteConfirmed(false); 
              }}
              className="absolute bottom-6 right-6 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] rounded-lg shadow-sm"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {/* ADD FORM */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1C1C1E] border-2 border-dashed border-indigo-300 dark:border-indigo-500/30 rounded-2xl p-6 flex flex-col justify-center"
            >
              <h3 className="font-bold text-slate-900 dark:text-white mb-6 text-sm uppercase tracking-wide">
                Estruturar Novo Portfólio
              </h3>

              <form onSubmit={handleAddBankroll} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome (Ex: Conservador)"
                  value={newBRName}
                  onChange={(e) => setNewBRName(e.target.value)}
                  className={inputClass}
                />

                <div className="flex gap-3 w-full">
                  <div className="w-28 shrink-0 relative">
                      <select 
                          value={newBRCurrency} 
                          onChange={e => setNewBRCurrency(e.target.value)}
                          className={`${inputClass} appearance-none cursor-pointer pr-10`}
                      >
                          <option value="BRL">BRL</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="flex-1 min-w-0">
                      <input 
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          placeholder="Capital Alocado"
                          value={newBRBalance}
                          onChange={e => setNewBRBalance(e.target.value)}
                          className={inputClass}
                      />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-colors shadow-sm"
                >
                  Registrar Estrutura
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🔥 DANGER MODAL (APPLE STYLE) */}
      <AnimatePresence>
        {bankrollToDelete && selectedBR && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-[#1C1C1E] p-8 rounded-2xl max-w-md w-full border border-slate-200 dark:border-[#2C2C2E] shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6 text-red-600 dark:text-red-500">
                <AlertTriangle size={24} />
                <h2 className="text-lg font-bold tracking-tight">
                  Aviso de Segurança
                </h2>
              </div>

              <p className="text-sm mb-2 text-slate-600 dark:text-[#E5E5EA] font-medium leading-relaxed">
                Você está prestes a liquidar e excluir permanentemente o portfólio:
              </p>

              <p className="font-bold text-xl text-slate-900 dark:text-white mb-6 tracking-tight">
                {selectedBR.name}
              </p>

              <label className="flex items-start gap-3 cursor-pointer mb-8 p-4 border border-red-200 dark:border-red-500/30 rounded-xl bg-red-50 dark:bg-red-500/10 transition-colors">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={isDeleteConfirmed}
                    onChange={(e) => setIsDeleteConfirmed(e.target.checked)}
                    className="w-5 h-5 rounded border-red-300 dark:border-red-700 text-red-600 focus:ring-red-500 dark:bg-slate-900 cursor-pointer accent-red-600"
                  />
                </div>
                <span className="text-xs font-medium text-red-800 dark:text-red-300 select-none leading-relaxed">
                  Sim, entendo que vou perder todo o histórico de operações, fluxo de caixa e relatórios vinculados a este portfólio. Ação irreversível.
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setBankrollToDelete(null);
                    setIsDeleteConfirmed(false); 
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C] text-slate-700 dark:text-white font-bold uppercase text-xs tracking-widest transition-colors"
                >
                  Cancelar
                </button>

                <button
                  disabled={!isDeleteConfirmed}
                  onClick={confirmDelete}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-white text-xs uppercase tracking-widest transition-colors shadow-sm ${
                    isDeleteConfirmed
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-red-300 dark:bg-red-900/50 cursor-not-allowed text-red-100/50'
                  }`}
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Bankroll;