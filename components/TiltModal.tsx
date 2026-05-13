import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Lock, X, BrainCircuit, AlertTriangle } from 'lucide-react';
import { useBetStore } from '../store/useBetStore';

interface TiltModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TiltModal: React.FC<TiltModalProps> = ({ isOpen, onClose }) => {
  const { activateTiltLock } = useBetStore();
  const [confirming, setConfirming] = useState(false);

  const handleActivate = () => {
    activateTiltLock(24); 
    setConfirming(false);
    onClose();
  };

  const handleClose = () => {
    setConfirming(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-sans"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] border border-red-500/20 dark:border-red-900/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-red-50 dark:bg-red-500/10 p-5 flex justify-between items-center border-b border-red-200 dark:border-red-900/30">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold uppercase tracking-widest text-xs">
                    <ShieldAlert size={16} /> Protocolo de Emergência
                </div>
                <button onClick={handleClose} className="text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors bg-white dark:bg-[#000000] p-1.5 rounded-lg border border-red-200 dark:border-red-900/30"><X size={16}/></button>
            </div>

            <div className="p-8 text-center">
                {!confirming ? (
                    <>
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-6 border border-red-200 dark:border-red-900/50">
                            <BrainCircuit size={32} className="text-red-600 dark:text-red-500" />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Sentindo o Tilt?</h2>
                        <p className="text-sm text-slate-500 dark:text-[#8E8E93] mb-8 leading-relaxed font-medium">
                            Identificamos um padrão emocional atípico. <strong className="text-slate-900 dark:text-white">Dê um tempo para sua mente</strong> e preserve seu capital.
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                            <div className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] p-4 rounded-xl shadow-sm">
                                <ShieldAlert className="text-amber-500 mb-2" size={20} />
                                <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-1">Preservação</h3>
                                <p className="text-slate-500 dark:text-[#8E8E93] text-xs leading-relaxed font-medium">Evite decisões impulsivas que comprometem lucro.</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] p-4 rounded-xl shadow-sm">
                                <BrainCircuit className="text-indigo-500 mb-2" size={20} />
                                <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-1">Recuperação</h3>
                                <p className="text-slate-500 dark:text-[#8E8E93] text-xs leading-relaxed font-medium">O descanso reduz o cortisol e limpa a visão.</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setConfirming(true)}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 group text-xs uppercase tracking-widest active:scale-95"
                        >
                            <Lock size={16} className="group-hover:scale-110 transition-transform" />
                            Iniciar Bloqueio de Segurança
                        </button>
                    </>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-2">
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mx-auto mb-6 border border-amber-200 dark:border-amber-900/50">
                            <AlertTriangle size={32} className="text-amber-600 dark:text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Tem certeza absoluta?</h2>
                        <p className="text-sm text-slate-500 dark:text-[#8E8E93] mb-8 leading-relaxed font-medium">
                            Você ficará bloqueado de realizar novas apostas e transações por <span className="text-slate-900 dark:text-white font-bold">24 horas</span>. Esta ação é <span className="text-red-600 dark:text-red-500 font-bold uppercase">irreversível</span>.
                        </p>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setConfirming(false)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-[#000000] dark:hover:bg-[#2C2C2E] text-slate-700 dark:text-white border border-slate-200 dark:border-[#3A3A3C] font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-widest shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleActivate}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-95 text-xs uppercase tracking-widest"
                            >
                                Sim, Bloquear
                            </button>
                        </div>
                    </motion.div>
                )}

                <button onClick={handleClose} className="mt-8 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
                    Voltar ao Dashboard
                </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TiltModal;