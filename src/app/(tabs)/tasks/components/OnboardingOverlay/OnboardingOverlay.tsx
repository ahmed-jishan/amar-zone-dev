'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const STEPS = [
  {
    title: 'Welcome to Tasks',
    description: 'Your smart task manager. Add, organize, and complete tasks with ease.',
    emoji: '🚀',
    color: 'var(--az-accent)',
  },
  {
    title: 'Quick Add Tasks',
    description: 'Tap the + button or press ⌘N to add a task. Try natural language like "Pay bill tomorrow high".',
    emoji: '⚡',
    color: 'var(--az-warn)',
  },
  {
    title: 'Swipe to Act',
    description: 'Swipe right to complete a task. Swipe left to archive. Long press for more options.',
    emoji: '👆',
    color: 'var(--az-success)',
  },
  {
    title: 'Focus Mode',
    description: 'Tap the focus button on any task. Use Pomodoro, Deep Work, or simple Focus timer.',
    emoji: '🎯',
    color: 'var(--az-accent)',
  },
  {
    title: 'Smart Planning',
    description: 'Expand the Smart Plan section for daily recommendations and weekly review.',
    emoji: '📋',
    color: 'var(--az-accent-2)',
  },
];

export default function OnboardingOverlay() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(true); // Default to dismissed

  useEffect(() => {
    setMounted(true);
    // Check if onboarding has been seen before
    const seen = localStorage.getItem('az-tasks-onboarding-seen');
    if (!seen) {
      setVisible(true);
      setDismissed(false);
    }
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('az-tasks-onboarding-seen', 'true');
  };

  const skipToEnd = () => {
    setStep(STEPS.length - 1);
  };

  const overlay = (
    <AnimatePresence>
      {visible && mounted && !dismissed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={handleDismiss} />

          {/* Card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-[360px] rounded-[var(--az-radius-2xl)] bg-[var(--az-surface-1)] border border-[var(--az-accent-border)] shadow-[var(--az-shadow-xl)] p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background glow */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] pointer-events-none opacity-30"
              style={{ background: STEPS[step].color }}
            />

            {/* Step indicator */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-300"
                    animate={{
                      width: i === step ? 24 : 6,
                      background: i === step ? STEPS[step].color : 'var(--az-surface-3)',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={skipToEnd}
                className="text-[11px] font-semibold text-[var(--az-text-3)] hover:text-[var(--az-text-1)] transition-colors"
              >
                {step < STEPS.length - 1 ? 'Skip' : ''}
              </button>
            </div>

            {/* Icon */}
            <motion.div
              key={`icon-${step}`}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
              className="w-16 h-16 rounded-[var(--az-radius-xl)] flex items-center justify-center text-[32px] mb-4"
              style={{
                background: `${STEPS[step].color}15`,
                border: `1px solid ${STEPS[step].color}30`,
              }}
            >
              {STEPS[step].emoji}
            </motion.div>

            {/* Text */}
            <h2 className="text-[22px] font-bold text-[var(--az-text-1)] mb-2 leading-tight">
              {STEPS[step].title}
            </h2>
            <p className="text-[14px] text-[var(--az-text-2)] leading-relaxed mb-6">
              {STEPS[step].description}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleDismiss}
                className="text-[13px] font-semibold text-[var(--az-text-3)] hover:text-[var(--az-text-1)] transition-colors"
              >
                {step < STEPS.length - 1 ? 'Skip all' : ''}
              </button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="px-6 py-2.5 rounded-[var(--az-radius-md)] text-[13px] font-bold text-white shadow-[0_0_16px_var(--az-accent-glow)]"
                style={{ background: `linear-gradient(135deg, ${STEPS[step].color}, ${STEPS[step].color}dd)` }}
              >
                {step < STEPS.length - 1 ? 'Next' : 'Get Started 🚀'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return mounted ? createPortal(overlay, document.body) : null;
}