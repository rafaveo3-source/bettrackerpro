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
import TicketScanner from './TicketScanner'; // Make sure the path is correct based on your folder structure

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
    setToast // Assuming setToast is available to show success/error messages
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
      setEntryMode('manual'); // Force manual mode when editing
      
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

  // Handler for when the scanner successfully extracts data
  const handleScanComplete = (scannedData: any) => {
    setFormData(prev => ({
        ...prev,
        event: scannedData.match || prev.event,
        market: scannedData.market || prev.market,
        odds: scannedData.odd ? scannedData.odd.toString() : prev.odds,
        stake: scannedData.stake ? scannedData.stake.toString() : prev.stake,
        status: (scannedData.status as BetStatus) || 'pending',
        // Attempt to auto-fill cashout if the status indicates it
        cashoutValue: (scannedData.status === 'half-won' || scannedData.status === 'half-lost' || scannedData.status === 'cashout') && scannedData.return 
            ? scannedData.return.toString() 
            : ''
    }));

    // If market is not in the predefined list, set it as custom
    if (scannedData.market && !availableMarkets.some(m => m.name === scannedData.market)) {
        setFormData(prev => ({ ...prev, market: '__custom' }));
        setManualMarket(scannedData.market);
    }

    setIsManualMode(true); // Force generic input mode since teams might not match exact DB IDs
    setEntryMode('manual'); // Switch to manual tab for review
    if (setToast) {
       setToast({ type: 'success', message: `Dados extraídos com sucesso de ${scannedData.bookmaker || 'bilhete'}. Por favor, revise antes de salvar.` });
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

    // 🔥 O STAKE AGORA É SEMPRE LIDO COMO MOEDA PURA
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
    // 🔥 CÁLCULO DE RESULTADO AGORA SEMPRE TRATA O INPUT COMO MOEDA
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

  const inputStyle =
    'w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed';

  const myActiveLeagues = globalLeagues.filter(l => userLeagues.includes(l.id));

  const statusOptions = [
    { id: 'pending', label: 'Em Aberto', icon: Clock, color: 'bg-slate-700 text-slate-200', activeRing: 'ring-slate-500' },
    { id: 'won', label: 'Lucro', icon: CheckCircle2, color: 'bg-emerald-500 text-black', activeRing: 'ring-emerald-400' },
    { id: 'half-won', label: '½ Lucro', icon: CheckCircle2, color: 'bg-emerald-500/40 text-emerald-100', activeRing: 'ring-emerald-400' },
    { id: 'lost', label: 'Prejuízo', icon: XCircle, color: 'bg-red-500 text-white', activeRing: 'ring-red-400' },
    { id: 'half-lost', label: '½ Prej.', icon: XCircle, color: 'bg-red-500/40 text-red-100', activeRing: 'ring-red-400' },
    { id: 'cashout', label: 'Cashout', icon: DollarSign, color: 'bg-amber-500 text-black', activeRing: 'ring-amber-400' },
    { id: 'refunded', label: 'Devolvido', icon: Ban, color: 'bg-slate-500 text-white', activeRing: 'ring-slate-400' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 w-full max-w-2xl max-h-[95vh] rounded-[2rem] shadow-2xl flex flex-col relative overflow-hidden"
          >
            {/* CABEÇALHO FIXO */}
            <div className="px-6 py-5 border-b border-slate-800 flex flex-col gap-4 bg-slate-900/80 backdrop-blur-md shrink-0 z-20">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    {betToEdit ? 'Editar Operação' : 'Nova Operação'}
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Preencha os detalhes do registro no diário de bordo
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="bg-slate-800/50 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* TAB SELECTOR: Manual vs Scanner */}
              {!betToEdit && isPro && (
                <div className="flex bg-slate-800/50 p-1 rounded-xl">
                  <button
                    onClick={() => setEntryMode('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                      entryMode === 'manual'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Edit3 size={14} /> Digitação Manual
                  </button>
                  <button
                    onClick={() => setEntryMode('scanner')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                      entryMode === 'scanner'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Camera size={14} /> Importação por Imagem
                  </button>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs md:text-sm flex items-center gap-3 font-medium"
                  >
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ÁREA DE SCROLL */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {entryMode === 'scanner' ? (
                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                         {/* We assume TicketScanner handles its own instructions and UI */}
                        <TicketScanner onScanComplete={handleScanComplete} />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                      <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">

                        <div className="space-y-3">
                          <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider ml-1">
                            Status da Operação
                          </label>
                          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                            {statusOptions.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, status: opt.id as BetStatus })}
                                className={`py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border-2 ${
                                  formData.status === opt.id
                                    ? `${opt.color} ${opt.activeRing} border-transparent shadow-md scale-105`
                                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <opt.icon size={14} />
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
                                className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1 transition-colors px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20"
                              >
                                {isManualMode ? 'Usar Seleção Inteligente' : 'Digitar Manualmente'}
                                <ArrowRightLeft size={12} />
                              </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                          <div className="sm:col-span-12 grid grid-cols-1 sm:grid-cols-12 gap-5 p-5 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                              <div className="sm:col-span-5 space-y-2">
                                <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider ml-1 flex items-center gap-1">
                                  <Trophy size={12} /> Competição
                                </label>
                                
                                {!isManualMode && myActiveLeagues.length > 0 && isPro ? (
                                  <select
                                    value={selectedLeagueId}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === 'manual') setIsManualMode(true);
                                      else setSelectedLeagueId(val);
                                    }}
                                    className={inputStyle}
                                  >
                                    <option value="">Selecione...</option>
                                    {myActiveLeagues.map(l => (
                                      <option key={l.id} value={l.id}>{l.name} ({l.country})</option>
                                    ))}
                                    <option value="manual" className="font-bold text-emerald-400">+ Digitar Manualmente</option>
                                  </select>
                                ) : (
                                  <select
                                     value={formData.sport}
                                     onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
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
                                )}
                              </div>

                              <div className="sm:col-span-7 space-y-2">
                                <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider ml-1 flex items-center gap-1">
                                  <Shield size={12} /> Evento
                                  {!isPro && <span className="text-[9px] text-amber-500 flex items-center gap-1 ml-auto"><Lock size={8}/> Automático (PRO)</span>}
                                </label>

                                {!isManualMode && selectedLeagueId && selectedLeagueId !== 'manual' && isPro ? (
                                   <div className="flex gap-2 items-center">
                                      <select 
                                        value={selectedHomeTeam}
                                        onChange={(e) => setSelectedHomeTeam(e.target.value)}
                                        className={`${inputStyle} text-xs px-2`}
                                        disabled={isLoadingTeams}
                                      >
                                        <option value="">Casa</option>
                                        {currentLeagueTeams.map(t => (
                                          <option key={t.id} value={t.id} className={userTeams.includes(t.id) ? 'font-bold text-emerald-400' : ''}>
                                             {t.name} {userTeams.includes(t.id) ? '★' : ''}
                                          </option>
                                        ))}
                                      </select>
                                      <span className="text-slate-600 font-black text-xs">VS</span>
                                      <select 
                                        value={selectedAwayTeam}
                                        onChange={(e) => setSelectedAwayTeam(e.target.value)}
                                        className={`${inputStyle} text-xs px-2`}
                                        disabled={isLoadingTeams}
                                      >
                                        <option value="">Visitante</option>
                                        {currentLeagueTeams.map(t => (
                                          <option key={t.id} value={t.id} className={userTeams.includes(t.id) ? 'font-bold text-emerald-400' : ''}>
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
                            <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider ml-1 flex justify-between">
                                Mercado
                                {!isPro && availableMarkets.length === 0 && <span className="text-[9px] text-amber-500 flex items-center gap-1"><Lock size={8}/> Personalizado (PRO)</span>}
                            </label>
                            <select
                              value={formData.market}
                              onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                              className={inputStyle}
                            >
                              <option value="">Selecione...</option>
                              {availableMarkets.map((m) => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                              ))}
                              <option value="__custom">Outro (Digitar Manualmente)</option>
                            </select>
                            
                            {formData.market === '__custom' && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                                <input
                                  type="text"
                                  value={manualMarket}
                                  onChange={(e) => setManualMarket(e.target.value)}
                                  placeholder="Nome do mercado"
                                  className={`${inputStyle} border-emerald-500/50`}
                                  autoFocus
                                />
                              </motion.div>
                            )}
                          </div>

                          <div className="sm:col-span-6 space-y-2">
                            <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider ml-1">Posição (Seleção)</label>
                            <input
                              type="text"
                              value={formData.selection}
                              onChange={(e) => setFormData({ ...formData, selection: e.target.value })}
                              placeholder="Ex: Over 2.5, Casa..."
                              className={inputStyle}
                            />
                          </div>

                          <div className="sm:col-span-6 space-y-2">
                            <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider ml-1 flex justify-between">
                                Método Analítico
                                {!isPro && availableMethods.length === 0 && <span className="text-[9px] text-amber-500 flex items-center gap-1"><Lock size={8}/> Personalizado (PRO)</span>}
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

                          <div className="sm:col-span-6 space-y-2">
                            <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider ml-1 flex justify-between">
                                Plano de Gestão
                                {!isPro && <span className="text-[9px] text-amber-500 flex items-center gap-1"><Lock size={8}/> PRO</span>}
                            </label>
                            <select
                              value={formData.strategy}
                              onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                              className={`${inputStyle} ${!isPro ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={!isPro || availableStrategies.length === 0}
                            >
                              <option value="">{(!isPro) ? "Bloqueado (Upgrade para usar)" : "Opcional"}</option>
                              {availableStrategies.map((s) => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-12 border-t border-slate-800/50 pt-5 mt-1">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
                                
                                <div className="space-y-2">
                                  <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider ml-1">Cotação (Odd)</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={formData.odds}
                                      onChange={(e) => setFormData({ ...formData, odds: e.target.value })}
                                      placeholder="1.00"
                                      className={`${inputStyle} pl-8`}
                                    />
                                    <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                  </div>
                                </div>

                                {/* 🔥 CAMPO DE EXPOSIÇÃO FIXADO EM MOEDA */}
                                <div className="space-y-2">
                                  <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider ml-1 truncate">
                                    Exposição ({currency})
                                  </label>
                                  <input
                                    type="number"
                                    step="1"
                                    value={formData.stake}
                                    onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
                                    placeholder="100.00"
                                    className={inputStyle}
                                  />
                                </div>

                                {formData.status === 'cashout' && (
                                  <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-2 col-span-2"
                                  >
                                    <label className="text-[10px] uppercase text-amber-500 font-bold tracking-wider ml-1 flex items-center gap-1">
                                      <DollarSign size={12} /> Retorno (Cashout)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={formData.cashoutValue}
                                      onChange={(e) => setFormData({ ...formData, cashoutValue: e.target.value })}
                                      placeholder="Valor sacado"
                                      className={`${inputStyle} border-amber-500/50 text-amber-400 focus:border-amber-500`}
                                    />
                                  </motion.div>
                                )}
                              </div>
                          </div>
                        </div>
                      </div>

                      {/* RODAPÉ FIXO (Resultados e Botão de Salvar) */}
                      <div className="bg-slate-950/90 backdrop-blur-md border-t border-slate-800 p-6 shrink-0 mt-auto flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-3xl">
                        
                        <div className="w-full sm:w-auto flex flex-col items-center sm:items-start bg-slate-900 border border-slate-800 rounded-xl px-5 py-3">
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                            {formData.status === 'pending' ? 'Potencial Estimado' : 'Resultado Consolidado'}
                          </p>
                          {/* 🔥 CÁLCULO DE RESULTADO E VISUALIZAÇÃO FIXADA EM MOEDA */}
                          <div className={`text-2xl font-mono font-black tracking-tight ${
                            resultValue > 0 ? 'text-emerald-400' : resultValue < 0 ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            {resultValue > 0 ? '+' : ''}{currency} {resultValue.toFixed(2)}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full sm:w-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl transition-all shadow-xl shadow-emerald-900/20 hover:shadow-emerald-500/20 active:scale-[0.98] tracking-wide text-sm flex items-center justify-center gap-2 uppercase"
                        >
                          {betToEdit ? (
                            <><Save size={18} /> Atualizar Registro</>
                          ) : (
                            <><CheckCircle2 size={18} /> Salvar Operação</>
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