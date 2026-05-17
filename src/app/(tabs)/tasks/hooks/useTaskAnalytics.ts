// FIX 3: useTaskAnalytics.ts
// BUGS FIXED:
//   - useTaskStats.ts and useTaskAnalytics.ts were 95% duplicate logic.
//     StatsCard imported useTaskAnalytics; nothing consumed useTaskStats.
//     Removed useTaskStats.ts duplication — StatsCard should use useTaskAnalytics.
//   - overdue was counted by status === 'overdue' only. A task with dueDate in the
//     past and status !== 'completed' is ALSO overdue. Both cases covered now.
//   - byCategory and byPriority were computed but never exposed by StatsCard — 
//     kept for future analytics use but now accurately filtered.
//   - completionRate denominator included archived tasks skewing the number down.
//     Now excludes archived from total for a meaningful rate.

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
    // FIX: exclude archived tasks from active metrics
    const activeTasks = tasks.filter((t) => t.status !== 'archived');

    const total = activeTasks.length;
    const completed = activeTasks.filter((t) => t.completed).length;
    const pending = total - completed;

    // FIX: guard against 0 total
    const completionRate =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    const byCategory = activeTasks.reduce<Record<string, number>>(
      (acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      },
      {}
    );

    const byPriority = activeTasks.reduce<Record<string, number>>(
      (acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      },
      {}
    );

    // FIX: overdue uses date check in addition to status
    const overdue = activeTasks.filter(isOverdue).length;
    const today = activeTasks.filter((t) => t.status === 'today').length;

    return {
      total,
      completed,
      pending,
      completionRate,
      byCategory,
      byPriority,
      overdue,
      today,
    };
  }, [tasks]);
};
