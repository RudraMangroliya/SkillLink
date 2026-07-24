import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options?: (SelectOption | string | number)[];
  className?: string;
  triggerClassName?: string;
  optionsClassName?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options = [],
  className = '',
  triggerClassName = '',
  optionsClassName = '',
  placeholder = 'Select an option',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Safely normalize options to SelectOption structure
  const safeOptions = Array.isArray(options) ? options : [];
  const normalizedOptions: SelectOption[] = safeOptions.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return {
        value: opt,
        label: String(opt),
      };
    }
    return opt;
  });

  // Find currently selected option with String comparison fallback
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium ${
          isOpen ? 'ring-2 ring-indigo-500 border-indigo-500 dark:border-indigo-400' : ''
        } ${triggerClassName}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-indigo-500 dark:text-indigo-400' : ''
          }`}
        />
      </button>

      {/* Options Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={`absolute z-50 min-w-full w-max max-w-xs sm:max-w-sm mt-1.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto outline-none py-1.5 left-0 ${optionsClassName}`}
          >
            {normalizedOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                No options available
              </div>
            ) : (
              normalizedOptions.map((option, idx) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <button
                    key={`${option.value}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                      <span className="truncate">{option.label}</span>
                    </span>
                    {isSelected && (
                      <Check size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
