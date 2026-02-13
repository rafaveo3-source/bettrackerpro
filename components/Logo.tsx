
import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 40, className = "" }) => {
  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
        <div className="absolute top-0 left-0 w-[65%] h-[65%] bg-emerald-500 rounded-lg shadow-xl shadow-emerald-500/20 flex items-center justify-center text-white font-black z-10 select-none overflow-hidden border border-emerald-400" style={{ fontSize: size * 0.4 }}>
            T
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-[65%] h-[65%] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg shadow-xl flex items-center justify-center text-emerald-600 dark:text-emerald-500 font-black z-20 select-none overflow-hidden" style={{ fontSize: size * 0.4 }}>
            T
            <div className="absolute inset-0 bg-gradient-to-tl from-emerald-500/10 to-transparent"></div>
        </div>
    </div>
  );
};
