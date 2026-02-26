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
  BarChart3,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

// Import do componente de Cookies
import CookieConsent from '../components/ui/CookieConsent';

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
      
      {/* Componente de Cookies LGPD */}
      <CookieConsent />

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
              className="bg-white text-slate-950 px-5 md:px-7 py-2.5 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-emerald-400 hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-emerald-500/20 active:scale-95"
            >
              Criar Conta
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-36 pb-20 md:pt-48 md:pb-40 px-6 overflow-hidden">
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
              Sistema v5.0 Liberado (Com Inteligência Artificial)
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05] mb-6"
          >
            Gestão profissional para <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-400 animate-gradient bg-300%">
              investimentos esportivos.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
          >
            A plataforma definitiva para controle de portfólio, leitura preditiva de gráficos (Motores ExC, ExG e Scout IA) e proteção de capital. Saia do amadorismo e tenha a infraestrutura de um gestor quantitativo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center relative z-20"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
                <button 
                onClick={handleSignUp}
                className="group relative bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] active:scale-95 w-full sm:w-auto overflow-hidden z-20"
                >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    Começar Grátis <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
                
                <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-slate-400 hover:text-white font-bold text-sm px-8 py-5 transition-colors flex items-center gap-2 group z-20"
                >
                Ver Funcionalidades <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
            
            <div className="flex items-center gap-2 mt-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                <CheckCircle2 size={12} className="text-emerald-500" />
                Não exige cartão de crédito
            </div>
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
                  <img 
                    src="https://i.ibb.co/G44jBSdj/DASHBOARD-SYSTEM.webp" 
                    alt="Dashboard do Sistema de Gestão" 
                    className="w-full h-full object-cover object-top opacity-100 hover:scale-[1.01] transition-transform duration-1000"
                    loading="eager"
                  />
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
              Centralize toda sua operação em um sistema profissional, auditável, seguro e guiado por Inteligência Artificial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 auto-rows-[350px]">
            
            {/* 1. GESTÃO DE BANCAS */}
            <div className="md:col-span-6 lg:col-span-8 bg-[#0b101e] border border-white/5 rounded-[2rem] overflow-hidden group hover:border-emerald-500/30 transition-all duration-500 flex flex-col md:flex-row relative z-10">
              <div className="p-8 md:p-10 flex flex-col justify-between relative z-20 md:w-5/12 bg-gradient-to-b md:bg-gradient-to-r from-[#0b101e] via-[#0b101e]/90 to-transparent">
                 <div>
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 text-emerald-500 border border-emerald-500/20">
                       <ShieldCheck size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Múltiplos Portfólios</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                       Gerencie o capital alocado em diferentes bolsas esportivas simultaneamente. Controle o fluxo de caixa, aportes e saques em um só lugar.
                    </p>
                 </div>
              </div>
              <div className="relative flex-1 h-64 md:h-auto overflow-hidden md:rounded-tl-2xl border-t md:border-l border-white/10 z-10">
                 <img 
                    src="https://i.ibb.co/4vScY8q/banca.webp" 
                    alt="Tela de Gestão Financeira" 
                    className="w-full h-full object-cover object-left-top transform translate-x-4 translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500"
                    loading="lazy"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0b101e] via-transparent to-transparent md:hidden z-20 pointer-events-none" />
              </div>
            </div>

            {/* 2. CALCULADORAS (AGORA IA SCOUT E EXG/EXC) */}
            <div className="md:col-span-3 lg:col-span-4 bg-[#0b101e] border border-white/5 rounded-[2rem] relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500 flex flex-col justify-between">
               <div className="p-8 z-20 relative bg-gradient-to-b from-[#0b101e] via-[#0b101e]/80 to-transparent">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4 text-indigo-500 border border-indigo-500/20">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Scout IA, ExC & ExG</h3>
                  <p className="text-slate-400 text-sm">
                    Motores preditivos de Gols e Cantos para varrer a grade e construir a múltipla perfeita (EV+) automaticamente.
                  </p>
               </div>
               <div className="w-full h-[50%] mt-auto relative z-10 overflow-hidden border-t border-white/10 bg-indigo-950/20 flex items-center justify-center">
                 <BrainCircuit size={80} className="text-indigo-500/20 group-hover:text-indigo-500/40 transition-colors duration-500 group-hover:scale-110" />
                 <div className="absolute inset-0 bg-gradient-to-b from-[#0b101e] to-transparent z-20 pointer-events-none" />
               </div>
            </div>

            {/* 3. HISTÓRICO */}
            <div className="md:col-span-3 lg:col-span-4 bg-[#0b101e] border border-white/5 rounded-[2rem] relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500 flex flex-col justify-between">
               <div className="p-8 z-20 relative bg-gradient-to-b from-[#0b101e] via-[#0b101e]/80 to-transparent">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 text-blue-500 border border-blue-500/20">
                    <BarChart3 size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Diário Operacional</h3>
                  <p className="text-slate-400 text-sm">
                    Filtros avançados e visualização clara do desempenho de cada entrada no mercado.
                  </p>
               </div>
               <div className="w-full h-[50%] mt-auto relative z-10 overflow-hidden border-t border-white/10">
                 <img 
                    src="https://i.ibb.co/PsyXgqkf/HIST-RICO.webp" 
                    alt="Histórico de Registros" 
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                    loading="lazy" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-b from-[#0b101e] to-transparent z-20 pointer-events-none" />
               </div>
            </div>

            {/* 4. ESTRATÉGIAS */}
            <div className="md:col-span-6 lg:col-span-8 bg-[#0b101e] border border-white/5 rounded-[2rem] overflow-hidden group hover:border-orange-500/30 transition-all duration-500 flex flex-col md:flex-row relative z-10">
              <div className="p-8 md:p-10 flex flex-col justify-between relative z-20 md:w-5/12 bg-gradient-to-b md:bg-gradient-to-r from-[#0b101e] via-[#0b101e]/90 to-transparent">
                 <div>
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4 text-orange-500 border border-orange-500/20">
                       <Target size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Modelos de Validação</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                       Não opere no escuro. Cadastre e valide suas estratégias para descobrir exatamente quais métricas trazem consistência no longo prazo.
                    </p>
                 </div>
              </div>
              <div className="relative flex-1 h-64 md:h-auto overflow-hidden md:rounded-tl-2xl border-t md:border-l border-white/10 z-10">
                 <img 
                    src="https://i.ibb.co/rR2T5ZWr/ESTRATEGY.webp" 
                    alt="Biblioteca de Modelos" 
                    className="w-full h-full object-cover object-left-top transform translate-x-6 translate-y-6 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-500"
                    loading="lazy"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0b101e] via-transparent to-transparent md:hidden z-20 pointer-events-none" />
              </div>
            </div>

             {/* 5. PERFORMANCE */}
             <div className="md:col-span-3 lg:col-span-4 bg-[#0b101e] border border-white/5 rounded-[2rem] relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-500 flex flex-col justify-between">
               <div className="p-8 z-20 relative bg-gradient-to-b from-[#0b101e] via-[#0b101e]/80 to-transparent">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4 text-cyan-500 border border-cyan-500/20">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Métricas e Consistência</h3>
                  <p className="text-slate-400 text-sm">
                    Painel visual analítico para mapear a saúde do seu capital e seu Hit-Rate.
                  </p>
               </div>
               <div className="w-full h-[45%] mt-auto relative z-10 overflow-hidden border-t border-white/10">
                 <img 
                    src="https://i.ibb.co/yFjLBfVF/CALENDAR.webp" 
                    alt="Dashboard Analítico" 
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                    loading="lazy" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-b from-[#0b101e] to-transparent z-20 pointer-events-none" />
               </div>
            </div>

            {/* 6. MOBILE FIRST */}
            <div className="md:col-span-6 lg:col-span-12 min-h-[500px] md:h-[500px] bg-gradient-to-br from-[#0b101e] to-emerald-950/20 border border-white/5 rounded-[2rem] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-10 group">
                
                {/* Content */}
                <div className="flex-1 relative z-20 text-center md:text-left order-2 md:order-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                        <Smartphone size={12} /> Mobile First
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                        SEU ESCRITÓRIO <br/> <span className="text-emerald-500">NO SEU BOLSO.</span>
                    </h3>
                    <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto md:mx-0 font-medium leading-relaxed">
                        Interface responsiva direto pelo navegador do celular. Rápido, fluido e sem burocracias de loja de apps. Adicione à tela de início para acesso instantâneo.
                    </p>
                    <button 
                        onClick={handleSignUp} 
                        className="bg-emerald-500 text-slate-950 px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/30 relative z-30"
                    >
                        Criar Conta
                    </button>
                </div>

                {/* Mobile Mockup REAL */}
                <div className="flex-1 w-full flex justify-center relative z-10 order-1 md:order-2 mb-4 md:mb-0 pointer-events-none">
                    <div className="relative w-[240px] md:w-[280px] h-[500px] md:h-[580px] bg-[#020617] border-[8px] border-[#1e293b] rounded-[3rem] shadow-2xl overflow-hidden ring-1 ring-white/10 rotate-[-3deg] group-hover:rotate-0 transition-transform duration-700">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1e293b] rounded-b-2xl z-30"></div>
                        <img 
                            src="https://i.ibb.co/YFQFFLvY/mobile.webp" 
                            alt="Visualização Mobile do Sistema" 
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
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
            
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-white tracking-tight">Pare de contar com a sorte.</h2>
            <p className="text-emerald-100/70 text-lg mb-10 max-w-2xl mx-auto font-medium">
              Acesso imediato às ferramentas essenciais. Crie sua conta gratuita em menos de 30 segundos e comece a gerenciar seu capital de forma analítica.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                onClick={handleSignUp}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95 hover:scale-105"
                >
                Iniciar Controle Gratuito
                </button>
            </div>
            
            <p className="mt-8 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Arquitetura de Gestão Profissional
            </p>
          </div>
        </div>
      </section>

      {/* --- FOOTER BLINDADO --- */}
      <footer className="bg-[#020617] border-t border-slate-800 py-12 px-6 mt-10">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          
          {/* Links Obrigatórios */}
          <div className="flex flex-wrap justify-center gap-6 mb-8 text-xs font-bold uppercase tracking-widest text-slate-500">
            <a href="https://docs.google.com/document/d/1wDahOoeTtlRRj5QXLuxyEEGaIXD24P10ixak5I6fpT4/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">Termos de Uso</a>
            <a href="https://docs.google.com/document/d/1oqh1V6PAQybR3wPWlRu_9UZ9yzrW48tTsTVubwy6S6k/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">Política de Privacidade</a>
            <a href="mailto:agenciasimplificaads@gmail.com" className="hover:text-emerald-500 transition-colors">agenciasimplificaads@gmail.com</a>
          </div>

          {/* Disclaimer Obrigatório (Gateway Compliance) */}
          <p className="text-[10px] text-slate-600 max-w-4xl leading-relaxed mb-6">
            AVISO LEGAL: O BetTracker PRO é exclusivamente um software de gestão de portfólio, registro de dados e fornecimento de calculadoras matemáticas. Nós não somos uma casa de apostas, não vendemos sinais, não fazemos recomendações de investimentos e não prometemos ou garantimos ganhos financeiros. O sucesso no mercado depende exclusivamente das decisões e habilidades do usuário.
          </p>

          <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} BetTracker PRO. Todos os direitos reservados a simplifica.dev.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;