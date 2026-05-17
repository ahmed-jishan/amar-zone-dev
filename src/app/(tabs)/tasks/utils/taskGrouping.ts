// FIX 5: taskGrouping.ts
// CHANGE: groupTasks logic moved to useTaskSections to consolidate the fix.
// This util kept for any non-hook usage, but delegates to same logic.
// Previously this had the status-only bug — now fixed at the hook level.

import { Task } from '../types';

// Kept as a pure function for any server-side or non-React usage
export const groupTasks = (tasks: Task[] = []) => {
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
