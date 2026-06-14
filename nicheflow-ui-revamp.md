# NicheFlow — Complete UI Design Revamp
## Visual System & Page-by-Page Implementation Guide for AI Coding Agents

> **Design Brief for the Agent:**
> Tear out the old UI entirely. This is a ground-up redesign.
> The aesthetic target: a boutique fintech tool that a Mumbai startup founder
> and a Surat tailor can both open and feel — *"this was made for me."*
> Professional, minimal, subtly alive. Every component in this document is final spec.
> Implement exactly what is written. No improvisation on colors, spacing, or animation values.

---

## QUICK DESIGN IDENTITY

```
AESTHETIC      Precision-minimal. Finance-grade surfaces. Warm restraint.
FEELING        Like opening a premium banking app crossed with a Muji notebook.
NOT            Startup-colorful. Generic SaaS blue. Dashboard-ugly.
SIGNATURE      Frosted cards that breathe. One saffron accent used surgically.
MOTION         Everything moves — but nothing performs. Motion = information.
```

---

## PART 1 — DESIGN TOKENS (The Only Source of Truth)

### 1.1 Color System

The palette is built around **zinc** (cold neutral) anchored by **warm stone** surfaces, with a single **amber-saffron** accent that appears exactly where action is needed. A **soft indigo** for AI/agent presence that feels intelligent, not purple-hype.

```css
/* ============================================================
   NICHEFLOW DESIGN TOKENS v2
   Copy this exactly into apps/web/src/index.css
   ============================================================ */

:root {
  /* === BACKGROUND HIERARCHY ===
     Think of these as elevation layers.
     bg-void is the floor. bg-raised is a card. bg-float is a modal. */
  --bg-void:        #0A0A0B;   /* True near-black page background */
  --bg-base:        #111113;   /* Main content background */
  --bg-raised:      #18181B;   /* Cards, panels */
  --bg-overlay:     #1E1E22;   /* Dropdowns, tooltips */
  --bg-float:       #26262C;   /* Modals, popovers */

  /* === GLASS SURFACES (the signature element) ===
     Use these for cards that sit on dark backgrounds.
     The backdrop-filter does the work. */
  --glass-surface:  rgba(255, 255, 255, 0.04);  /* Default glass card */
  --glass-raised:   rgba(255, 255, 255, 0.07);  /* Hovered glass card */
  --glass-border:   rgba(255, 255, 255, 0.08);  /* Glass card border */
  --glass-border-hover: rgba(255, 255, 255, 0.16); /* On hover */

  /* === TYPOGRAPHY ===
     Pure white is harsh. Use these instead. */
  --text-primary:   #F4F4F5;   /* Headlines, important values */
  --text-secondary: #A1A1AA;   /* Labels, descriptions */
  --text-tertiary:  #52525B;   /* Placeholders, disabled */
  --text-inverse:   #0A0A0B;   /* Text on light/saffron backgrounds */

  /* === ACCENT — AMBER SAFFRON ===
     Used ONLY for: primary CTAs, active states, key metrics.
     Never as a background fill unless it's a button. */
  --accent:         #F59E0B;   /* The one color. Use sparingly. */
  --accent-dim:     rgba(245, 158, 11, 0.12); /* For subtle accent bg */
  --accent-border:  rgba(245, 158, 11, 0.3);  /* Accent-tinted borders */
  --accent-glow:    0 0 24px rgba(245, 158, 11, 0.2); /* Drop shadow */

  /* === AGENT / AI LAYER ===
     Soft indigo. Signals intelligence without shouting. */
  --agent:          #818CF8;   /* Indigo-400: agent active, AI text */
  --agent-dim:      rgba(129, 140, 248, 0.10); /* Agent background tint */
  --agent-border:   rgba(129, 140, 248, 0.25); /* Agent card border */
  --agent-glow:     0 0 20px rgba(129, 140, 248, 0.15);

  /* === SEMANTIC ===
     Desaturated. Fits the dark palette without clashing. */
  --success:        #34D399;   /* Emerald-400 */
  --success-dim:    rgba(52, 211, 153, 0.10);
  --warning:        #FBBF24;   /* Amber-400 */
  --warning-dim:    rgba(251, 191, 36, 0.10);
  --error:          #F87171;   /* Red-400 */
  --error-dim:      rgba(248, 113, 113, 0.10);
  --info:           #60A5FA;   /* Blue-400 */
  --info-dim:       rgba(96, 165, 250, 0.10);

  /* === BORDERS & DIVIDERS === */
  --border-subtle:  rgba(255, 255, 255, 0.06);  /* Between sections */
  --border-default: rgba(255, 255, 255, 0.10);  /* Card edges */
  --border-strong:  rgba(255, 255, 255, 0.18);  /* Focus rings, emphasis */

  /* === SPACING SCALE (4px base) === */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* === BORDER RADIUS === */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-2xl: 32px;
  --radius-full: 9999px;

  /* === SHADOWS (layered for depth) === */
  --shadow-xs:  0 1px 3px rgba(0,0,0,0.4);
  --shadow-sm:  0 2px 8px rgba(0,0,0,0.5);
  --shadow-md:  0 4px 24px rgba(0,0,0,0.6);
  --shadow-lg:  0 8px 40px rgba(0,0,0,0.7);
  --shadow-xl:  0 16px 64px rgba(0,0,0,0.8);

  /* === TRANSITIONS === */
  --ease-snappy: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast:   120ms;
  --duration-base:   200ms;
  --duration-slow:   300ms;
  --duration-slower: 500ms;
}
```

### 1.2 Typography System

```css
/* FONTS TO IMPORT (in index.html <head>) */
/* 
  1. Geist (primary): Clean, modern, slightly geometric. Not Inter.
     https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700
  
  2. Geist Mono (monospace): For numbers, IDs, invoice amounts, percentages.
     https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600
  
  3. Noto Sans Devanagari (Hindi mode, lazy-loaded):
     https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600
*/

:root {
  --font-sans:  'Geist', 'Inter', system-ui, sans-serif;
  --font-mono:  'Geist Mono', 'JetBrains Mono', monospace;
  --font-hindi: 'Noto Sans Devanagari', sans-serif;

  /* TYPE SCALE */
  --text-xs:    0.6875rem;  /* 11px — micro labels */
  --text-sm:    0.8125rem;  /* 13px — secondary text */
  --text-base:  0.9375rem;  /* 15px — body */
  --text-md:    1rem;       /* 16px — slightly emphasized body */
  --text-lg:    1.125rem;   /* 18px — subheadings */
  --text-xl:    1.375rem;   /* 22px — card titles */
  --text-2xl:   1.75rem;    /* 28px — section headings */
  --text-3xl:   2.25rem;    /* 36px — page headings */
  --text-4xl:   3rem;       /* 48px — hero number displays */
  --text-5xl:   4rem;       /* 64px — hero headings */

  /* LETTER SPACING */
  --tracking-tight:  -0.03em;
  --tracking-snug:   -0.02em;
  --tracking-normal: -0.01em;
  --tracking-wide:   0.04em;
  --tracking-wider:  0.08em;
  --tracking-widest: 0.16em;  /* For uppercase labels only */

  /* LINE HEIGHT */
  --leading-tight:  1.2;
  --leading-snug:   1.35;
  --leading-normal: 1.5;
  --leading-loose:  1.7;
}
```

### 1.3 Tailwind Config — Complete

```typescript
// apps/web/tailwind.config.ts — REPLACE ENTIRELY

import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          void: '#0A0A0B',
          base: '#111113',
          raised: '#18181B',
          overlay: '#1E1E22',
          float: '#26262C',
        },
        text: {
          primary: '#F4F4F5',
          secondary: '#A1A1AA',
          tertiary: '#52525B',
          inverse: '#0A0A0B',
        },
        accent: {
          DEFAULT: '#F59E0B',
          dim: 'rgba(245,158,11,0.12)',
        },
        agent: {
          DEFAULT: '#818CF8',
          dim: 'rgba(129,140,248,0.10)',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          default: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.18)',
        },
        semantic: {
          success: '#34D399',
          warning: '#FBBF24',
          error: '#F87171',
          info: '#60A5FA',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
      },
      fontSize: {
        'xs':   ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
        'sm':   ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '-0.01em' }],
        'base': ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
        'md':   ['1rem',      { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
        'lg':   ['1.125rem',  { lineHeight: '1.5rem', letterSpacing: '-0.02em' }],
        'xl':   ['1.375rem',  { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],
        '2xl':  ['1.75rem',   { lineHeight: '2rem', letterSpacing: '-0.03em' }],
        '3xl':  ['2.25rem',   { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
        '4xl':  ['3rem',      { lineHeight: '1', letterSpacing: '-0.04em' }],
        '5xl':  ['4rem',      { lineHeight: '1', letterSpacing: '-0.04em' }],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
      },
      boxShadow: {
        'glass': 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.5)',
        'glass-hover': 'inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 40px rgba(0,0,0,0.6)',
        'accent': '0 0 24px rgba(245,158,11,0.20)',
        'agent': '0 0 20px rgba(129,140,248,0.15)',
        'button': '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'button-accent': '0 4px 16px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
      },
      backdropBlur: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '32px',
        'xl': '64px',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'agent-breathe': 'agentBreathe 3s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s var(--ease-out) forwards',
        'scale-in': 'scaleIn 0.2s var(--ease-spring) forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        agentBreathe: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.glass': {
          'background': 'rgba(255,255,255,0.04)',
          'backdrop-filter': 'blur(16px) saturate(180%)',
          '-webkit-backdrop-filter': 'blur(16px) saturate(180%)',
          'border': '1px solid rgba(255,255,255,0.08)',
          'box-shadow': 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.5)',
        },
        '.glass-hover': {
          'background': 'rgba(255,255,255,0.07)',
          'border-color': 'rgba(255,255,255,0.16)',
          'box-shadow': 'inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 40px rgba(0,0,0,0.6)',
        },
        '.glass-accent': {
          'background': 'rgba(245,158,11,0.06)',
          'backdrop-filter': 'blur(16px)',
          'border': '1px solid rgba(245,158,11,0.20)',
        },
        '.glass-agent': {
          'background': 'rgba(129,140,248,0.06)',
          'backdrop-filter': 'blur(16px)',
          'border': '1px solid rgba(129,140,248,0.20)',
        },
        '.text-gradient-accent': {
          'background': 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-agent': {
          'background': 'linear-gradient(135deg, #818CF8 0%, #C4B5FD 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.scrollbar-hidden': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
        '.focus-ring': {
          'outline': 'none',
          '&:focus-visible': {
            'outline': '2px solid rgba(245,158,11,0.7)',
            'outline-offset': '3px',
            'border-radius': '4px',
          },
        },
      })
    }),
  ],
} satisfies Config
```

