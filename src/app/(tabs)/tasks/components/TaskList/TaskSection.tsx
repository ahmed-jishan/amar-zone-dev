'use client';
// FIX 22: TaskSection.tsx
// BUGS FIXED:
//   - No visual differentiation between section types (Overdue looks same as Today).
//   - Completed section always expanded — on 10k-user SaaS with 50+ completed tasks
//     this would push all content far down. Should be collapsed by default.
//   - Section title count badge lacked urgency coloring for overdue.
//
// IMPROVEMENT:
//   - `variant` prop: 'default' | 'danger' | 'muted'
//   - Completed section starts collapsed with toggle

import { useState } from 'react';
import { Task } from '../../types';
import TaskCard from '../TaskCard/TaskCard';

interface Props {
  title: string;
  tasks: Task[];
  onToggle?: (id: string) => void;
  onFocus?: (task: Task) => void;
  variant?: 'default' | 'danger' | 'muted';
}

const TITLE_STYLES = {
  default: 'text-white/70',
  danger: 'text-red-400',
  muted: 'text-white/40',
};

const COUNT_STYLES = {
  default: 'text-white/30',
  danger: 'text-red-400/70',
  muted: 'text-white/20',
};

export default function TaskSection({
  title,
  tasks,
  onToggle,
  onFocus,
  variant = 'default',
}: Props) {
  // FIX: completed section starts collapsed
  const defaultCollapsed = variant === 'muted';
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (!tasks.length) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed((p) => !p)}
        className="mb-3 flex w-full items-center justify-between"
        aria-expanded={!collapsed}
      >
        <h2 className={`text-xs font-semibold uppercase tracking-widest ${TITLE_STYLES[variant]}`}>
          {title}
        </h2>

        <div className="flex items-center gap-2">
          <span className={`text-xs tabular-nums ${COUNT_STYLES[variant]}`}>
            {tasks.length}
          </span>
          <span className={`text-[10px] transition-transform ${collapsed ? '' : 'rotate-180'} ${COUNT_STYLES[variant]}`}>
            ▾
          </span>
        </div>
      </button>

      {!collapsed && (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onFocus={onFocus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
