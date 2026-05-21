import { useMemo, useState } from 'react';
import { Task } from '../types';
import { TASK_FILTERS } from '../constants/filters';

export type FilterKey = (typeof TASK_FILTERS)[number];

export const useTaskFilters = (tasks: Task[]) => {
  const [filter, setFilter] = useState<FilterKey>('all');

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'today':
        return tasks.filter((t) => t.status === 'today');
      case 'high':
        return tasks.filter((t) => t.priority === 'high' || t.priority === 'critical');
      case 'completed':
        return tasks.filter((t) => t.completed);
      case 'overdue':
        return tasks.filter((t) => t.status === 'overdue');
      default:
        return tasks;
    }
  }, [tasks, filter]);

  return { filter, setFilter, filteredTasks };
};
