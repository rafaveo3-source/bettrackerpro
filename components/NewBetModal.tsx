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
  ArrowRightLeft
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
    customStrategies, // ✅ Lendo as estratégias importadas pelo usuário
    displayMode,
    unitSize,
    
    // Dados Globais
    globalLeagues,
    userLeagues,
    currentLeagueTeams,
    userTeams,
    fetchLeagues,
    fetchLeagueTeams,
    isLoadingTeams
  } = useBetStore();

  const [error, setError] = useState('');
  const [manualMarket, setManualMarket] = useState('');
  
  // Modos de Seleção
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const [selectedHomeTeam, setSelectedHomeTeam] = useState('');
  const [selectedAwayTeam, setSelectedAwayTeam] = useState('');

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

  // Carrega ligas ao abrir
  useEffect(() => {
    if (isOpen && globalLeagues.length === 0) {
      fetchLeagues();
    }
  }, [isOpen]);

  // Carrega times da liga
  useEffect(() => {
    if (selectedLeagueId && selectedLeagueId !== 'manual') {
      fetchLeagueTeams(selectedLeagueId);
      const league = globalLeagues.find(l => l.id === selectedLeagueId);
      if (league) {
        setFormData(prev => ({ ...prev, sport: league.sport }));
      }
    }
  }, [selectedLeagueId]);

  // Nome do evento automático
  useEffect(() => {
    if (!isManualMode && selectedHomeTeam && selectedAwayTeam) {
      const home = currentLeagueTeams.find(t => t.id === selectedHomeTeam)?.name || '';
      const away = currentLeagueTeams.find(t => t.id === selectedAwayTeam)?.name || '';
      if (home && away) {
        setFormData(prev => ({ ...prev, event: `${home} vs ${away}` }));
      }
    }
  }, [selectedHomeTeam, selectedAwayTeam, isManualMode, currentLeagueTeams]);

  // Inicialização (Edit vs New)
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
        cashoutValue: (betToEdit as any).cashoutValue?.toString() || ''
      });
      
      setIsManualMode(true);
      
      const isCustomMarket = !customMarkets.some(m => m.name === betToEdit.market);
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
      
      setIsManualMode(userLeagues.length === 0);
      setSelectedLeagueId('');
      setSelectedHomeTeam('');
      setSelectedAwayTeam('');
    }
  }, [betToEdit, isOpen, userLeagues.length]);

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

    if (formData.status === 'cashout' && !formData.cashoutValue) {
      setError('Informe o valor do Cashout.');
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
      cashoutValue: formData.cashoutValue ? parseFloat(formData.cashoutValue) : 0
    };

    if (betToEdit) {
      updateBet(betToEdit.id, payload);
    } else {
      // Data corrigida é gerada dentro do addBet na store agora
      addBet(payload); 
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
    'w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed';

  const myActiveLeagues = globalLeagues.filter(l => userLeagues.includes(l.id));

  const statusOptions = [
    { id: 'pending', label: 'Pendente', icon: Clock, color: 'bg-slate-700 text-slate-200', activeRing: 'ring-slate-500' },
    { id: 'won', label: 'Green', icon: CheckCircle2, color: 'bg-emerald-500 text-black', activeRing: 'ring-emerald-400' },
    { id: 'half-won', label: '½ Green', icon: CheckCircle2, color: 'bg-emerald-500/40 text-emerald-100', activeRing: 'ring-emerald-400' },
    { id: 'lost', label: 'Red', icon: XCircle, color: 'bg-red-500 text-white', activeRing: 'ring-red-400' },
    { id: 'half-lost', label: '½ Red', icon: XCircle, color: 'bg-red-500/40 text-red-100', activeRing: 'ring-red-400' },
    { id: 'cashout', label: 'Cashout', icon: DollarSign, color: 'bg-amber-500 text-black', activeRing: 'ring-amber-400' },
    { id: 'refunded', label: 'Reembolso', icon: Ban, color: 'bg-slate-500 text-white', activeRing: 'ring-slate-400' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl my-8 flex flex-col"
          >
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur z-10 rounded-t-3xl">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  {betToEdit ? 'Editar Aposta' : 'Nova Aposta'}
                </h2>
                <p className="text-slate-500 text-xs md:text-sm mt-0.5">
                  Preencha os detalhes da sua entrada
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-slate-800/50 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto max-h-[85vh] md:max-h-none scrollbar-hide">

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-3">
                <label className="text-xs uppercase text-slate-500 font-bold tracking-wider ml-1">
                  Status da Aposta
                </label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: opt.id as BetStatus })}
                      className={`flex-1 min-w-[80px] py-2.5 px-2 rounded-lg text-xs md:text-sm font-bold transition-all flex flex-col items-center justify-center gap-1 border-2 ${
                        formData.status === opt.id
                          ? `${opt.color} ${opt.activeRing} border-transparent shadow-lg scale-105`
                          : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <opt.icon size={16} />
                      <span className="whitespace-nowrap">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {!betToEdit && myActiveLeagues.length > 0 && (
                <div className="flex justify-end">
                   <button 
                     type="button"
                     onClick={() => setIsManualMode(!isManualMode)}
                     className="text-xs text-emerald-500 hover:text-emerald-400 font-medium flex items-center gap-1 transition-colors px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20"
                   >
                     {isManualMode ? 'Usar Seleção Inteligente' : 'Digitar Manualmente'}
                     <ArrowRightLeft size={12} />
                   </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-5 p-5 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                   
                   <div className="md:col-span-4 space-y-2">
                     <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider ml-1 flex items-center gap-1">
                       <Trophy size={12} /> Liga / Competição
                     </label>
                     
                     {!isManualMode && myActiveLeagues.length > 0 ? (
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

                   <div className="md:col-span-8 space-y-2">
                     <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider ml-1 flex items-center gap-1">
                       <Shield size={12} /> Evento
                     </label>

                     {!isManualMode && selectedLeagueId && selectedLeagueId !== 'manual' ? (
                        <div className="flex flex-col md:flex-row gap-2 items-center">
                           <div className="flex-1 w-full">
                              <select 
                                value={selectedHomeTeam}
                                onChange={(e) => setSelectedHomeTeam(e.target.value)}
                                className={`${inputStyle} text-sm`}
                                disabled={isLoadingTeams}
                              >
                                <option value="">Time da Casa</option>
                                {currentLeagueTeams.map(t => (
                                  <option key={t.id} value={t.id} className={userTeams.includes(t.id) ? 'font-bold text-emerald-400' : ''}>
                                     {t.name} {userTeams.includes(t.id) ? '★' : ''}
                                  </option>
                                ))}
                              </select>
                           </div>
                           <span className="text-slate-600 font-black text-xs">VS</span>
                           <div className="flex-1 w-full">
                              <select 
                                value={selectedAwayTeam}
                                onChange={(e) => setSelectedAwayTeam(e.target.value)}
                                className={`${inputStyle} text-sm`}
                                disabled={isLoadingTeams}
                              >
                                <option value="">Time Visitante</option>
                                {currentLeagueTeams.map(t => (
                                  <option key={t.id} value={t.id} className={userTeams.includes(t.id) ? 'font-bold text-emerald-400' : ''}>
                                     {t.name} {userTeams.includes(t.id) ? '★' : ''}
                                  </option>
                                ))}
                              </select>
                           </div>
                        </div>
                     ) : (
                       <input
                         type="text"
                         value={formData.event}
                         onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                         placeholder="Ex: Flamengo vs Palmeiras"
                         className={inputStyle}
                       />
                     )}
                   </div>
                </div>

                <div className="md:col-span-6 space-y-2">
                  <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider ml-1">Mercado</label>
                  <select
                    value={formData.market}
                    onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                    className={inputStyle}
                  >
                    <option value="">Selecione...</option>
                    {customMarkets.map((m) => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                    <option value="__custom">Outro (Digitar Manualmente)</option>
                  </select>
                  
                  {formData.market === '__custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2"
                    >
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

                <div className="md:col-span-6 space-y-2">
                  <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider ml-1">Seleção (Aposta)</label>
                  <input
                    type="text"
                    value={formData.selection}
                    onChange={(e) => setFormData({ ...formData, selection: e.target.value })}
                    placeholder="Ex: Over 2.5 Gols, Vitória Casa..."
                    className={inputStyle}
                  />
                </div>

                <div className="md:col-span-6 space-y-2">
                  <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider ml-1">Método</label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className={inputStyle}
                  >
                    <option value="">Opcional</option>
                    {methods.map((m) => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* ✅ DROPWDOWN DE ESTRATÉGIAS IMPORTADAS */}
                <div className="md:col-span-6 space-y-2">
                  <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider ml-1">Estratégia</label>
                  <select
                    value={formData.strategy}
                    onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                    className={inputStyle}
                  >
                    <option value="">Opcional</option>
                    {customStrategies.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-12 border-t border-slate-800/50 pt-4 mt-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                      
                      <div className="space-y-2">
                        <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider ml-1">Odd</label>
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

                      <div className="space-y-2">
                        <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider ml-1">
                          Stake ({displayMode === 'units' ? 'Unidades' : currency})
                        </label>
                        <input
                          type="number"
                          step={displayMode === 'units' ? "0.1" : "1"}
                          value={formData.stake}
                          onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
                          placeholder={displayMode === 'units' ? '1.0' : '100'}
                          className={inputStyle}
                        />
                      </div>

                      {formData.status === 'cashout' && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-2 col-span-2 md:col-span-2"
                        >
                          <label className="text-xs uppercase text-amber-500 font-bold tracking-wider ml-1 flex items-center gap-1">
                            <DollarSign size={12} /> Valor do Cashout
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.cashoutValue}
                            onChange={(e) => setFormData({ ...formData, cashoutValue: e.target.value })}
                            placeholder="Valor retirado..."
                            className={`${inputStyle} border-amber-500/50 text-amber-400 focus:border-amber-500 focus:ring-amber-500/20`}
                            autoFocus
                          />
                        </motion.div>
                      )}

                    </div>
                </div>

              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex justify-between items-center shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-slate-700 to-slate-900"></div>
                
                <div className="z-10">
                  <p className="text-slate-500 text-sm font-medium">
                    {formData.status === 'pending' ? 'Potencial de Lucro' : 'Resultado da Aposta'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {formData.status === 'pending' 
                      ? 'Se a aposta for vencedora' 
                      : formData.status === 'cashout' 
                        ? 'Baseado no valor de cashout'
                        : 'Baseado no status selecionado'}
                  </p>
                </div>

                <div className={`text-2xl md:text-3xl font-mono font-bold z-10 tracking-tight ${
                  resultValue > 0 
                    ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]' 
                    : resultValue < 0 
                      ? 'text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]' 
                      : 'text-slate-400'
                }`}>
                  {resultValue > 0 ? '+' : ''}{currency} {resultValue.toFixed(2)}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-900/20 hover:shadow-emerald-500/20 active:scale-[0.99] tracking-wide text-lg flex items-center justify-center gap-2"
              >
                {betToEdit ? (
                  <>
                    <Save size={20} />
                    Atualizar Aposta
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Salvar Aposta
                  </>
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