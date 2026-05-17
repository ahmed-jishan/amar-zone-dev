// FIX 17: TaskCardMeta.tsx
// BUGS FIXED:
//   - new Date(task.dueDate).toDateString() produced long strings like
//     "Mon Jun 03 2025" — too wide for card meta on mobile.
//   - Overdue dates showed no red color — looked same as future dates.
//   - Category badge used no color differentiation — all same gray border.
//   - PRIORITIES[task.priority].color applied bg color but `text-black` was hardcoded —
//     low priority green badge has poor contrast with black text (WCAG fail).

import { Task } from '../../types';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';
import { formatTaskDate, isDateOverdue } from '../../utils/taskDates';

interface Props {
  task: Task;
}

export default function TaskCardMeta({ task }: Props) {
  const dueDateOverdue = task.dueDate ? isDateOverdue(task.dueDate) : false;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
      {/* Priority badge */}
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
          PRIORITIES[task.priority].color
        } text-white`}
        // FIX: text-white for all priority badges (better contrast than text-black on green)
      >
        {PRIORITIES[task.priority].label}
      </span>

      {/* Category badge — uses CATEGORIES colors */}
      <span
        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
          CATEGORIES[task.category]?.color ?? 'border-white/10 text-white/50'
        }`}
      >
        {CATEGORIES[task.category]?.emoji} {CATEGORIES[task.category]?.label ?? task.category}
      </span>

      {/* Due date — red if overdue, normal if upcoming */}
      {task.dueDate && (
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] ${
            dueDateOverdue
              ? 'border-red-500/30 text-red-400'
              : 'border-white/10 text-white/50'
          }`}
        >
          {formatTaskDate(task.dueDate)}
        </span>
      )}
    </div>
  );
}
