import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useBetStore } from '../../store/useBetStore';

export const Toaster = () => {
  const { toast, setToast } = useBetStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000); // Fecha em 4 segundos
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  return (
    <AnimatePresence>
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`
              flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[300px]
              ${toast.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
              }
            `}
          >
            <div className={`
              p-2 rounded-full flex-shrink-0
              ${toast.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}
            `}>
              {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            </div>

            <div className="flex-1">
              <h4 className="font-bold text-sm uppercase tracking-wide">
                {toast.type === 'success' ? 'Sucesso' : 'Atenção'}
              </h4>
              <p className="text-sm font-medium opacity-90">
                {toast.message}
              </p>
            </div>

            <button 
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};