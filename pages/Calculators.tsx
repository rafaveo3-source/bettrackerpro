import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Info, ChevronDown, Sparkles, Trash2, Plus, Scale, Percent, ArrowRightLeft, 
  Target, TrendingUp, AlertTriangle, Lock, Crown, Radar, CheckSquare, 
  Square, Activity, Crosshair, BarChart4, Zap, DollarSign, Goal, Lightbulb,
  Clock, Flag, ShieldAlert, Swords, Power, Scan, Image as ImageIcon, CheckCircle2,
  Flame, Thermometer, RectangleHorizontal
} from 'lucide-react';
import { useBetStore } from '../store/useBetStore';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// UX INPUT COMPONENTS
// ==========================================
const PodInput = ({ label, value, onChange, icon: Icon, placeholder, colorClass, highlight, type = 'number' }: any) => (
  <div className="relative group">
      <label className={`text-[9px] font-black uppercase tracking-widest block mb-1.5 transition-colors ${highlight ? colorClass : 'text-slate-500'}`}>
         {label}
      </label>
      <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Icon size={14} className={highlight ? colorClass : 'text-slate-400 group-hover:text-slate-300 transition-colors'} />
          </div>
          <input 
              type={type} value={value} onChange={onChange} placeholder={placeholder}
              className={`w-full bg-slate-950 border rounded-xl pl-10 pr-3 py-3 font-mono font-bold text-sm outline-none transition-all
              ${highlight ? `border-${colorClass.split('-')[1]}-500/50 focus:border-${colorClass.split('-')[1]}-400 text-${colorClass.split('-')[1]}-400 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]` : 'border-slate-800 text-white focus:border-slate-600 focus:bg-[#09090b]'}`}
          />
      </div>
  </div>
);

