import React from 'react';
import { useBetStore } from '../store/useBetStore';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Zap, Shield, TrendingUp, Star } from 'lucide-react';

const ProPage: React.FC = () => {
  const { isPro, user } = useBetStore();

  const plans = [
    {
      id: 'quarterly',
      title: 'Trimestral',
      price: '89,90',
      period: 'a cada 3 meses',
      monthlyEquivalent: 'R$ 29,96/mês',
      features: [
        'Acesso a todas as calculadoras',
        'Gestão de múltiplas bancas',
        'Importação de Estratégias',
        'Suporte Prioritário'
      ],
      link: 'LINK_KIWIFY_TRIMESTRAL', // Coloque o link do checkout aqui
      recommended: false,
      color: 'blue'
    },
    {
      id: 'annual',
      title: 'Anual (VIP)',
      price: '197,90',
      period: 'pagamento único',
      monthlyEquivalent: 'R$ 16,49/mês',
      savings: 'Economize R$ 160',
      features: [
        'Tudo do plano Trimestral',
        'Acesso VITALÍCIO a atualizações',
        'Grupo de Networking (Bônus)',
        'Mentoria gravada de Gestão',
        'Selo VIP no perfil'
      ],
      link: 'LINK_KIWIFY_ANUAL', // Coloque o link do checkout aqui
      recommended: true,
      color: 'emerald'
    },
    {
      id: 'semiannual',
      title: 'Semestral',
      price: '149,90',
      period: 'a cada 6 meses',
      monthlyEquivalent: 'R$ 24,98/mês',
      features: [
        'Acesso a todas as calculadoras',
        'Gestão de múltiplas bancas',
        'Importação de Estratégias',
        'Suporte Prioritário'
      ],
      link: 'LINK_KIWIFY_SEMESTRAL', // Coloque o link do checkout aqui
      recommended: false,
      color: 'purple'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 md:px-8 pt-8">
      
      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Crown size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Área Premium
            </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            Escale seus resultados com o <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">BetTracker PRO</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Desbloqueie ferramentas profissionais, remova todos os limites e tenha a infraestrutura de um investidor esportivo de elite.
        </p>
      </div>

      {/* Status Atual */}
      {isPro && (
        <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900 border border-emerald-500/30 p-8 rounded-3xl mb-16 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
            <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    <Crown size={32} strokeWidth={3} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white">Você é Membro PRO</h3>
                    <p className="text-emerald-400 font-medium">Sua assinatura está ativa e operando.</p>
                </div>
            </div>
            <div className="relative z-10">
                <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                    Gerenciar Assinatura
                </button>
            </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {plans.map((plan) => (
            <motion.div 
                key={plan.id}
                whileHover={{ y: -10 }}
                className={`relative bg-[#0b101e] border rounded-[2rem] p-8 flex flex-col ${
                    plan.recommended 
                    ? 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.15)] md:-mt-8 md:mb-8 z-20' 
                    : 'border-slate-800 opacity-90 hover:opacity-100 hover:border-slate-600'
                }`}
            >
                {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-lg flex items-center gap-1">
                        <Star size={10} fill="black" /> Mais Escolhido
                    </div>
                )}

                <div className="mb-8">
                    <h3 className={`text-sm font-black uppercase tracking-widest mb-4 ${
                        plan.color === 'emerald' ? 'text-emerald-500' : 
                        plan.color === 'blue' ? 'text-blue-500' : 'text-purple-500'
                    }`}>
                        {plan.title}
                    </h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-sm text-slate-500 font-bold">R$</span>
                        <span className="text-5xl font-black text-white">{plan.price}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-2">{plan.period}</p>
                    <p className="text-sm text-slate-300 mt-1 bg-slate-800/50 inline-block px-2 py-1 rounded text-[10px] font-bold border border-slate-700">
                        {plan.monthlyEquivalent}
                    </p>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                    {plan.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                            <CheckCircle2 size={16} className={`shrink-0 ${plan.recommended ? 'text-emerald-500' : 'text-slate-500'}`} />
                            <span className="font-medium">{feat}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-auto">
                    {plan.savings && (
                        <p className="text-center text-xs text-emerald-400 font-bold mb-3 bg-emerald-500/10 py-1 rounded-lg border border-emerald-500/20">
                            {plan.savings}
                        </p>
                    )}
                    
                    <a 
                        href={isPro ? "#" : plan.link}
                        target={isPro ? "_self" : "_blank"}
                        rel="noreferrer"
                        className={`w-full block text-center py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                            isPro
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : plan.recommended 
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25' 
                                : 'bg-white text-slate-950 hover:bg-slate-200'
                        }`}
                    >
                        {isPro ? 'Plano Ativo' : 'Quero ser PRO'}
                    </a>
                </div>
            </motion.div>
        ))}
      </div>

      {/* FAQ / Guarantee */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                    <Shield size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-white mb-1">Garantia de 7 Dias</h4>
                    <p className="text-sm text-slate-400">Se não gostar, devolvemos 100% do seu dinheiro sem perguntas.</p>
                </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                    <Zap size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-white mb-1">Liberação Imediata</h4>
                    <p className="text-sm text-slate-400">Pagou, acessou. O sistema reconhece seu e-mail e libera as funções na hora.</p>
                </div>
            </div>
      </div>

    </div>
  );
};

export default ProPage;