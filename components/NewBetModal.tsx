import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, AlertCircle, Clock, DollarSign, Target, Activity, Divide, Ban, CornerDownRight, BookOpen, Save } from 'lucide-react';
import { useBetStore, BetStatus, Bet } from '../store/useBetStore';

interface NewBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  betToEdit?: Bet;
}

const NewBetModal: React.FC<NewBetModalProps> = ({ isOpen, onClose, betToEdit }) => {
  const { 
  addBet, 
  updateBet, 
  methods, 
  currency,
  customMarkets,
  customStrategies,
  displayMode,
  unitSize
} = useBetStore();
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
  sport: 'Futebol',
  event: '',
  market: '',
  selection: '',
  odds: '',
  stake: '',
  status: 'pending' as BetStatus,
  method: '',
  strategy: '', // 🔥 NOVO
  cashoutValue: ''
});

  useEffect(() => {
    if (betToEdit) {
    setFormData({
        sport: betToEdit.sport,
        event: betToEdit.event,
        market: betToEdit.market,
        selection: betToEdit.selection,
        odds: betToEdit.odds.toString(),
        stake: betToEdit.stake.toString(),
        status: betToEdit.status,
        method: betToEdit.method || '',
        strategy: (betToEdit as any).strategy || '',
        cashoutValue: ''
    });
}
    else {
        setFormData({
            sport: 'Futebol',
            event: '',
            market: '',
            selection: '',
            odds: '',
            stake: '',
            status: 'pending',
            method: '',
             strategy: '', // 🔥 NOVO
            cashoutValue: ''
        });
    }
  }, [betToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.event || !formData.odds || !formData.stake) {
    setError("Preencha todos os campos obrigatórios.");
    return;
}

// ✅ BLOQUEAR "__custom" SEM TEXTO
if (formData.market === '__custom') {
    setError("Digite o nome do mercado personalizado.");
    return;
}

const stakeValue = parseFloat(formData.stake);

    let stakeValue = parseFloat(formData.stake);

if (displayMode === 'units') {
    stakeValue = stakeValue * unitSize;
}
    if (stakeValue < 0) {
        setError("A stake não pode ser negativa.");
        return;
    }

    if (betToEdit) {
        updateBet(betToEdit.id, {
            ...formData,
            odds: parseFloat(formData.odds),
            stake: stakeValue,
            cashoutValue: formData.cashoutValue ? parseFloat(formData.cashoutValue) : 0,
        });
    } else {
        addBet({
          ...formData,
          odds: parseFloat(formData.odds),
          stake: stakeValue,
          cashoutValue: formData.cashoutValue ? parseFloat(formData.cashoutValue) : 0,
          date: new Date().toISOString().split('T')[0]
        });
    }

    onClose();
  };

  const calculateResult = () => {
    let stake = parseFloat(formData.stake) || 0;

if (displayMode === 'units') {
    stake = stake * unitSize;
}
    const odds = parseFloat(formData.odds) || 0;
    const cashout = parseFloat(formData.cashoutValue) || 0;
    if (stake === 0 || odds === 0) return 0;

    switch (formData.status) {
        case 'won': return (stake * odds) - stake;
        case 'lost': return -stake;
        case 'half-won': return ((stake * odds) - stake) / 2;
        case 'half-lost': return -stake / 2;
        case 'void': return 0;
        case 'refunded': return 0; // ✅ Cálculo para Reembolso
        case 'cashout': return cashout - stake;
        default: return (stake * odds) - stake;
    }
  };

  const resultValue = calculateResult();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <div>
                  <h2 className="text-xl font-bold text-white">{betToEdit ? 'Editar Aposta' : 'Nova Aposta'}</h2>
                  <p className="text-slate-500 text-sm">{betToEdit ? 'Atualize os dados da entrada' : 'Registre sua entrada'}</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Esporte</label>
                        <select 
                            value={formData.sport}
                            onChange={(e) => setFormData({...formData, sport: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
                        >
                            <option>Futebol</option>
                            <option>Basquete</option>
                            <option>Tênis</option>
                            <option>eSports</option>
                            <option>MMA</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Evento / Jogo</label>
                        <div className="relative">
                            <Activity className="absolute left-3 top-3 text-slate-600" size={16} />
                            <input 
                                type="text"
                                placeholder="Ex: Real Madrid vs City"
                                value={formData.event}
                                onChange={(e) => setFormData({...formData, event: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder-slate-600"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Mercado</label>
                        <div className="relative">
                            <Target className="absolute left-3 top-3 text-slate-600" size={16} />
                            <select
  value={formData.market}
  onChange={(e) => setFormData({...formData, market: e.target.value})}
  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
>
  <option value="">Selecione...</option>

  {customMarkets.map(m => (
    <option key={m.id} value={m.name}>
      {m.name}
    </option>
  ))}

  <option value="__custom">Outro (digitar manual)</option>
</select>
{formData.market === '__custom' && (
  <input
    type="text"
    placeholder="Digite o mercado"
    onChange={(e) => setFormData({...formData, market: e.target.value})}
    className="mt-2 w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5"
  />
)}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Seleção</label>
                        <input 
                            type="text"
                            placeholder="Ex: Sim"
                            value={formData.selection}
                            onChange={(e) => setFormData({...formData, selection: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder-slate-600"
                        />
                    </div>
                    <div>
                        <div className="space-y-3">

  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">
      Método
    </label>
    <div className="relative">
      <BookOpen className="absolute left-3 top-3 text-slate-600" size={16} />
      <select 
        value={formData.method}
        onChange={(e) => setFormData({...formData, method: e.target.value})}
        className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
      >
        <option value="">Selecione...</option>
        {methods.map(m => (
          <option key={m.id} value={m.name}>{m.name}</option>
        ))}
      </select>
    </div>
  </div>

  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">
      Estratégia
    </label>
    <select
      value={formData.strategy}
      onChange={(e) => setFormData({...formData, strategy: e.target.value})}
      className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
    >
      <option value="">Selecione...</option>
      {customStrategies.map(s => (
        <option key={s.id} value={s.name}>
          {s.name}
        </option>
      ))}
    </select>
  </div>

</div>
                        <div>
  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">
    Estratégia
  </label>

  <select
    value={formData.strategy}
    onChange={(e) => setFormData({...formData, strategy: e.target.value})}
    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
  >
    <option value="">Selecione...</option>
    {customStrategies.map(s => (
      <option key={s.id} value={s.name}>
        {s.name}
      </option>
    ))}
  </select>
</div>
                        <div className="relative">
                            <BookOpen className="absolute left-3 top-3 text-slate-600" size={16} />
                            <select 
                                value={formData.method}
                                onChange={(e) => setFormData({...formData, method: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
                            >
                                <option value="">Selecione...</option>
                                {methods.map(m => (
                                    <option key={m.id} value={m.name}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Odd</label>
                        <input 
                            type="number"
                            step="0.01"
                            placeholder="2.00"
                            value={formData.odds}
                            onChange={(e) => setFormData({...formData, odds: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 text-white font-mono rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Stake ({currency})</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 text-emerald-500" size={16} />
                            <input 
  type="number"
  step="1"
  placeholder={displayMode === 'units' ? 'Ex: 1.5 unidades' : '100'}
  value={formData.stake}
  onChange={(e) => setFormData({...formData, stake: e.target.value})}
  className="w-full bg-slate-950 border border-slate-700 text-white font-mono rounded-lg pl-9 pr-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
  required
/>
                        </div>
                    </div>
                    {formData.status === 'cashout' && (
                         <motion.div initial={{opacity:0, x: -10}} animate={{opacity:1, x:0}}>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Valor Saída</label>
                            <input 
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.cashoutValue}
                                onChange={(e) => setFormData({...formData, cashoutValue: e.target.value})}
                                className="w-full bg-slate-950 border border-blue-500 text-white font-mono rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                required
                            />
                        </motion.div>
                    )}
                </div>

                <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2 uppercase">Status da Aposta</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button type="button" onClick={() => setFormData({...formData, status: 'pending'})} className={`p-2 rounded border text-xs font-medium flex items-center justify-center gap-1 ${formData.status === 'pending' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'border-slate-700 text-slate-400'}`}>
                            <Clock size={14} /> Pendente
                        </button>
                        <button type="button" onClick={() => setFormData({...formData, status: 'won'})} className={`p-2 rounded border text-xs font-medium flex items-center justify-center gap-1 ${formData.status === 'won' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'border-slate-700 text-slate-400'}`}>
                            <Trophy size={14} /> Green
                        </button>
                        <button type="button" onClick={() => setFormData({...formData, status: 'lost'})} className={`p-2 rounded border text-xs font-medium flex items-center justify-center gap-1 ${formData.status === 'lost' ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-slate-700 text-slate-400'}`}>
                            <AlertCircle size={14} /> Red
                        </button>
                         <button type="button" onClick={() => setFormData({...formData, status: 'half-won'})} className={`p-2 rounded border text-xs font-medium flex items-center justify-center gap-1 ${formData.status === 'half-won' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'border-slate-700 text-slate-400'}`}>
                            <Divide size={14} /> Meio Green
                        </button>
                         <button type="button" onClick={() => setFormData({...formData, status: 'half-lost'})} className={`p-2 rounded border text-xs font-medium flex items-center justify-center gap-1 ${formData.status === 'half-lost' ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-slate-700 text-slate-400'}`}>
                            <Divide size={14} /> Meio Red
                        </button>
                        <button type="button" onClick={() => setFormData({...formData, status: 'refunded'})} className={`p-2 rounded border text-xs font-medium flex items-center justify-center gap-1 ${formData.status === 'refunded' ? 'bg-slate-500/20 border-slate-500 text-slate-400' : 'border-slate-700 text-slate-400'}`}>
                            <Ban size={14} /> Reembolso
                        </button>
                        <button type="button" onClick={() => setFormData({...formData, status: 'cashout'})} className={`col-span-2 p-2 rounded border text-xs font-medium flex items-center justify-center gap-1 ${formData.status === 'cashout' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'border-slate-700 text-slate-400'}`}>
                            <CornerDownRight size={14} /> Cashout
                        </button>
                      </div>
                </div>

                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex justify-between items-center">
                    <div>
                        <span className="text-slate-400 text-sm block">Resultado Estimado:</span>
                        <span className="text-xs text-slate-600">
                             {formData.status === 'pending' ? 'Lucro Potencial' : 'Lucro/Prejuízo Real'}
                        </span>
                    </div>
                    <span className={`font-mono font-bold text-lg ${resultValue > 0 ? 'text-emerald-500' : resultValue < 0 ? 'text-red-500' : 'text-slate-200'}`}>
                        {currency} {resultValue.toFixed(2)}
                    </span>
                </div>

                <div className="pt-2">
                    <button 
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(var(--color-primary-500),0.4)] flex items-center justify-center gap-2"
                    >
                        {betToEdit ? <Save size={18} /> : null}
                        {betToEdit ? 'Atualizar Aposta' : 'Salvar Aposta'}
                    </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewBetModal;