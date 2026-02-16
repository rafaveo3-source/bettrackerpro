import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertCircle,
  Save
} from 'lucide-react';
import { useBetStore, BetStatus, Bet } from '../store/useBetStore';

interface NewBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  betToEdit?: Bet;
}

const NewBetModal: React.FC<NewBetModalProps> = ({
  isOpen,
  onClose,
  betToEdit
}) => {
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
  const [manualMarket, setManualMarket] = useState('');

  const [formData, setFormData] = useState({
    sport: 'Futebol',
    event: '',
    market: '',
    selection: '',
    odds: '',
    stake: '',
    status: 'pending' as BetStatus,
    method: '',
    strategy: '',
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
    } else {
      setFormData({
        sport: 'Futebol',
        event: '',
        market: '',
        selection: '',
        odds: '',
        stake: '',
        status: 'pending',
        method: '',
        strategy: '',
        cashoutValue: ''
      });
      setManualMarket('');
    }
  }, [betToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.event || !formData.odds || !formData.stake) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (formData.market === '__custom' && !manualMarket) {
      setError('Digite o nome do mercado personalizado.');
      return;
    }

    let stakeValue = parseFloat(formData.stake);

    if (displayMode === 'units') {
      stakeValue = stakeValue * unitSize;
    }

    if (stakeValue < 0) {
      setError('A stake não pode ser negativa.');
      return;
    }

    const finalMarket =
      formData.market === '__custom' ? manualMarket : formData.market;

    const payload = {
      ...formData,
      market: finalMarket,
      odds: parseFloat(formData.odds),
      stake: stakeValue,
      cashoutValue: formData.cashoutValue
        ? parseFloat(formData.cashoutValue)
        : 0
    };

    if (betToEdit) {
      updateBet(betToEdit.id, payload);
    } else {
      addBet({
        ...payload,
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

    if (!stake || !odds) return 0;

    switch (formData.status) {
      case 'won':
        return stake * odds - stake;
      case 'lost':
        return -stake;
      case 'half-won':
        return (stake * odds - stake) / 2;
      case 'half-lost':
        return -stake / 2;
      case 'cashout':
        return cashout - stake;
      case 'void':
      case 'refunded':
        return 0;
      default:
        return stake * odds - stake;
    }
  };

  const resultValue = calculateResult();

  const inputStyle =
    'w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* HEADER */}
            <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {betToEdit ? 'Editar Aposta' : 'Nova Aposta'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Registro avançado de entrada
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* BLOCO PRINCIPAL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-4">
                  <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    Esporte
                  </label>
                  <select
                    value={formData.sport}
                    onChange={(e) =>
                      setFormData({ ...formData, sport: e.target.value })
                    }
                    className={inputStyle}
                  >
                    <option>Futebol</option>
                    <option>Basquete</option>
                    <option>Tênis</option>
                    <option>eSports</option>
                    <option>MMA</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    Evento
                  </label>
                  <input
                    type="text"
                    value={formData.event}
                    onChange={(e) =>
                      setFormData({ ...formData, event: e.target.value })
                    }
                    className={inputStyle}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    Mercado
                  </label>
                  <select
                    value={formData.market}
                    onChange={(e) =>
                      setFormData({ ...formData, market: e.target.value })
                    }
                    className={inputStyle}
                  >
                    <option value="">Selecione</option>
                    {customMarkets.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                    <option value="__custom">Outro (manual)</option>
                  </select>

                  {formData.market === '__custom' && (
                    <input
                      type="text"
                      value={manualMarket}
                      onChange={(e) => setManualMarket(e.target.value)}
                      placeholder="Digite o mercado"
                      className={inputStyle}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    Seleção
                  </label>
                  <input
                    type="text"
                    value={formData.selection}
                    onChange={(e) =>
                      setFormData({ ...formData, selection: e.target.value })
                    }
                    className={inputStyle}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    Método
                  </label>
                  <select
                    value={formData.method}
                    onChange={(e) =>
                      setFormData({ ...formData, method: e.target.value })
                    }
                    className={inputStyle}
                  >
                    <option value="">Selecione</option>
                    {methods.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    Estratégia
                  </label>
                  <select
                    value={formData.strategy}
                    onChange={(e) =>
                      setFormData({ ...formData, strategy: e.target.value })
                    }
                    className={inputStyle}
                  >
                    <option value="">Selecione</option>
                    {customStrategies.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    Odd
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.odds}
                    onChange={(e) =>
                      setFormData({ ...formData, odds: e.target.value })
                    }
                    className={inputStyle}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    Stake ({displayMode === 'units' ? 'Unidades' : currency})
                  </label>
                  <input
                    type="number"
                    value={formData.stake}
                    onChange={(e) =>
                      setFormData({ ...formData, stake: e.target.value })
                    }
                    placeholder={
                      displayMode === 'units'
                        ? 'Ex: 1.5 unidades'
                        : 'Valor stake'
                    }
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* RESULT CARD */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex justify-between items-center">
                <div>
                  <p className="text-slate-500 text-sm">
                    Resultado Estimado
                  </p>
                  <p className="text-xs text-slate-600">
                    {formData.status === 'pending'
                      ? 'Lucro Potencial'
                      : 'Lucro/Prejuízo Real'}
                  </p>
                </div>

                <div
                  className={`text-2xl font-mono font-bold ${
                    resultValue > 0
                      ? 'text-emerald-500'
                      : resultValue < 0
                      ? 'text-red-500'
                      : 'text-slate-200'
                  }`}
                >
                  {currency} {resultValue.toFixed(2)}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl transition-all shadow-xl tracking-wide"
              >
                {betToEdit ? (
                  <>
                    <Save size={16} className="inline mr-2" />
                    Atualizar Aposta
                  </>
                ) : (
                  'Salvar Aposta'
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewBetModal;