---

## PART 2 — GLOBAL COMPONENTS

### 2.1 Glass Card Component

```tsx
// components/ui/GlassCard.tsx
// This is the foundational surface. Used everywhere.

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean      // enable hover lift effect
  accent?: boolean     // amber-tinted border on hover
  agent?: boolean      // indigo-tinted (for AI panels)
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

// BASE STYLES
// bg: var(--glass-surface) = rgba(255,255,255,0.04)
// backdrop-filter: blur(16px) saturate(180%)
// border: 1px solid rgba(255,255,255,0.08)
// border-radius: var(--radius-lg) = 16px
// box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.5)

// HOVER STATE (when hover=true)
// Framer Motion whileHover:
//   y: -2
//   boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 12px 40px rgba(0,0,0,0.65)"
//   borderColor: "rgba(255,255,255,0.16)"
// transition: spring { stiffness: 400, damping: 30 }

// ACCENT VARIANT (when accent=true + hover)
// whileHover borderColor: "rgba(245,158,11,0.30)"
// background on hover: rgba(245,158,11,0.04)

// AGENT VARIANT
// border: "1px solid rgba(129,140,248,0.20)"
// background: rgba(129,140,248,0.05)

// PADDING OPTIONS
// none: 0
// sm: 16px
// md: 24px (default)
// lg: 32px
```

### 2.2 Button System

```tsx
// components/ui/Button.tsx
// 4 variants. Each with its own motion behavior.

// VARIANT 1: PRIMARY (accent)
// Background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%)
// Color: #0A0A0B (dark text on amber)
// Border-radius: var(--radius-sm) = 8px
// Padding: 10px 20px (default), 8px 16px (sm), 12px 24px (lg)
// Font: 14px / font-weight 500 / letter-spacing -0.01em
// Box-shadow: 0 4px 16px rgba(245,158,11,0.30), inset 0 1px 0 rgba(255,255,255,0.15)
//
// Framer Motion:
//   whileHover: { scale: 1.02, boxShadow: "0 6px 24px rgba(245,158,11,0.45), inset 0 1px 0 rgba(255,255,255,0.2)" }
//   whileTap: { scale: 0.97 }
//   transition: spring { stiffness: 500, damping: 25 }
//
// Loading state: spinner replaces icon, text stays, disabled=true
// Spinner: 14px white SVG circle with animated strokeDashoffset

// VARIANT 2: SECONDARY (glass)
// Background: rgba(255,255,255,0.06)
// Border: 1px solid rgba(255,255,255,0.10)
// Color: #F4F4F5
// Backdrop-filter: blur(8px)
//
// Framer Motion:
//   whileHover: { backgroundColor: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.18)" }
//   whileTap: { scale: 0.97 }

// VARIANT 3: GHOST (invisible until hover)
// Background: transparent
// Border: none
// Color: #A1A1AA
//
// Framer Motion:
//   whileHover: { color: "#F4F4F5", backgroundColor: "rgba(255,255,255,0.05)" }
//   whileTap: { scale: 0.97 }

// VARIANT 4: DANGER
// Background: rgba(248,113,113,0.10)
// Border: 1px solid rgba(248,113,113,0.20)
// Color: #F87171
//
// whileHover: { backgroundColor: "rgba(248,113,113,0.18)", borderColor: "rgba(248,113,113,0.35)" }

// ICON BUTTONS (square, same variants)
// Size: 32x32 (sm), 36x36 (md), 40x40 (lg)
// border-radius: var(--radius-sm)

// BUTTON WITH LEADING ICON
// icon: 16px, margin-right: 8px
// icon animates separately on hover: x: 0 → -1 (for back) or x: 0 → 1 (for forward)
```

### 2.3 Input System

```tsx
// components/ui/Input.tsx

// BASE INPUT
// Background: rgba(255,255,255,0.04)
// Border: 1px solid rgba(255,255,255,0.10)
// Border-radius: var(--radius-sm) = 8px
// Color: #F4F4F5
// Placeholder color: #52525B
// Padding: 10px 14px
// Font: 15px / font-weight 400
// Height: 42px (default)
//
// FOCUS STATE
// border-color: rgba(245,158,11,0.60)
// box-shadow: 0 0 0 3px rgba(245,158,11,0.12)
// background: rgba(255,255,255,0.06)
// transition: all 150ms ease
//
// ERROR STATE
// border-color: rgba(248,113,113,0.60)
// box-shadow: 0 0 0 3px rgba(248,113,113,0.10)
//
// LABEL
// Color: #A1A1AA
// Font: 12px / font-weight 500 / letter-spacing 0.08em / uppercase
// Margin-bottom: 8px
// Animated: when input has content, label color shifts to #F4F4F5
//
// INPUT GROUP (icon + input)
// Left icon: 16px, positioned 14px from left, color #52525B → #A1A1AA on focus
// Input padding-left: 40px when icon present
//
// Framer Motion on focus:
//   The input border has a traveling glow effect using a gradient animation
//   Not distracting — just a 0.3s ease-in glow on the border

// TEXTAREA
// Same styles as input
// Min-height: 100px
// Resize: vertical only
// Scrollbar hidden except on hover

// SELECT / DROPDOWN
// Same base as input
// Chevron icon right: 16px, color #52525B
// Dropdown panel: glass, rounded-md, shadow-lg, border
// Option hover: rgba(255,255,255,0.06) background, left border accent
// Active option: text-accent + small check mark right

// SEARCH INPUT (special)
// Left icon: MagnifyingGlass, 16px, #52525B
// Right: Kbd hints "⌘K" in a pill when empty
// On focus: pill disappears, input expands via Framer layout animation
// Clear button (X) appears when has value
```

### 2.4 Badge / Status Chips

```tsx
// components/ui/Badge.tsx

// SIZES: sm (11px / padding 2px 8px) | md (12px / padding 3px 10px)
// BORDER-RADIUS: var(--radius-full) — always pill-shaped

// STATUS VARIANTS (with dot indicator)
// confirmed:  dot #60A5FA  / bg rgba(96,165,250,0.10)  / text #60A5FA
// completed:  dot #34D399  / bg rgba(52,211,153,0.10)  / text #34D399
// cancelled:  dot #F87171  / bg rgba(248,113,113,0.10) / text #F87171
// pending:    dot #FBBF24  / bg rgba(251,191,36,0.10)  / text #FBBF24
// draft:      dot #A1A1AA  / bg rgba(161,161,170,0.10) / text #A1A1AA
// overdue:    dot #FB923C  / bg rgba(251,146,60,0.10)  / text #FB923C
// no_show:    dot #C084FC  / bg rgba(192,132,252,0.10) / text #C084FC

// Dot: 6px circle, same color as text, animates pulse when status is 'pending' or 'in_progress'
// Pulse: scale 1 → 1.5 → 1, opacity 1 → 0 → 1, duration 2s loop

// PRIORITY BADGES (no dot, just label)
// urgent:  bg rgba(248,113,113,0.12) / text #F87171
// high:    bg rgba(251,191,36,0.12)  / text #FBBF24
// normal:  bg rgba(255,255,255,0.06) / text #A1A1AA
// low:     bg transparent / text #52525B / border border-subtle
```

### 2.5 Toast Notifications

```tsx
// Use Sonner (library) with custom styling

// TOAST CONTAINER
// Position: top-right, 24px from edges
// Width: 360px
//
// BASE TOAST
// background: #1E1E22 (bg-overlay)
// border: 1px solid rgba(255,255,255,0.10)
// border-radius: 12px
// padding: 14px 16px
// box-shadow: 0 8px 40px rgba(0,0,0,0.7)
// backdrop-filter: blur(16px)
//
// Left accent bar: 3px wide, full height, border-radius full
//   success: #34D399
//   error: #F87171
//   warning: #FBBF24
//   info: #818CF8 (agent color for AI actions)
//
// Framer Motion enter:
//   from: { opacity: 0, x: 40, scale: 0.94 }
//   to: { opacity: 1, x: 0, scale: 1 }
//   spring: { stiffness: 350, damping: 28 }
//
// Framer Motion exit:
//   to: { opacity: 0, x: 40, scale: 0.9 }
//   ease, duration: 0.2s
//
// AGENT ACTION TOAST (special)
// Left icon: sparkles ✦ in agent color
// Shows: "[Agent name] — [what it did]"
// Right: undo button (ghost, small)
// Border color: rgba(129,140,248,0.25)
```

### 2.6 Loading States

```tsx
// SKELETON COMPONENT
// No gray boxes. Use a shimmer pattern:
// background: linear-gradient(90deg,
//   rgba(255,255,255,0.04) 0%,
//   rgba(255,255,255,0.08) 50%,
//   rgba(255,255,255,0.04) 100%)
// background-size: 200% 100%
// animation: shimmer 2s linear infinite
// border-radius: matches the element it's replacing

// SPINNER (for buttons, inline)
// SVG: 16px circle with 3px stroke
// Color: currentColor
// Animation: rotate 360deg, 0.8s linear infinite
// NOT a full-screen spinner. Never block the whole page.

// PAGE LOADING (initial route load)
// Very subtle: thin progress bar at top (2px height, bg-void base)
// Color: accent (#F59E0B)
// Framer Motion: width 0 → 30% (immediate) → 100% (on load) → disappear
// Position: fixed top-0 left-0 right-0, z-index 9999

// SUSPENSE FALLBACK (per module)
// Each page has its own skeleton that matches its layout
// (Described in each page section below)
```

---

## PART 3 — PAGE-BY-PAGE DESIGN SPECIFICATION

### 3.1 AUTH PAGES — Login / Signup / Forgot Password

#### Visual Concept

```
LAYOUT (full screen, no nav)
───────────────────────────────────────────────────────────
Background: bg-void (#0A0A0B) — pure, uncluttered

Left half (desktop): 
  Large ambient graphic — NOT an illustration, NOT a photo.
  An abstract geometric mesh: interconnected nodes with faint
  lines, very subtle, barely visible.
  Color: single-shade dark zinc, like a circuit board seen
  from a satellite at night.
  Over it: 3 floating glass cards showing fake-but-real-looking
  metrics (revenue, bookings, client count) — the product's
  promise, visible before login.
  These cards have a slight floating animation (y: 0 → -8 → 0,
  6s ease-in-out loop, each offset by 2s for a natural drift).

Right half (desktop):
  Centered login form in a glass card.
  No logo bloat. Just a small wordmark at the top.

Mobile:
  Full screen, no left panel.
  Logo + form only, vertically centered with 24px side padding.
```

