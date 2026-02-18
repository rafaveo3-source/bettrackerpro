import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  TrendingUp, 
  Shield, 
  Zap, 
  Target, 
  Lock, 
  ArrowRight, 
  BarChart3,
  Check
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Target, title: "Métodos Validados", desc: "Acesso à biblioteca de métodos profissionais prontos para copiar e colar." },
    { icon: BarChart3, title: "Gestão Automática", desc: "Suas bancas atualizadas automaticamente conforme suas apostas." },
    { icon: TrendingUp, title: "Calculadoras PRO", desc: "Ferramentas de Dutching, Kelly, Value Bet e Arbitragem integradas." },
    { icon: Shield, title: "Blindagem de Banca", desc: "Travas de segurança anti-tilt e gestão de risco avançada." },
  ];

  const pricing = [
    {
      title: "TRIMESTRAL",
      price: "89,90",
      period: "a cada 3 meses",
      monthly: "R$ 29,96/mês",
      link: "SEU_LINK_KIWIFY_TRIMESTRAL", // Você vai colocar o link aqui depois
      highlight: false
    },
    {
      title: "ANUAL (VIP)",
      price: "197,90",
      period: "pagamento único",
      monthly: "R$ 16,49/mês",
      saved: "Economize R$ 160",
      link: "SEU_LINK_KIWIFY_ANUAL",
      highlight: true
    },
    {
      title: "SEMESTRAL",
      price: "149,90",
      period: "a cada 6 meses",
      monthly: "R$ 24,98/mês",
      link: "SEU_LINK_KIWIFY_SEMESTRAL",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="fixed w-full z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-black text-xl italic">
              B
            </div>
            <span className="font-bold text-lg tracking-tight">BETTRACKER <span className="text-emerald-500">PRO</span></span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/login')} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">
              Login
            </button>
            <button onClick={() => navigate('/login?mode=signup')} className="bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              Começar Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-emerald-500/20 blur-[120px] -z-10 rounded-full opacity-50 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Sistema de Gestão Profissional v5.0</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-6"
          >
            PARE DE APOSTAR COMO <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">AMADOR HOJE MESMO.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            O único sistema que combina gestão de banca automática, inteligência de dados e controle emocional para transformar apostadores em investidores.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button onClick={() => navigate('/login?mode=signup')} className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2">
              <Zap size={18} /> Criar Conta Gratuita
            </button>
            <a href="#pricing" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2">
              Ver Planos PRO <ArrowRight size={18} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* COMPARISON SECTION */}
      <section className="py-20 bg-slate-950/50 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black mb-6">A DIFERENÇA É BRUTAL.</h2>
              <p className="text-slate-400 mb-8">
                Enquanto amadores usam planilhas quebradas e anotações no caderno, o BetTracker PRO te dá a infraestrutura de um Hedge Fund.
              </p>
              
              <div className="space-y-4">
                {features.map((f, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-500">
                      <f.icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{f.title}</h3>
                      <p className="text-sm text-slate-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative">
                <div className="absolute -top-4 -right-4 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    Sem o sistema
                </div>
                <ul className="space-y-4 text-sm text-slate-400 opacity-60">
                    <li className="flex gap-2 items-center"><Lock size={14} /> Planilha do Excel travada</li>
                    <li className="flex gap-2 items-center"><Lock size={14} /> Sem cálculo de ROI automático</li>
                    <li className="flex gap-2 items-center"><Lock size={14} /> Sem gestão de risco Kelly</li>
                    <li className="flex gap-2 items-center"><Lock size={14} /> Sem histórico auditável</li>
                    <li className="flex gap-2 items-center"><Lock size={14} /> Emocional descontrolado</li>
                </ul>
                
                <div className="my-6 h-px bg-slate-800" />
                
                <div className="absolute -left-2 top-1/2 w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_15px_#10b981]" />

                <div className="text-white">
                    <h3 className="font-black text-xl text-emerald-400 mb-4 flex items-center gap-2">
                        <CheckCircle2 /> COM BETTRACKER PRO
                    </h3>
                    <ul className="space-y-3 font-medium">
                        <li className="flex gap-2 items-center"><Check size={16} className="text-emerald-500"/> Bancas Ilimitadas</li>
                        <li className="flex gap-2 items-center"><Check size={16} className="text-emerald-500"/> Importação de Estratégias</li>
                        <li className="flex gap-2 items-center"><Check size={16} className="text-emerald-500"/> Calculadoras de Arbitragem</li>
                        <li className="flex gap-2 items-center"><Check size={16} className="text-emerald-500"/> Dashboard em Tempo Real</li>
                    </ul>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">INVESTIMENTO IRRISÓRIO.</h2>
            <p className="text-slate-400">Menos que o valor de um green. Cancele quando quiser.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricing.map((plan, i) => (
              <div key={i} className={`relative bg-slate-900 border rounded-3xl p-8 flex flex-col ${plan.highlight ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)] scale-105 z-10' : 'border-slate-800 opacity-80 hover:opacity-100 transition-opacity'}`}>
                
                {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                        Mais Escolhido
                    </div>
                )}

                <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-2">{plan.title}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-sm text-slate-500">R$</span>
                    <span className="text-5xl font-black text-white">{plan.price}</span>
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-6">{plan.period}</p>
                
                <div className="flex-1">
                    <ul className="space-y-3 text-sm text-slate-300 mb-8">
                        <li className="flex gap-2"><Check size={14} className="text-emerald-500"/> Acesso Ilimitado</li>
                        <li className="flex gap-2"><Check size={14} className="text-emerald-500"/> Todas Calculadoras</li>
                        <li className="flex gap-2"><Check size={14} className="text-emerald-500"/> Gestão de Bancas</li>
                        <li className="flex gap-2"><Check size={14} className="text-emerald-500"/> Suporte Prioritário</li>
                    </ul>
                </div>

                <div className="mt-auto">
                    {plan.highlight && (
                        <p className="text-center text-xs text-emerald-400 font-bold mb-3">
                            {plan.saved}
                        </p>
                    )}
                    <p className="text-center text-xs text-slate-500 mb-3">
                        Equivalente a {plan.monthly}
                    </p>
                    <a 
                        href={plan.link} // Link da Kiwify vai aqui
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full block text-center py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                            plan.highlight 
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-black' 
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                    >
                        Quero ser PRO
                    </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-slate-600 text-xs uppercase font-bold tracking-widest">
            © {new Date().getFullYear()} BetTracker Pro. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;