'use client';

import { useMemo, useState } from 'react';
import { Task } from '../../types';
import { useTaskAnalytics } from '../../hooks/useTaskAnalytics';

interface Props {
  tasks: Task[];
}

export default function Dashboard({ tasks }: Props) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const stats = useTaskAnalytics(tasks);

  const weeklyData = useMemo(() => {
    const data: { day: string; completed: number; created: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      data.push({
        day: dayName,
        completed: tasks.filter((t) => t.completedDates.includes(iso)).length,
        created: tasks.filter((t) => t.createdAt.startsWith(iso)).length,
      });
    }
    return data;
  }, [tasks]);

  const maxCompleted = Math.max(...weeklyData.map((d) => d.completed), 1);
  const completionTrend = weeklyData.map((d) => ({
    ...d,
    height: Math.max((d.completed / maxCompleted) * 100, 8),
  }));

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; completed: number; color: string }> = {};
    tasks.forEach((t) => {
      if (!map[t.category]) map[t.category] = { count: 0, completed: 0, color: '' };
      map[t.category].count++;
      if (t.completed) map[t.category].completed++;
    });
    const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];
    let ci = 0;
    return Object.entries(map).map(([cat, data]) => ({
      category: cat,
      ...data,
      color: colors[ci++ % colors.length],
      pct: Math.round((data.completed / Math.max(data.count, 1)) * 100),
    }));
  }, [tasks]);

  const totalTime = useMemo(() => {
    return tasks.reduce((acc, t) => acc + (t.actualTime || 0), 0);
  }, [tasks]);

  const avgCompletionTime = useMemo(() => {
    const completedWithTime = tasks.filter((t) => t.completed && t.actualTime);
    if (!completedWithTime.length) return 0;
    return Math.round(completedWithTime.reduce((acc, t) => acc + (t.actualTime || 0), 0) / completedWithTime.length);
  }, [tasks]);

  return (
    <div className="space-y-4 animate-[az-slide-up_400ms_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-[var(--az-text-1)]">Productivity</h2>
        <div className="flex items-center gap-1 p-1 rounded-[var(--az-radius-lg)] bg-[var(--az-surface-2)] border border-[var(--az-border)]">
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`
                px-3 py-1 rounded-md text-[12px] font-semibold capitalize transition-all
                ${period === p ? 'bg-[var(--az-accent)] text-white shadow-sm' : 'text-[var(--az-text-2)] hover:text-[var(--az-text-1)]'}
              `}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Tasks" value={stats.total} trend={stats.completionRate} trendLabel="completion rate" color="var(--az-accent)" />
        <StatCard label="Completed" value={stats.completed} trend={stats.pending} trendLabel="pending" color="var(--az-success)" />
        <StatCard label="Overdue" value={stats.overdue} trend={stats.today} trendLabel="due today" color="var(--az-danger)" />
        <StatCard label="Time Tracked" value={`${totalTime}m`} trend={avgCompletionTime} trendLabel="avg per task" color="var(--az-warn)" />
      </div>

      {/* Weekly Bar Chart */}
      <div className="p-4 rounded-[var(--az-radius-xl)] bg-[var(--az-surface-1)] border border-[var(--az-border)]">
        <h3 className="text-[13px] font-semibold text-[var(--az-text-2)] mb-4 uppercase tracking-wide">Weekly Activity</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {completionTrend.map((d, i) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col gap-1">
                <div
                  className="w-full rounded-t-md bg-[var(--az-success)]/80 transition-all duration-700 hover:bg-[var(--az-success)]"
                  style={{
                    height: `${d.height}%`,
                    animationDelay: `${i * 100}ms`,
                    animation: 'az-slide-up 500ms ease-out both',
                  }}
                />
              </div>
              <span className="text-[11px] font-medium text-[var(--az-text-3)]">{d.day}</span>
              <span className="text-[10px] text-[var(--az-text-4)]">{d.completed}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="p-4 rounded-[var(--az-radius-xl)] bg-[var(--az-surface-1)] border border-[var(--az-border)]">
        <h3 className="text-[13px] font-semibold text-[var(--az-text-2)] mb-3 uppercase tracking-wide">By Category</h3>
        <div className="space-y-3">
          {categoryBreakdown.map((cat) => (
            <div key={cat.category} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              <span className="text-[13px] font-medium text-[var(--az-text-1)] capitalize w-20">{cat.category}</span>
              <div className="flex-1 h-2 rounded-full bg-[var(--az-surface-3)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${cat.pct}%`, background: cat.color }}
                />
              </div>
              <span className="text-[12px] font-semibold text-[var(--az-text-2)] w-12 text-right">
                {cat.completed}/{cat.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  trendLabel,
  color,
}: {
  label: string;
  value: string | number;
  trend: string | number;
  trendLabel: string;
  color: string;
}) {
  return (
    <div className="p-4 rounded-[var(--az-radius-xl)] bg-[var(--az-surface-1)] border border-[var(--az-border)] hover:border-[var(--az-border-hover)] transition-all duration-300 hover:shadow-[var(--az-shadow-sm)]">
      <div className="text-[11px] font-semibold text-[var(--az-text-3)] uppercase tracking-wide mb-1">{label}</div>
      <div className="text-[24px] font-bold text-[var(--az-text-1)] leading-tight">{value}</div>
      <div className="mt-1 text-[11px] text-[var(--az-text-3)] flex items-center gap-1">
        <span className="font-semibold" style={{ color }}>{trend}</span>
        <span>{trendLabel}</span>
      </div>
    </div>
  );
}
