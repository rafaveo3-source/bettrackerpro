import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já aceitou os cookies
    const consent = localStorage.getItem('bettracker_cookie_consent');
    if (!consent) {
      // Pequeno delay para a animação ficar suave ao entrar
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('bettracker_cookie_consent', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-center"
        >
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl max-w-4xl w-full flex flex-col md:flex-row items-center gap-6 md:gap-8">
            
            {/* Ícone e Texto */}
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
                <Cookie size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-bold text-sm">Respeitamos sua privacidade</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Utilizamos cookies para melhorar sua experiência, analisar o tráfego e personalizar o conteúdo. 
                  Ao continuar navegando, você concorda com nossa{' '}
                  <a 
                    href="https://docs.google.com/document/d/1oqh1V6PAQybR3wPWlRu_9UZ9yzrW48tTsTVubwy6S6k/edit?usp=sharing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
                  >
                    Política de Privacidade
                  </a>.
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsVisible(false)} // Apenas fecha sem salvar (opcional)
                className="flex-1 md:flex-none py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Recusar
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Aceitar Cookies
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;