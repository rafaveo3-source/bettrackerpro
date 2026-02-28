import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Scan, Layers, Clock, Zap, Target, CheckCircle2, 
  Square, Goal, Flag, ArrowRight, Plus, ArrowRightLeft, 
  ShieldAlert, Activity, Lock, Crown, Trash
} from 'lucide-react';
import { useBetStore } from '../store/useBetStore';

// 🔥 COMPRESSOR DE IMAGEM HFT
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; 
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = (error) => reject(error);
      img.src = event.target?.result as string;
    };
    reader.onerror = (error) => reject(error);
  });
};

const MapIcon = ({ size, className }: any) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
    <line x1="9" y1="3" x2="9" y2="21"></line>
    <line x1="15" y1="3" x2="15" y2="21"></line>
  </svg>
);

const safeText = (val: any): string => {
    if (!val) return "Não especificada.";
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'object') {
        if (val.market && val.match) return `${val.match} - ${val.market} (${val.prob}%)`;
        if (val.market) return val.market;
        return JSON.stringify(val);
    }
    return String(val);
};

const ScoutIA: React.FC = () => {
  const userEmail = "rafaelancelmo.castro@gmail.com"; 
  const { isPro, aiScansUsedToday, canUseAiScan, incrementAiScan, setToast } = useBetStore();
  const navigate = useNavigate();

  const [scoutMode, setScoutMode] = useState<'grid' | 'builder'>('grid');
  const [scoutGridImage, setScoutGridImage] = useState<string | null>(null);
  const [scoutBuilderImages, setScoutBuilderImages] = useState<{url: string, file: File}[]>([]);
  const [isScanningScout, setIsScanningScout] = useState(false);
  const [scoutGridResult, setScoutGridResult] = useState<any[] | null>(null);
  const [scoutBuilderResult, setScoutBuilderResult] = useState<any | null>(null);
  const [selectedMatchesForBuilder, setSelectedMatchesForBuilder] = useState<string[]>([]);

  const AVAILABLE_MARKETS = ['Gols (Overs, Unders, HT/FT, Equipe)', 'Escanteios (Overs, Race, HT/FT, Equipe)'];
  const [builderMarkets, setBuilderMarkets] = useState<string[]>([...AVAILABLE_MARKETS]);

  const scoutGridInputRef = useRef<HTMLInputElement>(null);
  const scoutBuilderInputRef = useRef<HTMLInputElement>(null);

  const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  useEffect(() => {
    if (scoutMode === 'grid') {
        setScoutBuilderImages([]);
        setScoutBuilderResult(null);
    }
  }, [scoutMode]);

  const checkAiLimit = () => {
     if (userEmail === "rafaelancelmo.castro@gmail.com") return true;
     return canUseAiScan ? canUseAiScan() : false;
  };

  const handleIncrementScan = () => {
      if (userEmail !== "rafaelancelmo.castro@gmail.com" && typeof incrementAiScan === 'function') {
          incrementAiScan();
      }
  };

  // Suporte a Ctrl+V
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
             if (!VALID_IMAGE_TYPES.includes(blob.type)) {
                 setToast({ type: 'error', message: '⚠️ Formato inválido! Cole apenas imagens PNG, JPG ou WEBP.' });
                 return;
             }
             if (scoutMode === 'grid') handleAddScoutGridImage(blob);
             else handleAddScoutBuilderImage(blob);
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [scoutMode, scoutBuilderImages]);

  const handleScoutGridUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && VALID_IMAGE_TYPES.includes(file.type)) handleAddScoutGridImage(file);
  };

  const handleScoutBuilderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        Array.from(e.target.files).forEach(file => {
            if (VALID_IMAGE_TYPES.includes(file.type)) handleAddScoutBuilderImage(file);
        });
    }
  };

  const handleAddScoutGridImage = async (file: File) => {
      if (!isPro) { setToast({ type: 'error', message: 'Recurso exclusivo para Membros PRO.' }); return; }
      if (!checkAiLimit()) { setToast({ type: 'error', message: 'Limite atingido.' }); return; }

      setScoutGridImage(URL.createObjectURL(file));
      setIsScanningScout(true); setScoutGridResult(null);

      try {
          const base64Data = await fileToBase64(file);
          const response = await fetch('/api/vision-grid', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64Data, mimeType: 'image/jpeg', email: userEmail })
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Falha na IA');
          
          if (data && data.matches) {
              setScoutGridResult(data.matches);
              handleIncrementScan();
              setToast({ type: 'success', message: 'Grade Mapeada com sucesso!' });
          }
      } catch (e: any) {
          if (e.message?.includes('429') || e.message?.includes('quota')) {
              setToast({ type: 'error', message: '⚠️ Servidor da IA sobrecarregado. Aguarde um instante.' });
          } else {
              setToast({ type: 'error', message: e.message || 'Erro ao analisar a grade.' });
          }
      } finally { setIsScanningScout(false); }
  };

  const handleAddScoutBuilderImage = (file: File) => {
      if (scoutBuilderImages.length >= 4) {
          setToast({ type: 'error', message: 'Máximo de 4 imagens permitidas para análise cruzada.' });
          return;
      }
      setScoutBuilderImages(prev => [...prev, { url: URL.createObjectURL(file), file }]);
  };

  const processScoutBuilderEngine = async () => {
      if (scoutBuilderImages.length === 0) return;
      if (scoutBuilderImages.length < 2) {
          setToast({ type: 'error', message: 'Envie pelo menos 2 jogos para gerar a múltipla.' });
          return;
      }
      if (builderMarkets.length === 0) {
          setToast({ type: 'error', message: 'Selecione pelo menos um mercado alvo.' });
          return;
      }

      if (!isPro) { setToast({ type: 'error', message: 'Recurso exclusivo PRO.' }); return; }
      if (!checkAiLimit()) { setToast({ type: 'error', message: 'Limite atingido.' }); return; }

      setIsScanningScout(true); setScoutBuilderResult(null);

      try {
          const base64Images = await Promise.all(scoutBuilderImages.map(async (imgObj) => ({
              base64: await fileToBase64(imgObj.file),
              mimeType: 'image/jpeg'
          })));

          const response = await fetch('/api/vision-builder', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  images: base64Images, 
                  email: userEmail,
                  markets: builderMarkets 
              })
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Falha na IA');
          
          if (data && Array.isArray(data.selections)) {
              setScoutBuilderResult(data);
              handleIncrementScan();
              setToast({ type: 'success', message: 'Aposta Construída com Sucesso!' });
          } else {
              throw new Error('Resposta inválida da IA.');
          }
      } catch (e: any) {
          if (e.message?.includes('429') || e.message?.includes('quota')) {
              setToast({ type: 'error', message: '⚠️ Servidor da IA sobrecarregado. Aguarde um instante.' });
          } else {
              setToast({ type: 'error', message: e.message || 'Erro ao processar as imagens na IA.' });
          }
      } finally { setIsScanningScout(false); }
  };

  const toggleMatchSelection = (matchName: string) => {
      setSelectedMatchesForBuilder(prev => {
          if (prev.includes(matchName)) return prev.filter(m => m !== matchName);
          if (prev.length >= 4) {
             setToast({ type: 'error', message: 'Máximo de 4 jogos selecionados permitidos.'});
             return prev;
          }
          return [...prev, matchName];
      });
  };

  const toggleMarket = (market: string) => {
      setBuilderMarkets(prev => prev.includes(market) ? prev.filter(m => m !== market) : [...prev, market]);
  };

  const clearGrid = () => { setScoutGridImage(null); setScoutGridResult(null); setSelectedMatchesForBuilder([]); };
  const clearBuilder = () => { setScoutBuilderImages([]); setScoutBuilderResult(null); setSelectedMatchesForBuilder([]); };

  if (!isPro) {
      return (
          <div className="w-full h-full flex items-center justify-center p-6 mt-10">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-10 text-center flex flex-col items-center justify-center max-w-2xl w-full shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-50" />
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-full mb-6 relative z-10 shadow-sm border border-slate-100 dark:border-slate-700">
                      <Crown size={40} className="text-amber-500 dark:text-amber-400" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-3 relative z-10">
                      Scout Pré-Live HFT
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 text-base relative z-10 leading-relaxed">
                      Esta é a ferramenta mais avançada da plataforma. O Motor HFT lê suas telas estatísticas, analisa risco, covariância e monta apostas múltiplas de alto valor matemático. Exclusivo PRO.
                  </p>
                  <button onClick={() => navigate('/pro')} className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 font-black py-4 px-10 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 relative z-10 text-sm tracking-widest uppercase">
                      Desbloquear Agora
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 pb-20 w-full overflow-x-hidden px-4 md:px-0">
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-indigo-500 text-[9px] font-mono font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
            HFT ENGINE ATIVO
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
              <Sparkles size={28} className="text-indigo-500"/> Scout IA <span className="text-slate-400 dark:text-slate-700 text-lg">///</span>
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-4 sm:p-8 shadow-sm relative overflow-hidden">
           
           <div className="flex bg-[#09090b] p-1.5 rounded-2xl border border-slate-800 mb-8 shadow-inner">
              <button onClick={() => setScoutMode('grid')} className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${scoutMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
                  1. Radar de Grade
              </button>
              <button onClick={() => setScoutMode('builder')} className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${scoutMode === 'builder' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
                  2. Construtor HFT
              </button>
           </div>

           {/* ================================= */}
           {/* MODO 1: RADAR DE GRADE              */}
           {/* ================================= */}
           {scoutMode === 'grid' && (
             <>
             <div className="mb-6 relative group overflow-hidden rounded-[1.5rem] border-2 border-dashed border-indigo-500/20 hover:border-indigo-500/50 bg-slate-50 dark:bg-[#09090b] transition-all p-6 min-h-[250px] flex flex-col items-center justify-center">
                 {!scoutGridImage && !isScanningScout && (
                     <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                         <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-500 group-hover:text-indigo-500 transition-colors group-hover:scale-110 duration-300 shadow-inner">
                             <Scan size={28} />
                         </div>
                         <h3 className="text-base font-black text-slate-700 dark:text-slate-300 mb-2 text-center">Upload da Grade de Jogos</h3>
                         <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold text-center mb-4 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-full bg-white dark:bg-[#020617]">Ctrl+V para colar imagem</p>
                         <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleScoutGridUpload} ref={scoutGridInputRef} />
                     </label>
                 )}

                 {isScanningScout && scoutGridImage && (
                     <div className="relative w-full h-48 bg-black flex items-center justify-center overflow-hidden rounded-xl border border-indigo-500/30">
                         <img src={scoutGridImage} className="object-cover opacity-30 w-full h-full blur-md" />
                         <motion.div initial={{ top: '0%' }} animate={{ top: '100%' }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_30px_#6366f1] z-10" />
                         <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                            <Sparkles size={32} className="text-indigo-400 mb-2 animate-pulse" />
                            <p className="text-indigo-400 font-mono font-bold text-xs uppercase tracking-widest mt-2">Processando assimetrias...</p>
                         </div>
                     </div>
                 )}

                 {!isScanningScout && scoutGridImage && (
                     <div className="relative w-full h-40 bg-black group/preview rounded-xl overflow-hidden border border-slate-800">
                         <img src={scoutGridImage} className="object-cover opacity-50 w-full h-full" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                         <div className="absolute bottom-4 right-4 flex gap-2">
                             <button onClick={clearGrid} className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-5 py-2.5 rounded-lg transition-colors shadow-lg">Nova Leitura</button>
                         </div>
                     </div>
                 )}
             </div>

             {scoutGridResult && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 mt-10">
                     
                     {scoutGridResult.filter((m:any) => m.market === 'GOLS').length > 0 && (
                     <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-4 sm:p-8 shadow-inner">
                         <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-800/80 pb-4">
                             <div className="p-1.5 bg-orange-500/10 rounded-md"><Goal size={16} className="text-orange-500" /></div>
                             Foco em Gols (Overs / Ambas)
                         </h3>
                         <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
                             {scoutGridResult.filter((m: any) => m.market === 'GOLS').map((match: any, index: number) => {
                                 const isSelected = selectedMatchesForBuilder.includes(match.teams);
                                 return (
                                     <div key={`gols-${index}`} onClick={() => toggleMatchSelection(match.teams)} className={`relative h-full overflow-hidden bg-[#020617] rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 cursor-pointer transition-all duration-300 group ${isSelected ? 'border-2 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)] scale-[1.01]' : 'border border-slate-800 hover:border-slate-600 hover:bg-[#0b101e]'}`}>
                                         {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 shadow-[0_0_10px_#f97316]"></div>}
                                         <div className="flex-1 min-w-0 pl-1 sm:pl-2">
                                             <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2.5">
                                                <span className="bg-slate-900 text-slate-400 border border-slate-700 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-mono font-bold flex items-center gap-1.5 shrink-0"><Clock size={12} className="text-orange-500"/> {safeText(match.time)}</span>
                                                <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0"><Zap size={10}/> Radar Ativo</span>
                                             </div>
                                             <h4 className="text-sm sm:text-base font-black text-white tracking-tight mb-1.5 line-clamp-2 break-words leading-snug">{safeText(match.teams)}</h4>
                                             <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed flex items-start gap-1.5"><Target size={14} className="text-slate-500 shrink-0 mt-0.5"/> <span className="line-clamp-2">{safeText(match.reason)}</span></p>
                                         </div>
                                         <div className="shrink-0 pr-1">
                                             {isSelected ? <CheckCircle2 size={26} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" /> : <Square size={26} className="text-slate-700 group-hover:text-slate-500 transition-colors" />}
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                     )}

                     {scoutGridResult.filter((m:any) => m.market === 'CANTOS').length > 0 && (
                     <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-4 sm:p-8 shadow-inner">
                         <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-800/80 pb-4 mt-2">
                             <div className="p-1.5 bg-emerald-500/10 rounded-md"><Flag size={16} className="text-emerald-500" /></div>
                             Foco em Escanteios (Volume / Pressão)
                         </h3>
                         <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
                             {scoutGridResult.filter((m: any) => m.market === 'CANTOS').map((match: any, index: number) => {
                                 const isSelected = selectedMatchesForBuilder.includes(match.teams);
                                 return (
                                     <div key={`cantos-${index}`} onClick={() => toggleMatchSelection(match.teams)} className={`relative h-full overflow-hidden bg-[#020617] rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 cursor-pointer transition-all duration-300 group ${isSelected ? 'border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.01]' : 'border border-slate-800 hover:border-slate-600 hover:bg-[#0b101e]'}`}>
                                         {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>}
                                         <div className="flex-1 min-w-0 pl-1 sm:pl-2">
                                             <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2.5">
                                                <span className="bg-slate-900 text-slate-400 border border-slate-700 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-mono font-bold flex items-center gap-1.5 shrink-0"><Clock size={12} className="text-emerald-500"/> {safeText(match.time)}</span>
                                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0"><Activity size={10}/> Radar Ativo</span>
                                             </div>
                                             <h4 className="text-sm sm:text-base font-black text-white tracking-tight mb-1.5 line-clamp-2 break-words leading-snug">{safeText(match.teams)}</h4>
                                             <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed flex items-start gap-1.5"><MapIcon size={14} className="text-slate-500 shrink-0 mt-0.5"/> <span className="line-clamp-2">{safeText(match.reason)}</span></p>
                                         </div>
                                         <div className="shrink-0 pr-1">
                                             {isSelected ? <CheckCircle2 size={26} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" /> : <Square size={26} className="text-slate-700 group-hover:text-slate-500 transition-colors" />}
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                     )}

                     {selectedMatchesForBuilder.length > 0 && (
                         <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky bottom-6 mt-10 flex justify-center z-40 pointer-events-none">
                             <button onClick={() => setScoutMode('builder')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[11px] sm:text-xs px-8 sm:px-10 py-4 sm:py-5 rounded-full shadow-[0_15px_40px_rgba(99,102,241,0.4)] border border-indigo-400/30 flex items-center gap-3 transition-transform active:scale-95 pointer-events-auto hover:scale-105">
                                <Layers size={18} /> Ir para Construtor ({selectedMatchesForBuilder.length}) <ArrowRight size={18} />
                             </button>
                         </motion.div>
                     )}
                 </motion.div>
             )}
             </>
           )}

           {/* ================================= */}
           {/* MODO 2: CONSTRUTOR DE APOSTAS       */}
           {/* ================================= */}
           {scoutMode === 'builder' && (
             <div className="space-y-6">
                
                {selectedMatchesForBuilder.length > 0 && (
                    <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-[1.5rem]">
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Target size={14}/> 1. Jogos em Análise</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedMatchesForBuilder.map((match, i) => (
                                <span key={i} className="text-[10px] font-bold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">{match}</span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-[1.5rem]">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Layers size={14}/> 2. Filtro de Mercados Permitidos</h4>
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_MARKETS.map(m => {
                            const isActive = builderMarkets.includes(m);
                            return (
                                <button key={m} onClick={() => toggleMarket(m)} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${isActive ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#020617] border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                                    {m}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="relative group overflow-hidden rounded-[2rem] border-2 border-dashed border-indigo-500/20 hover:border-indigo-500/50 bg-slate-50 dark:bg-[#09090b] transition-all p-6 sm:p-8 min-h-[250px] flex flex-col items-center justify-center">
                   {scoutBuilderImages.length === 0 && !isScanningScout && (
                       <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                           <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-500 group-hover:text-indigo-500 transition-colors group-hover:scale-110 duration-300 shadow-inner">
                               <Scan size={28} />
                           </div>
                           <h3 className="text-base font-black text-slate-700 dark:text-slate-300 mb-2 text-center">
                               3. Upload Estatísticas (H2H)
                           </h3>
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold text-center mb-4 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-full bg-white dark:bg-[#020617]">Cole até 4 imagens (uma por jogo)</p>
                           <input type="file" accept="image/jpeg, image/png, image/webp" multiple className="hidden" onChange={handleScoutBuilderUpload} ref={scoutBuilderInputRef} />
                       </label>
                   )}

                   {scoutBuilderImages.length > 0 && !isScanningScout && (
                       <div className="w-full">
                           <div className="flex flex-wrap gap-4 mb-8 justify-center">
                               {scoutBuilderImages.map((img, index) => (
                                   <div key={index} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-indigo-500/30 group/thumb shadow-lg">
                                       <img src={img.url} className="object-cover w-full h-full opacity-80" />
                                       <button onClick={() => setScoutBuilderImages(prev => prev.filter((_, i) => i !== index))} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-md"><Trash size={14}/></button>
                                   </div>
                               ))}
                           </div>
                           
                           <div className="flex flex-wrap gap-3 justify-center">
                               {scoutBuilderImages.length < 4 && (
                                   <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-5 py-3 rounded-xl cursor-pointer transition-colors flex items-center gap-2">
                                       <Plus size={16}/> Add Imagem
                                       <input type="file" accept="image/jpeg, image/png, image/webp" multiple className="hidden" onChange={handleScoutBuilderUpload} />
                                   </label>
                               )}
                               <button onClick={processScoutBuilderEngine} className="text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-transform active:scale-95 flex items-center gap-2">
                                   <Sparkles size={16}/> Processar no Motor Quant
                               </button>
                               <button onClick={clearBuilder} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-400 px-5 py-3 transition-colors">
                                   Limpar Tudo
                               </button>
                           </div>
                       </div>
                   )}

                   {isScanningScout && (
                       <div className="absolute inset-0 bg-[#09090b] flex flex-col items-center justify-center z-20">
                           <div className="flex gap-3 mb-8">
                               {scoutBuilderImages.map((img, index) => (
                                   <img key={index} src={img.url} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover opacity-30 blur-sm border border-indigo-500/50" />
                               ))}
                           </div>
                           <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-0 left-0 h-1.5 bg-indigo-500 shadow-[0_0_30px_#6366f1]" />
                           <Sparkles size={40} className="text-indigo-400 mb-4 animate-pulse" />
                           <p className="text-indigo-400 font-mono font-bold text-xs uppercase tracking-widest text-center px-4 mt-2">Aplicando Volatility Engine e Precificação Justa...</p>
                       </div>
                   )}
                </div>

                {scoutBuilderResult && scoutBuilderResult.selections && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#020617] border border-indigo-500/20 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_0_40px_rgba(99,102,241,0.1)] relative overflow-hidden mt-10">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
                        
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-8 flex items-center gap-3 border-b border-indigo-500/10 pb-4"><Target size={18}/> Bilhete Principal (Alta Confiança)</h3>
                        
                        <div className="space-y-3 mb-8 relative z-10">
                            {scoutBuilderResult.selections.map((sel: any, idx: number) => (
                                <React.Fragment key={idx}>
                                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:border-slate-700 transition-colors">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{safeText(sel.match)}</p>
                                            <span className="text-base font-bold text-white flex items-center gap-2"><span className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]"></span> {safeText(sel.market)}</span>
                                        </div>
                                        <div className="flex items-center gap-3 self-start sm:self-auto">
                                            <span className="text-[10px] font-bold text-slate-500 border border-slate-800 px-2 py-1 rounded bg-[#020617] uppercase tracking-widest">Amostra: {safeText(sel.sampleSize)}</span>
                                            <span className="text-sm font-mono font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg">{safeText(sel.prob)}% Prob.</span>
                                        </div>
                                    </div>
                                    {idx < scoutBuilderResult.selections.length - 1 && (
                                        <div className="flex justify-center -my-2 relative z-20"><Plus size={16} className="text-indigo-500 bg-[#020617] rounded-full p-1 border border-slate-800" /></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative z-10">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-center flex flex-col justify-center">
                                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2">Win Rate Calculado</p>
                                <p className="text-3xl font-black text-white">{safeText(scoutBuilderResult.combinedProb)}%</p>
                            </div>
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 text-center shadow-inner flex flex-col justify-center">
                                <p className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold mb-2">Odd Justa Sugerida</p>
                                <p className="text-4xl font-black text-indigo-400 font-mono">@{safeText(scoutBuilderResult.fairOdd)}</p>
                            </div>
                            <div className={`border rounded-2xl p-5 text-center flex flex-col justify-center shadow-inner ${
                                scoutBuilderResult.riskLevel === 'ALTO' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                scoutBuilderResult.riskLevel === 'MÉDIO' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                                <p className="text-[9px] uppercase tracking-widest font-bold mb-2 opacity-80">Risco Estrutural</p>
                                <p className="text-xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                    <ShieldAlert size={20} /> {safeText(scoutBuilderResult.riskLevel)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8 relative z-10">
                            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3 flex items-center gap-1.5 border-b border-slate-800 pb-2"><ArrowRightLeft size={14}/> Alternativa Tática</p>
                                <p className="text-sm text-slate-300 leading-relaxed font-medium">{safeText(scoutBuilderResult.alternativeCombination)}</p>
                            </div>
                            <div className="bg-emerald-900/10 border border-emerald-900/30 p-5 rounded-2xl">
                                <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-3 flex items-center gap-1.5 border-b border-emerald-900/50 pb-2"><ShieldAlert size={14}/> Margem de Segurança</p>
                                <p className="text-sm text-emerald-400 leading-relaxed font-medium">{safeText(scoutBuilderResult.conservativeCombination)}</p>
                            </div>
                        </div>

                        <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-3xl relative z-10">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-4 flex items-center gap-2"><Activity size={14} className="text-indigo-500"/> Tese Quantitativa da IA</p>
                            <div className="text-xs sm:text-sm text-slate-300 leading-loose border-l-2 border-indigo-500/50 pl-4 whitespace-pre-wrap font-medium">
                                {safeText(scoutBuilderResult.analysis)}
                            </div>
                        </div>
                    </motion.div>
                )}
             </div>
           )}

        </div>
    </div>
  );
};

export default ScoutIA;