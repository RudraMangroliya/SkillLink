import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative inline-flex items-center rounded-full p-1 bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-inner">
      <button
        onClick={() => setTheme('light')}
        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
          theme === 'light' 
            ? 'bg-white shadow-sm text-amber-500 ring-1 ring-gray-200 dark:ring-0 dark:bg-gray-700 dark:text-amber-400' 
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        title="Light Mode"
      >
        <Sun size={16} strokeWidth={theme === 'light' ? 2.5 : 2} />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
          theme === 'system' 
            ? 'bg-white shadow-sm text-indigo-500 ring-1 ring-gray-200 dark:ring-0 dark:bg-gray-700 dark:text-indigo-400' 
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        title="System Theme"
      >
        <Monitor size={16} strokeWidth={theme === 'system' ? 2.5 : 2} />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-white shadow-sm text-blue-500 ring-1 ring-gray-200 dark:ring-0 dark:bg-gray-700 dark:text-blue-400' 
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        title="Dark Mode"
      >
        <Moon size={16} strokeWidth={theme === 'dark' ? 2.5 : 2} />
      </button>
    </div>
  );
}
