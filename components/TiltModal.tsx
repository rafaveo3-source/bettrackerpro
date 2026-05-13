import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Lock,
  X,
  BrainCircuit,
  AlertTriangle
} from 'lucide-react';
import { useBetStore } from '../store/useBetStore';

interface TiltModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TiltModal: React.FC<TiltModalProps> = ({
  isOpen,
  onClose
}) => {
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
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 font-sans"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="w-full max-w-lg bg-[#0B0B0C] border border-red-500/30 rounded-[2rem] shadow-[0_0_50px_rgba(239,68,68,0.18)] overflow-hidden flex flex-col"
          >
            {/* HEADER */}
            <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-5 flex justify-between items-center backdrop-blur-md">
              <div className="flex items-center gap-2 text-red-500 font-black uppercase tracking-[0.18em] text-[11px]">
                <ShieldAlert size={16} />
                Protocolo de Emergência
              </div>

              <button
                onClick={handleClose}
                className="bg-[#111113] border border-red-500/20 p-2 rounded-xl text-red-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-8 text-center">
              {!confirming ? (
                <>
                  <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                    <BrainCircuit size={40} className="text-red-500" />
                  </div>

                  <h2 className="text-3xl font-black text-white tracking-tight mb-3">
                    Sentindo o Tilt?
                  </h2>

                  <p className="text-sm text-slate-400 leading-relaxed mb-8 font-medium">
                    Identificamos um padrão emocional atípico.
                    <strong className="text-white">
                      {' '}Preserve sua clareza mental e proteja seu capital.
                    </strong>
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                    <div className="bg-[#111113] border border-red-500/10 p-5 rounded-2xl">
                      <ShieldAlert
                        className="text-amber-500 mb-3"
                        size={22}
                      />

                      <h3 className="text-white font-bold text-sm mb-2">
                        Preservação
                      </h3>

                      <p className="text-slate-500 text-xs leading-relaxed">
                        Evite decisões impulsivas que podem comprometer meses de lucro.
                      </p>
                    </div>

                    <div className="bg-[#111113] border border-red-500/10 p-5 rounded-2xl">
                      <BrainCircuit
                        className="text-indigo-500 mb-3"
                        size={22}
                      />

                      <h3 className="text-white font-bold text-sm mb-2">
                        Recuperação
                      </h3>

                      <p className="text-slate-500 text-xs leading-relaxed">
                        O descanso reduz fadiga cognitiva e melhora decisões futuras.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setConfirming(true)}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.25)] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.18em] text-xs active:scale-[0.98]"
                  >
                    <Lock size={18} />
                    Iniciar Bloqueio
                  </button>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-2"
                >
                  <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                    <AlertTriangle
                      size={40}
                      className="text-amber-500"
                    />
                  </div>

                  <h2 className="text-3xl font-black text-white tracking-tight mb-4">
                    Tem certeza absoluta?
                  </h2>

                  <p className="text-sm text-slate-400 leading-relaxed mb-8 font-medium">
                    Você ficará bloqueado de registrar novas operações
                    por <span className="text-white font-bold">24 horas</span>.
                    Esta ação é
                    <span className="text-red-500 font-bold uppercase">
                      {' '}irreversível
                    </span>.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirming(false)}
                      className="flex-1 bg-[#111113] hover:bg-[#18181B] border border-white/10 text-white font-bold py-3.5 rounded-2xl transition-all uppercase tracking-[0.14em] text-xs"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={handleActivate}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-3.5 rounded-2xl transition-all shadow-[0_0_25px_rgba(239,68,68,0.22)] uppercase tracking-[0.14em] text-xs active:scale-[0.98]"
                    >
                      Sim, Bloquear
                    </button>
                  </div>
                </motion.div>
              )}

              <button
                onClick={handleClose}
                className="mt-8 text-slate-500 hover:text-white text-[11px] font-bold uppercase tracking-[0.18em] transition-colors"
              >
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