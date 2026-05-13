import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../store/useBetStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Loader2, Save, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        setLoading(false);
        return;
    }

    if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        setLoading(false);
        return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
          navigate('/dashboard');
      }, 2000);

    } catch (err: any) {
      setError("Erro ao redefinir senha. O link pode ter expirado.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] text-slate-900 dark:text-white rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-indigo-500 transition-colors font-medium text-sm placeholder:text-slate-400 dark:placeholder:text-[#636366]";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#000000] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-8 md:p-10 shadow-xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 mb-5 border border-indigo-100 dark:border-indigo-500/20">
             <KeyRound size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
            Nova Senha
          </h2>
          <p className="text-slate-500 dark:text-[#8E8E93] text-sm font-medium">
            Digite sua nova chave de acesso segura abaixo.
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold p-4 rounded-xl flex items-center gap-3 mb-6"
            >
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold p-4 rounded-xl flex items-center gap-3 mb-6"
            >
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Senha atualizada! Acessando o terminal...</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest ml-1">Nova Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest ml-1">Confirmar Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || success}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Definir Nova Senha'}
            {!loading && !success && <Save size={16} />}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default UpdatePassword;