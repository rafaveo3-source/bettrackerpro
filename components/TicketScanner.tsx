import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Upload, X, Check, Loader2, AlertCircle, FileText, BotMessageSquare, Save, Edit, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TicketScannerProps {
  onScanComplete: (data: any) => void;
}

const TicketScanner: React.FC<TicketScannerProps> = ({ onScanComplete }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [scannedResult, setScannedResult] = useState<any>(null);
  const [rawOcrText, setRawOcrText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusMap = { 'won': 'Ganha ✅', 'lost': 'Perdida ❌', 'refunded': 'Devolvida ⚠️', 'half-won': '½ Ganha', 'half-lost': '½ Perdida', 'cashout': 'Cashout 💰', 'pending': 'Em Aberto' };

  // 1. LIDA COM O UPLOAD DA IMAGEM E MELHORA OCR (Pré-processamento)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, envie apenas imagens (PNG, JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      // Pré-processamento genérico da imagem para melhorar OCR (grayscale/contraste)
      // ISSO MELHORA A LEITURA GENÉRICA DO TESSERACT.js
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
         const canvas = document.createElement('canvas');
         const ctx = canvas.getContext('2d');
         if(!ctx) return;
         canvas.width = img.width; canvas.height = img.height;
         ctx.drawImage(img, 0, 0);
         // Aplica Grayscale
         ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'hsl(0, 0%, 50%)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.globalCompositeOperation = 'source-over';
         // Aplica Contraste (Muito Simples)
         ctx.filter = 'contrast(1.5)'; ctx.drawImage(canvas, 0, 0); ctx.filter = 'none';

         setImage(canvas.toDataURL());
         setError(null);
      };
    };
    reader.readAsDataURL(file);
  };

  // 2. O MOTOR OCR FRONTEND (CUSTO ZERO)
  const processImageOCR = async () => {
    if (!image) return;
    setIsScanning(true); setError(null); setProgress(0); setShowValidationModal(false); setScannedResult(null); setRawOcrText("");

    try {
      // Tesseract processa a imagem (melhorada) direto no navegador do usuário
      const result = await Tesseract.recognize(image, 'por', { logger: m => { if (m.status === 'recognizing text') { setProgress(Math.round(m.progress * 100)); } } });

      const rawText = result.data.text;
      if (!rawText || rawText.trim().length < 10) throw new Error('Não consegui ler texto suficiente neste print. Tente recortar apenas o bilhete.');
      setRawOcrText(rawText);

      // 3. ENVIA O TEXTO BRUTO PARA NOSSO BACKEND (NLP Turbinado)
      await sendToBackend(rawText);

    } catch (err: any) { setError(err.message || 'Falha ao processar a imagem. Tente novamente.'); setIsScanning(false); }
  };

  // 3. COMUNICAÇÃO COM A API (LLM Barato com redundantia e prompts táticos)
  const sendToBackend = async (rawText: string) => {
    try {
        const response = await fetch('/api/ticket-nlp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ textData: rawText }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro na leitura do bilhete.');
        setScannedResult(data);
        setShowValidationModal(true); // Abre o Modal de Validação da IA
        
    } catch (err: any) { setError(err.message || 'Falha ao formatar os dados do bilhete.'); } finally { setIsScanning(false); }
  };

  // 4. FINALIZAÇÃO E ENVIO PARA O FORMULÁRIO MANUAL
  const finalizeAndSave = () => {
    setShowValidationModal(false);
    onScanComplete(scannedResult); // Envia os dados validados para preencher o formulário final
  };

  return (
    <>
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800 gap-3">
          <h3 className="font-black text-white uppercase tracking-wider text-sm flex items-center gap-2.5">
             <Camera size={18} className="text-indigo-500"/> Scanner de Bilhetes PRO <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Bet365, Betano, Betfair</span>
          </h3>
          <button 
              onClick={() => { setImage(null); setError(null); fileInputRef.current?.click(); }} 
              className="text-emerald-500 text-xs font-bold hover:underline bg-white/5 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
          >
              <FileText size={14} className="inline mr-1" /> Importar Arquivo
          </button>
      </div>
      
      <p className="text-xs text-slate-400 mb-6 leading-relaxed bg-white/5 p-4 rounded-xl border border-slate-800 shadow-inner">
          <Check size={14} className="text-emerald-500 inline mr-1.5" /> Envie um print do bilhete <strong>finalizado</strong>. Recorte a imagem para focar apenas nos dados da aposta.
          <AlertCircle size={14} className="text-yellow-500 inline ml-3 mr-1.5" /> A IA pode falhar em ler nomes de jogos muito zoados pelo OCR.
      </p>

      {!image ? (
        <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-800/50 transition-colors group"
        >
          <div className="bg-indigo-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
             <Upload size={24} className="text-indigo-400" />
          </div>
          <p className="text-sm font-bold text-slate-300">Anexar um Print de Aposta</p>
          <p className="text-xs text-slate-500 mt-2">PNG ou JPG (Máx 5MB)</p>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" className="hidden" />
        </div>
      ) : (
        <div className="space-y-4">
           <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex justify-center items-center h-48 shadow-inner">
              <img src={image} alt="Bilhete" className="max-h-full object-contain" />
              {!isScanning && (
                  <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors">
                     <X size={16} />
                  </button>
              )}
           </div>

           {error && (
               <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-start gap-2.5">
                   <AlertCircle size={16} className="shrink-0 mt-0.5" /> <span>{error}</span>
               </div>
           )}

           <button 
              onClick={processImageOCR} 
              disabled={isScanning || !image}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-500/10 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
           >
              {isScanning ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processando Imagem... {progress > 0 && `${progress}%`}
                    <div className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </>
              ) : (
                  <><Check size={16} /> Extrair Dados da Aposta com IA (BETA)</>
              )}
           </button>
        </div>
      )}
    </div>

    {/* 🔥 MODAL DE VALIDAÇÃO DA IA (A Nova UX Profissional) 🔥 */}
    <AnimatePresence>
      {showValidationModal && scannedResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" onClick={() => setShowValidationModal(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col">
              
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-800 gap-4">
                  <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-2.5">
                        <BotMessageSquare size={22} className="text-emerald-500" /> Trilha de Auditoria: Validação da IA
                      </h2>
                      <p className="text-slate-500 text-xs mt-0.5">Casa: <strong className="text-slate-300">{scannedResult.bookmaker}</strong></p>
                  </div>
                  <button onClick={() => setShowValidationModal(false)} className="bg-slate-800/50 p-2 rounded-full text-slate-500 hover:text-white hover:bg-slate-700 transition-all"><X size={20} /></button>
              </div>

              {/* CONTEÚDO DO MODAL (Duas Colunas) */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pb-6 custom-scrollbar">
                 
                 {/* ESQUERDA: Texto Bruto Lido pelo OCR */}
                 <div className="bg-slate-950/50 border border-slate-800/50 rounded-2xl p-5 flex flex-col h-full overflow-hidden">
                     <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-3 flex items-center gap-1.5"><Search size={12}/> Texto Bruto Lido pelo OCR (Sopa de Letrinhas)</h4>
                     <textarea value={rawOcrText} readOnly className="flex-1 bg-transparent text-slate-600 font-mono text-[10px] leading-relaxed resize-none w-full p-1 custom-scrollbar outline-none"></textarea>
                 </div>

                 {/* DIREITA: Dados Extraídos pela IA */}
                 <div className="space-y-5 flex flex-col">
                    <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-1.5"><Edit size={12}/> Dados Organizados pela IA - Revise Tudo</h4>
                    
                    {[ {label: 'Resultado (Status)', value: statusMap[scannedResult.status as keyof typeof statusMap] || scannedResult.status}, {label: 'Jogo (Evento)', value: scannedResult.match}, {label: 'Mercado', value: scannedResult.market}, {label: 'Cotação (Odd)', value: `@${scannedResult.odd.toFixed(2)}`}, {label: `Exposição (${scannedResult.stake > 0 ? scannedResult.stake : 'R$ ???'})`, value: `R$ ${scannedResult.stake.toFixed(2)}`} ].map((item, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3 shadow-inner">
                         <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">{item.label}</p>
                             <p className={`text-sm font-bold text-slate-200 truncate ${idx === 3 ? 'font-mono' : ''}`}>{item.value}</p>
                         </div>
                         <div className="text-emerald-500"><Check size={20}/></div>
                      </div>
                    ))}
                    
                    <div className="flex-1"></div> { /* Puxa o botão para baixo */ }
                 </div>
              </div>

              {/* RODAPÉ DO MODAL (Botões) */}
              <div className="bg-slate-950/90 backdrop-blur-sm border-t border-slate-800 p-6 -mx-8 -mb-8 mt-auto flex justify-end gap-3 rounded-b-3xl">
                  <button onClick={() => setShowValidationModal(false)} className="text-xs font-bold text-slate-500 px-5 py-3 hover:text-white bg-slate-800 rounded-xl active:scale-95 transition-all">Cancelar</button>
                  <button onClick={finalizeAndSave} className="text-xs font-black text-slate-950 uppercase px-8 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl flex items-center gap-1.5 shadow-xl shadow-emerald-900/10 active:scale-95 transition-all">
                      <Save size={16} /> Validar e Enviar para o Portfólio
                  </button>
              </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};

export default TicketScanner;