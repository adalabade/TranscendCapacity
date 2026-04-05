import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Filter } from 'lucide-react';

interface Option {
  id: number | string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  selectedIds: (number | string)[];
  onChange: (ids: (number | string)[]) => void;
  placeholder?: string;
  icon?: any;
}

export default function MultiSelect({
  label,
  options,
  selectedIds,
  onChange,
  placeholder = 'Select options...',
  icon: Icon = Filter,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (id: number | string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const toggleAll = () => {
    if (selectedIds.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.id));
    }
  };

  const displayText = () => {
    if (selectedIds.length === 0) return placeholder;
    if (selectedIds.length === options.length) return 'All Selected';
    if (selectedIds.length === 1) {
      return options.find((o) => o.id === selectedIds[0])?.label || placeholder;
    }
    return `${selectedIds.length} Selected`;
  };

  return (
    <div className="relative inline-block w-full sm:w-64" ref={containerRef}>
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-5 py-3 bg-white border rounded-2xl transition-all duration-300 group
          ${isOpen ? 'border-primary ring-4 ring-primary/5 shadow-lg' : 'border-gray-100 hover:border-gray-200 shadow-sm'}
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Icon size={16} className={`${selectedIds.length > 0 ? 'text-primary' : 'text-gray-300'}`} />
          <span className={`text-sm font-bold truncate ${selectedIds.length > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
            {displayText()}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'group-hover:text-gray-400'}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-3 bg-white border border-gray-100 rounded-3xl shadow-2xl z-50 py-3 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 pb-2 mb-2 border-b border-gray-50 flex items-center justify-between">
            <button
              onClick={toggleAll}
              className="text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/5 px-2 py-1 rounded-lg transition-colors"
            >
              {selectedIds.length === options.length ? 'Clear All' : 'Select All'}
            </button>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-2">
              {options.length} Options
            </span>
          </div>
          
          <div className="max-h-60 overflow-y-auto px-2 space-y-0.5 custom-scrollbar">
            {options.map((option) => {
              const isSelected = selectedIds.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                    ${isSelected ? 'bg-primary/5 text-primary' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <div className="bg-primary text-white p-0.5 rounded-md">
                      <Check size={12} strokeWidth={4} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedIds.length > 0 && (
            <div className="px-4 pt-2 mt-2 border-t border-gray-50 flex items-center justify-between">
              <button
                onClick={() => onChange([])}
                className="flex items-center gap-1.5 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-500 transition-colors"
              >
                <X size={10} strokeWidth={3} /> Deselect
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
