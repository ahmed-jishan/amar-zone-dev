'use client';
// FIX 10: TaskFilters.tsx
// BUGS FIXED:
//   - Buttons were purely decorative — no active state, no state changes, no hook connection.
//   - Filter labels didn't match TASK_FILTERS constant keys ('High' vs 'high').
//   - No scrollbar hiding on mobile horizontal scroll.
//   - No visual active state to show current filter.
//
// IMPROVEMENT: Accepts activeFilter + onFilterChange as props (state owned by page).

import { TASK_FILTERS } from '../../constants/filters';
import type { FilterKey } from '../../hooks/useTaskFilters';

const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'All',
  today: 'Today',
  high: 'Priority',
  completed: 'Done',
  overdue: 'Overdue',
};

interface Props {
  activeFilter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
}

export default function TaskFilters({ activeFilter, onFilterChange }: Props) {
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TASK_FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onFilterChange(f)}
          aria-pressed={activeFilter === f}
          className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium transition-all active:scale-95 ${
            activeFilter === f
              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
              : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
          }`}
        >
          {FILTER_LABELS[f]}
        </button>
      ))}
    </div>
  );
}
