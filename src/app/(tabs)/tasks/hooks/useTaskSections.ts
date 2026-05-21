import { useMemo } from 'react';
import { Task } from '../types';

const groupTasks = (tasks: Task[] = []) => {
  const active = tasks.filter((t) => !t.completed && t.status !== 'archived');
  const completed = tasks.filter((t) => t.completed);
  return {
    overdue: active.filter((t) => t.status === 'overdue' || (t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0)))),
    today: active.filter((t) => t.status === 'today'),
    inProgress: active.filter((t) => t.status === 'in-progress'),
    upcoming: active.filter((t) => t.status === 'upcoming' || (t.dueDate && new Date(t.dueDate) > new Date())),
    inbox: active.filter((t) => t.status === 'inbox' || (!t.dueDate && t.status !== 'today' && t.status !== 'in-progress')),
    completed,
  };
};

export const useTaskSections = (tasks: Task[]) => {
  return useMemo(() => groupTasks(tasks), [tasks]);
};
