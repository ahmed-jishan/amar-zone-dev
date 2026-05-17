// FIX 16: TaskCardActions.tsx
// BUGS FIXED:
//   - "•••" button was purely decorative — no delete/edit action wired.
//   - `opacity-0 group-hover:opacity-100` pattern is INVISIBLE on mobile (no hover).
//     Actions were completely inaccessible on touch devices.
//   - No aria-labels on buttons.
//
// IMPROVEMENT:
//   - Always visible on mobile (only hidden on hover for desktop)
//   - Delete button wired to store
//   - Focus button shows only if task is not completed

import { useTaskStore } from '@/lib/store/taskStore';
import { Task } from '../../types';

interface Props {
  task: Task;
  onFocus?: (task: Task) => void;
}

export default function TaskCardActions({ task, onFocus }: Props) {
  const deleteTask = useTaskStore((s) => s.deleteTask);

  return (
    // FIX: visible by default on mobile; fade on desktop behind group-hover
    <div className="flex flex-shrink-0 items-center gap-1 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
      {!task.completed && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFocus?.(task);
          }}
          aria-label={`Focus on: ${task.title}`}
          className="rounded-lg bg-white/5 px-2 py-1 text-[10px] font-medium text-white/60 transition hover:bg-emerald-500/20 hover:text-emerald-300 active:scale-90"
        >
          Focus
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteTask(task.id);
        }}
        aria-label={`Delete: ${task.title}`}
        className="rounded-lg bg-white/5 px-2 py-1 text-[10px] text-white/40 transition hover:bg-red-500/20 hover:text-red-400 active:scale-90"
      >
        ✕
      </button>
    </div>
  );
}
