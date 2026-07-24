import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomDatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (value: string) => void;
  maxDate?: string; // Format: YYYY-MM-DD
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

const ITEM_HEIGHT = 32; // Height of each scroll item in pixels

// Scroll column component for scroll picker wheel
const ScrollColumn: React.FC<{
  items: { value: any; label: string; disabled?: boolean }[];
  selectedValue: any;
  onSelect: (value: any) => void;
}> = ({ items, selectedValue, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<any>(null);
  const animationTimeoutRef = useRef<any>(null);
  const isProgrammaticScroll = useRef(false);

  // Scroll target element to center
  const scrollToSelected = (value: any, smooth: boolean) => {
    const container = containerRef.current;
    if (!container) return;
    const index = items.findIndex((item) => item.value === value);
    if (index !== -1) {
      const targetScrollTop = index * ITEM_HEIGHT;
      if (Math.abs(container.scrollTop - targetScrollTop) > 1) {
        isProgrammaticScroll.current = true;
        container.scrollTo({
          top: targetScrollTop,
          behavior: smooth ? 'smooth' : 'auto',
        });

        if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 250);
      }
    }
  };

  // Center selected item on load/change
  useEffect(() => {
    scrollToSelected(selectedValue, true);
  }, [selectedValue, items]);

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (isProgrammaticScroll.current) return;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      const scrollTop = container.scrollTop;
      const index = Math.round(scrollTop / ITEM_HEIGHT);
      const item = items[index];
      if (item && item.value !== selectedValue && !item.disabled) {
        onSelect(item.value);
      } else if (item && item.disabled) {
        // Snaps back to current selection if user scrolled to a disabled option
        scrollToSelected(selectedValue, true);
      } else {
        // Snap to grid lines
        container.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
      }
    }, 120);
  };

  const handleItemClick = (val: any, disabled?: boolean) => {
    if (disabled) return;
    onSelect(val);
  };

  return (
    <div className="flex-1 relative h-40 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-none snap-y snap-mandatory scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Top Spacer to align first item to center */}
        <div className="h-[64px] shrink-0" />

        {/* List items */}
        {items.map((item, idx) => {
          const isSelected = item.value === selectedValue;
          return (
            <div
              key={idx}
              onClick={() => handleItemClick(item.value, item.disabled)}
              className={`h-8 flex items-center justify-center text-sm font-semibold snap-center cursor-pointer transition-all duration-150 ${
                isSelected
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-110'
                  : item.disabled
                  ? 'text-gray-300 dark:text-slate-700 cursor-not-allowed'
                  : 'text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium'
              }`}
            >
              {item.label}
            </div>
          );
        })}

        {/* Bottom Spacer to align last item to center */}
        <div className="h-[64px] shrink-0" />
      </div>
    </div>
  );
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  maxDate = '',
  placeholder = 'Select Date',
  className = '',
  triggerClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial selected date or fall back to today
  const getParsedDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Local temporary selection state for the scroll wheels
  const [tempDay, setTempDay] = useState(1);
  const [tempMonth, setTempMonth] = useState(0);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());

  // Initialize temporary state when popover opens or value changes
  useEffect(() => {
    if (isOpen) {
      const activeDate = getParsedDate(value);
      setTempDay(value ? activeDate.getDate() : new Date().getDate());
      setTempMonth(value ? activeDate.getMonth() : new Date().getMonth());
      setTempYear(value ? activeDate.getFullYear() : new Date().getFullYear());
    }
  }, [isOpen, value]);

  // Close popover on click outside
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

  const formatDateString = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const handleTempMonthChange = (newMonth: number) => {
    setTempMonth(newMonth);
    const newMaxDays = new Date(tempYear, newMonth + 1, 0).getDate();
    if (tempDay > newMaxDays) {
      setTempDay(newMaxDays);
    }
  };

  const handleTempYearChange = (newYear: number) => {
    setTempYear(newYear);
    const newMaxDays = new Date(newYear, tempMonth + 1, 0).getDate();
    if (tempDay > newMaxDays) {
      setTempDay(newMaxDays);
    }
  };

  // Apply button click action - saves date result and closes popover
  const handleApply = () => {
    const formatted = formatDateString(tempYear, tempMonth, tempDay);
    onChange(formatted);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const formatted = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());
    if (maxDate && formatted > maxDate) {
      onChange(maxDate);
    } else {
      onChange(formatted);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  // Generate Year Array (e.g., 2020 to Current Year + 2)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2020; y <= currentYear + 2; y++) {
    years.push(y);
  }

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Dynamic days in temporary month/year selection
  const daysInMonth = new Date(tempYear, tempMonth + 1, 0).getDate();

  // Mapped options list
  const dayItems = Array.from({ length: daysInMonth }, (_, i) => ({
    value: i + 1,
    label: String(i + 1),
    disabled: maxDate ? formatDateString(tempYear, tempMonth, i + 1) > maxDate : false,
  }));

  const monthItems = monthNames.map((name, i) => ({
    value: i,
    label: name.substring(0, 3), // e.g. "Jan", "Feb"
    disabled: maxDate ? formatDateString(tempYear, i, 1) > maxDate : false,
  }));

  const yearItems = years.map((y) => ({
    value: y,
    label: String(y),
    disabled: maxDate ? formatDateString(y, 0, 1) > maxDate : false,
  }));

  // Format date trigger button text
  const getFormattedInputValue = () => {
    if (!value) return '';
    const activeDate = getParsedDate(value);
    return activeDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button Input */}
      <div className="relative">
        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-300 pointer-events-none z-10" size={16} />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full text-left pl-9 pr-7 py-2 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 cursor-pointer flex items-center justify-between min-w-0 h-[38px] ${
            isOpen ? 'ring-2 ring-indigo-500 border-indigo-500 dark:border-indigo-400' : ''
          } ${triggerClassName}`}
        >
          <span className="truncate min-w-0 pr-1">
            <span className={value ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-700 dark:text-gray-200 font-semibold'}>
              {value ? getFormattedInputValue() : placeholder}
            </span>
          </span>
        </button>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-gray-300 dark:hover:bg-slate-500 cursor-pointer z-20"
            title="Clear date"
          >
            <X size={10} />
          </button>
        )}
      </div>

      {/* Picker Wheel Dropdown / Mobile Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop Overlay (small screens < sm) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="sm:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            />

            {/* Popover Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-2rem)] max-w-xs sm:absolute sm:top-full sm:left-auto sm:right-0 sm:translate-x-0 sm:translate-y-0 sm:mt-2 sm:w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4"
            >
            {/* Header: Column Labels */}
            <div className="flex items-center justify-between px-1 mb-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              <span className="flex-1 text-center">Day</span>
              <span className="flex-1 text-center">Month</span>
              <span className="flex-1 text-center">Year</span>
            </div>

            {/* Scroll Columns container */}
            <div className="flex gap-1.5 relative bg-gray-50/60 dark:bg-slate-900/60 rounded-xl p-1 h-40 border border-gray-200/80 dark:border-slate-700/80 overflow-hidden">
              
              {/* Central horizontal highlight selector bar */}
              <div className="absolute left-1 right-1 top-[64px] h-[32px] border border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/40 pointer-events-none rounded-lg shadow-2xs" />
              
              {/* Top & Bottom gradient fading masks */}
              <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white dark:from-slate-800 to-transparent pointer-events-none z-10 opacity-90" />
              <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white dark:from-slate-800 to-transparent pointer-events-none z-10 opacity-90" />

              {/* Columns: Day, Month, Year */}
              <ScrollColumn
                items={dayItems}
                selectedValue={tempDay}
                onSelect={(val) => setTempDay(val)}
              />
              <ScrollColumn
                items={monthItems}
                selectedValue={tempMonth}
                onSelect={(val) => handleTempMonthChange(val)}
              />
              <ScrollColumn
                items={yearItems}
                selectedValue={tempYear}
                onSelect={(val) => handleTempYearChange(val)}
              />
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700/80 mt-3.5 pt-3">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2.5 py-1 rounded-lg font-bold transition active:scale-95 cursor-pointer"
              >
                Clear
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToday}
                  className="text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg font-bold transition active:scale-95 cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95 cursor-pointer border border-transparent"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </div>
  );
};
