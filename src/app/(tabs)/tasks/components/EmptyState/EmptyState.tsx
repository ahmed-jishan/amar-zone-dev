'use client';

import { motion } from 'framer-motion';

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="flex flex-col items-center justify-center py-24 px-4 text-center"
    >
      {/* Premium Animated Icon */}
      <div className="relative mb-8">
        {/* Outer glow ring */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
            scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="absolute inset-0 rounded-[var(--az-radius-2xl)] bg-gradient-to-br from-[var(--az-accent)]/20 via-transparent to-[var(--az-success)]/20 blur-sm"
        />
        
        {/* Card icon */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-24 h-24 rounded-[var(--az-radius-2xl)] bg-gradient-to-br from-[var(--az-surface-1)] to-[var(--az-surface-2)] border border-[var(--az-border)] flex items-center justify-center shadow-[var(--az-shadow-md)]"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg className="w-10 h-10 text-[var(--az-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Sparkle particles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: i === 0 ? 'var(--az-accent)' : i === 1 ? 'var(--az-success)' : 'var(--az-warn)',
              left: i === 0 ? '-10%' : i === 1 ? '105%' : '110%',
              top: i === 0 ? '15%' : i === 1 ? '40%' : '75%',
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [0, -10, -20],
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.7,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Floating plus badge */}
        <motion.div
          animate={{ 
            y: [0, -4, 0],
            rotate: [0, 10, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-[var(--az-accent)] to-[var(--az-accent-2)] border-2 border-[var(--az-surface-1)] flex items-center justify-center shadow-[0_0_12px_var(--az-accent-glow)]"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path d="M12 4v16m8-8H4" />
          </svg>
        </motion.div>
      </div>

      {/* Text */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-[20px] font-bold text-[var(--az-text-1)] mb-2"
      >
        All caught up! 🎉
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-[14px] text-[var(--az-text-2)] max-w-[260px] leading-relaxed mb-6"
      >
        You have no tasks in this view. Add a new task to get started or adjust your filters.
      </motion.p>

      {/* Quick action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.dispatchEvent(new CustomEvent('az:open-quick-add'))}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--az-radius-xl)] bg-gradient-to-r from-[var(--az-accent)] to-[var(--az-accent-2)] text-white text-[13px] font-bold shadow-[0_4px_16px_var(--az-accent-glow)]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.dispatchEvent(new CustomEvent('az:open-command', {}))}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--az-radius-xl)] border border-[var(--az-border)] bg-[var(--az-surface-2)] text-[var(--az-text-2)] text-[13px] font-semibold hover:border-[var(--az-accent-border)] hover:text-[var(--az-accent)] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h8M8 12h8M8 18h5" />
          </svg>
          Commands
          <kbd className="az-kbd az-kbd-inline">⌘K</kbd>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
