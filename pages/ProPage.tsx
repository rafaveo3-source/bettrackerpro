import React from 'react';
import { useBetStore } from '../store/useBetStore';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Zap, Shield, Star, X, ExternalLink } from 'lucide-react';

const ProPage: React.FC = () => {
  const { isPro } = useBetStore();

  const plans = [
    {
      id: 'free',
      title: 'Plano Básico',
      price: '0,00',
      period: 'para sempre',
      monthlyEquivalent: 'Teste sem limites de tempo',
      features: [
        'Apenas 1 Portfólio Ativo',
        'Máximo de 50 operações/mês',
        'Dashboard Analítico Básico',
        'Calculadoras Simples'
      ],
      missing: [
        'Planejador de Metas & Oráculo',
        'Exportação de Relatórios CSV',
        'Modelos Matemáticos Avançados',
        'ExC Analytics (Motor de Cantos)',
        'ExG Analytics (Motor de Gols)',
        'Scout Pré-Live IA (Construtor EV+)',
        'Hub de Estratégias (Playbooks)',
        'Módulo de Inteligência Emocional',
        'Trava de Risco (Circuit Breaker)'
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
        'Planejador de Metas & Oráculo',
        'Gestão de Múltiplos Portfólios',
        'Operações Ilimitadas no Mês',
        'Calculadoras EV+, Arb e Kelly',
        'ExC e ExG Analytics',
        'Scout IA (10 Scans Diários)',
        'Hub de Estratégias Liberado',
        'Inteligência Emocional & Lock',
        'Exportação de Relatórios CSV',
        'Suporte Prioritário'
      ],
      missing: [],
      link: 'https://lastlink.com/p/C184F4DD2/checkout-payment/', 
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
        'Planejador de Metas & Oráculo',
        'Todas as features do Semestral',
        'Motor de Inteligência Artificial HFT',
        'Acesso VITALÍCIO a atualizações',
        'Acesso Antecipado a Novas Metas',
        'Grupo de Networking (Bônus)',
        'Selo VIP no Perfil de Operador'
      ],
      missing: [],
      link: 'https://lastlink.com/p/CFBECA72D/checkout-payment/', 
      recommended: true,
      color: 'indigo',
      isFree: false
    },
    {
      id: 'semiannual',
      title: 'Semestral',
      price: '149,90',
      period: 'a cada 6 meses',
      monthlyEquivalent: 'R$ 24,98/mês',
      features: [
        'Planejador de Metas & Oráculo',
        'Gestão de Múltiplos Portfólios',
        'Operações Ilimitadas no Mês',
        'Calculadoras EV+, Arb e Kelly',
        'ExC e ExG Analytics',
        'Scout IA (10 Scans Diários)',
        'Hub de Estratégias Liberado',
        'Inteligência Emocional & Lock',
        'Exportação de Relatórios CSV',
        'Suporte Prioritário'
      ],
      missing: [],
      link: 'https://lastlink.com/p/CFBF0E56B/checkout-payment/', 
      recommended: false,
      color: 'purple',
      isFree: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-8 pt-8 transition-colors duration-300 font-sans">
      
      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 mb-2">
            <Crown size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">
              Área Premium
            </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">
            Escale seus resultados com o <br/>
            <span className="text-indigo-600 dark:text-indigo-500">BetTracker PRO</span>
        </h1>
        <p className="text-slate-500 dark:text-[#8E8E93] max-w-2xl mx-auto text-lg transition-colors font-medium">
            Desbloqueie nossa IA Quantitativa, remova todos os limites e tenha a infraestrutura de um investidor de elite.
        </p>
      </div>

      {/* Status Atual */}
      {isPro && (
        <div className="bg-white dark:bg-[#1C1C1E] border border-indigo-200 dark:border-indigo-500/30 p-8 rounded-2xl mb-16 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex items-center gap-6 relative z-10">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <Crown size={28} strokeWidth={2.5} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">Você é Membro PRO</h3>
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm tracking-wide">Sua assinatura está ativa e operando.</p>
                </div>
            </div>
            <div className="relative z-10 w-full md:w-auto">
                <a 
                    href="https://lastlink.com/login"
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full md:w-auto items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#000000] dark:hover:bg-[#2C2C2E] dark:text-white border border-slate-200 dark:border-[#3A3A3C] px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm"
                >
                    Gerenciar Assinatura <ExternalLink size={14} />
                </a>
            </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {plans.map((plan) => (
            <motion.div 
                key={plan.id}
                whileHover={!plan.isFree ? { y: -5 } : {}}
                className={`relative flex flex-col transition-all duration-300 rounded-2xl p-6 md:p-8 ${
                    plan.recommended 
                    ? 'bg-white dark:bg-[#1C1C1E] border-2 border-indigo-500 shadow-xl dark:shadow-[0_0_30px_rgba(99,102,241,0.15)] z-20' 
                    : plan.isFree 
                        ? 'bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] opacity-80'
                        : 'bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-[#3A3A3C]'
                }`}
            >
                {plan.recommended && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg tracking-widest shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                        <Star size={12} className="fill-white" /> Mais Escolhido
                    </div>
                )}

                <div className="mb-6 border-b border-slate-100 dark:border-[#2C2C2E] pb-6">
                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${
                        plan.color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' : 
                        plan.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 
                        plan.color === 'purple' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-[#8E8E93]'
                    }`}>
                        {plan.title}
                    </h3>
                    <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
                        <span className="text-sm font-bold opacity-70">R$</span>
                        <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] font-bold uppercase tracking-widest mt-2">{plan.period}</p>
                    
                    <div className="mt-4">
                        <p className="text-xs text-slate-700 dark:text-[#E5E5EA] bg-slate-100 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] inline-block px-3 py-1.5 rounded-lg font-bold">
                            {plan.monthlyEquivalent}
                        </p>
                    </div>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                    {/* Features Positivas */}
                    {plan.features.map((feat, i) => (
                        <div key={`feat-${i}`} className="flex items-start gap-3 text-sm text-slate-700 dark:text-[#E5E5EA] font-medium">
                            <CheckCircle2 size={16} className={`shrink-0 mt-0.5 ${plan.recommended ? 'text-indigo-500' : 'text-slate-400 dark:text-[#636366]'}`} />
                            <span>{feat}</span>
                        </div>
                    ))}
                    {/* Features Negativas (Apenas no plano Free) */}
                    {plan.missing && plan.missing.map((feat, i) => (
                        <div key={`miss-${i}`} className="flex items-start gap-3 text-sm text-slate-400 dark:text-[#636366] font-medium opacity-60">
                            <X size={16} className="shrink-0 mt-0.5 text-slate-300 dark:text-[#3A3A3C]" />
                            <span className="line-through">{feat}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-auto">
                    {plan.savings && (
                        <p className="text-center text-[10px] text-indigo-700 dark:text-indigo-400 font-bold mb-3 bg-indigo-50 dark:bg-indigo-500/10 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20 uppercase tracking-widest">
                            {plan.savings}
                        </p>
                    )}
                    
                    {!plan.isFree ? (
                        <a 
                            href={plan.link}
                            target="_blank"
                            rel="noreferrer"
                            className={`w-full block text-center py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-sm ${
                                plan.recommended 
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                                    : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
                            }`}
                        >
                            {isPro ? 'Renovar / Upgrade' : 'Assinar PRO'}
                        </a>
                    ) : (
                        <div className="w-full text-center py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs bg-slate-100 text-slate-400 dark:bg-[#000000] dark:text-[#636366] border border-slate-200 dark:border-[#2C2C2E] cursor-default">
                            Plano Atual
                        </div>
                    )}
                </div>
            </motion.div>
        ))}
      </div>

      {/* FAQ / Guarantee */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] p-6 md:p-8 rounded-2xl flex flex-col sm:flex-row items-start gap-4 shadow-sm">
                <div className="p-3 bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] rounded-xl text-slate-700 dark:text-white shrink-0">
                    <Shield size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Garantia Risco Zero</h4>
                    <p className="text-sm text-slate-600 dark:text-[#8E8E93] leading-relaxed font-medium">Teste o sistema por 7 dias. Se achar que não elevou o nível da sua gestão, devolvemos 100% do seu investimento com um clique. Sem perguntas.</p>
                </div>
            </div>
            <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] p-6 md:p-8 rounded-2xl flex flex-col sm:flex-row items-start gap-4 shadow-sm">
                <div className="p-3 bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#3A3A3C] rounded-xl text-slate-700 dark:text-white shrink-0">
                    <Zap size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Liberação Imediata</h4>
                    <p className="text-sm text-slate-600 dark:text-[#8E8E93] leading-relaxed font-medium">Assim que o pagamento for aprovado (Pix ou Cartão), o sistema detecta seu e-mail e libera todas as ferramentas PRO instantaneamente na nuvem.</p>
                </div>
            </div>
      </div>

    </div>
  );
};

export default ProPage;