'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../../types';
import { useHaptics } from '@/hooks/useHaptics';
import { springs } from '@/hooks/useSpringAnimation';

interface Props {
  activeTask: Task | null;
  isRunning: boolean;
  seconds: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function FocusCardComponent({ activeTask, isRunning, seconds, onPause, onResume, onStop }: Props) {
  const [mode, setMode] = useState<'focus' | 'pomodoro' | 'deep_work'>('focus');
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [isCompact, setIsCompact] = useState(false);
  const haptics = useHaptics();

  const displaySeconds = mode === 'pomodoro' && !isBreak ? pomodoroTime - (seconds % pomodoroTime) : seconds;
  const progress = mode === 'pomodoro' && !isBreak
    ? ((pomodoroTime - displaySeconds) / pomodoroTime) * 100
    : 0;

  // Auto-compact after 5 seconds of focus
  useEffect(() => {
    if (isRunning && seconds > 5) {
      setIsCompact(true);
    }
  }, [isRunning, seconds]);

  useEffect(() => {
    if (mode === 'pomodoro' && isRunning && !isBreak) {
      if (seconds > 0 && seconds % pomodoroTime === 0 && seconds >= pomodoroTime) {
        setIsBreak(true);
        setCompletedPomodoros((c) => c + 1);
        onPause();
        haptics.success();
      }
    }
  }, [seconds, mode, pomodoroTime, isRunning, isBreak, onPause, haptics]);

  const handleModeChange = useCallback((m: typeof mode) => {
    haptics.tap();
    setMode(m);
  }, [haptics]);

  const handlePause = useCallback(() => {
    haptics.tap();
    onPause();
  }, [haptics, onPause]);

  const handleResume = useCallback(() => {
    haptics.impact();
    onResume();
  }, [haptics, onResume]);

  const handleStop = useCallback(() => {
    haptics.heavy();
    onStop();
    setIsCompact(false);
  }, [haptics, onStop]);

  if (!activeTask) return null;

  // Dynamic Island compact mode
  if (isCompact && isRunning) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={springs.smooth}
        className="mb-4"
      >
        <motion.div
          layout
          className="relative overflow-hidden rounded-[var(--az-radius-2xl)] border border-[var(--az-accent-border)] bg-[var(--az-surface-1)] shadow-[var(--az-shadow-glow)]"
        >
          <div className="flex items-center gap-3 px-4 py-2.5">
            {/* Live indicator */}
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-[var(--az-accent)] shadow-[0_0_8px_var(--az-accent-glow)]"
            />

            {/* Task title */}
            <span className="flex-1 text-[13px] font-semibold text-[var(--az-text-1)] truncate">
              {activeTask.title}
            </span>

            {/* Timer */}
            <motion.span
              key={displaySeconds}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-[15px] font-bold tabular-nums text-[var(--az-accent)]"
            >
              {formatTime(displaySeconds)}
            </motion.span>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handlePause}
                className="p-1.5 rounded-full bg-[var(--az-accent-bg)] text-[var(--az-accent)]"
                aria-label="Pause"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleStop}
                className="p-1.5 rounded-full bg-[var(--az-danger-bg)] text-[var(--az-danger)]"
                aria-label="Stop"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => { haptics.tap(); setIsCompact(false); }}
                className="p-1.5 rounded-full bg-[var(--az-surface-2)] text-[var(--az-text-3)]"
                aria-label="Expand"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Progress bar */}
          {mode === 'pomodoro' && (
            <div className="h-[2px] bg-[var(--az-surface-3)]">
              <motion.div
                className="h-full bg-[var(--az-accent)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // Full expanded mode
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springs.gentle}
      className="mb-4"
    >
      <motion.div
        layout
        className={`
          relative overflow-hidden rounded-[var(--az-radius-2xl)] p-5
          border transition-all duration-500
          ${isRunning
            ? 'bg-[var(--az-surface-1)] border-[var(--az-accent-border)] shadow-[var(--az-shadow-glow)]'
            : 'bg-[var(--az-surface-1)] border-[var(--az-border)] shadow-[var(--az-shadow-sm)]'
          }
        `}
      >
        {/* Animated background glow */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[var(--az-accent)] blur-[80px] animate-pulse" />
          </motion.div>
        )}

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <motion.span
                  animate={isRunning ? { opacity: [1, 0.5, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border
                    ${isRunning
                      ? 'text-[var(--az-accent)] border-[var(--az-accent-border)] bg-[var(--az-accent-bg)]'
                      : 'text-[var(--az-text-3)] border-[var(--az-border)] bg-[var(--az-surface-2)]'
                    }
                  `}
                >
                  <motion.span
                    animate={isRunning ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-[var(--az-accent)]' : 'bg-[var(--az-text-4)]'}`}
                  />
                  {isRunning ? (isBreak ? 'Break' : 'Focusing') : 'Paused'}
                </motion.span>
                {mode === 'pomodoro' && (
                  <span className="text-[10px] text-[var(--az-text-3)] font-medium">
                    🍅 {completedPomodoros} completed
                  </span>
                )}
              </div>
              <h3 className="text-[16px] font-bold text-[var(--az-text-1)] leading-snug line-clamp-2">
                {activeTask.title}
              </h3>
            </div>

            {/* Mode selector */}
            <div className="flex items-center gap-1 p-1 rounded-[var(--az-radius-lg)] bg-[var(--az-surface-2)] border border-[var(--az-border)]">
              {(['focus', 'pomodoro', 'deep_work'] as const).map((m) => (
                <motion.button
                  key={m}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleModeChange(m)}
                  className={`
                    px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all
                    ${mode === m ? 'bg-[var(--az-accent)] text-white shadow-sm' : 'text-[var(--az-text-3)] hover:text-[var(--az-text-2)]'}
                  `}
                >
                  {m === 'deep_work' ? 'Deep' : m === 'pomodoro' ? 'Pomo' : 'Focus'}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Timer display */}
          <div className="flex items-center justify-center py-4">
            <div className="text-center relative">
              {/* Circular progress for pomodoro */}
              {mode === 'pomodoro' && !isBreak && (
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke="var(--az-surface-3)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke="var(--az-accent)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - progress / 100) }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </svg>
              )}

              <motion.div
                key={displaySeconds}
                initial={{ scale: 1.05, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={`
                  text-[56px] font-black tabular-nums leading-none tracking-tight
                  ${isRunning ? 'text-[var(--az-accent)] drop-shadow-[0_0_20px_var(--az-accent-glow)]' : 'text-[var(--az-text-2)]'}
                `}
              >
                {formatTime(displaySeconds)}
              </motion.div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStop}
              className="p-3 rounded-full bg-[var(--az-surface-2)] border border-[var(--az-border)] text-[var(--az-text-2)] hover:text-[var(--az-danger)] hover:border-[var(--az-danger-border)] hover:bg-[var(--az-danger-bg)] transition-all"
              aria-label="Stop focus"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={isRunning ? handlePause : handleResume}
              className={`
                p-4 rounded-full transition-all duration-300
                ${isRunning
                  ? 'bg-[var(--az-accent)] text-white shadow-[0_0_20px_var(--az-accent-glow)]'
                  : 'bg-[var(--az-surface-2)] border border-[var(--az-border)] text-[var(--az-accent)]'
                }
              `}
              aria-label={isRunning ? 'Pause' : 'Resume'}
            >
              {isRunning ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </motion.button>

            {isBreak && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  haptics.impact();
                  setIsBreak(false);
                  onResume();
                }}
                className="px-4 py-2 rounded-full bg-[var(--az-success)] text-white text-[13px] font-semibold shadow-[0_0_12px_var(--az-success-glow)]"
              >
                Start Next
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default memo(FocusCardComponent);