#### Logo / Wordmark Design

```
NOT a generic icon. 

The NicheFlow wordmark:
  "niche" — font: Geist, weight 600, color: #F4F4F5
  "flow"  — font: Geist, weight 300 (light), color: #F59E0B (accent)
  Together: "nicheflow" in a single line, size 22px
  Spacing: letter-spacing -0.04em

Above the wordmark:
  A small geometric mark: 3 stacked horizontal lines of
  decreasing width (12px, 8px, 5px), each 2px thick,
  left-aligned, color #F59E0B.
  NOT a logo generated to look like a tech startup.
  Think: like a typesetter's mark or a financial ledger symbol.
  These lines animate on page load:
    line 1: x: -8 → 0 (delay 0ms)
    line 2: x: -8 → 0 (delay 80ms)  
    line 3: x: -8 → 0 (delay 160ms)
    Each: opacity 0 → 1, duration 0.4s, ease-out
```

#### Login Form Card

```
CARD
  width: 400px (desktop), 100% (mobile)
  glass surface (rgba(255,255,255,0.04))
  border: 1px solid rgba(255,255,255,0.08)
  border-radius: 20px
  padding: 40px
  box-shadow: 0 24px 80px rgba(0,0,0,0.8)

CARD ENTER ANIMATION
  initial: { opacity: 0, y: 24, scale: 0.97 }
  animate: { opacity: 1, y: 0, scale: 1 }
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }

HEADING
  "Welcome back"
  Font: 28px / weight 600 / color: #F4F4F5 / tracking -0.03em
  Sub: "Sign in to your workspace"
  Font: 14px / weight 400 / color: #A1A1AA
  Margin-bottom: 32px

EMAIL FIELD
  Label: "Email"  (uppercase, 11px, letter-spacing 0.08em, color #52525B)
  Input: base input spec above
  Placeholder: "you@example.com"

PASSWORD FIELD
  Label: "Password"
  Right of label: "Forgot?" link (12px, color #A1A1AA, hover → #F59E0B)
  Input: base input + eye-toggle button (absolute right: 14px)
  Eye icon: 16px, color #52525B, hover → #A1A1AA
  Toggle animation: when revealed, icon swaps with Framer layoutId
  
  Show/hide animation:
    The password characters animate from ● to their actual character:
    Using a CSS filter blur: 4px → 0, duration 0.2s

SIGN IN BUTTON
  Full width, variant: primary
  Text: "Sign in"
  Right icon: ArrowRight (16px)
  Icon animates: x: 0 → 4px on hover (spring)
  Loading state: spinner replaces ArrowRight

DIVIDER
  "Or" divider: thin line on each side, "or" in #52525B, 12px
  Full width, margin 20px 0

GOOGLE BUTTON (optional)
  Variant: secondary (glass)
  Left: Google G SVG (16px, exact brand colors — NOT an emoji)
  Text: "Continue with Google"

FOOTER
  "Don't have an account? " + "Sign up" link
  Color: #52525B / link color: #A1A1AA hover #F4F4F5
  Font: 14px, centered
  Margin-top: 24px

AMBIENT BACKGROUND ELEMENTS (behind card)
  Two blurred orbs, very subtle:
  Orb 1: 300px circle, rgba(245,158,11,0.05), positioned top-left
  Orb 2: 250px circle, rgba(129,140,248,0.04), positioned bottom-right
  filter: blur(80px)
  No animation. Static. Just depth.

ERROR STATE (inline, no modal)
  A slim error bar slides in ABOVE the button:
  background: rgba(248,113,113,0.10)
  border: 1px solid rgba(248,113,113,0.20)
  border-radius: 8px
  padding: 10px 14px
  text: 13px, color #F87171
  left icon: ExclamationCircle, 14px
  Framer enter: { height: 0, opacity: 0 } → { height: "auto", opacity: 1 }
```

#### Signup Page

```
Identical layout to Login.

STEP INDICATOR
  Signup is a 2-step flow, not a single form.
  Top of card: a subtle progress bar
    2 dots connected by a line
    Active dot: 8px circle, color #F59E0B
    Inactive dot: 6px circle, color rgba(255,255,255,0.15)
    Line: 1px, rgba(255,255,255,0.10)
    Connected dot becomes accent when reached
    
Step 1: "Create your account"
  Fields: Full name, Email, Password (with strength indicator)
  
  PASSWORD STRENGTH METER
    4 segments below the password input
    Each: 3px height, border-radius full
    Colors: empty=#26262C, weak=#F87171, fair=#FBBF24, strong=#34D399, great=#818CF8
    Animates: Framer width animation as user types
    Label: "weak" / "fair" / "strong" / "great" in matching color, 11px

Step 2: "Tell us about your business"
  Fields: Business name, Business type (visual card grid)
  Transition between steps:
    Step 1 exits: x: 0 → -40, opacity: 1 → 0
    Step 2 enters: x: 40 → 0, opacity: 0 → 1
    Duration: 0.25s, ease-out
```

---

### 3.2 ONBOARDING WIZARD

```
LAYOUT
  Full screen, bg-void.
  Center: single step card (max-width 520px, glass)
  Top: step counter "Step 2 of 5" in 12px / #52525B
  Below counter: thin progress bar
    height: 2px, border-radius: full
    background: rgba(255,255,255,0.08)
    fill: linear-gradient(90deg, #F59E0B, #FCD34D)
    Framer: width animates with spring on step change

STEP CARD TRANSITIONS
  Current step exits: { x: -30, opacity: 0, scale: 0.97 }
  Next step enters: { x: 30, opacity: 0, scale: 0.97 } → { x: 0, opacity: 1, scale: 1 }
  Spring: { stiffness: 300, damping: 28 }

STEP 1: Business Type
  Heading: "What do you do?" — 32px / weight 600
  Sub: "We'll personalize NicheFlow for you." — 15px / #A1A1AA
  
  BUSINESS TYPE GRID
    3 columns, 3 rows (9 options)
    Each card: glass surface, 100% width in cell, padding 20px
    Border-radius: 16px
    
    Card content:
      Emoji: 32px (NOT a colored icon — use the native emoji)
        dog_trainer: 🐕  tailor: 🧵  photographer: 📷
        urban_farmer: 🌿  yoga_studio: 🧘  salon: ✂️
        tutor: 📖  caterer: 🫕  other: ✦
      Label: 14px / weight 500 / #A1A1AA (unselected) → #F4F4F5 (selected)
      
    UNSELECTED STATE:
      border: 1px solid rgba(255,255,255,0.08)
      background: rgba(255,255,255,0.03)
      
    SELECTED STATE:
      border: 1px solid rgba(245,158,11,0.40)
      background: rgba(245,158,11,0.06)
      box-shadow: 0 0 0 1px rgba(245,158,11,0.20)
      Small check: absolute top-right, 16px circle, bg #F59E0B, white check icon 10px
      
    Framer whileHover (unselected only):
      border-color: rgba(255,255,255,0.16)
      background: rgba(255,255,255,0.06)
      y: -2
      
    Framer selection tap:
      scale: 0.96 → 1 (spring, very quick)
      Then border/bg animate to selected state

STEP 2: Business Info
  3 inputs: Business name, Phone, City
  GST: optional, small helper text below "You can add this later"
  
STEP 3: Language
  2 large cards (EN / HI), same as business type grid
  Inside each card: language name in that language
  English: "English" in Geist
  Hindi: "हिंदी" in Noto Sans Devanagari
  
STEP 4: First Service
  Simplified form: service name, duration (pill selectors: 30min 1hr 1.5hr 2hr), price
  DURATION PILLS:
    Row of 4 pill buttons
    Inactive: glass + border
    Active: accent background + dark text
    Framer layoutId for sliding highlight between pills
    
STEP 5: Complete 🎉
  Centered, no form.
  Large checkmark animation:
    SVG circle (64px): draws itself (stroke-dashoffset 0 → circumference)
    Then checkmark inside: draws itself
    Color: #34D399 (success)
    Duration: 0.8s, ease-in-out
  Heading: "You're all set."
  Sub: "Your workspace is ready. Let's make it work."
  3 action cards:
    "Add your first client →"
    "Create a booking →"
    "Go to dashboard →" (primary, accent)

NAVIGATION BAR (bottom of wizard)
  Back button (ghost, left) | Step X of 5 (center, 12px) | Next button (accent, right)
  Back: only shown from step 2+
  Next is disabled if required fields empty — button shows opacity 0.4, cursor not-allowed
  Next on final step becomes "Finish"
```

---

### 3.3 APP SHELL — Layout, Sidebar, Topbar

#### Sidebar (Desktop)

```
SIDEBAR
  Width: 240px (expanded), 60px (collapsed)
  Position: fixed left-0, full height, z-index 100
  Background: rgba(10,10,11,0.95) — near-opaque void
  Border-right: 1px solid rgba(255,255,255,0.06)
  Backdrop-filter: blur(24px)
  
  Collapse/expand: Framer layout animation, width transition
    spring { stiffness: 300, damping: 30 }
    Icon labels fade out (opacity 0 → 1) as sidebar expands
    
  TOP SECTION
    Logo: "niche" + "flow" wordmark (20px), 20px from top, 20px from left
    Collapsed: just the 3-line geometric mark (14px)
    
  WORKSPACE SELECTOR (below logo, 12px margin)
    Small pill showing: [avatar 20px] [workspace name] [chevron down]
    background: rgba(255,255,255,0.06)
    border: 1px solid rgba(255,255,255,0.08)
    border-radius: var(--radius-full)
    padding: 4px 8px 4px 4px
    On click: dropdown (glass panel) showing workspaces + "Add workspace"
    
  NAVIGATION ITEMS
    Sections separated by 1px dividers (rgba(255,255,255,0.06))
    
    Section 1 (no label):
      Dashboard
    Section 2 ("Manage"):
      Bookings
      Clients
      Invoices
    Section 3 ("Operate"):
      Inventory
      Tasks
    Section 4 ("Grow"):
      Public Page
    
    EACH NAV ITEM
      Height: 36px
      Padding: 0 12px
      Border-radius: 8px (inner padding)
      Gap between icon and label: 10px
      Icon: 16px, color #52525B (inactive) → #F4F4F5 (active)
      Label: 14px / weight 500 / color #52525B (inactive) → #F4F4F5 (active)
      Margin: 2px 8px (8px side margins inside sidebar)
      
      INACTIVE hover:
        background: rgba(255,255,255,0.05)
        icon + text color → #A1A1AA
        Framer: backgroundColor animate, 120ms ease
        
      ACTIVE STATE:
        background: rgba(245,158,11,0.10)
        border-left: none (no visible dividers on active item)
        A small 3px left accent bar: absolute left-0, height 16px, bg #F59E0B, border-radius full
        Icon color: #F59E0B
        Text color: #F4F4F5
        
        Active indicator animation (when navigating):
          The 3px accent bar uses Framer layoutId="nav-indicator"
          It slides smoothly between active items vertically
          spring { stiffness: 380, damping: 30 }
          
      BADGE (notification count):
        Small pill right-aligned: height 16px, min-width 16px, bg rgba(245,158,11,0.20)
        Text: 10px / weight 600 / color #F59E0B
        Only shows when count > 0
        Enter animation: scale 0 → 1, spring
        
  BOTTOM SECTION (pinned to bottom)
    Settings item (same nav item style)
    Divider
    User avatar + name + role chip
    Avatar: 28px circle, glass border
    Name: 13px / weight 500
    Role: 10px chip (owner/admin/staff)
    
    AGENT STATUS INDICATOR
      Just above the user section:
      A subtle row: small indigo dot (6px, breathing animation) + "AI Active" text (11px / #818CF8)
      When agents are running: dot is solid + breathing
      When idle: dot is 20% opacity, no animation
```

