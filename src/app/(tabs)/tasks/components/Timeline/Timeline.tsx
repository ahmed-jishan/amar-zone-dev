'use client';

import { useMemo } from 'react';
import { Task } from '../../types';
import { formatTaskDate, isDateOverdue } from '../../utils/taskDates';
import { PRIORITIES } from '../../constants/priorities';

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onOpenDetails?: (task: Task) => void;
}

export default function Timeline({ tasks, onToggle, onOpenDetails }: Props) {
  const timelineItems = useMemo(() => {
    // Respect the filtered tasks as received (no re-filtering)
    const withDate = tasks.filter((t) => t.dueDate);
    const withoutDate = tasks.filter((t) => !t.dueDate);

    const sorted = [...withDate].sort((a, b) => {
      return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
    });

    // Group by date
    const groups: Record<string, Task[]> = {};
    sorted.forEach((t) => {
      const d = t.dueDate!;
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });

    return { groups, noDate: withoutDate };
  }, [tasks]);

  const dates = Object.keys(timelineItems.groups).sort();

  if (dates.length === 0 && timelineItems.noDate.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[14px] text-[var(--az-text-3)]">No upcoming tasks with due dates</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 animate-[az-slide-up_400ms_ease-out]">
      {/* Timeline line */}
      <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-[var(--az-border)] rounded-full" />

      <div className="space-y-6">
        {dates.map((date) => {
          const dateTasks = timelineItems.groups[date];
          const isOverdue = isDateOverdue(date);
          const d = new Date(date);
          const isToday = date === new Date().toISOString().split('T')[0];

          return (
            <div key={date} className="relative">
              {/* Date node */}
              <div
                className={`
                  absolute left-[-23px] top-1 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center z-10
                  ${isToday
                    ? 'bg-[var(--az-accent)] border-[var(--az-accent)] shadow-[0_0_12px_var(--az-accent-glow)]'
                    : isOverdue
                      ? 'bg-[var(--az-danger)] border-[var(--az-danger)] shadow-[0_0_12px_var(--az-danger-glow)]'
                      : 'bg-[var(--az-surface-2)] border-[var(--az-border-strong)]'
                  }
                `}
              >
                {isToday && (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </div>

              {/* Date label */}
              <div className="mb-2">
                <span
                  className={`
                    text-[13px] font-bold
                    ${isToday ? 'text-[var(--az-accent)]' : isOverdue ? 'text-[var(--az-danger)]' : 'text-[var(--az-text-2)]'}
                  `}
                >
                  {isToday ? 'Today' : formatTaskDate(date)}
                </span>
                <span className="ml-2 text-[11px] text-[var(--az-text-3)]">
                  {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Tasks for this date */}
              <div className="space-y-2">
                {dateTasks.map((task) => (
                  <TimelineTaskCard
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onOpenDetails={onOpenDetails}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* No date section */}
        {timelineItems.noDate.length > 0 && (
          <div className="relative">
            <div className="absolute left-[-23px] top-1 w-[22px] h-[22px] rounded-full border-2 border-[var(--az-text-4)] bg-[var(--az-surface-2)] flex items-center justify-center z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--az-text-4)]" />
            </div>
            <div className="mb-2">
              <span className="text-[13px] font-bold text-[var(--az-text-3)]">No Due Date</span>
              <span className="ml-2 text-[11px] text-[var(--az-text-4)]">{timelineItems.noDate.length} tasks</span>
            </div>
            <div className="space-y-2">
              {timelineItems.noDate.map((task) => (
                <TimelineTaskCard
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onOpenDetails={onOpenDetails}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineTaskCard({
  task,
  onToggle,
  onOpenDetails,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onOpenDetails?: (task: Task) => void;
}) {
  const pri = PRIORITIES[task.priority];

  return (
    <div
      onClick={() => onOpenDetails?.(task)}
      className="group flex items-start gap-3 p-3 rounded-[var(--az-radius-lg)] bg-[var(--az-surface-1)] border border-[var(--az-border)] hover:border-[var(--az-border-hover)] hover:shadow-[var(--az-shadow-sm)] transition-all duration-200 cursor-pointer"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className={`
          flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all
          ${task.completed
            ? 'bg-[var(--az-success)] border-[var(--az-success)]'
            : 'border-[var(--az-border-strong)] hover:border-[var(--az-accent)]'
          }
        `}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <h4 className={`text-[14px] font-semibold ${task.completed ? 'text-[var(--az-text-3)] line-through' : 'text-[var(--az-text-1)]'}`}>
          {task.title}
        </h4>
        {task.description && (
          <p className="mt-0.5 text-[12px] text-[var(--az-text-2)] line-clamp-1">{task.description}</p>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold border"
            style={{
              color: pri?.textColor,
              background: pri?.bgColor,
              borderColor: pri?.borderColor,
            }}
          >
            {pri?.label}
          </span>
          {task.category && (
            <span className="text-[10px] text-[var(--az-text-3)] capitalize">{task.category}</span>
          )}
        </div>
      </div>
    </div>
  );
}
