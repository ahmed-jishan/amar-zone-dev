'use client';
// FIX 11: TaskHeader.tsx
// BUGS FIXED:
//   - All numbers hardcoded (7, 4, 3h, 82%). Showed same values for every user always.
//   - Greeting was hardcoded "Good Evening 👋" regardless of time of day.
//   - Productivity % was hardcoded — should derive from completionRate.
//
// IMPROVEMENT:
//   - Dynamic greeting based on hour
//   - Accepts real stats from useTaskAnalytics
//   - Productivity bar shows live completion rate

interface StatsSnapshot {
  total: number;
  completed: number;
  completionRate: number;
  today: number;
  overdue: number;
}

interface Props {
  stats: StatsSnapshot;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Good Night 🌙';
  if (h < 12) return 'Good Morning ☀️';
  if (h < 17) return 'Good Afternoon 👋';
  if (h < 21) return 'Good Evening 🌆';
  return 'Good Night 🌙';
};

export default function TaskHeader({ stats }: Props) {
  const today = new Date();

  return (
    <div className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{getGreeting()}</h1>
          <p className="text-sm text-white/50">
            {today.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-white/50">Productivity</p>
          <p
            className={`text-xl font-bold tabular-nums ${
              stats.completionRate >= 80
                ? 'text-emerald-400'
                : stats.completionRate >= 50
                ? 'text-amber-400'
                : 'text-red-400'
            }`}
          >
            {stats.completionRate}%
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${stats.completionRate}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-white/60">
        <div className="rounded-xl bg-white/5 p-2">
          <p className="text-base font-semibold text-white tabular-nums">
            {stats.today}
          </p>
          Today
        </div>
        <div className="rounded-xl bg-white/5 p-2">
          <p className="text-base font-semibold text-emerald-400 tabular-nums">
            {stats.completed}
          </p>
          Done
        </div>
        <div className="rounded-xl bg-white/5 p-2">
          <p className="text-base font-semibold text-red-400 tabular-nums">
            {stats.overdue}
          </p>
          Overdue
        </div>
      </div>
    </div>
  );
}
