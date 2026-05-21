import { useMemo } from 'react';
import { Task } from '../types';

const isOverdue = (task: Task): boolean => {
  if (task.completed) return false;
  if (task.status === 'overdue') return true;
  if (task.dueDate) {
    return new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
  }
  return false;
};

export const useTaskAnalytics = (tasks: Task[]) => {
  return useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'archived');
    const total = activeTasks.length;
    const completed = activeTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
    const overdue = activeTasks.filter(isOverdue).length;
    const today = activeTasks.filter((t) => t.status === 'today').length;

    return { total, completed, pending, completionRate, overdue, today };
  }, [tasks]);
};
