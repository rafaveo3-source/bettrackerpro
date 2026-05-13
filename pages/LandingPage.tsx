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
    <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Componente de Cookies LGPD */}
      <CookieConsent />

      {/* --- NAVBAR --- */}
      <nav className="fixed w-full z-50 bg-[#000000]/80 backdrop-blur-xl border-b border-[#1C1C1E] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo(0,0)}>
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-sm transition-transform duration-300 group-hover:scale-105">
              B
            </div>
            <span className="font-bold text-lg tracking-tight hidden md:block">
              BETTRACKER <span className="text-indigo-500">PRO</span>
            </span>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={handleLogin} 
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              Entrar
            </button>
            <button 
              onClick={handleSignUp} 
              className="bg-white text-slate-900 px-5 md:px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm active:scale-95"
            >
              Criar Conta
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-36 pb-20 md:pt-48 md:pb-40 px-6 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8 backdrop-blur-md cursor-default transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              System v5.0 Liberado
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            Gestão profissional para <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              investimentos esportivos.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-[#8E8E93] max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
          >
            A plataforma definitiva para controle de portfólio, leitura preditiva de gráficos e proteção de capital. Saia do amadorismo e tenha a infraestrutura de um gestor quantitativo.
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
                className="bg-white text-slate-900 hover:bg-slate-200 px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all shadow-sm active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2"
                >
                    Começar Grátis <ArrowRight size={16} />
                </button>
                
                <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-[#8E8E93] hover:text-white font-bold text-sm px-6 py-4 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                    Ver Funcionalidades <ChevronRight size={16} />
                </button>
            </div>
            
            <div className="flex items-center justify-center gap-2 mt-6 text-[10px] uppercase tracking-widest text-[#636366] font-bold">
                <CheckCircle2 size={12} className="text-emerald-500" />
                Não exige cartão de crédito
            </div>
          </motion.div>
        </div>
      </section>

      {/* DASHBOARD HERO IMAGE (3D Tilt Minimal) */}
      <section className="px-4 md:px-8 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto relative z-10"
          >
            <div className="relative rounded-2xl md:rounded-[2rem] p-1 bg-[#1C1C1E] border border-[#2C2C2E] shadow-2xl">
               <div className="aspect-[16/9] w-full bg-[#000000] rounded-xl md:rounded-3xl overflow-hidden relative border border-[#2C2C2E]">
                  <img 
                    src="https://i.ibb.co/G44jBSdj/DASHBOARD-SYSTEM.webp" 
                    alt="Dashboard do Sistema de Gestão" 
                    className="w-full h-full object-cover object-top opacity-90 hover:opacity-100 transition-opacity duration-700"
                    loading="eager"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#000000] to-transparent pointer-events-none" />
               </div>
            </div>
          </motion.div>
      </section>

      {/* --- BENTO GRID (FUNCIONALIDADES) --- */}
      <section id="features" className="py-24 px-6 bg-[#000000] border-t border-[#1C1C1E] relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">O Fim das Planilhas.</h2>
            <p className="text-[#8E8E93] text-lg max-w-2xl mx-auto font-medium">
              Centralize toda sua operação em um sistema profissional, auditável, seguro e guiado por Inteligência Artificial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 auto-rows-auto md:auto-rows-[350px]">
            
            {/* 1. GESTÃO DE BANCAS */}
            <div className="md:col-span-6 lg:col-span-8 bg-[#0b101e] border border-[#2C2C2E] rounded-3xl overflow-hidden group hover:border-[#3A3A3C] transition-all duration-300 flex flex-col md:flex-row relative z-10">
              <div className="p-8 flex flex-col justify-center relative z-20 md:w-5/12 bg-[#0b101e]">
                 <div>
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-5 text-emerald-500 border border-emerald-500/20">
                       <ShieldCheck size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Múltiplos Portfólios</h3>
                    <p className="text-[#8E8E93] text-sm leading-relaxed font-medium">
                       Gerencie o capital alocado em diferentes bolsas esportivas simultaneamente. Controle o fluxo de caixa, aportes e saques em um só lugar.
                    </p>
                 </div>
              </div>
              <div className="relative flex-1 h-64 md:h-auto overflow-hidden md:rounded-tl-2xl border-t md:border-l border-[#2C2C2E] z-10 bg-[#000000]">
                 <img 
                    src="https://i.ibb.co/4vScY8q/banca.webp" 
                    alt="Tela de Gestão Financeira" 
                    className="w-full h-full object-cover object-left-top transform translate-x-4 translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500 opacity-90"
                    loading="lazy"
                 />
              </div>
            </div>

            {/* 2. CALCULADORAS E IA */}
            <div className="md:col-span-3 lg:col-span-4 bg-[#0b101e] border border-[#2C2C2E] rounded-3xl relative overflow-hidden group hover:border-[#3A3A3C] transition-all duration-300 flex flex-col justify-between">
               <div className="p-8 z-20 relative bg-[#0b101e]">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-5 text-indigo-500 border border-indigo-500/20">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Scout IA & Modelos</h3>
                  <p className="text-[#8E8E93] text-sm font-medium leading-relaxed">
                    Motores preditivos para varrer a grade, extrair dados complexos e identificar Valor Esperado Positivo (+EV) automaticamente.
                  </p>
               </div>
               <div className="w-full h-40 md:h-[45%] mt-auto relative z-10 overflow-hidden border-t border-[#2C2C2E] bg-[#020617] flex items-center justify-center">
                 <BrainCircuit size={64} className="text-indigo-500/20 group-hover:text-indigo-500/40 transition-colors duration-500 group-hover:scale-110" />
               </div>
            </div>

            {/* 3. HISTÓRICO */}
            <div className="md:col-span-3 lg:col-span-4 bg-[#0b101e] border border-[#2C2C2E] rounded-3xl relative overflow-hidden group hover:border-[#3A3A3C] transition-all duration-300 flex flex-col justify-between">
               <div className="p-8 z-20 relative bg-[#0b101e]">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-5 text-blue-500 border border-blue-500/20">
                    <BarChart3 size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Diário Operacional</h3>
                  <p className="text-[#8E8E93] text-sm font-medium leading-relaxed">
                    Filtros avançados, busca e visualização clara do desempenho de cada entrada registrada no mercado.
                  </p>
               </div>
               <div className="w-full h-48 md:h-[50%] mt-auto relative z-10 overflow-hidden border-t border-[#2C2C2E]">
                 <img 
                    src="https://i.ibb.co/PsyXgqkf/HIST-RICO.webp" 
                    alt="Histórico de Registros" 
                    className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                    loading="lazy" 
                 />
               </div>
            </div>

            {/* 4. ESTRATÉGIAS */}
            <div className="md:col-span-6 lg:col-span-8 bg-[#0b101e] border border-[#2C2C2E] rounded-3xl overflow-hidden group hover:border-[#3A3A3C] transition-all duration-300 flex flex-col md:flex-row relative z-10">
              <div className="p-8 md:p-10 flex flex-col justify-center relative z-20 md:w-5/12 bg-[#0b101e]">
                 <div>
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mb-5 text-orange-500 border border-orange-500/20">
                       <Target size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Modelos de Validação</h3>
                    <p className="text-[#8E8E93] text-sm leading-relaxed font-medium">
                       Não opere no escuro. Cadastre e valide suas estratégias para descobrir exatamente quais métricas e mercados trazem consistência no longo prazo.
                    </p>
                 </div>
              </div>
              <div className="relative flex-1 h-64 md:h-auto overflow-hidden md:rounded-tl-2xl border-t md:border-l border-[#2C2C2E] z-10 bg-[#000000]">
                 <img 
                    src="https://i.ibb.co/rR2T5ZWr/ESTRATEGY.webp" 
                    alt="Biblioteca de Modelos" 
                    className="w-full h-full object-cover object-left-top transform translate-x-4 translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500 opacity-90"
                    loading="lazy"
                 />
              </div>
            </div>

             {/* 5. PERFORMANCE */}
             <div className="md:col-span-3 lg:col-span-4 bg-[#0b101e] border border-[#2C2C2E] rounded-3xl relative overflow-hidden group hover:border-[#3A3A3C] transition-all duration-300 flex flex-col justify-between">
               <div className="p-8 z-20 relative bg-[#0b101e]">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-5 text-cyan-500 border border-cyan-500/20">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Visão de Consistência</h3>
                  <p className="text-[#8E8E93] text-sm font-medium leading-relaxed">
                    Painel analítico completo para mapear a saúde do seu capital, Drawdown Máximo e seu Hit-Rate.
                  </p>
               </div>
               <div className="w-full h-48 md:h-[45%] mt-auto relative z-10 overflow-hidden border-t border-[#2C2C2E]">
                 <img 
                    src="https://i.ibb.co/yFjLBfVF/CALENDAR.webp" 
                    alt="Dashboard Analítico" 
                    className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                    loading="lazy" 
                 />
               </div>
            </div>

            {/* 6. 🔥 NOVO: PLANEJADOR QUANTITATIVO (ORÁCULO) 🔥 */}
            <div className="md:col-span-6 lg:col-span-8 bg-[#0b101e] border border-[#2C2C2E] rounded-3xl overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 flex flex-col md:flex-row relative z-10">
              <div className="p-8 md:p-10 flex flex-col justify-center relative z-20 md:w-1/2 bg-[#0b101e]">
                 <div>
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 text-emerald-500 border border-emerald-500/20">
                       <Target size={20} />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-4">
                        <Sparkles size={10} /> Exclusivo Plano PRO
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">O Oráculo da Gestão</h3>
                    <p className="text-[#8E8E93] text-sm leading-relaxed font-medium">
                        Pare de adivinhar stakes. Diga quanto quer lucrar e o sistema varre seu histórico de apostas para te dizer exatamente <strong>quantos Reais (R$)</strong> investir na próxima entrada sem risco de ruína.
                    </p>
                 </div>
              </div>
              <div className="relative flex-1 h-64 md:h-auto overflow-hidden md:rounded-tl-2xl border-t md:border-l border-[#2C2C2E] z-10 bg-[#000000] flex items-center justify-center">
                 {/* Visual Mockup do Oráculo */}
                 <div className="absolute inset-0 bg-emerald-500/5 blur-[80px]" />
                 <div className="w-full max-w-[260px] relative z-10">
                     <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-2xl p-6 shadow-xl">
                         <div className="flex justify-between items-center mb-5">
                            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Aposte Isso</p>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                         </div>
                         <h4 className="text-3xl font-bold text-emerald-500 mb-5 tracking-tight font-mono">R$ 24,50</h4>
                         <div className="w-full bg-[#2C2C2E] h-1.5 rounded-full overflow-hidden mb-2">
                             <div className="bg-emerald-500 w-[65%] h-full rounded-full" />
                         </div>
                         <p className="text-[9px] text-[#8E8E93] text-right font-bold tracking-widest uppercase mt-3">Meta: 65% concluída</p>
                     </div>
                 </div>
              </div>
            </div>

            {/* 7. MOBILE FIRST */}
            <div className="md:col-span-6 lg:col-span-12 min-h-[400px] md:h-[450px] bg-[#0b101e] border border-[#2C2C2E] rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-10 group">
                
                {/* Content */}
                <div className="flex-1 relative z-20 text-center md:text-left order-2 md:order-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#2C2C2E] text-white text-[10px] font-bold uppercase tracking-widest mb-6">
                        <Smartphone size={12} /> Mobile First
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight tracking-tight">
                        SEU ESCRITÓRIO <br/> NO SEU BOLSO.
                    </h3>
                    <p className="text-[#8E8E93] text-base mb-8 max-w-md mx-auto md:mx-0 font-medium leading-relaxed">
                        Interface ultra responsiva direto pelo navegador. Rápido, fluido e sem burocracias de loja de apps. Adicione à tela de início.
                    </p>
                    <button 
                        onClick={handleSignUp} 
                        className="bg-white text-slate-900 px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm active:scale-95 relative z-30"
                    >
                        Criar Conta Gratuita
                    </button>
                </div>

                {/* Mobile Mockup REAL */}
                <div className="flex-1 w-full flex justify-center relative z-10 order-1 md:order-2 mb-4 md:mb-0 pointer-events-none">
                    <div className="relative w-[220px] md:w-[260px] h-[450px] md:h-[520px] bg-[#000000] border-[6px] border-[#1C1C1E] rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-white/5 rotate-[-5deg] group-hover:rotate-0 transition-transform duration-700">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#1C1C1E] rounded-b-xl z-30"></div>
                        <img 
                            src="https://i.ibb.co/YFQFFLvY/mobile.webp" 
                            alt="Visualização Mobile do Sistema" 
                            className="w-full h-full object-cover opacity-90"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] to-transparent opacity-50 z-20" />
                    </div>
                </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-24 px-6 bg-[#000000]">
        <div className="max-w-5xl mx-auto bg-[#0b101e] border border-[#2C2C2E] rounded-3xl p-10 md:p-20 text-center relative overflow-hidden">
          
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-[#1C1C1E] border border-[#3A3A3C] rounded-2xl flex items-center justify-center text-white mx-auto mb-8 shadow-sm">
                <Trophy size={32} />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">Pare de contar com a sorte.</h2>
            <p className="text-[#8E8E93] text-lg mb-10 max-w-2xl mx-auto font-medium">
              Acesso imediato às ferramentas essenciais. Crie sua conta gratuita em menos de 30 segundos e comece a gerenciar seu capital de forma analítica.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                onClick={handleSignUp}
                className="bg-white text-slate-900 hover:bg-slate-200 px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
                >
                Iniciar Controle Gratuito
                </button>
            </div>
            
            <p className="mt-8 text-[10px] text-[#636366] font-bold uppercase tracking-widest">
              Arquitetura de Gestão Profissional
            </p>
          </div>
        </div>
      </section>

      {/* --- FOOTER BLINDADO --- */}
      <footer className="bg-[#000000] border-t border-[#1C1C1E] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          
          {/* Links Obrigatórios */}
          <div className="flex flex-wrap justify-center gap-6 mb-8 text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">
            <a href="https://docs.google.com/document/d/1wDahOoeTtlRRj5QXLuxyEEGaIXD24P10ixak5I6fpT4/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Termos de Uso</a>
            <a href="https://docs.google.com/document/d/1oqh1V6PAQybR3wPWlRu_9UZ9yzrW48tTsTVubwy6S6k/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Política de Privacidade</a>
            <a href="mailto:agenciasimplificaads@gmail.com" className="hover:text-white transition-colors">agenciasimplificaads@gmail.com</a>
          </div>

          {/* Disclaimer Obrigatório (Gateway Compliance) */}
          <p className="text-[10px] text-[#636366] max-w-4xl leading-relaxed mb-6 font-medium">
            AVISO LEGAL: O BetTracker PRO é exclusivamente um software de gestão de portfólio, registro de dados e fornecimento de calculadoras matemáticas. Nós não somos uma casa de apostas, não vendemos sinais, não fazemos recomendações de investimentos e não prometemos ou garantimos ganhos financeiros. O sucesso no mercado depende exclusivamente das decisões e habilidades do usuário.
          </p>

          <p className="text-[10px] text-[#636366] font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} BetTracker PRO. Todos os direitos reservados a simplifica.dev.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;