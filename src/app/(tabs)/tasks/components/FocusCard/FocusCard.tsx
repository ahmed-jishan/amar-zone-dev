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

  // Reset internal state when activeTask changes (user started focus on a different task)
  useEffect(() => {
    setMode('focus');
    setIsBreak(false);
    setCompletedPomodoros(0);
    setIsCompact(false);
  }, [activeTask?.id]);

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
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={springs.smooth}
        className="mb-4"
      >
        <motion.div
          layout
          className="relative overflow-hidden rounded-[var(--az-radius-2xl)] border border-[var(--az-accent-border)] bg-[var(--az-surface-1)] shadow-[var(--az-shadow-glow)]"
        >
          {/* Animated gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--az-accent)] via-[var(--az-accent-2)] to-[var(--az-accent)] bg-[length:200%_100%] animate-[az-shimmer_2s_linear_infinite]" />
          
          <div className="flex items-center gap-3 px-4 py-2.5">
            {/* Live indicator */}
            <motion.span
              animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
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
              initial={{ scale: 1.1, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
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
                className="h-full bg-gradient-to-r from-[var(--az-accent)] to-[var(--az-accent-2)]"
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
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.96 }}
      transition={springs.gentle}
      className="mb-4"
    >
      <motion.div
        layout
        className={`
          relative overflow-hidden rounded-[var(--az-radius-2xl)] p-5
          border transition-all duration-500
          ${isRunning
            ? 'bg-gradient-to-br from-[var(--az-surface-1)] via-[var(--az-surface-1)] to-[var(--az-accent-bg)] border-[var(--az-accent-border)] shadow-[var(--az-shadow-glow)]'
            : 'bg-[var(--az-surface-1)] border-[var(--az-border)] shadow-[var(--az-shadow-sm)]'
          }
        `}
      >
        {/* Animated background glow */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[var(--az-accent)]/15 blur-[80px] animate-[az-breathe_3s_ease-in-out_infinite]" />
            <div className="absolute -bottom-10 -right-10 w-[200px] h-[200px] rounded-full bg-[var(--az-accent-2)]/10 blur-[60px] animate-pulse" />
          </motion.div>
        )}

        {/* Top gradient border line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--az-accent-border)] to-transparent opacity-60" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <motion.span
                  animate={isRunning ? { opacity: [1, 0.5, 1], scale: [1, 0.9, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                    ${isRunning
                      ? 'text-[var(--az-accent)] border-[var(--az-accent-border)] bg-[var(--az-accent-bg)]'
                      : 'text-[var(--az-text-3)] border-[var(--az-border)] bg-[var(--az-surface-2)]'
                    }
                  `}
                >
                  <motion.span
                    animate={isRunning ? { scale: [1, 1.4, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-[var(--az-accent)] shadow-[0_0_6px_var(--az-accent-glow)]' : 'bg-[var(--az-text-4)]'}`}
                  />
                  {isRunning ? (isBreak ? '☕ Break' : '🎯 Focusing') : '⏸️ Paused'}
                </motion.span>
                {mode === 'pomodoro' && (
                  <span className="text-[10px] text-[var(--az-text-3)] font-medium inline-flex items-center gap-1">
                    <span>🍅</span>
                    <span>{completedPomodoros} completed</span>
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
                    px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200
                    ${mode === m 
                      ? 'bg-[var(--az-accent)] text-white shadow-sm' 
                      : 'text-[var(--az-text-3)] hover:text-[var(--az-text-2)] hover:bg-[var(--az-surface-1)]'
                    }
                  `}
                >
                  {m === 'deep_work' ? '🔬 Deep' : m === 'pomodoro' ? '🍅 Pomo' : '🎯 Focus'}
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
                    stroke="url(#pomodoroGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - progress / 100) }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                  <defs>
                    <linearGradient id="pomodoroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--az-accent)" />
                      <stop offset="100%" stopColor="var(--az-accent-2)" />
                    </linearGradient>
                  </defs>
                </svg>
              )}

              <motion.div
                key={displaySeconds}
                initial={{ scale: 1.05, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={`
                  text-[56px] font-black tabular-nums leading-none tracking-tight
                  ${isRunning 
                    ? 'text-[var(--az-accent)] drop-shadow-[0_0_20px_var(--az-accent-glow)]' 
                    : 'text-[var(--az-text-2)]'
                  }
                `}
              >
                {formatTime(displaySeconds)}
              </motion.div>
              {mode !== 'pomodoro' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] text-[var(--az-text-3)] font-medium mt-1"
                >
                  {isRunning ? '• Focus mode active' : '• Paused'}
                </motion.p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
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
                  ? 'bg-[var(--az-accent)] text-white shadow-[0_0_24px_var(--az-accent-glow)]'
                  : 'bg-[var(--az-surface-2)] border border-[var(--az-border)] text-[var(--az-accent)] hover:shadow-[0_0_16px_var(--az-accent-glow)]'
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
                className="p-3 rounded-full bg-[var(--az-success)] text-white shadow-[0_0_16px_var(--az-success-glow)]"
                aria-label="Start next session"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 3l14 9-14 9V3z" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default memo(FocusCardComponent);