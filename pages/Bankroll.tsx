import React, { useState } from 'react';
import { useBetStore, TransactionType } from '../store/useBetStore';
import { Wallet, Plus, CheckCircle2, Trash2, ArrowRightLeft, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Bankroll: React.FC = () => {
  const { bankrolls, activeBankrollId, addBankroll, removeBankroll, setActiveBankroll, currentBankrollBalance, addTransaction, removeTransaction, transactions } = useBetStore();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBRName, setNewBRName] = useState('');
  const [newBRCurrency, setNewBRCurrency] = useState('BRL');
  const [newBRBalance, setNewBRBalance] = useState('');

  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<TransactionType>('deposit');
  const [txNote, setTxNote] = useState('');

  const activeBR = bankrolls.find(b => b.id === activeBankrollId);

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
        description: txNote || (txType === 'deposit' ? 'Aporte manual' : 'Saque manual')
      });
      setTxAmount('');
      setTxNote('');
    }
  };

  const formatCurrency = (val: number, curr?: string) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: curr || activeBR?.currency || 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 pb-20 w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Gestão de Bancas</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Controle de Capital e Fluxo de Caixa</p>
        </div>
        <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
        >
            <Plus size={16} /> Nova Banca
        </button>
      </div>

      {/* Multiple Bankrolls Grid */}
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
                    <div className="absolute top-6 right-6 text-emerald-500 animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 size={24} />
                    </div>
                )}
                <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3.5 rounded-2xl ${activeBankrollId === br.id ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight">{br.name}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{br.currency}</p>
                    </div>
                </div>
                <div className="mt-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Saldo Atual</p>
                    <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                        {formatCurrency(br.id === activeBankrollId ? currentBankrollBalance : br.initialBalance, br.currency)}
                    </h4>
                </div>
                {bankrolls.length > 1 && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); confirm('Apagar banca? O histórico será perdido.') && removeBankroll(br.id); }}
                        className="absolute bottom-6 right-6 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 dark:bg-slate-900 rounded-lg"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        ))}

        <AnimatePresence>
            {showAddForm && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-50 dark:bg-[#0f172a]/50 border-2 border-dashed border-emerald-500/50 rounded-[2rem] p-6 flex flex-col justify-center"
                >
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wide">Configurar Nova Banca</h3>
                    <form onSubmit={handleAddBankroll} className="space-y-3">
                        <input 
                            type="text" 
                            placeholder="Nome da Banca" 
                            value={newBRName} 
                            onChange={e => setNewBRName(e.target.value)}
                            className="w-full bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors text-sm font-bold" 
                        />
                        <div className="flex gap-2">
                            <select 
                                value={newBRCurrency} 
                                onChange={e => setNewBRCurrency(e.target.value)}
                                className="bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white outline-none font-bold text-sm cursor-pointer"
                            >
                                <option>BRL</option>
                                <option>USD</option>
                                <option>EUR</option>
                            </select>
                            <input 
                                type="number" 
                                placeholder="Saldo Inicial" 
                                value={newBRBalance} 
                                onChange={e => setNewBRBalance(e.target.value)}
                                className="flex-1 bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors text-sm font-bold" 
                            />
                        </div>
                        <button type="submit" className="w-full bg-emerald-500 py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95">
                            Criar Banca
                        </button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#020617]/50">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ArrowRightLeft size={18} className="text-slate-400" />
                        Fluxo de Caixa: <span className="text-emerald-600 dark:text-emerald-500">{activeBR?.name}</span>
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-[#020617] text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Descrição</th>
                                <th className="px-6 py-4 text-right">Valor</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {transactions.filter(t => t.bankrollId === activeBankrollId).length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-600 font-medium">Nenhuma movimentação manual registrada.</td>
                                </tr>
                            ) : (
                                transactions.filter(t => t.bankrollId === activeBankrollId).map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{t.date.split('-').reverse().join('/')}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${
                                                t.type === 'deposit' 
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500' 
                                                : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500'
                                            }`}>
                                                {t.type === 'deposit' ? 'Depósito' : 'Saque'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">{t.description}</td>
                                        <td className={`px-6 py-4 text-right font-mono font-bold ${
                                            t.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'
                                        }`}>
                                            {t.type === 'deposit' ? '+' : '-'} {formatCurrency(t.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => confirm('Excluir esta transação?') && removeTransaction(t.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-1">
             <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm sticky top-6">
                <h3 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight italic text-lg">Nova Movimentação</h3>
                <form onSubmit={handleTransaction} className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setTxType('deposit')}
                            className={`py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-wider transition-all ${txType === 'deposit' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-500 hover:text-emerald-500'}`}
                        >
                            Aporte
                        </button>
                        <button
                            type="button"
                            onClick={() => setTxType('withdrawal')}
                            className={`py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-wider transition-all ${txType === 'withdrawal' ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 hover:border-red-500 hover:text-red-500'}`}
                        >
                            Saque
                        </button>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Valor</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-3.5 text-slate-400" size={16} />
                            <input 
                                type="number" 
                                step="0.01"
                                value={txAmount}
                                onChange={(e) => setTxAmount(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-bold"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Descrição (Opcional)</label>
                        <input 
                            type="text" 
                            value={txNote}
                            onChange={(e) => setTxNote(e.target.value)}
                            placeholder={txType === 'deposit' ? 'Ex: Bônus da casa' : 'Ex: Pagamento de contas'}
                            className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-sm"
                        />
                    </div>
                    <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-black py-4 rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest mt-2">
                        Confirmar Transação
                    </button>
                </form>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Bankroll;