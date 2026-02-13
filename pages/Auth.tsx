
import React, { useState, useEffect } from 'react';
import { useBetStore, supabase, isSupabaseConfigured } from '../store/useBetStore';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../components/Logo';

type AuthView = 'login' | 'register' | 'recover';

const Auth: React.FC = () => {
  const { setSession } = useBetStore();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-clear error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Credenciais do Supabase não configuradas na Vercel (.env).');
      }

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        }
      });
      
      if (authError) throw authError;
    } catch (err: any) {
      console.error("Critical Auth Error:", err);
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError("ERRO DE CONFIGURAÇÃO: O App não conseguiu conectar ao Supabase. Verifique se a URL do projeto (VITE_SUPABASE_URL) está correta e se o projeto existe.");
      } else {
        setError(err.message || "Erro ao conectar com Google. Verifique o console.");
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Credenciais do Supabase não configuradas na Vercel (.env).');
      }

      if (view === 'login') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        setSession(data.session);
      } else if (view === 'register') {
        const { data, error: authError } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: { full_name: email.split('@')[0] }
            }
        });
        if (authError) throw authError;
        if (data.session) {
            setSession(data.session);
        } else {
            setError("Confirmação: Conta criada! Verifique seu e-mail para confirmar o cadastro antes de logar.");
            setView('login');
        }
      } else {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
             redirectTo: window.location.origin,
        });
        if (authError) throw authError;
        setError("Sucesso: Link de recuperação enviado para o e-mail!");
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      if (err.message === "Failed to fetch" || err.message?.includes('NetworkError')) {
        setError("ERRO CRÍTICO: URL do Supabase inválida ou projeto inexistente. Configure o arquivo .env ou useBetStore.ts corretamente.");
      } else if (err.status === 429) {
        setError("Muitas tentativas. Aguarde alguns minutos.");
      } else if (err.message.includes('Invalid login credentials')) {
        setError("E-mail ou senha incorretos.");
      } else {
        setError(err.message || "Ocorreu um erro inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26c.46-1.39 1.19-2.75 1.81-4.09z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
            <div className="flex flex-col items-center mb-10">
                <Logo size={64} className="mb-4" />
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
                    Bet<span className="text-emerald-500">Tracker</span>
                </h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Intelligence Ecosystem</p>
            </div>

            <div className="glass-card rounded-[2.5rem] p-8 md:p-10">
                <AnimatePresence mode="wait">
                    {view === 'login' ? (
                        <motion.div key="login" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                            <div className="text-center mb-8">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter italic">Terminal de Acesso</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 uppercase font-bold tracking-widest">Autenticação Requerida</p>
                            </div>

                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-500 text-xs font-bold leading-relaxed">
                                    <AlertCircle size={18} className="flex-shrink-0" /> 
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <button 
                                onClick={handleGoogleLogin} 
                                disabled={loading}
                                className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white py-4 rounded-2xl flex items-center justify-center gap-3 transition-all mb-6 font-bold shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                <GoogleIcon />
                                <span>{loading ? 'Aguarde...' : 'Entrar com Google'}</span>
                            </button>

                            <div className="relative mb-8 text-center">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                                <span className="relative bg-white dark:bg-slate-900 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ou credenciais</span>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">E-mail Operacional</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="exemplo@gmail.com" className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Chave de Acesso</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                        <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl pl-12 pr-12 py-4 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-emerald-500 transition-colors">
                                            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white dark:text-[#020617] font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50">
                                    {loading ? 'SINCRONIZANDO...' : 'INICIAR SESSÃO'}
                                    {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                                </button>
                            </form>

                            <div className="mt-8 text-center flex flex-col gap-3">
                                <button onClick={() => setView('register')} className="text-xs font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest hover:underline">Solicitar Acesso</button>
                                <button onClick={() => setView('recover')} className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter hover:text-slate-600">Esqueci minha senha</button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="alt" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                             <div className="text-center mb-8">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter italic">{view === 'register' ? 'Nova Licença' : 'Recuperar'}</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 uppercase font-bold tracking-widest">Protocolo de Segurança</p>
                            </div>
                            
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-500 text-xs font-bold leading-relaxed">
                                    <AlertCircle size={18} className="flex-shrink-0" /> 
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">E-mail Operacional</label>
                                    <input type="email" placeholder="seu@gmail.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl px-6 py-4 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400" required />
                                </div>
                                {view === 'register' && (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Criar Senha (Mín. 6)</label>
                                        <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl px-6 py-4 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400" required />
                                    </div>
                                )}
                                <button type="submit" disabled={loading} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50">
                                    {loading ? 'PROCESSANDO...' : (view === 'register' ? 'SOLICITAR REGISTRO' : 'ENVIAR INSTRUÇÕES')}
                                </button>
                            </form>
                            <button onClick={() => setView('login')} className="mt-8 text-slate-500 text-sm font-bold hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-2 mx-auto transition-colors">
                                <ArrowLeft size={16} /> Voltar ao Terminal
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="mt-10 flex items-center justify-center gap-2 text-slate-400/50">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encryption</span>
            </div>
        </motion.div>
    </div>
  );
};

export default Auth;