#### Topbar

```
TOPBAR
  Height: 56px
  Position: fixed top-0, left: 240px (sidebar width), right: 0
  Background: rgba(10,10,11,0.90)
  Border-bottom: 1px solid rgba(255,255,255,0.06)
  Backdrop-filter: blur(16px)
  Padding: 0 24px
  z-index: 90
  
  LEFT: Page breadcrumb
    Module name: 16px / weight 600 / color #F4F4F5
    Page sub-path (if any): 14px / color #A1A1AA / "→" separator
    
  CENTER: Global search (desktop)
    width: 320px max
    Height: 34px
    left icon: MagnifyingGlass 14px / #52525B
    placeholder: "Search..." | right: "⌘K" pill
    background: rgba(255,255,255,0.05)
    border: 1px solid rgba(255,255,255,0.08)
    border-radius: var(--radius-full)
    Font: 13px
    
    On focus (Framer):
      width: 400px (layout animation)
      border-color: rgba(245,158,11,0.40)
      box-shadow: 0 0 0 3px rgba(245,158,11,0.08)
      
  RIGHT CLUSTER (gap: 8px)
    1. Language toggle: "EN | HI" — two small text buttons
       Active: weight 600 / color #F4F4F5
       Inactive: weight 400 / color #52525B
       Separator: 1px / rgba(255,255,255,0.10)
       
    2. Notification bell: 36x36 ghost icon button
       Badge: if count > 0, red dot (8px circle, no number — just indicator)
       On click: slide-down panel (glass, 380px wide)
       
    3. User menu: avatar (28px) + chevron
       On click: glass dropdown (name, email, Settings, Logout)
```

#### Page Transitions

```
Wrap all <Outlet/> children with:

<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
  >
```

#### Mobile Bottom Navigation

```
MOBILE NAV (≤768px)
  Fixed bottom-0, full width
  Height: 60px + env(safe-area-inset-bottom)
  Background: rgba(10,10,11,0.95)
  Border-top: 1px solid rgba(255,255,255,0.08)
  Backdrop-filter: blur(24px)
  
  5 items: Dashboard | Bookings | Clients | Tasks | More
  Each: icon (20px) + label (10px)
  
  ACTIVE ITEM
    Framer layoutId="mobile-tab-bg"
    A glass pill (56px wide, 36px tall) slides under the active icon
    background: rgba(245,158,11,0.12)
    border: 1px solid rgba(245,158,11,0.20)
    border-radius: var(--radius-full)
    spring { stiffness: 400, damping: 30 }
    Icon + text color → #F59E0B on active
    
  FAB (Quick Add)
    Position: absolute bottom-16 right-4 (above nav bar)
    Size: 52px circle
    Background: #F59E0B
    Shadow: 0 4px 20px rgba(245,158,11,0.45)
    Icon: Plus (20px, dark #0A0A0B)
    
    On tap: expands to a fan of 4 action buttons
    Each fan button:
      Size: 44px circle
      Background: glass (rgba(255,255,255,0.08))
      Border: 1px solid rgba(255,255,255,0.12)
      Icon: 18px
      Small label tooltip above each
      
    Fan animation (staggered, originating from FAB position):
      Button 1 (New Booking):   y: 0→-64px,  x: 0→-28px, delay: 0ms
      Button 2 (New Client):    y: 0→-52px,  x: 0→-74px, delay: 40ms
      Button 3 (New Invoice):   y: 0→-28px,  x: 0→-98px, delay: 80ms
      Button 4 (New Task):      y: 0→-8px,   x: 0→-108px, delay: 120ms
      All: opacity 0→1, scale 0.5→1, spring { stiffness: 350, damping: 22 }
      
    FAB icon: Plus → rotates 45° to × when fan is open
    Rotation: spring { stiffness: 400, damping: 20 }
```

---

### 3.4 DASHBOARD

```
LAYOUT (grid system)
  Desktop: 12-column grid, 24px gaps
  Mobile: single column, 16px gaps
  
  Row 1 (cols 1-12): 4 KPI stat cards (each 3 cols)
  Row 2 (cols 1-8): Revenue chart
  Row 2 (cols 9-12): Agent Activity Feed
  Row 3 (cols 1-5): Upcoming Schedule
  Row 3 (cols 6-12): Quick Insights (AI-generated)

--- KPI STAT CARDS ---

CARD ANATOMY (one of 4)
  Width: full (in 3-col grid)
  Height: 120px
  Glass surface (standard)
  Padding: 24px
  Border-radius: 16px
  
  TOP ROW
    Left: icon in a 32x32 glass container
      Icon: 16px, color varies by card
      Container: rounded-md, glass, border
      
    Right: percentage change chip
      + value: text-success (#34D399)
      - value: text-error (#F87171)
      neutral: text-secondary (#A1A1AA)
      Background: matching semantic-dim
      Font: 11px / weight 600
      Arrow icon: ↑ or ↓, 10px
      
  MAIN VALUE
    Font: 36px / weight 700 / tracking -0.04em / color #F4F4F5
    Font-family: Geist Mono (numbers always monospace)
    Currency prefix: 24px / weight 400 / color #A1A1AA
    
    COUNTER ANIMATION (on mount):
      Animate from 0 to actual value
      Duration: 1.2s / ease-out
      Delay: stagger 0.1s per card
      
  LABEL
    Font: 12px / weight 500 / letter-spacing 0.04em / uppercase / color #52525B
    Margin-top: 8px
    
  BOTTOM: mini sparkline (28px tall)
    Simple SVG path (last 7 data points)
    stroke: rgba(245,158,11,0.40) for revenue / semantic colors for others
    fill: gradient below the line (very subtle)
    strokeWidth: 1.5
    No axes, no labels
    
  HOVER: standard glass-hover behavior + y: -2

KPI CARDS (4 specific):

  1. REVENUE MTD
     Icon: ChartBar (lucide), color #F59E0B in glass-accent container
     Value: ₹XX,XXX (Geist Mono)
     Label: REVENUE THIS MONTH
     Sparkline: amber

  2. BOOKINGS TODAY
     Icon: CalendarCheck, color #60A5FA in rgba(96,165,250,0.10) container
     Value: XX
     Label: BOOKINGS TODAY
     Sparkline: info blue

  3. ACTIVE CLIENTS
     Icon: Users, color #34D399 in rgba(52,211,153,0.10) container
     Value: XXX
     Label: ACTIVE CLIENTS
     Sparkline: success green

  4. TASKS OVERDUE
     Icon: AlertCircle, color #F87171 in rgba(248,113,113,0.10) container
     Value: XX
     Label: OVERDUE TASKS
     When value > 0: card border subtly pulses amber
       border animation: rgba(248,113,113,0.10) → rgba(248,113,113,0.25) → rgba(248,113,113,0.10)
       duration: 3s loop

--- REVENUE CHART ---

CARD: glass, padding 24px, height 280px

HEADER ROW
  Left: "Revenue" (16px / weight 600) + "This month" subtext (13px / #A1A1AA)
  Right: Period selector tabs (Today | Week | Month | Year)
    Small pill tabs, glass inactive, accent active
    Framer layoutId for sliding active pill

CHART (Recharts AreaChart)
  Responsive container, height: 180px
  
  AREA
    Gradient fill:
      from: rgba(245,158,11,0.20) at top
      to: rgba(245,158,11,0.00) at bottom
    Stroke: #F59E0B, strokeWidth: 2
    
  AXES
    X-axis: thin, color rgba(255,255,255,0.08), tick color #52525B, 11px
    Y-axis: no line, tick color #52525B, 11px, prefix "₹"
    Grid: horizontal dashed lines, rgba(255,255,255,0.04)
    
  TOOLTIP (custom)
    Glass card: 120px wide, padding 10px 14px
    border-radius: 10px
    Date: 11px / #A1A1AA
    Value: 16px / weight 600 / Geist Mono / #F59E0B
    Entry animation: scale 0.9 → 1, opacity 0 → 1, 100ms

  CHART ENTRY ANIMATION
    The stroke draws itself on mount:
    SVG stroke-dashoffset animates from full path length → 0
    Duration: 1.5s, ease-in-out
    The area fill fades in after the line finishes: opacity 0 → 1, 0.4s

--- AGENT ACTIVITY FEED ---

CARD: glass-agent (indigo-tinted border), padding 24px
Header: "Agent Activity" (16px / weight 600) + small indigo dot (breathing animation)

EACH ACTIVITY ITEM
  Layout: horizontal row, 48px min-height
  Left: Agent icon container (28px circle, glass-agent background, 14px icon)
  Gap: 12px
  Center: 
    Action text (13px / weight 500 / #F4F4F5)
    Timestamp (11px / #52525B), relative time
  Right: Entity link button (ghost, 11px, "→ View")
  
  Bottom: 1px divider (rgba(255,255,255,0.06)) between items
  
  ENTER ANIMATION (real-time items)
    New item pushes from top:
    initial: { height: 0, opacity: 0, y: -10 }
    animate: { height: 48, opacity: 1, y: 0 }
    spring: { stiffness: 280, damping: 22 }
    
  OLD ITEMS: fade slightly (opacity reduces to 0.7 for items older than 1h)
  
  UNDO BUTTON (on hovering recent item, within 5min)
    Appears on item right side
    initial: { opacity: 0, x: 8 } → hover shows → { opacity: 1, x: 0 }
    Small ghost button: "Undo" / 11px

--- UPCOMING SCHEDULE STRIP ---

CARD: glass, padding 24px

Header row:
  "Today's Schedule" / 16px / weight 600
  Date: "Mon, 14 Jun" / 13px / #A1A1AA

BOOKING ITEMS (vertical list, gap: 8px)
  Each item is a glass card inside the card (nested)
  Inner card: padding 12px 16px, border-radius 10px
  background: rgba(255,255,255,0.03)
  border: 1px solid rgba(255,255,255,0.06)
  
  Left: time column
    Time: 14px / weight 600 / Geist Mono / color #F4F4F5
    Duration: 11px / #52525B
    
  Center: info
    Service name: 14px / weight 500
    Client name: 12px / #A1A1AA
    
  Right: status badge (small)
  
  On hover: y: -1, border-color strengthens
  
  EMPTY STATE
    No schedule graphic. Instead:
    A clean text block: "No bookings today."
    Below: "Add one →" in accent color, 14px, underlined on hover

--- QUICK INSIGHTS CARD (AI-generated) ---

CARD: glass-agent, padding 24px

Header: sparkle icon (14px, #818CF8) + "Insights" (16px / weight 600)
Sub: "from NicheFlow Brain" (12px / #52525B / italic)

INSIGHT ITEMS (2-3 bullet points)
  Each: a row with a small colored left-dot + insight text
  Dot color: semantic color matching the insight type (warning for risk, success for good news)
  Text: 14px / #A1A1AA with key numbers bolded in #F4F4F5
  
  SKELETON STATE (before AI loads):
    3 lines of shimmer, widths: 90%, 75%, 60%
    
  LOADED animation:
    Each insight fades up (y: 6 → 0, opacity 0 → 1) with 0.15s stagger

REFRESH BUTTON (top right of card)
  Ghost icon button: RefreshCw icon (14px)
  On click: icon spins, re-fetches digest
  Spin animation: rotate 0 → 360, 0.8s linear
```

