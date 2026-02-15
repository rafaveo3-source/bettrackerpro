import React, { useState } from 'react';
import { useBetStore } from '../store/useBetStore';
import { Trash2, Save, AlertTriangle, PaintBucket, Coins, Layers, User, Image as ImageIcon, CheckCircle, PieChart, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Settings: React.FC = () => {
  const { 
    methods, addMethod, removeMethod, 
    primaryColor, setPrimaryColor, 
    currency, setCurrency, resetData, 
    user, updateProfile,
    displayMode, setDisplayMode, unitSize, setUnitSize 
  } = useBetStore();

  const [newMethodName, setNewMethodName] = useState('');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [tempUnitSize, setTempUnitSize] = useState(unitSize.toString());
  
  const handleAddMethod = () => {
    if (newMethodName.trim()) {
      addMethod(newMethodName.trim());
      setNewMethodName('');
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name: profileName, avatar: profileAvatar });
    setUnitSize(parseFloat(tempUnitSize) || 100);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20 w-full overflow-x-hidden">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 dark:border-slate-800 pb-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Configurações</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-bold mt-2 uppercase tracking-widest">Controle total da sua interface e algoritmos.</p>
            </div>
            
            <AnimatePresence>
                {showSavedToast && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                        <CheckCircle size={16} /> Configurações Salvas
                    </motion.div>
                )}
            </AnimatePresence>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Identity Card */}
            <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-10 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-500 shadow-inner"><User size={24} /></div>
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
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Nome de Operador</label>
                                    <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-slate-900 dark:text-white font-bold text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Avatar URL</label>
                                    <input type="text" value={profileAvatar} onChange={(e) => setProfileAvatar(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-slate-900 dark:text-white text-xs font-medium" />
                                </div>
                             </div>
                        </div>

                        {/* ✅ Configuração de Unidade */}
                        <div className="p-5 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-white/5">
                             <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><PieChart size={14} /> Gestão de Unidade</h3>
                             <div className="flex flex-col sm:flex-row gap-4">
                                 <div className="flex-1">
                                     <label className="block text-[10px] font-bold text-slate-400 mb-1">Valor de 1 Unidade ({currency})</label>
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
                                     <label className="block text-[10px] font-bold text-slate-400 mb-1">Modo de Exibição</label>
                                     <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800 h-[46px]">
                                         <button 
                                            type="button"
                                            onClick={() => setDisplayMode('currency')}
                                            className={`flex-1 rounded-lg text-xs font-bold transition-all ${displayMode === 'currency' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                         >
                                            {currency}
                                         </button>
                                         <button 
                                            type="button"
                                            onClick={() => setDisplayMode('units')}
                                            className={`flex-1 rounded-lg text-xs font-bold transition-all ${displayMode === 'units' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
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
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-500 shadow-inner"><Layers size={24} /></div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Arquitetura de Métodos</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <input type="text" value={newMethodName} onChange={(e) => setNewMethodName(e.target.value)} placeholder="Ex: Alavancagem" className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white font-bold shadow-inner placeholder:text-slate-400" />
                    <button onClick={handleAddMethod} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 sm:py-0 rounded-2xl font-black text-xs transition-all shadow-lg active:scale-95 uppercase tracking-widest">ADD</button>
                </div>
                <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {methods.map(method => (
                        <div key={method.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-blue-500/30 transition-all shadow-sm">
                            <span className="text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-blue-500"></div>{method.name}</span>
                            <button onClick={() => removeMethod(method.id)} className="text-slate-400 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {methods.length === 0 && (
                        <p className="text-center py-10 text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Nenhum método cadastrado</p>
                    )}
                </div>
            </section>

             {/* Preferences */}
            <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-10 lg:col-span-2 shadow-sm transition-shadow hover:shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-500"><PaintBucket size={22} /></div>
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
                                    onClick={() => setPrimaryColor(c.id)} 
                                    className={`w-14 h-14 rounded-2xl border-4 transition-all flex items-center justify-center ${primaryColor === c.id ? 'border-emerald-500 dark:border-white scale-110 shadow-xl' : 'border-transparent opacity-50 hover:opacity-100'}`} 
                                    style={{ backgroundColor: c.color }}
                                >
                                    {primaryColor === c.id && <div className="w-2 h-2 rounded-full bg-white shadow-lg animate-pulse"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-500"><Coins size={22} /></div>
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg italic">Moeda do Sistema</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {['BRL', 'USD', 'EUR', 'GBP'].map(curr => (
                                <button 
                                    key={curr} 
                                    onClick={() => setCurrency(curr)} 
                                    className={`px-8 py-4 rounded-2xl font-black text-xs transition-all border ${
                                        currency === curr 
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-xl transform scale-105' 
                                        : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-white/30'
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
            <section className="bg-red-50 dark:bg-red-500/5 rounded-[2.5rem] p-6 md:p-10 border border-red-100 dark:border-red-500/10 lg:col-span-2 flex flex-col md:flex-row justify-between items-center gap-10 shadow-sm">
                <div className="flex items-center gap-6 text-center md:text-left">
                    <div className="p-5 bg-red-100 dark:bg-red-500/10 rounded-3xl text-red-600 dark:text-red-500 shadow-lg"><AlertTriangle size={36} /></div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Nível de Segurança: Crítico</h3>
                        <p className="text-red-600/80 dark:text-red-500/60 text-sm font-bold uppercase tracking-widest mt-1">Apaga permanentemente todo o histórico e bancos de dados.</p>
                    </div>
                </div>
                <button 
                    onClick={() => window.confirm('Deseja RESETAR tudo? Esta ação não pode ser desfeita.') && resetData()} 
                    className="bg-red-600 hover:bg-red-500 text-white px-10 py-5 rounded-2xl font-black text-xs shadow-xl shadow-red-500/20 active:scale-95 transition-all flex items-center gap-3 group w-full md:w-auto justify-center tracking-widest uppercase"
                >
                    PURGAR DADOS
                    <Trash2 size={16} className="group-hover:animate-bounce" />
                </button>
            </section>
        </div>
        
        <footer className="pt-10 text-center">
             <p className="text-[10px] text-slate-400 dark:text-slate-700 font-black uppercase tracking-[0.5em]">BetTracker Cloud Ecosystem • Build 4.6.0</p>
        </footer>
    </div>
  );
};

export default Settings;