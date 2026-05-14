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
      <div className="flex items-center gap-3 mb-2">
        <label htmlFor="month-picker" className="font-medium text-emerald-900 text-sm">মাস নির্বাচন করুন:</label>
        <input
          id="month-picker"
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="border rounded px-2 py-1 text-emerald-900"
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
