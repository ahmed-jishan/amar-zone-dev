'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { Task } from '../../types';

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
  const [breakTime, setBreakTime] = useState(5 * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  const displaySeconds = mode === 'pomodoro' && !isBreak ? pomodoroTime - (seconds % pomodoroTime) : seconds;
  const progress = mode === 'pomodoro' && !isBreak
    ? ((pomodoroTime - displaySeconds) / pomodoroTime) * 100
    : 0;

  useEffect(() => {
    if (mode === 'pomodoro' && isRunning && !isBreak) {
      if (seconds > 0 && seconds % pomodoroTime === 0 && seconds >= pomodoroTime) {
        setIsBreak(true);
        setCompletedPomodoros((c) => c + 1);
        // Auto-pause for break
        onPause();
      }
    }
  }, [seconds, mode, pomodoroTime, isRunning, isBreak, onPause]);

  if (!activeTask) return null;

  return (
    <div className="mb-4 animate-[az-slide-up_300ms_ease-out]">
      <div className={`
        relative overflow-hidden rounded-[var(--az-radius-2xl)] p-5
        border transition-all duration-500
        ${isRunning
          ? 'bg-[var(--az-surface-1)] border-[var(--az-accent-border)] shadow-[var(--az-shadow-glow)]'
          : 'bg-[var(--az-surface-1)] border-[var(--az-border)] shadow-[var(--az-shadow-sm)]'
        }
      `}>
        {/* Animated background glow */}
        {isRunning && (
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[var(--az-accent)] blur-[80px] animate-pulse" />
          </div>
        )}

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border
                  ${isRunning
                    ? 'text-[var(--az-accent)] border-[var(--az-accent-border)] bg-[var(--az-accent-bg)] animate-pulse'
                    : 'text-[var(--az-text-3)] border-[var(--az-border)] bg-[var(--az-surface-2)]'
                  }
                `}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-[var(--az-accent)]' : 'bg-[var(--az-text-4)]'}`} />
                  {isRunning ? (isBreak ? 'Break' : 'Focusing') : 'Paused'}
                </span>
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
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`
                    px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all
                    ${mode === m ? 'bg-[var(--az-accent)] text-white shadow-sm' : 'text-[var(--az-text-3)] hover:text-[var(--az-text-2)]'}
                  `}
                  title={m === 'deep_work' ? 'Deep Work (90min)' : m === 'pomodoro' ? 'Pomodoro' : 'Free Focus'}
                >
                  {m === 'deep_work' ? 'Deep' : m === 'pomodoro' ? 'Pomo' : 'Focus'}
                </button>
              ))}
            </div>
          </div>

          {/* Timer display */}
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className={`
                text-[56px] font-black tabular-nums leading-none tracking-tight transition-all duration-300
                ${isRunning ? 'text-[var(--az-accent)] drop-shadow-[0_0_20px_var(--az-accent-glow)]' : 'text-[var(--az-text-2)]'}
              `}>
                {formatTime(displaySeconds)}
              </div>
              {mode === 'pomodoro' && !isBreak && (
                <div className="mt-2 w-full max-w-[200px] mx-auto h-1 rounded-full bg-[var(--az-surface-3)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--az-accent)] transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onStop}
              className="p-3 rounded-full bg-[var(--az-surface-2)] border border-[var(--az-border)] text-[var(--az-text-2)] hover:text-[var(--az-danger)] hover:border-[var(--az-danger-border)] hover:bg-[var(--az-danger-bg)] transition-all duration-200 hover:scale-110"
              aria-label="Stop focus"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>

            <button
              onClick={isRunning ? onPause : onResume}
              className={`
                p-4 rounded-full transition-all duration-300 hover:scale-110
                ${isRunning
                  ? 'bg-[var(--az-accent)] text-white shadow-[0_0_20px_var(--az-accent-glow)] hover:shadow-[0_0_30px_var(--az-accent-glow)]'
                  : 'bg-[var(--az-surface-2)] border border-[var(--az-border)] text-[var(--az-accent)] hover:bg-[var(--az-accent-bg)]'
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
            </button>

            {isBreak && (
              <button
                onClick={() => {
                  setIsBreak(false);
                  onResume();
                }}
                className="px-4 py-2 rounded-full bg-[var(--az-success)] text-white text-[13px] font-semibold shadow-[0_0_12px_var(--az-success-glow)] hover:scale-105 transition-all"
              >
                Start Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(FocusCardComponent);
