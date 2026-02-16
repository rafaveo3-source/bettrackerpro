import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trophy,
  AlertCircle,
  Clock,
  DollarSign,
  Target,
  Activity,
  Divide,
  Ban,
  CornerDownRight,
  BookOpen,
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl"
          >
            {/* HEADER */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {betToEdit ? 'Editar Aposta' : 'Nova Aposta'}
                </h2>
                <p className="text-slate-500 text-sm">
                  {betToEdit
                    ? 'Atualize os dados da entrada'
                    : 'Registre sua entrada'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
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

              {/* SPORT + EVENT */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={formData.sport}
                  onChange={(e) =>
                    setFormData({ ...formData, sport: e.target.value })
                  }
                  className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2.5"
                >
                  <option>Futebol</option>
                  <option>Basquete</option>
                  <option>Tênis</option>
                  <option>eSports</option>
                  <option>MMA</option>
                </select>

                <input
                  type="text"
                  placeholder="Evento"
                  value={formData.event}
                  onChange={(e) =>
                    setFormData({ ...formData, event: e.target.value })
                  }
                  className="md:col-span-2 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5"
                />
              </div>

              {/* MARKET + SELECTION + METHOD + STRATEGY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={formData.market}
                  onChange={(e) =>
                    setFormData({ ...formData, market: e.target.value })
                  }
                  className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5"
                >
                  <option value="">Selecione Mercado</option>
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
                    placeholder="Digite o mercado"
                    value={manualMarket}
                    onChange={(e) => setManualMarket(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5"
                  />
                )}

                <input
                  type="text"
                  placeholder="Seleção"
                  value={formData.selection}
                  onChange={(e) =>
                    setFormData({ ...formData, selection: e.target.value })
                  }
                  className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5"
                />

                <select
                  value={formData.method}
                  onChange={(e) =>
                    setFormData({ ...formData, method: e.target.value })
                  }
                  className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5"
                >
                  <option value="">Método</option>
                  {methods.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <select
                  value={formData.strategy}
                  onChange={(e) =>
                    setFormData({ ...formData, strategy: e.target.value })
                  }
                  className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 md:col-span-2"
                >
                  <option value="">Estratégia</option>
                  {customStrategies.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ODDS + STAKE */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Odd"
                  value={formData.odds}
                  onChange={(e) =>
                    setFormData({ ...formData, odds: e.target.value })
                  }
                  className="bg-slate-950 border border-slate-700 text-white font-mono rounded-lg px-4 py-2.5"
                />

                <input
                  type="number"
                  placeholder={
                    displayMode === 'units'
                      ? 'Ex: 1.5 unidades'
                      : 'Valor stake'
                  }
                  value={formData.stake}
                  onChange={(e) =>
                    setFormData({ ...formData, stake: e.target.value })
                  }
                  className="bg-slate-950 border border-slate-700 text-white font-mono rounded-lg px-4 py-2.5"
                />
              </div>

              {/* RESULT */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 text-sm">
                  Resultado Estimado
                </span>
                <span
                  className={`font-mono font-bold ${
                    resultValue > 0
                      ? 'text-emerald-500'
                      : resultValue < 0
                      ? 'text-red-500'
                      : 'text-slate-200'
                  }`}
                >
                  {currency} {resultValue.toFixed(2)}
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl"
              >
                {betToEdit ? 'Atualizar Aposta' : 'Salvar Aposta'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewBetModal;
