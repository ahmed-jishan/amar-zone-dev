import { useMemo } from 'react';
import { Task } from '../types';
import { isToday, isOverdue, isInProgress, isActive } from '../utils/taskFilters';

export const useTaskAnalytics = (tasks: Task[]) => {
  return useMemo(() => {
    const activeTasks = tasks.filter(isActive);
    const total = activeTasks.length;
    const completed = tasks.filter((t) => t.completed && t.status !== 'archived').length;
    const pending = total - completed;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
    const overdueCount = tasks.filter(isOverdue).length;
    const todayCount = tasks.filter(isToday).length;
    const inProgressCount = tasks.filter(isInProgress).length;
    const totalTime = tasks.reduce((acc, t) => acc + (t.actualTime || 0), 0);

    return {
      total,
      completed,
      pending,
      completionRate,
      overdue: overdueCount,
      today: todayCount,
      inProgress: inProgressCount,
      totalTime,
    };
  }, [tasks]);
};