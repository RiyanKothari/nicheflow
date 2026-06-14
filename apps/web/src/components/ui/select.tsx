import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({ options, value, onChange, placeholder = "Select...", className, disabled }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div
        className={cn(
          "w-full h-[42px] px-[14px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.10)] rounded-sm text-[#F4F4F5] text-[15px] flex items-center justify-between cursor-pointer transition-colors duration-150",
          isOpen ? "border-[rgba(245,158,11,0.60)] bg-[rgba(255,255,255,0.06)] shadow-[0_0_0_3px_rgba(245,158,11,0.12)]" : "",
          disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={!selectedOption ? "text-[#52525B]" : "text-[#F4F4F5]"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-[#52525B]" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 py-1 glass rounded-md shadow-lg border border-[rgba(255,255,255,0.10)] max-h-60 overflow-y-auto scrollbar-hidden"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  className={cn(
                    "px-4 py-2.5 flex items-center justify-between cursor-pointer text-[14px] transition-colors relative group border-l-2",
                    isSelected 
                      ? "text-[#F59E0B] bg-[rgba(255,255,255,0.04)] border-[#F59E0B]" 
                      : "text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.06)] border-transparent hover:border-[#F59E0B] hover:text-[#F4F4F5]"
                  )}
                  onClick={() => {
                    onChange?.(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#F59E0B]" />}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