---

### 3.5 BOOKINGS MODULE

```
PAGE HEADER (consistent across all modules)
  Left: page title + count badge
  Right: view switcher + primary action button
  
  VIEW SWITCHER
    Segmented control: Calendar | List
    Container: glass, height 34px, border-radius: full, padding: 3px
    Active segment: solid white background, border-radius: full, shadow-sm
    Inactive: transparent, text #A1A1AA
    Framer layoutId for sliding background
    
  "New Booking" button:
    Variant: primary (accent)
    Left icon: Plus (14px)

--- CALENDAR VIEW ---

Uses FullCalendar. Override ALL default styles:

CALENDAR CONTAINER
  background: transparent
  All FullCalendar built-in colors removed

  TOOLBAR (month/week/day navigation)
    background: transparent
    Today button: glass + border
    Navigation arrows: ghost icon buttons (ChevronLeft / ChevronRight)
    Month title: 20px / weight 600 / #F4F4F5
    
  DAY HEADER ROW
    Day labels: 11px / weight 500 / letter-spacing 0.08em / uppercase / #52525B
    
  CALENDAR GRID
    Day cells: 
      border: 1px solid rgba(255,255,255,0.06)
      background: transparent
      
    Today cell:
      background: rgba(245,158,11,0.05)
      border-top: 2px solid #F59E0B
      
    Other month cells:
      background: rgba(0,0,0,0.15)
      day number: #52525B
      
  BOOKING EVENTS
    Base event:
      background: rgba(96,165,250,0.15)
      border-left: 3px solid #60A5FA
      border-radius: 6px
      color: #F4F4F5
      font-size: 12px
      padding: 2px 6px
      border: none (override FullCalendar default)
      
    Event colors (by service category):
      Use a rotating palette: info, success, agent, warning
      Each service type gets consistent color
      
    Hover: 
      background lightens (+0.1 opacity)
      y: -1px (CSS transition, not Framer)
      
    CLICK → Booking Detail Slide-over (see below)

--- BOOKING DETAIL SLIDE-OVER ---

Overlay: rgba(0,0,0,0.50) with blur(4px), fades in
Panel: slides in from right
  width: 420px (desktop) / full width (mobile)
  position: fixed right-0, top-0, bottom-0
  background: #18181B (bg-raised)
  border-left: 1px solid rgba(255,255,255,0.08)
  
  Framer:
    initial: { x: 420, opacity: 0 }
    animate: { x: 0, opacity: 1 }
    exit: { x: 420, opacity: 0 }
    spring: { stiffness: 300, damping: 30 }
    
  PANEL HEADER
    Height: 60px, border-bottom: border-subtle
    Title: "Booking" + status badge
    Close: X ghost icon button (top right)
    
  PANEL CONTENT (scrollable)
    Padding: 24px
    
    CLIENT SECTION
      Client avatar (36px) + name (16px / weight 600) + phone (12px / #A1A1AA)
      "View client →" small link
      
    BOOKING DETAILS
      Using a consistent key-value layout:
      Key: 11px / uppercase / #52525B
      Value: 14px / #F4F4F5
      Each row: 40px height, border-bottom: border-subtle
      Keys: SERVICE | DATE | TIME | DURATION | PRICE | LOCATION | NOTES
      
    ACTIONS ROW
      Icon buttons row: Complete | Cancel | No-show | Edit
      Spacing: glass container with dividers between icon buttons
      
    NOTES SECTION
      Collapsible, arrow rotates on open
      Tiptap editor (stripped down)

--- BOOKING FORM (Modal / Page) ---

MODAL
  Centered, max-width 560px
  Glass surface + strong shadow
  border-radius: 20px
  Padding: 32px
  
  Header: "New Booking" + X close
  
  FIELDS layout:
    Client: SearchableSelect (custom component, see below)
    Service: card grid (2 columns), smaller than onboarding
    Date: custom calendar picker (mini month view, inline)
    Time: grid of time slots
    Price: pre-filled input, editable
    Notes: textarea
    
  CUSTOM CALENDAR PICKER
    Mini month view (not full-screen)
    Previous month: faded
    Available day: glass hover
    Booked day: has small colored dot below the number
    Selected day: accent background, rounded-full
    Today: underlined number
    
  TIME SLOT GRID
    3 columns, gap 8px
    Each slot: glass pill
    Available: normal glass
    Booked: opacity 0.3, line-through, cursor not-allowed
    Selected: accent background
    Framer: selected slot has layoutId background

  SEARCHABLE CLIENT SELECT
    Input with search icon
    Below: dropdown list
    Each option: avatar + name + phone
    "Add new client" at bottom of list
    Highlighted match: accent text on matching characters
```

---

### 3.6 CLIENTS MODULE

```
LAYOUT (desktop split)
  Left panel: 300px fixed, full height, border-right: border-subtle
  Right panel: flex-1, scrollable

--- CLIENT LIST (left panel) ---

SEARCH + FILTER ROW
  Full-width search input (14px, glass)
  Filter button: glass icon button, opens filter panel
  
FILTER PANEL (slides down below search)
  Chips: All | VIP | At Risk | New | Inactive
  Each chip: glass pill, active = accent background
  
CLIENT ITEMS (scrollable list)
  Each item: 64px height, padding 12px 16px
  
  Avatar: 36px circle
    If photo: circular image
    If no photo: initials on glass bg, color generated from name hash
    
  Name: 14px / weight 500
  Phone: 12px / #A1A1AA
  
  Health Ring (right side of avatar):
    SVG ring, 40px diameter, 3px stroke
    Overlaps avatar (positioned absolute)
    Color: health-score based
      80-100: #34D399
      50-79: #FBBF24
      0-49: #F87171
    stroke-dasharray animated on mount
    
  Right: last interaction (11px / #52525B) + arrow icon
  
  ACTIVE/SELECTED ITEM
    background: rgba(245,158,11,0.08)
    border-left: 3px solid #F59E0B (no, make it the same sliding indicator)
    Active indicator: same Framer layoutId sliding bar pattern as sidebar
    
  HOVER: background: rgba(255,255,255,0.04)
  
  VIP BADGE: small crown emoji (👑) or star chip in top-right of avatar
  AT RISK: small warning indicator dot

--- CLIENT DETAIL (right panel) ---

STICKY HEADER (sticky to right panel top)
  Client name: 28px / weight 700
  Role chip + health score chip
  Action buttons: Book | Invoice | WhatsApp | Call (icon buttons in a glass container)
  
STATS ROW (4 glass mini-cards, horizontal)
  Each: 90px, centered label + value
  Values: Total Bookings | Revenue | Avg Spend | Days Since Visit
  Font: value in Geist Mono, 20px weight 700; label 10px uppercase #52525B

TABBED CONTENT
  Tabs: Overview | Notes | Bookings | Invoices | Interactions
  
  TAB BAR
    Underline style (not pills)
    Active tab: text #F4F4F5, underline: 2px solid #F59E0B
    Inactive: text #52525B
    Framer layoutId for sliding underline
    
  OVERVIEW TAB
    Custom fields section (business-type specific)
    For tailor: measurement body diagram (SVG silhouette with labels)
      Each measurement: labeled line pointing to body part
      Values: Geist Mono, 13px, beside each label
      When empty: dashed lines + "+ Add" prompts
    
  NOTES TAB
    NEW NOTE COMPOSER
      Tiptap editor with minimal toolbar
      Toolbar: Bold | Italic | Link | List | ——— | Voice (mic icon)
      Toolbar appears on focus, hidden when blur
      Glass container, border: border-default, padding 16px
      
      VOICE MIC BUTTON
        When inactive: microphone icon (16px, #52525B)
        When recording:
          Icon becomes red (#F87171)
          A waveform animation appears next to it:
            4 vertical bars with different heights
            Each bar: animates height 30% → 100% → 30% with stagger
            Color: #F87171
        "Stop & Save" button appears during recording
        
    NOTE CARDS (list)
      Glass card, padding 16px
      Top: timestamp (11px / #52525B) + author + voice chip (if voice note)
      Content: rendered markdown
      Bottom: AI summary bar (if exists)
        Small agent icon + summary text (italic, #A1A1AA)
        Collapsible action items list
```

---

### 3.7 INVOICES MODULE

