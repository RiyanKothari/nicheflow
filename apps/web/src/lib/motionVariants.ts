export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: "easeOut" }
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.93 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.93 },
  transition: { type: 'spring', stiffness: 380, damping: 28 }
}

export const slideRight = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
  transition: { duration: 0.22, ease: "easeOut" }
}

export const slideFromRight = {
  initial: { opacity: 0, x: 400 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 400 },
  transition: { type: 'spring', stiffness: 300, damping: 32 }
}

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
}

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
}

export const glassCardHover = {
  whileHover: {
    y: -2,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 12px 40px rgba(0,0,0,0.65)",
    borderColor: "rgba(255,255,255,0.16)",
    transition: { type: 'spring', stiffness: 400, damping: 30 }
  },
  whileTap: { y: 0, scale: 0.99 }
}

export const primaryButtonSpring = {
  whileHover: {
    scale: 1.02,
    boxShadow: "0 6px 24px rgba(245,158,11,0.45), inset 0 1px 0 rgba(255,255,255,0.20)"
  },
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 500, damping: 25 }
}
