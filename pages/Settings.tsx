import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBetStore, supabase } from '../store/useBetStore';
// 🔥 FIX: Importações completas incluindo Target e TrendingUp para evitar o crash 🔥
import { Trash2, Save, PaintBucket, Coins, Layers, User, CheckCircle, PieChart, Hash, Skull, Loader2, Crown, Calendar, AlertCircle, ArrowRight, ExternalLink, Target, TrendingUp } from 'lucide-react';
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
    isPro
  } = useBetStore();

  const [newMethodName, setNewMethodName] = useState('');
  const [newMarketName, setNewMarketName] = useState('');
  const [newStrategyName, setNewStrategyName] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [tempUnitSize, setTempUnitSize] = useState('100');
  const [isResetting, setIsResetting] = useState(false);
  
  const [validUntil, setValidUntil] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileAvatar(user.avatar || '');
      
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
      const confirmed = window.confirm('TEM CERTEZA? Isso apagará TODO o seu histórico de registros, portfólios e modelos de gestão. Sua conta permanecerá ativa, mas zerada.');
      if (confirmed) {
          setIsResetting(true);
          await resetData();
          setIsResetting(false);
      }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
        "ATENÇÃO CRÍTICA:\n\nEsta ação excluirá PERMANENTEMENTE sua conta, todos os seus registros operacionais, portfólios e histórico de desempenho.\n\nNão há como desfazer. Tem certeza absoluta?"
    );
    if (confirmed) {
        try {
            const { error } = await supabase.rpc('delete_own_user');
            if (error) throw error;
            resetData(); 
            await logout(); 
            window.location.assign('/login'); 
        } catch (error: any) {
            alert("Erro ao deletar conta: " + error.message);
        }
    }
  };

  // 🔥 Design System Apple PRO: Classes base reutilizáveis 🔥
  const cardClass = "bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm transition-all";
  const inputClass = "bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-colors w-full placeholder:text-slate-400 dark:placeholder:text-[#636366]";
  const sectionTitleClass = "text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-6 flex items-center gap-3";
  const listItemClass = "flex justify-between items-center py-4 border-b border-slate-100 dark:border-[#2C2C2E] last:border-0";

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 w-full overflow-x-hidden font-sans">
        
        {/* --- HEADER CLEAN & SOBRIO --- */}
        <div className="border-b border-slate-200 dark:border-[#2C2C2E] pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
              System Control
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Configurações
            </h1>
            <p className="text-slate-500 dark:text-[#8E8E93] text-sm mt-2 font-medium">
              Controle total da interface, preferências e arquitetura do sistema.
            </p>
          </div>

          <AnimatePresence>
            {showSavedToast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-emerald-50 dark:bg-[#1C1C1E] border border-emerald-200 dark:border-[#2C2C2E] text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm"
              >
                <CheckCircle size={16} /> Configurações Salvas
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- CARD DE ASSINATURA (ESTILO CARTÃO APPLE) --- */}
        <section className={`border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden ${isPro ? 'bg-gradient-to-r from-indigo-50 to-white dark:from-[#1C1C1E] dark:to-[#2C2C2E] border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-[#2C2C2E]'}`}>
            {isPro && <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />}
            
            <div className="flex items-center gap-5 w-full md:w-auto relative z-10">
                <div className={`p-4 rounded-xl ${isPro ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-[#2C2C2E] text-slate-500 dark:text-[#8E8E93]'}`}>
                    <Crown size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-0.5">
                        {isPro ? 'Assinatura PRO' : 'Plano Básico'}
                    </h3>
                    {isPro ? (
                        <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                            Ativa e Operante
                        </div>
                    ) : (
                        <div className="text-xs text-slate-500 dark:text-[#8E8E93] font-medium">
                            Acesso limitado às ferramentas essenciais.
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full md:w-auto flex flex-col md:items-end gap-3 relative z-10">
                {isPro && validUntil ? (
                    <>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-[#8E8E93] text-sm font-medium">
                            <Calendar size={14} />
                            Válido até: <span className="font-bold text-slate-900 dark:text-white">{validUntil.toLocaleDateString('pt-BR')}</span>
                        </div>
                        
                        {daysRemaining !== null && daysRemaining <= 15 && (
                            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 p-3 rounded-lg text-xs max-w-sm mt-1">
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                <p className="leading-relaxed">
                                    Faltam {daysRemaining} dias. O pagamento na Lastlink costuma ser automático, garanta o limite para não perder o acesso.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2 w-full mt-2">
                            <button onClick={() => navigate('/pro')} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-sm text-center">
                                Estender
                            </button>
                            <a href="https://lastlink.com/login" target="_blank" rel="noreferrer" className="flex-1 md:flex-none bg-white hover:bg-slate-50 dark:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C] text-slate-700 dark:text-white border border-slate-200 dark:border-[#3A3A3C] px-4 py-2 rounded-lg font-bold text-xs transition-colors text-center flex items-center justify-center gap-1.5">
                                Lastlink <ExternalLink size={12} />
                            </a>
                        </div>
                    </>
                ) : (
                    <button onClick={() => navigate('/pro')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm w-full md:w-auto">
                        Fazer Upgrade <ArrowRight size={16} />
                    </button>
                )}
            </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* --- IDENTITY CARD --- */}
            <section className={cardClass}>
                <h2 className={sectionTitleClass}>
                  <User className="text-indigo-500" size={20} /> Perfil & Gestão
                </h2>
                
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] rounded-xl">
                        <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 dark:border-[#3A3A3C] shrink-0">
                            <img src={profileAvatar || `https://ui-avatars.com/api/?name=${profileName}`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-wider mb-1">Nome do Operador</p>
                            <input
                              type="text"
                              value={profileName}
                              onChange={(e) => setProfileName(e.target.value)}
                              className="w-full bg-transparent text-lg font-bold text-slate-900 dark:text-white outline-none"
                              placeholder="Seu Nome"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-[#2C2C2E]">
                         <h3 className="text-xs font-bold text-slate-600 dark:text-[#8E8E93] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <PieChart size={14} /> Configuração de Stake
                         </h3>
                         
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] mb-1.5 uppercase tracking-wider">Valor da Unidade ({currency})</label>
                                 <div className="relative">
                                     <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#636366]" />
                                     <input 
                                         type="number" 
                                         value={tempUnitSize} 
                                         onChange={(e) => setTempUnitSize(e.target.value)} 
                                         className={`${inputClass} pl-9 font-mono font-bold text-indigo-600 dark:text-indigo-400`} 
                                     />
                                 </div>
                             </div>
                             <div>
                                 <label className="block text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] mb-1.5 uppercase tracking-wider">Modo de Exibição</label>
                                 <div className="flex bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] rounded-xl p-1 h-[46px]">
                                     <button 
                                        type="button"
                                        onClick={async () => { await setDisplayMode('currency'); setShowSavedToast(true); setTimeout(() => setShowSavedToast(false), 2000); }}
                                        className={`flex-1 rounded-lg text-xs font-bold transition-all ${displayMode === 'currency' ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#8E8E93]'}`}
                                     >
                                        Moeda ({currency})
                                     </button>
                                     <button 
                                        type="button"
                                        onClick={async () => { await setDisplayMode('units'); setShowSavedToast(true); setTimeout(() => setShowSavedToast(false), 2000); }}
                                        className={`flex-1 rounded-lg text-xs font-bold transition-all ${displayMode === 'units' ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#8E8E93]'}`}
                                     >
                                        Unidades (u)
                                     </button>
                                 </div>
                             </div>
                         </div>
                    </div>
                    <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm">
                        <Save size={16} /> Salvar Preferências
                    </button>
                </form>
            </section>

            {/* --- METHODS CARD --- */}
            <section className={cardClass}>
                <h2 className={sectionTitleClass}>
                  <Layers className="text-indigo-500" size={20} /> Métodos Base
                </h2>
                <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      value={newMethodName} 
                      onChange={(e) => setNewMethodName(e.target.value)} 
                      placeholder="Ex: Back Favorito" 
                      className={inputClass} 
                    />
                    <button onClick={handleAddMethod} className="bg-slate-900 dark:bg-white text-white dark:text-black px-5 rounded-xl text-xs font-bold transition-colors shadow-sm">
                        Add
                    </button>
                </div>
                <div className="max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                    {methods.map(method => (
                      <div key={method.id} className={listItemClass}>
                        <span className="text-slate-700 dark:text-[#E5E5EA] font-medium text-sm">
                          {method.name}
                        </span>
                        <button onClick={() => { if (window.confirm('Excluir método?')) removeMethod(method.id); }} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {methods.length === 0 && (
                        <p className="text-center py-6 text-slate-400 dark:text-[#636366] text-xs font-medium">Nenhum método cadastrado</p>
                    )}
                </div>
            </section>

            {/* --- CUSTOM MARKETS --- */}
            <section className={`${cardClass} flex flex-col`}>
              <h2 className={sectionTitleClass}>
                  <Target className="text-indigo-500" size={20} /> Mercados Cust.
              </h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newMarketName}
                  onChange={(e) => setNewMarketName(e.target.value)}
                  placeholder="Ex: Escanteios HT"
                  className={inputClass}
                />
                <button onClick={() => { if (newMarketName.trim()) { addCustomMarket(newMarketName.trim()); setNewMarketName(''); } }} className="bg-slate-900 dark:bg-white text-white dark:text-black px-5 rounded-xl text-xs font-bold transition-colors shadow-sm">
                  Add
                </button>
              </div>
              <div className="flex-1 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {customMarkets.map((m) => (
                  <div key={m.id} className={listItemClass}>
                    <span className="text-slate-700 dark:text-[#E5E5EA] font-medium text-sm">{m.name}</span>
                    <button onClick={() => { if (window.confirm('Excluir mercado?')) removeCustomMarket(m.id); }} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* --- STRATEGIES --- */}
            <section className={`${cardClass} flex flex-col`}>
              <h2 className={sectionTitleClass}>
                  <TrendingUp className="text-indigo-500" size={20} /> Gestão / Progressão
              </h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newStrategyName}
                  onChange={(e) => setNewStrategyName(e.target.value)}
                  placeholder="Ex: Martingale Adaptativo"
                  className={inputClass}
                />
                <button onClick={() => { if (newStrategyName.trim()) { addCustomStrategy(newStrategyName.trim()); setNewStrategyName(''); } }} className="bg-slate-900 dark:bg-white text-white dark:text-black px-5 rounded-xl text-xs font-bold transition-colors shadow-sm">
                  Add
                </button>
              </div>
              <div className="flex-1 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {customStrategies.map((s) => (
                  <div key={s.id} className={listItemClass}>
                    <span className="text-slate-700 dark:text-[#E5E5EA] font-medium text-sm">{s.name}</span>
                    <button onClick={() => { if (window.confirm('Excluir estratégia?')) removeCustomStrategy(s.id); }} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

             {/* --- SYSTEM PREFERENCES --- */}
            <section className={`${cardClass} lg:col-span-2`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <h2 className={sectionTitleClass}>
                          <PaintBucket className="text-indigo-500" size={20} /> Identidade Visual
                        </h2>
                        <div className="flex gap-3 flex-wrap">
                            {[
                                { id: 'emerald', color: '#10b981' },
                                { id: 'blue', color: '#3b82f6' },
                                { id: 'purple', color: '#a855f7' },
                                { id: 'orange', color: '#f97316' },
                                { id: 'gold', color: '#f59e0b' }
                            ].map(c => (
                                <button 
                                    key={c.id} 
                                    onClick={async () => { await setPrimaryColor(c.id); setShowSavedToast(true); setTimeout(() => setShowSavedToast(false), 2000); }} 
                                    className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${primaryColor === c.id ? 'border-slate-900 dark:border-white ring-2 ring-offset-2 dark:ring-offset-[#1C1C1E] ring-slate-400 dark:ring-slate-600' : 'border-transparent opacity-60 hover:opacity-100'}`} 
                                    style={{ backgroundColor: c.color }}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <h2 className={sectionTitleClass}>
                          <Coins className="text-indigo-500" size={20} /> Câmbio Base
                        </h2>
                        <div className="flex gap-2 flex-wrap">
                            {['BRL', 'USD', 'EUR', 'GBP'].map(curr => (
                                <button 
                                    key={curr} 
                                    onClick={async () => { await setCurrency(curr); setShowSavedToast(true); setTimeout(() => setShowSavedToast(false), 2000); }} 
                                    className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all border ${
                                        currency === curr 
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-sm' 
                                        : 'bg-white dark:bg-[#000000] border-slate-200 dark:border-[#3A3A3C] text-slate-600 dark:text-[#8E8E93] hover:border-slate-300 dark:hover:border-slate-500'
                                    }`}
                                >
                                    {curr}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- DANGER ZONE --- */}
            <section className="bg-red-50/50 dark:bg-red-500/5 rounded-2xl p-6 md:p-8 border border-red-200/50 dark:border-red-500/10 lg:col-span-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-2 tracking-tight">
                        <Skull size={20} /> Zona de Perigo
                    </h3>
                    <p className="text-red-600/70 dark:text-red-500/60 text-sm font-medium">Ações destrutivas e irreversíveis sobre sua conta e dados.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button 
                      onClick={handleResetData}
                      disabled={isResetting}
                      className="bg-white dark:bg-[#1C1C1E] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#3A3A3C] hover:bg-slate-50 dark:hover:bg-[#2C2C2E] px-6 py-3 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                      {isResetting ? <Loader2 className="animate-spin" size={16} /> : "Limpar Base de Dados"}
                  </button>
                  <button 
                      onClick={handleDeleteAccount} 
                      className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all flex justify-center items-center gap-2"
                  >
                      Excluir Conta <Trash2 size={16} />
                  </button>
                </div>
            </section>
        </div>

        <footer className="pt-8 text-center opacity-40">
             <p className="text-[10px] text-slate-900 dark:text-white font-medium uppercase tracking-[0.2em]">System Version 5.0.0</p>
        </footer>
    </div>
  );
};

export default Settings;