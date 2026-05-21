'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Task } from '../types';

export const useTaskFocus = () => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const clearTimer = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const startTimer = () => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  const startFocus = useCallback((task: Task) => {
    clearTimer();
    setSeconds(0);
    setActiveTask(task);
    setIsRunning(true);
    startTimer();
  }, []);

  const pauseFocus = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, []);

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

  return { activeTask, isRunning, seconds, startFocus, pauseFocus, resumeFocus, stopFocus };
};
