'use client';

/**
 * Premium Spring Animation System
 * Provides Apple/Samsung-level spring physics for all interactions
 * Uses framer-motion's spring configs for buttery smooth animations
 */

import { type Transition } from 'framer-motion';

// Spring config type
export type SpringConfig = {
  type: 'spring';
  stiffness: number;
  damping: number;
  mass: number;
};

// ─── Spring Presets ───

export const springs: Record<string, SpringConfig> = {
  /** Snappy response — button press, checkbox toggle */
  snappy: { type: 'spring', stiffness: 500, damping: 30, mass: 0.5 },

  /** Gentle bounce — card entrance, modal appear */
  gentle: { type: 'spring', stiffness: 300, damping: 20, mass: 0.8 },

  /** Bouncy — celebratory, completion effects */
  bouncy: { type: 'spring', stiffness: 400, damping: 10, mass: 0.6 },

  /** Smooth — list items, section transitions */
  smooth: { type: 'spring', stiffness: 200, damping: 25, mass: 1 },

  /** Wobbly — drag, swipe resistance */
  wobbly: { type: 'spring', stiffness: 150, damping: 8, mass: 1.2 },

  /** Stiff — precise movements, slider */
  stiff: { type: 'spring', stiffness: 800, damping: 40, mass: 0.4 },

  /** Slow motion — focus mode, emphasis */
  slow: { type: 'spring', stiffness: 100, damping: 20, mass: 1.5 },

  /** Overshoot — playful, attention-seeking */
  overshoot: { type: 'spring', stiffness: 350, damping: 6, mass: 0.7 },
};

// ─── Transition Presets ───

export const transitions = {
  /** Ultra fast — 150ms for micro-interactions */
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } satisfies Transition,

  /** Base — 250ms for standard transitions */
  base: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } satisfies Transition,

  /** Slow — 350ms for emphasis */
  slow: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } satisfies Transition,

  /** Spring entrance — 400ms spring */
  spring: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } satisfies Transition,

  /** Expressive — 500ms for dramatic reveals */
  expressive: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } satisfies Transition,
} satisfies Record<string, Transition>;

// ─── Variant Presets ───

export const variants = {
  /** Slide up from below — list items, cards */
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: springs.gentle },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
  },

  /** Scale in — modals, popovers */
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: springs.bouncy },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
  },

  /** Fade in — simple appearance */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  },

  /** Slide in from right — panels, drawers */
  slideRight: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0, transition: springs.smooth },
    exit: { opacity: 0, x: 40, transition: { duration: 0.2 } },
  },

  /** Slide in from left — back panels */
  slideLeft: {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0, transition: springs.smooth },
    exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
  },

  /** Stagger children — list with delay */
  stagger: {
    animate: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
    exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
  },

  /** Stagger item — individual list item */
  staggerItem: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: springs.gentle },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
  },

  /** Press effect — button press */
  press: {
    whileTap: { scale: 0.97, transition: { duration: 0.1 } },
    whileHover: { scale: 1.02, transition: { duration: 0.15 } },
  },

  /** Lift effect — card hover */
  lift: {
    whileHover: {
      y: -2,
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      transition: { duration: 0.2 },
    },
    whileTap: {
      y: 0,
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  },

  /** Checkmark bounce — completion animation */
  checkBounce: {
    initial: { scale: 0, rotate: -45 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: springs.bouncy,
    },
  },

  /** Progress fill — bar animation */
  progressFill: {
    initial: { scaleX: 0 },
    animate: { scaleX: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  },

  /** Ripple effect — touch ripple */
  ripple: {
    initial: { scale: 0, opacity: 0.3 },
    animate: { scale: 4, opacity: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  },
} as const;

// ─── Gesture Animation Helpers ───

export const gestureAnimations = {
  /** Swipe to complete — right swipe */
  swipeComplete: {
    drag: 'x' as const,
    dragElastic: 0.2,
    dragConstraints: { left: 0, right: 120 },
    onDragEnd: (_: any, info: { offset: { x: number } }) => info.offset.x > 80,
    whileDrag: {
      scale: 1.02,
      transition: { duration: 0.1 },
    },
  },

  /** Swipe to archive — left swipe */
  swipeArchive: {
    drag: 'x' as const,
    dragElastic: 0.2,
    dragConstraints: { left: -120, right: 0 },
    onDragEnd: (_: any, info: { offset: { x: number } }) => info.offset.x < -80,
    whileDrag: {
      scale: 1.02,
      transition: { duration: 0.1 },
    },
  },

  /** Drag to reorder */
  dragReorder: {
    drag: 'y' as const,
    dragElastic: 0.1,
    dragConstraints: { top: -100, bottom: 100 },
    whileDrag: {
      scale: 1.05,
      zIndex: 50,
      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
      transition: { duration: 0.1 },
    },
  },
} as const;

// ─── Layout Animation ───

export const layoutAnimation = {
  layout: true as const,
  layoutId: undefined as string | undefined,
  transition: springs.smooth,
};

export type { Transition };
