'use client';

import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/hooks/useSpringAnimation';

interface Stats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  overdue: number;
  today: number;
  inProgress: number;
  totalTime: number;
}

interface Props {
  stats: Stats;
  onToggleDashboard: () => void;
  showDashboard: boolean;
  nextTaskTitle?: string;
  onStartNext?: () => void;
  onPlanToday?: () => void;
  onAddTask?: () => void;
}

export default function TaskHeader({
  stats,
  onToggleDashboard,
  showDashboard,
  nextTaskTitle,
  onStartNext,
  onPlanToday,
  onAddTask,
}: Props) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  }, []);

  const greetingEmoji = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return '🌙';
    if (hour < 12) return '☀️';
    if (hour < 17) return '🌤️';
    if (hour < 21) return '🌅';
    return '🌙';
  }, []);

  const dateStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <div className="mb-6">
      {/* Premium Header with Ambient Glow */}
      <div className="relative mb-5">
        {/* Ambient background glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[var(--az-accent)]/10 blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-5 -left-5 w-32 h-32 rounded-full bg-[var(--az-success)]/5 blur-[50px] pointer-events-none" />
        
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="text-xl"
              >
                {greetingEmoji}
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-[28px] sm:text-[34px] font-black text-[var(--az-text-1)] leading-tight tracking-tight"
              >
                {greeting}
              </motion.h1>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="text-[14px] text-[var(--az-text-3)] mt-0.5 font-medium flex items-center gap-2"
            >
              <span>{dateStr}</span>
              <span className="w-1 h-1 rounded-full bg-[var(--az-text-4)]" />
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-[var(--az-accent)] text-[11px] font-semibold"
              >
                {stats.pending > 0 ? `${stats.pending} pending` : 'All clear ✨'}
              </motion.span>
            </motion.p>
          </div>

          <motion.button
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
            onClick={onToggleDashboard}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`
              p-2.5 rounded-[var(--az-radius-xl)] transition-all duration-300 relative overflow-hidden
              ${showDashboard
                ? 'bg-[var(--az-accent)] text-white shadow-[0_0_16px_var(--az-accent-glow)]'
                : 'bg-[var(--az-surface-2)] text-[var(--az-text-2)] border border-[var(--az-border)] hover:border-[var(--az-accent-border)] hover:text-[var(--az-accent)] hover:shadow-[var(--az-shadow-sm)]'
              }
            `}
            title="Toggle productivity dashboard"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {showDashboard && (
              <motion.div
                className="absolute inset-0 bg-white/10"
                animate={{ opacity: [0, 0.2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>
        </div>
      </div>

      {/* Next Best Move Card — Dynamic Island Style */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 25, delay: 0.1 }}
        className="relative overflow-hidden rounded-[var(--az-radius-2xl)] border border-[var(--az-accent-border)] bg-gradient-to-br from-[var(--az-surface-1)] via-[var(--az-surface-1)] to-[var(--az-accent-bg)] p-[1px]"
      >
        <div className="rounded-[calc(var(--az-radius-2xl)-1px)] bg-[var(--az-surface-1)] p-4 relative">
          {/* Inner glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--az-accent)]/5 rounded-full blur-[40px] pointer-events-none" />
          
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <motion.div
                  animate={{ rotate: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <svg className="w-3.5 h-3.5 text-[var(--az-accent)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </motion.div>
                <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[var(--az-accent)]">
                  Next Best Move
                </p>
                {stats.overdue > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[var(--az-danger-bg)] text-[var(--az-danger)] border border-[var(--az-danger-border)]">
                    {stats.overdue} overdue
                  </span>
                )}
              </div>
              <motion.p
                key={nextTaskTitle || 'placeholder'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[15px] font-semibold text-[var(--az-text-1)] leading-snug"
              >
                {nextTaskTitle || (stats.today > 0 
                  ? '🎯 Pick one important task for today' 
                  : '✨ Plan a small win for today')}
              </motion.p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {nextTaskTitle && (
                <motion.button
                  type="button"
                  onClick={onStartNext}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative overflow-hidden rounded-[var(--az-radius-md)] px-4 py-2 text-[12px] font-bold text-white shadow-[0_0_12px_var(--az-accent-glow)]"
                  style={{
                    background: 'linear-gradient(135deg, var(--az-accent), var(--az-accent-2))',
                  }}
                >
                  <span className="relative z-10">Focus</span>
                  <motion.div
                    className="absolute inset-0 bg-white/10"
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.button>
              )}
              <motion.button
                type="button"
                onClick={stats.today > 0 ? onPlanToday : onAddTask}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-[var(--az-radius-md)] border border-[var(--az-border)] bg-[var(--az-surface-2)] px-3 py-2 text-[12px] font-semibold text-[var(--az-text-2)] hover:border-[var(--az-accent-border)] hover:text-[var(--az-accent)] transition-all"
              >
                {stats.today > 0 ? '📋 Plan' : '➕ Add'}
              </motion.button>
            </div>
          </div>

          {/* Subtle gradient bar at bottom */}
          <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[var(--az-accent-border)] to-transparent opacity-50" />
        </div>
      </motion.div>

      {/* Quick stats row — Apple-style dynamic island pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
      >
        <StatPill
          value={stats.today}
          label="Today"
          color="var(--az-accent)"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
        <StatPill
          value={stats.inProgress}
          label="Active"
          color="var(--az-warn)"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatPill
          value={stats.overdue}
          label="Overdue"
          color="var(--az-danger)"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatPill
          value={`${stats.completionRate}%`}
          label="Done"
          color="var(--az-success)"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        {stats.totalTime > 0 && (
          <StatPill
            value={`${stats.totalTime}m`}
            label="Tracked"
            color="var(--az-text-2)"
            icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            }
          />
        )}
      </motion.div>
    </div>
  );
}

function StatPill({
  value,
  label,
  color,
  icon,
}: {
  value: string | number;
  label: string;
  color: string;
  icon: React.ReactNode;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const isNumeric = typeof value === 'number';

  useEffect(() => {
    if (!isNumeric || typeof value !== 'number') return;
    const target = value;
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, isNumeric]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springs.gentle}
      className="flex items-center gap-2 px-3 py-2 rounded-[var(--az-radius-lg)] bg-[var(--az-surface-1)] border border-[var(--az-border)] hover:border-[var(--az-border-hover)] transition-all duration-200"
    >
      <motion.span
        whileHover={{ scale: 1.1 }}
        style={{ color }}
      >
        {icon}
      </motion.span>
      <div className="flex items-baseline gap-1">
        <motion.span
          key={value}
          className="text-[15px] font-bold tabular-nums"
          style={{ color }}
        >
          {isNumeric ? displayValue : value}
        </motion.span>
        <span className="text-[11px] text-[var(--az-text-3)] font-medium">{label}</span>
      </div>
    </motion.div>
  );
}
