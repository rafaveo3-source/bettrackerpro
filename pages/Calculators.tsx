
import React, { useState } from 'react';
import { Share2, RefreshCw, Lock, ArrowRightLeft } from 'lucide-react';
import { useBetStore } from '../store/useBetStore';

const Calculators: React.FC = () => {
  const { currentBankrollBalance } = useBetStore();
  const [activeTab, setActiveTab] = useState('dutching');

  const [dutchTotalStake, setDutchTotalStake] = useState('100');
  const [dutchSelections, setDutchSelections] = useState([
    { id: 1, name: 'Seleção A', odds: '2.50', stake: 0, profit: 0 },
    { id: 2, name: 'Seleção B', odds: '3.20', stake: 0, profit: 0 }
  ]);

  const addDutchSelection = () => {
    setDutchSelections([...dutchSelections, { id: Date.now(), name: `Seleção ${String.fromCharCode(65 + dutchSelections.length)}`, odds: '', stake: 0, profit: 0 }]);
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
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">BetTracker<span className="text-emerald-500">.</span> Calculadoras</h1>
        <p className="text-slate-500 dark:text-slate-400">Ferramentas avançadas para gestão e estratégia.</p>
      </div>

      <div className="flex gap-4 mb-4">
        <button onClick={() => setActiveTab('dutching')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'dutching' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-[#0f172a] text-slate-500 border border-slate-200 dark:border-slate-800'}`}>Dutching</button>
        <button onClick={() => setActiveTab('kelly')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'kelly' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-[#0f172a] text-slate-500 border border-slate-200 dark:border-slate-800'}`}>Critério de Kelly</button>
        <button onClick={() => setActiveTab('converter')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'converter' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-[#0f172a] text-slate-500 border border-slate-200 dark:border-slate-800'}`}>Conversor Odds</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            {activeTab === 'dutching' && (
                <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 text-white">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-bold">Calculadora Dutching</h2>
                            <p className="text-slate-400 text-sm">Distribua seu investimento para lucro garantido.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
                            <span className="text-xs text-slate-400 uppercase">Aposta Total</span>
                            <input 
                                type="number" 
                                value={dutchTotalStake} 
                                onChange={(e) => setDutchTotalStake(e.target.value)} 
                                className="bg-transparent text-right w-20 font-bold outline-none" 
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase px-2">
                            <div className="col-span-1">#</div>
                            <div className="col-span-3">Seleção</div>
                            <div className="col-span-3">Odds</div>
                            <div className="col-span-5 text-right">Stake Sugerida</div>
                        </div>
                        {dutchSelections.map((sel, idx) => (
                            <div key={sel.id} className="grid grid-cols-12 gap-4 items-center bg-slate-900 p-3 rounded-lg border border-slate-800">
                                <div className="col-span-1 flex items-center justify-center w-6 h-6 bg-slate-800 rounded text-xs text-slate-400 font-bold border border-slate-700">
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                <div className="col-span-3">
                                    <input 
                                        type="text" 
                                        value={sel.name}
                                        onChange={(e) => {
                                            const newSels = [...dutchSelections];
                                            newSels[idx].name = e.target.value;
                                            setDutchSelections(newSels);
                                        }}
                                        className="w-full bg-transparent text-white outline-none text-sm"
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
                                        className="w-full bg-[#020617] border border-slate-700 rounded px-3 py-1.5 text-white outline-none text-sm focus:border-emerald-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="col-span-5 text-right">
                                    <p className="text-emerald-500 font-bold font-mono">R$ {sel.stake.toFixed(2)}</p>
                                    <p className="text-[10px] text-slate-500">Lucro: R$ {sel.profit.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex gap-4">
                        <button onClick={addDutchSelection} className="text-emerald-500 text-sm font-bold hover:text-emerald-400 flex items-center gap-1">
                            + Adicionar Seleção
                        </button>
                        <div className="flex-1"></div>
                        <button onClick={calculateDutching} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                            Calcular
                        </button>
                    </div>
                </div>
            )}
            {activeTab === 'kelly' && (
                <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 text-white">
                    <h2 className="text-lg font-bold mb-6">Critério de Kelly</h2>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                             <label className="block text-xs font-medium text-slate-400 mb-2 uppercase">Banca Atual (R$)</label>
                             <div className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono">
                                {currentBankrollBalance.toFixed(2)}
                             </div>
                        </div>
                        <div>
                             <label className="block text-xs font-medium text-slate-400 mb-2 uppercase">Fração Kelly</label>
                             <select 
                                value={kellyFraction} 
                                onChange={(e) => setKellyFraction(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none"
                             >
                                <option value="1">Completo (100%)</option>
                                <option value="0.5">Meio Kelly (50%)</option>
                                <option value="0.25">Quarto Kelly (25%)</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-xs font-medium text-slate-400 mb-2 uppercase">Odds</label>
                             <input type="number" value={kellyOdds} onChange={e => setKellyOdds(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                             <label className="block text-xs font-medium text-slate-400 mb-2 uppercase">Probabilidade (%)</label>
                             <input type="number" value={kellyProb} onChange={e => setKellyProb(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500" />
                        </div>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 flex justify-between items-center border border-slate-800">
                        <div>
                            <p className="text-slate-400 text-sm">Recomendação de Aposta</p>
                            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 w-32 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, parseFloat(kellyResult)))}%` }}></div>
                            </div>
                        </div>
                        <div className="text-right">
                            <h3 className="text-3xl font-bold text-white">{parseFloat(kellyResult) > 0 ? kellyResult : '0.00'}%</h3>
                            <p className="text-emerald-500 font-mono text-sm">R$ {parseFloat(kellyResult) > 0 ? kellyMoney.toFixed(2) : '0.00'}</p>
                        </div>
                    </div>
                </div>
            )}
             {activeTab === 'converter' && (
                <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 text-white">
                    <h2 className="text-lg font-bold mb-6">Conversor de Odds</h2>
                     <div className="space-y-4">
                        <div>
                            <label className="text-xs text-purple-400 font-bold uppercase mb-1 block">Decimal</label>
                            <input type="number" value={decimalOdd} onChange={e => setDecimalOdd(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono focus:border-purple-500 outline-none" />
                        </div>
                        <div className="flex justify-center text-slate-500"><ArrowRightLeft size={20} /></div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Americana</label>
                            <div className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-300 font-mono">{toAmerican(parseFloat(decimalOdd) || 1)}</div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Fracionária</label>
                            <div className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-300 font-mono">{toFractional(parseFloat(decimalOdd) || 1)}</div>
                        </div>
                     </div>
                </div>
            )}
        </div>
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Ações Rápidas</h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Dica de Gestão</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Use Kelly Fracionário para reduzir volatilidade.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Calculators;
