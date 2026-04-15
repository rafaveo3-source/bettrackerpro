import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Upload, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TicketScannerProps {
  onScanComplete: (data: any) => void;
}

const TicketScanner: React.FC<TicketScannerProps> = ({ onScanComplete }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. LIDA COM O UPLOAD DA IMAGEM
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, envie apenas imagens (PNG, JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // 2. O MOTOR OCR FRONTEND (CUSTO ZERO)
  const processImageOCR = async () => {
    if (!image) return;
    setIsScanning(true);
    setError(null);
    setProgress(0);

    try {
      // Tesseract processa a imagem direto no navegador do usuário
      const result = await Tesseract.recognize(
        image,
        'por', // Português
        {
          logger: m => {
            if (m.status === 'recognizing text') {
                setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const rawText = result.data.text;

      // Se não achar nada, avisa
      if (!rawText || rawText.trim().length < 10) {
        throw new Error('Não consegui ler texto suficiente neste print. Tente recortar apenas o bilhete.');
      }

      // 3. ENVIA O TEXTO BRUTO PARA NOSSO BACKEND (NLP)
      sendToBackend(rawText);

    } catch (err: any) {
      setError(err.message || 'Falha ao processar a imagem. Tente novamente.');
      setIsScanning(false);
    }
  };

  // 3. COMUNICAÇÃO COM A API (LLM Barato)
  const sendToBackend = async (rawText: string) => {
    try {
        // Vamos criar essa rota no próximo passo
        const response = await fetch('/api/ticket-nlp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ textData: rawText })
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Erro na leitura do bilhete.');

        // Passa os dados limpos para cima (para preencher o formulário final)
        onScanComplete(data);
        
    } catch (err: any) {
        setError(err.message || 'Falha ao formatar os dados do bilhete.');
    } finally {
        setIsScanning(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-sm flex items-center gap-2">
             <Camera size={18} className="text-indigo-500"/> Scanner de Bilhetes (BETA)
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-500/20">Suporta Bet365, Betano e Betfair</span>
      </div>
      
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Importe suas entradas enviando um print do bilhete <strong>finalizado</strong>. Recorte a imagem para focar apenas nos dados da aposta.
      </p>

      {!image ? (
        <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
        >
          <div className="bg-indigo-50 dark:bg-indigo-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
             <Upload size={24} className="text-indigo-500 dark:text-indigo-400" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Clique para anexar um Print</p>
          <p className="text-xs text-slate-500 mt-2">PNG ou JPG (Máx 5MB)</p>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" className="hidden" />
        </div>
      ) : (
        <div className="space-y-4">
           <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 flex justify-center items-center h-48">
              <img src={image} alt="Bilhete" className="max-h-full object-contain" />
              {!isScanning && (
                  <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors">
                     <X size={16} />
                  </button>
              )}
           </div>

           {error && (
               <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs flex items-start gap-2">
                   <AlertCircle size={16} className="shrink-0 mt-0.5" /> <span>{error}</span>
               </div>
           )}

           <button 
              onClick={processImageOCR} 
              disabled={isScanning}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
           >
              {isScanning ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processando Imagem... {progress > 0 && `${progress}%`}
                    <div className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </>
              ) : (
                  <><Check size={16} /> Extrair Dados do Bilhete</>
              )}
           </button>
        </div>
      )}
    </div>
  );
};

export default TicketScanner;