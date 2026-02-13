import React, { useState } from 'react';
import { useBetStore, TransactionType } from '../store/useBetStore';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Save, ArrowRight, Calendar, AlertCircle, Trash2, Plus, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão de Bancas</h1>
            <p className="text-slate-500 dark:text-slate-400">Gerencie múltiplas bancas e controle fluxos de caixa.</p>
        </div>
        <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-emerald-500/20"
        >
            <Plus size={18} /> Nova Banca
        </button>
      </div>

      {/* Multiple Bankrolls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bankrolls.map((br) => (
            <div 
                key={br.id}
                onClick={() => setActiveBankroll(br.id)}
                className={`cursor-pointer p-6 rounded-2xl border-2 transition-all group relative overflow-hidden ${
                    activeBankrollId === br.id 
                    ? 'bg-[#0f172a] border-emerald-500 ring-4 ring-emerald-500/10' 
                    : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                }`}
            >
                {activeBankrollId === br.id && (
                    <div className="absolute top-4 right-4 text-emerald-500">
                        <CheckCircle2 size={24} />
                    </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${activeBankrollId === br.id ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">{br.name}</h3>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{br.currency}</p>
                    </div>
                </div>
                <div className="mt-6">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Saldo Atual</p>
                    <h4 className="text-2xl font-bold text-white">
                        {formatCurrency(br.id === activeBankrollId ? currentBankrollBalance : br.initialBalance, br.currency)}
                    </h4>
                </div>
                {bankrolls.length > 1 && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); confirm('Apagar banca?') && removeBankroll(br.id); }}
                        className="absolute bottom-4 right-4 p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        ))}

        {showAddForm && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0f172a] border-2 border-dashed border-emerald-500/50 rounded-2xl p-6"
            >
                <h3 className="font-bold text-white mb-4">Configurar Nova Banca</h3>
                <form onSubmit={handleAddBankroll} className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Nome da Banca" 
                        value={newBRName} 
                        onChange={e => setNewBRName(e.target.value)}
                        className="w-full bg-[#020617] border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500" 
                    />
                    <div className="flex gap-2">
                        <select 
                            value={newBRCurrency} 
                            onChange={e => setNewBRCurrency(e.target.value)}
                            className="bg-[#020617] border border-slate-700 rounded-lg p-2 text-white outline-none"
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
                            className="flex-1 bg-[#020617] border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500" 
                        />
                    </div>
                    <button type="submit" className="w-full bg-emerald-500 py-2 rounded-lg text-white font-bold hover:bg-emerald-600 transition-colors">Criar</button>
                </form>
            </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History for active bankroll */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white">Fluxo de Caixa: {activeBR?.name}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-[#020617] text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Data</th>
                                <th className="px-6 py-3 font-medium">Tipo</th>
                                <th className="px-6 py-3 font-medium">Descrição</th>
                                <th className="px-6 py-3 font-medium text-right">Valor</th>
                                <th className="px-6 py-3 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {transactions.filter(t => t.bankrollId === activeBankrollId).length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">Nenhuma movimentação manual registrada para esta banca.</td>
                                </tr>
                            ) : (
                                transactions.filter(t => t.bankrollId === activeBankrollId).map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{t.date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase ${
                                                t.type === 'deposit' 
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500' 
                                                : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500'
                                            }`}>
                                                {t.type === 'deposit' ? 'Depósito' : 'Saque'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-900 dark:text-white">{t.description}</td>
                                        <td className={`px-6 py-4 text-right font-mono font-bold ${
                                            t.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-500'
                                        }`}>
                                            {t.type === 'deposit' ? '+' : '-'} {formatCurrency(t.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => confirm('Excluir?') && removeTransaction(t.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg"
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
             <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm sticky top-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-6">Nova Movimentação</h3>
                <form onSubmit={handleTransaction} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setTxType('deposit')}
                            className={`py-3 rounded-lg border font-bold transition-all ${txType === 'deposit' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-transparent border-slate-700 text-slate-500'}`}
                        >
                            Aporte
                        </button>
                        <button
                            type="button"
                            onClick={() => setTxType('withdrawal')}
                            className={`py-3 rounded-lg border font-bold transition-all ${txType === 'withdrawal' ? 'bg-red-500 text-white border-red-500' : 'bg-transparent border-slate-700 text-slate-500'}`}
                        >
                            Saque
                        </button>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase mb-2">Valor</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={txAmount}
                            onChange={(e) => setTxAmount(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-emerald-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase mb-2">Descrição</label>
                        <input 
                            type="text" 
                            value={txNote}
                            onChange={(e) => setTxNote(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <button type="submit" className="w-full bg-emerald-500 font-bold py-3 rounded-xl text-white shadow-lg hover:bg-emerald-600">
                        Confirmar
                    </button>
                </form>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Bankroll;