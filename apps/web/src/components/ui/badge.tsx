import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type BadgeStatus = 'confirmed' | 'completed' | 'cancelled' | 'pending' | 'draft' | 'overdue' | 'no_show';
export type BadgePriority = 'urgent' | 'high' | 'normal' | 'low';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md';
  status?: BadgeStatus;
  priority?: BadgePriority;
  children: React.ReactNode;
}

export function Badge({ size = 'md', status, priority, className, children, ...props }: BadgeProps) {
  const isSm = size === 'sm';
  const baseStyle = cn(
    "inline-flex items-center justify-center rounded-full font-medium tracking-tight whitespace-nowrap",
    isSm ? "text-[11px] px-2 py-[2px]" : "text-[12px] px-2.5 py-[3px]"
  );

  let variantStyle = "";
  let dotColor = "";
  let needsPulse = false;

  if (status) {
    switch (status) {
      case 'confirmed':
        dotColor = "bg-[#60A5FA]";
        variantStyle = "bg-[rgba(96,165,250,0.10)] text-[#60A5FA]";
        break;
      case 'completed':
        dotColor = "bg-[#34D399]";
        variantStyle = "bg-[rgba(52,211,153,0.10)] text-[#34D399]";
        break;
      case 'cancelled':
        dotColor = "bg-[#F87171]";
        variantStyle = "bg-[rgba(248,113,113,0.10)] text-[#F87171]";
        break;
      case 'pending':
        dotColor = "bg-[#FBBF24]";
        variantStyle = "bg-[rgba(251,191,36,0.10)] text-[#FBBF24]";
        needsPulse = true;
        break;
      case 'draft':
        dotColor = "bg-[#A1A1AA]";
        variantStyle = "bg-[rgba(161,161,170,0.10)] text-[#A1A1AA]";
        break;
      case 'overdue':
        dotColor = "bg-[#FB923C]";
        variantStyle = "bg-[rgba(251,146,60,0.10)] text-[#FB923C]";
        break;
      case 'no_show':
        dotColor = "bg-[#C084FC]";
        variantStyle = "bg-[rgba(192,132,252,0.10)] text-[#C084FC]";
        break;
    }
  } else if (priority) {
    switch (priority) {
      case 'urgent':
        variantStyle = "bg-[rgba(248,113,113,0.12)] text-[#F87171]";
        break;
      case 'high':
        variantStyle = "bg-[rgba(251,191,36,0.12)] text-[#FBBF24]";
        break;
      case 'normal':
        variantStyle = "bg-[rgba(255,255,255,0.06)] text-[#A1A1AA]";
        break;
      case 'low':
        variantStyle = "bg-transparent text-[#52525B] border border-[rgba(255,255,255,0.06)]";
        break;
    }
  } else {
    // Default fallback
    variantStyle = "bg-[rgba(255,255,255,0.06)] text-[#A1A1AA]";
  }

  return (
    <span className={cn(baseStyle, variantStyle, className)} {...props}>
      {status && (
        <span className="relative flex h-[6px] w-[6px] mr-1.5 items-center justify-center">
          {needsPulse && (
            <motion.span
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", dotColor)}
            />
          )}
          <span className={cn("relative inline-flex rounded-full h-[6px] w-[6px]", dotColor)}></span>
        </span>
      )}
      {children}
    </span>
  );
}
