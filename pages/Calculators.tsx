import React, { useState } from 'react';
import { 
  Info, 
  ChevronDown, 
  Sparkles, 
  Trash2, 
  Plus
} from 'lucide-react';
import { useBetStore } from '../store/useBetStore';
import { motion, AnimatePresence } from 'framer-motion';

const Calculators: React.FC = () => {
  const { currentBankrollBalance } = useBetStore();
  const [activeTab, setActiveTab] = useState('dutching');
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);

  const toggleInfo = (id: string) => setExpandedInfo(expandedInfo === id ? null : id);

  // --- DUTCHING ---
  const [dutchTotalStake, setDutchTotalStake] = useState('100');
  const [dutchSelections, setDutchSelections] = useState([
    { id: 1, name: 'Seleção A', odds: '2.50', stake: 0, profit: 0 },
    { id: 2, name: 'Seleção B', odds: '3.20', stake: 0, profit: 0 }
  ]);

  const addDutchSelection = () => {
    setDutchSelections([...dutchSelections, { id: Date.now(), name: `Seleção ${String.fromCharCode(65 + dutchSelections.length)}`, odds: '', stake: 0, profit: 0 }]);
  };

  const removeDutchSelection = (id: number) => {
      setDutchSelections(dutchSelections.filter(s => s.id !== id));
  };

  const calculateDutching = () => {
  const totalStake = parseFloat(dutchTotalStake);

  if (!totalStake || totalStake <= 0) return;

  const impliedProbs = dutchSelections.map(s => {
    const odd = parseFloat(s.odds);
    return odd > 1 ? 1 / odd : 0;
  });

  const totalImplied = impliedProbs.reduce((a, b) => a + b, 0);

  if (totalImplied <= 0) return;

  const newSelections = dutchSelections.map((s, i) => {
    const stake = totalStake * (impliedProbs[i] / totalImplied);
    const odd = parseFloat(s.odds || '0');
    const profit = odd > 1 ? (stake * odd) - totalStake : 0;
    return { ...s, stake: stake || 0, profit: profit || 0 };
  });

  setDutchSelections(newSelections);
};

  // --- KELLY ---
  const [kellyOdds, setKellyOdds] = useState('2.00');
  const [kellyProb, setKellyProb] = useState('55');
  const [kellyFraction, setKellyFraction] = useState('1'); 
  
  const calculateKelly = () => {
    const b = parseFloat(kellyOdds) - 1;
    const p = parseFloat(kellyProb) / 100;
    const q = 1 - p;
    if (b <= 0) return "0.00";
    const f = (b * p - q) / b;
    return (f * parseFloat(kellyFraction) * 100).toFixed(2);
  };
  
  const kellyResult = calculateKelly();
  const kellyMoney = (parseFloat(kellyResult) / 100) * currentBankrollBalance;

  // --- MÉTRICAS AVANÇADAS KELLY ---

const decimalOdds = parseFloat(kellyOdds);
const userProb = parseFloat(kellyProb) / 100;

const impliedProb = decimalOdds > 1 ? 1 / decimalOdds : 0;
const impliedPercent = impliedProb * 100;

const edgePercent = (userProb - impliedProb) * 100;

// Expected Value
const ev = decimalOdds > 1 ? (userProb * decimalOdds) - 1 : 0;
const evPercent = ev * 100;

// Classificação de Agressividade
let aggressionLabel = "Sem Aposta";
let aggressionColor = "text-slate-400";

const kellyNumeric = parseFloat(kellyResult);

// --- SIMULADOR DE CRESCIMENTO ---
const [simulationBets, setSimulationBets] = useState('100');

const betsCount = parseInt(simulationBets) || 0;

const projectedBankroll =
  ev > 0 && betsCount > 0
    ? currentBankrollBalance * Math.pow(1 + ev, betsCount)
    : currentBankrollBalance;

const growthPercent =
  ev > 0 && betsCount > 0
    ? ((projectedBankroll / currentBankrollBalance - 1) * 100)
    : 0;

