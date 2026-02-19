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
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="fixed w-full z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">

          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo(0, 0)}
          >
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-[#020617] text-lg shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all duration-300">
              B
            </div>
            <span className="font-bold text-lg tracking-tight hidden md:block">
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
              className="bg-emerald-500 text-slate-950 px-7 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/40 active:scale-95"
            >
              Criar Conta Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-36 md:pt-48 pb-24 md:pb-40 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-500/10 blur-[140px] rounded-full -z-10 opacity-60" />

        <div className="max-w-5xl mx-auto text-center relative z-10">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Sistema v5.0 Liberado
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight mb-6"
          >
            Profissionalize suas{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              apostas esportivas.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Gestão de banca, validação de métodos e controle emocional.
            Tenha a infraestrutura de um investidor profissional.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={handleSignUp}
              className="group bg-emerald-500 text-slate-950 px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:bg-emerald-400 active:scale-95 flex items-center gap-2"
            >
              Começar Grátis
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-slate-400 hover:text-white font-semibold text-sm px-6 py-5 transition-colors flex items-center gap-2"
            >
              Ver Funcionalidades <ChevronRight size={16} />
            </button>
          </motion.div>

          {/* DASHBOARD IMAGE */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mt-20 md:mt-28"
          >
            <div className="rounded-[2rem] p-3 bg-gradient-to-b from-white/10 to-transparent border border-white/10 shadow-2xl shadow-emerald-900/40">
              <div className="aspect-[16/9] bg-slate-950 rounded-[1.5rem] overflow-hidden relative">
                <img
                  src="https://i.ibb.co/G44jBSdj/DASHBOARD-SYSTEM.webp"
                  alt="Dashboard profissional de gestão de banca esportiva"
                  className="w-full h-full object-cover object-top"
                  loading="eager"
                />
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none" />
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ================= FEATURES ================= */}

      <section id="features" className="py-28 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-6">
              O FIM DAS PLANILHAS.
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Centralize sua operação em um sistema profissional, auditável e seguro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 auto-rows-[350px]">

            {/* 1 - Múltiplas Bancas */}
            <div className="md:col-span-6 lg:col-span-8 bg-[#0b101e] border border-white/5 rounded-[2rem] overflow-hidden group hover:border-emerald-500/40 transition-all duration-500 flex flex-col md:flex-row shadow-lg hover:shadow-emerald-500/10">

              <div className="p-8 md:p-10 md:w-5/12 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 text-emerald-500 border border-emerald-500/20">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Múltiplas Bancas</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Gerencie saldos de diferentes casas simultaneamente. Registre aportes, saques e visualize crescimento real.
                  </p>
                </div>
              </div>

              <div className="flex-1 h-64 md:h-auto overflow-hidden border-t md:border-l border-white/10">
                <img
                  src="https://i.ibb.co/4vScY8q/banca.webp"
                  alt="Tela de gestão de banca esportiva"
                  className="w-full h-full object-cover object-left-top transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </div>

            {/* 2 - Calculadoras */}
            <div className="md:col-span-3 lg:col-span-4 bg-[#0b101e] border border-white/5 rounded-[2rem] relative overflow-hidden group hover:border-purple-500/40 transition-all duration-500 shadow-lg hover:shadow-purple-500/10">
              <div className="absolute inset-0 p-8 pb-32 z-20 flex flex-col">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 text-purple-500 border border-purple-500/20">
                  <BrainCircuit size={20} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Calculadoras Pro</h3>
                <p className="text-slate-400 text-sm">
                  Arbitragem, Dutching, Kelly e +EV integradas ao fluxo de aposta.
                </p>
              </div>

              <div className="absolute bottom-0 right-0 w-full h-[55%] overflow-hidden border-t border-l border-white/10">
                <img
                  src="https://i.ibb.co/PzhLQQR6/calculator.webp"
                  alt="Calculadoras de apostas profissionais"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
            </div>

            {/* 3 - Histórico */}
            <div className="md:col-span-3 lg:col-span-4 bg-[#0b101e] border border-white/5 rounded-[2rem] relative overflow-hidden group hover:border-blue-500/40 transition-all duration-500 shadow-lg hover:shadow-blue-500/10">
              <div className="absolute inset-0 p-8 pb-32 flex flex-col">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 text-blue-500 border border-blue-500/20">
                  <BarChart3 size={20} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Histórico Auditável</h3>
                <p className="text-slate-400 text-sm">
                  Filtros avançados e visualização clara de cada operação.
                </p>
              </div>

              <div className="absolute bottom-0 right-0 w-full h-[55%] overflow-hidden border-t border-l border-white/10">
                <img
                  src="https://i.ibb.co/PsyXgqkf/HIST-RICO.webp"
                  alt="Histórico de apostas auditável"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
            </div>

            {/* 4 - Estratégias */}
            <div className="md:col-span-6 lg:col-span-8 bg-[#0b101e] border border-white/5 rounded-[2rem] overflow-hidden group hover:border-orange-500/40 transition-all duration-500 flex flex-col md:flex-row shadow-lg hover:shadow-orange-500/10">
              <div className="p-8 md:p-10 md:w-5/12 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4 text-orange-500 border border-orange-500/20">
                    <Target size={20} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Biblioteca de Métodos</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Cadastre e valide suas estratégias. Saiba exatamente o que te dá lucro.
                  </p>
                </div>
              </div>

              <div className="flex-1 h-64 md:h-auto overflow-hidden border-t md:border-l border-white/10">
                <img
                  src="https://i.ibb.co/rR2T5ZWr/ESTRATEGY.webp"
                  alt="Biblioteca estratégica de apostas"
                  className="w-full h-full object-cover object-left-top transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </div>

            {/* 5 - Performance */}
            <div className="md:col-span-3 lg:col-span-4 bg-[#0b101e] border border-white/5 rounded-[2rem] relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-500 shadow-lg hover:shadow-cyan-500/10">
              <div className="absolute inset-0 p-8 pb-32 flex flex-col">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4 text-cyan-500 border border-cyan-500/20">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Performance Diária</h3>
                <p className="text-slate-400 text-sm">
                  Calendário de Greens e Reds para visualizar consistência.
                </p>
              </div>

              <div className="absolute bottom-0 right-0 w-full h-[50%] overflow-hidden border-t border-l border-white/10">
                <img
                  src="https://i.ibb.co/yFjLBfVF/CALENDAR.webp"
                  alt="Calendário de performance diária"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
            </div>

            {/* 6 - Mobile */}
            <div className="md:col-span-6 lg:col-span-12 bg-gradient-to-br from-[#0b101e] to-emerald-950/20 border border-white/5 rounded-[2rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-lg">

              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
                  <Smartphone size={12} /> Mobile First
                </div>

                <h3 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                  SEU ESCRITÓRIO <br />
                  <span className="text-emerald-500">NO SEU BOLSO.</span>
                </h3>

                <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto md:mx-0">
                  Use direto pelo navegador do seu celular, rápido e fluido como um aplicativo.
                </p>

                <button
                  onClick={handleSignUp}
                  className="bg-emerald-500 text-slate-950 px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/30"
                >
                  Começar Agora
                </button>
              </div>

              <div className="flex-1 flex justify-center">
                <div className="relative w-[280px] h-[580px] bg-[#020617] border-[8px] border-[#1e293b] rounded-[3rem] shadow-2xl overflow-hidden ring-1 ring-white/10">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1e293b] rounded-b-2xl z-30"></div>
                  <img
                    src="https://i.ibb.co/YFQFFLvY/mobile.webp"
                    alt="Aplicativo mobile BetTracker Pro"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-[3rem] p-12 md:p-20 text-center shadow-2xl">

          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 mx-auto mb-8 shadow-lg shadow-emerald-500/40">
            <Trophy size={32} strokeWidth={3} />
          </div>

          <h2 className="text-3xl md:text-5xl font-black mb-6">
            Pare de perder dinheiro hoje.
          </h2>

          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Crie sua conta gratuita em menos de 30 segundos.
          </p>

          <button
            onClick={handleSignUp}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-12 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/30 active:scale-95 hover:scale-105"
          >
            Criar Minha Conta Grátis
          </button>

          <p className="mt-8 text-xs text-slate-500 uppercase tracking-widest">
            Junte-se a apostadores profissionais
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#01040f] pt-16 pb-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center font-bold text-xs text-white">B</div>
            <span className="font-bold text-slate-300 tracking-tight text-sm">BETTRACKER PRO</span>
          </div>

          <div className="flex gap-8 text-sm text-slate-500 font-medium">
            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>

          <p className="text-slate-600 text-xs font-medium">
            © {new Date().getFullYear()} BetTracker Pro.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
