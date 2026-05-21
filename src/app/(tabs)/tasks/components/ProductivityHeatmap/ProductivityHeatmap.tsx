'use client';

import { useMemo } from 'react';
import { Task } from '../../types';

interface Props {
  tasks: Task[];
}

export default function ProductivityHeatmap({ tasks }: Props) {
  const { weeks, maxCount } = useMemo(() => {
    const today = new Date();
    const data: Record<string, number> = {};

    // Generate last 16 weeks of data
    for (let i = 0; i < 112; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const count = tasks.filter((t) => t.completedDates.includes(iso)).length;
      data[iso] = count;
    }

    // Group into weeks
    const weeks: string[][] = [];
    const dates = Object.keys(data).sort();
    for (let i = 0; i < dates.length; i += 7) {
      weeks.push(dates.slice(i, i + 7));
    }

    const maxCount = Math.max(...Object.values(data), 1);
    return { weeks: weeks.slice(0, 16).reverse(), maxCount, data };
  }, [tasks]);

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-[var(--az-surface-3)]';
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 'bg-[var(--az-success)]/30';
    if (ratio <= 0.5) return 'bg-[var(--az-success)]/50';
    if (ratio <= 0.75) return 'bg-[var(--az-success)]/70';
    return 'bg-[var(--az-success)]';
  };

  const monthLabels = useMemo(() => {
    const labels: { index: number; label: string }[] = [];
    let lastMonth = '';
    weeks.forEach((week, wi) => {
      const firstDay = week[0];
      if (firstDay) {
        const date = new Date(firstDay);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        if (month !== lastMonth) {
          labels.push({ index: wi, label: month });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="p-4 rounded-[var(--az-radius-xl)] bg-[var(--az-surface-1)] border border-[var(--az-border)] animate-[az-slide-up_400ms_ease-out]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-[var(--az-text-2)] uppercase tracking-wide">Activity Heatmap</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--az-text-3)]">Less</span>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${i === 0 ? 'bg-[var(--az-surface-3)]' : `bg-[var(--az-success)]`}`}
              style={{ opacity: i === 0 ? 1 : i * 0.25 }}
            />
          ))}
          <span className="text-[10px] text-[var(--az-text-3)]">More</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex gap-[3px] mb-1 ml-6">
        {weeks.map((_, wi) => {
          const label = monthLabels.find((m) => m.index === wi);
          return (
            <div key={wi} className="w-[11px] text-[9px] text-[var(--az-text-4)] text-center">
              {label?.label ?? ''}
            </div>
          );
        })}
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-[3px]">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className="h-[11px] text-[9px] text-[var(--az-text-4)] w-4 flex items-center justify-center">
              {i % 2 === 0 ? day : ''}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((date) => {
              const count = tasks.filter((t) => t.completedDates.includes(date)).length;
              const d = new Date(date);
              const isToday = date === new Date().toISOString().split('T')[0];
              return (
                <div
                  key={date}
                  className={`
                    w-[11px] h-[11px] rounded-sm transition-all duration-200 hover:scale-125 hover:z-10
                    ${getIntensity(count)}
                    ${isToday ? 'ring-1 ring-[var(--az-accent)] ring-offset-1 ring-offset-[var(--az-surface-1)]' : ''}
                  `}
                  title={`${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${count} completed`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