```
PAGE LAYOUT
  Header: "Invoices" + filter tabs + "New Invoice" button
  
STATUS TABS (horizontal scrollable on mobile)
  All | Draft | Sent | Paid | Overdue
  Tab pill style: same segmented pattern, but multiple tabs
  Each tab: count badge inside
  
INVOICE TABLE / CARD LIST

  DESKTOP: Table
  Header row: glass background, 12px uppercase headers
  Columns: # | Client | Amount | Due Date | Status | Paid | Actions
  
  Each row:
    Height: 56px
    Hover: background rgba(255,255,255,0.03)
    
    Invoice # : Geist Mono, 13px, #A1A1AA → link on hover
    Client: avatar + name (standard)
    Amount: Geist Mono, 15px, weight 600, color #F4F4F5
    Due Date: conditional color (past = error, today = warning, future = secondary)
    Status: badge
    Paid bar: progress bar showing amount paid
      Container: rgba(255,255,255,0.08), height 4px, border-radius full
      Fill: #34D399, animates width on mount
    Actions: 3-dot menu (ghost button, dropdown)
    
  MOBILE: Cards
    Each invoice as a glass card, 80px tall
    Same info, stacked layout
    Amount prominent on right

--- INVOICE DETAIL PAGE ---

SPLIT LAYOUT
  Left: Form / Data (55% width)
  Right: Live Preview (45% width, sticky)
  
  On mobile: stack, preview below form

LEFT PANEL: INVOICE FORM
  Client selector
  Booking link (optional)
  Date fields (issue / due)
  
  LINE ITEMS TABLE
    Minimalist table design
    Header: Description | Qty | Rate | Amount — 11px uppercase
    Row: input fields inline (glass inputs)
    Amount: auto-calculated, Geist Mono
    
    ADD ITEM ROW
      Button: "+ Add item" (ghost, accent text, 13px)
      
    DRAG HANDLES (reorder rows)
      6-dot handle icon (GripVertical), 14px, color #52525B
      Appears on row hover only
      dnd-kit drag: row gets y: -2, shadow, z-index bump during drag
      Drop zone: 2px dashed accent line appears between rows
      
  TOTALS SECTION (right-aligned)
    Subtotal | Tax (18% GST) | Discount | Total
    Divider above Total: 1px, rgba(255,255,255,0.10)
    Total amount: 24px / weight 700 / Geist Mono / #F4F4F5
    
  NOTES + TERMS
    Collapsible sections (accordion)
    Arrow rotates 90° on open (Framer spring)

RIGHT PANEL: LIVE PREVIEW
  Renders the actual invoice HTML (same as PDF output)
  Surrounded by a subtle device-frame effect (light drop shadow, slight border)
  Scaled down to fit: transform: scale(0.85), transform-origin: top center
  Updates live as form changes (debounced 300ms)
  
  "Download PDF" button below preview
  "Share Link" button (copies public URL)

ACTION BAR (fixed bottom, desktop)
  Floating bar appears when form is modified:
    "Unsaved changes" | Discard (ghost) | Save as Draft | Send Invoice (accent)
  Initial: y: 80px (hidden below viewport) → y: 0 when modified
  Glass surface, border-top: border-subtle
```

---

### 3.8 INVENTORY MODULE

```
VIEW TOGGLE: Grid | Table (same segmented switcher)

GRID VIEW
  3 columns desktop, 2 columns tablet, 1 mobile
  Gap: 16px
  
  EACH ITEM CARD (glass, hover lift)
    Image area: 160px height, rounded-md top corners
      If no image: gradient placeholder with item initial letter
      Gradient: random from palette based on name hash
    Content: padding 16px
    
    NAME: 15px / weight 600
    Category chip: small pill (11px)
    
    STOCK LEVEL BAR
      Height: 6px, border-radius full, width: 100%
      Container: rgba(255,255,255,0.08)
      Fill: dynamic color (green → amber → red as stock decreases)
      Animate on mount: width 0 → actual percentage, 0.8s ease-out
      
    Stock number: "24 units" — Geist Mono, 13px
    
    QUICK ADJUST (appears on hover)
      "–" and "+" buttons appear below stock bar
      initial: { opacity: 0, y: 4 } → hover: { opacity: 1, y: 0 }
      Clicking +/–: stock number animates (slides up for +, slides down for –)
      
    LOW STOCK INDICATOR
      When stock ≤ threshold: orange warning pill replaces stock text
      "Low Stock" with warning icon, pulse animation
      
    EXPIRY CHIP (for perishable items)
      Bottom of card, below stock bar
      Background: semantic color based on days remaining
      Text: "Expires in 3 days"
      
--- TABLE VIEW ---
  Standard glass table (same as invoices)
  Columns: Name | SKU | Category | Stock | Threshold | Value | Status | Actions
  Inline stock adjustment: click stock number → becomes editable input

--- MOVEMENT LOG DRAWER ---
  Same slide-over pattern as booking detail
  Timeline layout: vertical line with event dots
  Each event: type icon + amount + date + note
```

---

### 3.9 TASKS MODULE

```
VIEW TOGGLE: Kanban | List | Calendar

--- KANBAN VIEW ---

BOARD LAYOUT
  Horizontal scroll on mobile
  4 columns, each: 280px width, gap: 16px
  
  COLUMN HEADER
    Column name: 13px / weight 600 / uppercase / #A1A1AA
    Count badge: glass pill
    "+" icon button: ghost, top right
    
  COLUMN BODY
    background: rgba(255,255,255,0.02)
    border-radius: 12px
    border: 1px solid rgba(255,255,255,0.06)
    padding: 12px
    min-height: 500px
    
  TASK CARDS
    Glass card, padding 14px 16px
    border-radius: 10px
    margin-bottom: 8px
    
    PRIORITY INDICATOR
      3px left border, full height
      urgent: #F87171 | high: #FBBF24 | normal: transparent | low: border-subtle
      
    TASK TITLE
      15px / weight 500 / #F4F4F5
      If overdue: text color #F87171, strikethrough (if done)
      
    META ROW (below title)
      Client chip (if linked): avatar + name, 11px
      Due date: 11px / Geist Mono
      Subtask progress: "2/5" + tiny mini-progress bar (3px height, 40px wide)
      Assignee avatar: 18px circle, overlaps right edge
      
    CARD HOVER
      y: -2, shadow increase (spring)
      Show drag handle (cursor: grab)
      
    DRAG STATE (active drag)
      scale: 1.03
      shadow: 0 16px 48px rgba(0,0,0,0.7)
      rotation: 2deg (slight tilt while dragging)
      other cards in column: slightly compress vertically to show drop zones
      
    DROP ZONE (between cards)
      2px horizontal line: background: linear-gradient(90deg, transparent, #F59E0B, transparent)
      height: 2px, border-radius: full
      Appears with opacity: 0→1 (100ms ease) when dragging near
      
--- LIST VIEW ---

Grouped by priority (by default)
Group headers: 11px / uppercase / #52525B / letter-spacing wide
Each task row: 48px height, border-bottom: border-subtle

Columns: checkbox | priority dot | title | client | due date | assignee | actions

CHECKBOX (custom)
  18px circle (not square)
  Inactive: border: 1.5px solid rgba(255,255,255,0.20)
  Hover: border-color: #A1A1AA
  Checked: fill #34D399, white check icon
  Framer check animation: scale 0.6 → 1.1 → 1 (spring bounce)
  When checked: task title gets strikethrough + color → #52525B, duration 200ms

--- TASK FORM SLIDE-OVER ---
  Same 420px right slide-over pattern
  All fields from DB spec
  RECURRENCE BUILDER
    Toggle: "Repeat"
    When on: options slide down (Framer height animation)
    Options: Daily | Weekly (day checkboxes) | Monthly (day of month)
    Each option is a chip — multiple select for weekly days
```

---

### 3.10 PUBLIC PRESENCE EDITOR

```
LAYOUT: 3-panel
  Left: block palette (200px, glass)
  Center: live editor canvas (flex-1)
  Right: block settings panel (260px, glass, context-sensitive)
  
  On mobile: tabs (Edit | Settings | Preview)

LEFT PANEL (block palette)
  Title: "Blocks" (12px / uppercase / #52525B)
  Block items (draggable):
    Each block type in a glass card (80px tall)
    Icon (20px) + label (12px)
    Drag to add to canvas
    
CENTER CANVAS
  Background: a grid of faint dots (rgba(255,255,255,0.04), 24px grid)
  The page being edited shows as a white (or themed) page floating in the dark canvas
  Canvas background: bg-void with dot grid
  
  PAGE FRAME
    Like a browser window mock:
    Glass pill at top: lock icon + "your-slug.nicheflow.in" — 12px / #A1A1AA
    Below: the actual page content, white background (public pages are light-mode)
    Shadow: 0 24px 80px rgba(0,0,0,0.8)
    
  BLOCKS ON CANVAS
    Selected block: amber dashed border + top control bar
    Control bar: [↑ up] [↓ down] [duplicate] [delete]
    Hover block: border shows (rgba(245,158,11,0.30)), subtle
    
RIGHT PANEL (settings for selected block)
  Slides in when block selected, collapses when nothing selected
  Framer: x: 260 → 0 animation
  
PUBLISH BUTTON (top of center)
  Status: "Draft" | "Published"
  When draft: primary button "Publish page"
  When published: glass button "Unpublish" + small green dot "Live"
```

---

### 3.11 SETTINGS MODULE

```
LAYOUT
  Left sidebar (220px): settings category nav
  Right: content area (max-width 640px, centered)
  
CATEGORY NAV (left)
  Same pattern as main sidebar nav items
  But no icons — just text labels + active accent bar
  Sections: Workspace | Team | AI & Agents | Notifications | Integrations | Language | Billing | Danger Zone
  
SETTINGS CONTENT SECTIONS

WORKSPACE SETTINGS
  Each field in a glass card row:
    Label left, control right
    height: 64px, padding: 0 24px, border-bottom: border-subtle
    No visible card wrapper — the rows themselves create the list
    
  LOGO UPLOAD
    Square 80px area with dashed border (rgba(255,255,255,0.15))
    Center: camera icon + "Upload logo"
    On hover: background rgba(255,255,255,0.05)
    Click → file picker
    When uploaded: shows image, hover → "Change" overlay (semi-transparent dark overlay)

AI & AGENTS SETTINGS
  AUTONOMY SLIDER
    A custom 3-position slider (not a standard range input)
    Track: glass, 300px wide, 8px height, border-radius full
    3 labeled markers: Conservative | Balanced | Autonomous
    Handle: 24px circle, white, shadow, slides between 3 snap points
    Framer: spring snap between positions
    
    Background fill left of handle: accent color
    Between Conservative and Balanced: fill is short
    Between Balanced and Autonomous: fill is most of the track
    
    Marker labels: 12px / #52525B
    Active marker label: #F59E0B

INTEGRATIONS
  Each integration as a glass card (horizontal row):
    Left: integration logo mark (real SVG, not generic icon)
    Center: name + status chip
    Right: "Connect" (accent button) or "Configure" (ghost) or toggle
    Status chips: Connected (#34D399) / Not Connected (#52525B)
    
  CONNECTED STATE
    Card border: rgba(52,211,153,0.20)
    Background: rgba(52,211,153,0.04)
    Small connected checkmark

BILLING
  PLAN CARDS (horizontal, 3 plans)
    Free | Starter | Pro
    Current plan: accent border, "Current Plan" chip
    Each card: glass, padding 24px
    Price: 32px / weight 700 / Geist Mono
    Features: checklist (custom green checks)
    CTA: "Upgrade" (accent) or "Current" (ghost, disabled)
    
  USAGE METERS
    For AI queries, bookings, storage
    Progress bar style (same as inventory stock bars)
    "X of Y used" below each bar
    
DANGER ZONE (red tinted section)
  glass-error tinted card (rgba(248,113,113,0.06))
  border: rgba(248,113,113,0.20)
  "Export all data" — secondary button
  "Delete workspace" — danger button
  Delete requires typing workspace name to confirm:
    Input with placeholder "Type 'workspace-name' to confirm"
    Delete button stays disabled until input matches exactly
```

