'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/hooks/useHaptics';
import { springs, variants } from '@/hooks/useSpringAnimation';

interface Props {
  /** The main content shown when expanded */
  children: ReactNode;
  /** Icon shown in collapsed state */
  icon?: ReactNode;
  /** Label shown in collapsed state */
  label?: string;
  /** Whether the FAB is open */
  open: boolean;
  /** Called when FAB is toggled */
  onToggle: (open: boolean) => void;
  /** Position: bottom-right by default */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Optional className */
  className?: string;
}

const defaultIcon = (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path d="M12 4v16m8-8H4" />
  </svg>
);

const positionStyles: Record<string, string> = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
};

export default function MorphingFAB({
  children,
  icon = defaultIcon,
  label = 'Add',
  open,
  onToggle,
  position = 'bottom-right',
  className = '',
}: Props) {
  const haptics = useHaptics();

  const handleToggle = useCallback(() => {
    haptics.impact();
    onToggle(!open);
  }, [open, onToggle, haptics]);

  return (
    <div className={`fixed z-[90] ${positionStyles[position]} ${className}`}>
      <AnimatePresence>
        {open && (
          <motion.div
            key="fab-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={springs.gentle}
            className="mb-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={handleToggle}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        transition={springs.snappy}
        className={`
          flex items-center gap-2 px-5 py-3.5
          rounded-[var(--az-radius-2xl)]
          bg-[var(--az-accent)]
          text-white
          shadow-[0_4px_20px_var(--az-accent-glow)]
          hover:shadow-[0_8px_30px_var(--az-accent-glow)]
          transition-shadow duration-300
          font-semibold text-[15px]
          ${open ? 'shadow-[var(--az-shadow-lg)]' : ''}
        `}
        aria-label={open ? 'Close' : label}
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={springs.snappy}
        >
          {icon}
        </motion.div>
        {!open && <span>{label}</span>}
      </motion.button>
    </div>
  );
}