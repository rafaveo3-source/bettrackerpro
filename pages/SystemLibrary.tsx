import React, { useEffect, useState } from 'react';
import { Database, Layers, Trophy, Lock } from 'lucide-react';
import { supabase } from '../store/useBetStore';

const SystemLibrary: React.FC = () => {
  const [markets, setMarkets] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [m, l, sm, ps] = await Promise.all([
        supabase.from('markets').select('*').eq('is_active', true),
        supabase.from('leagues').select('*'),
        supabase.from('system_methods').select('*'),
        supabase.from('progression_strategies').select('*'),
      ]);

      setMarkets(m.data || []);
      setLeagues(l.data || []);
      setMethods(sm.data || []);
      setStrategies(ps.data || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400 uppercase text-sm font-bold">
        Carregando Biblioteca Estratégica...
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* HEADER */}
<header className="border-b border-slate-200 dark:border-slate-800 pb-6">

  {/* Label superior discreta */}
  <div className="flex items-center gap-2 text-purple-500 text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]"></span>
    Strategic Intelligence Core
  </div>

  {/* Headline principal */}
  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
    Biblioteca Estratégica
    <span className="text-slate-400 dark:text-slate-700 text-lg ml-2">
      ///
    </span>
  </h1>

  {/* Subheadline */}
  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">
    Estruturas globais, métodos profissionais e modelos prontos para importação.
  </p>

</header>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* MERCADOS */}
        <section className="bg-white dark:bg-slate-900 border rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Database size={20} />
            <h2 className="font-black uppercase">Mercados</h2>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {markets.map((item) => (
              <div key={item.id} className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {item.name}
              </div>
            ))}
          </div>
        </section>

        {/* LIGAS */}
        <section className="bg-white dark:bg-slate-900 border rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy size={20} />
            <h2 className="font-black uppercase">Ligas</h2>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {leagues.map((item) => (
              <div key={item.id} className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {item.name}
              </div>
            ))}
          </div>
        </section>

        {/* MÉTODOS */}
        <section className="bg-white dark:bg-slate-900 border rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Layers size={20} />
            <h2 className="font-black uppercase">Métodos Globais</h2>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {methods.map((item) => (
              <div key={item.id} className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {item.name}
              </div>
            ))}
          </div>
        </section>

        {/* PROGRESSÕES */}
        <section className="bg-white dark:bg-slate-900 border rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lock size={20} />
            <h2 className="font-black uppercase">Progressões PRO</h2>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {strategies.map((item) => (
              <div key={item.id} className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {item.name}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default SystemLibrary;