---

### 3.12 AI ASSISTANT (Floating Chat)

```
TRIGGER BUTTON (collapsed state)
  Position: fixed bottom-6 right-6 (above bottom nav on mobile: bottom-20)
  Size: 52px circle
  
  VISUAL
    background: rgba(129,140,248,0.15) — glass-agent
    border: 1px solid rgba(129,140,248,0.30)
    backdrop-filter: blur(16px)
    
    Icon: NOT a robot, NOT a speech bubble with stars.
    Use: A small geometric asterisk shape (✦ or ✳) — 20px, color #818CF8
    This is the NicheFlow Brain icon.
    
    BREATHING RING (always on, very subtle)
    Absolute positioned ring (64px diameter, around the 52px button)
    border: 1px solid rgba(129,140,248,0.15)
    border-radius: full
    scale: 1 → 1.15 → 1, opacity: 0.4 → 0 → 0.4
    duration: 3s, ease-in-out, loop
    
    AGENT ACTIVE STATE (when running)
    Ring becomes brighter: border rgba(129,140,248,0.40)
    Inner button border: rgba(129,140,248,0.50)
    
  Framer:
    whileHover: { scale: 1.08 }
    whileTap: { scale: 0.94 }

CHAT DRAWER (expanded)
  width: 380px (desktop)
  height: 540px (desktop)
  Position: fixed bottom-20 right-6 (above button)
  
  ENTER: AnimatePresence
    initial: { opacity: 0, scale: 0.92, y: 16, transformOrigin: "bottom right" }
    animate: { opacity: 1, scale: 1, y: 0 }
    exit: { opacity: 0, scale: 0.92, y: 16 }
    spring: { stiffness: 320, damping: 26 }
    
  CARD STYLE
    background: #1E1E22 (bg-overlay, more opaque than usual glass)
    border: 1px solid rgba(129,140,248,0.25)
    border-radius: 20px
    box-shadow: 0 24px 80px rgba(0,0,0,0.80), 0 0 0 1px rgba(129,140,248,0.10)
    overflow: hidden
    
  DRAWER HEADER (48px)
    background: rgba(129,140,248,0.08)
    border-bottom: 1px solid rgba(129,140,248,0.15)
    padding: 0 16px
    
    Left: ✦ icon (14px, #818CF8) + "NicheFlow Brain" (14px / weight 600 / #F4F4F5)
    Status dot: 6px circle right of the name
      Running: #818CF8 breathing animation
      Ready: rgba(129,140,248,0.40) static
    Right: minimize icon (ghost icon button)
    
  MESSAGES AREA
    Scrollable, padding: 16px
    
    USER MESSAGE
      Right-aligned, max-width 80%
      background: rgba(245,158,11,0.12)
      border: 1px solid rgba(245,158,11,0.20)
      border-radius: 14px 14px 4px 14px
      padding: 10px 14px
      font: 14px / #F4F4F5
      
    AI MESSAGE
      Left-aligned, max-width 85%
      background: rgba(255,255,255,0.05)
      border: 1px solid rgba(255,255,255,0.08)
      border-radius: 14px 14px 14px 4px
      padding: 10px 14px
      font: 14px / #F4F4F5
      
      Small icon above: ✦ 10px / #818CF8 (indicates AI)
      
    TYPING INDICATOR (3 dots)
      AI message bubble with 3 dots inside
      Dots: 5px circles, #818CF8
      Animation: y: 0 → -5 → 0, stagger 0.2s each, loop 1s
      
    MESSAGE ENTER ANIMATION
      initial: { opacity: 0, y: 8, scale: 0.97 }
      animate: { opacity: 1, y: 0, scale: 1 }
      spring: { stiffness: 300, damping: 24 }
      
  SUGGESTED PROMPTS (when conversation is empty)
    4 chips, 2×2 grid
    background: rgba(255,255,255,0.04)
    border: 1px solid rgba(255,255,255,0.08)
    border-radius: 10px
    padding: 10px 12px
    font: 12px / #A1A1AA
    
    Framer: staggered fade-up on appear
    Click: text flies into input (animates position), then auto-sends
    
  INPUT ROW (bottom, 56px)
    border-top: 1px solid rgba(255,255,255,0.06)
    padding: 8px 12px
    
    Left: mic button (ghost, 32x32)
    Center: input (flex-1, borderless, bg transparent, 14px)
    Right: send button (32x32)
      Inactive: ghost
      Active (has text): accent icon button with sparkle icon
      On click: scale spring animation
      
MOBILE CHAT
  Expands to 70vh bottom sheet (rounded top corners)
  Framer: y: 100% → 0 (not scale, slide up from bottom)
  Handle at top (32x4px pill, rgba(255,255,255,0.20))
```

---

### 3.13 COMMAND PALETTE (⌘K)

```
OVERLAY
  Background: rgba(0,0,0,0.70)
  backdrop-filter: blur(8px)
  Framer: opacity 0→1, duration 150ms
  Click outside to close

PANEL
  Width: 560px (desktop), 94vw (mobile)
  Position: top: 20% of viewport, centered horizontally
  background: #1E1E22
  border: 1px solid rgba(255,255,255,0.12)
  border-radius: 16px
  box-shadow: 0 32px 120px rgba(0,0,0,0.90)
  overflow: hidden
  
  Framer enter:
    initial: { opacity: 0, scale: 0.94, y: -8 }
    animate: { opacity: 1, scale: 1, y: 0 }
    spring: { stiffness: 380, damping: 28 }

SEARCH INPUT
  Height: 56px
  No border (seamless with panel)
  Background: transparent
  Border-bottom: 1px solid rgba(255,255,255,0.08)
  Left: MagnifyingGlass (18px, #52525B)
  Padding-left: 52px
  Font: 16px / #F4F4F5
  Placeholder: "Search or type a command..."
  Auto-focus on open
  
RESULTS AREA
  Max-height: 380px, scrollable, scrollbar-hidden
  Padding: 8px

RESULT GROUPS
  Group header: 10px / uppercase / #52525B / padding 8px 12px

RESULT ITEMS
  Height: 44px
  Padding: 0 12px
  border-radius: 8px
  Gap between icon and text: 12px
  
  Icon: 16px in a 28x28 glass container, border-radius 6px
  Label: 14px / weight 500 / #F4F4F5
  Right: kbd shortcut or "→" or secondary info (12px / #52525B)
  
  ACTIVE/HIGHLIGHTED
    background: rgba(255,255,255,0.07)
    A very subtle left accent: 2px rgba(245,158,11,0.60)
    
  Keyboard navigation: ↑↓ moves highlight smoothly (Framer layoutId on highlight bg)

AI ROUTE ITEM (when user types "?")
  Special styling:
    background: rgba(129,140,248,0.08)
    border: 1px solid rgba(129,140,248,0.20)
    Icon: ✦ in glass-agent container
    Text: "Ask AI: " + user query in #818CF8
    "Press Enter to send →" right side
    
EMPTY STATE
  Centered in results area
  "No results for '...'"  — 14px / #52525B
  Below: 2 suggestion chips ("Search clients", "Quick actions")

FOOTER BAR
  Height: 36px
  border-top: rgba(255,255,255,0.06)
  padding: 0 16px
  Kbd hints: [↑↓ navigate] [Enter select] [Esc close]
  Font: 11px / #52525B
  Kbd elements: small glass pills, 11px, border
```

---

## PART 4 — INTERACTION & MOTION LIBRARY

### 4.1 Framer Motion Variants (Reusable)

```typescript
// src/lib/motionVariants.ts
// Import and use these everywhere instead of writing inline animations

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
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
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
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
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
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
```

### 4.2 Page Load Sequence

```typescript
// Each page's initial load should feel choreographed.
// Use this stagger pattern for dashboard-style pages:

// 1. Page header (title + actions): fadeUp, delay 0
// 2. First row of cards: stagger (0.06s between each card)
// 3. Charts / content panels: fadeUp, delay 0.2s
// 4. Secondary panels: fadeUp, delay 0.35s

// Total page load animation: completes within 700ms
// NEVER animate for longer than 800ms on page load — it feels slow.

// Use motion.div with variants + viewport: { once: true } 
// for below-the-fold content (animate as user scrolls to them)
```

### 4.3 Number Animations

```typescript
// For all currency values, counts, and percentages:

// Use a counting animation on mount:
function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  // useSpring from framer-motion
  const spring = useSpring(0, { stiffness: 60, damping: 20 })
  
  useEffect(() => {
    spring.set(value)
  }, [value])
  
  return (
    <motion.span className="font-mono">
      {prefix}<motion.span>{/* rounded display value */}</motion.span>
    </motion.span>
  )
}
// Numbers always in Geist Mono
// Currency prefix (₹) in smaller weight than the number
```

### 4.4 Micro-interactions

