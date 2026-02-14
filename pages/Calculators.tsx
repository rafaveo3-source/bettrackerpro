import React, { useState } from 'react';
import { Share2, RefreshCw, Lock, ArrowRightLeft, Info, ChevronDown, Calculator, Sparkles, Trash2, Plus } from 'lucide-react';
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
    const impliedProbs = dutchSelections.map(s => (s.odds ? 1 / parseFloat(s.odds) : 0));
    const totalImplied = impliedProbs.reduce((a, b) => a + b, 0);
    const newSelections = dutchSelections.map((s, i) => {
      const stake = (totalStake * (impliedProbs[i] / totalImplied)) || 0;
      const profit = (stake * parseFloat(s.odds || '0')) - totalStake;
      return { ...s, stake, profit };
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

  // --- CONVERTER ---
  const [decimalOdd, setDecimalOdd] = useState('2.00');
  
  const toAmerican = (dec: number) => {
    if (dec >= 2) return `+${Math.round((dec - 1) * 100)}`;
    return `-${Math.round(100 / (dec - 1))}`;
  };

  const toFractional = (dec: number) => {
    const tolerance = 1.0E-6;
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = dec - 1;
    do {
        let a = Math.floor(b);
        let aux = h1; h1 = a * h1 + h2; h2 = aux;
        aux = k1; k1 = a * k1 + k2; k2 = aux;
        b = 1 / (b - a);
    } while (Math.abs(dec - 1 - h1 / k1) > dec * tolerance);
    return `${h1}/${k1}`;
  };

  return (
    <div className="space-y-6 pb-20 w-full overflow-x-hidden">
       <div className="flex items-center gap-3">
        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-600 dark:text-emerald-500">
             <Calculator size={24} />
        </div>
        <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Ferramentas Pro</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestão Matemática & Estratégia</p>
        </div>
      </div>

      {/* Tabs com Scroll Horizontal para Mobile */}
      <div className="flex gap-3 mb-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0 w-[calc(100%+3rem)] md:w-auto">
        <button onClick={() => setActiveTab('dutching')} className={`flex-shrink-0 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'dutching' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'bg-white dark:bg-[#0f172a] text-slate-500 border border-slate-200 dark:border-slate-800'}`}>Dutching</button>
        <button onClick={() => setActiveTab('kelly')} className={`flex-shrink-0 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'kelly' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'bg-white dark:bg-[#0f172a] text-slate-500 border border-slate-200 dark:border-slate-800'}`}>Critério de Kelly</button>
        <button onClick={() => setActiveTab('converter')} className={`flex-shrink-0 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'converter' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'bg-white dark:bg-[#0f172a] text-slate-500 border border-slate-200 dark:border-slate-800'}`}>Conversor Odds</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            
            {activeTab === 'dutching' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-sm">
                    {/* ACCORDION INFO */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-500/10 mb-8">
                        <button onClick={() => toggleInfo('dutching')} className="flex justify-between items-center w-full text-left">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-blue-500" />
                                <span className="text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-wide">O que é Dutching?</span>
                            </div>
                            <ChevronDown size={16} className={`text-blue-500 transition-transform ${expandedInfo === 'dutching' ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {expandedInfo === 'dutching' && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-3 leading-relaxed font-medium">
                                        Técnica avançada para dividir seu investimento entre vários resultados em um mesmo evento, garantindo o <strong className="text-blue-800 dark:text-white">mesmo lucro</strong> independente de qual seleção vença.
                                    </p>
                                    <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-blue-500/10">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Exemplo Prático</p>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                                            Apostar R$100 divididos entre Odds 2.50 e 3.20 para garantir lucro fixo de R$40.35 em qualquer cenário.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Calculadora Dutching</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wide mt-1">Distribuição de Risco</p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 w-full md:w-auto">
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-2">Aposta Total</span>
                            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                            <input 
                                type="number" 
                                value={dutchTotalStake} 
                                onChange={(e) => setDutchTotalStake(e.target.value)} 
                                className="bg-transparent text-right w-24 font-mono font-bold outline-none text-slate-900 dark:text-white text-lg" 
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] font-black text-slate-400 uppercase px-4 tracking-widest">
                            <div className="col-span-1">#</div>
                            <div className="col-span-4">Seleção</div>
                            <div className="col-span-3">Odds</div>
                            <div className="col-span-4 text-right">Stake Sugerida</div>
                        </div>

                        {dutchSelections.map((sel, idx) => (
                            <div key={sel.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
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
                                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none text-sm font-bold focus:border-emerald-500 transition-colors"
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
                                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none text-sm font-mono font-bold focus:border-emerald-500 transition-colors"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="col-span-4 text-right">
                                        <p className="text-emerald-600 dark:text-emerald-400 font-black font-mono text-lg">R$ {sel.stake.toFixed(2)}</p>
                                        <p className="text-[10px] text-emerald-600/60 dark:text-emerald-500/60 font-bold uppercase tracking-wide">Lucro: R$ {sel.profit.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* MOBILE CARD LAYOUT */}
                                <div className="md:hidden flex flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center justify-center w-8 h-8 bg-white dark:bg-slate-800 rounded-lg text-xs text-slate-400 font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <button onClick={() => removeDutchSelection(sel.id)} className="text-red-400"><Trash2 size={16} /></button>
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Seleção</label>
                                        <input 
                                            type="text" 
                                            value={sel.name}
                                            onChange={(e) => {
                                                const newSels = [...dutchSelections];
                                                newSels[idx].name = e.target.value;
                                                setDutchSelections(newSels);
                                            }}
                                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none text-sm font-bold focus:border-emerald-500 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Odds</label>
                                        <input 
                                            type="number" 
                                            value={sel.odds}
                                            onChange={(e) => {
                                                const newSels = [...dutchSelections];
                                                newSels[idx].odds = e.target.value;
                                                setDutchSelections(newSels);
                                            }}
                                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none text-sm font-mono font-bold focus:border-emerald-500 transition-colors"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/10 flex justify-between items-center mt-2">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Resultado</span>
                                        <div className="text-right">
                                            <p className="text-emerald-600 dark:text-emerald-400 font-black font-mono text-lg">R$ {sel.stake.toFixed(2)}</p>
                                            <p className="text-[10px] text-emerald-600/60 dark:text-emerald-500/60 font-bold uppercase tracking-wide">Lucro: R$ {sel.profit.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex flex-col md:flex-row gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <button onClick={addDutchSelection} className="text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all w-full md:w-auto">
                            <Plus size={16} /> Nova Seleção
                        </button>
                        <div className="flex-1"></div>
                        <button onClick={calculateDutching} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-widest py-4 px-10 rounded-xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95 w-full md:w-auto">
                            Calcular Distribuição
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'kelly' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-sm">
                    {/* ACCORDION INFO */}
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-500/10 mb-8">
                        <button onClick={() => toggleInfo('kelly')} className="flex justify-between items-center w-full text-left">
                            <div className="flex items-center gap-2">
                                <Info size={16} className="text-purple-500" />
                                <span className="text-sm font-black text-purple-700 dark:text-purple-400 uppercase tracking-wide">O que é Critério de Kelly?</span>
                            </div>
                            <ChevronDown size={16} className={`text-purple-500 transition-transform ${expandedInfo === 'kelly' ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {expandedInfo === 'kelly' && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <p className="text-xs text-purple-600 dark:text-purple-300 mt-3 leading-relaxed font-medium">
                                        Fórmula utilizada para determinar o tamanho ideal de uma aposta com base na sua vantagem (edge) sobre a casa. Maximiza o crescimento do capital a longo prazo.
                                    </p>
                                    <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-100 dark:border-purple-500/10">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Dica Pro</p>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                                            Recomendamos usar "Meio Kelly" ou "Quarto Kelly" para reduzir a volatilidade e o risco de quebra.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-8">Critério de Kelly</h2>
                    
                    {/* MOBILE STACK */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Banca Atual (R$)</label>
                             <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-slate-900 dark:text-white font-mono font-bold text-lg">
                                {currentBankrollBalance.toFixed(2)}
                             </div>
                        </div>
                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Fração Kelly</label>
                             <select 
                                value={kellyFraction} 
                                onChange={(e) => setKellyFraction(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-slate-900 dark:text-white outline-none cursor-pointer font-bold text-sm focus:border-purple-500 transition-colors"
                             >
                                <option value="1">Completo (Agressivo 100%)</option>
                                <option value="0.5">Meio Kelly (Moderado 50%)</option>
                                <option value="0.25">Quarto Kelly (Conservador 25%)</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Odds</label>
                             <input type="number" value={kellyOdds} onChange={e => setKellyOdds(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-purple-500 font-mono font-bold transition-colors" />
                        </div>
                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Probabilidade (%)</label>
                             <input type="number" value={kellyProb} onChange={e => setKellyProb(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-purple-500 font-mono font-bold transition-colors" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/10 dark:to-slate-900/50 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center border border-purple-100 dark:border-purple-500/10 gap-6">
                        <div className="w-full md:w-auto">
                            <p className="text-purple-800 dark:text-purple-300 text-xs font-black uppercase tracking-widest mb-3">Recomendação de Aposta</p>
                            <div className="w-full bg-purple-200 dark:bg-purple-900/30 h-3 rounded-full overflow-hidden w-full md:w-48">
                                <div className="bg-purple-600 dark:bg-purple-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.max(0, Math.min(100, parseFloat(kellyResult)))}%` }}></div>
                            </div>
                        </div>
                        <div className="text-center md:text-right w-full md:w-auto">
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{parseFloat(kellyResult) > 0 ? kellyResult : '0.00'}%</h3>
                            <p className="text-purple-600 dark:text-purple-400 font-mono font-bold text-sm bg-purple-100 dark:bg-purple-500/10 px-3 py-1 rounded-lg inline-block mt-1">
                                R$ {parseFloat(kellyResult) > 0 ? kellyMoney.toFixed(2) : '0.00'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

             {activeTab === 'converter' && (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-sm">
                    {/* ACCORDION INFO */}
                    <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-2xl border border-orange-100 dark:border-orange-500/10 mb-8">
                        <button onClick={() => toggleInfo('converter')} className="flex justify-between items-center w-full text-left">
                            <div className="flex items-center gap-2">
                                <Info size={16} className="text-orange-500" />
                                <span className="text-sm font-black text-orange-700 dark:text-orange-400 uppercase tracking-wide">Conversor de Formatos</span>
                            </div>
                            <ChevronDown size={16} className={`text-orange-500 transition-transform ${expandedInfo === 'converter' ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {expandedInfo === 'converter' && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <p className="text-xs text-orange-600 dark:text-orange-300 mt-3 leading-relaxed font-medium">
                                        Traduza odds Decimais (Europa/Brasil) para Americanas (EUA) ou Fracionárias (Reino Unido). Essencial para acompanhar tipsters internacionais.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-8">Conversor de Odds</h2>
                      <div className="space-y-6">
                        <div>
                            <label className="text-[10px] text-purple-600 dark:text-purple-400 font-black uppercase mb-2 block tracking-widest">Decimal (EU)</label>
                            <input type="number" value={decimalOdd} onChange={e => setDecimalOdd(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-white font-mono font-bold text-lg focus:border-purple-500 outline-none transition-colors" />
                        </div>
                        
                        <div className="flex justify-center text-slate-300 dark:text-slate-600"><ArrowRightLeft size={24} /></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase mb-2 block tracking-widest">Americana (US)</label>
                                <div className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-600 dark:text-slate-300 font-mono font-bold text-lg">{toAmerican(parseFloat(decimalOdd) || 1)}</div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase mb-2 block tracking-widest">Fracionária (UK)</label>
                                <div className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-600 dark:text-slate-300 font-mono font-bold text-lg">{toFractional(parseFloat(decimalOdd) || 1)}</div>
                            </div>
                        </div>
                      </div>
                </div>
            )}
        </div>
        
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-[#0f172a] rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
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