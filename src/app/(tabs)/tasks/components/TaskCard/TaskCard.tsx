'use client';
// FIX 15: TaskCard.tsx
// BUGS FIXED:
//   - TaskCard not wrapped in React.memo — every task re-renders when ANY task in list
//     changes (e.g., toggling one card re-renders all cards). With 10k+ users each
//     potentially having 50+ tasks, this is a performance hazard.
//   - Checkbox has no aria-label — screen readers say "checkbox" with no context.
//   - Checkbox tap target is 16x16px (h-4 w-4) — too small for mobile (min 44x44 needed).
//   - TaskCardActions "•••" button has no delete/edit wired — purely decorative.
//   - onClick on task title to open details was missing — users expect to tap title.
//   - No visual distinction for overdue tasks.

import { memo, useState } from 'react';
import { Task } from '../../types';
import TaskCardMeta from './TaskCardMeta';
import TaskCardProgress from './TaskCardProgress';
import TaskCardActions from './TaskCardActions';
import TaskDetailsModal from '../TaskDetailsModal/TaskDetailsModal';

interface Props {
  task: Task;
  onToggle?: (id: string) => void;
  onFocus?: (task: Task) => void;
}

function TaskCard({ task, onToggle, onFocus }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const isOverdue = task.status === 'overdue' && !task.completed;

  return (
    <>
      <div
        className={`group relative rounded-2xl border bg-white/5 p-4 backdrop-blur-md transition-all hover:bg-white/[0.07] ${
          isOverdue
            ? 'border-red-500/20 bg-red-500/5'
            : 'border-white/10'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* FIX: larger tap target wrapper for checkbox on mobile */}
          <button
            role="checkbox"
            aria-checked={task.completed}
            aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
            onClick={() => onToggle?.(task.id)}
            className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-white/20 transition-all hover:border-emerald-500 active:scale-90"
            style={{
              background: task.completed
                ? 'rgba(16,185,129,0.8)'
                : 'transparent',
            }}
          >
            {task.completed && (
              <svg
                className="h-3 w-3 text-black"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          {/* FIX: tap title to open detail modal */}
          <div
            className="min-w-0 flex-1 cursor-pointer"
            onClick={() => setDetailOpen(true)}
          >
            <h3
              className={`text-sm font-medium leading-snug transition-colors ${
                task.completed
                  ? 'text-white/30 line-through'
                  : 'text-white'
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-white/40">
                {task.description}
              </p>
            )}
          </div>

          <TaskCardActions task={task} onFocus={onFocus} />
        </div>

        <TaskCardMeta task={task} />
        <TaskCardProgress task={task} />
      </div>

      {/* FIX: detail modal now openable from card */}
      <TaskDetailsModal
        task={task}
        open={detailOpen}
        setOpen={setDetailOpen}
      />
    </>
  );
}

// FIX: memoize to prevent re-renders of unchanged cards
export default memo(TaskCard);
