import React, { useState } from 'react';
import { useBetStore, TransactionType } from '../store/useBetStore';
import {
  Wallet,
  Plus,
  CheckCircle2,
  Trash2,
  ArrowRightLeft,
  DollarSign,
  AlertTriangle
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
  // Substituímos o input de texto por um state booleano (Checkbox)
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
    if (!isDeleteConfirmed) return; // Nova validação via Checkbox

    await removeBankroll(selectedBR.id);
    setBankrollToDelete(null);
    setIsDeleteConfirmed(false); // Reseta o state de segurança
  };

  return (
    <div className="space-y-6 pb-20 w-full overflow-x-hidden">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

        <div>
          {/* Label superior discreta */}
          <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-widest mb-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
            Asset & Portfolio Management
          </div>

          {/* Headline principal */}
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Gestão de Portfólios <span className="text-slate-400 dark:text-slate-700 text-lg">///</span>
          </h1>

          {/* Subheadline */}
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">
            Controle de capital alocado, fluxo de caixa e estrutura financeira.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          <Plus size={16} /> Novo Portfólio
        </button>

      </header>

      {/* RESUMO EXECUTIVO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Portfólios Ativos
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {bankrolls.length}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Portfólio Selecionado
          </p>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 truncate">
            {activeBR?.name || '—'}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Liquidez Atual
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {formatCurrency(currentBankrollBalance)}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Fluxo de Caixa
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {transactions.filter(t => t.bankrollId === activeBankrollId).length}
          </p>
        </div>
      </div>

      {/* 💰 MOVIMENTAÇÃO DE CAPITAL */}
      {activeBR && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          
          <div className="flex items-center gap-3 mb-6">
            <ArrowRightLeft className="text-emerald-500" size={20} />
            <h3 className="font-black uppercase text-sm tracking-widest text-slate-700 dark:text-slate-300">
              Movimentação de Capital
            </h3>
          </div>

          <form onSubmit={handleTransaction} className="grid md:grid-cols-4 gap-4 items-end">

            {/* Tipo */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Tipo de Operação
              </label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as TransactionType)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-emerald-500"
              >
                <option value="deposit">Aporte (+)</option>
                <option value="withdrawal">Retirada (-)</option>
              </select>
            </div>

            {/* Valor */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Montante
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-emerald-500"
              />
            </div>

            {/* Observação */}
            <div className="flex flex-col md:col-span-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Nota / Justificativa
              </label>
              <input
                type="text"
                placeholder="Ex: Reforço de Caixa"
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-emerald-500"
              />
            </div>

            {/* Botão */}
            <button
              type="submit"
              className={`h-[52px] rounded-xl font-black text-xs uppercase tracking-widest transition shadow-lg active:scale-95 ${
                txType === 'deposit'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white shadow-slate-900/20'
              }`}
            >
              {txType === 'deposit' ? 'Confirmar Aporte' : 'Confirmar Retirada'}
            </button>

          </form>
        </div>
      )}

      {/* 📜 HISTÓRICO DE TRANSAÇÕES */}
      {activeBR && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="text-emerald-500" size={20} />
            <h3 className="font-black uppercase text-sm tracking-widest text-slate-700 dark:text-slate-300">
              Histórico do Fluxo de Caixa
            </h3>
          </div>

          {transactions.filter(t => t.bankrollId === activeBankrollId).length === 0 ? (
            <p className="text-sm text-slate-400">
              Nenhuma movimentação financeira registrada neste portfólio.
            </p>
          ) : (
            <div className="space-y-3">
              {transactions
                .filter(t => t.bankrollId === activeBankrollId)
                .map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
                  >
                    {/* ESQUERDA */}
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
                        {tx.type === 'deposit' ? 'Aporte de Capital' : 'Retirada de Capital'}
                      </p>

                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {new Date(tx.date).toLocaleString('pt-BR')}
                      </p>

                      {tx.description && (
                        <p className="text-xs text-slate-500 mt-1 italic">
                          "{tx.description}"
                        </p>
                      )}
                    </div>

                    {/* DIREITA */}
                    <div className="flex items-center gap-4">
                      <p
                        className={`font-black text-sm tracking-tight ${
                          tx.type === 'deposit'
                            ? 'text-emerald-500'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {tx.type === 'deposit' ? '+' : '-'}
                        {formatCurrency(tx.amount, activeBR.currency)}
                      </p>

                      <button
                        onClick={() => removeTransaction(tx.id)}
                        className="text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={16} />
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
            className={`cursor-pointer p-6 rounded-[2rem] border-2 transition-all group relative overflow-hidden shadow-sm ${
              activeBankrollId === br.id
                ? 'bg-white dark:bg-[#0f172a] border-emerald-500 ring-4 ring-emerald-500/10'
                : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {activeBankrollId === br.id && (
              <>
                <div className="absolute top-6 right-6 text-emerald-500">
                  <CheckCircle2 size={24} />
                </div>

                <div className="absolute top-6 left-6 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                  Em Operação
                </div>
              </>
            )}

            <div className="flex items-center gap-4 mb-6 mt-6">
              <div
                className={`p-3.5 rounded-2xl ${
                  activeBankrollId === br.id
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-500'
                }`}
              >
                <Wallet size={24} />
              </div>

              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight uppercase tracking-tight">
                  {br.name}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Base: {br.currency}
                </p>
              </div>
            </div>

            <div className="mt-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                Total Alocado (Liquidez)
              </p>
              <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                {br.id === activeBankrollId && (
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${
                    currentBankrollBalance >= br.initialBalance
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}>
                    {currentBankrollBalance >= br.initialBalance ? '▲ Em Crescimento' : '▼ Em Drawdown'}
                  </p>
                )}
                {formatCurrency(
                  br.id === activeBankrollId
                    ? currentBankrollBalance
                    : br.initialBalance,
                  br.currency
                )}
              </h4>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setBankrollToDelete(br.id);
                setIsDeleteConfirmed(false); // Reseta a segurança ao abrir o modal
              }}
              className="absolute bottom-6 right-6 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 dark:bg-slate-900 rounded-lg"
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
              className="bg-slate-50 dark:bg-[#0f172a]/50 border-2 border-dashed border-emerald-500/50 rounded-[2rem] p-6 flex flex-col justify-center"
            >
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wide">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-widest font-bold">
                  Defina capital inicial e moeda base
                </p>
                Estruturar Novo Portfólio
              </h3>

              <form onSubmit={handleAddBankroll} className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome (Ex: Portfólio Conservador)"
                  value={newBRName}
                  onChange={(e) => setNewBRName(e.target.value)}
                  className="w-full bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors text-sm font-bold"
                />

                <div className="flex gap-2 w-full">
                  <div className="w-28 shrink-0">
                      <select 
                          value={newBRCurrency} 
                          onChange={e => setNewBRCurrency(e.target.value)}
                          className="w-full bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-slate-900 dark:text-white outline-none font-bold text-sm cursor-pointer"
                      >
                          <option value="BRL">BRL</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                      </select>
                  </div>

                  <div className="flex-1 min-w-0">
                      <input 
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          placeholder="Capital Alocado"
                          value={newBRBalance}
                          onChange={e => setNewBRBalance(e.target.value)}
                          className="w-full bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors text-sm font-bold"
                      />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-500 py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  Registrar Estrutura
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🔥 DANGER MODAL (Refeito com Checkbox) */}
      <AnimatePresence>
        {bankrollToDelete && selectedBR && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-[#0f172a] p-8 rounded-3xl max-w-md w-full border border-red-500/20 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6 text-red-500">
                <AlertTriangle size={28} />
                <h2 className="text-xl font-black uppercase tracking-tight">
                  Aviso de Segurança
                </h2>
              </div>

              <p className="text-sm mb-2 text-slate-600 dark:text-slate-300 font-medium">
                Você está prestes a liquidar e excluir permanentemente:
              </p>

              <p className="font-black text-lg text-red-500 mb-4 uppercase">
                {selectedBR.name}
              </p>

              {/* O novo Checkbox de Confirmação */}
              <label className="flex items-start gap-3 cursor-pointer mb-6 group p-4 border border-red-200 dark:border-red-900/30 rounded-xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={isDeleteConfirmed}
                    onChange={(e) => setIsDeleteConfirmed(e.target.checked)}
                    className="w-5 h-5 rounded border-red-300 dark:border-red-700 text-red-600 focus:ring-red-500 dark:bg-slate-900 cursor-pointer accent-red-600"
                  />
                </div>
                <span className="text-xs font-bold text-red-700 dark:text-red-400 select-none">
                  Sim, entendo que vou perder todo o histórico de operações, fluxo de caixa e relatórios e não há como reverter.
                </span>
              </label>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setBankrollToDelete(null);
                    setIsDeleteConfirmed(false); // Sempre resetamos a chave de segurança
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>

                <button
                  disabled={!isDeleteConfirmed}
                  onClick={confirmDelete}
                  className={`flex-1 py-3 rounded-xl font-black text-white text-xs uppercase tracking-widest transition ${
                    isDeleteConfirmed
                      ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20'
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