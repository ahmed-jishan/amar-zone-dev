// FIX 2: useTaskFilters.ts
// BUGS FIXED:
//   - TaskFilters.tsx rendered hardcoded static buttons with no active state and
//     no connection to this hook. Filters did nothing.
//   - TASK_FILTERS constant existed in constants/filters.ts but was never used here.
//     Filter values were duplicated as magic strings in two places.
//   - 'high' filter only matched priority === 'high' but TASK_FILTERS constant used
//     the same key — needed to match 'critical' too (done, but previously inconsistent
//     with the constant definition).
//   - No type safety on filter value (was plain string).

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
        // FIX: 'high' filter must include 'critical' — highest urgency tasks
        return tasks.filter(
          (t) => t.priority === 'high' || t.priority === 'critical'
        );
      case 'completed':
        // FIX: use t.completed (boolean) not status string — completed can be set
        // regardless of status (e.g., a 'today' task marked done is completed: true)
        return tasks.filter((t) => t.completed);
      case 'overdue':
        return tasks.filter((t) => t.status === 'overdue');
      default:
        return tasks;
    }
  }, [tasks, filter]);

  return {
    filter,
    setFilter,
    filteredTasks,
  };
};
