import { useMemo, useState } from 'react';
import { Task, FilterKey } from '../types';

export const useTaskFilters = (tasks: Task[]) => {
  const [filter, setFilter] = useState<FilterKey>('all');

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'today':
        return tasks.filter((t) => t.status === 'today' || (t.dueDate && t.dueDate <= new Date().toISOString().split('T')[0] && !t.completed));
      case 'high':
        return tasks.filter((t) => t.priority === 'high' || t.priority === 'critical');
      case 'completed':
        return tasks.filter((t) => t.completed);
      case 'overdue':
        return tasks.filter((t) => t.status === 'overdue' || (t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0)) && !t.completed));
      case 'inbox':
        return tasks.filter((t) => t.status === 'inbox');
      case 'in-progress':
        return tasks.filter((t) => t.status === 'in-progress');
      case 'archived':
        return tasks.filter((t) => t.status === 'archived');
      default:
        return tasks.filter((t) => t.status !== 'archived');
    }
  }, [tasks, filter]);

  return { filter, setFilter, filteredTasks };
};
