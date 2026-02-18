import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../store/useBetStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, CheckCircle2, AlertTriangle, Chrome } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Detecta se veio da Landing Page com ?mode=signup
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'signup') {
      setIsLogin(false);
    }
  }, [location]);

  // Função de Login Social (Google)
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redireciona de volta para o dashboard após login
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError('Erro ao conectar com Google. Tente novamente.');
      setLoading(false);
    }
  };

  // Tradutor de Erros do Supabase
  const translateError = (msg: string) => {
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('User already registered')) return 'Este e-mail já possui cadastro.';
    if (msg.includes('Password should be at least')) return 'A senha deve ter no mínimo 6 caracteres.';
    if (msg.includes('valid email')) return 'Digite um e-mail válido.';
    if (msg.includes('rate limit')) return 'Muitas tentativas. Aguarde um momento.';
    return 'Ocorreu um erro no servidor. Tente novamente.';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Redirecionamento é automático pelo App.tsx
      } else {
        // CADASTRO
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Conta criada com sucesso! Verifique seu e-mail para confirmar o acesso.');
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      console.error(err);
      setError(translateError(err.message || ''));
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
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center gap-2 mb-6 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-black text-xl italic shadow-[0_0_15px_#10b981]">
              B
            </div>
            <span className="font-bold text-white text-xl tracking-tight">BETTRACKER <span className="text-emerald-500">PRO</span></span>
          </div>
          
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
            {isLogin ? 'Bem-vindo de volta' : 'Comece a lucrar hoje'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isLogin 
              ? 'Acesse seu dashboard profissional.' 
              : 'Junte-se à elite dos apostadores profissionais.'}
          </p>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl text-sm transition-all hover:bg-slate-100 flex items-center justify-center gap-2 mb-6"
        >
          {/* Ícone Google Simulado com Lucide ou SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {isLogin ? 'Entrar com Google' : 'Cadastrar com Google'}
        </button>

        <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-500 font-bold uppercase">Ou continue com e-mail</span>
            <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl flex items-start gap-3 mb-4"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-4 rounded-xl flex items-start gap-3 mb-4"
            >
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 tracking-wider">E-mail Profissional</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-500" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 tracking-wider">Senha de Acesso</label>
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

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Acessar Sistema' : 'Criar Conta Grátis')}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-8 text-center pt-6 border-t border-slate-800/50">
          <p className="text-slate-400 text-sm font-medium">
            {isLogin ? 'Novo por aqui?' : 'Já é membro?'}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccessMsg(null);
              }}
              className="ml-2 text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition-all"
            >
              {isLogin ? 'Crie sua conta' : 'Fazer Login'}
            </button>
          </p>
        </div>
      </motion.div>

      {/* Footer Legal */}
      <div className="absolute bottom-6 text-center w-full pointer-events-none">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            © BetTracker Pro. Segurança criptografada.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;