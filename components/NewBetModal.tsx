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
  }, [isOpen, globalLeagues.length, fetchLeagues]);

  useEffect(() => {
    if (selectedLeagueId && selectedLeagueId !== 'manual') {
      fetchLeagueTeams(selectedLeagueId);

      const league = globalLeagues.find(
        (l) => l.id === selectedLeagueId
      );

      if (league) {
        setFormData((prev) => ({
          ...prev,
          sport: league.sport
        }));
      }
    }
  }, [selectedLeagueId, fetchLeagueTeams, globalLeagues]);

  useEffect(() => {
    if (
      !isManualMode &&
      selectedHomeTeam &&
      selectedAwayTeam
    ) {
      const home =
        currentLeagueTeams.find(
          (t) => t.id === selectedHomeTeam
        )?.name || '';

      const away =
        currentLeagueTeams.find(
          (t) => t.id === selectedAwayTeam
        )?.name || '';

      if (home && away) {
        setFormData((prev) => ({
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
        (m) => m.name === betToEdit.market
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
      setIsManualMode(!isPro || userLeagues.length === 0);
      setSelectedLeagueId('');
      setSelectedHomeTeam('');
      setSelectedAwayTeam('');
    }
  }, [
    betToEdit,
    isOpen,
    availableMarkets,
    isPro,
    userLeagues.length
  ]);

  const handleScanComplete = (scannedData: any) => {
    setFormData((prev) => ({
      ...prev,
      event: scannedData.match || prev.event,
      market: scannedData.market || prev.market,
      selection: scannedData.selection || prev.selection,
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
        ) &&
        scannedData.return
          ? scannedData.return.toString()
          : ''
    }));

    if (
      scannedData.market &&
      !availableMarkets.some(
        (m) => m.name === scannedData.market
      )
    ) {
      setFormData((prev) => ({
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
        message: `Dados extraídos com sucesso de ${
          scannedData.bookmaker || 'bilhete'
        }. Revise antes de salvar.`
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
      setError('Informe o valor do cashout.');
      return;
    }

    const stakeValue = parseFloat(formData.stake);

    if (stakeValue < 0) {
      setError(
        'A exposição não pode ser negativa.'
      );
      return;
    }

    const payload = {
      ...formData,
      market:
        formData.market === '__custom'
          ? manualMarket
          : formData.market,
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
    'w-full bg-[#1C1C1E] border border-[#3A3A3C] text-white rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 transition-colors text-base font-semibold placeholder:text-[#636366]';

  const myActiveLeagues = globalLeagues.filter(
    (l) => userLeagues.includes(l.id)
  );

  const statusOptions = [
    {
      id: 'pending',
      label: 'Aberto',
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
      label: 'Prejuízo',
      icon: XCircle
    },
    {
      id: 'half-lost',
      label: '½ Prej.',
      icon: XCircle
    },
    {
      id: 'cashout',
      label: 'Cashout',
      icon: DollarSign
    },
    {
      id: 'refunded',
      label: 'Devolvido',
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
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center"
        >
          <motion.div
            initial={{
              scale: 0.95,
              opacity: 0,
              y: 40
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0
            }}
            exit={{
              scale: 0.95,
              opacity: 0,
              y: 40
            }}
            transition={{
              type: 'spring',
              damping: 24,
              stiffness: 260
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl h-[95vh] bg-[#000000] border border-[#2C2C2E] sm:rounded-[2rem] rounded-t-[2rem] overflow-hidden flex flex-col shadow-2xl"
          >
            {/* HEADER */}
            <div className="px-6 py-5 border-b border-[#2C2C2E] bg-black/70 backdrop-blur-md shrink-0 z-20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {betToEdit
                      ? 'Editar Operação'
                      : 'Nova Operação'}
                  </h2>

                  <p className="text-[#8E8E93] text-sm mt-1">
                    Diário operacional profissional
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-[#1C1C1E] border border-[#3A3A3C] flex items-center justify-center text-[#8E8E93] hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {!betToEdit && isPro && (
                <div className="flex mt-5 bg-[#1C1C1E] p-1 rounded-2xl border border-[#2C2C2E]">
                  <button
                    type="button"
                    onClick={() =>
                      setEntryMode('manual')
                    }
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                      entryMode === 'manual'
                        ? 'bg-white text-black'
                        : 'text-[#8E8E93]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Edit3 size={16} />
                      Manual
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEntryMode('scanner')
                    }
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                      entryMode === 'scanner'
                        ? 'bg-indigo-600 text-white'
                        : 'text-[#8E8E93]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Camera size={16} />
                      Scanner IA
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
                    className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-hidden">
              {entryMode === 'scanner' ? (
                <div className="p-6 overflow-y-auto h-full">
                  <TicketScanner
                    onScanComplete={
                      handleScanComplete
                    }
                  />
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col h-full"
                >
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* STATUS */}
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[#8E8E93] font-bold mb-3 block">
                        Status da Operação
                      </label>

                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
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
                            className={`rounded-2xl py-3 border transition-all flex flex-col items-center gap-1 text-[11px] font-bold ${
                              formData.status ===
                              opt.id
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-[#1C1C1E] border-[#2C2C2E] text-[#8E8E93]'
                            }`}
                          >
                            <opt.icon size={16} />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* LEAGUE */}
                    {!betToEdit &&
                      myActiveLeagues.length >
                        0 &&
                      isPro && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setIsManualMode(
                                !isManualMode
                              )
                            }
                            className="text-xs text-indigo-400 font-bold flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl"
                          >
                            {isManualMode
                              ? 'Seleção Inteligente'
                              : 'Digitação Manual'}
                            <ArrowRightLeft
                              size={14}
                            />
                          </button>
                        </div>
                      )}

                    {/* SPORT + EVENT */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      <div className="sm:col-span-4">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[#8E8E93] font-bold mb-2 block">
                          Competição
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
                          <option>
                            Futebol
                          </option>
                          <option>
                            Basquete
                          </option>
                          <option>Tênis</option>
                          <option>
                            eSports
                          </option>
                          <option>MMA</option>
                          <option>Vôlei</option>
                          <option>
                            Outros
                          </option>
                        </select>
                      </div>

                      <div className="sm:col-span-8">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[#8E8E93] font-bold mb-2 block">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[#8E8E93] font-bold mb-2 block">
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
                            placeholder="Nome do mercado"
                            className={`${inputStyle} mt-3`}
                          />
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[#8E8E93] font-bold mb-2 block">
                          Seleção
                        </label>

                        <input
                          type="text"
                          value={formData.selection}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              selection:
                                e.target.value
                            })
                          }
                          placeholder="Over 2.5"
                          className={inputStyle}
                        />
                      </div>
                    </div>

                    {/* ODDS + STAKE */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[#8E8E93] font-bold mb-2 block">
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
                          className={`${inputStyle} font-mono text-xl`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[#8E8E93] font-bold mb-2 block">
                          Exposição ({currency})
                        </label>

                        <input
                          type="number"
                          step="1"
                          value={formData.stake}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              stake:
                                e.target.value
                            })
                          }
                          className={`${inputStyle} font-mono text-xl`}
                        />
                      </div>
                    </div>

                    {/* CASHOUT */}
                    {formData.status ===
                      'cashout' && (
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold mb-2 block">
                          Valor Cashout
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
                          className={`${inputStyle} border-indigo-500/30`}
                        />
                      </div>
                    )}
                  </div>

                  {/* FOOTER */}
                  <div className="border-t border-[#2C2C2E] bg-black/80 backdrop-blur-md p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-2xl px-5 py-4 w-full sm:w-auto">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#8E8E93] font-bold mb-1">
                        Resultado
                      </p>

                      <div
                        className={`text-3xl font-black font-mono ${
                          resultValue > 0
                            ? 'text-emerald-400'
                            : resultValue < 0
                            ? 'text-red-400'
                            : 'text-white'
                        }`}
                      >
                        {resultValue > 0
                          ? '+'
                          : ''}
                        {currency}{' '}
                        {resultValue.toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-[320px] bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 rounded-2xl transition-all text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20"
                    >
                      {betToEdit ? (
                        <>
                          <Save size={18} />
                          Atualizar Registro
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