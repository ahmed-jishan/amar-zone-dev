// FIX 20: TaskDetailsModal/TaskMeta.tsx
// BUGS FIXED:
//   - "Priority: high" was plain text with no visual badge — same as TaskCardMeta
//     but without colors, looked like debug output not a UI.
//   - "Category: personal" same issue.
//   - Due date used toDateString() — verbose, no overdue coloring.

import { Task } from '../../types';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';
import { formatTaskDate, isDateOverdue } from '../../utils/taskDates';

interface Props {
  task: Task;
}

export default function TaskMeta({ task }: Props) {
  const dueDateOverdue = task.dueDate ? isDateOverdue(task.dueDate) : false;

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {/* Priority */}
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium text-white ${
          PRIORITIES[task.priority].color
        }`}
      >
        {PRIORITIES[task.priority].label}
      </span>

      {/* Category */}
      <span
        className={`rounded-full border px-3 py-1 text-xs font-medium ${
          CATEGORIES[task.category]?.color ?? 'border-white/10 text-white/50'
        }`}
      >
        {CATEGORIES[task.category]?.emoji} {CATEGORIES[task.category]?.label ?? task.category}
      </span>

      {/* Due Date */}
      {task.dueDate && (
        <span
          className={`rounded-full border px-3 py-1 text-xs ${
            dueDateOverdue
              ? 'border-red-500/30 text-red-400'
              : 'border-white/10 text-white/50'
          }`}
        >
          📅 {formatTaskDate(task.dueDate)}
        </span>
      )}

      {/* Energy Level */}
      {task.energyLevel && (
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
          ⚡ {task.energyLevel} energy
        </span>
      )}
    </div>
  );
}
