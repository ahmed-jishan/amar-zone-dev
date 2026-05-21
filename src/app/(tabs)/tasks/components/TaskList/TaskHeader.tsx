'use client';

import { useMemo } from 'react';

interface Stats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  overdue: number;
  today: number;
  inProgress: number;
  totalTime: number;
}

interface Props {
  stats: Stats;
  onToggleDashboard: () => void;
  showDashboard: boolean;
}

export default function TaskHeader({ stats, onToggleDashboard, showDashboard }: Props) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  }, []);

  const dateStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  return (
    <div className="mb-6 animate-[az-slide-up_300ms_ease-out]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-black text-[var(--az-text-1)] leading-tight tracking-tight">
            {greeting}
          </h1>
          <p className="text-[14px] text-[var(--az-text-3)] mt-1 font-medium">{dateStr}</p>
        </div>

        <button
          onClick={onToggleDashboard}
          className={`
            p-2.5 rounded-[var(--az-radius-xl)] transition-all duration-300
            ${showDashboard
              ? 'bg-[var(--az-accent)] text-white shadow-[0_0_16px_var(--az-accent-glow)]'
              : 'bg-[var(--az-surface-2)] text-[var(--az-text-2)] border border-[var(--az-border)] hover:border-[var(--az-accent-border)] hover:text-[var(--az-accent)]'
            }
          `}
          title="Toggle productivity dashboard"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      </div>

      {/* Quick stats row */}
      <div className="mt-4 flex items-center gap-4 overflow-x-auto pb-1">
        <StatPill
          value={stats.today}
          label="Today"
          color="var(--az-accent)"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
        <StatPill
          value={stats.inProgress}
          label="Active"
          color="var(--az-warn)"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatPill
          value={stats.overdue}
          label="Overdue"
          color="var(--az-danger)"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatPill
          value={`${stats.completionRate}%`}
          label="Done"
          color="var(--az-success)"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        {stats.totalTime > 0 && (
          <StatPill
            value={`${stats.totalTime}m`}
            label="Tracked"
            color="var(--az-text-2)"
            icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            }
          />
        )}
      </div>
    </div>
  );
}

function StatPill({
  value,
  label,
  color,
  icon,
}: {
  value: string | number;
  label: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--az-radius-lg)] bg-[var(--az-surface-1)] border border-[var(--az-border)] hover:border-[var(--az-border-hover)] transition-all duration-200">
      <span style={{ color }}>{icon}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-[15px] font-bold" style={{ color }}>{value}</span>
        <span className="text-[11px] text-[var(--az-text-3)] font-medium">{label}</span>
      </div>
    </div>
  );
}
