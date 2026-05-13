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

  // 🔥 Design System Apple PRO: Estilos Flat & Sóbrios 🔥
  const inputStyle = 'w-full bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-[#636366] appearance-none';

  const myActiveLeagues = globalLeagues.filter(
    (l) => userLeagues.includes(l.id)
  );

  const statusOptions = [
    { id: 'pending', label: 'Aberto', icon: Clock, color: 'bg-slate-100 text-slate-900 dark:bg-[#1C1C1E] dark:text-white border-slate-200 dark:border-[#3A3A3C]' },
    { id: 'won', label: 'Lucro', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' },
    { id: 'half-won', label: '½ Lucro', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 opacity-80' },
    { id: 'lost', label: 'Prej.', icon: XCircle, color: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/30' },
    { id: 'half-lost', label: '½ Prej.', icon: XCircle, color: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/30 opacity-80' },
    { id: 'cashout', label: 'Cashout', icon: DollarSign, color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' },
    { id: 'refunded', label: 'Devolve', icon: Ban, color: 'bg-slate-100 text-slate-600 dark:bg-[#2C2C2E] dark:text-[#8E8E93] border-slate-200 dark:border-[#3A3A3C]' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center font-sans sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col relative overflow-hidden h-[95vh] sm:h-auto sm:max-h-[90vh]"
          >
            {/* HEADER */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-[#2C2C2E] flex flex-col gap-3 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md shrink-0 z-20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {betToEdit
                      ? 'Editar Operação'
                      : 'Nova Operação'}
                  </h2>
                  <p className="text-slate-500 dark:text-[#8E8E93] text-xs mt-0.5 font-medium">
                    Diário operacional
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#2C2C2E] flex items-center justify-center text-slate-500 dark:text-[#8E8E93] hover:bg-slate-200 dark:hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {!betToEdit && isPro && (
                <div className="flex bg-slate-100 dark:bg-[#000000] p-1 rounded-lg border border-slate-200 dark:border-[#2C2C2E] mt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setEntryMode('manual')
                    }
                    className={`flex-1 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all ${
                      entryMode === 'manual'
                        ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-transparent'
                        : 'text-slate-500 dark:text-[#8E8E93]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <Edit3 size={14} />
                      Manual
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEntryMode('scanner')
                    }
                    className={`flex-1 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all ${
                      entryMode === 'scanner'
                        ? 'bg-indigo-600 text-white shadow-sm border border-transparent'
                        : 'text-slate-500 dark:text-[#8E8E93]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <Camera size={14} />
                      Scanner IA
                    </div>
                  </button>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center gap-2 text-xs font-bold"
                  >
                    <AlertCircle size={14} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {entryMode === 'scanner' ? (
                <div className="p-4 sm:p-6 overflow-y-auto h-full custom-scrollbar">
                  <TicketScanner
                    onScanComplete={
                      handleScanComplete
                    }
                  />
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col h-full overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
                    
                    {/* STATUS */}
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] font-bold mb-2 block ml-1">
                        Status da Operação
                      </label>

                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {statusOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                status: opt.id as BetStatus
                              })
                            }
                            className={`rounded-lg py-2.5 border transition-all flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                              formData.status === opt.id
                                ? `${opt.color} shadow-sm`
                                : 'bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#3A3A3C] text-slate-500 dark:text-[#8E8E93] hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <opt.icon size={16} className="mb-0.5" />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* LIGA / EVENTO */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                      <div className="sm:col-span-4">
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] font-bold mb-2 block ml-1">
                          Competição
                        </label>

                        <select
                          value={formData.sport}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sport: e.target.value
                            })
                          }
                          className={inputStyle}
                        >
                          <option>Futebol</option>
                          <option>Basquete</option>
                          <option>Tênis</option>
                          <option>eSports</option>
                          <option>MMA</option>
                          <option>Vôlei</option>
                          <option>Outros</option>
                        </select>
                      </div>

                      <div className="sm:col-span-8">
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] font-bold mb-2 flex items-center justify-between ml-1">
                          Evento
                          {!isManualMode && myActiveLeagues.length > 0 && isPro && (
                              <button
                                type="button"
                                onClick={() => setIsManualMode(!isManualMode)}
                                className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1"
                              >
                                {isManualMode ? 'Smart' : 'Manual'}
                                <ArrowRightLeft size={10} />
                              </button>
                          )}
                        </label>

                        {!isManualMode && selectedLeagueId && selectedLeagueId !== 'manual' && isPro ? (
                            <div className="flex gap-2 items-center">
                              <select 
                                value={selectedHomeTeam}
                                onChange={(e) => setSelectedHomeTeam(e.target.value)}
                                className={inputStyle}
                                disabled={isLoadingTeams}
                              >
                                <option value="">Casa</option>
                                {currentLeagueTeams.map(t => (
                                  <option key={t.id} value={t.id}>
                                     {t.name}
                                  </option>
                                ))}
                              </select>
                              <span className="text-slate-400 font-bold text-xs">VS</span>
                              <select 
                                value={selectedAwayTeam}
                                onChange={(e) => setSelectedAwayTeam(e.target.value)}
                                className={inputStyle}
                                disabled={isLoadingTeams}
                              >
                                <option value="">Fora</option>
                                {currentLeagueTeams.map(t => (
                                  <option key={t.id} value={t.id}>
                                     {t.name}
                                  </option>
                                ))}
                              </select>
                           </div>
                        ) : (
                            <input
                              type="text"
                              value={formData.event}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  event: e.target.value
                                })
                              }
                              placeholder={!isPro ? "Ex: Fla vs Pal" : "Ex: Flamengo vs Palmeiras"}
                              className={inputStyle}
                            />
                        )}
                      </div>
                    </div>

                    {/* MARKET + SELECTION */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] font-bold mb-2 block ml-1">
                          Mercado
                        </label>

                        <select
                          value={formData.market}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              market: e.target.value
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
                            className={`${inputStyle} mt-3 border-indigo-500`}
                          />
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] font-bold mb-2 block ml-1">
                          Seleção
                        </label>

                        <input
                          type="text"
                          value={formData.selection}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              selection: e.target.value
                            })
                          }
                          placeholder="Over 2.5"
                          className={inputStyle}
                        />
                      </div>
                    </div>
                    
                    {/* MÉTODO E GESTÃO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] font-bold mb-2 flex items-center justify-between ml-1">
                                Método
                                {!isPro && availableMethods.length === 0 && <Lock size={10} className="text-indigo-500"/>}
                            </label>
                            <select
                              value={formData.method}
                              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                              className={inputStyle}
                              disabled={!isPro && availableMethods.length === 0}
                            >
                              <option value="">{(!isPro && availableMethods.length === 0) ? "Padrão" : "Opcional"}</option>
                              {availableMethods.map((m) => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                              ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] font-bold mb-2 flex items-center justify-between ml-1">
                                Plano de Gestão
                                {!isPro && <Lock size={10} className="text-indigo-500"/>}
                            </label>
                            <select
                              value={formData.strategy}
                              onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                              className={inputStyle}
                              disabled={!isPro || availableStrategies.length === 0}
                            >
                              <option value="">{(!isPro) ? "Bloqueado" : "Opcional"}</option>
                              {availableStrategies.map((s) => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                        </div>
                    </div>

                    {/* ODDS + STAKE */}
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-[#2C2C2E] pt-5 mt-2">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] font-bold mb-2 block ml-1">
                          Odd
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">@</span>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.odds}
                                onChange={(e) => setFormData({ ...formData, odds: e.target.value })}
                                placeholder="1.85"
                                className={`${inputStyle} pl-8 font-mono text-base`}
                            />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] font-bold mb-2 block ml-1 truncate">
                          Stake ({currency})
                        </label>

                        <input
                          type="number"
                          step="1"
                          value={formData.stake}
                          onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
                          placeholder="100.00"
                          className={`${inputStyle} font-mono text-base`}
                        />
                      </div>
                    </div>

                    {/* CASHOUT */}
                    {formData.status === 'cashout' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="col-span-2 pt-2"
                      >
                        <label className="text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold mb-2 block ml-1">
                          Retorno (Cashout)
                        </label>

                        <input
                          type="number"
                          step="0.01"
                          value={formData.cashoutValue}
                          onChange={(e) => setFormData({ ...formData, cashoutValue: e.target.value })}
                          placeholder="Valor sacado"
                          className={`${inputStyle} border-indigo-500 text-indigo-600 dark:text-indigo-400 font-mono text-base`}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* FOOTER */}
                  <div className="bg-slate-50 dark:bg-[#000000] border-t border-slate-200 dark:border-[#2C2C2E] p-5 shrink-0 mt-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    
                    <div className="w-full sm:w-auto flex flex-col items-center sm:items-start bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-5 py-3 shadow-sm">
                      <p className="text-slate-500 dark:text-[#8E8E93] text-[9px] font-bold uppercase tracking-widest mb-1">
                        {formData.status === 'pending' ? 'Potencial Estimado' : 'Resultado'}
                      </p>

                      <div
                        className={`text-xl font-bold font-mono tracking-tight ${
                          resultValue > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : resultValue < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {resultValue > 0 ? '+' : ''}{currency} {resultValue.toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white font-bold py-4 px-8 rounded-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
                    >
                      {betToEdit ? (
                        <>
                          <Save size={16} />
                          Atualizar
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          Salvar
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