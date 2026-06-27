'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Task } from '../../types';
import Dashboard from '../Dashboard/Dashboard';
import ProductivityHeatmap from '../ProductivityHeatmap/ProductivityHeatmap';

interface Props {
  tasks: Task[];
  isOpen: boolean;
  onClose: () => void;
}

export default function DashboardSheet({ tasks, isOpen, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
          onClick={onClose}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-[600px] max-h-[90dvh] bg-[var(--az-surface-1)] border border-[var(--az-accent-border)] rounded-[var(--az-radius-2xl)] shadow-[var(--az-shadow-xl)] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--az-accent)] via-[var(--az-accent-2)] to-[var(--az-accent)] bg-[length:200%_100%] animate-[az-shimmer_2s_linear_infinite] z-10" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--az-border)] shrink-0">
              <h2 className="text-[18px] font-bold text-[var(--az-text-1)] tracking-tight">
                Productivity Dashboard
              </h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--az-text-3)] hover:text-[var(--az-text-1)] hover:bg-[var(--az-surface-hover)] transition-all"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto px-5 py-4 scrollbar-none flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <Dashboard tasks={tasks} />
              <div className="mt-6 mb-2">
                <ProductivityHeatmap tasks={tasks} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return mounted ? createPortal(modal, document.body) : null;
}