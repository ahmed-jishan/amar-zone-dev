import { Task } from '../types';

export const getTaskProgress = (task: Task): number => {
  if (!task.subtasks?.length) return task.completed ? 100 : 0;

  const done = task.subtasks.filter((s) => s.completed).length;

  return Math.round((done / task.subtasks.length) * 100);
};