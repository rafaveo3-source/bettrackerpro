import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Upload, X, Check, Loader2, BotMessageSquare, Save, Edit3, AlertTriangle } from 'lucide-react';
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

  const statusMap = { 'won': 'Ganha ✅', 'lost': 'Perdida ❌', 'refunded': 'Devolvida ⚠️', 'half-won': '½ Ganha', 'half-lost': '½ Perdida', 'cashout': 'Cashout 💰', 'pending': 'Em Aberto' };

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

    } catch (err: any) { setError(err.message || 'Falha ao processar a imagem. Tente novamente.'); setIsScanning(false); }
  };

  const sendToBackend = async (rawText: string) => {
    try {
        const response = await fetch('/api/ticket-nlp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ textData: rawText }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro na leitura do bilhete.');
        setScannedResult(data);
        setShowValidationModal(true); 
        
    } catch (err: any) { setError(err.message || 'Falha ao extrair os dados. A imagem pode estar ilegível.'); } finally { setIsScanning(false); }
  };

  const finalizeAndSave = () => {
    setShowValidationModal(false);
    onScanComplete(scannedResult); 
  };

  // 🔥 FUNÇÃO PARA EDITAR OS DADOS DIRETO NO MODAL DA IA 🔥
  const handleEditField = (field: string, value: string) => {
      setScannedResult((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <>
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg relative overflow-hidden flex flex-col h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-50 pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-slate-800 gap-3 relative z-10">
          <h3 className="font-black text-white uppercase tracking-wider text-sm flex items-center gap-2">
             <Camera size={18} className="text-indigo-500"/> Scanner de Bilhetes
             <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">BETA</span>
          </h3>
      </div>
      
      <div className="text-xs text-slate-400 mb-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800 shadow-inner relative z-10">
          <p className="flex items-start gap-2">
             <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
             <span>Faça upload do print do bilhete <strong>finalizado</strong>. Recorte a imagem para exibir apenas: Times, Mercado, Odd e Valor Apostado.</span>
          </p>
      </div>

      {!image ? (
        <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-800/50 transition-colors group relative z-10 mt-auto mb-auto"
        >
          <div className="bg-indigo-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
             <Upload size={24} className="text-indigo-400" />
          </div>
          <p className="text-sm font-bold text-slate-300">Anexar um Print de Aposta</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-2">Suporta Bet365, Betano e Betfair</p>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" className="hidden" />
        </div>
      ) : (
        <div className="space-y-4 relative z-10 flex flex-col flex-1">
           <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex justify-center items-center h-40 sm:h-48 shadow-inner">
              <img src={image} alt="Bilhete" className="max-h-full object-contain" />
              {!isScanning && (
                  <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-md transition-colors">
                     <X size={16} />
                  </button>
              )}
           </div>

           <button 
              onClick={processImageOCR} 
              disabled={isScanning || !image}
              className="w-full mt-auto bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-500/10 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
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

    {/* 🔥 MODAL DE VALIDAÇÃO DA IA 🔥 */}
    <AnimatePresence>
      {showValidationModal && scannedResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 sm:p-6" onClick={() => setShowValidationModal(false)}>
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.95, opacity: 0 }} 
            onClick={e => e.stopPropagation()} 
            className="bg-slate-900 border border-slate-800 w-full max-w-xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col relative overflow-hidden"
          >
              
              {/* HEADER FIXO */}
              <div className="flex justify-between items-center p-5 border-b border-slate-800 shrink-0 bg-slate-900 z-10">
                  <div>
                      <h2 className="text-sm sm:text-lg font-black text-white uppercase tracking-tighter italic flex items-center gap-2">
                        <BotMessageSquare size={20} className="text-emerald-500" /> Auditoria da IA
                      </h2>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">Casa Detectada: <strong className="text-slate-300">{scannedResult.bookmaker}</strong></p>
                  </div>
                  <button onClick={() => setShowValidationModal(false)} className="bg-slate-800/50 p-2 rounded-full text-slate-500 hover:text-white hover:bg-slate-700 transition-all"><X size={20} /></button>
              </div>

              {/* CORPO SCROLLÁVEL */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-950/50 custom-scrollbar">
                    <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-1.5 mb-4">
                        <Edit3 size={12}/> Dados Extraídos (Edite os campos se houver erro)
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        
                        {/* Campo STATUS (Somente leitura) */}
                        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Status</p>
                                <p className="text-xs sm:text-sm font-bold text-slate-200 truncate">{statusMap[scannedResult.status as keyof typeof statusMap] || scannedResult.status}</p>
                            </div>
                            <div className="text-emerald-500/50 shrink-0"><Check size={16}/></div>
                        </div>

                        {/* CAMPOS EDITÁVEIS */}
                        {[ 
                          {key: 'match', label: 'Jogo (Evento)', prefix: ''}, 
                          {key: 'market', label: 'Mercado', prefix: ''}, 
                          {key: 'selection', label: 'Seleção (Posição)', prefix: ''},
                          {key: 'odd', label: 'Cotação (Odd)', prefix: '@ '}, 
                          {key: 'stake', label: 'Exposição (Valor)', prefix: 'R$ '} 
                        ].map((item, idx) => {
                          
                          // Lógica de Validação Visual (UX)
                          const isEmpty = !scannedResult[item.key] || scannedResult[item.key] === 0 || scannedResult[item.key] === '';
                          const isCritical = item.key === 'stake' || item.key === 'odd';
                          const hasWarning = isCritical && isEmpty;

                          return (
                            <div 
                              key={idx} 
                              onClick={(e) => {
                                  // Foca no input se o usuário clicar em qualquer lugar do card
                                  const input = e.currentTarget.querySelector('input');
                                  if (input) input.focus();
                              }}
                              className={`p-3 sm:p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm group cursor-text transition-colors border
                                ${hasWarning 
                                  ? 'bg-amber-500/5 border-amber-500/50' 
                                  : 'bg-slate-900 border-slate-800 focus-within:border-emerald-500/50 focus-within:bg-slate-800/50'
                                }`}
                            >
                               <div className="min-w-0 flex-1 flex flex-col">
                                   <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1 flex justify-between items-center w-full">
                                       {item.label}
                                       {hasWarning && <span className="text-amber-500 text-[8px] flex items-center gap-1"><AlertTriangle size={10}/> Obrigatório</span>}
                                   </label>
                                   <div className="flex items-center gap-1">
                                       {item.prefix && <span className={`${hasWarning ? 'text-amber-500/60' : 'text-slate-400'} font-bold text-xs sm:text-sm`}>{item.prefix}</span>}
                                       <input 
                                           type="text"
                                           value={scannedResult[item.key] || ''}
                                           onChange={(e) => handleEditField(item.key, e.target.value)}
                                           onBlur={(e) => {
                                               // Formatação automática (1.7 vira 1.70)
                                               if (item.key === 'odd' && e.target.value) {
                                                   const val = parseFloat(e.target.value.replace(',', '.'));
                                                   if (!isNaN(val)) handleEditField('odd', val.toFixed(2));
                                               }
                                           }}
                                           placeholder={hasWarning ? 'Preencha o valor' : ''}
                                           className={`bg-transparent text-xs sm:text-sm font-bold w-full outline-none truncate 
                                            ${hasWarning ? 'text-amber-400 placeholder:text-amber-500/30' : 'text-slate-200'} 
                                            ${item.key === 'odd' || item.key === 'stake' ? 'font-mono' : ''}`}
                                       />
                                   </div>

                                   {/* Chips de Adição Rápida para a Exposição (Stake) */}
                                   {item.key === 'stake' && (
                                       <div className="flex gap-1.5 mt-2">
                                           {[10, 50, 100].map(val => (
                                               <button
                                                   key={val}
                                                   type="button"
                                                   onClick={(e) => {
                                                       e.stopPropagation();
                                                       const current = parseFloat(String(scannedResult.stake).replace(',', '.')) || 0;
                                                       handleEditField('stake', (current + val).toString());
                                                   }}
                                                   className="text-[9px] font-bold text-slate-400 bg-slate-800/80 hover:bg-slate-700 hover:text-white px-2 py-0.5 rounded transition-colors border border-slate-700/50"
                                               >
                                                   +{val}
                                               </button>
                                           ))}
                                       </div>
                                   )}
                               </div>
                               <div className={`${hasWarning ? 'text-amber-500' : 'text-slate-700 group-hover:text-emerald-500'} transition-colors shrink-0`}>
                                  <Edit3 size={14}/>
                               </div>
                            </div>
                          )
                        })}
                    </div>
              </div>

              {/* RODAPÉ FIXO */}
              <div className="p-5 border-t border-slate-800 bg-slate-900 shrink-0 flex flex-col sm:flex-row justify-end gap-3 z-10">
                  <button onClick={() => setShowValidationModal(false)} className="text-xs font-bold text-slate-400 px-4 py-4 sm:py-3 hover:text-white bg-slate-800 rounded-xl active:scale-95 transition-all order-2 sm:order-1 hidden sm:block">Cancelar</button>
                  <button onClick={finalizeAndSave} className="flex-1 sm:flex-none text-xs font-black text-slate-950 uppercase px-6 py-4 sm:py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all order-1 sm:order-2">
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