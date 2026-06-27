import { useMemo, useState } from 'react';
import { Task, FilterKey } from '../types';
import {
  isActive,
  isToday,
  isOverdue,
  isInbox,
  isInProgress,
  isCompleted,
  isArchived,
  isHighPriority,
} from '../utils/taskFilters';

export const useTaskFilters = (tasks: Task[]) => {
  const [filter, setFilter] = useState<FilterKey>('all');

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'today':
        return tasks.filter(isToday);
      case 'high':
        return tasks.filter(isHighPriority);
      case 'completed':
        return tasks.filter(isCompleted);
      case 'overdue':
        return tasks.filter(isOverdue);
      case 'inbox':
        return tasks.filter(isInbox);
      case 'in-progress':
        return tasks.filter(isActive);
      case 'archived':
        return tasks.filter(isArchived);
      case 'all':
      default:
        return tasks;
    }
  }, [tasks, filter]);

  return { filter, setFilter, filteredTasks };
};