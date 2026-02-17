import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertCircle,
  Save,
  Clock,
  Trophy,
  Ban,
  CornerDownRight,
  Divide
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
    'w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm md:text-base focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all';

  const getStatusClasses = (status: BetStatus) => {
    const active = formData.status === status;

    const base =
      'flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs md:text-sm font-semibold transition-all duration-200';

    if (!active) return `${base} border-slate-700 text-slate-400 hover:border-slate-500`;

    switch (status) {
      case 'won':
      case 'half-won':
        return `${base} bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10`;
      case 'lost':
      case 'half-lost':
        return `${base} bg-red-500/20 border-red-500 text-red-400 shadow-lg shadow-red-500/10`;
      case 'cashout':
        return `${base} bg-blue-500/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10`;
      case 'refunded':
        return `${base} bg-slate-600/20 border-slate-500 text-slate-300`;
      default:
        return `${base} bg-yellow-500/20 border-yellow-500 text-yellow-400`;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
          >
            {/* HEADER */}
            <div className="px-5 md:px-8 py-4 md:py-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg md:text-2xl font-black text-white tracking-tight">
                  {betToEdit ? 'Editar Aposta' : 'Nova Aposta'}
                </h2>
                <p className="text-slate-500 text-xs md:text-sm mt-1">
                  Registro avançado de entrada
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-white transition"
              >
                <X size={22} />
              </button>
            </div>

            {/* BODY */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-5 md:p-8 space-y-8"
            >
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* STATUS */}
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold mb-3">
                  Status da Aposta
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[
                    { key: 'pending', label: 'Pendente', icon: Clock },
                    { key: 'won', label: 'Green', icon: Trophy },
                    { key: 'lost', label: 'Red', icon: AlertCircle },
                    { key: 'half-won', label: 'Meio Green', icon: Divide },
                    { key: 'half-lost', label: 'Meio Red', icon: Divide },
                    { key: 'refunded', label: 'Reembolso', icon: Ban },
                    { key: 'cashout', label: 'Cashout', icon: CornerDownRight }
                  ].map(({ key, label, icon: Icon }) => (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={key}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, status: key as BetStatus })
                      }
                      className={getStatusClasses(key as BetStatus)}
                    >
                      <Icon size={14} />
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {formData.status === 'cashout' && (
                <motion.input
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  type="number"
                  step="0.01"
                  placeholder="Valor do Cashout"
                  value={formData.cashoutValue}
                  onChange={(e) =>
                    setFormData({ ...formData, cashoutValue: e.target.value })
                  }
                  className={inputStyle}
                />
              )}

              {/* RESULT */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex justify-between items-center">
                <p className="text-slate-500 text-sm">Resultado Estimado</p>
                <div
                  className={`text-xl md:text-2xl font-mono font-bold ${
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
