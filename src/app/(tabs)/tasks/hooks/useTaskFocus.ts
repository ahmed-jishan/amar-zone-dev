'use client';
// FIX 1: useTaskFocus.ts
// BUGS FIXED:
//   - Memory leak: startFocus() never cleared previous interval before creating new one.
//     If called twice (e.g. switching tasks), two intervals would run simultaneously.
//   - resumeFocus was MISSING from the hook return — FocusCard.tsx consumed it but
//     the hook never exposed it, causing a silent undefined call.
//   - No useEffect cleanup: if FocusCard unmounts while running, interval leaked.
//   - seconds reset missing on startFocus for new task switch.

import { useState, useRef, useEffect, useCallback } from 'react';
import { Task } from '../types';

export const useTaskFocus = () => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount — prevents memory leak if component unmounts mid-session
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer(); // Guard: always clear before starting new
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  const startFocus = useCallback((task: Task) => {
    clearTimer();
    setSeconds(0); // FIX: reset seconds when switching tasks
    setActiveTask(task);
    setIsRunning(true);
    startTimer();
  }, []);

  const pauseFocus = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, []);

  // FIX: resumeFocus was MISSING from the hook — FocusCard called it as undefined
  const resumeFocus = useCallback(() => {
    if (!activeTask) return;
    setIsRunning(true);
    startTimer();
  }, [activeTask]);

  const stopFocus = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setActiveTask(null);
    setSeconds(0);
  }, []);

  return {
    activeTask,
    isRunning,
    seconds,
    startFocus,
    pauseFocus,
    resumeFocus, // was missing!
    stopFocus,
  };
};
