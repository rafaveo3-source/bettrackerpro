import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 40, className = "" }) => {
  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
        <div className="absolute top-0 left-0 w-[65%] h-[65%] bg-indigo-600 rounded-lg shadow-sm flex items-center justify-center text-white font-black z-10 select-none overflow-hidden" style={{ fontSize: size * 0.4 }}>
            B
        </div>
        <div className="absolute bottom-0 right-0 w-[65%] h-[65%] bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#3A3A3C] rounded-lg shadow-sm flex items-center justify-center text-indigo-600 dark:text-white font-black z-20 select-none overflow-hidden" style={{ fontSize: size * 0.4 }}>
            T
        </div>
    </div>
  );
};