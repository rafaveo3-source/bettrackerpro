import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle2, 
  Smartphone,
  Trophy,
  Zap,
  Target,
  BrainCircuit,
  Lock,
  ChevronRight
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate('/login?mode=signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo(0,0)}>
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-black text-xl italic shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300">
              B
            </div>
            <span className="font-bold text-lg tracking-tight hidden md:block group-hover:text-emerald-50 transition-colors">
              BETTRACKER <span className="text-emerald-500">PRO</span>
            </span>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={handleLogin} 
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              Login
            </button>
            <button 
              onClick={handleSignUp} 
              className="bg-white text-slate-950 px-5 md:px-7 py-2.5 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-emerald-400 hover:scale-105 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
            >
              Criar Conta
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-20 md:pt-48 md:pb-40 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/15 blur-[120px] rounded-full -z-10 opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10 opacity-40 pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Sistema Profissional v5.0
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05] mb-8"
          >
            Profissionalize suas <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-400 animate-gradient bg-300%">
              apostas esportivas.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
          >
            A plataforma completa para gestão de bancas, validação de métodos e controle emocional. Saia do amadorismo e tenha a infraestrutura de um investidor.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button 
              onClick={handleSignUp}
              className="group relative bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] active:scale-95 w-full sm:w-auto overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Começar Agora <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
            
            <button 
               onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
               className="text-slate-400 hover:text-white font-bold text-sm px-8 py-5 transition-colors flex items-center gap-2 group"
            >
              Ver Sistema em Ação <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>

          {/* DASHBOARD HERO IMAGE */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 5 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-20 relative z-10"
          >
            <div className="relative rounded-2xl md:rounded-[2rem] p-2 bg-gradient-to-b from-white/10 to-white/0 backdrop-blur-sm border border-white/10 shadow-2xl shadow-emerald-900/20">
               <div className="aspect-[16/9] w-full bg-slate-950 rounded-xl md:rounded-[1.5rem] overflow-hidden relative shadow-inner">
                  <img 
                    src="https://i.ibb.co/G44jBSdj/DASHBOARD-SYSTEM.webp" 
                    alt="BetTracker Pro Dashboard" 
                    className="w-full h-full object-cover object-top opacity-90 hover:opacity-100 transition-opacity duration-700"
                  />
                  {/* Overlay Gradient for smooth bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-40" />
               </div>
            </div>
            
            {/* Floating Badges */}
            <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-4 md:-right-10 bg-slate-900/90 backdrop-blur border border-emerald-500/30 p-4 rounded-2xl shadow-xl hidden md:block"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Win Rate</p>
                        <p className="text-lg font-black text-white">68.5%</p>
                    </div>
                </div>
            </motion.div>

            <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-10 -left-4 md:-left-10 bg-slate-900/90 backdrop-blur border border-blue-500/30 p-4 rounded-2xl shadow-xl hidden md:block"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                        <Zap size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">ROI Mensal</p>
                        <p className="text-lg font-black text-white">+12.4%</p>
                    </div>
                </div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* --- BENTO GRID FEATURES --- */}
      <section id="features" className="py-24 px-6 bg-[#020617] relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-6">O FIM DAS PLANILHAS.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Cada ferramenta foi desenhada para cobrir as falhas que planilhas e anotações manuais deixam passar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 grid-auto-rows-[minmax(300px,auto)]">
            
            {/* 1. BANKROLL MANAGEMENT (Wide) */}
            <div className="md:col-span-6 lg:col-span-8 bg-[#0b101e] border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <div className="relative z-20 max-w-md">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 border border-emerald-500/20">
                  <Lock size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Gestão de Banca Blindada</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Controle múltiplas bancas simultaneamente. Aporte, saque e defina sua gestão de stake (Fixa, Percentual ou Kelly) com proteção anti-quebra.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-3/4 md:w-1/2 h-full z-10 opacity-60 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-10 translate-y-10">
                 <img src="https://i.ibb.co/4vScY8q/banca.webp" alt="Gestão de Banca" className="w-full h-full object-contain drop-shadow-2xl" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b101e] via-[#0b101e]/80 to-transparent z-15 pointer-events-none" />
            </div>

            {/* 2. CALCULATORS (Tall) */}
            <div className="md:col-span-3 lg:col-span-4 bg-[#0b101e] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
               <div className="relative z-20">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-500 border border-purple-500/20">
                    <BrainCircuit size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Calculadoras Pro</h3>
                  <p className="text-slate-400 text-sm mb-6">
                    Dutching, Arbitragem, Kelly e Value Bet. Matemática pura a seu favor.
                  </p>
               </div>
               <div className="absolute -right-4 -bottom-4 w-full h-48 z-10 opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105">
                 <img src="https://i.ibb.co/PzhLQQR6/calculator.webp" alt="Calculadoras" className="w-full h-full object-cover object-top rounded-tl-2xl border-t border-l border-white/5" />
               </div>
            </div>

            {/* 3. STRATEGY LIBRARY (Tall) */}
            <div className="md:col-span-3 lg:col-span-4 bg-[#0b101e] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
               <div className="relative z-20">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 text-orange-500 border border-orange-500/20">
                    <Target size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Biblioteca Estratégica</h3>
                  <p className="text-slate-400 text-sm mb-6">
                    Valide seus métodos. Importe estratégias vencedoras e descarte o que dá prejuízo.
                  </p>
               </div>
               <div className="absolute -right-4 -bottom-4 w-full h-56 z-10 opacity-70 group-hover:opacity-100 transition-all duration-500">
                 <img src="https://i.ibb.co/rR2T5ZWr/ESTRATEGY.webp" alt="Estratégias" className="w-full h-full object-cover object-left-top rounded-tl-2xl border-t border-l border-white/5" />
               </div>
            </div>

            {/* 4. PERFORMANCE CALENDAR (Wide) */}
            <div className="md:col-span-6 lg:col-span-8 bg-[#0b101e] border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
              <div className="relative z-20 max-w-md">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-500 border border-blue-500/20">
                  <Trophy size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Histórico & Calendário</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Visualização clara de Greens e Reds. Entenda sua consistência ao longo do mês e identifique padrões de performance.
                </p>
              </div>
              <div className="absolute -right-10 top-10 w-2/3 h-full z-10 opacity-50 group-hover:opacity-90 transition-opacity duration-500 group-hover:scale-[1.02]">
                 <img src="https://i.ibb.co/yFjLBfVF/CALENDAR.webp" alt="Calendário de Performance" className="w-full h-full object-contain drop-shadow-2xl rounded-l-2xl" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b101e] via-[#0b101e]/80 to-transparent z-15 pointer-events-none" />
            </div>

            {/* 5. MINDSET (Full Width) */}
            <div className="md:col-span-6 lg:col-span-12 bg-gradient-to-r from-[#0b101e] to-emerald-950/20 border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 relative z-20">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                  <BrainCircuit size={12} /> Exclusivo
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white mb-4">Controle Emocional (Mindset)</h3>
                <p className="text-slate-400 leading-relaxed text-lg max-w-xl">
                  A maioria quebra banca por emocional, não por técnica. O BetTracker PRO cruza seus dados financeiros com seu estado emocional (Confianca, Tilt, Disciplina) para te alertar antes do prejuízo.
                </p>
                <div className="mt-8 flex gap-4">
                    <button onClick={handleSignUp} className="bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-400 transition-colors">
                        Começar Agora
                    </button>
                </div>
              </div>
              <div className="flex-1 w-full relative h-[300px] md:h-[400px] flex items-center justify-center">
                 <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full" />
                 <img 
                    src="https://i.ibb.co/9mWVVZH0/MINDSET.webp" 
                    alt="Controle de Mindset" 
                    className="relative z-10 w-full h-full object-contain drop-shadow-2xl rounded-2xl transform group-hover:-translate-y-2 transition-transform duration-700" 
                 />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- MOBILE APP CALLOUT --- */}
      <section className="py-24 px-6 relative overflow-hidden border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 z-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 border border-blue-500/20">
                <Smartphone size={14} /> Mobile First
             </div>
             <h2 className="text-4xl md:text-5xl font-black mb-6">LEVE SEU ESCRITÓRIO <br/>NO BOLSO.</h2>
             <p className="text-slate-400 text-lg mb-8 leading-relaxed">
               Desenvolvido como PWA (Progressive Web App). Instale no seu iPhone ou Android sem precisar da App Store e acesse seus dados em milissegundos, onde estiver.
             </p>
             <ul className="space-y-4 mb-10">
                {[
                  "Interface otimizada para toque",
                  "Sem downloads pesados",
                  "Modo Escuro nativo",
                  "Acesso offline a dados recentes"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    {item}
                  </li>
                ))}
             </ul>
          </div>
          <div className="flex-1 relative flex justify-center">
             {/* Simple Phone Mockup */}
             <div className="relative z-10 w-[280px] h-[580px] bg-slate-950 border-[8px] border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden ring-1 ring-white/10">
                <div className="absolute top-0 left-0 right-0 h-7 bg-slate-800 rounded-b-xl z-20 mx-16"></div>
                <div className="w-full h-full bg-[#020617] overflow-hidden">
                    <img src="https://i.ibb.co/G44jBSdj/DASHBOARD-SYSTEM.webp" className="w-full h-full object-cover opacity-80" alt="Mobile View" />
                    {/* Mobile Overlay Content */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent flex flex-col justify-end p-6">
                        <div className="bg-slate-800/80 backdrop-blur p-4 rounded-xl border border-white/10 mb-4">
                            <p className="text-xs text-emerald-400 font-bold uppercase mb-1">Aposta Registrada</p>
                            <p className="text-white font-bold text-sm">Flamengo vs Palmeiras</p>
                        </div>
                    </div>
                </div>
             </div>
             {/* Glow effect */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[500px] bg-blue-600/20 blur-[100px] -z-10 rounded-full" />
          </div>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden group">
          
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full group-hover:bg-emerald-500/30 transition-colors duration-700" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-white tracking-tight">Pare de perder dinheiro hoje.</h2>
            <p className="text-emerald-100/70 text-lg mb-10 max-w-2xl mx-auto font-medium">
              Crie sua conta gratuita em menos de 30 segundos. Sem cartão de crédito. Acesso imediato a todas as ferramentas básicas.
            </p>
            <button 
              onClick={handleSignUp}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95 hover:scale-105"
            >
              Criar Minha Conta Grátis
            </button>
            <p className="mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Junte-se a +2.000 apostadores profissionais
            </p>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 bg-[#01040f] pt-16 pb-8 px-6">
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