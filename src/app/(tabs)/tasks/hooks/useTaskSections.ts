import { useMemo } from 'react';
import { Task } from '../types';

const groupTasks = (tasks: Task[]) => {
  const active = tasks.filter((t) => !t.completed && t.status !== 'archived');
  const completed = tasks.filter((t) => t.completed);
  return {
    overdue:    active.filter((t) => t.status === 'overdue'),
    today:      active.filter((t) => t.status === 'today'),
    inProgress: active.filter((t) => t.status === 'in-progress'),
    upcoming:   active.filter((t) => t.status === 'upcoming'),
    inbox:      active.filter((t) => t.status === 'inbox'),
    completed,
  };
};

export const useTaskSections = (tasks: Task[]) => {
  return useMemo(() => groupTasks(tasks), [tasks]);
};
