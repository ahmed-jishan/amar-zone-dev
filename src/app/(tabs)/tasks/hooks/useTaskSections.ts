import { useMemo } from 'react';
import { Task } from '../types';
import {
  isOverdue,
  isToday,
  isInProgress,
  isUpcoming,
  isInbox,
  isCompleted,
} from '../utils/taskFilters';

const groupTasks = (tasks: Task[] = []) => {
  return {
    overdue: tasks.filter(isOverdue),
    today: tasks.filter(isToday),
    inProgress: tasks.filter(isInProgress),
    upcoming: tasks.filter(isUpcoming),
    inbox: tasks.filter(isInbox),
    completed: tasks.filter(isCompleted),
  };
};

export const useTaskSections = (tasks: Task[]) => {
  return useMemo(() => groupTasks(tasks), [tasks]);
};