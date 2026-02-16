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
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-widest">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          Arsenal Estratégico Global
        </div>

        <h1 className="text-3xl font-black uppercase italic mt-2">
          Biblioteca PRO ///
        </h1>

        <p className="text-slate-500 text-xs uppercase tracking-widest mt-2">
          Estruturas globais prontas para importação e uso profissional.
        </p>
      </div>

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