```
TOGGLE SWITCH (custom)
  Width: 44px, Height: 24px
  Track: rgba(255,255,255,0.10) (off) → rgba(245,158,11,0.80) (on)
  Thumb: 18px white circle with shadow
  Thumb position: left: 3px (off) → left: 23px (on)
  Framer: spring { stiffness: 500, damping: 30 } for thumb movement
  Track color: Framer animate backgroundColor

CHECKBOX (circle style)
  Already described above in Tasks section.
  The check path itself draws with SVG pathLength animation.

ACCORDION (collapsible sections)
  Height: Framer { initial: 0, animate: "auto" } — using height auto animation
  Overflow: hidden
  Arrow icon: rotates 0 → 90deg on open, spring { stiffness: 300, damping: 22 }
  Content: fades in with 100ms delay after height starts animating

DRAG AND DROP (tasks Kanban, invoice items)
  Dragging item: rotation ±2deg (direction based on drag velocity)
  Dragging item: scale 1.03
  Dragging item: shadow increases dramatically
  Drop zone highlight: accent-colored line (2px) between items, scale-in animation
  Other cards in column: compress slightly (height reduces by 4px) to indicate space

TOOLTIP (hover labels)
  Delay: 600ms (not instant — prevents flicker)
  background: #26262C
  border: 1px solid rgba(255,255,255,0.12)
  border-radius: 6px
  padding: 5px 10px
  font: 12px / #F4F4F5
  Arrow: 4px triangle pointing toward trigger
  Enter: { opacity: 0, y: 2 } → { opacity: 1, y: 0 }, 120ms ease
```

---

## PART 5 — EMPTY STATES & ERROR STATES

### Empty States

```
PHILOSOPHY: Empty states are invitations to act. Not sad illustrations.

EACH MODULE'S EMPTY STATE:

Bookings (empty):
  Large text: "No bookings yet."
  Sub: "Your calendar is clear. Add one below."
  Button: "Add booking" (accent, medium size)
  NO illustration. Just clean text + button.

Clients (empty):
  Large text: "No clients yet."
  Sub: "Add your first client to get started."
  Button: "Add client"

Invoices (empty):
  Large text: "No invoices."
  Sub: "Create your first invoice once you complete a session."
  Button: "Create invoice"

Tasks (empty per column in Kanban):
  Small text in the column: "+ Add a task"
  Entire card is a dashed border (rgba(255,255,255,0.10)) area
  Click → quick-add input appears inline

Dashboard (no data):
  The KPI cards show "—" with a subtle shimmer
  Chart: shows a flat line with a "No revenue data yet" label
  NOT a loading skeleton (we know there's no data, don't pretend otherwise)

EMPTY STATE CONTAINER STYLING
  Centered vertically and horizontally in the content area
  Max-width: 320px (keeps it tight and clean)
  Text: centered
  Gap: 12px between text and button
```

### Error States

```
API ERROR (failed data fetch):
  Instead of showing a broken page:
  A slim error bar at the top of the module content:
    background: rgba(248,113,113,0.10)
    border: 1px solid rgba(248,113,113,0.20)
    border-radius: 8px
    padding: 10px 16px
    Left: ExclamationCircle icon, #F87171
    Text: "Couldn't load bookings. " + "Retry →" link (accent)
    
  The previous data (if any) shows below, slightly dimmed (opacity: 0.5)
  This is WAY better than showing nothing.

FORM VALIDATION ERRORS:
  Field-level: color shift (input border red, label red, error message below)
  Form-level: error bar above submit button (as described in Login section)
  No modal. No toast for validation. Inline only.

404 PAGE (not found):
  Background: bg-void
  Center: "404" in 120px Geist / weight 700 / color rgba(255,255,255,0.06)
  Over it: "Page not found." in 28px / #F4F4F5
  Below: "Go to dashboard →" button (accent)
  Minimal. Dark. Clean.

NETWORK OFFLINE:
  Fixed bar at TOP of screen (not bottom):
    background: rgba(251,191,36,0.12)
    border-bottom: 1px solid rgba(251,191,36,0.25)
    Text: "You're offline — changes will sync when you're back."
    Left: WifiOff icon (14px, #FBBF24)
    Framer: y: -48 → 0 when offline detected
```

---

## PART 6 — TYPOGRAPHY REFERENCE

```
USE EXACTLY THESE. No improvisation.

PAGE TITLE (h1):           28px / weight 700 / tracking -0.03em / #F4F4F5
SECTION HEADING (h2):      22px / weight 600 / tracking -0.02em / #F4F4F5
CARD TITLE (h3):           16px / weight 600 / tracking -0.02em / #F4F4F5
SUBHEADING:                14px / weight 500 / tracking -0.01em / #A1A1AA
BODY TEXT:                 15px / weight 400 / tracking -0.01em / #A1A1AA
BODY EMPHASIS:             15px / weight 500 / tracking -0.01em / #F4F4F5
SMALL / META:              13px / weight 400 / tracking  0.00em / #52525B
MICRO LABEL:               11px / weight 500 / tracking +0.08em / uppercase / #52525B
KPI VALUE:                 36px / weight 700 / tracking -0.04em / Geist Mono / #F4F4F5
HERO NUMBER:               48px / weight 700 / tracking -0.05em / Geist Mono / #F4F4F5
CURRENCY PREFIX:           24px / weight 400 / #A1A1AA (smaller than the number beside it)
INVOICE AMOUNTS:           16px / weight 600 / Geist Mono / #F4F4F5
TABLE HEADER:              11px / weight 600 / tracking +0.08em / uppercase / #52525B
LINK:                      inherit size / #A1A1AA → #F4F4F5 on hover / underline on hover
ACCENT LINK:               inherit size / #F59E0B / no underline (color is enough)
KEYBOARD SHORTCUT:         11px / Geist Mono / #52525B in glass pill
```

---

## PART 7 — IMPLEMENTATION NOTES FOR AI CODING AGENT

```
CRITICAL RULES (do not violate any of these):

1. BACKGROUND COLOR
   Every page background is #0A0A0B (bg-void).
   Never use white or light backgrounds in the app.
   Public pages (/p/:slug) are the ONLY exception — they render light for SEO/external visitors.

2. GLASS CARDS
   Every card uses the .glass utility class defined above.
   Never use a solid background for cards (no bg-zinc-800, no bg-gray-900 flat fills).
   Backdropfilter MUST be present. Without it, glass doesn't work.
   
3. GEIST MONO FOR ALL NUMBERS
   Every numerical value on screen — currency, counts, dates, times, percentages — 
   uses font-mono (Geist Mono). No exceptions. This is what makes it look fintech.

4. ACCENT COLOR DISCIPLINE
   #F59E0B appears ONLY in:
     - Primary CTA buttons
     - Active nav indicator
     - Active tab underline
     - Active state borders
     - Key metric values
     - Links you want users to click
   If you're using accent as a background fill anywhere other than buttons: remove it.

5. AGENT COLOR DISCIPLINE
   #818CF8 appears ONLY in:
     - AI assistant UI
     - Agent feed indicators
     - Agent-related notifications
     - Agent settings section

6. FRAMER MOTION
   Every interactive element has at minimum:
     - whileHover on clickable cards
     - whileTap: { scale: 0.97 } on all buttons
     - AnimatePresence on all conditional renders
   Don't add motion to: dividers, static text, background elements.

7. BORDER RADIUS CONSISTENCY
   Buttons: 8px (radius-sm)
   Input fields: 8px (radius-sm)
   Cards: 16px (radius-lg)
   Modals/Drawers: 20px
   Avatars: 9999px (full)
   Pills/badges: 9999px (full)
   Small containers (icon wrappers): 8px
   Never use odd numbers. Never use 4px on cards.

8. SPACING RHYTHM
   Page padding: 24px (desktop), 16px (mobile)
   Between cards (grid gap): 16px (default), 24px (for major sections)
   Inside cards: 24px padding (standard), 16px (compact)
   Between label and input: 8px
   Between sections inside a card: 20px
   Between cards and headings: 16px

9. NO ICONS FROM EMOJI
   The only emoji in the entire app: business type selector, completion celebration.
   All other icons: Lucide React (consistent style, 16px default).
   No mixing icon libraries.

10. LOADING STATES
    Every data-dependent section has a skeleton.
    Skeletons use the shimmer animation defined in the token system.
    Never show a blank white space while loading.

11. FOCUS STATES (ACCESSIBILITY)
    Every interactive element has a visible focus-visible style:
    outline: 2px solid rgba(245,158,11,0.70)
    outline-offset: 3px
    This is non-negotiable. WCAG AA compliance required.

12. FONT LOADING
    Load Geist first (it's the primary font).
    Geist Mono: load with display=swap, preload the 400 and 600 weights.
    Noto Sans Devanagari: lazy load only when language=hi is selected.
    Add <link rel="preconnect" href="https://fonts.googleapis.com"> to index.html.
```

---

## PART 8 — COMPONENT FILE MAP

```
Every component described in this document maps to these files.
Build them in this order.

FOUNDATION (build first)
  src/index.css                         ← All CSS variables + utilities
  tailwind.config.ts                    ← Full config as specified
  src/lib/motionVariants.ts             ← All Framer variants

BASE COMPONENTS (build second)
  src/components/ui/GlassCard.tsx
  src/components/ui/Button.tsx
  src/components/ui/Input.tsx
  src/components/ui/Select.tsx
  src/components/ui/Badge.tsx
  src/components/ui/Toggle.tsx
  src/components/ui/Skeleton.tsx
  src/components/ui/Tooltip.tsx
  src/components/ui/AnimatedNumber.tsx

LAYOUT (build third)
  src/components/layout/AppShell.tsx
  src/components/layout/Sidebar.tsx
  src/components/layout/Topbar.tsx
  src/components/layout/MobileNav.tsx
  src/components/layout/PageWrapper.tsx (page transition wrapper)
  src/components/layout/FAB.tsx

GLOBAL FEATURES (build fourth)
  src/components/CommandPalette/index.tsx
  src/components/AIAssistant/index.tsx
  src/components/Notifications/NotificationPanel.tsx
  src/components/Toast/toast.ts (configure Sonner)

MODULE PAGES (build fifth — in this order)
  src/pages/auth/Login.tsx
  src/pages/auth/Signup.tsx
  src/pages/onboarding/Onboarding.tsx
  src/pages/dashboard/Dashboard.tsx
  src/pages/bookings/Bookings.tsx
  src/pages/clients/Clients.tsx
  src/pages/invoices/Invoices.tsx
  src/pages/inventory/Inventory.tsx
  src/pages/tasks/Tasks.tsx
  src/pages/public-presence/PublicPresence.tsx
  src/pages/settings/Settings.tsx
```

---

*This document defines every visual decision for NicheFlow v2.*
*If something is not specified here, default to the design principles:*
*dark, glass, minimal, monospace numbers, amber accent used sparingly.*
*When in doubt: remove decoration, add whitespace.*

**Design Direction:** Precision-minimal fintech with warm amber intelligence.
**Version:** 2.0 — Complete UI Revamp
**Status:** Final — implement as specified, no improvisation.
