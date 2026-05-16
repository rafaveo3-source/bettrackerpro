import React from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProTeaserBlockProps {
  title?: string;
  description?: string;
}

const ProTeaserBlock: React.FC<ProTeaserBlockProps> = ({ 
  title = "Acesso Restrito", 
  description = "Esta funcionalidade avançada é exclusiva para membros PRO. Eleve sua gestão e tome decisões matemáticas precisas."
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#1C1C1E] border border-indigo-500/10 dark:border-indigo-500/20 rounded-3xl p-8 sm:p-12 text-center shadow-lg mt-8 mb-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 pointer-events-none" />
      <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10">
         <Lock size={32} className="text-indigo-600 dark:text-indigo-400" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 relative z-10">{title}</h2>
      <p className="text-sm text-slate-500 dark:text-[#8E8E93] mb-8 leading-relaxed font-medium max-w-md relative z-10">
        {description}
      </p>
      <button
        onClick={() => navigate('/pro')}
        className="w-full max-w-sm bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 py-4 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 relative z-10"
      >
        Desbloquear PRO
      </button>
    </div>
  );
};

export default ProTeaserBlock;
