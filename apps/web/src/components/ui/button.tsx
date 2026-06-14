import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: 'primary' | 'secondary' | 'contextual' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, ...props }, ref) => {
    
    // According to DESIGN(1).md:
    // primary = Global Action Pill (black, 50px radius)
    // secondary = Navigation Utility Pill (transparent, black border, 50px radius)
    // contextual = Panel Execution CTA (violet, 8px radius)
    
    const baseStyles = "inline-flex items-center justify-center font-semibold transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-[var(--color-structural-ink)] text-[var(--color-absolute-canvas)] rounded-[var(--radius-globalnavbuttons)] hover:bg-[#333333]",
      secondary: "bg-transparent border-[1.5px] border-[var(--color-structural-ink)] text-[var(--color-structural-ink)] rounded-[var(--radius-globalnavbuttons)] hover:bg-[#f7f7f7]",
      contextual: "bg-[var(--color-context-action-violet)] text-[var(--color-absolute-canvas)] rounded-[var(--radius-contextualbuttons)] hover:bg-[#3b38df]",
      ghost: "bg-transparent text-[var(--color-structural-ink)] hover:bg-[#f0f0f0] rounded-[var(--radius-contextualbuttons)]"
    };

    const sizes = {
      sm: "h-9 px-4 text-[14px]",
      md: "h-11 px-6 text-[16px]",
      lg: "h-14 px-8 text-[18px]"
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
