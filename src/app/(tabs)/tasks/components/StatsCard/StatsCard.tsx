'use client';
// FIX 12: StatsCard.tsx
// BUGS FIXED:
//   - StatsGrid.tsx had HARDCODED static data (Today Tasks: 7, Completed: 4, etc.).
//     It was imported in page.tsx aliased as StatsGrid but was StatsCard's default export.
//     page.tsx import was: `import StatsGrid from './components/StatsCard/StatsCard'`
//     which means StatsGrid.tsx (the hardcoded one) was NEVER rendered — StatsCard was.
//     StatsGrid.tsx should be deleted as dead code.
//   - StatsCard called useTaskAnalytics(tasks) correctly but layout had no visual weight.
//
// IMPROVEMENT:
//   - Cleaner two-column grid with accent colors per metric
//   - Completion rate with mini progress bar
//   - Remove StatsGrid.tsx (dead file with hardcoded data)

import { useTaskAnalytics } from '../../hooks/useTaskAnalytics';
import { Task } from '../../types';

interface Props {
  tasks: Task[];
}

export default function StatsCard({ tasks }: Props) {
  const stats = useTaskAnalytics(tasks);

  return (
    <div className="mb-5 grid grid-cols-2 gap-3">
      {/* Completion Rate — spans full width for prominence */}
      <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/50">Completion Rate</p>
          <p className="text-sm font-semibold tabular-nums text-emerald-400">
            {stats.completionRate}%
          </p>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-white/50">Total</p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-white">
          {stats.total}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-white/50">Completed</p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-400">
          {stats.completed}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-white/50">Pending</p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-amber-400">
          {stats.pending}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-white/50">Overdue</p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-red-400">
          {stats.overdue}
        </p>
      </div>
    </div>
  );
}

// NOTE: Delete tasks/components/StatsCard/StatsGrid.tsx — it's dead code with
// hardcoded data. It was never rendered (page.tsx imported StatsCard, not StatsGrid).
