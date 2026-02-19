import React from 'react';
import { useBetStore } from '../store/useBetStore';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Zap, Shield, Star, X, ExternalLink } from 'lucide-react';

const ProPage: React.FC = () => {
  const { isPro } = useBetStore();

  const plans = [
    {
      id: 'free',
      title: 'Plano Gratuito',
      price: '0,00',
      period: 'para sempre',
      monthlyEquivalent: 'Teste sem limites de tempo',
      features: [
        'Apenas 1 Banca de Gestão',
        'Máximo de 50 apostas/mês',
        'Estatísticas Básicas',
        'Calculadoras Simples'
      ],
      missing: [
        'Sem Calculadoras Avançadas',
        'Sem Importação de Estratégias',
        'Sem Controle de Mindset',
        'Sem Suporte Prioritário'
      ],
      link: '#', 
      recommended: false,
      color: 'slate',
      isFree: true
    },
    {
      id: 'quarterly',
      title: 'Trimestral',
      price: '89,90',
      period: 'a cada 3 meses',
      monthlyEquivalent: 'R$ 29,96/mês',
      features: [
        'Acesso a todas as calculadoras',
        'Gestão de múltiplas bancas',
        'Apostas ilimitadas',
        'Módulo de Mindset liberado',
        'Importação de Estratégias',
        'Suporte Prioritário'
      ],
      missing: [],
      // 👇 MANTENHA O SEU LINK DA KIWIFY AQUI
      link: 'COLE_AQUI_O_LINK_DO_TRIMESTRAL_DA_KIWIFY', 
      recommended: false,
      color: 'blue',
      isFree: false
    },
    {
      id: 'annual',
      title: 'Anual (VIP)',
      price: '197,90',
      period: 'pagamento único',
      monthlyEquivalent: 'R$ 16,49/mês',
      savings: 'Economize R$ 160 no ano',
      features: [
        'Tudo do plano Trimestral e Semestral',
        'Acesso VITALÍCIO a atualizações',
        'Grupo de Networking (Bônus)',
        'Selo VIP no perfil'
      ],
      missing: [],
      // 👇 MANTENHA O SEU LINK DA KIWIFY AQUI
      link: 'COLE_AQUI_O_LINK_DO_ANUAL_DA_KIWIFY', 
      recommended: true,
      color: 'emerald',
      isFree: false
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
        'Apostas ilimitadas',
        'Módulo de Mindset liberado',
        'Importação de Estratégias',
        'Suporte Prioritário'
      ],
      missing: [],
      // 👇 MANTENHA O SEU LINK DA KIWIFY AQUI
      link: 'COLE_AQUI_O_LINK_DO_SEMESTRAL_DA_KIWIFY', 
      recommended: false,
      color: 'purple',
      isFree: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-8 pt-8 transition-colors duration-300">
      
      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 mb-4">
            <Crown size={14} className="text-emerald-600 dark:text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Área Premium
            </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">
            Escale seus resultados com o <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400">BetTracker PRO</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg transition-colors">
            Desbloqueie ferramentas profissionais, remova todos os limites e tenha a infraestrutura de um investidor esportivo de elite.
        </p>
      </div>

      {/* Status Atual */}
      {isPro && (
        <div className="bg-gradient-to-r from-emerald-100 to-slate-50 dark:from-emerald-900/40 dark:to-slate-900 border border-emerald-200 dark:border-emerald-500/30 p-8 rounded-3xl mb-16 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] dark:opacity-10 pointer-events-none" />
            <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white dark:text-slate-950 shadow-lg dark:shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    <Crown size={32} strokeWidth={3} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Você é Membro PRO</h3>
                    <p className="text-emerald-700 dark:text-emerald-400 font-medium">Sua assinatura está ativa e operando.</p>
                </div>
            </div>
            <div className="relative z-10">
                <a 
                    href="https://dashboard.kiwify.com.br/purchases"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                    Gerenciar na Kiwify <ExternalLink size={14} />
                </a>
            </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {plans.map((plan) => (
            <motion.div 
                key={plan.id}
                whileHover={!plan.isFree ? { y: -10 } : {}}
                className={`relative bg-white dark:bg-[#0b101e] border rounded-[2rem] p-6 flex flex-col transition-all duration-300 ${
                    plan.recommended 
                    ? 'border-emerald-500 shadow-xl dark:shadow-[0_0_40px_rgba(16,185,129,0.15)] lg:-mt-6 lg:mb-6 z-20' 
                    : plan.isFree 
                        ? 'border-slate-200 dark:border-slate-800 opacity-70 bg-slate-50 dark:bg-transparent'
                        : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:opacity-90 dark:hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
            >
                {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white dark:text-slate-950 text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-lg flex items-center gap-1 whitespace-nowrap">
                        <Star size={10} className="fill-white dark:fill-slate-950" /> Mais Escolhido
                    </div>
                )}

                <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-6">
                    <h3 className={`text-sm font-black uppercase tracking-widest mb-4 ${
                        plan.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-500' : 
                        plan.color === 'blue' ? 'text-blue-600 dark:text-blue-500' : 
                        plan.color === 'purple' ? 'text-purple-600 dark:text-purple-500' : 'text-slate-500'
                    }`}>
                        {plan.title}
                    </h3>
                    <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
                        <span className="text-sm font-bold opacity-70">R$</span>
                        <span className="text-4xl font-black">{plan.price}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-2">{plan.period}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-100 dark:bg-slate-800/50 inline-block px-2 py-1 rounded font-bold border border-slate-200 dark:border-slate-700">
                        {plan.monthlyEquivalent}
                    </p>
                </div>

                <div className="flex-1 space-y-3 mb-8">
                    {/* Features Positivas */}
                    {plan.features.map((feat, i) => (
                        <div key={`feat-${i}`} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <CheckCircle2 size={14} className={`shrink-0 ${plan.recommended ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`} />
                            <span className={plan.isFree ? "font-medium" : "font-bold"}>{feat}</span>
                        </div>
                    ))}
                    {/* Features Negativas (Apenas no plano Free) */}
                    {plan.missing && plan.missing.map((feat, i) => (
                        <div key={`miss-${i}`} className="flex items-start gap-2 text-xs text-slate-400 dark:text-slate-500 opacity-60">
                            <X size={14} className="shrink-0 text-red-400" />
                            <span className="line-through">{feat}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-auto">
                    {plan.savings && (
                        <p className="text-center text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mb-3 bg-emerald-100 dark:bg-emerald-500/10 py-1 rounded border border-emerald-200 dark:border-emerald-500/20">
                            {plan.savings}
                        </p>
                    )}
                    
                    {!plan.isFree ? (
                        <a 
                            href={plan.link}
                            target="_blank"
                            rel="noreferrer"
                            className={`w-full block text-center py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                                plan.recommended 
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 shadow-lg shadow-emerald-500/25' 
                                    : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200'
                            }`}
                        >
                            {isPro ? 'Renovar / Upgrade' : 'Assinar PRO'}
                        </a>
                    ) : (
                        <div className="w-full text-center py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-default">
                           Plano Atual
                        </div>
                    )}
                </div>
            </motion.div>
        ))}
      </div>

      {/* FAQ / Guarantee */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-500">
                    <Shield size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">Garantia Risco Zero</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Teste o sistema por 7 dias. Se achar que não ajudou nas suas apostas, apertando um botão devolvemos 100% do seu dinheiro. Sem perguntas.</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="p-3 bg-purple-100 dark:bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-500">
                    <Zap size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">Liberação Imediata</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Assim que o pagamento for aprovado (Pix ou Cartão), o sistema detecta seu e-mail e libera todas as ferramentas PRO instantaneamente.</p>
                </div>
            </div>
      </div>

    </div>
  );
};

export default ProPage;