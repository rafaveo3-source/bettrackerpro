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
  Percent,
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
    displayMode,
    unitSize,
    isPro, 
    activeBankrollId,
    
    // Dados Globais
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
  
  // Modos de Seleção
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const [selectedHomeTeam, setSelectedHomeTeam] = useState('');
  const [selectedAwayTeam, setSelectedAwayTeam] = useState('');

  // Modo de Entrada Principal (Manual vs Scanner)
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
      const league = globalLeagues.find(l => l.id === selectedLeagueId);
      if (league) {
        setFormData(prev => ({ ...prev, sport: league.sport }));
      }
    }
  }, [selectedLeagueId]);

  useEffect(() => {
    if (!isManualMode && selectedHomeTeam && selectedAwayTeam) {
      const home = currentLeagueTeams.find(t => t.id === selectedHomeTeam)?.name || '';
      const away = currentLeagueTeams.find(t => t.id === selectedAwayTeam)?.name || '';
      if (home && away) {
        setFormData(prev => ({ ...prev, event: `${home} vs ${away}` }));
      }
    }
  }, [selectedHomeTeam, selectedAwayTeam, isManualMode, currentLeagueTeams]);

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
        cashoutValue: (betToEdit as any).cashoutValue?.toString() || ''
      });
      
      setIsManualMode(true);
      setEntryMode('manual'); 
      
      const isCustomMarket = !availableMarkets.some(m => m.name === betToEdit.market);
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
  }, [betToEdit, isOpen, userLeagues.length, isPro]);

  const handleScanComplete = (scannedData: any) => {
    setFormData(prev => ({
        ...prev,
        event: scannedData.match || prev.event,
        market: scannedData.market || prev.market,
        selection: scannedData.selection || prev.selection,
        odds: scannedData.odd ? scannedData.odd.toString() : prev.odds,
        stake: scannedData.stake ? scannedData.stake.toString() : prev.stake,
        status: (scannedData.status as BetStatus) || 'pending',
        cashoutValue: (scannedData.status === 'half-won' || scannedData.status === 'half-lost' || scannedData.status === 'cashout') && scannedData.return 
            ? scannedData.return.toString() 
            : ''
    }));

    if (scannedData.market && !availableMarkets.some(m => m.name === scannedData.market)) {
        setFormData(prev => ({ ...prev, market: '__custom' }));
        setManualMarket(scannedData.market);
    }

    setIsManualMode(true);
    setEntryMode('manual');
    if (setToast) {
       setToast({ type: 'success', message: `Dados extraídos com sucesso de ${scannedData.bookmaker || 'bilhete'}. Revise antes de salvar.` });
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!activeBankrollId) {
      setError('Crie ou selecione um portfólio (banca) antes de registrar uma entrada.');
      return;
    }

    if (!formData.event || !formData.odds || !formData.stake) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (formData.market === '__custom' && !manualMarket) {
      setError('Digite o nome do mercado personalizado.');
      return;
    }

    if (formData.status === 'cashout' && !formData.cashoutValue) {
      setError('Informe o valor do Cashout.');
      return;
    }

    let stakeValue = parseFloat(formData.stake);

    if (stakeValue < 0) {
      setError('A exposição não pode ser negativa.');
      return;
    }

    const finalMarket = formData.market === '__custom' ? manualMarket : formData.market;

    const payload = {
      ...formData,
      market: finalMarket,
      odds: parseFloat(formData.odds),
      stake: stakeValue,
      cashoutValue: formData.cashoutValue ? parseFloat(formData.cashoutValue) : 0
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
    let stake = parseFloat(formData.stake) || 0;
    const odds = parseFloat(formData.odds) || 0;
    const cashout = parseFloat(formData.cashoutValue) || 0;

    if (!stake || !odds) return 0;

    switch (formData.status) {
      case 'won': return stake * odds - stake;
      case 'lost': return -stake;
      case 'half-won': return (stake * odds - stake) / 2;
      case 'half-lost': return -stake / 2;
      case 'cashout': return cashout - stake;
      case 'void':
      case 'refunded': return 0;
      default: return stake * odds - stake;
    }
  };

  const resultValue = calculateResult();

  // 🔥 Design System Apple PRO: Input Class 🔥
  const inputStyle = 'w-full bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] text-slate-900 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors font-medium text-sm placeholder:text-slate-400 dark:placeholder:text-[#636366] disabled:opacity-50 disabled:cursor-not-allowed';

  const myActiveLeagues = globalLeagues.filter(l => userLeagues.includes(l.id));

  const statusOptions = [
    { id: 'pending', label: 'Aberto', icon: Clock, color: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white border-slate-300 dark:border-slate-600' },
    { id: 'won', label: 'Lucro', icon: CheckCircle2, color: 'bg-emerald-500 text-white border-emerald-600' },
    { id: 'half-won', label: '½ Lucro', icon: CheckCircle2, color: 'bg-emerald-500/80 text-white border-emerald-500/50' },
    { id: 'lost', label: 'Prejuízo', icon: XCircle, color: 'bg-red-500 text-white border-red-600' },
    { id: 'half-lost', label: '½ Prej', icon: XCircle, color: 'bg-red-500/80 text-white border-red-500/50' },
    { id: 'cashout', label: 'Cashout', icon: DollarSign, color: 'bg-indigo-500 text-white border-indigo-600' },
    { id: 'refunded', label: 'Devolvido', icon: Ban, color: 'bg-slate-500 text-white border-slate-600' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 font-sans"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] w-full max-w-3xl sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col relative overflow-hidden h-[90vh] sm:h-auto sm:max-h-[90vh]"
          >
            {/* CABEÇALHO FIXO */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#2C2C2E] flex flex-col gap-3 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md shrink-0 z-20">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    {betToEdit ? 'Editar Operação' : 'Nova Operação'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="bg-slate-100 dark:bg-[#2C2C2E] p-2 rounded-full text-slate-500 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* TAB SELECTOR: Manual vs Scanner */}
              {!betToEdit && isPro && (
                <div className="flex bg-slate-100 dark:bg-[#000000] p-1 rounded-xl border border-slate-200 dark:border-[#2C2C2E]">
                  <button
                    onClick={() => setEntryMode('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                      entryMode === 'manual'
                        ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-[#3A3A3C]'
                        : 'text-slate-500 dark:text-[#8E8E93] hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Edit3 size={14} /> Digitação
                  </button>
                  <button
                    onClick={() => setEntryMode('scanner')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                      entryMode === 'scanner'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 dark:text-[#8E8E93] hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Camera size={14} /> Scanner IA
                  </button>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs flex items-center gap-2 font-bold"
                  >
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ÁREA DE SCROLL */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {entryMode === 'scanner' ? (
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
                        <TicketScanner onScanComplete={handleScanComplete} />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                      <div className="p-5 overflow-y-auto flex-1 space-y-6 custom-scrollbar">

                        {/* STATUS DA APOSTA */}
                        <div className="space-y-3">
                          <label className="text-[10px] uppercase text-slate-500 dark:text-[#8E8E93] font-bold tracking-widest ml-1">
                            Status da Operação
                          </label>
                          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                            {statusOptions.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, status: opt.id as BetStatus })}
                                className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1.5 border-2 ${
                                  formData.status === opt.id
                                    ? `${opt.color} shadow-sm scale-[1.02]`
                                    : 'bg-white dark:bg-[#1C1C1E] text-slate-500 dark:text-[#8E8E93] border-transparent hover:border-slate-200 dark:hover:border-[#3A3A3C]'
                                }`}
                              >
                                <opt.icon size={16} />
                                <span className="whitespace-nowrap">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {!betToEdit && myActiveLeagues.length > 0 && isPro && (
                          <div className="flex justify-end">
                              <button 
                                type="button"
                                onClick={() => setIsManualMode(!isManualMode)}
                                className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 transition-colors px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/20 uppercase tracking-wider"
                              >
                                {isManualMode ? 'Usar Seleção Inteligente' : 'Digitar Manualmente'}
                                <ArrowRightLeft size={12} />
                              </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                          <div className="sm:col-span-12 grid grid-cols-1 sm:grid-cols-12 gap-4 p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200 dark:border-[#2C2C2E] shadow-sm">
                              
                              <div className="sm:col-span-5 space-y-2">
                                <label className="text-[10px] uppercase text-slate-500 dark:text-[#8E8E93] font-bold tracking-widest ml-1 flex items-center gap-1">
                                  <Trophy size={12} /> Competição
                                  {!isPro && <span className="text-[9px] text-indigo-500 flex items-center gap-1 ml-auto"><Lock size={10}/> Auto (PRO)</span>}
                                </label>
                                
                                {!isManualMode && myActiveLeagues.length > 0 && isPro ? (
                                  <select
                                    value={selectedLeagueId}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === 'manual') setIsManualMode(true);
                                      else setSelectedLeagueId(val);
                                    }}
                                    className={`${inputStyle} appearance-none`}
                                  >
                                    <option value="">Selecione...</option>
                                    {myActiveLeagues.map(l => (
                                      <option key={l.id} value={l.id}>{l.name} ({l.country})</option>
                                    ))}
                                    <option value="manual" className="font-bold text-indigo-500">+ Digitar Manualmente</option>
                                  </select>
                                ) : (
                                  <select
                                     value={formData.sport}
                                     onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                                     className={`${inputStyle} appearance-none`}
                                  >
                                     <option>Futebol</option>
                                     <option>Basquete</option>
                                     <option>Tênis</option>
                                     <option>eSports</option>
                                     <option>MMA</option>
                                     <option>Vôlei</option>
                                     <option>Outros</option>
                                  </select>
                                )}
                              </div>

                              <div className="sm:col-span-7 space-y-2">
                                <label className="text-[10px] uppercase text-slate-500 dark:text-[#8E8E93] font-bold tracking-widest ml-1 flex items-center gap-1">
                                  <Shield size={12} /> Evento
                                </label>

                                {!isManualMode && selectedLeagueId && selectedLeagueId !== 'manual' && isPro ? (
                                   <div className="flex gap-2 items-center">
                                      <select 
                                        value={selectedHomeTeam}
                                        onChange={(e) => setSelectedHomeTeam(e.target.value)}
                                        className={`${inputStyle} text-xs px-3 appearance-none`}
                                        disabled={isLoadingTeams}
                                      >
                                        <option value="">Casa</option>
                                        {currentLeagueTeams.map(t => (
                                          <option key={t.id} value={t.id} className={userTeams.includes(t.id) ? 'font-bold text-indigo-500' : ''}>
                                             {t.name} {userTeams.includes(t.id) ? '★' : ''}
                                          </option>
                                        ))}
                                      </select>
                                      <span className="text-slate-400 font-bold text-xs">VS</span>
                                      <select 
                                        value={selectedAwayTeam}
                                        onChange={(e) => setSelectedAwayTeam(e.target.value)}
                                        className={`${inputStyle} text-xs px-3 appearance-none`}
                                        disabled={isLoadingTeams}
                                      >
                                        <option value="">Visitante</option>
                                        {currentLeagueTeams.map(t => (
                                          <option key={t.id} value={t.id} className={userTeams.includes(t.id) ? 'font-bold text-indigo-500' : ''}>
                                             {t.name} {userTeams.includes(t.id) ? '★' : ''}
                                          </option>
                                        ))}
                                      </select>
                                   </div>
                                ) : (
                                  <input
                                    type="text"
                                    value={formData.event}
                                    onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                                    placeholder={!isPro ? "Ex: Fla vs Pal" : "Ex: Flamengo vs Palmeiras"}
                                    className={inputStyle}
                                  />
                                )}
                              </div>
                          </div>

                          <div className="sm:col-span-6 space-y-2">
                            <label className="text-[10px] uppercase text-slate-500 dark:text-[#8E8E93] font-bold tracking-widest ml-1 flex justify-between">
                                Mercado
                                {!isPro && availableMarkets.length === 0 && <span className="text-[9px] text-indigo-500 flex items-center gap-1"><Lock size={10}/> Custom (PRO)</span>}
                            </label>
                            <select
                              value={formData.market}
                              onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                              className={`${inputStyle} appearance-none`}
                            >
                              <option value="">Selecione...</option>
                              {availableMarkets.map((m) => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                              ))}
                              <option value="__custom">Outro (Digitar)</option>
                            </select>
                            
                            {formData.market === '__custom' && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                                <input
                                  type="text"
                                  value={manualMarket}
                                  onChange={(e) => setManualMarket(e.target.value)}
                                  placeholder="Nome do mercado"
                                  className={`${inputStyle} border-indigo-500/50`}
                                  autoFocus
                                />
                              </motion.div>
                            )}
                          </div>

                          <div className="sm:col-span-6 space-y-2">
                            <label className="text-[10px] uppercase text-slate-500 dark:text-[#8E8E93] font-bold tracking-widest ml-1">Posição (Seleção)</label>
                            <input
                              type="text"
                              value={formData.selection}
                              onChange={(e) => setFormData({ ...formData, selection: e.target.value })}
                              placeholder="Ex: Over 2.5, Casa..."
                              className={inputStyle}
                            />
                          </div>

                          <div className="sm:col-span-6 space-y-2">
                            <label className="text-[10px] uppercase text-slate-500 dark:text-[#8E8E93] font-bold tracking-widest ml-1 flex justify-between">
                                Método Analítico
                                {!isPro && availableMethods.length === 0 && <span className="text-[9px] text-indigo-500 flex items-center gap-1"><Lock size={10}/> PRO</span>}
                            </label>
                            <select
                              value={formData.method}
                              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                              className={`${inputStyle} appearance-none`}
                              disabled={!isPro && availableMethods.length === 0}
                            >
                              <option value="">{(!isPro && availableMethods.length === 0) ? "Padrão" : "Opcional"}</option>
                              {availableMethods.map((m) => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-6 space-y-2">
                            <label className="text-[10px] uppercase text-slate-500 dark:text-[#8E8E93] font-bold tracking-widest ml-1 flex justify-between">
                                Plano de Gestão
                                {!isPro && <span className="text-[9px] text-indigo-500 flex items-center gap-1"><Lock size={10}/> PRO</span>}
                            </label>
                            <select
                              value={formData.strategy}
                              onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                              className={`${inputStyle} appearance-none ${!isPro ? 'opacity-50' : ''}`}
                              disabled={!isPro || availableStrategies.length === 0}
                            >
                              <option value="">{(!isPro) ? "Bloqueado (Upgrade para usar)" : "Opcional"}</option>
                              {availableStrategies.map((s) => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* DADOS FINANCEIROS */}
                          <div className="sm:col-span-12 border-t border-slate-200 dark:border-[#2C2C2E] pt-5 mt-2">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
                                
                                <div className="space-y-2">
                                  <label className="text-[10px] uppercase text-slate-500 dark:text-[#8E8E93] font-bold tracking-widest ml-1">Cotação (Odd)</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={formData.odds}
                                      onChange={(e) => setFormData({ ...formData, odds: e.target.value })}
                                      placeholder="1.85"
                                      className={`${inputStyle} pl-8 font-mono text-lg font-bold`}
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm font-mono">@</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[10px] uppercase text-slate-500 dark:text-[#8E8E93] font-bold tracking-widest ml-1 truncate">
                                    Exposição ({currency})
                                  </label>
                                  <input
                                    type="number"
                                    step="1"
                                    value={formData.stake}
                                    onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
                                    placeholder="100.00"
                                    className={`${inputStyle} font-mono text-lg font-bold`}
                                  />
                                </div>

                                {formData.status === 'cashout' && (
                                  <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-2 col-span-2"
                                  >
                                    <label className="text-[10px] uppercase text-indigo-600 dark:text-indigo-400 font-bold tracking-widest ml-1 flex items-center gap-1">
                                      <DollarSign size={12} /> Retorno (Cashout)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={formData.cashoutValue}
                                      onChange={(e) => setFormData({ ...formData, cashoutValue: e.target.value })}
                                      placeholder="Valor sacado"
                                      className={`${inputStyle} border-indigo-500/50 text-indigo-600 dark:text-indigo-400 focus:border-indigo-500 font-mono text-lg font-bold`}
                                    />
                                  </motion.div>
                                )}
                              </div>
                          </div>
                        </div>
                      </div>

                      {/* RODAPÉ FIXO (Resultados e Botão de Salvar) */}
                      <div className="bg-slate-50 dark:bg-[#1C1C1E] border-t border-slate-200 dark:border-[#2C2C2E] p-5 shrink-0 mt-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        
                        <div className="w-full sm:w-auto flex flex-col items-center sm:items-start bg-white dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-5 py-3 shadow-sm">
                          <p className="text-slate-500 dark:text-[#8E8E93] text-[9px] font-bold uppercase tracking-widest">
                            {formData.status === 'pending' ? 'Potencial Estimado' : 'Resultado Consolidado'}
                          </p>
                          <div className={`text-2xl font-mono font-bold tracking-tight ${
                            resultValue > 0 ? 'text-emerald-600 dark:text-emerald-400' : resultValue < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
                          }`}>
                            {resultValue > 0 ? '+' : ''}{currency} {resultValue.toFixed(2)}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 font-bold py-4 px-8 rounded-xl transition-all active:scale-95 text-xs tracking-widest flex items-center justify-center gap-2 uppercase shadow-sm"
                        >
                          {betToEdit ? (
                            <><Save size={16} /> Atualizar Registro</>
                          ) : (
                            <><CheckCircle2 size={16} /> Salvar Operação</>
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