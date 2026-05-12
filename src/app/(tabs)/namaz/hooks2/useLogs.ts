// hooks2/useLogs.ts
import { useLogsStore } from '../store2/logsStore';
import { useMemo } from 'react';

export function useLogs() {
  const logs = useLogsStore((state) => state.logs);
  const updatePrayer = useLogsStore((state) => state.updatePrayer);
  const getPrayerStatus = useLogsStore((state) => state.getPrayerStatus);

  // আজকের লগ সহজে পাওয়ার জন্য
  const today = new Date().toISOString().split('T')[0];
  const todayLog = useMemo(() => logs[today] || null, [logs, today]);

  return {
    logs,
    updatePrayer,
    getPrayerStatus,
    todayLog,
  };
}