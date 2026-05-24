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
    <section className="rounded-2xl p-5 nz-card">
      <h3 className="text-lg font-semibold nz-text">Prayer Insights</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl p-4 nz-soft">
          <p className="text-xs uppercase tracking-wide nz-muted">Current streak</p>
          <p className="mt-2 text-2xl font-bold nz-text">{insights.currentStreak} days</p>
        </div>
        <div className="rounded-xl p-4 nz-soft">
          <p className="text-xs uppercase tracking-wide nz-gold">Most missed</p>
          <p className="mt-2 text-2xl font-bold nz-text">
            {mostMissed}
          </p>
        </div>
        <div className="rounded-xl p-4 nz-soft">
          <p className="text-xs uppercase tracking-wide nz-muted">Best consistency</p>
          <p className="mt-2 text-2xl font-bold nz-text">
            {bestConsistency}
          </p>
        </div>
        <div className="rounded-xl p-4 nz-soft">
          <p className="text-xs uppercase tracking-wide nz-accent">Monthly completion</p>
          <p className="mt-2 text-2xl font-bold nz-text">{insights.completionRate}%</p>
        </div>
      </div>
    </section>
  );
}
