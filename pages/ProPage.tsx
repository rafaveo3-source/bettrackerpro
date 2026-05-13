import React from 'react';
import { useBetStore } from '../store/useBetStore';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Crown,
  Zap,
  Shield,
  Star,
  X,
  ExternalLink
} from 'lucide-react';

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
        'Apenas 1 Portfólio Ativo',
        'Máximo de 50 operações/mês',
        'Dashboard Analítico Básico',
        'Calculadoras Simples'
      ],
      missing: [
        'Planejador de Metas & Oráculo',
        'Exportação CSV',
        'Modelos Matemáticos',
        'ExC Analytics',
        'ExG Analytics',
        'Scout IA',
        'Hub Estratégico',
        'Inteligência Emocional',
        'Circuit Breaker'
      ],
      link: '#',
      recommended: false,
      isFree: true,
      color: 'slate'
    },
    {
      id: 'quarterly',
      title: 'Trimestral',
      price: '89,90',
      period: 'a cada 3 meses',
      monthlyEquivalent: 'R$ 29,96/mês',
      features: [
        'Gestão Multi-Portfólio',
        'Operações Ilimitadas',
        'Calculadoras EV+, Arb e Kelly',
        'ExC e ExG Analytics',
        'Scout IA',
        'Hub Estratégico',
        'Tilt Protection',
        'Exportação CSV',
        'Suporte Prioritário'
      ],
      missing: [],
      link: 'https://lastlink.com/p/C184F4DD2/checkout-payment/',
      recommended: false,
      isFree: false,
      color: 'blue'
    },
    {
      id: 'annual',
      title: 'Anual VIP',
      price: '197,90',
      period: 'pagamento único',
      monthlyEquivalent: 'R$ 16,49/mês',
      savings: 'Economize R$ 160 no ano',
      features: [
        'Tudo do Semestral',
        'Motor IA Quantitativo',
        'Atualizações Vitalícias',
        'Acesso antecipado',
        'Networking VIP',
        'Selo PRO'
      ],
      missing: [],
      link: 'https://lastlink.com/p/CFBECA72D/checkout-payment/',
      recommended: true,
      isFree: false,
      color: 'indigo'
    },
    {
      id: 'semiannual',
      title: 'Semestral',
      price: '149,90',
      period: 'a cada 6 meses',
      monthlyEquivalent: 'R$ 24,98/mês',
      features: [
        'Gestão Multi-Portfólio',
        'Operações Ilimitadas',
        'Calculadoras EV+, Arb e Kelly',
        'ExC e ExG Analytics',
        'Scout IA',
        'Hub Estratégico',
        'Tilt Protection',
        'Exportação CSV',
        'Suporte Prioritário'
      ],
      missing: [],
      link: 'https://lastlink.com/p/CFBF0E56B/checkout-payment/',
      recommended: false,
      isFree: false,
      color: 'purple'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-8 pt-8 font-sans">
      {/* HEADER */}
      <div className="text-center mb-16 space-y-5">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <Crown
            size={14}
            className="text-indigo-500"
          />

          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
            Área Premium
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          Escale sua operação com o
          <br />

          <span className="text-indigo-600 dark:text-indigo-500">
            BetTracker PRO
          </span>
        </h1>

        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
          Infraestrutura profissional, IA quantitativa e gestão de elite
          para operadores que levam performance a sério.
        </p>
      </div>

      {/* STATUS */}
      {isPro && (
        <div className="bg-white dark:bg-[#111113] border border-indigo-500/20 rounded-[2rem] p-8 mb-16 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none" />

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
              <Crown size={30} strokeWidth={2.5} />
            </div>

            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Você é Membro PRO
              </h3>

              <p className="text-indigo-500 text-sm font-bold uppercase tracking-wider mt-1">
                Assinatura ativa
              </p>
            </div>
          </div>

          <a
            href="https://lastlink.com/login"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#000000] dark:hover:bg-[#18181B] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white px-6 py-3.5 rounded-2xl font-bold uppercase tracking-[0.14em] text-xs transition-all"
          >
            Gerenciar Assinatura
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {/* PLANS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={!plan.isFree ? { y: -6 } : {}}
            className={`relative flex flex-col rounded-[2rem] p-8 transition-all duration-300 ${
              plan.recommended
                ? 'bg-white dark:bg-[#111113] border-2 border-indigo-500 shadow-[0_0_35px_rgba(99,102,241,0.14)]'
                : plan.isFree
                ? 'bg-slate-50 dark:bg-[#050505] border border-slate-200 dark:border-white/5 opacity-80'
                : 'bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm'
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.18em] flex items-center gap-1">
                <Star size={10} className="fill-white" />
                Mais Escolhido
              </div>
            )}

            <div className="border-b border-slate-200 dark:border-white/5 pb-6 mb-6">
              <h3 className={`text-xs font-black uppercase tracking-[0.18em] mb-4 ${
                plan.color === 'indigo'
                  ? 'text-indigo-500'
                  : plan.color === 'purple'
                  ? 'text-purple-500'
                  : plan.color === 'blue'
                  ? 'text-blue-500'
                  : 'text-slate-500'
              }`}>
                {plan.title}
              </h3>

              <div className="flex items-end gap-1 text-slate-900 dark:text-white">
                <span className="text-sm font-bold mb-1">R$</span>

                <span className="text-5xl font-black tracking-tight">
                  {plan.price}
                </span>
              </div>

              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-500 mt-3">
                {plan.period}
              </p>

              <div className="mt-4 inline-flex bg-slate-100 dark:bg-[#000000] border border-slate-200 dark:border-white/5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                {plan.monthlyEquivalent}
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {plan.features.map((feat, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 text-sm"
                >
                  <CheckCircle2
                    size={16}
                    className={`mt-0.5 shrink-0 ${
                      plan.recommended
                        ? 'text-indigo-500'
                        : 'text-slate-400'
                    }`}
                  />

                  <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {feat}
                  </span>
                </div>
              ))}

              {plan.missing.map((feat, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 text-sm opacity-60"
                >
                  <X
                    size={16}
                    className="mt-0.5 shrink-0 text-red-400"
                  />

                  <span className="line-through text-slate-400 dark:text-slate-600">
                    {feat}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              {plan.savings && (
                <div className="mb-4 text-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] uppercase tracking-[0.18em] font-black py-2 rounded-xl">
                  {plan.savings}
                </div>
              )}

              {!plan.isFree ? (
                <a
                  href={plan.link}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full block text-center py-4 rounded-2xl font-black uppercase tracking-[0.18em] text-xs transition-all ${
                    plan.recommended
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.25)]'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900'
                  }`}
                >
                  {isPro ? 'Renovar / Upgrade' : 'Assinar PRO'}
                </a>
              ) : (
                <div className="w-full text-center py-4 rounded-2xl bg-slate-100 dark:bg-[#000000] border border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.18em] text-xs">
                  Plano Atual
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* GUARANTEE */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 flex gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#000000] border border-slate-200 dark:border-white/5 flex items-center justify-center shrink-0">
            <Shield size={22} className="text-slate-700 dark:text-white" />
          </div>

          <div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">
              Garantia Risco Zero
            </h4>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Teste por 7 dias. Se não elevar sua gestão operacional,
              devolvemos 100% do investimento.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 flex gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#000000] border border-slate-200 dark:border-white/5 flex items-center justify-center shrink-0">
            <Zap size={22} className="text-slate-700 dark:text-white" />
          </div>

          <div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">
              Liberação Imediata
            </h4>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Pagamento aprovado → sistema libera instantaneamente
              todas as features PRO na nuvem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProPage;