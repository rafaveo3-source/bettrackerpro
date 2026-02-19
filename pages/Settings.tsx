import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBetStore, supabase } from '../store/useBetStore';
import { Trash2, Save, AlertTriangle, PaintBucket, Coins, Layers, User, Image as ImageIcon, CheckCircle, PieChart, Hash, Skull, Loader2, Crown, Calendar, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { 
    methods, addMethod, removeMethod,
    customMarkets, addCustomMarket, removeCustomMarket,
    customStrategies, addCustomStrategy, removeCustomStrategy,
    primaryColor, setPrimaryColor, 
    currency, setCurrency, resetData, 
    user, updateProfile, logout,
    displayMode, setDisplayMode, unitSize, setUnitSize,
    isPro // Puxando o status PRO
  } = useBetStore();

  const [newMethodName, setNewMethodName] = useState('');
  const [newMarketName, setNewMarketName] = useState('');
  const [newStrategyName, setNewStrategyName] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [tempUnitSize, setTempUnitSize] = useState('100');
  const [isResetting, setIsResetting] = useState(false);
  
  // Status de Assinatura
  const [validUntil, setValidUntil] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileAvatar(user.avatar || '');
      
      // Busca a data de expiração no banco
      const fetchSubscriptionData = async () => {
        if (!user.id) return;
        const { data } = await supabase.from('profiles').select('valid_until').eq('id', user.id).single();
        if (data?.valid_until) {
          const expirationDate = new Date(data.valid_until);
          setValidUntil(expirationDate);
          
          const today = new Date();
          const diffTime = expirationDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysRemaining(diffDays > 0 ? diffDays : 0);
        }
      };
      fetchSubscriptionData();
    }
  }, [user]);

  useEffect(() => {
    setTempUnitSize(unitSize.toString());
  }, [unitSize]);
  
  const handleAddMethod = () => {
    if (newMethodName.trim()) {
      addMethod(newMethodName.trim());
      setNewMethodName('');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    updateProfile({ name: profileName, avatar: profileAvatar });

    const parsed = parseFloat(tempUnitSize);
    if (!parsed || parsed <= 0) {
      setTempUnitSize(unitSize.toString());
      return;
    }
    await setUnitSize(parsed);

    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleResetData = async () => {
      const confirmed = window.confirm('TEM CERTEZA? Isso apagará TODO o seu histórico de apostas, bancas e configurações. Sua conta permanecerá ativa, mas vazia.');
      if (confirmed) {
          setIsResetting(true);
          await resetData();
          setIsResetting(false);
      }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
        "ATENÇÃO CRÍTICA:\n\nEsta ação excluirá PERMANENTEMENTE sua conta, todas as suas apostas, bancas e histórico.\n\nNão há como desfazer. Tem certeza absoluta?"
    );

    if (confirmed) {
        try {
            const { error } = await supabase.rpc('delete_own_user');
            if (error) throw error;
            
            resetData(); 
            logout(); 
            window.location.href = '/'; 
        } catch (error: any) {
            alert("Erro ao deletar conta: " + error.message);
        }
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20 w-full overflow-x-hidden transition-colors duration-300">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-widest mb-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
              System Control Engine
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
              Configurações <span className="text-slate-400 dark:text-slate-700 text-lg">///</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">
              Controle total da interface, preferências e arquitetura do sistema.
            </p>
          </div>

          <AnimatePresence>
            {showSavedToast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl"
              >
                <CheckCircle size={16} /> Configurações Salvas
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- NOVO CARD DE ASSINATURA --- */}
        <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5 w-full md:w-auto">
                <div className={`p-4 rounded-2xl shadow-inner ${isPro ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Crown size={28} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-1">
                        Status da Assinatura
                    </h3>
                    {isPro ? (
                        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            Plano PRO Ativo
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                            <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                            Plano Gratuito (Limitado)
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full md:w-auto flex flex-col md:items-end gap-3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-6 md:pt-0 md:pl-8">
                {isPro && validUntil ? (
                    <>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                            <Calendar size={16} className="text-slate-400" />
                            Válido até: <span className="font-bold text-slate-900 dark:text-white">{validUntil.toLocaleDateString('pt-BR')}</span>
                        </div>
                        {daysRemaining !== null && daysRemaining <= 15 && (
                            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 p-3 rounded-xl max-w-sm">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <p className="text-xs font-bold leading-relaxed">
                                    Faltam apenas {daysRemaining} dias. O pagamento na Kiwify costuma ser automático para cartões, garanta o limite ou pague o PIX para não perder o acesso!
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <button 
                        onClick={() => navigate('/pro')}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-black py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                        Quero ser PRO <ArrowRight size={16} />
                    </button>
                )}
            </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Identity Card */}
            <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-10 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-500 shadow-inner"><User size={24} /></div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Perfil & Preferências</h2>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                             <div className="relative group shrink-0">
                                <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-slate-100 dark:border-slate-700 shadow-lg">
                                    <img src={profileAvatar || `https://ui-avatars.com/api/?name=${profileName}`} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg border-4 border-white dark:border-[#0f172a]">
                                    <ImageIcon size={14} />
                                </div>
                             </div>
                             <div className="flex-1 w-full">
                                <div className="mb-4">
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Nome de Operador</label>
                                    <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-slate-900 dark:text-white font-bold text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Avatar URL</label>
                                    <input type="text" value={profileAvatar} onChange={(e) => setProfileAvatar(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-slate-900 dark:text-white text-xs font-medium" />
                                </div>
                             </div>
                        </div>

                        <div className="p-5 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800/50">
                             <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><PieChart size={14} /> Gestão de Unidade</h3>
                             <div className="flex flex-col sm:flex-row gap-4">
                                 <div className="flex-1">
                                     <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Valor de 1 Unidade ({currency})</label>
                                     <div className="relative">
                                         <Hash size={14} className="absolute left-3 top-3.5 text-slate-400" />
                                         <input 
                                             type="number" 
                                             value={tempUnitSize} 
                                             onChange={(e) => setTempUnitSize(e.target.value)} 
                                             className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-500 outline-none focus:ring-1 focus:ring-emerald-500" 
                                         />
                                      </div>
                                 </div>
                                 <div className="flex-1">
                                     <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Modo de Exibição</label>
                                     <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800 h-[46px]">
                                         <button 
                                            type="button"
                                            onClick={async () => {
                                              await setDisplayMode('currency');
                                              setShowSavedToast(true);
                                              setTimeout(() => setShowSavedToast(false), 2000);
                                            }}
                                            className={`flex-1 rounded-lg text-xs font-bold transition-all ${displayMode === 'currency' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                         >
                                            {currency}
                                         </button>
                                         <button 
                                            type="button"
                                            onClick={async () => {
                                              await setDisplayMode('units');
                                              setShowSavedToast(true);
                                              setTimeout(() => setShowSavedToast(false), 2000);
                                            }}
                                            className={`flex-1 rounded-lg text-xs font-bold transition-all ${displayMode === 'units' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                                         >
                                            Unid.
                                         </button>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white dark:text-[#020617] font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3 group active:scale-[0.98]">
                        <Save size={18} className="group-hover:rotate-12 transition-transform" /> 
                        SALVAR PREFERÊNCIAS
                    </button>
                </form>
            </section>

            {/* Methods Card */}
            <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-10 shadow-sm transition-shadow hover:shadow-md">
                 <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-500 shadow-inner"><Layers size={24} /></div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Arquitetura de Métodos</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <input type="text" value={newMethodName} onChange={(e) => setNewMethodName(e.target.value)} placeholder="Ex: Alavancagem" className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white font-bold shadow-inner placeholder:text-slate-400" />
                    <button onClick={handleAddMethod} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 sm:py-0 rounded-2xl font-black text-xs transition-all shadow-lg active:scale-95 uppercase tracking-widest">ADD</button>
                </div>
                <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {methods.map(method => (
                      <div
                        key={method.id}
                        className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800/50 group hover:border-indigo-500/30 transition-all shadow-sm"
                      >
                        <span className="text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                          {method.name}
                        </span>
                        <button
                          onClick={() => {
                            if (window.confirm('Deseja realmente excluir este método?')) {
                              removeMethod(method.id);
                            }
                          }}
                          className="text-slate-400 hover:text-red-500 transition-colors p-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {methods.length === 0 && (
                        <p className="text-center py-10 text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Nenhum método cadastrado</p>
                    )}
                </div>
            </section>

            {/* Custom Markets */}
            <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-10 shadow-sm flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">
                  Mercados Personalizados
                </h2>
              </div>
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newMarketName}
                  onChange={(e) => setNewMarketName(e.target.value)}
                  placeholder="Ex: Escanteios HT"
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => {
                    if (newMarketName.trim()) {
                      addCustomMarket(newMarketName.trim());
                      setNewMarketName('');
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-2xl text-xs font-bold transition-colors"
                >
                  ADD
                </button>
              </div>
              <div className="space-y-2 flex-1 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {customMarkets.map((m) => (
                  <div key={m.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{m.name}</span>
                    <button
                      onClick={() => {
                        if (window.confirm('Deseja realmente excluir este mercado?')) {
                          removeCustomMarket(m.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Strategies */}
            <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-10 shadow-sm flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">
                  Estratégias de Progressão
                </h2>
              </div>
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newStrategyName}
                  onChange={(e) => setNewStrategyName(e.target.value)}
                  placeholder="Ex: Martingale Adaptativo"
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => {
                    if (newStrategyName.trim()) {
                      addCustomStrategy(newStrategyName.trim());
                      setNewStrategyName('');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-2xl text-xs font-bold transition-colors"
                >
                  ADD
                </button>
              </div>
              <div className="space-y-2 flex-1 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {customStrategies.map((s) => (
                  <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{s.name}</span>
                    <button
                      onClick={() => {
                        if (window.confirm('Deseja realmente excluir esta estratégia?')) {
                          removeCustomStrategy(s.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

             {/* Preferences Colors */}
            <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-10 lg:col-span-2 shadow-sm transition-shadow hover:shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-500"><PaintBucket size={22} /></div>
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg italic">Acentuação Visual</h3>
                        </div>
                        <div className="flex gap-4 flex-wrap">
                            {[
                                { id: 'emerald', color: '#10b981' },
                                { id: 'blue', color: '#3b82f6' },
                                { id: 'purple', color: '#a855f7' },
                                { id: 'orange', color: '#f97316' },
                                { id: 'gold', color: '#f59e0b' }
                            ].map(c => (
                                <button 
                                    key={c.id} 
                                    onClick={async () => {
                                      await setPrimaryColor(c.id);
                                      setShowSavedToast(true);
                                      setTimeout(() => setShowSavedToast(false), 2000);
                                    }} 
                                    className={`w-14 h-14 rounded-2xl border-4 transition-all flex items-center justify-center ${primaryColor === c.id ? 'border-slate-900 dark:border-white scale-110 shadow-xl' : 'border-transparent opacity-50 hover:opacity-100'}`} 
                                    style={{ backgroundColor: c.color }}
                                >
                                    {primaryColor === c.id && <div className="w-2 h-2 rounded-full bg-white shadow-lg animate-pulse"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-500/10 rounded-2xl text-purple-600 dark:text-purple-500"><Coins size={22} /></div>
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg italic">Moeda do Sistema</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {['BRL', 'USD', 'EUR', 'GBP'].map(curr => (
                                <button 
                                    key={curr} 
                                    onClick={async () => {
                                      await setCurrency(curr);
                                      setShowSavedToast(true);
                                      setTimeout(() => setShowSavedToast(false), 2000);
                                    }} 
                                    className={`px-8 py-4 rounded-2xl font-black text-xs transition-all border ${
                                        currency === curr 
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-xl transform scale-105' 
                                        : 'bg-white dark:bg-transparent border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 dark:hover:border-white/30'
                                    }`}
                                >
                                    {curr}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="bg-red-50 dark:bg-red-500/5 rounded-[2.5rem] p-6 md:p-10 border border-red-200 dark:border-red-500/10 lg:col-span-2 flex flex-col md:flex-row justify-between items-center gap-10 shadow-sm">
                <div className="flex items-center gap-6 text-center md:text-left">
                    <div className="p-5 bg-red-100 dark:bg-red-500/10 rounded-3xl text-red-600 dark:text-red-500 shadow-sm"><Skull size={36} /></div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Zona de Perigo</h3>
                        <p className="text-red-600 dark:text-red-400 text-sm font-bold uppercase tracking-widest mt-1">Excluir conta e todos os dados permanentemente.</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <button 
                      onClick={handleResetData}
                      disabled={isResetting}
                      className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-8 py-5 rounded-2xl font-bold text-xs active:scale-95 transition-all flex justify-center items-center gap-3 tracking-widest uppercase disabled:opacity-50"
                  >
                      {isResetting ? <Loader2 className="animate-spin" size={16} /> : "Limpar Dados"}
                  </button>
                  <button 
                      onClick={handleDeleteAccount} 
                      className="bg-red-600 hover:bg-red-500 text-white px-10 py-5 rounded-2xl font-black text-xs shadow-lg shadow-red-600/20 active:scale-95 transition-all flex justify-center items-center gap-3 group tracking-widest uppercase"
                  >
                      EXCLUIR CONTA
                      <Trash2 size={16} className="group-hover:animate-bounce" />
                  </button>
                </div>
            </section>
        </div>

        <div className="text-center text-[9px] uppercase tracking-widest text-emerald-600 dark:text-emerald-500 font-bold">
          Cloud Sync Active
        </div>
        
        <footer className="pt-10 text-center">
             <p className="text-[10px] text-slate-500 dark:text-slate-600 font-black uppercase tracking-[0.5em]">BetTracker Cloud Ecosystem • Build 5.0.0</p>
        </footer>
    </div>
  );
};

export default Settings;