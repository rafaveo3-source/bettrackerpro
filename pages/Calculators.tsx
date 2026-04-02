import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Plus, Scale, Percent, ArrowRightLeft, 
  Target, TrendingUp, AlertTriangle, Lock, Crown, Radar, 
  Activity, Crosshair, BarChart4, Zap, DollarSign, Goal, Lightbulb,
  Clock, Flag, ShieldAlert, FileText, Eraser, Eye, Search, Flame
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
  const [hftMode, setHftMode] = useState<'grid' | 'single'>('grid');
  const [liveTextData, setLiveTextData] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  
  const [liveCurrentOdd, setLiveCurrentOdd] = useState('');
  const [liveContext, setLiveContext] = useState<any>(null); 
  const [gridContext, setGridContext] = useState<any[] | null>(null); 

  const checkAiLimit = () => {
     if (userEmail === "rafaelancelmo.castro@gmail.com") return true;
     return canUseAiScan ? canUseAiScan() : false;
  };

  const handleIncrementScan = () => {
      if (userEmail !== "rafaelancelmo.castro@gmail.com" && typeof incrementAiScan === 'function') {
          incrementAiScan();
      }
  };

  // 🔥 MOTOR NLP (IA API)
  const processNLPEngine = async () => {
    if (!isPro) { setToast({ type: 'error', message: 'Exclusivo PRO.' }); return; }
    if (!checkAiLimit()) { setToast({ type: 'error', message: 'Limite de Scans atingido.' }); return; }
    if (!liveTextData || liveTextData.trim().length < 20) { setToast({ type: 'error', message: 'Cole os dados da página primeiro.' }); return; }

    setIsScanning(true);
    if (hftMode === 'grid') setGridContext(null); else setLiveContext(null);

    try {
        const response = await fetch('/api/live-nlp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ textData: liveTextData, email: userEmail, mode: hftMode })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Falha na conexão com a IA.');
        
        if (hftMode === 'grid') {
            if (data && data.matches && data.matches.length > 0) {
                setGridContext(data.matches);
                handleIncrementScan();
                setToast({ type: 'success', message: 'Ouro Minerado! Melhores jogos filtrados.' });
            } else {
                throw new Error('Nenhum jogo com padrão claro encontrado na grade.');
            }
        } else {
            if (data && data.min > 0) {
               setLiveContext(data);
               handleIncrementScan();
               setToast({ type: 'success', message: 'Leitura de jogo concluída!' });
            } else {
               throw new Error('Não foi possível extrair o relógio (minuto) do jogo.');
            }
        }
    } catch (e: any) {
        setToast({ type: 'error', message: e.message || 'Erro na leitura do texto ao vivo.' });
    } finally { setIsScanning(false); }
  };

  // 🔥 MOTOR DE AUTO-DISCOVERY (Matemática Pura - Reativo à ODD)
  const runAutoDiscoveryHFT = () => {
      if (!liveContext) return null;

      const { homeTeam, awayTeam, score, min, totalGoals, totalCorners, apPress, apDef, sot, sofft, pressureTrend, matchTemperature, needsGoal } = liveContext;
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

      // Poisson Cantos
      let cornerRateOld = ((apP * 0.06) + (sT * 0.25) + (sOff * 0.20)) / m; 
      let cornerLambda = cornerRateOld * remainingTime;
      if (needsGoal) cornerLambda *= 1.25;

      // Poisson Gols
      let goalRateOld = ((sT * 0.16) + (sOff * 0.05) + (apP * 0.005)) / m;
      let goalLambda = goalRateOld * remainingTime;
      if (sT >= 2 && sOff >= 3) goalLambda *= 1.3; 
      if (apD > (apP * 0.5)) goalLambda *= 1.1; 
      if (needsGoal) goalLambda *= 1.15;

      let scenarios = [];

      if (isHT && m >= 20 && m <= 43) {
          scenarios.push({ id: 'ht_corner', market: 'Escanteios', name: `Canto Asiático HT (+ de ${currCorners + 0.5})`, lambda: cornerLambda, type: 'corner' });
          scenarios.push({ id: 'ht_goal', market: 'Gols', name: `Gols HT (+ de ${currGoals + 0.5})`, lambda: goalLambda, type: 'goal' });
      } else if (!isHT && m >= 60 && m <= 88) {
          scenarios.push({ id: 'ft_corner', market: 'Escanteios', name: `Canto Asiático FT (+ de ${currCorners + 0.5})`, lambda: cornerLambda, type: 'corner' });
          scenarios.push({ id: 'ft_goal', market: 'Gols', name: `Gols FT (+ de ${currGoals + 0.5})`, lambda: goalLambda, type: 'goal' });
      }

      if (scenarios.length === 0) {
          return { error: `O relógio (${m}') está numa zona morta (sem EV+ claro). Aguarde a janela de HT (20-42') ou FT (60-88').` };
      }

      let bestScenario: any = null;
      let maxScore = -1;

      scenarios.forEach(scen => {
          const p0 = poissonExact(0, scen.lambda);
          const probBater = (1 - p0) * 100;
          
          let cScore = probBater;
          
          if (scen.type === 'corner' && appm > 1.0 && sT <= 2) cScore += 15; 
          if (scen.type === 'goal' && sT >= 2 && fieldTilt > 55) cScore += 20; 

          if (pressureTrend === 'increasing') cScore += 10;
          if (needsGoal) cScore += 8;
          if (matchTemperature === 'intense') cScore += 5;

          if (cScore > maxScore) {
              maxScore = cScore;
              bestScenario = { ...scen, probReal: probBater, finalScore: Math.min(100, cScore) };
          }
      });

      if (!bestScenario) return null;

      const fairOdd = bestScenario.probReal > 0 ? 100 / bestScenario.probReal : 0;
      const ev = odd > 0 ? ((bestScenario.probReal / 100) * odd - 1) * 100 : 0; 

      let label = '🔴 FUJA DESSE JOGO'; let color = 'red';
      let actionMessage = 'MODELO REJEITA A ENTRADA';

      if (bestScenario.finalScore >= 70) {
          if (odd === 0) { label = '🔒 ALTO VALOR (AGUARDANDO ODD)'; color = 'green'; actionMessage = `BUSQUE ODD ACIMA DE @${fairOdd.toFixed(2)}`; }
          else if (ev > 2) { label = '🔒 ENTRADA APROVADA (EV+)'; color = 'green'; actionMessage = `ENTRADA APROVADA (EV +${ev.toFixed(1)}%)`; }
          else { label = '🟡 AGUARDE A ODD VALORIZAR'; color = 'yellow'; actionMessage = `ODD ESMAGADA. ESPERE BATER @${fairOdd.toFixed(2)}`; }
      }
      else if (bestScenario.finalScore >= 50) {
          if (odd === 0) { label = '🟢 LEITURA POSITIVA'; color = 'green'; actionMessage = `BUSQUE ODD ACIMA DE @${fairOdd.toFixed(2)}`; }
          else if (ev > 0) { label = '🟢 ENTRADA APROVADA'; color = 'green'; actionMessage = `ENTRADA APROVADA (EV +${ev.toFixed(1)}%)`; }
          else { label = '⚠️ ODD SEM VALOR'; color = 'yellow'; actionMessage = `ESPERE A ODD VALORIZAR PARA @${fairOdd.toFixed(2)}`; }
      }

      let reasons = [];
      if (fieldTilt >= 65) reasons.push(`Amasso territorial (Controle de ${fieldTilt.toFixed(0)}% das ações)`);
      if (pressureTrend === 'increasing') reasons.push('Blitz ligada: Time acelerou o ritmo no Radar recente');
      if (needsGoal) reasons.push('Modo desespero: Precisa do resultado (Padrão Kamikaze ativado)');
      if (bestScenario.type === 'goal' && sT >= 2) reasons.push(`Mira calibrada: ${sT} chutes no alvo gerando muito xG`);
      if (bestScenario.type === 'corner' && appm > 0.9) reasons.push(`Chuva de ataques: ${appm.toFixed(2)} ataques perigosos/min`);
      if (odd > 0 && ev > 5) reasons.push(`Odd de muito Valor (+${ev.toFixed(1)}% EV encontrado)`);

      let projection = "";
      let smartWarning = "";
      let tipsterAdvice = "";

      if (bestScenario.type === 'corner') {
          tipsterAdvice = `DICA DE OURO: A casa de apostas sempre tenta forçar uma linha alta (+${currCorners + 1.5}). Tenha paciência! Aguarde o relógio andar, a linha cair para o Asiático (+${currCorners + 1.0}) ou Limite (+${currCorners + 0.5}) e pegue quando a odd bater @1.75+.`;
      } else if (bestScenario.type === 'goal') {
          tipsterAdvice = `DICA DE OURO: Nunca compre odds esmagadas em gols. Se a odd estiver muito abaixo da Odd Justa (@${fairOdd.toFixed(2)}), espere o tempo passar. O gol pode sair a qualquer momento com esse volume.`;
      }

      if (isHT) {
          if (bestScenario.type === 'corner') {
              projection = `Se esse amasso continuar no 2º tempo, a linha de Mais de ${currCorners + 4.5} Cantos FT vai abrir com muito valor. Fique de olho na volta.`;
              smartWarning = `Se o ritmo cair bruscamente nos próximos 5 min ou o time favorito fizer um gol, ABORTE imediatamente a operação HT.`;
          } else {
              projection = `Jogo aberto e vertical. O mercado de Mais de ${currGoals + 1.5} Gols FT será a principal rota de lucro na segunda etapa.`;
              smartWarning = `Cuidado com contra-ataques! Se o time dominado achar um gol isolado, o jogo pode truncar. Proteja sua stake.`;
          }
      } else {
          if (m < 85) {
             projection = `Se o placar não mudar até os 86', a entrada no 'Canto Zóio' (Canto Limite Final) será muito clara pelo nível de abafa.`;
             if (bestScenario.type === 'corner') smartWarning = `Se a odd asiática não bater @1.80 a tempo, pule fora. Não compre odds esmagadas na reta final.`;
          } else {
             projection = `Reta finalíssima. Defesas expostas. Padrão puro de Kamikaze para buscar o último suspiro (Zóio) com odd estourada.`;
             smartWarning = `Regra de Ouro: Entradas no 'Apagar das Luzes' exigem gestão rigorosa (Máx 0.5% a 1% da banca). É cara ou coroa tático.`;
          }
      }

      return { 
          ...bestScenario, homeTeam, awayTeam, score, min: m, appm, fieldTilt, ev, fairOdd, label, color, reasons, projection, smartWarning, tipsterAdvice, actionMessage 
      };
  };

  // Variável computada a cada re-render (Reatividade pura!)
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
      case 'dutching': return { title: 'Gestão de Risco', text: 'O Dutching divide a sua exposição entre múltiplas seleções, diluindo o risco do investimento.' };
      case 'live_hft': return { title: 'Live HFT Engine', text: 'Motor Quantitativo Ao Vivo. Cole as estatísticas da partida e o robô cruzará Field Tilt, Momentum e Relógio para te dar a calada exata de Gols ou Cantos.' };
      default: return { title: 'Ferramentas Analíticas', text: 'Tome decisões baseadas em matemática e fuja do feeling.' };
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
      
      <div className="flex flex-wrap md:grid md:grid-cols-4 xl:grid-cols-8 gap-2 mb-6 px-4 md:px-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setLiveContext(null); setGridContext(null); setLiveTextData(''); setLiveCurrentOdd(''); }}
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
                LIVE HFT ENGINE (DUPLO MODO)
            ========================================= */}
            {activeTab === 'live_hft' && !isPro && <ProLockScreen />}
            {activeTab === 'live_hft' && isPro && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-4 sm:p-8 shadow-sm relative overflow-hidden">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <h2 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <Radar size={24} className="shrink-0"/> Live HFT
                      </h2>
                      <span className="border px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm dark:shadow-none bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20 w-fit">
                         <Zap size={12} /> Auto-Discovery Engine
                      </span>
                   </div>

                   <div className="flex bg-slate-100 dark:bg-[#09090b] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 shadow-inner">
                      <button onClick={() => { setHftMode('grid'); setLiveTextData(''); setGridContext(null); setLiveCurrentOdd(''); }} className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${hftMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                          1. Minerador de Grade
                      </button>
                      <button onClick={() => { setHftMode('single'); setLiveTextData(''); setLiveContext(null); setLiveCurrentOdd(''); }} className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${hftMode === 'single' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                          2. Raio-X (Entrada)
                      </button>
                   </div>

                   <div className="relative group overflow-hidden rounded-[2rem] border border-indigo-200 dark:border-indigo-500/20 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-all p-1 flex flex-col shadow-sm dark:shadow-inner bg-indigo-50/30 dark:bg-[#09090b] mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 gap-4">
                         <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                             <FileText size={18} className="text-indigo-500 dark:text-indigo-400 shrink-0"/>
                             <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 leading-tight">
                                {hftMode === 'grid' ? 'Cole a Grade Completa (Ctrl+A / Ctrl+V)' : 'Cole a página do Jogo Específico'}
                             </span>
                         </div>
                         <div className="flex items-center gap-3 self-end sm:self-auto">
                             <div className="border px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm bg-indigo-100 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                                 <Zap size={10} fill="currentColor" /> {Math.max(0, 10 - (aiScansUsedToday||0))} Scans
                             </div>
                             <button onClick={() => { setLiveTextData(''); setLiveContext(null); setGridContext(null); setLiveCurrentOdd(''); }} className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-white dark:bg-transparent rounded-md border border-transparent hover:border-red-100 dark:hover:border-transparent shrink-0">
                                 <Eraser size={16}/>
                             </button>
                         </div>
                      </div>

                      <textarea
                          value={liveTextData}
                          onChange={(e) => setLiveTextData(e.target.value)}
                          placeholder={hftMode === 'grid' ? "Cole a grade de todos os jogos ao vivo aqui. A IA vai filtrar apenas os que têm padrão de Ouro..." : "Cole as estatísticas daquele jogo específico aqui. A IA vai definir a Odd Justa e a Entrada..."}
                          className="w-full bg-transparent text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 p-6 min-h-[160px] outline-none resize-none font-mono text-xs leading-relaxed"
                          disabled={isScanning}
                      />

                      <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-4">
                          <button onClick={processNLPEngine} disabled={isScanning || !liveTextData} className="w-full sm:w-auto text-[11px] font-black uppercase tracking-widest text-white px-8 py-4 rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500 dark:shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                             {hftMode === 'grid' ? <Search size={16}/> : <Zap size={16} fill="currentColor" />} 
                             {hftMode === 'grid' ? 'Encontrar Ouro na Grade' : 'Gerar Raio-X do Jogo'}
                          </button>
                      </div>

                      {isScanning && (
                          <div className="absolute inset-0 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                              <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-0 left-0 h-1.5 shadow-[0_0_30px_currentColor] bg-indigo-500 text-indigo-500" />
                              <Sparkles size={40} className="mb-4 animate-pulse text-indigo-500" />
                              <p className="font-mono font-bold text-[10px] sm:text-xs uppercase tracking-widest text-center px-4 mt-2 text-indigo-600 dark:text-indigo-400">
                                {hftMode === 'grid' ? 'Varrendo todos os jogos...' : 'Cruzando métricas de Gols e Cantos...'}
                              </p>
                          </div>
                      )}
                   </div>
                   
                   <AnimatePresence>
                     {/* ========================================================
                         RESULTADO: MINERADOR DE GRADE
                         ======================================================== */}
                     {hftMode === 'grid' && gridContext && gridContext.length > 0 && (
                         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mt-8">
                             <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                                <Flame size={16} /> Radar de Ouro (Top Jogos)
                             </h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {gridContext.map((jogo: any, idx: number) => (
                                     <div key={idx} className="bg-white dark:bg-[#020617] border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5 shadow-sm dark:shadow-inner relative overflow-hidden group hover:border-amber-400 dark:hover:border-amber-500/60 transition-colors">
                                         <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"></div>
                                         <div className="flex justify-between items-start mb-3 pl-2">
                                             <div>
                                                <span className="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit mb-2">
                                                    <Clock size={10}/> {jogo.time || "Ao Vivo"}
                                                </span>
                                                <h4 className="text-sm font-black text-slate-800 dark:text-white leading-tight">{jogo.match || "Jogo Desconhecido"}</h4>
                                             </div>
                                             <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-sm font-black font-mono text-slate-700 dark:text-slate-300">
                                                 {jogo.score || "-"}
                                             </div>
                                         </div>
                                         <div className="pl-2">
                                            <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5"><Target size={12}/> {jogo.market || "Padrão de Pressão"}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{jogo.reason || "Volume ofensivo detectado."}</p>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </motion.div>
                     )}

                     {/* ========================================================
                         RESULTADO: RAIO-X SINGLE MATCH
                         ======================================================== */}
                     {hftMode === 'single' && liveContext && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="relative z-10 overflow-hidden">
                         
                         <div className="mb-6 relative overflow-hidden rounded-2xl group border border-transparent dark:border-slate-800 mt-6">
                             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10 dark:opacity-20 group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity"></div>
                             <div className="bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-sm p-4 sm:p-5 border relative flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm dark:shadow-none border-indigo-500/20">
                                 <div className="p-3.5 rounded-xl shrink-0 border shadow-sm dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-500 dark:text-indigo-400 dark:shadow-indigo-500/20 hidden sm:block">
                                    <DollarSign size={24} />
                                 </div>
                                 <div className="flex-1 w-full">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] block mb-1.5 text-indigo-600 dark:text-indigo-500">Qual a Odd na Bet365 agora?</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">@</span>
                                        <input 
                                            type="number" step="0.01" min="1.00" placeholder="Ex: 1.83 (Opcional)" 
                                            value={liveCurrentOdd} 
                                            onChange={e => {
                                                let val = e.target.value.replace(/[^0-9.]/g, '');
                                                if ((val.match(/\./g) || []).length > 1) val = val.replace(/\.(?=[^.]*$)/, '');
                                                setLiveCurrentOdd(val);
                                            }} 
                                            className="w-full bg-slate-50 dark:bg-[#020617] border border-indigo-200 dark:border-indigo-500/30 text-xl font-mono font-black text-slate-900 dark:text-white outline-none rounded-xl py-3 pl-10 pr-4 focus:border-indigo-500 transition-colors" 
                                        />
                                    </div>
                                 </div>
                             </div>
                         </div>

                         {autoResult && !autoResult.error ? (
                         <div className="bg-slate-50 dark:bg-[#020617] rounded-[2rem] border border-slate-200 dark:border-slate-800 p-4 sm:p-6 overflow-hidden relative shadow-md dark:shadow-2xl mt-4">
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] dark:opacity-[0.03]"></div>
                             
                             <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[60px] dark:blur-[80px] -mr-20 -mt-20 pointer-events-none transition-colors duration-1000 ${
                                autoResult.color === 'green' ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 
                                autoResult.color === 'yellow' ? 'bg-yellow-500/10' : 'bg-red-500/5 dark:bg-red-500/10'
                             }`}></div>

                             {/* BANNER DO JOGO */}
                             <div className="relative z-10 bg-white dark:bg-slate-900/80 p-4 rounded-xl mb-6 flex flex-col sm:flex-row justify-between items-center border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none gap-3">
                                 <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
                                    <span className="font-bold text-slate-800 dark:text-white uppercase text-xs sm:text-sm text-right flex-1 sm:flex-auto truncate">{autoResult.homeTeam}</span>
                                    <span className="bg-indigo-500 text-white px-3 py-1 rounded-lg font-black shrink-0">{autoResult.score}</span>
                                    <span className="font-bold text-slate-800 dark:text-white uppercase text-xs sm:text-sm flex-1 sm:flex-auto truncate">{autoResult.awayTeam}</span>
                                 </div>
                                 <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black flex items-center gap-1.5 shrink-0 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-200 dark:border-indigo-500/20"><Clock size={14}/> {autoResult.min}'</span>
                             </div>

                             {/* TOPO: APOSTA SUGERIDA */}
                             <div className="relative z-10 flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                                 <div className="flex-shrink-0 flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none min-w-[150px]">
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-4 text-center">Índice de Confiança</p>
                                    
                                    <div className="relative w-20 h-20 flex items-center justify-center">
                                       <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
                                         <circle cx="36" cy="36" r="32" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray={`${(autoResult.finalScore / 100) * 201} 201`} className={autoResult.color === 'green' ? 'text-emerald-500' : autoResult.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'} />
                                       </svg>
                                       <span className="text-2xl font-black text-slate-800 dark:text-white z-10">{autoResult.finalScore.toFixed(0)}</span>
                                    </div>

                                    <span className={`mt-4 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded text-center w-full ${autoResult.color === 'green' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : autoResult.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                                        {autoResult.label}
                                    </span>
                                 </div>

                                 <div className="flex-1 flex flex-col justify-center">
                                     <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center gap-2"><Target size={14} className="text-indigo-500"/> Recomendação do Robô</p>
                                     <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 p-4 rounded-xl mb-4 shadow-sm dark:shadow-none">
                                         <h3 className="text-sm sm:text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2 leading-tight">
                                             {autoResult.type === 'corner' ? <Flag size={18} className="shrink-0"/> : <Goal size={18} className="shrink-0"/>} {autoResult.name}
                                         </h3>
                                         <p className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">
                                            Probabilidade Real: <strong className="text-slate-800 dark:text-white">{autoResult.probReal.toFixed(1)}%</strong> | Odd Justa: <strong className="text-indigo-600 dark:text-indigo-400">@{autoResult.fairOdd.toFixed(2)}</strong>
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

                             {/* PROJEÇÃO E ALERTAS TÁTICOS */}
                             <div className="space-y-3 mb-6 relative z-10">
                                 {autoResult.tipsterAdvice && (
                                     <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl text-[11px] sm:text-xs font-medium flex items-start gap-3 shadow-sm dark:shadow-inner">
                                         <Crown size={18} className="shrink-0 mt-0.5 text-emerald-500 dark:text-emerald-400" /> 
                                         <span className="leading-relaxed">{autoResult.tipsterAdvice}</span>
                                     </div>
                                 )}
                                 {autoResult.projection && (
                                     <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 p-4 rounded-2xl text-[11px] sm:text-xs font-medium flex items-start gap-3 shadow-sm dark:shadow-inner">
                                         <Eye size={18} className="shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" /> 
                                         <span className="leading-relaxed"><strong>Visão de Futuro:</strong> {autoResult.projection}</span>
                                     </div>
                                 )}
                                 {autoResult.smartWarning && (
                                     <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-2xl text-[11px] sm:text-xs font-medium flex items-start gap-3 shadow-sm dark:shadow-inner">
                                         <ShieldAlert size={18} className="shrink-0 mt-0.5 text-amber-500 dark:text-amber-400" /> 
                                         <span className="leading-relaxed"><strong>Alerta Tático:</strong> {autoResult.smartWarning}</span>
                                     </div>
                                 )}
                             </div>

                             {/* SINAL RADIOATIVO */}
                             <div className="relative z-20 mt-4">
                               {autoResult.color === 'green' && (
                                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative group cursor-pointer">
                                      <div className="absolute -inset-0.5 rounded-2xl blur opacity-30 dark:opacity-40 group-hover:opacity-50 dark:group-hover:opacity-60 transition animate-pulse bg-gradient-to-r from-emerald-500 to-teal-400"></div>
                                      <div className="relative w-full py-4 rounded-2xl font-black text-[10px] sm:text-xs md:text-sm tracking-widest uppercase text-center flex items-center justify-center gap-2 shadow-sm dark:shadow-none bg-emerald-500 text-white dark:text-slate-950">
                                         <Zap fill="currentColor" size={18} className="animate-bounce shrink-0"/> {autoResult.actionMessage}
                                      </div>
                                  </motion.div>
                               )}
                               {autoResult.color === 'yellow' && (
                                  <div className="bg-yellow-500 text-white dark:text-slate-950 w-full py-4 rounded-2xl font-black text-[10px] sm:text-xs uppercase text-center flex justify-center items-center gap-2 shadow-sm dark:shadow-none">
                                    <AlertTriangle size={16} className="shrink-0"/> {autoResult.actionMessage}
                                  </div>
                               )}
                               {autoResult.color === 'red' && (
                                  <div className="bg-white dark:bg-[#09090b] border border-red-200 dark:border-red-500/30 text-red-500 dark:text-red-400 w-full py-4 rounded-2xl font-black text-[10px] sm:text-xs tracking-widest uppercase text-center flex items-center justify-center gap-2 shadow-sm dark:shadow-inner">
                                     <AlertTriangle size={16} className="shrink-0 text-red-500"/> {autoResult.actionMessage}
                                  </div>
                               )}
                             </div>
                             
                             <p className="text-center text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500/70 font-bold uppercase tracking-[0.2em] mt-6 px-4">
                               ⚠️ Atenção: Projeção baseada em estatística. Não constitui recomendação financeira.
                             </p>
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
                         Lembre-se: Todas as calculadoras assumem liquidez. Verifique os limites da casa antes de operar. Resultados são probabilidades matemáticas e não recomendações de entrada.
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