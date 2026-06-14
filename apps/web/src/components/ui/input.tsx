import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightElement, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label className="text-[14px] font-semibold text-[var(--color-structural-ink)] tracking-tight">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-graphite-metadata)]">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={cn(
              "w-full bg-[var(--color-absolute-canvas)] border border-[var(--color-boundary-frame)] rounded-[8px] text-[15px] text-[var(--color-structural-ink)] placeholder:text-[var(--color-graphite-metadata)]",
              "py-3 transition-all outline-none focus-ring",
              leftIcon ? "pl-11" : "pl-4",
              rightElement ? "pr-12" : "pr-4",
              error && "border-[var(--color-error)]",
              className
            )}
            {...props}
          />
          
          {rightElement && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[12px] text-[var(--color-error)] flex items-center mt-1"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
