'use client';

import { useMemo } from 'react';
import { Task } from '../../types';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';
import { formatTaskDate } from '../../utils/taskDates';

interface Props {
  tasks: Task[];
  onFocus: (task: Task) => void;
  onOpenDetails: (task: Task) => void;
  onShowToday: () => void;
}

const todayISO = () => new Date().toISOString().split('T')[0];

const priorityScore: Record<Task['priority'], number> = {
  critical: 100,
  high: 75,
  medium: 45,
  low: 25,
};

function getSuggestedEnergy(): NonNullable<Task['energyLevel']> {
  const hour = new Date().getHours();
  if (hour < 12) return 'high';
  if (hour < 18) return 'medium';
  return 'low';
}

function scoreTask(task: Task, today: string, suggestedEnergy: NonNullable<Task['energyLevel']>) {
  const due = task.dueDate;
  const overdue = !!due && due < today;
  const dueToday = due === today;

  let score = priorityScore[task.priority];
  if (overdue) score += 70;
  if (dueToday) score += 45;
  if (task.status === 'in-progress') score += 35;
  if (task.status === 'today') score += 25;
  if (task.energyLevel === suggestedEnergy) score += 15;
  if (!task.energyLevel) score += 5;
  if (task.subtasks?.some((subtask) => subtask.completed)) score += 8;

  return score;
}

export default function TodayPlan({ tasks, onFocus, onOpenDetails, onShowToday }: Props) {
  const plan = useMemo(() => {
    const today = todayISO();
    const suggestedEnergy = getSuggestedEnergy();
    const active = tasks.filter((task) => !task.completed && task.status !== 'archived');
    const overdue = active.filter((task) => task.dueDate && task.dueDate < today);
    const dueToday = active.filter((task) => task.status === 'today' || task.dueDate === today);

    const recommended = [...active]
      .sort((a, b) => scoreTask(b, today, suggestedEnergy) - scoreTask(a, today, suggestedEnergy))
      .slice(0, 3);

    const totalMinutes = recommended.reduce((sum, task) => sum + (task.timeEstimate || 25), 0);

    return {
      activeCount: active.length,
      dueTodayCount: dueToday.length,
      overdueCount: overdue.length,
      recommended,
      suggestedEnergy,
      totalMinutes,
    };
  }, [tasks]);

  const primaryTask = plan.recommended[0];

  if (plan.activeCount === 0) {
    return (
      <section className="mb-4 rounded-[var(--az-radius-xl)] border border-[var(--az-border)] bg-[var(--az-surface-1)] p-4 shadow-[var(--az-shadow-sm)]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--az-text-3)]">Today Plan</p>
        <h2 className="mt-1 text-[18px] font-bold text-[var(--az-text-1)]">Clear day</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--az-text-3)]">
          No active tasks are waiting. Add one when something becomes worth tracking.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-4 overflow-hidden rounded-[var(--az-radius-2xl)] border border-[var(--az-border)] bg-[var(--az-surface-1)] shadow-[var(--az-shadow-md)]">
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--az-text-3)]">Today Plan</p>
            <h2 className="mt-1 text-[20px] font-bold tracking-tight text-[var(--az-text-1)]">
              {primaryTask ? primaryTask.title : 'Build a focused day'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onShowToday}
            className="rounded-[var(--az-radius-md)] border border-[var(--az-border)] bg-[var(--az-surface-2)] px-3 py-1.5 text-[12px] font-semibold text-[var(--az-text-2)] transition-colors hover:border-[var(--az-border-hover)] hover:text-[var(--az-text-1)]"
          >
            Today
          </button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <Metric label="Focus list" value={plan.recommended.length} tone="var(--az-accent)" />
          <Metric label="Est. time" value={`${plan.totalMinutes}m`} tone="var(--az-warn)" />
          <Metric label="Overdue" value={plan.overdueCount} tone={plan.overdueCount > 0 ? 'var(--az-danger)' : 'var(--az-success)'} />
        </div>

        {primaryTask && (
          <div className="rounded-[var(--az-radius-xl)] border border-[var(--az-accent-border)] bg-[var(--az-accent-bg)] p-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[var(--az-radius-md)] border border-[var(--az-border)] bg-[var(--az-surface-1)] text-[18px]">
                {CATEGORIES[primaryTask.category]?.emoji ?? '•'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="rounded-md border px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      color: PRIORITIES[primaryTask.priority].textColor,
                      background: PRIORITIES[primaryTask.priority].bgColor,
                      borderColor: PRIORITIES[primaryTask.priority].borderColor,
                    }}
                  >
                    {PRIORITIES[primaryTask.priority].label}
                  </span>
                  {primaryTask.dueDate && (
                    <span className="rounded-md border border-[var(--az-border)] bg-[var(--az-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--az-text-2)]">
                      {formatTaskDate(primaryTask.dueDate)}
                    </span>
                  )}
                  {primaryTask.energyLevel && (
                    <span className="rounded-md border border-[var(--az-border)] bg-[var(--az-surface-2)] px-2 py-0.5 text-[11px] font-medium capitalize text-[var(--az-text-2)]">
                      {primaryTask.energyLevel} energy
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--az-text-2)]">
                  Best next move based on priority, due date, status, and your likely {plan.suggestedEnergy} energy window.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onFocus(primaryTask)}
                className="flex-1 rounded-[var(--az-radius-md)] bg-[var(--az-accent)] px-3 py-2 text-[13px] font-semibold text-white shadow-[0_0_14px_var(--az-accent-glow)] transition-transform active:scale-[0.98]"
              >
                Start Focus
              </button>
              <button
                type="button"
                onClick={() => onOpenDetails(primaryTask)}
                className="rounded-[var(--az-radius-md)] border border-[var(--az-border)] bg-[var(--az-surface-2)] px-3 py-2 text-[13px] font-semibold text-[var(--az-text-2)] transition-colors hover:text-[var(--az-text-1)]"
              >
                Open
              </button>
            </div>
          </div>
        )}

        {plan.recommended.length > 1 && (
          <div className="mt-3 space-y-1.5">
            {plan.recommended.slice(1).map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onOpenDetails(task)}
                className="flex w-full items-center gap-2 rounded-[var(--az-radius-md)] px-2.5 py-2 text-left transition-colors hover:bg-[var(--az-surface-hover)]"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRIORITIES[task.priority].accentColor }} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--az-text-2)]">{task.title}</span>
                <span className="text-[11px] text-[var(--az-text-4)]">{task.timeEstimate || 25}m</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-[var(--az-radius-lg)] border border-[var(--az-border)] bg-[var(--az-surface-2)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--az-text-3)]">{label}</p>
      <p className="mt-0.5 text-[17px] font-bold" style={{ color: tone }}>{value}</p>
    </div>
  );
}
