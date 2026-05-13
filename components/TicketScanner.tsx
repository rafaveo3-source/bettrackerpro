import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Upload, X, Check, Loader2, BotMessageSquare, Save, Edit3, AlertTriangle, ClipboardPaste } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusMap = { 'won': 'Lucro ✅', 'lost': 'Prejuízo ❌', 'refunded': 'Devolvida ⚠️', 'half-won': '½ Lucro', 'half-lost': '½ Prejuízo', 'cashout': 'Cashout 💰', 'pending': 'Em Aberto' };

  // 🔥 OUVINTE DE CTRL+V (PASTE GLOBAL) 🔥
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Se o modal de validação estiver aberto ou o usuário estiver digitando em um input, NÃO intercepta
      const target = e.target as HTMLElement;
      if (showValidationModal || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault(); 
          const file = items[i].getAsFile();
          if (!file) continue;

          const reader = new FileReader();
          reader.onload = (event) => {
            setImage(event.target?.result as string);
            setError(null);
          };
          reader.readAsDataURL(file);
          break; 
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [showValidationModal]);

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

  const processImageOCR = async () => {
    if (!image) return;
    setIsScanning(true); setError(null); setProgress(0); setShowValidationModal(false); setScannedResult(null);

    try {
      const result = await Tesseract.recognize(image, 'por', { logger: m => { if (m.status === 'recognizing text') { setProgress(Math.round(m.progress * 100)); } } });

      const rawText = result.data.text;
      if (!rawText || rawText.trim().length < 10) throw new Error('Texto insuficiente no print. Tente recortar apenas os dados da aposta.');

      await sendToBackend(rawText);

    } catch (err: any) { 
      setError(err.message || 'Falha ao processar a imagem. Tente novamente.'); 
      setIsScanning(false); 
    }
  };

  const sendToBackend = async (rawText: string) => {
    try {
        const response = await fetch('/api/ticket-nlp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ textData: rawText }) });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Erro na leitura do bilhete.');
        
        setScannedResult(data);
        setShowValidationModal(true); 
        
    } catch (err: any) { 
        setError(err.message || 'Falha ao extrair os dados. A imagem pode estar ilegível.'); 
    } finally { 
        setIsScanning(false); 
    }
  };

  const finalizeAndSave = () => {
    setShowValidationModal(false);
    onScanComplete(scannedResult); 
  };

  const handleEditField = (field: string, value: string) => {
      setScannedResult((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <>
    <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden flex flex-col h-full font-sans">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-[#2C2C2E] gap-3 relative z-10">
          <h3 className="font-bold text-slate-900 dark:text-white tracking-tight text-sm flex items-center gap-2">
             <Camera size={18} className="text-indigo-600 dark:text-indigo-400"/> Scanner de Bilhetes
             <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">BETA</span>
          </h3>
      </div>
      
      <div className="text-xs text-slate-600 dark:text-[#8E8E93] mb-5 bg-slate-50 dark:bg-[#1C1C1E] p-4 rounded-xl border border-slate-200 dark:border-[#2C2C2E] shadow-sm font-medium relative z-10">
          <p className="flex items-start gap-2">
             <Check size={16} className="text-indigo-500 shrink-0 mt-0.5" />
             <span>Faça upload do print do bilhete <strong>finalizado</strong>. Recorte a imagem para exibir apenas: Times, Mercado, Odd e Valor.</span>
          </p>
      </div>

      {!image ? (
        <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-300 dark:border-[#3A3A3C] rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1C1C1E] bg-white dark:bg-[#000000] transition-colors group relative z-10 mt-auto mb-auto"
        >
          <div className="bg-indigo-50 dark:bg-indigo-500/10 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform border border-indigo-100 dark:border-indigo-500/20">
             <ClipboardPaste size={24} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-[#E5E5EA]">Clique para anexar ou <span className="text-indigo-600 dark:text-indigo-400">CTRL+V</span></p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#636366] mt-2 font-bold">Suporta Bet365, Betano e Betfair</p>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" className="hidden" />
        </div>
      ) : (
        <div className="space-y-4 relative z-10 flex flex-col flex-1">
           <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#2C2C2E] bg-slate-100 dark:bg-[#1C1C1E] flex justify-center items-center h-40 sm:h-48 shadow-sm">
              <img src={image} alt="Bilhete" className="max-h-full object-contain" />
              {!isScanning && (
                  <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-slate-900/60 hover:bg-slate-900/80 text-white p-1.5 rounded-lg backdrop-blur-md transition-colors">
                     <X size={16} />
                  </button>
              )}
           </div>

           <button 
              onClick={processImageOCR} 
              disabled={isScanning || !image}
              className="w-full mt-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-xs py-3.5 rounded-xl flex items-center justify-center gap-2.5 shadow-sm transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
           >
              {isScanning ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Extraindo Dados... {progress > 0 && `${progress}%`}
                    <div className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </>
              ) : (
                  <><Check size={16} /> Ler Dados da Aposta com IA</>
              )}
           </button>
        </div>
      )}
    </div>

    {/* 🔥 MODAL DE VALIDAÇÃO DA IA (ESTILO APPLE SHEET NO MOBILE) 🔥 */}
    <AnimatePresence>
      {showValidationModal && scannedResult && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center font-sans sm:p-4" onClick={() => setShowValidationModal(false)}>
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 40 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 40 }} 
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()} 
            className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] w-full max-w-xl sm:rounded-2xl rounded-t-[2rem] shadow-2xl flex flex-col relative overflow-hidden h-[90vh] sm:h-auto sm:max-h-[90vh]"
          >
              
              {/* HEADER FIXO */}
              <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-[#2C2C2E] bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md shrink-0 z-20">
                  <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <BotMessageSquare size={18} className="text-indigo-500" /> Auditoria da IA
                      </h2>
                      <p className="text-slate-500 dark:text-[#8E8E93] text-[10px] uppercase tracking-widest mt-1 font-bold">Casa Detectada: <strong className="text-slate-700 dark:text-[#E5E5EA]">{scannedResult.bookmaker}</strong></p>
                  </div>
                  <button onClick={() => setShowValidationModal(false)} className="bg-slate-100 dark:bg-[#2C2C2E] p-2 rounded-full text-slate-500 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white transition-all"><X size={16} /></button>
              </div>

              {/* CORPO SCROLLÁVEL */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50 dark:bg-[#000000] custom-scrollbar">
                    <h4 className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#8E8E93] tracking-widest flex items-center gap-1.5 mb-4">
                        <Edit3 size={12}/> Dados Extraídos (Edite se houver erro)
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                        
                        {/* Campo STATUS (Somente leitura) */}
                        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] p-3.5 sm:p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm min-w-0">
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-[#8E8E93] tracking-widest mb-1">Status</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{statusMap[scannedResult.status as keyof typeof statusMap] || scannedResult.status}</p>
                            </div>
                            <div className="text-indigo-500 shrink-0"><Check size={18}/></div>
                        </div>

                        {/* CAMPOS EDITÁVEIS (THUMB ZONE OPTIMIZED) */}
                        {[ 
                          {key: 'match', label: 'Jogo (Evento)', prefix: ''}, 
                          {key: 'market', label: 'Mercado', prefix: ''}, 
                          {key: 'selection', label: 'Seleção (Posição)', prefix: ''},
                          {key: 'odd', label: 'Cotação (Odd)', prefix: '@ '}, 
                          {key: 'stake', label: 'Exposição (Valor)', prefix: 'R$ '} 
                        ].map((item, idx) => {
                          
                          const isEmpty = !scannedResult[item.key] || scannedResult[item.key] === 0 || scannedResult[item.key] === '';
                          const isCritical = item.key === 'stake' || item.key === 'odd';
                          const hasWarning = isCritical && isEmpty;

                          return (
                            <div 
                              key={idx} 
                              onClick={(e) => {
                                  const input = e.currentTarget.querySelector('input');
                                  if (input) input.focus();
                              }}
                              className={`p-3.5 sm:p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm group cursor-text transition-colors border min-w-0
                                ${hasWarning 
                                  ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/50' 
                                  : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-[#2C2C2E] focus-within:border-indigo-500 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10'
                                }`}
                            >
                               <div className="min-w-0 flex-1 flex flex-col">
                                   <label className="text-[9px] uppercase font-bold text-slate-500 dark:text-[#8E8E93] tracking-widest mb-1 flex justify-between items-center w-full">
                                       {item.label}
                                       {hasWarning && <span className="text-amber-600 dark:text-amber-500 text-[8px] flex items-center gap-1"><AlertTriangle size={10}/> Obrigatório</span>}
                                   </label>
                                   <div className="flex items-center gap-1 min-w-0">
                                       {item.prefix && <span className={`${hasWarning ? 'text-amber-600/60 dark:text-amber-500/60' : 'text-slate-400 dark:text-[#636366]'} font-bold text-base md:text-sm shrink-0`}>{item.prefix}</span>}
                                       <input 
                                           type="text"
                                           value={scannedResult[item.key] || ''}
                                           onChange={(e) => handleEditField(item.key, e.target.value)}
                                           onBlur={(e) => {
                                               if (item.key === 'odd' && e.target.value) {
                                                   const val = parseFloat(e.target.value.replace(',', '.'));
                                                   if (!isNaN(val)) handleEditField('odd', val.toFixed(2));
                                               }
                                           }}
                                           placeholder={hasWarning ? 'Preencha o valor' : ''}
                                           className={`bg-transparent text-base md:text-sm font-bold w-full outline-none truncate min-w-0 
                                            ${hasWarning ? 'text-amber-700 dark:text-amber-400 placeholder:text-amber-600/40 dark:placeholder:text-amber-500/30' : 'text-slate-900 dark:text-white'} 
                                            ${item.key === 'odd' || item.key === 'stake' ? 'font-mono' : ''}`}
                                       />
                                   </div>

                                   {/* Chips de Adição Rápida para a Exposição (Stake) */}
                                   {item.key === 'stake' && (
                                       <div className="flex gap-1.5 mt-3">
                                           {[10, 50, 100].map(val => (
                                               <button
                                                   key={val}
                                                   type="button"
                                                   onClick={(e) => {
                                                       e.stopPropagation();
                                                       const current = parseFloat(String(scannedResult.stake).replace(',', '.')) || 0;
                                                       handleEditField('stake', (current + val).toString());
                                                   }}
                                                   className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-[#3A3A3C] hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded transition-colors"
                                               >
                                                   +{val}
                                               </button>
                                           ))}
                                       </div>
                                   )}
                               </div>
                               <div className={`${hasWarning ? 'text-amber-500' : 'text-slate-300 dark:text-[#3A3A3C] group-hover:text-indigo-500'} transition-colors shrink-0`}>
                                  <Edit3 size={14}/>
                               </div>
                            </div>
                          )
                        })}
                    </div>
              </div>

              {/* RODAPÉ FIXO */}
              <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-[#2C2C2E] bg-slate-50 dark:bg-[#1C1C1E] shrink-0 flex flex-col sm:flex-row justify-end gap-3 z-10">
                  <button onClick={() => setShowValidationModal(false)} className="text-xs font-bold text-slate-500 dark:text-[#8E8E93] px-6 py-4 sm:py-3 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-xl active:scale-95 transition-all order-2 sm:order-1 hidden sm:block shadow-sm">Cancelar</button>
                  <button onClick={finalizeAndSave} className="flex-1 sm:flex-none text-xs font-bold text-white uppercase tracking-widest px-8 py-4 sm:py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all order-1 sm:order-2">
                      <Save size={16} /> Preencher Formulário
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