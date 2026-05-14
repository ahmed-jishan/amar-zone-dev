'use client';

import { PRAYER_NAME_LABELS } from '../../constants/prayerNames';
import type { DailyPrayerLog } from '../../types/prayer.types';

export default function WeaknessInsightsCard({ logs, month, insights }: {
  logs: Record<string, DailyPrayerLog>;
  month: Date;
  insights: any;
}) {
  const hasData = Object.keys(logs).length > 0;
  const mostMissed = hasData && insights.mostMissedPrayer
    ? PRAYER_NAME_LABELS[insights.mostMissedPrayer].bn
    : 'ডেটা নেই';
  const bestConsistency = hasData && insights.bestPrayer
    ? PRAYER_NAME_LABELS[insights.bestPrayer].bn
    : 'ডেটা নেই';

  return (
    <section className="bg-white/70 border border-emerald-100 rounded-2xl p-5">
      <h3 className="text-lg font-semibold text-emerald-950">Prayer Insights</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Current streak</p>
          <p className="mt-2 text-2xl font-bold text-emerald-950">{insights.currentStreak} days</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-700">Most missed</p>
          <p className="mt-2 text-2xl font-bold text-amber-950">
            {mostMissed}
          </p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-700">Best consistency</p>
          <p className="mt-2 text-2xl font-bold text-blue-950">
            {bestConsistency}
          </p>
        </div>
        <div className="rounded-xl bg-teal-50 p-4">
          <p className="text-xs uppercase tracking-wide text-teal-700">Monthly completion</p>
          <p className="mt-2 text-2xl font-bold text-teal-950">{insights.completionRate}%</p>
        </div>
      </div>
    </section>
  );
}
