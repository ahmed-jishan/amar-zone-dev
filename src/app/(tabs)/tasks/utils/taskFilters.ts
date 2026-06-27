import { Task } from '../types';

const todayISO = (): string => new Date().toISOString().split('T')[0];

const startOfToday = (): Date => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export const isDateOverdue = (dueDate: string): boolean => {
  if (!dueDate) return false;
  return new Date(dueDate) < startOfToday();
};

export const isDueToday = (dueDate?: string): boolean => {
  if (!dueDate) return false;
  return dueDate === todayISO();
};

export const isOverdue = (task: Task): boolean => {
  if (task.completed) return false;
  if (task.status === 'overdue') return true;
  return isDateOverdue(task.dueDate || '');
};

export const isToday = (task: Task): boolean => {
  if (task.completed || task.status === 'archived') return false;
  if (task.status === 'today') return true;
  return isDueToday(task.dueDate);
};

export const isInProgress = (task: Task): boolean => {
  if (task.completed || task.status === 'archived') return false;
  return task.status === 'in-progress';
};

export const isInbox = (task: Task): boolean => {
  if (task.completed || task.status === 'archived') return false;
  return task.status === 'inbox';
};

export const isUpcoming = (task: Task): boolean => {
  if (task.completed || task.status === 'archived') return false;
  if (task.status === 'upcoming') return true;
  // Upcoming = has a future due date, not overdue, not today
  if (!task.dueDate) return false;
  if (isDueToday(task.dueDate)) return false;
  if (isDateOverdue(task.dueDate)) return false;
  return true;
};

export const isCompleted = (task: Task): boolean => {
  return task.completed && task.status !== 'archived';
};

export const isArchived = (task: Task): boolean => {
  return task.status === 'archived';
};

export const isHighPriority = (task: Task): boolean => {
  if (task.completed || task.status === 'archived') return false;
  return task.priority === 'high' || task.priority === 'critical';
};

export const isActive = (task: Task): boolean => {
  return !task.completed && task.status !== 'archived';
};