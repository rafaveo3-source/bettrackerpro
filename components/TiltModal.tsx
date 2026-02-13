
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
    activateTiltLock(24); // 24 Hours lock
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
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-lg bg-[#0f0a0a] border border-red-900/30 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.2)] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-red-600 p-4 flex justify-between items-center shadow-lg relative z-10">
                <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-sm">
                    <ShieldAlert size={18} /> Protocolo de Emergência
                </div>
                <button onClick={handleClose} className="text-white/80 hover:text-white"><X size={20}/></button>
            </div>

            <div className="p-8 text-center relative overflow-hidden">
                <div className="relative z-10">
                    {!confirming ? (
                        <>
                            <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-900/50">
                                <BrainCircuit size={40} className="text-red-500" />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">Sentindo o Tilt?</h2>
                            <p className="text-slate-400 mb-8">
                                Identificamos um padrão emocional atípico. <strong className="text-white">Dê um tempo para sua mente</strong> e preserve seu capital.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                                <div className="bg-[#1a0f0f] border border-red-900/20 p-4 rounded-xl">
                                    <ShieldAlert className="text-yellow-500 mb-2" size={24} />
                                    <h3 className="text-white font-bold text-sm mb-1">Preservação</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">Evite decisões impulsivas que comprometem lucro.</p>
                                </div>
                                <div className="bg-[#1a0f0f] border border-red-900/20 p-4 rounded-xl">
                                    <BrainCircuit className="text-blue-500 mb-2" size={24} />
                                    <h3 className="text-white font-bold text-sm mb-1">Recuperação</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">O descanso reduz o cortisol e limpa a visão.</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => setConfirming(true)}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_-5px_rgba(220,38,38,0.5)] transition-all flex items-center justify-center gap-2 group"
                            >
                                <Lock size={20} className="group-hover:scale-110 transition-transform" />
                                INICIAR BLOQUEIO DE SEGURANÇA
                            </button>
                        </>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4">
                            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/30">
                                <AlertTriangle size={40} className="text-yellow-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">Tem certeza absoluta?</h2>
                            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                                Você ficará bloqueado de realizar novas apostas e transações por <span className="text-white font-bold">24 horas</span>. Esta ação é <span className="text-red-500 font-bold uppercase">irreversível</span>.
                            </p>
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setConfirming(false)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleActivate}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-600/20"
                                >
                                    Sim, Bloquear
                                </button>
                            </div>
                        </motion.div>
                    )}

                    <button onClick={handleClose} className="mt-8 text-slate-500 hover:text-white text-sm transition-colors">
                        Voltar ao Dashboard
                    </button>
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TiltModal;
