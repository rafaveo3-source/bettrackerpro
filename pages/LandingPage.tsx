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
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  BarChart3
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
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-[#020617] text-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300">
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
              Criar Conta Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-36 pb-20 md:pt-48 md:pb-40 px-6 overflow-hidden">
        {/* Efeitos de Fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full -z-10 opacity-60 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 backdrop-blur-md cursor-default hover:bg-emerald-500/20 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Sistema v5.0 Liberado
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05] mb-6"
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
            A plataforma definitiva para gestão de bancas, validação de métodos e controle emocional. Saia do amadorismo e tenha a infraestrutura de um investidor.
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
                Começar Grátis <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
            
            <button 
               onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
               className="text-slate-400 hover:text-white font-bold text-sm px-8 py-5 transition-colors flex items-center gap-2 group"
            >
              Ver Funcionalidades <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>

          {/* DASHBOARD HERO IMAGE (3D Tilt) */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-16 md:mt-24 relative z-10"
          >
            <div className="relative rounded-2xl md:rounded-[2rem] p-1.5 md:p-3 bg-gradient-to-b from-white/10 to-transparent border border-white/10 shadow-2xl shadow-emerald-900/40">
               <div className="aspect-[16/9] w-full bg-slate-950 rounded-xl md:rounded-[1.5rem] overflow-hidden relative shadow-inner">
                  {/* Print Principal - Dashboard */}
                  <img 
                    src="https://i.ibb.co/G44jBSdj/DASHBOARD-SYSTEM.webp" 
                    alt="Dashboard do Sistema de Gestão de Bancas" 
                    className="w-full h-full object-cover object-top opacity-100 hover:scale-[1.01] transition-transform duration-1000"
                    loading="eager"
                  />
                  {/* Overlay Gradiente Inferior para fusão suave */}
                  <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none" />
               </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* --- BENTO GRID (FUNCIONALIDADES) --- */}
      <section id="features" className="py-24 px-6 bg-[#020617] relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">O FIM DAS PLANILHAS.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Centralize toda sua operação em um sistema profissional, auditável e seguro.
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 auto-rows-[350px]">
            
            {/* 1. GESTÃO DE BANCAS (Largo) */}
            <div className="md:col-span-6 lg:col-span-8 bg-[#0b101e] border border-white/5 rounded-[2rem] relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
              <div className="absolute inset-0 p-8 z-20 flex flex-col justify-between pointer-events-none">
                 <div className="max-w-md">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 text-emerald-500 border border-emerald-500/20">
                       <ShieldCheck size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Gestão de Banca Blindada</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                       Gerencie saldos de diferentes casas (Bet365, Pinnacle) simultaneamente. Registre aportes, saques e visualize o crescimento real do seu capital.
                    </p>
                 </div>
              </div>
              
              {/* Imagem posicionada para mostrar o conteúdo relevante */}
              <div className="absolute right-0 bottom-0 w-[65%] h-[85%] z-10 rounded-tl-2xl overflow-hidden shadow-2xl transform translate-y-4 translate-x-4 group-hover:translate-y-2 group-hover:translate-x-2 transition-transform duration-500 border-t border-l border-white/10">
                 <img 
                    src="https://i.ibb.co/4vScY8q/banca.webp" 
                    alt="Tela de Gestão de Banca" 
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                 />
              </div>
              
              {/* Gradiente de proteção de texto */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b101e] via-[#0b101e]/80 to-transparent z-15 pointer-events-none" />
            </div>

            {/* 2. CALCULADORAS (Alto) */}
            <div className="md:col-span-3 lg:col-span-4 bg-[#0b101e] border border-white/5 rounded-[2rem] relative overflow-hidden group hover:border-purple-500/30 transition-all duration-500">
               <div className="absolute inset-0 p-8 z-20 pointer-events-none">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 text-purple-500 border border-purple-500/20">
                    <BrainCircuit size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Calculadoras Pro</h3>
                  <p className="text-slate-400 text-sm">
                    Arbitragem, Dutching, Kelly e +EV integradas ao fluxo de aposta.
                  </p>
               </div>
               
               <div className="absolute -bottom-10 -right-10 w-full h-[60%] z-10 transform group-hover:scale-105 transition-transform duration-500 shadow-2xl">
                 <img 
                    src="https://i.ibb.co/PzhLQQR6/calculator.webp" 
                    alt="Calculadoras de Apostas" 
                    className="w-full h-full object-cover object-top rounded-tl-2xl border-t border-l border-white/10"
                    loading="lazy" 
                 />
               </div>
               <div className="absolute inset-0 bg-gradient-to-b from-[#0b101e] via-transparent to-transparent z-15 pointer-events-none" />
            </div>

            {/* 3. HISTÓRICO (Alto) */}
            <div className="md:col-span-3 lg:col-span-4 bg-[#0b101e] border border-white/5 rounded-[2rem] relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
               <div className="absolute inset-0 p-8 z-20 pointer-events-none">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 text-blue-500 border border-blue-500/20">
                    <BarChart3 size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Histórico Auditável</h3>
                  <p className="text-slate-400 text-sm">
                    Filtros avançados e visualização clara de cada operação pendente ou finalizada.
                  </p>
               </div>
               
               <div className="absolute -bottom-5 -right-5 w-[110%] h-[55%] z-10 transform rotate-[-2deg] group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                 <img 
                    src="https://i.ibb.co/PsyXgqkf/HIST-RICO.webp" 
                    alt="Histórico de Apostas" 
                    className="w-full h-full object-cover object-top rounded-tl-2xl border-t border-l border-white/10"
                    loading="lazy" 
                 />
               </div>
               <div className="absolute inset-0 bg-gradient-to-b from-[#0b101e] via-transparent to-transparent z-15 pointer-events-none" />
            </div>

            {/* 4. ESTRATÉGIAS (Largo) */}
            <div className="md:col-span-6 lg:col-span-8 bg-[#0b101e] border border-white/5 rounded-[2rem] relative overflow-hidden group hover:border-orange-500/30 transition-all duration-500">
              <div className="absolute inset-0 p-8 z-20 flex flex-col justify-between pointer-events-none">
                 <div className="max-w-md">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4 text-orange-500 border border-orange-500/20">
                       <Target size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Biblioteca de Métodos</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                       Não aposte no escuro. Cadastre e valide suas estratégias (Over 2.5, Back Favorito, etc). Saiba exatamente qual método coloca dinheiro no seu bolso.
                    </p>
                 </div>
              </div>
              
              <div className="absolute right-0 bottom-0 w-[60%] h-[90%] z-10 rounded-tl-2xl overflow-hidden shadow-2xl transform translate-y-6 translate-x-6 group-hover:translate-y-4 group-hover:translate-x-4 transition-transform duration-500 border-t border-l border-white/10">
                 <img 
                    src="https://i.ibb.co/rR2T5ZWr/ESTRATEGY.webp" 
                    alt="Biblioteca Estratégica" 
                    className="w-full h-full object-cover object-left-top"
                    loading="lazy"
                 />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b101e] via-[#0b101e]/90 to-transparent z-15 pointer-events-none" />
            </div>

             {/* 5. CALENDAR & MINDSET (Square) */}
             <div className="md:col-span-3 lg:col-span-4 bg-[#0b101e] border border-white/5 rounded-[2rem] relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-500">
               <div className="absolute inset-0 p-8 z-20 pointer-events-none">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4 text-cyan-500 border border-cyan-500/20">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Performance Diária</h3>
                  <p className="text-slate-400 text-sm">
                    Calendário de Greens e Reds para visualizar sua consistência.
                  </p>
               </div>
               
               <div className="absolute -right-4 -bottom-4 w-full h-48 z-10 opacity-80 group-hover:opacity-100 transition-all duration-500">
                 <img 
                    src="https://i.ibb.co/yFjLBfVF/CALENDAR.webp" 
                    alt="Calendário de Performance" 
                    className="w-full h-full object-cover object-top rounded-tl-2xl border-t border-l border-white/5"
                    loading="lazy" 
                 />
               </div>
               <div className="absolute inset-0 bg-gradient-to-b from-[#0b101e] via-transparent to-transparent z-15 pointer-events-none" />
            </div>

            {/* 6. MOBILE FIRST (Full Width) */}
            <div className="md:col-span-6 lg:col-span-12 min-h-[400px] md:h-[500px] bg-gradient-to-br from-[#0b101e] to-emerald-950/20 border border-white/5 rounded-[2rem] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-12 group">
                
                {/* Content */}
                <div className="flex-1 relative z-20 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                        <Smartphone size={12} /> App Nativo (PWA)
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                        SEU ESCRITÓRIO <br/> <span className="text-emerald-500">NO SEU BOLSO.</span>
                    </h3>
                    <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto md:mx-0">
                        Desenvolvido como PWA (Progressive Web App). Instale no iPhone ou Android sem loja de apps e lance suas apostas em segundos, onde estiver.
                    </p>
                    <button onClick={handleSignUp} className="bg-emerald-500 text-slate-950 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/30">
                        Começar Agora
                    </button>
                </div>

                {/* Mobile Mockup REAL */}
                <div className="flex-1 w-full flex justify-center relative z-10">
                    <div className="relative w-[280px] h-[580px] bg-[#020617] border-[8px] border-[#1e293b] rounded-[3rem] shadow-2xl overflow-hidden ring-1 ring-white/10 rotate-[-3deg] group-hover:rotate-0 transition-transform duration-700">
                        
                        {/* Dynamic Island / Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1e293b] rounded-b-2xl z-30"></div>
                        
                        {/* Imagem do App Mobile Real */}
                        <img 
                            src="https://i.ibb.co/YFQFFLvY/mobile.webp" 
                            alt="BetTracker Mobile App" 
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                        
                        {/* Reflection/Glow Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-20" />
                    </div>
                    
                    {/* Back Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/20 blur-[100px] -z-10 rounded-full" />
                </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden group">
          
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full group-hover:bg-emerald-500/30 transition-colors duration-700" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 mx-auto mb-8 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <Trophy size={32} strokeWidth={3} />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-white tracking-tight">Pare de perder dinheiro hoje.</h2>
            <p className="text-emerald-100/70 text-lg mb-10 max-w-2xl mx-auto font-medium">
              Crie sua conta gratuita em menos de 30 segundos. Acesso imediato a todas as ferramentas básicas.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                onClick={handleSignUp}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95 hover:scale-105"
                >
                Criar Minha Conta Grátis
                </button>
            </div>
            
            <p className="mt-8 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Junte-se a apostadores profissionais
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