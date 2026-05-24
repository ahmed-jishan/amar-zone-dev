'use client';

import { useMemo } from 'react';
import { Task } from '../../types';

interface Props {
  tasks: Task[];
  onCarryForward: (task: Task) => void;
  onArchive: (task: Task) => void;
}

const dayMs = 24 * 60 * 60 * 1000;

function toISO(date: Date) {
  return date.toISOString().split('T')[0];
}

export default function WeeklyReview({ tasks, onCarryForward, onArchive }: Props) {
  const review = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekStart = new Date(todayStart.getTime() - 6 * dayMs);
    const weekDates = Array.from({ length: 7 }, (_, index) => toISO(new Date(weekStart.getTime() + index * dayMs)));

    const active = tasks.filter((task) => task.status !== 'archived');
    const completedThisWeek = active.filter((task) => task.completedDates.some((date) => weekDates.includes(date)));
    const staleInbox = active
      .filter((task) => !task.completed && task.status === 'inbox')
      .filter((task) => new Date(task.createdAt).getTime() < todayStart.getTime() - 7 * dayMs)
      .slice(0, 3);
    const missed = active
      .filter((task) => !task.completed && task.dueDate && task.dueDate < toISO(todayStart))
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
      .slice(0, 4);
    const focusMinutes = active.reduce((sum, task) => sum + (task.actualTime || 0), 0);

    return {
      completedThisWeek,
      missed,
      staleInbox,
      focusMinutes,
      weekDates,
    };
  }, [tasks]);

  if (!review.completedThisWeek.length && !review.missed.length && !review.staleInbox.length && !review.focusMinutes) {
    return null;
  }

  return (
    <section className="mb-4 rounded-[var(--az-radius-2xl)] border border-[var(--az-border)] bg-[var(--az-surface-1)] p-4 shadow-[var(--az-shadow-sm)]">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--az-text-3)]">Weekly Review</p>
          <h2 className="mt-1 text-[18px] font-bold text-[var(--az-text-1)]">Close the loop</h2>
        </div>
        <span className="rounded-full border border-[var(--az-border)] bg-[var(--az-surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--az-text-3)]">
          7 days
        </span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Metric label="Completed" value={review.completedThisWeek.length} color="var(--az-success)" />
        <Metric label="Missed" value={review.missed.length} color={review.missed.length ? 'var(--az-danger)' : 'var(--az-text-2)'} />
        <Metric label="Tracked" value={`${review.focusMinutes}m`} color="var(--az-warn)" />
      </div>

      {review.missed.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--az-text-3)]">Needs decision</p>
          {review.missed.map((task) => (
            <ReviewRow
              key={task.id}
              task={task}
              actionLabel="Move Today"
              onPrimary={() => onCarryForward(task)}
              onSecondary={() => onArchive(task)}
            />
          ))}
        </div>
      )}

      {review.staleInbox.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--az-text-3)]">Stale inbox</p>
          {review.staleInbox.map((task) => (
            <ReviewRow
              key={task.id}
              task={task}
              actionLabel="Plan Today"
              onPrimary={() => onCarryForward(task)}
              onSecondary={() => onArchive(task)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-[var(--az-radius-lg)] border border-[var(--az-border)] bg-[var(--az-surface-2)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--az-text-3)]">{label}</p>
      <p className="mt-0.5 text-[17px] font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function ReviewRow({
  task,
  actionLabel,
  onPrimary,
  onSecondary,
}: {
  task: Task;
  actionLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--az-radius-lg)] border border-[var(--az-border)] bg-[var(--az-surface-2)] px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[var(--az-text-1)]">{task.title}</p>
        <p className="mt-0.5 text-[11px] text-[var(--az-text-3)]">{task.dueDate ? `Due ${task.dueDate}` : 'Inbox task'}</p>
      </div>
      <button onClick={onPrimary} className="rounded-[var(--az-radius-md)] bg-[var(--az-accent)] px-2.5 py-1.5 text-[11px] font-semibold text-white">
        {actionLabel}
      </button>
      <button onClick={onSecondary} className="rounded-[var(--az-radius-md)] border border-[var(--az-border)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--az-text-3)] hover:text-[var(--az-text-1)]">
        Archive
      </button>
    </div>
  );
}
