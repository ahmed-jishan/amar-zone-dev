'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { useTaskStore } from '@/lib/store/taskStore';

export const useTaskFocus = () => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startSession = useTaskStore((s) => s.startSession);
  const endSession = useTaskStore((s) => s.endSession);

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
    const sid = startSession(task.id, 'focus');
    setSessionId(sid);
    startTimer();
  }, [startSession]);

  const pauseFocus = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    if (activeTask && sessionId) {
      endSession(activeTask.id, sessionId);
    }
  }, [activeTask, sessionId, endSession]);

  const resumeFocus = useCallback(() => {
    if (!activeTask) return;
    setIsRunning(true);
    const sid = startSession(activeTask.id, 'focus');
    setSessionId(sid);
    startTimer();
  }, [activeTask, startSession]);

  const stopFocus = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    if (activeTask && sessionId) {
      endSession(activeTask.id, sessionId);
    }
    setActiveTask(null);
    setSeconds(0);
    setSessionId(null);
  }, [activeTask, sessionId, endSession]);

  return { activeTask, isRunning, seconds, startFocus, pauseFocus, resumeFocus, stopFocus };
};
