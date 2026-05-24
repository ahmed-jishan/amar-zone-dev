'use client';

import { useState } from 'react';
import { useLogsStore } from '../../store/logsStore';
import ConsistencyChart from './ConsistencyChart';
import Heatmap from './Heatmap';
import WeaknessInsightsCard from './WeaknessInsightsCard';
import { generateWeaknessInsights } from '../../utils/analyticsHelpers';

export default function InsightsView() {
  const logs = useLogsStore((state) => state.logs);
  // State for selected month (default: current month)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Parse selected month to Date
  const monthDate = new Date(selectedMonth + '-01');

  // Analytics for selected month
  const insights = generateWeaknessInsights(logs, monthDate);

  return (
    <div className="space-y-5">
      <div className="mb-2 flex items-center gap-3 rounded-2xl p-3 nz-card sm:w-fit">
        <label htmlFor="month-picker" className="text-sm font-medium nz-text">মাস নির্বাচন করুন:</label>
        <input
          id="month-picker"
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm nz-control"
          style={{ maxWidth: 160 }}
        />
      </div>
      <WeaknessInsightsCard logs={logs} month={monthDate} insights={insights} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Heatmap logs={logs} month={monthDate} />
        <ConsistencyChart logs={logs} />
      </div>
    </div>
  );
}