if (kellyNumeric > 10) {
  aggressionLabel = "Agressiva";
  aggressionColor = "text-red-500";
} else if (kellyNumeric > 5) {
  aggressionLabel = "Moderada";
  aggressionColor = "text-yellow-500";
} else if (kellyNumeric > 0) {
  aggressionLabel = "Conservadora";
  aggressionColor = "text-emerald-500";
}

  return (
    <div className="space-y-6 pb-20 w-full overflow-x-hidden">
       {/* HEADER PADRÃO PREMIUM */}
<div className="flex flex-col gap-2">

  {/* Micro label superior */}
  <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-widest">
    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
    Strategic Math Engine
  </div>

  {/* Título principal */}
  <div>

  {/* Headline principal */}
  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
    Calculadoras Estratégicas <span className="text-slate-400 dark:text-slate-700 text-lg">///</span>
  </h1>

  {/* Subheadline */}
  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">
    Gestão matemática & edge profissional.
  </p>
</div>

</div>
      {/* ✅ SOLUÇÃO DEFINITIVA: Grid Responsivo (Stack no Mobile, Linha no Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">

  {/* DUTCHING */}
  <button
    onClick={() => setActiveTab('dutching')}
    className={`relative w-full flex items-center justify-center px-4 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
      activeTab === 'dutching'
        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
        : 'bg-white dark:bg-[#0f172a] text-slate-500 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
    }`}
  >
    Dutching
    {activeTab === 'dutching' && (
      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-white/40 animate-pulse rounded-b-xl" />
    )}
  </button>

  {/* KELLY */}
  <button
    onClick={() => setActiveTab('kelly')}
    className={`relative w-full flex items-center justify-center px-4 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
      activeTab === 'kelly'
        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
        : 'bg-white dark:bg-[#0f172a] text-slate-500 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
    }`}
  >
    Critério de Kelly
    {activeTab === 'kelly' && (
      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-white/40 animate-pulse rounded-b-xl" />
    )}
  </button>

</div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 min-w-0 w-full">
            
            {activeTab === 'dutching' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 shadow-sm w-full overflow-hidden">
                    {/* ACCORDION INFO */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-500/10 mb-6">
                        <button onClick={() => toggleInfo('dutching')} className="flex justify-between items-center w-full text-left">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-blue-500 shrink-0" />
                                <span className="text-xs md:text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-wide">O que é Dutching?</span>
                            </div>
                            <ChevronDown size={16} className={`text-blue-500 transition-transform ${expandedInfo === 'dutching' ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {expandedInfo === 'dutching' && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-3 leading-relaxed font-medium">
                                        Técnica avançada para dividir seu investimento entre vários resultados, garantindo o mesmo lucro.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Calculadora Dutching</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wide mt-1">Distribuição de Risco</p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 w-full md:w-auto">
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-2">Total</span>
                            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                            <input 
                                type="number" 
                                value={dutchTotalStake} 
                                onChange={(e) => setDutchTotalStake(e.target.value)} 
                                className="bg-transparent text-right w-full md:w-24 font-mono font-bold outline-none text-slate-900 dark:text-white text-lg" 
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] font-black text-slate-400 uppercase px-4 tracking-widest">
                            <div className="col-span-1">#</div>
                            <div className="col-span-4">Seleção</div>
                            <div className="col-span-3">Odds</div>
                            <div className="col-span-4 text-right">Stake Sugerida</div>
                        </div>

                        {dutchSelections.map((sel, idx) => (
                            <div key={sel.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                {/* DESKTOP LAYOUT */}
                                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-1 flex items-center justify-center w-8 h-8 bg-white dark:bg-slate-800 rounded-lg text-xs text-slate-400 font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <div className="col-span-4">
                                        <input 
                                            type="text" 
                                            value={sel.name}
                                            onChange={(e) => {
                                                const newSels = [...dutchSelections];
                                                newSels[idx].name = e.target.value;
                                                setDutchSelections(newSels);
                                            }}
                                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none text-sm font-bold focus:border-emerald-500 transition-colors"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input 
                                            type="number" 
                                            value={sel.odds}
                                            onChange={(e) => {
                                                const newSels = [...dutchSelections];
                                                newSels[idx].odds = e.target.value;
                                                setDutchSelections(newSels);
                                            }}
                                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none text-sm font-mono font-bold focus:border-emerald-500 transition-colors"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="col-span-4 text-right">
                                        <p className="text-emerald-600 dark:text-emerald-400 font-black font-mono text-lg">R$ {sel.stake.toFixed(2)}</p>
                                        <p className="text-[10px] text-emerald-600/60 dark:text-emerald-500/60 font-bold uppercase tracking-wide">Lucro: R$ {sel.profit.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* MOBILE CARD LAYOUT */}
                                <div className="md:hidden flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center justify-center w-8 h-8 bg-white dark:bg-slate-800 rounded-lg text-xs text-slate-400 font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <button onClick={() => removeDutchSelection(sel.id)} className="text-red-400 p-1"><Trash2 size={16} /></button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Seleção</label>
                                            <input 
                                                type="text" 
                                                value={sel.name}
                                                onChange={(e) => {
                                                    const newSels = [...dutchSelections];
                                                    newSels[idx].name = e.target.value;
                                                    setDutchSelections(newSels);
                                                }}
                                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none text-sm font-bold focus:border-emerald-500"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Odds</label>
                                            <input 
                                                type="number" 
                                                value={sel.odds}
                                                onChange={(e) => {
                                                    const newSels = [...dutchSelections];
                                                    newSels[idx].odds = e.target.value;
                                                    setDutchSelections(newSels);
                                                }}
                                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none text-sm font-mono font-bold focus:border-emerald-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-500/10 flex justify-between items-center mt-1">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase">Resultado</span>
                                        <div className="text-right">
                                            <p className="text-emerald-600 dark:text-emerald-400 font-black font-mono text-base">R$ {sel.stake.toFixed(2)}</p>
                                            <p className="text-[9px] text-emerald-600/60 dark:text-emerald-500/60 font-bold uppercase">Lucro: R$ {sel.profit.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex flex-col gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <button onClick={addDutchSelection} className="w-full text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all">
                            <Plus size={16} /> Nova Seleção
                        </button>
                        <button onClick={calculateDutching} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-widest py-4 px-10 rounded-xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95">
                            Calcular Distribuição
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'kelly' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 shadow-sm w-full overflow-hidden">
                    {/* ACCORDION INFO */}
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-500/10 mb-6">
                        <button onClick={() => toggleInfo('kelly')} className="flex justify-between items-center w-full text-left">
                            <div className="flex items-center gap-2">
                                <Info size={16} className="text-purple-500 shrink-0" />
                                <span className="text-xs md:text-sm font-black text-purple-700 dark:text-purple-400 uppercase tracking-wide">O que é Critério de Kelly?</span>
                            </div>
                            <ChevronDown size={16} className={`text-purple-500 transition-transform ${expandedInfo === 'kelly' ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {expandedInfo === 'kelly' && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <p className="text-xs text-purple-600 dark:text-purple-300 mt-3 leading-relaxed font-medium">
                                        Fórmula para tamanho ideal de aposta baseada na vantagem.
                                    </p>
                                    <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-100 dark:border-purple-500/10">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Dica Pro</p>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                                            Use "Meio Kelly" para reduzir volatilidade.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-8">Critério de Kelly</h2>
                    
                    {/* MOBILE STACK */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Banca Atual (R$)</label>
                             <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-mono font-bold text-base truncate">
                                {currentBankrollBalance.toFixed(2)}
                             </div>
                        </div>
                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Fração Kelly</label>
                             <select 
                                value={kellyFraction} 
                                onChange={(e) => setKellyFraction(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none cursor-pointer font-bold text-sm focus:border-purple-500"
                             >
                                <option value="1">Completo (100%)</option>
                                <option value="0.5">Meio Kelly (50%)</option>
                                <option value="0.25">Quarto Kelly (25%)</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Odds</label>
                             <input type="number" value={kellyOdds} onChange={e => setKellyOdds(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-purple-500 font-mono font-bold" />
                        </div>
                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Probabilidade (%)</label>
                             <input type="number" value={kellyProb} onChange={e => setKellyProb(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-purple-500 font-mono font-bold" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/10 dark:to-slate-900/50 rounded-2xl p-6 flex flex-col items-center border border-purple-100 dark:border-purple-500/10 gap-4 text-center">
                         <p className="text-purple-800 dark:text-purple-300 text-xs font-black uppercase tracking-widest">Recomendação</p>
                         <h3 className={`text-4xl font-black tracking-tighter ${
  parseFloat(kellyResult) > 0 
    ? 'text-purple-600 dark:text-purple-400' 
    : 'text-slate-400'
}`}>{parseFloat(kellyResult) > 0 ? kellyResult : '0.00'}%</h3>
                         <p className="text-purple-600 dark:text-purple-400 font-mono font-bold text-sm bg-purple-100 dark:bg-purple-500/10 px-3 py-1 rounded-lg">
                            R$ {parseFloat(kellyResult) > 0 ? kellyMoney.toFixed(2) : '0.00'}
                         </p>
                    </div>
                    {parseFloat(kellyResult) <= 0 && (
  <div className="mt-4 text-center bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3">
    <p className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
      Sem Edge Matemática
    </p>
    <p className="text-[11px] text-red-500 dark:text-red-300 mt-1">
      A probabilidade informada não justifica aposta segundo Kelly.
    </p>
  </div>
)}

{/* MÉTRICAS AVANÇADAS */}
<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">

  {/* EV */}
  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">
      Expected Value (EV)
    </p>
    <p className={`text-lg font-black ${
      evPercent > 0 ? 'text-emerald-500' : 'text-red-500'
    }`}>
      {evPercent.toFixed(2)}%
    </p>
  </div>

  {/* EDGE */}
  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">
      Sua Vantagem
    </p>
    <p className={`text-lg font-black ${
      edgePercent > 0 ? 'text-emerald-500' : 'text-red-500'
    }`}>
      {edgePercent.toFixed(2)}%
    </p>
  </div>

  {/* Prob Implícita */}
  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">
      Prob. Implícita da Odd
    </p>
    <p className="text-lg font-black text-slate-700 dark:text-slate-300">
      {impliedPercent.toFixed(2)}%
    </p>
  </div>

  {/* Agressividade */}
  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">
      Perfil da Aposta
    </p>
    <p className={`text-lg font-black ${aggressionColor}`}>
      {kellyNumeric > 0 ? aggressionLabel : "Sem Edge"}
    </p>
  </div>

</div>

{/* SIMULADOR DE CRESCIMENTO */}
<div className="mt-10 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/10 dark:to-slate-900/50 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl p-6">

  <div className="flex justify-between items-center mb-6">
    <div>
      <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600">
        Simulação de Crescimento
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        Projeção baseada no EV atual
      </p>
    </div>

    <div className="flex items-center gap-2">
      <input
        type="number"
        value={simulationBets}
        onChange={(e) => setSimulationBets(e.target.value)}
        className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-center outline-none focus:border-emerald-500"
      />
      <span className="text-[10px] font-bold uppercase text-slate-400">
        Apostas
      </span>
    </div>
  </div>

  {ev > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
          Banca Inicial
        </p>
        <p className="text-lg font-black text-slate-800 dark:text-white font-mono">
          R$ {currentBankrollBalance.toFixed(2)}
        </p>
      </div>

      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
          Banca Projetada
        </p>
        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
          R$ {projectedBankroll.toFixed(2)}
        </p>
      </div>

      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
          Crescimento
        </p>
        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
          +{growthPercent.toFixed(2)}%
        </p>
      </div>
    </div>
  ) : (
    <div className="text-center text-red-500 text-sm font-bold">
      Simulação indisponível (EV ≤ 0)
    </div>
  )}

</div>
                </div>
            )}
        
        <div className="lg:col-span-1 space-y-6 w-full min-w-0">
            <div className="bg-white dark:bg-[#0f172a] rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                <h4 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Ações Rápidas</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 mb-2 uppercase font-bold tracking-wider">Dica de Gestão</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        Use o <strong className="text-emerald-600 dark:text-emerald-500">Kelly Fracionário</strong> para reduzir a volatilidade e proteger sua banca contra sequências negativas (bad runs).
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Calculators;