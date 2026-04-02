import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Plus, Scale, Percent, ArrowRightLeft, 
  Target, TrendingUp, AlertTriangle, Lock, Crown, Radar, 
  Activity, Crosshair, BarChart4, Zap, DollarSign, Goal, Lightbulb,
  Clock, Flag, ShieldAlert, FileText, Eraser, Eye
} from 'lucide-react';
import { useBetStore } from '../store/useBetStore';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// MÓDULOS MATEMÁTICOS BASE
// ==========================================
const factorial = (n: number): number => {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  let result = 1; for (let i = 2; i <= n; i++) result *= i;
  return result;
};

const poissonExact = (k: number, lambda: number): number => {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

const Calculators: React.FC = () => {
  const { user, currentBankrollBalance, isPro, aiScansUsedToday, canUseAiScan, incrementAiScan, setToast } = useBetStore();
  const userEmail = user?.email || "usuario@desconhecido.com"; 
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'dutching'|'kelly'|'value'|'arb'|'stake'|'odds'|'breakeven'|'live_hft'>('dutching');

  // ESTADOS DO LIVE HFT
  const [liveTextData, setLiveTextData] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [liveCurrentOdd, setLiveCurrentOdd] = useState('');
  const [liveContext, setLiveContext] = useState<any>(null);

  const checkAiLimit = () => {
     if (userEmail === "rafaelancelmo.castro@gmail.com") return true;
     return canUseAiScan ? canUseAiScan() : false;
  };

  const handleIncrementScan = () => {
      if (userEmail !== "rafaelancelmo.castro@gmail.com" && typeof incrementAiScan === 'function') {
          incrementAiScan();
      }
  };

  // 🔥 O MOTOR NLP IN-PLAY
  const processNLPEngine = async () => {
    if (!isPro) { setToast({ type: 'error', message: 'Exclusivo PRO.' }); return; }
    if (!checkAiLimit()) { setToast({ type: 'error', message: 'Limite de Scans atingido.' }); return; }
    if (!liveTextData || liveTextData.trim().length < 20) { setToast({ type: 'error', message: 'Cole os dados do jogo primeiro.' }); return; }
    
    const oddParsed = parseFloat(liveCurrentOdd);
    if (!liveCurrentOdd || isNaN(oddParsed) || oddParsed <= 1) { 
        setToast({ type: 'error', message: 'Digite uma Odd válida (ex: 1.80) antes de rodar a IA.' }); 
        return; 
    }

    setIsScanning(true);
    setLiveContext(null);

    try {
        const response = await fetch('/api/live-nlp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ textData: liveTextData, email: userEmail })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Falha na conexão com a IA.');
        
        if (data && data.min > 0) {
           setLiveContext(data);
           handleIncrementScan();
           setToast({ type: 'success', message: 'Leitura de jogo concluída!' });
        } else {
           throw new Error('Não foi possível extrair o relógio (minuto) do jogo.');
        }
    } catch (e: any) {
        setToast({ type: 'error', message: e.message || 'Erro na leitura do texto ao vivo.' });
    } finally { setIsScanning(false); }
  };

  // 🔥 MOTOR DE AUTO-DISCOVERY (Descobre a entrada principal e projeta o futuro)
  const runAutoDiscoveryHFT = () => {
      if (!liveContext) return null;

      const { min, totalGoals, totalCorners, apPress, apDef, sot, sofft, pressureTrend, matchTemperature, needsGoal } = liveContext;
      const odd = parseFloat(liveCurrentOdd) || 0;

      const apP = parseFloat(apPress) || 0;
      const apD = parseFloat(apDef) || 0;
      const sT = parseFloat(sot) || 0;
      const sOff = parseFloat(sofft) || 0;
      const m = parseFloat(min) || 1;
      const currCorners = parseFloat(totalCorners) || 0;
      const currGoals = parseFloat(totalGoals) || 0;

      const isHT = m <= 45;
      const remainingTime = Math.max(1, ((isHT ? 45 : 90) + (isHT ? 3 : 6)) - m);
      
      const totalAP = apP + apD; 
      const fieldTilt = totalAP > 0 ? (apP / totalAP) * 100 : 0; 
      const appm = apP / m;

      let wOld = 0.55; let wRecent = 0.45;
      if (pressureTrend === 'increasing') { wOld = 0.35; wRecent = 0.65; } 
      else if (pressureTrend === 'decreasing') { wOld = 0.75; wRecent = 0.25; }

      // PROBABILIDADE DE CANTOS
      const cornerRateOld = ((apP * 0.06) + (sT * 0.25) + (sOff * 0.20)) / m; 
      let cornerLambda = cornerRateOld * remainingTime;
      if (needsGoal) cornerLambda *= 1.25;

      // PROBABILIDADE DE GOLS
      const goalRateOld = ((sT * 0.14) + (sOff * 0.04) + (apP * 0.005)) / m;
      let goalLambda = goalRateOld * remainingTime;
      if (apD > (apP * 0.5)) goalLambda *= 1.1; // Contra-ataque aberto
      if (needsGoal) goalLambda *= 1.15;

      let scenarios = [];

      // Mapeamento de Janelas de Valor
      if (isHT && m >= 20 && m <= 43) {
          scenarios.push({ id: 'ht_corner', market: 'Escanteios', name: `Canto Asiático HT (Mais de ${currCorners + 0.5})`, lambda: cornerLambda, type: 'corner' });
          scenarios.push({ id: 'ht_goal', market: 'Gols', name: `Gols HT (Mais de ${currGoals + 0.5})`, lambda: goalLambda, type: 'goal' });
      } else if (!isHT && m >= 60 && m <= 88) {
          scenarios.push({ id: 'ft_corner', market: 'Escanteios', name: `Canto Asiático FT (Mais de ${currCorners + 0.5})`, lambda: cornerLambda, type: 'corner' });
          scenarios.push({ id: 'ft_goal', market: 'Gols', name: `Gols FT (Mais de ${currGoals + 0.5})`, lambda: goalLambda, type: 'goal' });
      }

      if (scenarios.length === 0) {
          return { error: `O relógio (${m}') está numa zona morta (sem EV+ claro). Aguarde a janela de HT (20-42') ou FT (60-88').` };
      }

      let bestScenario = null;
      let maxScore = -1;

      scenarios.forEach(scen => {
          const p0 = poissonExact(0, scen.lambda);
          const probBater = (1 - p0) * 100;
          
          let score = probBater;
          // Bônus de Tipster
          if (scen.type === 'corner' && appm > 1.0 && sT <= 2) score += 15; // Amasso sem precisão = Chove Canto
          if (scen.type === 'goal' && sT >= 3 && fieldTilt > 60) score += 15; // Amasso com finalização = Cheiro de Gol

          if (pressureTrend === 'increasing') score += 10;
          if (needsGoal) score += 8;
          if (matchTemperature === 'intense') score += 5;

          if (score > maxScore) {
              maxScore = score;
              bestScenario = { ...scen, probReal: probBater, finalScore: Math.min(100, score) };
          }
      });

      if (!bestScenario) return null;

      const ev = odd > 0 ? ((bestScenario.probReal / 100) * odd - 1) * 100 : 0; 
      const fairOdd = bestScenario.probReal > 0 ? 100 / bestScenario.probReal : 0;

      // Classificação do Robô com Trava de Odd Esmagada
      let label = '🔴 FUJA DESSE JOGO'; let color = 'red';
      if (bestScenario.finalScore >= 70 && ev > 2) { label = '🔒 ENTRADA DE ALTO VALOR (EV+)'; color = 'green'; }
      else if (bestScenario.finalScore >= 70 && ev <= 2) { label = '🟡 AGUARDE A ODD VALORIZAR'; color = 'yellow'; }
      else if (bestScenario.finalScore >= 50 && ev > 0) { label = '🟢 LEITURA POSITIVA'; color = 'green'; }
      else if (bestScenario.finalScore >= 50 && ev <= 0) { label = '⚠️ ODD ESMAGADA (SEM VALOR)'; color = 'yellow'; }

      // Linguagem de Tipster
      let reasons = [];
      if (fieldTilt >= 65) reasons.push(`Amasso territorial (Controle de ${fieldTilt.toFixed(0)}% das ações)`);
      if (pressureTrend === 'increasing') reasons.push('Blitz ligada: Time acelerou o ritmo no Radar recente');
      if (needsGoal) reasons.push('Modo desespero: Precisa do resultado (Padrão Kamikaze ativado)');
      if (bestScenario.type === 'goal' && sT >= 3) reasons.push(`Mira calibrada: ${sT} chutes no alvo gerando muito xG`);
      if (bestScenario.type === 'corner' && appm > 0.9) reasons.push(`Chuva de ataques: ${appm.toFixed(2)} ataques perigosos/min`);
      if (ev > 5) reasons.push(`Odd de muito Valor (+${ev.toFixed(1)}% EV encontrado)`);

      // Visão de Futuro (Projeção)
      let projection = "";
      if (isHT) {
          if (bestScenario.type === 'corner') {
              projection = `Se esse amasso continuar no 2º tempo, a linha de Mais de ${currCorners + 4.5} Cantos FT vai abrir com muito valor. Fique de olho na volta do intervalo.`;
          } else {
              projection = `Jogo extremamente aberto. O mercado de Mais de ${currGoals + 1.5} Gols FT será a principal rota de lucro na segunda etapa.`;
          }
      } else {
          if (m < 85) {
             projection = `Se o placar não mudar até os 86', a entrada no 'Canto Zóio' (Canto Limite Final) será obrigatória por causa desse nível de abafa.`;
          } else {
             projection = `Reta finalíssima. Defesas expostas. Padrão claro para buscar o último suspiro (Zóio) se a odd bater @1.80+.`;
          }
      }

      return { 
          ...bestScenario, appm, fieldTilt, ev, fairOdd, label, color, reasons, projection 
      };
  };

  const autoResult = runAutoDiscoveryHFT();

  const ProLockScreen = () => (
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 opacity-50" />
          <div className="bg-white dark:bg-slate-800 p-4 rounded-full mb-4 relative z-10 shadow-sm border border-slate-200 dark:border-slate-700">
              <Crown size={32} className="text-amber-500 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2 relative z-10">
              Ferramenta Profissional
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm relative z-10">
              Esta calculadora matemática avançada é exclusiva para membros PRO. Desbloqueie todo o potencial da sua gestão.
          </p>
          <button onClick={() => navigate('/pro')} className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 font-black py-3 px-8 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 relative z-10 uppercase tracking-widest text-xs">
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

  const sidebarInfo = (() => {
    switch(activeTab) {
      case 'dutching': return { title: 'Gestão de Risco', text: 'O Dutching divide a sua exposição entre múltiplas seleções, diluindo o risco do investimento em um único evento.' };
      case 'kelly': return { title: 'Cálculo de Exposição', text: 'O Critério de Kelly ajusta matematicamente a stake ideal com base na probabilidade e na odd apresentada.' };
      case 'value': return { title: 'Análise de EV+', text: 'O conceito de Value Bet compara a cotação oferecida pelo mercado com a probabilidade real.' };
      case 'arb': return { title: 'Arbitragem Matemática', text: 'Calcula o volume exato a ser distribuído em duas vias para anular o risco direcional.' };
      case 'stake': return { title: 'Gestão Fixa', text: 'O cálculo de stake fixa percentual ajuda a manter o controle do drawdown em fases de oscilação.' };
      case 'odds': return { title: 'Leitura Global', text: 'Conversão automática de formatos de cotações utilizados em bolsas esportivas.' };
      case 'breakeven': return { title: 'Ponto de Equilíbrio', text: 'A taxa de acerto (Hit-Rate) necessária para manter a estabilidade do capital com a odd informada.' };
      case 'live_hft': return { title: 'Leitura de Jogo In-Play', text: 'Terminal HFT focado no Ao Vivo. Cole os dados do CornerPro ou SofaScore. O robô vai cruzar o Field Tilt, Momentum e o Relógio para te dar a calada: onde está o EV+ de verdade agora?' };
      default: return { title: 'Ferramentas Analíticas', text: 'Tome decisões baseadas em dados.' };
    }
  })();

  const tabs = [
    { id: 'dutching', label: 'Dutching', pro: false }, { id: 'kelly', label: 'Kelly', pro: false },
    { id: 'value', label: 'Value Bet', pro: true }, { id: 'arb', label: 'Arbitragem', pro: true },
    { id: 'stake', label: 'Stake %', pro: false }, { id: 'odds', label: 'Odds Conv.', pro: false },
    { id: 'breakeven', label: 'Break Even', pro: true }, { id: 'live_hft', label: 'Live HFT', pro: true }
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
      <div className="flex flex-wrap md:grid md:grid-cols-4 xl:grid-cols-8 gap-2 mb-6 px-4 md:px-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setLiveContext(null); setLiveTextData(''); }}
            className={`relative flex-1 min-w-[90px] flex items-center justify-center px-2 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all gap-1 ${
              activeTab === tab.id
                ? (tab.id === 'live_hft' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20')
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
            
            {activeTab === 'dutching' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm w-full overflow-hidden">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-4">Calculadora Dutching</h2>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 w-full mb-6">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest pl-1">Total Stake</span>
                        <input type="number" value={dutchTotalStake} onChange={(e) => setDutchTotalStake(e.target.value)} className="bg-transparent text-right w-full font-mono font-bold outline-none text-slate-900 dark:text-white text-lg" />
                    </div>
                    <div className="space-y-3">
                        {dutchSelections.map((sel, idx) => (
                            <div key={sel.id} className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 grid grid-cols-12 gap-2 items-center shadow-sm dark:shadow-none">
                                <div className="col-span-1 text-xs font-bold text-slate-400">{String.fromCharCode(65 + idx)}</div>
                                <div className="col-span-5"><input type="text" value={sel.name} onChange={e => { const n = [...dutchSelections]; n[idx].name = e.target.value; setDutchSelections(n); }} className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200" /></div>
                                <div className="col-span-3"><input type="number" value={sel.odds} onChange={e => { const n = [...dutchSelections]; n[idx].odds = e.target.value; setDutchSelections(n); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm font-mono text-center text-slate-900 dark:text-white" placeholder="Odds" /></div>
                                <div className="col-span-3 text-right">
                                    <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">R$ {sel.stake.toFixed(2)}</p>
                                    <button onClick={() => removeDutchSelection(sel.id)} className="text-[9px] text-red-500 dark:text-red-400 hover:underline mt-1">Remover</button>
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
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Stake Recomendada</p>
                        <h3 className="text-4xl font-black text-purple-600 dark:text-purple-400">{parseFloat(kellyResult) > 0 ? kellyResult : '0.00'}%</h3>
                        <p className="text-sm font-mono text-purple-800 dark:text-purple-300 mt-2 bg-purple-100 dark:bg-purple-500/20 inline-block px-3 py-1 rounded font-bold">R$ {parseFloat(kellyResult) > 0 ? kellyMoney.toFixed(2) : '0.00'}</p>
                    </div>
                </div>
            )}

            {activeTab === 'value' && !isPro && <ProLockScreen />}
            {activeTab === 'value' && isPro && (
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
                      <h3 className={`text-4xl font-black ${valEV > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500'}`}>
                        {valEV > 0 ? '+' : ''}{valEVPercent.toFixed(2)}%
                      </h3>
                      <p className={`text-xs mt-2 font-bold ${valEV > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {valEV > 0 ? '✅ Aposta de Valor Encontrada' : '❌ Odds sem valor estatístico'}
                      </p>
                   </div>
                </div>
            )}

            {activeTab === 'arb' && !isPro && <ProLockScreen />}
            {activeTab === 'arb' && isPro && (
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
                   <div className={`p-4 rounded-xl flex justify-between items-center ${arbRoi > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      <span className="font-bold uppercase text-xs tracking-widest">Lucro Garantido (ROI)</span>
                      <span className="font-black text-xl">{arbRoi.toFixed(2)}%</span>
                   </div>
                   {arbRoi > 0 && <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">Lucro líquido: R$ {arbProfit.toFixed(2)}</p>}
                </div>
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

            {activeTab === 'breakeven' && !isPro && <ProLockScreen />}
            {activeTab === 'breakeven' && isPro && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                   <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-pink-500"/> Break Even Point</h2>
                   <div className="mb-8">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Odd Média</label>
                      <input type="number" value={beOdds} onChange={e => setBeOdds(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono font-black text-3xl outline-none border border-slate-200 dark:border-slate-800 text-center text-pink-500" />
                   </div>
                   <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white text-center shadow-sm dark:shadow-lg dark:shadow-slate-900/20 border border-slate-200 dark:border-transparent">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Win Rate Necessária</p>
                      <h3 className="text-4xl font-black text-slate-900 dark:text-white">{beWinRate.toFixed(2)}%</h3>
                      <p className="text-xs text-slate-500 mt-2">Para ficar no zero a zero (sem prejuízo)</p>
                   </div>
                </div>
            )}

            {/* =========================================
                LIVE HFT ENGINE (AUTO-DISCOVERY)
            ========================================= */}
            {activeTab === 'live_hft' && !isPro && <ProLockScreen />}
            {activeTab === 'live_hft' && isPro && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm relative overflow-hidden">
                   <div className="flex justify-between items-start mb-6">
                      <h2 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <Radar size={24}/> Live HFT
                      </h2>
                      <span className="border px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm dark:shadow-none bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20">
                         <Zap size={12} /> Auto-Discovery Engine
                      </span>
                   </div>

                   {/* CAIXA DE TEXTO NLP & ODD INPUT JUNTOS */}
                   <div className="relative group overflow-hidden rounded-[2rem] border border-indigo-200 dark:border-indigo-500/20 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-all p-1 flex flex-col shadow-sm dark:shadow-inner bg-indigo-50/30 dark:bg-[#09090b] mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 gap-4">
                         <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                             <FileText size={18} className="text-indigo-500 dark:text-indigo-400"/>
                             <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Upload ou Cole (Ctrl+V)</span>
                         </div>
                         <div className="flex items-center gap-3 self-end sm:self-auto">
                             <div className="border px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm bg-indigo-100 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                                 <Zap size={10} fill="currentColor" /> {Math.max(0, 10 - (aiScansUsedToday||0))} Scans
                             </div>
                             <button onClick={() => { setLiveTextData(''); setLiveContext(null); setLiveCurrentOdd(''); }} className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-white dark:bg-transparent rounded-md border border-transparent hover:border-red-100 dark:hover:border-transparent" title="Limpar Tudo">
                                 <Eraser size={16}/>
                             </button>
                         </div>
                      </div>

                      <textarea
                          value={liveTextData}
                          onChange={(e) => setLiveTextData(e.target.value)}
                          placeholder="Vá no site do jogo ao vivo (CornerPro, SofaScore, etc), aperte Ctrl+A na página toda, copie e cole aqui..."
                          className="w-full bg-transparent text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 p-6 min-h-[140px] outline-none resize-none font-mono text-xs leading-relaxed"
                          disabled={isScanning}
                      />

                      {/* ODD INPUT INTEGRADO NO FUNDO DA CAIXA */}
                      <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500">
                                  <DollarSign size={18} />
                              </div>
                              <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Odd de Entrada (Live)</p>
                                  <input 
                                      type="number" 
                                      step="0.01" 
                                      min="1.01"
                                      placeholder="Ex: 1.83" 
                                      value={liveCurrentOdd} 
                                      onChange={(e) => {
                                          let val = e.target.value.replace(/[^0-9.]/g, '');
                                          if ((val.match(/\./g) || []).length > 1) val = val.replace(/\.(?=[^.]*$)/, '');
                                          setLiveCurrentOdd(val);
                                      }}
                                      className="w-full bg-transparent text-lg font-mono font-black text-slate-900 dark:text-white outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700" 
                                  />
                              </div>
                          </div>
                          
                          <button onClick={processNLPEngine} disabled={isScanning || !liveTextData || !liveCurrentOdd} className="w-full sm:w-auto text-[11px] font-black uppercase tracking-widest text-white px-8 py-3.5 rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500 dark:shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                             <Zap size={16} fill="currentColor" /> Descobrir Entrada
                          </button>
                      </div>

                      {isScanning && (
                          <div className="absolute inset-0 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                              <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-0 left-0 h-1.5 shadow-[0_0_30px_currentColor] bg-indigo-500 text-indigo-500" />
                              <Sparkles size={40} className="mb-4 animate-pulse text-indigo-500" />
                              <p className="font-mono font-bold text-[10px] sm:text-xs uppercase tracking-widest text-center px-4 mt-2 text-indigo-600 dark:text-indigo-400">Cruzando métricas de Gols e Cantos simultaneamente...</p>
                          </div>
                      )}
                   </div>
                   
                   {/* RESULTADO AUTO-DISCOVERY */}
                   <AnimatePresence>
                     {liveContext && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="relative z-10 overflow-hidden">
                         
                         {autoResult && !autoResult.error ? (
                         <div className="bg-slate-50 dark:bg-[#020617] rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 overflow-hidden relative shadow-md dark:shadow-2xl mt-6">
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] dark:opacity-[0.03]"></div>
                             
                             <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[60px] dark:blur-[80px] -mr-20 -mt-20 pointer-events-none transition-colors duration-1000 ${
                                autoResult.color === 'green' ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 
                                autoResult.color === 'yellow' ? 'bg-yellow-500/10' : 'bg-red-500/5 dark:bg-red-500/10'
                             }`}></div>

                             {/* TOPO: APOSTA SUGERIDA */}
                             <div className="relative z-10 flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                                 <div className="flex-shrink-0 flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none min-w-[150px]">
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 text-center">Índice de Confiança</p>
                                    <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-4 border-slate-100 dark:border-slate-800">
                                       <svg className="absolute inset-0 w-full h-full -rotate-90">
                                         <circle cx="36" cy="36" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={`${(autoResult.finalScore / 100) * 226} 226`} className={autoResult.color === 'green' ? 'text-emerald-500' : autoResult.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'} />
                                       </svg>
                                       <span className="text-2xl font-black text-slate-800 dark:text-white z-10">{autoResult.finalScore.toFixed(0)}</span>
                                    </div>
                                    <span className={`mt-3 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded text-center ${autoResult.color === 'green' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : autoResult.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                                        {autoResult.label}
                                    </span>
                                 </div>

                                 <div className="flex-1 flex flex-col justify-center">
                                     <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center gap-2"><Target size={14} className="text-indigo-500"/> Mercado Alvo Detectado (EV+)</p>
                                     <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 p-4 rounded-xl mb-4 shadow-sm dark:shadow-none">
                                         <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                             {autoResult.type === 'corner' ? <Flag size={18}/> : <Goal size={18}/>} {autoResult.name}
                                         </h3>
                                         <p className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">
                                            Probabilidade Real (TDF): <strong className="text-slate-800 dark:text-white">{autoResult.probReal.toFixed(1)}%</strong> | Odd Justa Calculada: <strong className="text-indigo-600 dark:text-indigo-400">@{autoResult.fairOdd.toFixed(2)}</strong>
                                         </p>
                                     </div>
                                     <ul className="space-y-2">
                                         {autoResult.reasons.map((r: string, i: number) => (
                                             <li key={`pos-${i}`} className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 bg-emerald-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-emerald-100 dark:border-slate-800/50 leading-relaxed font-medium">
                                                 <span className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5">✔</span> {r}
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                             </div>

                             {/* PROJEÇÃO FUTURA (FORWARD LOOKING) */}
                             {autoResult.projection && (
                                 <div className="mb-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 p-4 rounded-2xl text-xs font-medium flex items-start gap-3 shadow-sm dark:shadow-inner relative z-10">
                                     <Eye size={18} className="shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" /> 
                                     <span className="leading-relaxed"><strong>Projeção Futura:</strong> {autoResult.projection}</span>
                                 </div>
                             )}

                             {/* SINAL RADIOATIVO (Neon Button) */}
                             <div className="relative z-20 mt-4">
                               {autoResult.color === 'green' && (
                                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative group cursor-pointer">
                                      <div className="absolute -inset-0.5 rounded-2xl blur opacity-30 dark:opacity-40 group-hover:opacity-50 dark:group-hover:opacity-60 transition animate-pulse bg-gradient-to-r from-emerald-500 to-teal-400"></div>
                                      <div className="relative w-full py-4 rounded-2xl font-black text-[10px] sm:text-xs md:text-sm tracking-widest uppercase text-center flex items-center justify-center gap-2 shadow-sm dark:shadow-none bg-emerald-500 text-white dark:text-slate-950">
                                         <Zap fill="currentColor" size={18} className="animate-bounce shrink-0"/> ENTRADA APROVADA {autoResult.ev > 0 ? `(EV +${autoResult.ev.toFixed(1)}%)` : ''}
                                      </div>
                                  </motion.div>
                               )}
                               {autoResult.color === 'yellow' && (
                                  <div className="bg-yellow-500 text-white dark:text-slate-950 w-full py-4 rounded-2xl font-black text-[10px] sm:text-xs uppercase text-center flex justify-center items-center gap-2 shadow-sm dark:shadow-none">
                                    <AlertTriangle size={16} className="shrink-0"/> ODD ESMAGADA. AGUARDE VALORIZAR.
                                  </div>
                               )}
                               {autoResult.color === 'red' && (
                                  <div className="bg-white dark:bg-[#09090b] border border-red-200 dark:border-red-500/30 text-red-500 dark:text-red-400 w-full py-4 rounded-2xl font-black text-[10px] sm:text-xs tracking-widest uppercase text-center flex items-center justify-center gap-2 shadow-sm dark:shadow-inner">
                                     <AlertTriangle size={16} className="shrink-0 text-red-500"/> CILADA (SEM VALOR ESTATÍSTICO)
                                  </div>
                               )}
                             </div>
                         </div>
                         ) : autoResult?.error ? (
                             <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 p-6 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-3 shadow-sm dark:shadow-inner mt-4 text-center">
                                <Clock size={20} className="shrink-0" /> {autoResult.error}
                             </div>
                         ) : null}
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
            )}
            
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-1 space-y-6 w-full min-w-0">
            <div className="bg-white dark:bg-[#0f172a] rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm sticky top-6">
                <h4 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">O Terminal HFT</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 uppercase font-bold tracking-wider">{sidebarInfo.title}</p>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        {sidebarInfo.text}
                    </p>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                       <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                       <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                         Lembre-se: Todas as calculadoras assumem liquidez disponível. Sempre verifique os limites da casa antes de operar. Os resultados gerados nesta página são probabilidades puramente matemáticas e não recomendações financeiras. A responsabilidade é sua.
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