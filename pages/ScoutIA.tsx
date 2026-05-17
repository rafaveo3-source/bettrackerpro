import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Scan, Layers, Clock, Zap, Target, CheckCircle2, 
  Square, Goal, Flag, ArrowRight, Plus, ArrowRightLeft, 
  ShieldAlert, Activity, Info, TrendingUp, TrendingDown, Calculator, FileText, Eraser, AlertTriangle, Ban
} from 'lucide-react';
import { useBetStore } from '../store/useBetStore';
import ProTeaserBlock from '../components/ProTeaserBlock';

// 🔥 COMPRESSOR DE IMAGEM HFT
const fileToBase64 = async (file: File): Promise<string> => {
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  img.src = objectUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  const MAX_WIDTH = 1200;
  let width = img.width;
  let height = img.height;
  if (width > MAX_WIDTH) {
    height = Math.round(height * (MAX_WIDTH / width));
    width = MAX_WIDTH;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(img, 0, 0, width, height);
  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.65)
  );
  const reader = new FileReader();
  const base64: string = await new Promise((resolve, reject) => {
    reader.onloadend = () => {
      const res = reader.result as string;
      resolve(res.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  URL.revokeObjectURL(objectUrl);
  return base64;
};

const MapIcon = ({ size, className }: any) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
    <line x1="9" y1="3" x2="9" y2="21"></line>
    <line x1="15" y1="3" x2="15" y2="21"></line>
  </svg>
);

const safeText = (val: any): string => {
    if (!val && val !== 0) return "Não especificada.";
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'object') {
        if (val.market && val.match) return `${val.match} - ${val.market} (${val.prob}%)`;
        if (val.market) return val.market;
        return JSON.stringify(val);
    }
    return String(val);
};

const ScoutIA: React.FC = () => {
  const { user, canUseAiScan, incrementAiScan, setToast, isPro } = useBetStore();
  const userEmail = user?.email || "usuario@desconhecido.com"; 

  const [scoutMode, setScoutMode] = useState<'grid' | 'builder'>('grid');
  const [scoutGridImage, setScoutGridImage] = useState<string | null>(null);
  const [scoutGridResult, setScoutGridResult] = useState<any[] | null>(null);
  const [selectedMatchesForBuilder, setSelectedMatchesForBuilder] = useState<string[]>([]);
  
  const [scoutTextData, setScoutTextData] = useState<string>(''); 
  const [scoutBuilderResult, setScoutBuilderResult] = useState<any | null>(null);
  const [isScanningScout, setIsScanningScout] = useState(false);
  const [userOdd, setUserOdd] = useState<string>('');

  const AVAILABLE_MARKETS = ['Match Odds (1X2 & Dupla Chance)', 'Gols (Over/Under HT/FT)', 'Escanteios (Over/Under HT/FT)', 'Escanteios (Primeiros 10 Min)', 'Cartões & Faltas (Over/Under)', 'Ambas Marcam (BTTS Sim/Não)'];
  const [builderMarkets, setBuilderMarkets] = useState<string[]>([...AVAILABLE_MARKETS]);

  const dataHelperText = React.useMemo(() => {
      let msg = "";
      if (builderMarkets.some(m => m.includes('Cartões'))) msg += "⚠️ Para cartões, é obrigatório colar estatísticas de faltas e histórico do árbitro. ";
      if (builderMarkets.some(m => m.includes('10 Min') || m.includes('Escanteios'))) msg += "⚠️ Certifique-se de colar os gráficos de pressão por minuto (AP). ";
      if (builderMarkets.some(m => m.includes('Gols') || m.includes('1X2'))) msg += "⚠️ Inclua dados de Chutes no Alvo, xG e Desfalques. ";
      if (!msg) msg = "⚠️ Selecione mercados acima para ver os dados necessários.";
      return msg.trim();
  }, [builderMarkets]);

  const scoutGridInputRef = useRef<HTMLInputElement>(null);
  const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  useEffect(() => {
    if (scoutMode === 'grid') {
        setScoutTextData('');
        setScoutBuilderResult(null);
        setUserOdd('');
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

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (scoutMode !== 'grid') return; 
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
             if (!VALID_IMAGE_TYPES.includes(blob.type)) {
                 setToast({ type: 'error', message: '⚠️ Formato inválido! Cole apenas PNG ou JPG.' });
                 return;
             }
             handleAddScoutGridImage(blob);
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [scoutMode]);

  const handleScoutGridUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && VALID_IMAGE_TYPES.includes(file.type)) handleAddScoutGridImage(file);
  };

  const handleAddScoutGridImage = async (file: File) => {
      if (!checkAiLimit()) { setToast({ type: 'error', message: 'Limite de IA atingido.' }); return; }

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

  const processNLPEngine = async () => {
      if (!scoutTextData || scoutTextData.trim().length < 50) {
          setToast({ type: 'error', message: 'Cole os dados do site de estatísticas primeiro. Texto muito curto.' });
          return;
      }
      if (builderMarkets.length === 0) {
          setToast({ type: 'error', message: 'Selecione pelo menos um mercado alvo.' });
          return;
      }

      if (!checkAiLimit()) { setToast({ type: 'error', message: 'Limite de IA atingido.' }); return; }

      setIsScanningScout(true); 
      setScoutBuilderResult(null);
      setUserOdd('');

      try {
          const response = await fetch('/api/vision-builder', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  textData: scoutTextData, 
                  email: userEmail,
                  markets: builderMarkets
              })
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Falha no processamento NLP.');
          
          if (data && data.NO_BET) {
              setScoutBuilderResult(data);
              handleIncrementScan();
              setToast({ type: 'success', message: 'Análise Quantitativa Finalizada.' });
              return;
          }

          if (data && Array.isArray(data.selections)) {
              // Filtro de Sanitização (Double Check) Anti-Alucinação via Keyword Matching Normalizado
              const safeSelections = data.selections.filter((sel: any) => {
                  if (!sel.marketCategory) return false;
                  const cat = sel.marketCategory.toLowerCase();
                  const marketName = (sel.market || '').toLowerCase();

                  // Sempre libera se for Bet Builder Combinado
                  if (cat.includes('builder') || cat.includes('combinado')) return true;

                  // Verifica se a categoria enviada pela IA bate com as palavras-chave dos botões selecionados
                  return builderMarkets.some(uiMarket => {
                      const ui = uiMarket.toLowerCase();
                      if (ui.includes('gols') && (cat.includes('gols') || cat.includes('over') || cat.includes('under') || marketName.includes('gols'))) return true;
                      if (ui.includes('escanteios (over') && (cat.includes('escanteio') || cat.includes('canto') || marketName.includes('escanteio')) && !cat.includes('10 min')) return true;
                      if (ui.includes('10 min') && (cat.includes('10 min') || marketName.includes('10 min'))) return true;
                      if (ui.includes('cartões') && (cat.includes('cartão') || cat.includes('cartoes') || cat.includes('falta') || marketName.includes('cartão'))) return true;
                      if (ui.includes('ambas') && (cat.includes('ambas') || cat.includes('btts') || marketName.includes('btts') || marketName.includes('ambas'))) return true;
                      if (ui.includes('match odds') && (cat.includes('match') || cat.includes('1x2') || cat.includes('dupla') || cat.includes('vence') || marketName.includes('vence'))) return true;
                      return false;
                  });
              });

              if (safeSelections.length === 0) {
                  setScoutBuilderResult({ NO_BET: true, reason: 'Coleira de IA Ativada: Nenhuma aposta +EV encontrada DENTRO dos mercados que você permitiu. A IA tentou alucinar fora do escopo e foi bloqueada.' });
                  handleIncrementScan();
                  setToast({ type: 'success', message: 'Análise Concluída (Fora de Escopo).' });
                  return;
              }

              data.selections = safeSelections;

              setScoutBuilderResult(data);
              handleIncrementScan();
              setToast({ type: 'success', message: 'Game Script Quantitativo Gerado!' });
          } else {
              throw new Error('Resposta inválida do Motor Matemático.');
          }
      } catch (e: any) {
          setToast({ type: 'error', message: e.message || 'Erro ao processar o texto na IA.' });
      } finally { setIsScanningScout(false); }
  };

  const toggleMatchSelection = (matchName: string) => {
      setSelectedMatchesForBuilder(prev => {
          if (prev.includes(matchName)) return prev.filter(m => m !== matchName);
          if (prev.length >= 4) {
             setToast({ type: 'error', message: 'Máximo de 4 jogos selecionados.'});
             return prev;
          }
          return [...prev, matchName];
      });
  };

  const toggleMarket = (market: string) => {
      setBuilderMarkets(prev => prev.includes(market) ? prev.filter(m => m !== market) : [...prev, market]);
  };

  const clearGrid = () => { setScoutGridImage(null); setScoutGridResult(null); setSelectedMatchesForBuilder([]); };
  const clearBuilder = () => { setScoutTextData(''); setScoutBuilderResult(null); setSelectedMatchesForBuilder([]); setUserOdd(''); };

  // 🔥 CÁLCULO DINÂMICO DE EV
  let dynamicEVMin: number | null = null;
  let dynamicEVMax: number | null = null;
  let evStatus: 'positive' | 'negative' | 'mixed' | null = null;

  if (scoutBuilderResult && userOdd) {
      const parsedOdd = parseFloat(userOdd.replace(',', '.'));
      if (!isNaN(parsedOdd) && parsedOdd > 1) {
          const minProbDecimal = scoutBuilderResult.minProb / 100;
          const maxProbDecimal = scoutBuilderResult.maxProb / 100;
          
          dynamicEVMin = ((minProbDecimal * parsedOdd) - 1) * 100;
          dynamicEVMax = ((maxProbDecimal * parsedOdd) - 1) * 100;

          if (dynamicEVMin > 0) evStatus = 'positive';
          else if (dynamicEVMax < 0) evStatus = 'negative';
          else evStatus = 'mixed'; 
      }
  }

  const cardClass = "bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 md:p-8 shadow-sm transition-all";

  return (
    <div className="space-y-6 pb-20 w-full overflow-x-hidden font-sans relative">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></span>
            HFT ENGINE ATIVO
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Sparkles size={28} className="text-indigo-600 dark:text-indigo-500"/> Scout IA
            </h1>
          </div>
        </div>

        {!isPro ? (
            <ProTeaserBlock />
        ) : (
            <div className={`${cardClass} relative overflow-hidden`}>
           <div className="flex bg-slate-100 dark:bg-[#000000] p-1 rounded-xl border border-slate-200 dark:border-[#2C2C2E] mb-8">
              <button onClick={() => setScoutMode('grid')} className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${scoutMode === 'grid' ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#8E8E93] hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  1. Radar de Grade (Imagem)
              </button>
              <button onClick={() => setScoutMode('builder')} className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${scoutMode === 'builder' ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#8E8E93] hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  2. Construtor HFT (Texto)
              </button>
           </div>

           <motion.div
               key={scoutMode}
               initial={{ opacity: 0, y: -5 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-8 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-5 rounded-2xl flex gap-4 items-start"
           >
               <div className="mt-0.5 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-indigo-500/20 p-2 rounded-lg shrink-0 border border-indigo-100 dark:border-transparent">
                   <Info size={16} />
               </div>
               <div>
                   <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-400 mb-2">
                       {scoutMode === 'grid' ? 'Como usar o Radar Visual?' : 'Como usar o Motor de Texto NLP?'}
                   </h4>
                   <ul className="text-xs text-slate-700 dark:text-[#E5E5EA] space-y-2 font-medium">
                       {scoutMode === 'grid' ? (
                           <>
                               <li><strong className="text-indigo-600 dark:text-indigo-400">Passo 1:</strong> Acesse uma lista de jogos do dia (Ex: Flashscore, Sofascore).</li>
                               <li><strong className="text-indigo-600 dark:text-indigo-400">Passo 2:</strong> Tire um Print (captura de tela) que mostre os times e as odds 1x2.</li>
                               <li><strong className="text-indigo-600 dark:text-indigo-400">Passo 3:</strong> Cole a imagem aqui. A IA vai varrer a grade e encontrar os jogos de valor.</li>
                           </>
                       ) : (
                           <>
                               <li><strong className="text-indigo-600 dark:text-indigo-400">Passo 1:</strong> Vá no seu site de estatísticas (CornerPro, Sofascore, Flashscore).</li>
                               <li><strong className="text-indigo-600 dark:text-indigo-400">Passo 2 (O Segredo):</strong> Aperte "Ctrl+A" para selecionar todo o texto da página e copie.</li>
                               <li><strong className="text-indigo-600 dark:text-indigo-400">Passo 3:</strong> Cole toda a bagunça na caixa abaixo. O NLP filtrará apenas os dados úteis.</li>
                           </>
                       )}
                   </ul>
               </div>
           </motion.div>

           {/* ========================================================= */}
           {/* MODO 1: RADAR DE GRADE (MANTÉM UPLOAD DE IMAGEM INTACTO)  */}
           {/* ========================================================= */}
           {scoutMode === 'grid' && (
             <>
             <div className="mb-6 relative group overflow-hidden rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-500/30 hover:border-indigo-400 dark:hover:border-indigo-500/60 bg-slate-50 dark:bg-[#000000] transition-all p-8 min-h-[250px] flex flex-col items-center justify-center">
                 {!scoutGridImage && !isScanningScout && (
                     <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                         <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1C1C1E] flex items-center justify-center mb-4 text-slate-400 dark:text-[#8E8E93] group-hover:text-indigo-600 dark:group-hover:text-indigo-500 transition-colors shadow-sm border border-slate-200 dark:border-[#2C2C2E]">
                             <Scan size={24} />
                         </div>
                         <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 text-center">Upload da Grade de Jogos</h3>
                         <p className="text-[10px] text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest font-bold text-center mb-4 border border-slate-200 dark:border-[#2C2C2E] px-3 py-1 rounded bg-white dark:bg-[#1C1C1E]">Ctrl+V para colar imagem</p>
                         <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleScoutGridUpload} ref={scoutGridInputRef} />
                     </label>
                 )}

                 {isScanningScout && scoutGridImage && (
                     <div className="relative w-full h-48 bg-slate-900 dark:bg-black flex items-center justify-center overflow-hidden rounded-xl border border-indigo-500/30">
                         <img src={scoutGridImage} className="object-cover opacity-30 w-full h-full blur-md" />
                         <motion.div initial={{ top: '0%' }} animate={{ top: '100%' }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_30px_#6366f1] z-10" />
                         <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                            <Sparkles size={32} className="text-indigo-400 mb-2 animate-pulse" />
                            <p className="text-indigo-400 font-mono font-bold text-xs uppercase tracking-widest mt-2">Escaneando a grade visualmente...</p>
                         </div>
                     </div>
                 )}

                 {!isScanningScout && scoutGridImage && (
                     <div className="relative w-full h-40 bg-slate-900 dark:bg-black group/preview rounded-xl overflow-hidden border border-slate-300 dark:border-[#2C2C2E]">
                         <img src={scoutGridImage} className="object-cover opacity-50 w-full h-full" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                         <div className="absolute bottom-4 right-4 flex gap-2">
                             <button onClick={clearGrid} className="text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg transition-colors shadow-sm">Nova Leitura</button>
                         </div>
                     </div>
                 )}
             </div>

             {scoutGridResult && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 mt-10">
                     {scoutGridResult.filter((m:any) => m.market === 'GOLS').length > 0 && (
                     <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm">
                         <h3 className="text-xs font-bold text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-[#2C2C2E] pb-4">
                             <div className="p-1.5 bg-orange-100 dark:bg-orange-500/10 rounded-md"><Goal size={16} /></div>
                             Foco em Gols (Overs / Ambas)
                         </h3>
                         <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
                             {scoutGridResult.filter((m: any) => m.market === 'GOLS').map((match: any, index: number) => {
                                 const isSelected = selectedMatchesForBuilder.includes(match.teams);
                                 return (
                                     <div key={`gols-${index}`} onClick={() => toggleMatchSelection(match.teams)} className={`relative h-full overflow-hidden bg-white dark:bg-[#000000] rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-300 group ${isSelected ? 'border-2 border-orange-500 shadow-sm' : 'border border-slate-200 dark:border-[#3A3A3C] hover:border-slate-300 dark:hover:border-slate-500'}`}>
                                         {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>}
                                         <div className="flex-1 min-w-0 pl-1">
                                             <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="bg-slate-100 dark:bg-[#1C1C1E] text-slate-500 dark:text-[#8E8E93] border border-slate-200 dark:border-[#2C2C2E] px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 shrink-0"><Clock size={12} className="text-orange-500"/> {safeText(match.time)}</span>
                                                <span className="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border border-orange-200 dark:border-orange-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 shrink-0"><Zap size={10}/> Radar Ativo</span>
                                             </div>
                                             <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight mb-1 truncate">{safeText(match.teams)}</h4>
                                             <p className="text-xs text-slate-500 dark:text-[#8E8E93] leading-relaxed flex items-start gap-1.5"><Target size={14} className="shrink-0 mt-0.5"/> <span className="truncate">{safeText(match.reason)}</span></p>
                                         </div>
                                         <div className="shrink-0 pr-1">
                                             {isSelected ? <CheckCircle2 size={24} className="text-orange-500" /> : <Square size={24} className="text-slate-300 dark:text-[#3A3A3C] group-hover:text-slate-400 transition-colors" />}
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                     )}

                     {scoutGridResult.filter((m:any) => m.market === 'CANTOS').length > 0 && (
                     <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-6 shadow-sm">
                         <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-[#2C2C2E] pb-4 mt-2">
                             <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/10 rounded-md"><Flag size={16} /></div>
                             Foco em Escanteios (Volume / Pressão)
                         </h3>
                         <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
                             {scoutGridResult.filter((m: any) => m.market === 'CANTOS').map((match: any, index: number) => {
                                 const isSelected = selectedMatchesForBuilder.includes(match.teams);
                                 return (
                                     <div key={`cantos-${index}`} onClick={() => toggleMatchSelection(match.teams)} className={`relative h-full overflow-hidden bg-white dark:bg-[#000000] rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-300 group ${isSelected ? 'border-2 border-emerald-500 shadow-sm' : 'border border-slate-200 dark:border-[#3A3A3C] hover:border-slate-300 dark:hover:border-slate-500'}`}>
                                         {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>}
                                         <div className="flex-1 min-w-0 pl-1">
                                             <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="bg-slate-100 dark:bg-[#1C1C1E] text-slate-500 dark:text-[#8E8E93] border border-slate-200 dark:border-[#2C2C2E] px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 shrink-0"><Clock size={12} className="text-emerald-500"/> {safeText(match.time)}</span>
                                                <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 shrink-0"><Activity size={10}/> Radar Ativo</span>
                                             </div>
                                             <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight mb-1 truncate">{safeText(match.teams)}</h4>
                                             <p className="text-xs text-slate-500 dark:text-[#8E8E93] leading-relaxed flex items-start gap-1.5"><MapIcon size={14} className="shrink-0 mt-0.5"/> <span className="truncate">{safeText(match.reason)}</span></p>
                                         </div>
                                         <div className="shrink-0 pr-1">
                                             {isSelected ? <CheckCircle2 size={24} className="text-emerald-500" /> : <Square size={24} className="text-slate-300 dark:text-[#3A3A3C] group-hover:text-slate-400 transition-colors" />}
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                     )}

                     {selectedMatchesForBuilder.length > 0 && (
                         <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky bottom-6 mt-10 flex justify-center z-40">
                             <button onClick={() => setScoutMode('builder')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-xs px-8 py-4 rounded-xl shadow-lg border border-indigo-500 flex items-center gap-3 transition-transform active:scale-95 pointer-events-auto">
                                <Layers size={16} /> Ir para Construtor ({selectedMatchesForBuilder.length}) <ArrowRight size={16} />
                             </button>
                         </motion.div>
                     )}
                 </motion.div>
             )}
             </>
           )}

           {/* ========================================================= */}
           {/* MODO 2: CONSTRUTOR HFT (UX REFINADA & ANTIFRICÇÃO)       */}
           {/* ========================================================= */}
           {scoutMode === 'builder' && (
             <div className="space-y-6">
                
                {selectedMatchesForBuilder.length > 0 && (
                    <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-2xl">
                        <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Target size={14}/> 1. Jogos em Análise</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedMatchesForBuilder.map((match, i) => (
                                <span key={i} className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#000000] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#3A3A3C]">{match}</span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] p-5 rounded-2xl">
                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-4 flex items-center gap-2"><Layers size={14}/> 2. Filtro de Mercados Permitidos</h4>
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_MARKETS.map(m => {
                            const isActive = builderMarkets.includes(m);
                            return (
                                <button key={m} onClick={() => toggleMarket(m)} className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${isActive ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-[#3A3A3C] text-slate-500 dark:text-[#8E8E93] hover:border-slate-300 dark:hover:border-slate-500'}`}>
                                    {m}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-[#2C2C2E] focus-within:border-indigo-500 dark:focus-within:border-indigo-500 bg-white dark:bg-[#000000] transition-all flex flex-col">
                   <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#2C2C2E] bg-slate-50/50 dark:bg-[#1C1C1E]/50">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-[#8E8E93]">
                          <FileText size={16} className="text-indigo-500 dark:text-indigo-400"/>
                          <span className="text-[10px] font-bold uppercase tracking-widest">3. Base de Dados NLP (Cole o Texto Aqui)</span>
                      </div>
                      {scoutTextData.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                             <CheckCircle2 size={12} /> {scoutTextData.length} Lidos
                          </div>
                      )}
                   </div>

                   <div className="bg-amber-50/50 dark:bg-amber-500/10 border-b border-amber-200/50 dark:border-amber-500/20 px-4 py-2.5">
                       <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 leading-relaxed uppercase tracking-widest flex items-start sm:items-center gap-2"><AlertTriangle size={14} className="shrink-0 mt-0.5 sm:mt-0" /> <span>{dataHelperText}</span></p>
                   </div>

                   <textarea
                       value={scoutTextData}
                       onChange={(e) => setScoutTextData(e.target.value)}
                       placeholder="1. Acesse o SofaScore ou CornerPro&#10;2. Aperte Ctrl+A e copie todo o texto&#10;3. Cole aqui (Ctrl+V)&#10;4. A Inteligência Artificial fará a limpeza matemática."
                       className="w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#636366] p-6 min-h-[220px] outline-none resize-none font-mono text-xs leading-relaxed custom-scrollbar"
                       disabled={isScanningScout}
                   />

                   {isScanningScout && (
                       <div className="absolute inset-0 bg-white/90 dark:bg-[#000000]/90 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                           <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-0 left-0 h-1 bg-indigo-500 shadow-[0_0_30px_#6366f1]" />
                           <Sparkles size={32} className="text-indigo-500 dark:text-indigo-400 mb-4 animate-pulse" />
                           <p className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px] uppercase tracking-widest text-center px-4 mt-2">Filtrando ruídos e calculando covariância NLP...</p>
                       </div>
                   )}

                   <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-[#1C1C1E]/50 border-t border-slate-100 dark:border-[#2C2C2E]">
                       <button onClick={clearBuilder} className="w-full sm:w-auto text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:text-[#8E8E93] dark:hover:text-white bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                           <Eraser size={14} /> Limpar
                       </button>
                       <button onClick={processNLPEngine} disabled={isScanningScout || !scoutTextData} className="w-full sm:w-auto text-xs font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                           <Sparkles size={14}/> Extrair e Processar HFT
                       </button>
                   </div>
                </div>

                {scoutBuilderResult && scoutBuilderResult.NO_BET && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-6 shadow-sm relative mt-10 text-center">
                        <Ban size={48} className="text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2">NO BET / SEM VALOR</h3>
                        <p className="text-sm font-medium text-red-500/80 dark:text-red-400/80 max-w-lg mx-auto">{scoutBuilderResult.reason}</p>
                    </motion.div>
                )}

                {scoutBuilderResult && scoutBuilderResult.selections && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1C1C1E] border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-6 shadow-sm relative overflow-hidden mt-10">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
                        
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-[#2C2C2E] pb-4"><Target size={18} className="text-indigo-500"/> Aposta Sugerida (Game Script)</h3>
                        
                        <div className="space-y-3 mb-8 relative z-10">
                            {scoutBuilderResult.selections.map((sel: any, idx: number) => (
                                <React.Fragment key={idx}>
                                    <div className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] rounded-xl p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest mb-1">{safeText(sel.match)}</p>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> {safeText(sel.market)}</span>
                                        </div>
                                        <div className="flex items-center gap-3 self-start sm:self-auto">
                                            <span className="text-[9px] font-bold text-slate-400 dark:text-[#636366] border border-slate-200 dark:border-[#3A3A3C] px-2 py-1 rounded bg-white dark:bg-[#1C1C1E] uppercase tracking-widest">Via NLP</span>
                                            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-1 rounded-md">{safeText(sel.prob)}% Prob.</span>
                                        </div>
                                    </div>
                                    {idx < scoutBuilderResult.selections.length - 1 && (
                                        <div className="flex justify-center -my-2 relative z-20"><Plus size={14} className="text-slate-400 dark:text-[#636366] bg-white dark:bg-[#1C1C1E] rounded-full p-0.5 border border-slate-200 dark:border-[#2C2C2E]" /></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        <div className={`border p-6 rounded-2xl mb-8 relative z-10 transition-colors duration-500 ${
                            evStatus === 'negative' 
                              ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' 
                              : 'bg-slate-50 dark:bg-[#000000] border-slate-200 dark:border-[#2C2C2E]'
                        }`}>
                            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-5 flex items-center gap-2 ${
                                evStatus === 'negative' ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-[#8E8E93]'
                            }`}>
                                <Calculator size={14} /> Comparador vs Mercado (Valor Esperado)
                            </h4>
                            
                            {evStatus === 'negative' && (
                                <div className="mb-6 flex items-start gap-3 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 p-3 rounded-xl border border-red-200 dark:border-red-500/30">
                                   <AlertTriangle size={16} className="shrink-0 mt-0.5"/>
                                   <p className="text-[10px] sm:text-xs font-medium leading-relaxed">ALERTA MATEMÁTICO: A odd oferecida pela casa é menor que a probabilidade real de bater. Fazer esta aposta destrói o seu capital a longo prazo (EV Negativo).</p>
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="w-full md:w-1/3">
                                    <p className={`text-[10px] uppercase tracking-widest font-bold mb-2 ml-1 ${evStatus === 'negative' ? 'text-red-600/80 dark:text-red-400' : 'text-slate-500 dark:text-[#8E8E93]'}`}>Odd Oferecida (Casa)</p>
                                    <div className="relative">
                                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold ${evStatus === 'negative' ? 'text-red-400' : 'text-slate-400'}`}>@</span>
                                        <input
                                            type="text"
                                            placeholder="Ex: 1.85"
                                            value={userOdd}
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/[^0-9.]/g, '');
                                                if ((val.match(/\./g) || []).length > 1) val = val.replace(/\.(?=[^.]*$)/, '');
                                                setUserOdd(val);
                                            }}
                                            className={`w-full text-left font-mono text-sm py-2.5 pl-8 pr-3 rounded-lg outline-none transition-colors ${
                                                evStatus === 'negative' 
                                                  ? 'bg-white dark:bg-[#1C1C1E] border border-red-400 dark:border-red-50 text-red-600 dark:text-red-400 placeholder:text-red-300 dark:placeholder:text-red-500/50'
                                                  : 'bg-white dark:bg-[#1C1C1E] border border-slate-300 dark:border-[#3A3A3C] focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#636366]'
                                            }`}
                                        />
                                    </div>
                                </div>

                                <div className={`hidden md:block w-px h-10 ${evStatus === 'negative' ? 'bg-red-200 dark:bg-red-500/30' : 'bg-slate-200 dark:bg-[#2C2C2E]'}`}></div>

                                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-xl p-3 text-center flex flex-col justify-center">
                                        <p className="text-[8px] uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] font-bold mb-1">Espectro Real</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                                            {safeText(scoutBuilderResult.minProb)}% <span className="text-slate-400 font-sans mx-0.5">a</span> {safeText(scoutBuilderResult.maxProb)}%
                                        </p>
                                    </div>
                                    <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 text-center flex flex-col justify-center">
                                        <p className="text-[8px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold mb-1">Odd Justa</p>
                                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">@{safeText(scoutBuilderResult.fairOdd)}</p>
                                    </div>
                                    
                                    <div className={`border rounded-xl p-3 text-center flex flex-col justify-center transition-colors ${
                                        evStatus === null ? 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-[#2C2C2E] text-slate-400 dark:text-[#636366]' :
                                        evStatus === 'positive' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400' :
                                        evStatus === 'negative' ? 'bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-400' :
                                        'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400'
                                    }`}>
                                        <p className={`text-[8px] uppercase tracking-widest font-bold mb-1 flex items-center justify-center gap-1 ${evStatus === 'negative' ? 'text-red-600 dark:text-red-400' : ''}`}>
                                            {evStatus === null ? <Minus size={10}/> : evStatus === 'positive' ? <TrendingUp size={10}/> : evStatus === 'negative' ? <TrendingDown size={10}/> : <Minus size={10}/>}
                                            Análise EV
                                        </p>
                                        <p className="text-sm font-bold font-mono">
                                            {evStatus === null ? '--' : (
                                                <>
                                                    {dynamicEVMin && dynamicEVMin > 0 ? '+' : ''}{dynamicEVMin?.toFixed(1)}% <span className="opacity-50 font-sans mx-0.5">a</span> {dynamicEVMax && dynamicEVMax > 0 ? '+' : ''}{dynamicEVMax?.toFixed(1)}%
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 relative z-10">
                            <div className={`border rounded-xl p-4 text-center flex flex-col justify-center ${
                                scoutBuilderResult.riskLevel === 'ALTO' ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400' :
                                scoutBuilderResult.riskLevel === 'MÉDIO' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400' :
                                'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            }`}>
                                <p className="text-[8px] uppercase tracking-widest font-bold mb-1 opacity-80">Risco Estrutural</p>
                                <p className="text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                                    <ShieldAlert size={14} /> {safeText(scoutBuilderResult.riskLevel)}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] p-4 rounded-xl col-span-2 flex flex-col justify-center">
                                <p className="text-[8px] uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] font-bold mb-1.5 flex items-center gap-1.5"><ArrowRightLeft size={12}/> Alternativa Tática</p>
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{safeText(scoutBuilderResult.alternativeCombination)}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-[#000000] border border-slate-200 dark:border-[#2C2C2E] p-5 rounded-2xl relative z-10">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] font-bold mb-3 flex items-center gap-1.5"><Activity size={12}/> Relatório do Motor</p>
                            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed border-l-2 border-indigo-500/30 pl-3 whitespace-pre-wrap font-medium">
                                {safeText(scoutBuilderResult.analysis)}
                            </div>
                        </div>
                    </motion.div>
                )}
             </div>
           )}

        </div>
        )}
    </div>
  );
};

const Minus = ({ size }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default ScoutIA;
