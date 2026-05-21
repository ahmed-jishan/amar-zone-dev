import { Task } from '../types';

export const getTaskProgress = (task: Task): number => {
  if (!task.subtasks?.length) return task.completed ? 100 : 0;
  const completed = task.subtasks.filter((s) => s.completed).length;
  return Math.round((completed / task.subtasks.length) * 100);
};

export const getOverallProgress = (tasks: Task[]): number => {
  if (!tasks.length) return 0;
  const total = tasks.reduce((acc, t) => acc + getTaskProgress(t), 0);
  return Math.round(total / tasks.length);
};
