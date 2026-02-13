
import React, { useState } from 'react';
import { useBetStore } from '../store/useBetStore';
import { Trash2, Plus, Save, AlertTriangle, PaintBucket, Coins, Layers, User, Image as ImageIcon, CheckCircle, Bell, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Settings: React.FC = () => {
  const { 
    methods, addMethod, removeMethod, 
    primaryColor, setPrimaryColor, 
    currency, setCurrency, resetData, 
    user, updateProfile 
  } = useBetStore();

  const [newMethodName, setNewMethodName] = useState('');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [showSavedToast, setShowSavedToast] = useState(false);
  
  const handleAddMethod = () => {
    if (newMethodName.trim()) {
      addMethod(newMethodName.trim());
      setNewMethodName('');
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name: profileName, avatar: profileAvatar });
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 dark:border-white/5 pb-8">
            <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Configurações</h1>
                <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">Controle total da sua interface e algoritmos.</p>
            </div>
            
            <AnimatePresence>
                {showSavedToast && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                        <CheckCircle size={16} /> Perfil Sincronizado
                    </motion.div>
                )}
            </AnimatePresence>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Identity Card */}
            <section className="glass-card rounded-[2.5rem] p-10 shadow-sm dark:shadow-xl">
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-500 shadow-inner"><User size={24} /></div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Identidade Visual</h2>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-emerald-500/20 dark:border-emerald-500 shadow-2xl transition-all group-hover:scale-105 duration-500 p-1 bg-white dark:bg-slate-800">
                                <img 
                                  src={profileAvatar || `https://ui-avatars.com/api/?name=${profileName}&background=10b981&color=fff&bold=true`} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover rounded-[2.2rem]" 
                                />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-xl border-4 border-white dark:border-slate-900">
                                <ImageIcon size={14} />
                            </div>
                        </div>
                        <div className="flex-1 w-full space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Nome de Operador</label>
                                <input 
                                    type="text"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500 transition-all text-slate-900 dark:text-white font-bold shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Avatar URL (HTTPS)</label>
                                <input 
                                    type="text"
                                    value={profileAvatar}
                                    onChange={(e) => setProfileAvatar(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500 transition-all text-slate-900 dark:text-white text-xs font-medium shadow-inner"
                                    placeholder="https://sua-imagem.com/foto.jpg"
                                />
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white dark:text-[#020617] font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3 group active:scale-[0.98]">
                        <Save size={18} className="group-hover:rotate-12 transition-transform" /> 
                        GRAVAR ALTERAÇÕES
                    </button>
                </form>
            </section>

            {/* Methods Card */}
            <section className="glass-card rounded-[2.5rem] p-10 shadow-sm dark:shadow-xl">
                 <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-500 shadow-inner"><Layers size={24} /></div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Arquitetura de Métodos</h2>
                </div>
                
                <div className="flex gap-3 mb-8">
                    <input 
                        type="text" 
                        value={newMethodName}
                        onChange={(e) => setNewMethodName(e.target.value)}
                        placeholder="Ex: Alavancagem Under 2.5"
                        className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white font-bold shadow-inner placeholder:text-slate-400"
                    />
                    <button onClick={handleAddMethod} className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-2xl font-black text-xs transition-all shadow-lg active:scale-95">
                        ADD
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {methods.map(method => (
                        <div key={method.id} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-blue-500/30 transition-all shadow-sm dark:shadow-none">
                            <span className="text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                {method.name}
                            </span>
                            <button onClick={() => removeMethod(method.id)} className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1">
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
            <section className="glass-card rounded-[2.5rem] p-10 lg:col-span-2 shadow-sm dark:shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-500"><PaintBucket size={22} /></div>
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg italic">Acentuação Visual</h3>
                        </div>
                        <div className="flex gap-5">
                            {[
                                { id: 'emerald', color: '#10b981' },
                                { id: 'blue', color: '#3b82f6' },
                                { id: 'purple', color: '#a855f7' },
                                { id: 'orange', color: '#f97316' }
                            ].map(c => (
                                <button 
                                    key={c.id} 
                                    onClick={() => setPrimaryColor(c.id)} 
                                    className={`w-14 h-14 rounded-2xl border-4 transition-all flex items-center justify-center ${primaryColor === c.id ? 'border-emerald-500 dark:border-white scale-110 shadow-2xl' : 'border-transparent opacity-40 hover:opacity-100'}`} 
                                    style={{ backgroundColor: c.color }}
                                >
                                    {primaryColor === c.id && <div className="w-2 h-2 rounded-full bg-white shadow-xl animate-pulse"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-500"><Coins size={22} /></div>
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg italic">Moeda do Sistema</h3>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {['BRL', 'USD', 'EUR', 'GBP'].map(curr => (
                                <button 
                                    key={curr} 
                                    onClick={() => setCurrency(curr)} 
                                    className={`px-8 py-4 rounded-2xl font-black text-xs transition-all border ${
                                        currency === curr 
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-xl' 
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
            <section className="bg-red-500/5 dark:bg-red-500/5 rounded-[2.5rem] p-10 border border-red-200 dark:border-red-500/10 lg:col-span-2 flex flex-col md:flex-row justify-between items-center gap-10 shadow-sm">
                <div className="flex items-center gap-6 text-center md:text-left">
                    <div className="p-5 bg-red-100 dark:bg-red-500/10 rounded-3xl text-red-600 dark:text-red-500 shadow-lg"><AlertTriangle size={36} /></div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Nível de Segurança: Crítico</h3>
                        <p className="text-red-600/80 dark:text-red-500/60 text-sm font-bold uppercase tracking-widest mt-1">Apaga permanentemente todo o histórico e bancos de dados.</p>
                    </div>
                </div>
                <button 
                    onClick={() => window.confirm('Deseja RESETAR tudo? Esta ação não pode ser desfeita.') && resetData()} 
                    className="bg-red-600 hover:bg-red-500 text-white px-12 py-5 rounded-2xl font-black text-xs shadow-2xl shadow-red-500/20 active:scale-95 transition-all flex items-center gap-3 group"
                >
                    PURGAR DADOS DO TERMINAL
                    <Trash2 size={16} className="group-hover:animate-bounce" />
                </button>
            </section>
        </div>
        
        <footer className="pt-10 text-center">
             <p className="text-[10px] text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.5em]">BetTracker Cloud Ecosystem • Build 4.5.1</p>
        </footer>
    </div>
  );
};

export default Settings;
