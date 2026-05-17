// FIX 4: useTaskSections.ts
// BUGS FIXED:
//   - groupTasks() in taskGrouping.ts only filtered by status string.
//     A task with status='today' and completed=true would show in BOTH "Today" and
//     appear uncompleted visually. Now: completed tasks are always in completed bucket
//     regardless of status, so toggling completion immediately moves the card.
//   - useTaskSections re-exported all groupTasks keys manually (brittle if groupTasks grows).
//     Now spreads the result to avoid the manual mapping.

import { useMemo } from 'react';
import { Task } from '../types';

const groupTasks = (tasks: Task[]) => {
  // FIX: completed flag takes priority over status for visual bucketing
  const active = tasks.filter((t) => !t.completed && t.status !== 'archived');
  const completed = tasks.filter((t) => t.completed);

  return {
    overdue: active.filter((t) => t.status === 'overdue'),
    today: active.filter((t) => t.status === 'today'),
    inProgress: active.filter((t) => t.status === 'in-progress'),
    upcoming: active.filter((t) => t.status === 'upcoming'),
    inbox: active.filter((t) => t.status === 'inbox'),
    completed,
  };
};

export const useTaskSections = (tasks: Task[]) => {
  return useMemo(() => groupTasks(tasks), [tasks]);
};
