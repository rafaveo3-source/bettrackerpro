import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Smartphone,
  Trophy,
  Target,
  BrainCircuit,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  BarChart3
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleSignUp = () => navigate('/login?mode=signup');
  const handleLogin = () => navigate('/login');

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans overflow-x-hidden selection:bg-emerald-500/30">

      {/* NAVBAR */}
      <nav className="fixed w-full z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">

          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo(0, 0)}
          >
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-[#020617] text-lg shadow-md">
              B
            </div>
            <span className="font-semibold text-lg tracking-tight hidden md:block">
              BETTRACKER <span className="text-emerald-500">PRO</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={handleLogin}
              className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Login
            </button>

            <button
              onClick={handleSignUp}
              className="bg-emerald-500 text-slate-950 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/30 active:scale-95"
            >
              Criar Conta Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 md:pt-44 pb-20 px-6">
        <div className="absolute inset-0 flex justify-center">
          <div className="w-[900px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight mb-6"
          >
            Profissionalize suas{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              apostas esportivas
            </span>
          </motion.h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Gestão de banca, validação de métodos e controle emocional em um único sistema.
            Tenha a infraestrutura de um investidor profissional.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">

            <button
              onClick={handleSignUp}
              className="group bg-emerald-500 text-slate-950 px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl hover:shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-2"
            >
              Começar Grátis
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() =>
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="text-slate-400 hover:text-white font-semibold text-sm px-6 py-4 flex items-center justify-center gap-2 transition-colors"
            >
              Ver funcionalidades
              <ChevronRight size={16} />
            </button>
          </div>

          {/* DASHBOARD */}
          <div className="mt-16 md:mt-24">
            <div className="rounded-3xl p-3 bg-gradient-to-b from-white/10 to-transparent border border-white/10 shadow-2xl">
              <div className="aspect-[16/9] bg-slate-950 rounded-2xl overflow-hidden">
                <img
                  src="https://i.ibb.co/G44jBSdj/DASHBOARD-SYSTEM.webp"
                  alt="Dashboard profissional de apostas esportivas"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-6">
            O fim das planilhas.
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Centralize toda sua operação em um sistema auditável e seguro.
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-[2rem] p-12 text-center">
          <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 mx-auto mb-6">
            <Trophy size={28} strokeWidth={3} />
          </div>

          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Pare de perder dinheiro hoje.
          </h2>

          <p className="text-slate-400 mb-8">
            Crie sua conta gratuita em menos de 30 segundos.
          </p>

          <button
            onClick={handleSignUp}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-4 rounded-xl font-bold uppercase text-sm tracking-widest transition-all shadow-lg hover:shadow-emerald-500/30"
          >
            Criar Minha Conta Grátis
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#01040f] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center font-bold text-xs">
              B
            </div>
            <span className="font-semibold text-slate-400 text-sm">
              BETTRACKER PRO
            </span>
          </div>

          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>

          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} BetTracker Pro
          </p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
