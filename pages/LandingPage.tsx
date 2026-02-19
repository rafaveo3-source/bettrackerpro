import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Wallet, 
  BrainCircuit, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  LayoutDashboard,
  Smartphone,
  Trophy
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  // Função para levar ao cadastro
  const handleSignUp = () => {
    navigate('/login?mode=signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full z-50 bg-[#020617]/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-black text-xl italic shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              B
            </div>
            <span className="font-bold text-lg tracking-tight hidden md:block">
              BETTRACKER <span className="text-emerald-500">PRO</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={handleLogin} 
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              Login
            </button>
            <button 
              onClick={handleSignUp} 
              className="bg-white text-slate-950 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
            >
              Criar Conta Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/15 blur-[120px] rounded-full -z-10 opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10 opacity-40 pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Plataforma v5.0 Disponível
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] mb-8"
          >
            Acompanhe suas apostas <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-400 animate-gradient bg-300%">
              e lucre de verdade.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
          >
            Abandone as planilhas quebradas. Gerencie múltiplas bancas, valide métodos e use calculadoras profissionais em um único lugar.
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
                Começar Gratuitamente <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
            
            <button 
               onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
               className="text-slate-400 hover:text-white font-bold text-sm px-8 py-5 transition-colors flex items-center gap-2"
            >
              Ver Funcionalidades
            </button>
          </motion.div>

          {/* MOCKUP DO SISTEMA (3D TILT EFFECT) */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-20 relative z-10"
          >
            <div className="relative rounded-2xl md:rounded-[2rem] border border-white/10 bg-[#0f172a]/50 backdrop-blur-sm p-2 md:p-4 shadow-2xl shadow-emerald-900/20">
               {/* Aqui simulamos a tela do sistema. Se tiver um print real, substitua o conteúdo abaixo pela tag <img /> */}
               <div className="aspect-[16/9] w-full bg-slate-900 rounded-xl md:rounded-[1.5rem] overflow-hidden relative border border-slate-800">
                  
                  {/* Placeholder visual do Dashboard - Substitua por <img src={DashboardPrint} /> se quiser */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center group cursor-default">
                      <div className="text-center">
                          <LayoutDashboard size={64} className="text-slate-700 mx-auto mb-4 group-hover:text-emerald-500 transition-colors duration-500" />
                          <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">Preview do Dashboard</p>
                      </div>

                      {/* Mockup Elements - Apenas decorativo para parecer o sistema */}
                      <div className="absolute top-6 left-6 right-6 h-12 bg-slate-800/50 rounded-lg border border-white/5" />
                      <div className="absolute top-24 left-6 w-64 bottom-6 bg-slate-800/50 rounded-lg border border-white/5 hidden md:block" />
                      <div className="absolute top-24 left-6 md:left-76 right-6 h-32 bg-emerald-500/10 rounded-lg border border-emerald-500/20" />
                      <div className="absolute top-60 left-6 md:left-76 right-6 bottom-6 bg-slate-800/50 rounded-lg border border-white/5" />
                  </div>

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-80" />
               </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* --- FEATURES (BENTO GRID) --- */}
      <section id="features" className="py-24 px-6 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-6">TUDO QUE VOCÊ PRECISA.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Deixe as planilhas do Excel no passado. O BetTracker Pro é uma suíte completa de ferramentas para o apostador sério.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1: Gestão */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-[#0b101e] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-500">
                  <Wallet size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Gestão de Banca Multi-Moeda</h3>
                <p className="text-slate-400 leading-relaxed max-w-md">
                  Controle múltiplas bancas (Bet365, Pinnacle, Betfair) em moedas diferentes. Aporte, saque e acompanhe o crescimento do seu capital em tempo real.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>

            {/* Feature 2: Analytics */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-[#0b101e] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-500">
                  <LineChart size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Analytics Avançado</h3>
                <p className="text-slate-400 leading-relaxed">
                  Descubra seu ROI, Win Rate e quais ligas te dão mais lucro.
                </p>
              </div>
            </motion.div>

            {/* Feature 3: Calculadoras */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-[#0b101e] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-500">
                  <BrainCircuit size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Calculadoras Pro</h3>
                <p className="text-slate-400 leading-relaxed">
                  Dutching, Kelly, Arbitragem, Value Bet e Conversor de Odds integrados.
                </p>
              </div>
            </motion.div>

            {/* Feature 4: Métodos */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-[#0b101e] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 text-orange-500">
                  <Trophy size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Biblioteca de Métodos</h3>
                <p className="text-slate-400 leading-relaxed max-w-md">
                  Importe métodos validados (Over 2.5, Back Favorito, etc.) ou crie os seus próprios para auditar sua performance.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- MOBILE APP CALLOUT --- */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 border border-blue-500/20">
                <Smartphone size={14} /> Mobile First
             </div>
             <h2 className="text-4xl md:text-5xl font-black mb-6">SEU ESCRITÓRIO <br/>NO BOLSO.</h2>
             <p className="text-slate-400 text-lg mb-8 leading-relaxed">
               O BetTracker Pro foi desenhado para funcionar perfeitamente no seu celular. Registre apostas ao vivo, no estádio ou no sofá, com a mesma potência do desktop.
             </p>
             <ul className="space-y-4 mb-10">
                {[
                  "Interface otimizada para toque",
                  "Carregamento ultra-rápido",
                  "Modo Escuro nativo (Dark Mode)",
                  "Sem necessidade de instalação (PWA)"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    {item}
                  </li>
                ))}
             </ul>
             <button 
                onClick={handleSignUp}
                className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
             >
                Testar no Celular
             </button>
          </div>
          <div className="flex-1 relative">
             <div className="relative z-10 w-[300px] h-[600px] bg-slate-900 border-[8px] border-slate-800 rounded-[3rem] shadow-2xl mx-auto overflow-hidden">
                {/* Mockup Screen Content */}
                <div className="w-full h-full bg-[#020617] flex flex-col">
                    <div className="h-14 bg-slate-900/50 border-b border-white/5 w-full flex items-center justify-center">
                        <div className="w-20 h-4 bg-slate-800 rounded-full" />
                    </div>
                    <div className="flex-1 p-6 flex items-center justify-center text-slate-700">
                        <LayoutDashboard size={48} className="animate-pulse" />
                    </div>
                    {/* Aqui entraria um print da versão mobile futuramente */}
                </div>
             </div>
             {/* Glow effect behind phone */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[500px] bg-blue-600/30 blur-[100px] -z-10 rounded-full" />
          </div>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-emerald-900/50 to-slate-900 border border-emerald-500/20 rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-white">Pronto para subir de nível?</h2>
            <p className="text-emerald-100/70 text-lg mb-10 max-w-2xl mx-auto">
              Junte-se a milhares de apostadores que tratam suas apostas como um negócio sério.
            </p>
            <button 
              onClick={handleSignUp}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
            >
              Criar Minha Conta Grátis
            </button>
            <p className="mt-6 text-xs text-slate-500 font-medium uppercase tracking-wider">
              Sem cartão de crédito necessário
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
                <a href="#" className="hover:text-white transition-colors">Termos</a>
                <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                <a href="#" className="hover:text-white transition-colors">Suporte</a>
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