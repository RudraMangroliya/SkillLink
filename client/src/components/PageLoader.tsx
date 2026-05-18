import React from 'react';
import { Zap } from 'lucide-react';

interface PageLoaderProps {
  label?: string;
  fullPage?: boolean;
}

export default function PageLoader({ label = "Loading...", fullPage = true }: PageLoaderProps) {
  return (
    <div className={`${fullPage ? 'min-h-[60vh] sm:min-h-screen' : 'h-full py-12'} w-full bg-gray-50 dark:bg-slate-900 flex flex-col justify-center items-center transition-colors duration-300`}>
      <div className="relative flex justify-center items-center">
        {/* Outer glowing ring */}
        <div className="absolute w-20 h-20 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full animate-ping"></div>
        
        {/* Inner spinning ring */}
        <div className="w-16 h-16 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
        
        {/* Center icon */}
        <div className="absolute text-indigo-600 dark:text-indigo-400">
          <Zap size={24} className="animate-pulse" fill="currentColor" />
        </div>
      </div>
      <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium animate-pulse">{label}</p>
    </div>
  );
}
