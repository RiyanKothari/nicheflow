import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({ value, prefix = '', className = '', duration = 1200 }: AnimatedNumberProps) {
  const [hasMounted, setHasMounted] = useState(false);
  
  // Spring config for a smooth counting effect
  const spring = useSpring(0, { 
    stiffness: 60, 
    damping: 20, 
    mass: 1 
  });

  useEffect(() => {
    setHasMounted(true);
    // Add a slight delay on initial mount for choreographing
    const timeoutId = setTimeout(() => {
      spring.set(value);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [value, spring]);

  // Round the value to avoid decimals during animation unless requested (we'll assume integers for UI revamps initially)
  const displayValue = useTransform(spring, (current) => {
    return Math.round(current).toLocaleString();
  });

  return (
    <motion.span className={`font-mono ${className}`}>
      {prefix && <span className="mr-1 opacity-70 font-sans text-[0.6em] relative -top-[0.1em]">{prefix}</span>}
      <motion.span>{hasMounted ? displayValue : 0}</motion.span>
    </motion.span>
  );
}
