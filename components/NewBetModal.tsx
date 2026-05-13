import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertCircle,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  DollarSign,
  Trophy,
  Shield,
  ArrowRightLeft,
  Lock,
  Camera,
  Edit3
} from 'lucide-react';

import { useBetStore, BetStatus, Bet } from '../store/useBetStore';
import TicketScanner from './TicketScanner';

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
    unitSize,
    isPro,
    activeBankrollId,

    globalLeagues,
    userLeagues,
    currentLeagueTeams,
    userTeams,
    fetchLeagues,
    fetchLeagueTeams,
    isLoadingTeams,
    setToast
  } = useBetStore();

  const [error, setError] = useState('');
  const [manualMarket, setManualMarket] = useState('');

  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const [selectedHomeTeam, setSelectedHomeTeam] = useState('');
  const [selectedAwayTeam, setSelectedAwayTeam] = useState('');

  const [entryMode, setEntryMode] = useState<'manual' | 'scanner'>('manual');

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

  const availableStrategies = isPro ? customStrategies : [];
  const availableMarkets = isPro ? customMarkets : [];
  const availableMethods = isPro ? methods : [];

  useEffect(() => {
    if (isOpen && globalLeagues.length === 0) {
      fetchLeagues();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedLeagueId && selectedLeagueId !== 'manual') {
      fetchLeagueTeams(selectedLeagueId);

      const league = globalLeagues.find(
        l => l.id === selectedLeagueId
      );

      if (league) {
        setFormData(prev => ({
          ...prev,
          sport: league.sport
        }));
      }
    }
  }, [selectedLeagueId]);

  useEffect(() => {
    if (
      !isManualMode &&
      selectedHomeTeam &&
      selectedAwayTeam
    ) {
      const home =
        currentLeagueTeams.find(
          t => t.id === selectedHomeTeam
        )?.name || '';

      const away =
        currentLeagueTeams.find(
          t => t.id === selectedAwayTeam
        )?.name || '';

      if (home && away) {
        setFormData(prev => ({
          ...prev,
          event: `${home} vs ${away}`
        }));
      }
    }
  }, [
    selectedHomeTeam,
    selectedAwayTeam,
    isManualMode,
    currentLeagueTeams
  ]);

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
        strategy: betToEdit.strategy || '',
        cashoutValue:
          (betToEdit as any).cashoutValue?.toString() || ''
      });

      setIsManualMode(true);
      setEntryMode('manual');

      const isCustomMarket = !availableMarkets.some(
        m => m.name === betToEdit.market
      );

      if (isCustomMarket && betToEdit.market) {
        setManualMarket(betToEdit.market);
      }
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
      setEntryMode('manual');

      setIsManualMode(
        !isPro || userLeagues.length === 0
      );

      setSelectedLeagueId('');
      setSelectedHomeTeam('');
      setSelectedAwayTeam('');
    }
  }, [betToEdit, isOpen]);

  const handleScanComplete = (scannedData: any) => {
    setFormData(prev => ({
      ...prev,
      event: scannedData.match || prev.event,
      market: scannedData.market || prev.market,
      selection:
        scannedData.selection || prev.selection,
      odds: scannedData.odd
        ? scannedData.odd.toString()
        : prev.odds,
      stake: scannedData.stake
        ? scannedData.stake.toString()
        : prev.stake,
      status:
        (scannedData.status as BetStatus) || 'pending',
      cashoutValue:
        (
          scannedData.status === 'half-won' ||
          scannedData.status === 'half-lost' ||
          scannedData.status === 'cashout'
        ) && scannedData.return
          ? scannedData.return.toString()
          : ''
    }));

    if (
      scannedData.market &&
      !availableMarkets.some(
        m => m.name === scannedData.market
      )
    ) {
      setFormData(prev => ({
        ...prev,
        market: '__custom'
      }));

      setManualMarket(scannedData.market);
    }

    setIsManualMode(true);
    setEntryMode('manual');

    if (setToast) {
      setToast({
        type: 'success',
        message:
          'Dados extraídos com sucesso. Revise antes de salvar.'
      });
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setError('');

    if (!activeBankrollId) {
      setError(
        'Crie ou selecione um portfólio antes de registrar uma operação.'
      );
      return;
    }

    if (
      !formData.event ||
      !formData.odds ||
      !formData.stake
    ) {
      setError(
        'Preencha todos os campos obrigatórios.'
      );
      return;
    }

    if (
      formData.market === '__custom' &&
      !manualMarket
    ) {
      setError(
        'Digite o nome do mercado personalizado.'
      );
      return;
    }

    if (
      formData.status === 'cashout' &&
      !formData.cashoutValue
    ) {
      setError(
        'Informe o valor do Cashout.'
      );
      return;
    }

    const stakeValue = parseFloat(formData.stake);

    if (stakeValue < 0) {
      setError(
        'A exposição não pode ser negativa.'
      );
      return;
    }

    const finalMarket =
      formData.market === '__custom'
        ? manualMarket
        : formData.market;

    const payload = {
      ...formData,
      market: finalMarket,
      odds: parseFloat(formData.odds),
      stake: stakeValue,
      cashoutValue: formData.cashoutValue
        ? parseFloat(formData.cashoutValue)
        : 0
    };

    let success = false;

    if (betToEdit) {
      await updateBet(betToEdit.id, payload);
      success = true;
    } else {
      success = await addBet(payload);
    }

    if (success) {
      onClose();
    }
  };

  const calculateResult = () => {
    const stake =
      parseFloat(formData.stake) || 0;

    const odds =
      parseFloat(formData.odds) || 0;

    const cashout =
      parseFloat(formData.cashoutValue) || 0;

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
    'w-full h-14 bg-[#050505] border border-white/10 rounded-2xl px-5 text-white text-sm font-semibold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-600';

  const myActiveLeagues = globalLeagues.filter(
    l => userLeagues.includes(l.id)
  );

  const statusOptions = [
    {
      id: 'pending',
      label: 'Aberta',
      icon: Clock
    },
    {
      id: 'won',
      label: 'Lucro',
      icon: CheckCircle2
    },
    {
      id: 'half-won',
      label: '½ Lucro',
      icon: CheckCircle2
    },
    {
      id: 'lost',
      label: 'Loss',
      icon: XCircle
    },
    {
      id: 'half-lost',
      label: '½ Loss',
      icon: XCircle
    },
    {
      id: 'cashout',
      label: 'Cashout',
      icon: DollarSign
    },
    {
      id: 'refunded',
      label: 'Void',
      icon: Ban
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6"
        >
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
              scale: 0.98
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.98
            }}
            transition={{
              type: 'spring',
              damping: 24,
              stiffness: 280
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-3xl h-[92vh] md:h-auto md:max-h-[95vh] bg-[#000000] border border-white/10 rounded-t-[2rem] md:rounded-[2rem] overflow-hidden flex flex-col shadow-2xl font-sans"
          >
            {/* HEADER */}
            <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-md border-b border-white/5 px-6 py-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {betToEdit
                      ? 'Editar Operação'
                      : 'Nova Operação'}
                  </h2>

                  <p className="text-slate-500 text-sm mt-1 font-medium">
                    Registro operacional avançado
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="w-11 h-11 rounded-2xl bg-[#111113] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {!betToEdit && isPro && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEntryMode('manual')
                    }
                    className={`h-12 rounded-2xl text-xs font-black uppercase tracking-[0.14em] transition-all ${
                      entryMode === 'manual'
                        ? 'bg-white text-black'
                        : 'bg-[#111113] text-slate-400 border border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Edit3 size={14} />
                      Manual
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEntryMode('scanner')
                    }
                    className={`h-12 rounded-2xl text-xs font-black uppercase tracking-[0.14em] transition-all ${
                      entryMode === 'scanner'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#111113] text-slate-400 border border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Camera size={14} />
                      Scanner
                    </div>
                  </button>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0
                    }}
                    animate={{
                      opacity: 1,
                      height: 'auto'
                    }}
                    exit={{
                      opacity: 0,
                      height: 0
                    }}
                    className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm font-semibold flex items-center gap-3"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-hidden">
              {entryMode === 'scanner' ? (
                <div className="h-full overflow-y-auto p-6">
                  <TicketScanner
                    onScanComplete={
                      handleScanComplete
                    }
                  />
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="h-full flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* STATUS */}
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">
                        Status Operacional
                      </label>

                      <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                        {statusOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                status:
                                  opt.id as BetStatus
                              })
                            }
                            className={`h-16 rounded-2xl border text-[10px] font-black uppercase tracking-wide transition-all flex flex-col items-center justify-center gap-1 ${
                              formData.status === opt.id
                                ? 'bg-emerald-500 text-black border-emerald-400'
                                : 'bg-[#0B0B0C] border-white/5 text-slate-500 hover:border-white/10'
                            }`}
                          >
                            <opt.icon size={14} />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* EVENT */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">
                          Esporte
                        </label>

                        <select
                          value={formData.sport}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sport:
                                e.target.value
                            })
                          }
                          className={inputStyle}
                        >
                          <option>Futebol</option>
                          <option>Basquete</option>
                          <option>Tênis</option>
                          <option>MMA</option>
                          <option>eSports</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">
                          Evento
                        </label>

                        <input
                          type="text"
                          value={formData.event}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              event:
                                e.target.value
                            })
                          }
                          placeholder="Ex: Flamengo vs Palmeiras"
                          className={inputStyle}
                        />
                      </div>
                    </div>

                    {/* MARKET */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">
                          Mercado
                        </label>

                        <select
                          value={formData.market}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              market:
                                e.target.value
                            })
                          }
                          className={inputStyle}
                        >
                          <option value="">
                            Selecione...
                          </option>

                          {availableMarkets.map(
                            (m) => (
                              <option
                                key={m.id}
                                value={m.name}
                              >
                                {m.name}
                              </option>
                            )
                          )}

                          <option value="__custom">
                            Outro
                          </option>
                        </select>

                        {formData.market ===
                          '__custom' && (
                          <input
                            type="text"
                            value={manualMarket}
                            onChange={(e) =>
                              setManualMarket(
                                e.target.value
                              )
                            }
                            placeholder="Mercado personalizado"
                            className={`${inputStyle} border-emerald-500/30`}
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">
                          Posição
                        </label>

                        <input
                          type="text"
                          value={
                            formData.selection
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              selection:
                                e.target.value
                            })
                          }
                          placeholder="Ex: Over 2.5"
                          className={inputStyle}
                        />
                      </div>
                    </div>

                    {/* ODDS */}
                    <div className="grid md:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">
                          Odd
                        </label>

                        <input
                          type="number"
                          step="0.01"
                          value={formData.odds}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              odds:
                                e.target.value
                            })
                          }
                          placeholder="1.85"
                          className={inputStyle}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">
                          Exposição ({currency})
                        </label>

                        <input
                          type="number"
                          step="0.01"
                          value={formData.stake}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              stake:
                                e.target.value
                            })
                          }
                          placeholder="100"
                          className={inputStyle}
                        />
                      </div>

                      {formData.status ===
                        'cashout' && (
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-[0.18em] text-amber-500 font-black">
                            Cashout
                          </label>

                          <input
                            type="number"
                            step="0.01"
                            value={
                              formData.cashoutValue
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                cashoutValue:
                                  e.target.value
                              })
                            }
                            placeholder="Valor"
                            className={`${inputStyle} border-amber-500/30 text-amber-400`}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="sticky bottom-0 bg-black/95 backdrop-blur-md border-t border-white/5 p-6 flex flex-col md:flex-row items-center justify-between gap-5">
                    <div className="w-full md:w-auto bg-[#0B0B0C] border border-white/5 rounded-2xl px-5 py-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black mb-2">
                        Resultado Estimado
                      </p>

                      <div
                        className={`text-3xl font-black tracking-tight font-mono ${
                          resultValue > 0
                            ? 'text-emerald-400'
                            : resultValue < 0
                            ? 'text-red-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {resultValue > 0
                          ? '+'
                          : ''}
                        {currency}{' '}
                        {resultValue.toFixed(
                          2
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full md:w-[340px] h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.18em] text-sm transition-all shadow-[0_0_35px_rgba(16,185,129,0.25)] active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      {betToEdit ? (
                        <>
                          <Save size={18} />
                          Atualizar Operação
                        </>
                      ) : (
                        <>
                          <CheckCircle2
                            size={18}
                          />
                          Salvar Operação
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewBetModal;