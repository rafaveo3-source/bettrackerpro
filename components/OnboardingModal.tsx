import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BarChart3, Wallet, BrainCircuit, Crosshair, Target, Activity, Rocket } from 'lucide-react';
import { useBetStore } from '../store/useBetStore';

const OnboardingModal: React.FC = () => {
  const { hasSeenTutorial, isAuthenticated, completeTutorial } = useBetStore();
  const [step, setStep] = useState(1);

  // Early return: Só renderiza se não tiver visto o tutorial e estiver autenticado
  if (hasSeenTutorial || !isAuthenticated) return null;

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      completeTutorial();
    }
  };

  const steps = [
    {
      id: 1,
      title: "Bem-vindo ao BetTracker PRO",
      text: "Esqueça planilhas amadoras. Vamos blindar o seu capital e escalar sua consistência no mercado esportivo.",
      icon: <Rocket size={48} className="text-indigo-500" />
    },
    {
      id: 2,
      title: "Portfólios e Cockpit",
      text: "Acompanhe sua Win Rate real e o EV+ das suas operações. Crie múltiplas bancas para separar o seu dinheiro de forma profissional.",
      icon: (
        <div className="flex gap-4">
          <BarChart3 size={40} className="text-indigo-500" />
          <Wallet size={40} className="text-emerald-500" />
        </div>
      )
    },
    {
      id: 3,
      title: "Inteligência Artificial (PRO)",
      text: "Nosso motor Scout IA e Analista Live leem a matemática do jogo em tempo real e buscam entradas de Valor Esperado Positivo (+EV) para você.",
      icon: (
        <div className="flex gap-4">
          <BrainCircuit size={40} className="text-indigo-500" />
          <Crosshair size={40} className="text-rose-500" />
        </div>
      )
    },
    {
      id: 4,
      title: "Controle Emocional",
      text: "Configure seu Stop Loss diário e registre como você se sentiu em cada entrada. Controle sua mente, proteja seu lucro.",
      icon: (
        <div className="flex gap-4">
          <Target size={40} className="text-indigo-500" />
          <Activity size={40} className="text-amber-500" />
        </div>
      )
    }
  ];

  const currentStep = steps.find(s => s.id === step);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/80 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-3xl w-full max-w-lg p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
      >
        {/* Indicadores de Progresso */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${step === i ? 'w-8 bg-indigo-600 dark:bg-indigo-500' : 'w-2 bg-slate-200 dark:bg-[#2C2C2E]'}`}
            />
          ))}
        </div>

        {/* Conteúdo do Carrossel */}
        <div className="min-h-[220px] flex flex-col items-center justify-center w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="mb-8 p-6 bg-slate-50 dark:bg-[#000000] rounded-full border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
                {currentStep?.icon}
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                {currentStep?.title}
              </h2>
              <p className="text-slate-500 dark:text-[#8E8E93] text-sm md:text-base leading-relaxed font-medium px-4">
                {currentStep?.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Rodapé de Ações */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between w-full gap-4">
          <button 
            onClick={completeTutorial}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-xs uppercase tracking-widest transition-colors py-3 px-6"
          >
            Pular
          </button>
          <button 
            onClick={handleNext}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white py-4 px-8 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-lg active:scale-95"
          >
            {step === 4 ? "Acessar o Sistema" : "Avançar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
