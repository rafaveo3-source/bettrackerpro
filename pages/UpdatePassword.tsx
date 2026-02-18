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
      // Redireciona para o dashboard após 2 segundos
      setTimeout(() => {
          navigate('/dashboard');
      }, 2000);

    } catch (err: any) {
      setError("Erro ao redefinir senha. O link pode ter expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-full text-emerald-500 mb-4">
             <KeyRound size={24} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
            Nova Senha
          </h2>
          <p className="text-slate-400 text-sm">
            Digite sua nova senha segura abaixo.
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl flex items-start gap-3 mb-4"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-4 rounded-xl flex items-start gap-3 mb-4"
            >
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>Senha atualizada! Redirecionando...</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 tracking-wider">Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 tracking-wider">Confirmar Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600 font-medium"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || success}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Definir Nova Senha'}
            {!loading && !success && <Save size={16} />}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default UpdatePassword;