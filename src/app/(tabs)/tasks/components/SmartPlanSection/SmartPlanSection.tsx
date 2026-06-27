'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../../types';
import { PRIORITIES } from '../../constants/priorities';
import { CATEGORIES } from '../../constants/categories';
import { formatTaskDate } from '../../utils/taskDates';

interface Props {
  tasks: Task[];
  onFocus: (task: Task) => void;
  onOpenDetails: (task: Task) => void;
  onShowToday: () => void;
  onCarryForward: (task: Task) => void;
  onArchive: (task: Task) => void;
}

const todayISO = () => new Date().toISOString().split('T')[0];
const dayMs = 24 * 60 * 60 * 1000;

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

export default function SmartPlanSection({
  tasks,
  onFocus,
  onOpenDetails,
  onShowToday,
  onCarryForward,
  onArchive,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const plan = useMemo(() => {
    const today = todayISO();
    const suggestedEnergy = getSuggestedEnergy();
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart.getTime() + i * dayMs);
      return d.toISOString().split('T')[0];
    });

    const active = tasks.filter((t) => !t.completed && t.status !== 'archived');
    const overdue = active.filter((t) => t.dueDate && t.dueDate < today);
    const dueToday = active.filter((t) => t.status === 'today' || t.dueDate === today);

    const recommended = [...active]
      .sort((a, b) => {
        const scoreA = (() => {
          const due = a.dueDate;
          return priorityScore[a.priority]
            + (!!due && due < today ? 70 : 0)
            + (due === today ? 45 : 0)
            + (a.status === 'in-progress' ? 35 : 0)
            + (a.status === 'today' ? 25 : 0)
            + (a.energyLevel === suggestedEnergy ? 15 : 0);
        })();
        const scoreB = (() => {
          const due = b.dueDate;
          return priorityScore[b.priority]
            + (!!due && due < today ? 70 : 0)
            + (due === today ? 45 : 0)
            + (b.status === 'in-progress' ? 35 : 0)
            + (b.status === 'today' ? 25 : 0)
            + (b.energyLevel === suggestedEnergy ? 15 : 0);
        })();
        return scoreB - scoreA;
      })
      .slice(0, 5);

    const completedThisWeek = tasks.filter((t) =>
      t.completedDates.some((d) => weekDates.includes(d))
    );
    const missed = active
      .filter((t) => !t.completed && t.dueDate && t.dueDate < today)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
      .slice(0, 4);
    const staleInbox = active
      .filter((t) => !t.completed && t.status === 'inbox')
      .filter((t) => new Date(t.createdAt).getTime() < now.getTime() - 7 * dayMs)
      .slice(0, 3);
    const focusMinutes = tasks.reduce((sum, t) => sum + (t.actualTime || 0), 0);
    const totalMinutes = recommended.reduce((sum, t) => sum + (t.timeEstimate || 0), 0);

    return {
      activeCount: active.length,
      dueTodayCount: dueToday.length,
      overdueCount: overdue.length,
      recommended,
      suggestedEnergy,
      totalMinutes,
      completedThisWeek,
      missed,
      staleInbox,
      focusMinutes,
    };
  }, [tasks]);

  const primaryTask = plan.recommended[0];
  const hasWeeklyContent = plan.completedThisWeek.length > 0 || plan.missed.length > 0 || plan.staleInbox.length > 0;
  const hasContent = plan.activeCount > 0;

  if (!hasContent && !hasWeeklyContent) return null;

  return (
    <section className="mb-4">
      {/* Summary pill (always visible) */}
      <motion.button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--az-radius-xl)] border border-[var(--az-accent-border)] bg-gradient-to-r from-[var(--az-surface-1)] to-[var(--az-accent-bg)] shadow-[var(--az-shadow-sm)] hover:shadow-[var(--az-shadow-md)] transition-all duration-300 cursor-pointer"
        whileTap={{ scale: 0.99 }}
      >
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-8 h-8 rounded-full bg-[var(--az-accent-bg)] border border-[var(--az-accent-border)] flex items-center justify-center flex-shrink-0"
        >
          <svg className="w-4 h-4 text-[var(--az-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>

        <div className="flex-1 min-w-0 text-left">
          <p className="text-[11px] font-bold uppercase tracking-[1px] text-[var(--az-accent)]">Smart Plan</p>
          <p className="text-[13px] font-semibold text-[var(--az-text-1)] mt-0.5 truncate">
            {!hasContent
              ? '✅ All clear — no active tasks'
              : primaryTask
                ? `🎯 ${primaryTask.title}`
                : '📋 Plan your day'
            }
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {plan.dueTodayCount > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[var(--az-accent-bg)] text-[var(--az-accent)] border border-[var(--az-accent-border)]">
              {plan.dueTodayCount} today
            </span>
          )}
          {plan.overdueCount > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[var(--az-danger-bg)] text-[var(--az-danger)] border border-[var(--az-danger-border)]">
              {plan.overdueCount} overdue
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--az-surface-2)] text-[var(--az-text-3)] border border-[var(--az-border)]">
            {plan.completedThisWeek.length} ✓ week
          </span>
        </div>
      </motion.button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 animate-[az-spring-reveal_400ms_ease-out]">
              {/* Metrics bar */}
              <div className="grid grid-cols-3 gap-2">
                <Metric label="Focus list" value={plan.recommended.length} tone="var(--az-accent)" />
                <Metric label="Est. time" value={`${plan.totalMinutes}m`} tone="var(--az-warn)" />
                <Metric label="Overdue" value={plan.overdueCount} tone={plan.overdueCount > 0 ? 'var(--az-danger)' : 'var(--az-success)'} />
              </div>

              {/* Primary task focus card */}
              {primaryTask && (
                <div className="rounded-[var(--az-radius-xl)] border border-[var(--az-accent-border)] bg-[var(--az-accent-bg)] p-4">
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
                      </div>
                      <p className="mt-1 text-[13px] font-semibold text-[var(--az-text-1)]">
                        {primaryTask.title}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--az-text-3)]">
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
                    <button
                      type="button"
                      onClick={onShowToday}
                      className="rounded-[var(--az-radius-md)] border border-[var(--az-border)] bg-[var(--az-surface-2)] px-3 py-2 text-[13px] font-semibold text-[var(--az-text-2)] transition-colors hover:text-[var(--az-text-1)]"
                    >
                      Today
                    </button>
                  </div>
                </div>
              )}

              {/* More recommended tasks */}
              {plan.recommended.length > 1 && (
                <div className="rounded-[var(--az-radius-lg)] border border-[var(--az-border)] bg-[var(--az-surface-1)] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--az-text-3)] mb-2">Also Consider</p>
                  <div className="space-y-1">
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
                </div>
              )}

              {/* Weekly Review — missed tasks */}
              {plan.missed.length > 0 && (
                <div className="rounded-[var(--az-radius-lg)] border border-[var(--az-border)] bg-[var(--az-surface-1)] p-3">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--az-text-3)] mb-2">
                    ⚠️ Needs Decision — {plan.missed.length} missed
                  </p>
                  <div className="space-y-2">
                    {plan.missed.map((task) => (
                      <ReviewRow
                        key={task.id}
                        task={task}
                        actionLabel="Move Today"
                        onPrimary={() => onCarryForward(task)}
                        onSecondary={() => onArchive(task)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly Review — stale inbox */}
              {plan.staleInbox.length > 0 && (
                <div className="rounded-[var(--az-radius-lg)] border border-[var(--az-border)] bg-[var(--az-surface-1)] p-3">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--az-text-3)] mb-2">
                    📥 Stale Inbox — {plan.staleInbox.length} items
                  </p>
                  <div className="space-y-2">
                    {plan.staleInbox.map((task) => (
                      <ReviewRow
                        key={task.id}
                        task={task}
                        actionLabel="Plan Today"
                        onPrimary={() => onCarryForward(task)}
                        onSecondary={() => onArchive(task)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly metrics row */}
              <div className="grid grid-cols-3 gap-2">
                <Metric label="Week Completed" value={plan.completedThisWeek.length} tone="var(--az-success)" />
                <Metric label="Tracked" value={`${plan.focusMinutes}m`} tone="var(--az-warn)" />
                <Metric label="Overdue" value={plan.overdueCount} tone={plan.overdueCount > 0 ? 'var(--az-danger)' : 'var(--az-success)'} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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