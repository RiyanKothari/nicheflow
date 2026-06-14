import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { glassCardHover } from '@/lib/motionVariants';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  accent?: boolean;
  agent?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function GlassCard({
  children,
  className,
  hover = false,
  accent = false,
  agent = false,
  padding = 'md',
  ...props
}: GlassCardProps) {
  const paddingClass = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }[padding];

  const baseClass = agent
    ? 'glass-agent text-text-primary rounded-2xl'
    : 'glass text-text-primary rounded-2xl';

  const hoverProps = hover ? glassCardHover : {};

  // For accent variant, we manually mix the properties from motionVariants and inline modifications
  const dynamicHoverProps = (hover && accent) ? {
    whileHover: {
      ...glassCardHover.whileHover,
      borderColor: 'rgba(245,158,11,0.30)',
      backgroundColor: 'rgba(245,158,11,0.04)',
    },
    whileTap: glassCardHover.whileTap,
  } : hoverProps;

  return (
    <motion.div
      className={cn(baseClass, paddingClass, className)}
      {...dynamicHoverProps}
      {...props}
    >
      {children}
    </motion.div>
  );
}