// 🔥 NOVO COMPONENTE: SELECT DO CONTEXTO TÁTICO
const PodSelect = ({ label, value, onChange, icon: Icon, options, colorClass }: any) => (
  <div className="relative group">
      <label className={`text-[9px] font-black uppercase tracking-widest block mb-1.5 transition-colors text-slate-500`}>{label}</label>
      <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Icon size={14} className="text-slate-400 group-hover:text-slate-300 transition-colors" />
          </div>
          <select value={value} onChange={onChange} className={`w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-3 py-3 font-mono font-bold text-[11px] sm:text-xs outline-none focus:border-slate-600 focus:bg-[#09090b] appearance-none cursor-pointer`}>
              {options.map((opt:any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
      </div>
  </div>
);

const MapIcon = ({ size, className }: any) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
    <line x1="9" y1="3" x2="9" y2="21"></line>
    <line x1="15" y1="3" x2="15" y2="21"></line>
  </svg>
);

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

// ==========================================
// FUNÇÕES MATEMÁTICAS DO MOTOR HFT
// ==========================================

// Fatorial otimizado (evita recursão pesada)
const factorial = (n: number): number => {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};

// Distribuição de Poisson exata
const poissonExact = (k: number, lambda: number): number => {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

const Calculators: React.FC = () => {
  const { 
    currentBankrollBalance, 
    isPro, 
    aiScansUsedToday, 
    canUseAiScan, 
    incrementAiScan, 
    setToast 
  } = useBetStore();
  
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'dutching' | 'kelly' | 'value' | 'arb' | 'stake' | 'odds' | 'breakeven' | 'exc' | 'exg'
  >('dutching');

  // ==========================================
  // ESTADOS COMPARTILHADOS (ExC e ExG) - SEPARADOS
  // ==========================================
  const [liveMin, setLiveMin] = useState('');
  const [liveCorners, setLiveCorners] = useState(''); 
  const [liveGoals, setLiveGoals] = useState('');     
  const [liveAP_Def, setLiveAP_Def] = useState(''); 
  const [liveAP_Press, setLiveAP_Press] = useState(''); 
  const [liveSoT, setLiveSoT] = useState(''); 
  const [liveSoffT, setLiveSoffT] = useState(''); 
  const [liveCurrentOdd, setLiveCurrentOdd] = useState('');
  const [liveAP_5m, setLiveAP_5m] = useState(''); 

  // 🔥 ESTADOS DO MOTOR CONTEXTUAL (TDF & EDM)
  const [recentShots, setRecentShots] = useState('');
  const [recentCorners, setRecentCorners] = useState('');
  const [pressureTrend, setPressureTrend] = useState('stable'); 
  const [matchTemp, setMatchTemp] = useState('calm'); 
  const [redCard, setRedCard] = useState('none'); 
  const [needsGoal, setNeedsGoal] = useState('false'); 
  const [recentGoal, setRecentGoal] = useState('false'); 

  // ==========================================
  // LÓGICA DO SCANNER VISION IA (HUD)
  // ==========================================
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (activeTab !== 'exc' && activeTab !== 'exg') return;
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
             processVisionAI(blob);
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [activeTab]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (!VALID_IMAGE_TYPES.includes(file.type)) {
            setToast({ type: 'error', message: '⚠️ Formato inválido! Use apenas PNG, JPG ou WEBP.' });
            return;
        }
        processVisionAI(file);
    }
  };

  const processVisionAI = async (file: File) => {
    if (!isPro) {
        setToast({ type: 'error', message: 'Recurso exclusivo para Membros PRO.' });
        return;
    }
    
    if (typeof canUseAiScan === 'function' && !canUseAiScan()) {
        setToast({ type: 'error', message: 'Limite diário de 10 scans atingido.' });
        return;
    }

    const imageUrl = URL.createObjectURL(file);
    setScannedImage(imageUrl);
    setIsScanning(true);

    try {
        const base64Data = await fileToBase64(file);
        const mimeType = file.type || 'image/png'; 
        
        const response = await fetch('/api/vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
  image: base64Data,
  mimeType,
  mode: activeTab, // 🔥 exc ou exg
  scenario: activeTab === 'exc' ? excScenario : exgScenario
})
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            setToast({ type: 'error', message: errorData.error || 'Falha na conexão com a IA.' });
            setIsScanning(false);
            return;
        }
        
        const data = await response.json();

// 🛡️ BLINDAGEM EXTRA (ANTI-ERRO BACKEND)
if (!data.redCard) data.redCard = "none";
if (!data.pressureTrend) data.pressureTrend = "stable";
if (!data.matchTemperature) data.matchTemperature = "calm";
        
        if (data) {
           const cleanVal = (val: any) => (val !== null && val !== undefined && val !== "" && String(val).toLowerCase() !== "null") ? String(val) : "";

           const extMin = cleanVal(data.min);
           const extTarget = cleanVal(data.target);
           const extApDef = cleanVal(data.apDef);
           const extApPress = cleanVal(data.apPress);
           const extSoT = cleanVal(data.sot);
           const extSoffT = cleanVal(data.sofft);

           setLiveMin(extMin);
           if (activeTab === 'exg') setLiveGoals(extTarget); else setLiveCorners(extTarget);
           setLiveAP_Def(extApDef);
           setLiveAP_Press(extApPress);
           setLiveSoT(extSoT);
           setLiveSoffT(extSoffT);

           // 🔥 Extrações Semânticas HFT (Com Blindagem Front-End)
if (data.recentShots !== undefined) {
  setRecentShots(cleanVal(data.recentShots));
}

if (data.recentCorners !== undefined) {
  setRecentCorners(cleanVal(data.recentCorners));
}

// Enums seguros (já validados no backend, mas protegemos aqui também)
setPressureTrend(
  ["increasing", "stable", "decreasing"].includes(data.pressureTrend)
    ? data.pressureTrend
    : "stable"
);

setMatchTemp(
  ["intense", "calm"].includes(data.matchTemperature)
    ? data.matchTemperature
    : "calm"
);

setRedCard(
  ["none", "pressing", "defending"].includes(data.redCard)
    ? data.redCard
    : "none"
);

if (data.needsGoal !== undefined) {
  setNeedsGoal(String(data.needsGoal));
}

if (data.recentGoal !== undefined) {
  setRecentGoal(String(data.recentGoal));
}
           
           if (typeof incrementAiScan === 'function') incrementAiScan();

           if (!extMin || !extTarget || !extApDef || !extApPress || !extSoT || !extSoffT) {
               setToast({ type: 'error', message: '⚠️ Dados parciais extraídos. Preencha os vazios manualmente.' });
           } else {
               setToast({ type: 'success', message: 'Contexto Mapeado com precisão cirúrgica!' });
           }
        }
        setIsScanning(false);
    } catch (error) {
        console.error("Erro na leitura:", error);
        setToast({ type: 'error', message: 'Erro ao processar imagem. Preencha manualmente.' });
        setIsScanning(false);
    }
  };

  const resetScanner = () => {
      setScannedImage(null);
      setLiveMin(''); setLiveCorners(''); setLiveGoals(''); 
      setLiveAP_Def(''); setLiveAP_Press(''); setLiveSoT(''); setLiveSoffT('');
      setRecentShots(''); setRecentCorners(''); setPressureTrend('stable');
      setMatchTemp('calm'); setRedCard('none'); setNeedsGoal('false'); setRecentGoal('false');
  };

  // ==========================================
  // MOTOR QUÂNTICO (HFT CONFIDENCE ENGINE)
  // ==========================================
  const [excScenario, setExcScenario] = useState('ht_asian');
  const [exgScenario, setExgScenario] = useState('ft_over05');

  const excScenariosData: Record<string, { title: string; checks: string[] }> = {
    ht_asian: { title: 'Canto Asiático HT (Margem Segura)', checks: ['Relógio entre 25 e 36 minutos?', 'Favorito pressionando ativamente?', 'Assimetria visível no radar?'] },
    ht_limit: { title: 'Canto Limite HT (Abafa Retranca)', checks: ['Relógio entre 37 e 41 minutos?', 'Ataques rápidos e finalizações ocorrendo?', 'Adversário empurrado para a própria área?'] },
    ht_zoio: { title: 'Canto Zóio HT (Kamikaze 42\'+)', checks: ['Relógio passando dos 42 minutos?', 'Favorito perdendo/empatando no sufoco?', 'Bolas sendo jogadas direto na área?'] },
    ft_asian: { title: 'Canto Asiático FT (Volta do Intervalo)', checks: ['Relógio entre 65 e 78 minutos?', 'Time dominou a posse no 2º tempo?', 'Zagueiros rebatendo muitas bolas?'] },
    ft_limit: { title: 'Canto Limite FT (Desespero Final)', checks: ['Relógio entre 82 e 87 minutos?', 'Modo desespero (Abafa Absoluto)?', 'Adversário não consegue segurar a bola?'] },
    ft_zoio: { title: 'Canto Zóio FT (Kamikaze 88\'+)', checks: ['Relógio passando dos 88 minutos?', 'Goleiro indo pro ataque?', 'Defesa cortando bola pra qualquer lado?'] }
  };

  const exgScenariosData: Record<string, { title: string; checks: string[] }> = {
    ht_over05: { title: 'Over 0.5 Gols HT', checks: ['Relógio antes dos 30 minutos?', 'Jogo aberto ou favorito amassando?', 'Goleiros já fizeram defesas difíceis?'] },
    ht_over15: { title: 'Over 1.5 Gols HT (Insanidade)', checks: ['Relógio antes dos 20 minutos?', 'Pelo menos 1 gol já saiu rápido?', 'Ambos os times com linhas altas?'] },
    ft_over05: { title: 'Over 0.5 Gols FT (Reta Final)', checks: ['Relógio entre 70 e 80 minutos?', 'Alguém precisa da vitória desesperadamente?', 'Espaços para contra-ataque?'] },
    ft_over15: { title: 'Over 1.5 Gols FT', checks: ['Segundo tempo recém iniciado?', 'Time perdendo se lançou pro ataque?', 'Alto índice de chutes dentro da área?'] },
    ft_over25: { title: 'Over 2.5 Gols FT', checks: ['Relógio entre 50 e 65 minutos?', 'Os dois times demonstram capacidade ofensiva?', 'Jogo muito faltoso perto da área?'] }
  };

  const [excChecklist, setExcChecklist] = useState<Record<number, boolean>>({});
  const [excUnlocked, setExcUnlocked] = useState(false);
  useEffect(() => { setExcChecklist({}); setExcUnlocked(false); }, [excScenario]);
  const handleExcCheck = (idx: number) => {
    const n = { ...excChecklist, [idx] : !excChecklist[idx] }; setExcChecklist(n);
    setExcUnlocked(Object.keys(n).filter(k => n[parseInt(k)]).length === excScenariosData[excScenario].checks.length);
  };

  const [exgChecklist, setExgChecklist] = useState<Record<number, boolean>>({});
  const [exgUnlocked, setExgUnlocked] = useState(false);
  useEffect(() => { setExgChecklist({}); setExgUnlocked(false); }, [exgScenario]);
  const handleExgCheck = (idx: number) => {
  const n = { ...exgChecklist, [idx]: !exgChecklist[idx] };
  setExgChecklist(n);

  setExgUnlocked(
    Object.keys(n).filter(k => n[parseInt(k)]).length ===
    exgScenariosData[exgScenario].checks.length
  );
};

  const runQuantEngine = (type: 'exc' | 'exg', scenario: string) => {
      const min = parseFloat(liveMin); 
      const apDef = parseFloat(liveAP_Def) || 0; 
      const apPress = parseFloat(liveAP_Press) || 0;
      const sot = parseFloat(liveSoT) || 0; 
      const sofft = parseFloat(liveSoffT) || 0;
      const rShots = parseFloat(recentShots) || ((sot+sofft)/min * 10) || 0;
      const ap5m = parseFloat(liveAP_5m) || 0; 
      const rCorners = parseFloat(recentCorners) || 0;
      const odd = parseFloat(liveCurrentOdd) || 0;

      if (!min || min <= 0) return null;

      const isHT = scenario.includes('ht');
      const remainingTime = Math.max(1, ((isHT ? 45 : 90) + (isHT ? 3 : 6)) - min);
      
      const totalAP = apPress + apDef; 
      const fieldTilt = totalAP > 0 ? (apPress / totalAP) * 100 : 0;
      const appm = apPress / min;

      // 1. TEMPORAL DECAY FACTOR (TDF)
      let wOld = 0.55; let wRecent = 0.45;
      if (pressureTrend === 'increasing') { wOld = 0.35; wRecent = 0.65; }
      else if (pressureTrend === 'decreasing') { wOld = 0.75; wRecent = 0.25; }

      let baseLambda = 0;
      if (type === 'exc') {
          const rateOld = ((apPress * 0.06) + (sot * 0.35) + (sofft * 0.15)) / min;
          const rateRecent = ((rCorners * 0.6) + (rShots * 0.2) + (ap5m * 0.02)) / 10;
          baseLambda = ((rateOld * wOld) + (rateRecent * wRecent)) * remainingTime;
      } else {
          const xgOld = ((sot * 0.14) + (sofft * 0.04) + (apPress * 0.005)) / min;
          const xgRecent = ((rShots * 0.14) + (ap5m * 0.01)) / 10;
          baseLambda = ((xgOld * wOld) + (xgRecent * wRecent)) * remainingTime;
          if (apDef > (apPress * 0.5)) baseLambda *= 1.2; // Fator de Jogo Aberto
      }

      // 2. EVENT DISRUPTION MULTIPLIER (EDM)
      if (redCard === 'pressing') baseLambda *= 0.72;
      if (redCard === 'defending') baseLambda *= 1.28;
      if (recentGoal === 'true') baseLambda *= 0.82;
      if (needsGoal === 'true') baseLambda *= 1.12;
      if (scenario.includes('zoio')) baseLambda *= 1.35;

      // 3. TRÊS CENÁRIOS DE PROJEÇÃO
      const lamCons = baseLambda * 0.82;
      const lamNeut = baseLambda;
      const lamAggr = baseLambda * 1.22;

      const calcProbs = (lam: number) => {
          const p0 = poissonExact(0, lam); const p1 = poissonExact(1, lam); const p2 = poissonExact(2, lam);
          return { p1: (1 - p0) * 100, p2: (1 - (p0 + p1)) * 100, p3: (1 - (p0 + p1 + p2)) * 100 };
      };

      const probCons = calcProbs(lamCons);
      const probNeut = calcProbs(lamNeut);
      const probAggr = calcProbs(lamAggr);

      // Determina Alvo Principal baseado na Linha
      let mainProb = probNeut.p1;
      let targetKey = 'p1';
      if (scenario.includes('asian') || scenario.includes('15')) { mainProb = probNeut.p2; targetKey = 'p2'; }
      if (scenario.includes('25')) { mainProb = probNeut.p3; targetKey = 'p3'; }

      const ev = odd > 0 ? ((mainProb / 100) * odd - 1) * 100 : 0;
      const fairOdd = mainProb > 0 ? 100 / mainProb : 0;

      // 4. CONFIDENCE SCORE (0-100)
      let mathScore = odd > 0 ? Math.min(40, ev * 2.5) : Math.min(40, Math.max(0, (mainProb - 50) * 1.5));
      if (mathScore < 0) mathScore = 0;

      let momentumScore = 0;
      if (pressureTrend === 'increasing') momentumScore += 10;
      if (rShots >= 3) momentumScore += 8;
      if (rCorners >= 2 || appm > 1.2) momentumScore += 7;
      momentumScore = Math.min(25, momentumScore);

      let contextScore = 0;
      if (needsGoal === 'true') contextScore += 8;
      if (matchTemp === 'intense') contextScore += 6;
      if (fieldTilt > 70) contextScore += 6;
      contextScore = Math.min(20, contextScore);

      let stabilityScore = 15;
      if (redCard === 'pressing') stabilityScore -= 10;
      if (recentGoal === 'true') stabilityScore -= 5;
      
      let finalScore = Math.min(100, Math.max(0, mathScore + momentumScore + contextScore + stabilityScore));

      // 5. MOTIVOS (CONFLUÊNCIA)
      let reasons = [];
      if (fieldTilt >= 70) reasons.push(`Domínio territorial esmagador (${fieldTilt.toFixed(0)}%)`);
      if (pressureTrend === 'increasing') reasons.push('Time acelerou nos últimos 10 min (TDF Ativo)');
      if (rShots >= 2) reasons.push('Alta geração de finalizações recentes');
      if (redCard === 'defending') reasons.push('Vantagem numérica (Adversário com vermelho)');
      if (ev > 10) reasons.push(`Odd Desajustada (+${ev.toFixed(1)}% EV)`);
      if (needsGoal === 'true' && min > 75) reasons.push('Fator Desespero ativado (Reta final)');

      let label = '🔴 Evitar Entrada'; let color = 'red';
      if (finalScore >= 80) { label = '🔒 ALTA CONFLUÊNCIA'; color = 'green'; }
      else if (finalScore >= 65) { label = '🟢 FORTE'; color = 'green'; }
      else if (finalScore >= 50) { label = '🟡 MODERADA'; color = 'yellow'; }
      else if (finalScore >= 35) { label = '⚠️ FRÁGIL'; color = 'yellow'; }

      let crossCheckMsg = '';
      if (type === 'exc') {
          if (sot >= 4 && (sot / apPress) > 0.1) crossCheckMsg = '💡 Perfil Letal: Muitos chutes ao gol. Considere ir para aba de GOLS.';
          else if (appm > 1.2 && sot <= 1) crossCheckMsg = '✅ Perfil Perfeito: Muito volume e pouca precisão. Cenário clássico de Cantos.';
      } else {
          if (apPress > 40 && sot === 0) crossCheckMsg = '⚠️ ALERTA: Volume alto sem chutes. Aba de CANTOS é mais segura aqui.';
          else if (sot >= 4) crossCheckMsg = '🎯 Radar Confirmado: Excelente taxa de chutes no alvo. Cenário ideal.';
      }

      let paceMsg = "Padrão";
      if (momentumScore >= 15) paceMsg = "Avalanche Absoluta";
      else if (momentumScore >= 8) paceMsg = "Ritmo Acelerado";
      else if (pressureTrend === 'decreasing') paceMsg = "Esfriando";

      return { 
   appm,
   fieldTilt,
   probCons,
   probNeut,
   probAggr,
   mainProb,
   targetKey,
   ev,
   fairOdd,
   finalScore,
   label,
   color,
   reasons,
   crossCheckMsg,
   paceMsg,
   baseLambda,
   momentumScore // 🔥 ADICIONADO
};
  };

  const engineRes = activeTab === 'exc' ? runQuantEngine('exc', excScenario) : runQuantEngine('exg', exgScenario);

  const ProLockScreen = () => (
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 dark:from-purple-500/10 dark:to-blue-500/10 opacity-50" />
          <div className="bg-white dark:bg-slate-800 p-4 rounded-full mb-4 relative z-10 shadow-sm">
              <Crown size={32} className="text-amber-500 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2 relative z-10">
              Ferramenta Profissional
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm relative z-10">
              Esta calculadora matemática avançada é exclusiva para membros PRO. Desbloqueie todo o potencial da sua gestão.
          </p>
          <button onClick={() => navigate('/pro')} className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 font-black py-3 px-8 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 relative z-10">
              Quero ser PRO
          </button>
      </div>
  );

  const [dutchTotalStake, setDutchTotalStake] = useState('100');
  const [dutchSelections, setDutchSelections] = useState([{ id: 1, name: 'Seleção A', odds: '2.50', stake: 0, profit: 0 }, { id: 2, name: 'Seleção B', odds: '3.20', stake: 0, profit: 0 }]);
  const addDutchSelection = () => setDutchSelections([...dutchSelections, { id: Date.now(), name: `Seleção ${String.fromCharCode(65 + dutchSelections.length)}`, odds: '', stake: 0, profit: 0 }]);
  const removeDutchSelection = (id: number) => setDutchSelections(dutchSelections.filter(s => s.id !== id));
  const calculateDutching = () => {
    const totalStake = parseFloat(dutchTotalStake); if (!totalStake || totalStake <= 0) return;
    const impliedProbs = dutchSelections.map(s => parseFloat(s.odds) > 1 ? 1 / parseFloat(s.odds) : 0);
    const totalImplied = impliedProbs.reduce((a, b) => a + b, 0); if (totalImplied <= 0) return;
    setDutchSelections(dutchSelections.map((s, i) => {
      const stake = totalStake * (impliedProbs[i] / totalImplied); const odd = parseFloat(s.odds || '0');
      return { ...s, stake: stake || 0, profit: odd > 1 ? (stake * odd) - totalStake : 0 };
    }));
  };

  const [kellyOdds, setKellyOdds] = useState('2.00'); const [kellyProb, setKellyProb] = useState('55'); const [kellyFraction, setKellyFraction] = useState('1'); 
  const kellyResult = (() => { const b = parseFloat(kellyOdds) - 1; const p = parseFloat(kellyProb) / 100; if (b <= 0) return "0.00"; return (((b * p - (1 - p)) / b) * parseFloat(kellyFraction) * 100).toFixed(2); })();
  const kellyMoney = (parseFloat(kellyResult) / 100) * currentBankrollBalance;

  const [valOdds, setValOdds] = useState('2.10'); const [valProb, setValProb] = useState('50'); 
  const valEV = (parseFloat(valProb) / 100 * parseFloat(valOdds)) - 1; const valEVPercent = valEV * 100;

  const [arbOdds1, setArbOdds1] = useState('2.05'); const [arbOdds2, setArbOdds2] = useState('2.05'); const [arbTotalStake, setArbTotalStake] = useState('1000');
  const arbImplied = (1 / parseFloat(arbOdds1)) + (1 / parseFloat(arbOdds2)); const arbRoi = ((1 / arbImplied) - 1) * 100;
  const arbStake1 = (parseFloat(arbTotalStake) * (1 / parseFloat(arbOdds1))) / arbImplied; const arbStake2 = (parseFloat(arbTotalStake) * (1 / parseFloat(arbOdds2))) / arbImplied;
  const arbProfit = (arbStake1 * parseFloat(arbOdds1)) - parseFloat(arbTotalStake);

  const [stakePercent, setStakePercent] = useState('1'); const stakeValue = (parseFloat(stakePercent) / 100) * currentBankrollBalance;
  const [convDec, setConvDec] = useState('2.00'); const [convAm, setConvAm] = useState('+100'); const [convProb, setConvProb] = useState('50.00');
  const handleDecChange = (val: string) => { setConvDec(val); const d = parseFloat(val); if (d > 1) { setConvProb(((1 / d) * 100).toFixed(2)); setConvAm(d >= 2 ? '+' + ((d - 1) * 100).toFixed(0) : (( -100 / (d - 1) )).toFixed(0)); } };
  const [beOdds, setBeOdds] = useState('1.90'); const beWinRate = parseFloat(beOdds) > 1 ? (1 / parseFloat(beOdds)) * 100 : 0;

  // 🔥 RESTAURAÇÃO DO SIDEBARINFO
  const sidebarInfo = (() => {
    switch(activeTab) {
      case 'dutching': return { title: 'Gestão de Risco', text: 'O Dutching divide a sua exposição entre múltiplas seleções, diluindo o risco do investimento em um único evento.' };
      case 'kelly': return { title: 'Cálculo de Exposição', text: 'O Critério de Kelly ajusta matematicamente a stake ideal com base na probabilidade e na odd apresentada.' };
      case 'value': return { title: 'Análise de EV+', text: 'O conceito de Value Bet compara a cotação oferecida pelo mercado com a probabilidade real.' };
      case 'arb': return { title: 'Arbitragem Matemática', text: 'Calcula o volume exato a ser distribuído em duas vias para anular o risco direcional.' };
      case 'stake': return { title: 'Gestão Fixa', text: 'O cálculo de stake fixa percentual ajuda a manter o controle do drawdown em fases de oscilação.' };
      case 'odds': return { title: 'Leitura Global', text: 'Conversão automática de formatos de cotações utilizados em bolsas esportivas.' };
      case 'breakeven': return { title: 'Ponto de Equilíbrio', text: 'A taxa de acerto (Hit-Rate) necessária para manter a estabilidade do capital com a odd informada.' };
      case 'exc': return { title: 'ExC Analytics (Cantos)', text: 'Motor HFT que cruza Domínio (Field Tilt), Momentum e Poisson para achar EV+ em escanteios. Suporta leitura via IA.' };
      case 'exg': return { title: 'ExG Analytics (Gols)', text: 'Calcula a letalidade do time (SoT) e a abertura tática para precificar a Odd Justa de Gols em tempo real.' };
      default: return { title: 'Ferramentas Analíticas', text: 'Tome decisões baseadas em dados.' };
    }
  })();

  const tabs = [
    { id: 'dutching', label: 'Dutching', pro: false }, { id: 'kelly', label: 'Kelly', pro: false },
    { id: 'value', label: 'Value Bet', pro: true }, { id: 'arb', label: 'Arbitragem', pro: true },
    { id: 'stake', label: 'Stake %', pro: false }, { id: 'odds', label: 'Odds Conv.', pro: false },
    { id: 'breakeven', label: 'Break Even', pro: true }, { id: 'exc', label: 'ExC (Cantos)', pro: true },
    { id: 'exg', label: 'ExG (Gols)', pro: true },
  ];

  return (
    <div className="space-y-6 pb-20 w-full overflow-x-hidden">
        {/* HEADER */}
        <div className="flex flex-col gap-2 px-4 md:px-0">
          <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
            Strategic Math Engine
          </div>
          <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Calculadoras Pro <span className="text-slate-400 dark:text-slate-700 text-lg">///</span>
          </h1>
        </div>
      </div>
      
      {/* TABS GRID */}
      <div className="flex flex-wrap md:grid md:grid-cols-4 xl:grid-cols-9 gap-2 mb-6 px-4 md:px-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative flex-1 min-w-[100px] flex items-center justify-center px-2 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all gap-1 ${
              activeTab === tab.id
                ? (tab.id === 'exg' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20')
                : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-500 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            {tab.pro && !isPro && <Lock size={10} className="mb-0.5" />}
            {tab.label}
            {activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-white/40 animate-pulse rounded-b-xl" />}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
        <div className="lg:col-span-2 space-y-6 min-w-0 w-full">
            
            {/* CALCULADORAS SIMPLES */}
            {activeTab === 'dutching' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm w-full overflow-hidden">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-4">Calculadora Dutching</h2>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 w-full mb-6">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest pl-1">Total Stake</span>
                        <input type="number" value={dutchTotalStake} onChange={(e) => setDutchTotalStake(e.target.value)} className="bg-transparent text-right w-full font-mono font-bold outline-none text-slate-900 dark:text-white text-lg" />
                    </div>
                    <div className="space-y-3">
                        {dutchSelections.map((sel, idx) => (
                            <div key={sel.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-1 text-xs font-bold text-slate-400">{String.fromCharCode(65 + idx)}</div>
                                <div className="col-span-5"><input type="text" value={sel.name} onChange={e => { const n = [...dutchSelections]; n[idx].name = e.target.value; setDutchSelections(n); }} className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200" /></div>
                                <div className="col-span-3"><input type="number" value={sel.odds} onChange={e => { const n = [...dutchSelections]; n[idx].odds = e.target.value; setDutchSelections(n); }} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm font-mono text-center text-slate-900 dark:text-white" placeholder="Odds" /></div>
                                <div className="col-span-3 text-right">
                                    <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">R$ {sel.stake.toFixed(2)}</p>
                                    <button onClick={() => removeDutchSelection(sel.id)} className="text-[9px] text-red-500 dark:text-red-400 hover:underline">Remover</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex gap-3">
                        <button onClick={addDutchSelection} className="flex-1 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-bold uppercase transition-colors"><Plus size={14} className="inline mr-1"/> Add Seleção</button>
                        <button onClick={calculateDutching} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase shadow-lg shadow-emerald-600/20 transition-all active:scale-95">Calcular</button>
                    </div>
                </div>
            )}

            {activeTab === 'kelly' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm w-full overflow-hidden">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-6">Critério de Kelly</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Banca</label>
                             <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-transparent">R$ {currentBankrollBalance.toFixed(2)}</div>
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Fração</label>
                             <select value={kellyFraction} onChange={e => setKellyFraction(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-transparent text-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none">
                                <option value="1">100%</option>
                                <option value="0.5">50%</option>
                                <option value="0.25">25%</option>
                               </select>
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Odds</label>
                             <input type="number" value={kellyOdds} onChange={e => setKellyOdds(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-bold outline-none border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Probabilidade %</label>
                             <input type="number" value={kellyProb} onChange={e => setKellyProb(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-bold outline-none border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
                        </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl text-center border border-purple-200 dark:border-purple-500/20">
                        <p className="text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-1">Stake Recomendada</p>
                        <h3 className="text-4xl font-black text-purple-600 dark:text-purple-400">{parseFloat(kellyResult) > 0 ? kellyResult : '0.00'}%</h3>
                        <p className="text-sm font-mono text-purple-800 dark:text-purple-300 mt-2 bg-purple-200 dark:bg-purple-500/20 inline-block px-3 py-1 rounded font-bold">R$ {parseFloat(kellyResult) > 0 ? kellyMoney.toFixed(2) : '0.00'}</p>
                    </div>
                </div>
            )}

            {activeTab === 'value' && (
                !isPro ? <ProLockScreen /> : (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                   <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-6 flex items-center gap-2"><Target size={20} className="text-emerald-500"/> Value Bet Finder</h2>
                   <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Sua Odds</label>
                          <input type="number" value={valOdds} onChange={e => setValOdds(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-bold outline-none border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Probabilidade Real %</label>
                          <input type="number" value={valProb} onChange={e => setValProb(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-bold outline-none border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" />
                      </div>
                   </div>
                   <div className={`p-6 rounded-2xl border text-center ${valEV > 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/20'}`}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70 text-slate-700 dark:text-slate-300">Valor Esperado (EV)</p>
                      <h3 className={`text-4xl font-black ${valEV > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {valEV > 0 ? '+' : ''}{valEVPercent.toFixed(2)}%
                      </h3>
                      <p className={`text-xs mt-2 font-bold ${valEV > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}>
                          {valEV > 0 ? '✅ Aposta de Valor Encontrada' : '❌ Odds sem valor estatístico'}
                      </p>
                   </div>
                </div>
                )
            )}

            {activeTab === 'arb' && (
                !isPro ? <ProLockScreen /> : (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                   <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-6 flex items-center gap-2"><Scale size={20} className="text-blue-500"/> Arbitragem (2-Way)</h2>
                   <div className="mb-4">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Investimento Total (R$)</label>
                      <input type="number" value={arbTotalStake} onChange={e => setArbTotalStake(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-bold outline-none border border-slate-200 dark:border-slate-800 text-lg text-slate-900 dark:text-white" />
                   </div>
                   <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Casa A (Odds)</label>
                          <input type="number" value={arbOdds1} onChange={e => setArbOdds1(e.target.value)} className="w-full bg-transparent font-mono font-black text-xl outline-none text-slate-900 dark:text-white" />
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                             <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400">Apostar:</p>
                             <p className="text-emerald-600 dark:text-emerald-500 font-bold">R$ {isFinite(arbStake1) ? arbStake1.toFixed(2) : '0.00'}</p>
                          </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Casa B (Odds)</label>
                          <input type="number" value={arbOdds2} onChange={e => setArbOdds2(e.target.value)} className="w-full bg-transparent font-mono font-black text-xl outline-none text-slate-900 dark:text-white" />
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                             <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400">Apostar:</p>
                             <p className="text-emerald-600 dark:text-emerald-500 font-bold">R$ {isFinite(arbStake2) ? arbStake2.toFixed(2) : '0.00'}</p>
                          </div>
                      </div>
                   </div>
                   <div className={`p-4 rounded-xl flex justify-between items-center ${arbRoi > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      <span className="font-bold uppercase text-xs tracking-widest">Lucro Garantido (ROI)</span>
                      <span className="font-black text-xl">{arbRoi.toFixed(2)}%</span>
                   </div>
                   {arbRoi > 0 && <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">Lucro líquido: R$ {arbProfit.toFixed(2)}</p>}
                </div>
                )
            )}

            {activeTab === 'stake' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                   <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-6 flex items-center gap-2"><Percent size={20} className="text-orange-500"/> Calculadora Stake Fixa</h2>
                   <div className="mb-6">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Porcentagem da Banca (%)</label>
                      <input type="number" value={stakePercent} onChange={e => setStakePercent(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-black text-3xl outline-none border border-slate-200 dark:border-slate-800 text-center text-orange-500" />
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Valor da Aposta</p>
                      <h3 className="text-4xl font-black text-slate-900 dark:text-white">R$ {stakeValue.toFixed(2)}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Baseado na banca atual de R$ {currentBankrollBalance.toFixed(2)}</p>
                   </div>
                </div>
            )}

            {activeTab === 'odds' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                   <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-6 flex items-center gap-2"><ArrowRightLeft size={20} className="text-indigo-500"/> Conversor Universal</h2>
                   <div className="space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Decimal (Eu/Br)</label>
                          <input type="number" value={convDec} onChange={e => handleDecChange(e.target.value)} className="bg-transparent text-right font-mono font-black text-lg outline-none w-24 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Americana (US)</label>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{convAm}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Probabilidade Implícita</label>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{convProb}%</span>
                      </div>
                   </div>
                </div>
            )}

            {activeTab === 'breakeven' && (
                !isPro ? <ProLockScreen /> : (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                   <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-pink-500"/> Break Even Point</h2>
                   <div className="mb-8">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Odd Média</label>
                      <input type="number" value={beOdds} onChange={e => setBeOdds(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-black text-3xl outline-none border border-slate-200 dark:border-slate-800 text-center text-pink-500" />
                   </div>
                   <div className="p-6 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white text-center shadow-lg shadow-slate-900/20">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Win Rate Necessária</p>
                      <h3 className="text-4xl font-black text-white">{beWinRate.toFixed(2)}%</h3>
                      <p className="text-xs text-slate-500 mt-2">Para ficar no zero a zero (sem prejuízo)</p>
                   </div>
                </div>
                )
            )}

            {/* =========================================
                EXPECTATIVA DE CANTOS (ExC) - PRO 
            ========================================= */}
            {activeTab === 'exc' && (
                !isPro ? <ProLockScreen /> : (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm relative overflow-hidden">
                   <div className="flex justify-between items-start mb-8 relative z-10">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
                          <Radar size={24} className="text-emerald-500"/> ExC Analytics
                        </h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">High-Frequency Corner Prediction</p>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                         <Zap size={12} fill="currentColor" /> Market Maker
                      </span>
                   </div>

                   {/* MÓDULO SCANNER VISION IA */}
                   <div className="mb-6 relative group overflow-hidden rounded-[1.5rem] border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#09090b] transition-all hover:border-emerald-500/50">
                       {!scannedImage && !isScanning && (
                           <label className="flex flex-col items-center justify-center p-8 cursor-pointer w-full h-full">
                               <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-500 group-hover:text-emerald-500 transition-colors group-hover:scale-110 duration-300">
                                   <Scan size={24} />
                               </div>
                               <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-1">Upload ou Cole (Ctrl+V)</h3>
                               <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold text-center mb-3">Print do Radar Bet365 para auto-preenchimento via IA. (Aceita PNG, JPG, WEBP)</p>
                               <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                  <Zap size={10} fill="currentColor" /> {Math.max(0, 10 - (aiScansUsedToday || 0))} Scans Restantes Hoje
                               </div>
                               <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleFileUpload} ref={fileInputRef} />
                           </label>
                       )}

                       {isScanning && scannedImage && (
                           <div className="relative w-full h-48 bg-black flex items-center justify-center overflow-hidden">
                               <img src={scannedImage} alt="Scanning" className="object-cover opacity-30 w-full h-full blur-sm" />
                               <motion.div 
                                  initial={{ top: '0%' }} 
                                  animate={{ top: '100%' }} 
                                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                  className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_20px_#10b981] z-10" 
                               />
                               <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                  <Scan size={32} className="text-emerald-400 mb-2 animate-pulse" />
                                  <p className="text-emerald-400 font-mono font-bold text-xs uppercase tracking-widest">Processando Vision AI...</p>
                               </div>
                           </div>
                       )}

                       {!isScanning && scannedImage && (
                           <div className="relative w-full h-48 bg-black flex items-center justify-center group/preview">
                               <img src={scannedImage} alt="Scanned" className="object-cover opacity-60 w-full h-full" />
                               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                               <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                   <div className="flex items-center gap-2 text-emerald-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                                       <CheckCircle2 size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Dados Extraídos</span>
                                   </div>
                                   <button onClick={resetScanner} className="text-[10px] font-black uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors shadow-lg">Limpar</button>
                               </div>
                           </div>
                       )}
                   </div>
                   
                   {/* GATEKEEPER */}
                   <div className="mb-8 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 relative z-10">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase block mb-2 tracking-widest">1. Selecione o Cenário</label>
                        <select value={excScenario} onChange={e => setExcScenario(e.target.value)} className="w-full bg-white dark:bg-[#09090b] border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl font-bold text-sm outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer">
                           {Object.entries(excScenariosData).map(([key, data]) => (
                               <option key={key} value={key}>{data.title}</option>
                           ))}
                        </select>
                      </div>
                      <div className="p-5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                           <Lock size={12} className={excUnlocked ? 'text-emerald-500' : 'text-slate-500'}/> Guardião de Padrão (Validação Visual)
                        </p>
                        <div className="space-y-2">
                           {excScenariosData[excScenario].checks.map((check, idx) => (
                              <button key={idx} onClick={() => handleExcCheck(idx)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left group ${excChecklist[idx] ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-white dark:bg-[#020617] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                 <div className={`shrink-0 transition-transform ${excChecklist[idx] ? 'text-emerald-500 scale-110' : 'text-slate-400 group-hover:text-slate-300'}`}>{excChecklist[idx] ? <CheckSquare size={18} /> : <Square size={18} />}</div>
                                 <span className={`text-[11px] sm:text-xs font-bold leading-tight ${excChecklist[idx] ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>{check}</span>
                              </button>
                           ))}
                        </div>
                      </div>
                   </div>

                   <AnimatePresence>
                     {excUnlocked && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="relative z-10 overflow-hidden">
                         
                         {/* GRID DE CONTEXTO TÁTICO HFT */}
                         <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 mb-6 shadow-inner">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">🧠 Matrix de Contexto Tático (IA / Manual)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <PodSelect label="Pressão (TDF)" value={pressureTrend} onChange={(e:any)=>setPressureTrend(e.target.value)} icon={TrendingUp} options={[{value:'increasing',label:'Acelerando'},{value:'stable',label:'Estável'},{value:'decreasing',label:'Caindo'}]} />
                                <PodSelect label="Temperatura" value={matchTemp} onChange={(e:any)=>setMatchTemp(e.target.value)} icon={Thermometer} options={[{value:'intense',label:'Intenso (Aberto)'},{value:'calm',label:'Morno (Estudado)'}]} />
                                <PodSelect label="Expulsão" value={redCard} onChange={(e:any)=>setRedCard(e.target.value)} icon={RectangleHorizontal} options={[{value:'none',label:'Nenhum'},{value:'pressing',label:'No Atacante'},{value:'defending',label:'Na Defesa'}]} />
                                <PodSelect label="Necessidade" value={needsGoal} onChange={(e:any)=>setNeedsGoal(e.target.value)} icon={Target} options={[{value:'true',label:'Desespero'},{value:'false',label:'Confortável'}]} />
                            </div>
                         </div>

                         {/* INPUTS AVANÇADOS COM ÍCONES */}
                         <div className="bg-slate-900 rounded-[2rem] p-6 mb-6 border border-slate-800 shadow-inner">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2"><Activity size={14} className="text-emerald-500"/> Global Match Data</h3>
                            <div className="grid grid-cols-3 gap-3 mb-6">
                               <PodInput label="Minuto" value={liveMin} onChange={(e:any) => setLiveMin(e.target.value)} icon={Clock} placeholder="00" colorClass="text-slate-500" />
                               <PodInput label="Cantos" value={liveCorners} onChange={(e:any) => setLiveCorners(e.target.value)} icon={Flag} placeholder="0" colorClass="text-slate-500" />
                               <PodInput label="AP (Defesa)" value={liveAP_Def} onChange={(e:any) => setLiveAP_Def(e.target.value)} icon={ShieldAlert} placeholder="0" colorClass="text-slate-500" />
                            </div>
                            
                            <div className="border-t border-slate-800/80 pt-5">
                                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Crosshair size={14} /> Attacking Team (Pressão)</h3>
                                <div className="grid grid-cols-2 gap-3">
                                   <PodInput label="Ataques P. Atual" value={liveAP_Press} onChange={(e:any) => setLiveAP_Press(e.target.value)} icon={Swords} placeholder="00" highlight colorClass="text-emerald-500" />
                                   <PodInput label="AP (Há 5 min)" value={liveAP_5m} onChange={(e:any) => setLiveAP_5m(e.target.value)} icon={TrendingUp} placeholder="Opcional" highlight colorClass="text-emerald-500" />
                                   <PodInput label="Chutes no Alvo" value={liveSoT} onChange={(e:any) => setLiveSoT(e.target.value)} icon={Target} placeholder="0" highlight colorClass="text-emerald-500" />
                                   <PodInput label="Chutes Fora" value={liveSoffT} onChange={(e:any) => setLiveSoffT(e.target.value)} icon={Target} placeholder="0" highlight colorClass="text-emerald-500" />
                                </div>
                            </div>
                         </div>

                         {/* ENTRADA DE ODD COM GLASSMORPHISM */}
                         <div className="mb-6 relative overflow-hidden rounded-2xl group">
                             <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                             <div className="bg-[#09090b]/80 backdrop-blur-sm p-5 border border-emerald-500/20 relative flex items-center gap-4">
                                 <div className="bg-emerald-500/10 p-3.5 rounded-xl shrink-0 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                    <DollarSign size={24} className="text-emerald-400" />
                                 </div>
                                 <div className="flex-1">
                                    <label className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] block mb-1">Odd Oferecida Bet365 (Scanner de EV%)</label>
                                    <input type="number" step="0.01" placeholder="Ex: 1.83" value={liveCurrentOdd} onChange={e => setLiveCurrentOdd(e.target.value)} className="w-full bg-transparent text-2xl font-mono font-black text-white outline-none placeholder:text-slate-700" />
                                 </div>
                             </div>
                         </div>

                         {engineRes && engineRes.crossCheckMsg && (
                            <div className="mb-6 bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-2xl text-xs font-bold flex items-start gap-3 shadow-inner">
                               <Lightbulb size={18} className="shrink-0 mt-0.5 text-blue-400" /> 
                               <span className="leading-relaxed">{engineRes.crossCheckMsg}</span>
                            </div>
                         )}

                         {/* BLOOMBERG TERMINAL UI DEFINITIVO */}
                         {engineRes && (
                         <div className="bg-[#020617] rounded-[2rem] border border-slate-800 p-6 overflow-hidden relative shadow-2xl mt-4">
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                             
                             {/* Brilho Dinâmico Radial Baseado no Resultado */}
                             <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-colors duration-1000 ${
                                engineRes.color === 'green' ? 'bg-emerald-500/20' : 
                                engineRes.color === 'yellow' ? 'bg-yellow-500/10' : 'bg-red-500/10'
                             }`}></div>

                             {/* TOPO: SCORE DE CONFIANÇA */}
                             <div className="relative z-10 flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-slate-800">
                                 <div className="flex-shrink-0 flex flex-col items-center justify-center p-4 bg-slate-900/80 rounded-2xl border border-slate-700">
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2">Confidence Score</p>
                                    <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-4 border-slate-800">
                                       <svg className="absolute inset-0 w-full h-full -rotate-90">
                                         <circle cx="36" cy="36" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={`${(engineRes.finalScore / 100) * 226} 226`} className={engineRes.color === 'green' ? 'text-emerald-500' : engineRes.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'} />
                                       </svg>
                                       <span className="text-2xl font-black text-white z-10">{engineRes.finalScore.toFixed(0)}</span>
                                    </div>
                                    <span className={`mt-3 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded ${engineRes.color === 'green' ? 'bg-emerald-500/20 text-emerald-400' : engineRes.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {engineRes.label}
                                    </span>
                                 </div>

                                 <div className="flex-1 flex flex-col justify-center">
                                     <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center gap-2"><CheckCircle2 size={12}/> Índice de Confluência</p>
                                     <ul className="space-y-2">
                                         {engineRes.reasons.length > 0 ? engineRes.reasons.map((r, i) => (
                                             <li key={i} className="text-[11px] sm:text-xs text-slate-300 flex items-start gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                                                 <span className="text-indigo-400 shrink-0 mt-0.5">✔</span> {r}
                                             </li>
                                         )) : (
                                             <li className="text-xs text-slate-500 italic">Sem confluências fortes detectadas.</li>
                                         )}
                                     </ul>
                                 </div>
                             </div>
                             
                             <div className="relative z-10 flex flex-col md:flex-row justify-between mb-8 gap-8">
                                {/* Cápsulas de Métricas */}
                                <div className="space-y-4 flex-1">
                                    <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                                       <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2"><Activity size={14}/> Pressão (APPM)</span>
                                       <span className={`text-xl font-black font-mono ${engineRes.appm >= 1.05 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'text-slate-400'}`}>{engineRes.appm.toFixed(2)}</span>
                                    </div>
                                    <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                                       <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2"><MapIcon size={14}/> Field Tilt</span>
                                       <span className={`text-xl font-black font-mono ${engineRes.fieldTilt >= 65 ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]' : 'text-slate-400'}`}>{engineRes.fieldTilt.toFixed(0)}%</span>
                                    </div>
                                    <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                                       <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2"><Zap size={14}/> Momentum</span>
                                       <span className={`text-xs font-black uppercase tracking-widest ${engineRes.momentumScore >= 15 ? 'text-indigo-400' : 'text-slate-400'}`}>{engineRes.paceMsg}</span>
                                    </div>
                                </div>

                                {/* Gráfico Poisson - 3 Cenários TDF */}
                                <div className="flex-[1.5] bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-inner flex flex-col justify-center">
                                    <h4 className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-5 flex justify-between items-center">
                                       <span className="flex items-center gap-1.5"><BarChart4 size={14} className="text-emerald-500"/> Projeção TDF (Poisson)</span>
                                    </h4>
                                    
                                    <div className="space-y-4">
                                        {/* Agressivo */}
                                        <div className="bg-[#09090b] p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                                            <div className="flex flex-col"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><Flame size={10} className="text-orange-500"/> Agressivo</span><span className="text-[10px] text-slate-400">Variância Alta</span></div>
                                            <div className="text-right"><span className="text-sm font-black font-mono text-white">{(engineRes.probAggr as any)[engineRes.targetKey].toFixed(1)}%</span></div>
                                        </div>
                                        {/* Neutro */}
                                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-700 flex justify-between items-center relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                                            <div className="flex flex-col pl-3"><span className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-1"><Scale size={10}/> Neutro (Base)</span><span className="text-[10px] text-slate-400">Odd Justa: <strong className="text-emerald-400">@{engineRes.fairOdd.toFixed(2)}</strong></span></div>
                                            <div className="text-right"><span className="text-lg font-black font-mono text-emerald-400">{(engineRes.probNeut as any)[engineRes.targetKey].toFixed(1)}%</span></div>
                                        </div>
                                        {/* Conservador */}
                                        <div className="bg-[#09090b] p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                                            <div className="flex flex-col"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><ShieldAlert size={10} className="text-blue-500"/> Conservador</span><span className="text-[10px] text-slate-400">Queda de Ritmo</span></div>
                                            <div className="text-right"><span className="text-sm font-black font-mono text-white">{(engineRes.probCons as any)[engineRes.targetKey].toFixed(1)}%</span></div>
                                        </div>
                                    </div>
                                </div>
                             </div>

                             {/* SINAL RADIOATIVO (Neon Button) */}
                             <div className="relative z-20 mt-4">
                               {engineRes.color === 'green' && (
                                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative group cursor-pointer">
                                      <div className={`absolute -inset-0.5 rounded-2xl blur opacity-40 group-hover:opacity-60 transition animate-pulse bg-gradient-to-r from-emerald-600 to-teal-400`}></div>
                                      <div className={`relative w-full py-4 rounded-2xl font-black text-xs sm:text-sm tracking-widest uppercase text-center text-slate-950 flex items-center justify-center gap-2 bg-emerald-500`}>
                                         <Zap fill="currentColor" size={18} className="animate-bounce"/> ENTRADA APROVADA {engineRes.ev > 0 ? `(EV +${engineRes.ev.toFixed(1)}%)` : ''}
                                      </div>
                                  </motion.div>
                               )}
                               {engineRes.color === 'yellow' && (
                                  <div className="bg-yellow-500 text-slate-950 w-full py-4 rounded-2xl font-black text-xs uppercase text-center flex justify-center items-center gap-2">
                                    <AlertTriangle size={16}/> Risco Moderado. Monitore as Odds.
                                  </div>
                               )}
                               {engineRes.color === 'red' && (
                                  <div className="bg-[#09090b] border border-red-500/30 text-red-400 w-full py-4 rounded-2xl font-black text-[10px] sm:text-xs tracking-widest uppercase text-center flex items-center justify-center gap-2 shadow-inner">
                                     <AlertTriangle size={16} className="shrink-0 text-red-500"/> {engineRes.msg || 'MODELO REJEITA A ENTRADA'}
                                  </div>
                               )}
                             </div>
                             
                             {/* DISCLAIMER DE RESPONSABILIDADE */}
                             <p className="text-center text-[8px] sm:text-[9px] text-slate-500/70 font-bold uppercase tracking-[0.2em] mt-6">
                               ⚠️ Atenção: Esta é uma projeção baseada em probabilidade estatística e não constitui recomendação de aposta ou dica financeira.
                             </p>
                         </div>
                         )}
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
                )
            )}

            {/* =========================================
                EXPECTATIVA DE GOLS (ExG) - PRO (UI AVANÇADA)
            ========================================= */}
            {activeTab === 'exg' && (
                !isPro ? <ProLockScreen /> : (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm relative overflow-hidden">
                   <div className="flex justify-between items-start mb-8 relative z-10">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
                          <Goal size={24} className="text-orange-500"/> ExG Analytics
                        </h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Lethality Engine (Live xG)</p>
                      </div>
                      <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                         <Target size={12} /> Sniper Mode
                      </span>
                   </div>

                   {/* MÓDULO SCANNER VISION IA */}
                   <div className="mb-6 relative group overflow-hidden rounded-[1.5rem] border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#09090b] transition-all hover:border-orange-500/50">
                       {!scannedImage && !isScanning && (
                           <label className="flex flex-col items-center justify-center p-8 cursor-pointer w-full h-full">
                               <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-500 group-hover:text-orange-500 transition-colors group-hover:scale-110 duration-300">
                                   <Scan size={24} />
                               </div>
                               <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-1">Upload ou Cole (Ctrl+V)</h3>
                               <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold text-center mb-3">Print do Radar Bet365 para auto-preenchimento via IA. (Aceita PNG, JPG, WEBP)</p>
                               <div className="bg-orange-500/10 border border-orange-500/20 text-orange-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                  <Zap size={10} fill="currentColor" /> {Math.max(0, 10 - (aiScansUsedToday || 0))} Scans Restantes Hoje
                               </div>
                               <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleFileUpload} ref={fileInputRef} />
                           </label>
                       )}

                       {isScanning && scannedImage && (
                           <div className="relative w-full h-48 bg-black flex items-center justify-center overflow-hidden">
                               <img src={scannedImage} alt="Scanning" className="object-cover opacity-30 w-full h-full blur-sm" />
                               <motion.div 
                                  initial={{ top: '0%' }} 
                                  animate={{ top: '100%' }} 
                                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                  className="absolute left-0 right-0 h-1 bg-orange-500 shadow-[0_0_20px_#f97316] z-10" 
                               />
                               <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                  <Scan size={32} className="text-orange-400 mb-2 animate-pulse" />
                                  <p className="text-orange-400 font-mono font-bold text-xs uppercase tracking-widest">Processando Vision AI...</p>
                               </div>
                           </div>
                       )}

                       {!isScanning && scannedImage && (
                           <div className="relative w-full h-48 bg-black flex items-center justify-center group/preview">
                               <img src={scannedImage} alt="Scanned" className="object-cover opacity-60 w-full h-full" />
                               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                               <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                   <div className="flex items-center gap-2 text-orange-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-orange-500/30">
                                       <CheckCircle2 size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Dados Extraídos</span>
                                   </div>
                                   <button onClick={resetScanner} className="text-[10px] font-black uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors shadow-lg">Limpar</button>
                               </div>
                           </div>
                       )}
                   </div>
                   
                   {/* GATEKEEPER */}
                   <div className="mb-8 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 relative z-10">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase block mb-2 tracking-widest">1. Selecione o Cenário</label>
                        <select value={exgScenario} onChange={e => setExgScenario(e.target.value)} className="w-full bg-white dark:bg-[#09090b] border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl font-bold text-sm outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/50 transition-all cursor-pointer">
                           {Object.entries(exgScenariosData).map(([key, data]) => (
                               <option key={key} value={key}>{data.title}</option>
                           ))}
                        </select>
                      </div>
                      <div className="p-5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                           <Lock size={12} className={exgUnlocked ? 'text-orange-500' : 'text-slate-500'}/> Guardião de Padrão (Validação Tática)
                        </p>
                        <div className="space-y-2">
                           {exgScenariosData[exgScenario].checks.map((check, idx) => (
                              <button key={idx} onClick={() => handleExgCheck(idx)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left group ${exgChecklist[idx] ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30' : 'bg-white dark:bg-[#020617] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                 <div className={`shrink-0 transition-transform ${exgChecklist[idx] ? 'text-orange-500 scale-110' : 'text-slate-400 group-hover:text-slate-300'}`}>{exgChecklist[idx] ? <CheckSquare size={18} /> : <Square size={18} />}</div>
                                 <span className={`text-[11px] sm:text-xs font-bold leading-tight ${exgChecklist[idx] ? 'text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}`}>{check}</span>
                              </button>
                           ))}
                        </div>
                      </div>
                   </div>

                   <AnimatePresence>
                     {exgUnlocked && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="relative z-10 overflow-hidden">
                         
                         {/* GRID DE CONTEXTO TÁTICO HFT */}
                         <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 mb-6 shadow-inner">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">🧠 Matrix de Contexto Tático (IA / Manual)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <PodSelect label="Pressão (TDF)" value={pressureTrend} onChange={(e:any)=>setPressureTrend(e.target.value)} icon={TrendingUp} options={[{value:'increasing',label:'Acelerando'},{value:'stable',label:'Estável'},{value:'decreasing',label:'Caindo'}]} />
                                <PodSelect label="Temperatura" value={matchTemp} onChange={(e:any)=>setMatchTemp(e.target.value)} icon={Thermometer} options={[{value:'intense',label:'Intenso (Aberto)'},{value:'calm',label:'Morno (Estudado)'}]} />
                                <PodSelect label="Expulsão" value={redCard} onChange={(e:any)=>setRedCard(e.target.value)} icon={RectangleHorizontal} options={[{value:'none',label:'Nenhum'},{value:'pressing',label:'No Atacante'},{value:'defending',label:'Na Defesa'}]} />
                                <PodSelect label="Necessidade" value={needsGoal} onChange={(e:any)=>setNeedsGoal(e.target.value)} icon={Target} options={[{value:'true',label:'Desespero'},{value:'false',label:'Confortável'}]} />
                            </div>
                         </div>

                         {/* INPUTS AVANÇADOS COM ÍCONES */}
                         <div className="bg-slate-900 rounded-[2rem] p-6 mb-6 border border-slate-800 shadow-inner">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2"><Activity size={14} className="text-orange-500"/> Global Match Data</h3>
                            <div className="grid grid-cols-3 gap-3 mb-6">
                               <PodInput label="Minuto" value={liveMin} onChange={(e:any) => setLiveMin(e.target.value)} icon={Clock} placeholder="00" colorClass="text-slate-500" />
                               <PodInput label="Gols" value={liveGoals} onChange={(e:any) => setLiveGoals(e.target.value)} icon={Goal} placeholder="0" colorClass="text-slate-500" />
                               <PodInput label="AP (Defesa)" value={liveAP_Def} onChange={(e:any) => setLiveAP_Def(e.target.value)} icon={ShieldAlert} placeholder="0" colorClass="text-slate-500" />
                            </div>
                            
                            <div className="border-t border-slate-800/80 pt-5">
                                <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Crosshair size={14} /> Lethality Metrics (Ataque)</h3>
                                <div className="grid grid-cols-2 gap-3">
                                   <PodInput label="Ataques P. Atual" value={liveAP_Press} onChange={(e:any) => setLiveAP_Press(e.target.value)} icon={Swords} placeholder="00" highlight colorClass="text-orange-500" />
                                   <PodInput label="AP (Há 5 min)" value={liveAP_5m} onChange={(e:any) => setLiveAP_5m(e.target.value)} icon={TrendingUp} placeholder="Opcional" highlight colorClass="text-orange-500" />
                                   <PodInput label="Chutes no Alvo" value={liveSoT} onChange={(e:any) => setLiveSoT(e.target.value)} icon={Target} placeholder="0" highlight colorClass="text-orange-500" />
                                   <PodInput label="Chutes Fora" value={liveSoffT} onChange={(e:any) => setLiveSoffT(e.target.value)} icon={Target} placeholder="0" highlight colorClass="text-orange-500" />
                                </div>
                            </div>
                         </div>

                         {/* ENTRADA DE ODD COM GLASSMORPHISM */}
                         <div className="mb-6 relative overflow-hidden rounded-2xl group">
                             <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                             <div className="bg-[#09090b]/80 backdrop-blur-sm p-5 border border-orange-500/20 relative flex items-center gap-4">
                                 <div className="bg-orange-500/10 p-3.5 rounded-xl shrink-0 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                                    <DollarSign size={24} className="text-orange-400" />
                                 </div>
                                 <div className="flex-1">
                                    <label className="text-[9px] font-black text-orange-500 uppercase tracking-[0.2em] block mb-1">Odd Oferecida (Scanner de EV%)</label>
                                    <input type="number" step="0.01" placeholder="Ex: 1.83" value={liveCurrentOdd} onChange={e => setLiveCurrentOdd(e.target.value)} className="w-full bg-transparent text-2xl font-mono font-black text-white outline-none placeholder:text-slate-700" />
                                 </div>
                             </div>
                         </div>

                         {engineRes && engineRes.crossCheckMsg && (
                            <div className="mb-6 bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-2xl text-xs font-bold flex items-start gap-3 shadow-inner">
                               <Lightbulb size={18} className="shrink-0 mt-0.5 text-blue-400" /> 
                               <span className="leading-relaxed">{engineRes.crossCheckMsg}</span>
                            </div>
                         )}

                         {/* BLOOMBERG TERMINAL UI DEFINITIVO - GOLS */}
                         {engineRes && (
                         <div className="bg-[#020617] rounded-[2rem] border border-slate-800 p-6 overflow-hidden relative shadow-2xl mt-4">
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                             
                             {/* Brilho Dinâmico Radial Baseado no Resultado */}
                             <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-colors duration-1000 ${
                                engineRes.color === 'green' ? 'bg-orange-500/20' : 
                                engineRes.color === 'yellow' ? 'bg-yellow-500/10' : 'bg-red-500/10'
                             }`}></div>

                             {/* TOPO: SCORE DE CONFIANÇA */}
                             <div className="relative z-10 flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-slate-800">
                                 <div className="flex-shrink-0 flex flex-col items-center justify-center p-4 bg-slate-900/80 rounded-2xl border border-slate-700">
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2">Confidence Score</p>
                                    <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-4 border-slate-800">
                                       <svg className="absolute inset-0 w-full h-full -rotate-90">
                                         <circle cx="36" cy="36" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={`${(engineRes.finalScore / 100) * 226} 226`} className={engineRes.color === 'green' ? 'text-orange-500' : engineRes.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'} />
                                       </svg>
                                       <span className="text-2xl font-black text-white z-10">{engineRes.finalScore.toFixed(0)}</span>
                                    </div>
                                    <span className={`mt-3 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded ${engineRes.color === 'green' ? 'bg-orange-500/20 text-orange-400' : engineRes.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {engineRes.label}
                                    </span>
                                 </div>

                                 <div className="flex-1 flex flex-col justify-center">
                                     <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center gap-2"><CheckCircle2 size={12}/> Índice de Confluência</p>
                                     <ul className="space-y-2">
                                         {engineRes.reasons.length > 0 ? engineRes.reasons.map((r, i) => (
                                             <li key={i} className="text-[11px] sm:text-xs text-slate-300 flex items-start gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                                                 <span className="text-indigo-400 shrink-0 mt-0.5">✔</span> {r}
                                             </li>
                                         )) : (
                                             <li className="text-xs text-slate-500 italic">Sem confluências fortes detectadas.</li>
                                         )}
                                     </ul>
                                 </div>
                             </div>
                             
                             <div className="relative z-10 flex flex-col md:flex-row justify-between mb-8 gap-8">
                                {/* Cápsulas de Métricas */}
                                <div className="space-y-4 flex-1">
                                    <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                                       <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2"><Activity size={14}/> xG Criado</span>
                                       <span className={`text-xl font-black font-mono ${engineRes.appm >= 1.05 ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]' : 'text-slate-400'}`}>{((parseFloat(liveSoT||'0')*0.14) + (parseFloat(liveSoffT||'0')*0.04)).toFixed(2)}</span>
                                    </div>
                                    <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                                       <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2"><MapIcon size={14}/> Field Tilt</span>
                                       <span className={`text-xl font-black font-mono ${engineRes.fieldTilt >= 65 ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]' : 'text-slate-400'}`}>{engineRes.fieldTilt.toFixed(0)}%</span>
                                    </div>
                                    <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                                       <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2"><Zap size={14}/> Momentum</span>
                                       <span className={`text-xs font-black uppercase tracking-widest ${engineRes.momentumScore >= 15 ? 'text-indigo-400' : 'text-slate-400'}`}>{engineRes.paceMsg}</span>
                                    </div>
                                </div>

                                {/* Gráfico Poisson - 3 Cenários TDF */}
                                <div className="flex-[1.5] bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-inner flex flex-col justify-center">
                                    <h4 className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-5 flex justify-between items-center">
                                       <span className="flex items-center gap-1.5"><BarChart4 size={14} className="text-orange-500"/> Projeção TDF (Poisson)</span>
                                    </h4>
                                    
                                    <div className="space-y-4">
                                        {/* Agressivo */}
                                        <div className="bg-[#09090b] p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                                            <div className="flex flex-col"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><Flame size={10} className="text-orange-500"/> Agressivo</span><span className="text-[10px] text-slate-400">Variância Alta</span></div>
                                            <div className="text-right"><span className="text-sm font-black font-mono text-white">{(engineRes.probAggr as any)[engineRes.targetKey].toFixed(1)}%</span></div>
                                        </div>
                                        {/* Neutro */}
                                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-700 flex justify-between items-center relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                                            <div className="flex flex-col pl-3"><span className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-1"><Scale size={10}/> Neutro (Base)</span><span className="text-[10px] text-slate-400">Odd Justa: <strong className="text-orange-400">@{engineRes.fairOdd.toFixed(2)}</strong></span></div>
                                            <div className="text-right"><span className="text-lg font-black font-mono text-orange-400">{(engineRes.probNeut as any)[engineRes.targetKey].toFixed(1)}%</span></div>
                                        </div>
                                        {/* Conservador */}
                                        <div className="bg-[#09090b] p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                                            <div className="flex flex-col"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><ShieldAlert size={10} className="text-blue-500"/> Conservador</span><span className="text-[10px] text-slate-400">Queda de Ritmo</span></div>
                                            <div className="text-right"><span className="text-sm font-black font-mono text-white">{(engineRes.probCons as any)[engineRes.targetKey].toFixed(1)}%</span></div>
                                        </div>
                                    </div>
                                </div>
                             </div>

                             {/* SINAL RADIOATIVO (Neon Button) */}
                             <div className="relative z-20 mt-4">
                               {engineRes.color === 'green' && (
                                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative group cursor-pointer">
                                      <div className={`absolute -inset-0.5 rounded-2xl blur opacity-40 group-hover:opacity-60 transition animate-pulse bg-gradient-to-r from-orange-600 to-amber-400`}></div>
                                      <div className={`relative w-full py-4 rounded-2xl font-black text-xs sm:text-sm tracking-widest uppercase text-center text-slate-950 flex items-center justify-center gap-2 bg-orange-500`}>
                                         <Target fill="currentColor" size={18} className="animate-bounce"/> ENTRADA APROVADA {engineRes.ev > 0 ? `(EV +${engineRes.ev.toFixed(1)}%)` : ''}
                                      </div>
                                  </motion.div>
                               )}
                               {engineRes.color === 'yellow' && (
                                  <div className="bg-yellow-500 text-slate-950 w-full py-4 rounded-2xl font-black text-xs uppercase text-center flex justify-center gap-2">
                                    <AlertTriangle size={16}/> Risco Moderado. Monitore as Odds.
                                  </div>
                               )}
                               {engineRes.color === 'red' && (
                                  <div className="bg-[#09090b] border border-red-500/30 text-red-400 w-full py-4 rounded-2xl font-black text-[10px] sm:text-xs tracking-widest uppercase text-center flex items-center justify-center gap-2 shadow-inner">
                                     <AlertTriangle size={16} className="shrink-0 text-red-500"/> {engineRes.msg || 'MODELO REJEITA A ENTRADA'}
                                  </div>
                               )}
                             </div>
                             
                             {/* DISCLAIMER DE RESPONSABILIDADE */}
                             <p className="text-center text-[8px] sm:text-[9px] text-slate-500/70 font-bold uppercase tracking-[0.2em] mt-6">
                               ⚠️ Atenção: Esta é uma projeção baseada em probabilidade estatística e não constitui recomendação de aposta ou dica financeira.
                             </p>
                         </div>
                         )}
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
                )
            )}
            
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-1 space-y-6 w-full min-w-0">
            <div className="bg-white dark:bg-[#0f172a] rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm sticky top-6">
                <h4 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">O Terminal HFT</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 uppercase font-bold tracking-wider">{sidebarInfo.title}</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        {sidebarInfo.text}
                    </p>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                       <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                       <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                         Lembre-se: Todas as calculadoras assumem liquidez disponível. Sempre verifique os limites da casa antes de operar. Os resultados matemáticos gerados nesta página não são recomendações de entrada nem aconselhamento financeiro. A responsabilidade é inteiramente sua.
                       </p>
                    </div>
                </div>
            </div>
        </div> 

      </div> 
    </div> 
  );
};

export default Calculators;