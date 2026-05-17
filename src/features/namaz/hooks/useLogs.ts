// features/namaz/hooks/useLogs.ts
import { useLogsStore } from '../store/logsStore';
import { formatLocalDateKey } from '../utils/dateHelpers';
import { useMemo } from 'react';

export function useLogs() {
  const logs = useLogsStore((state) => state.logs);
  const updatePrayer = useLogsStore((state) => state.updatePrayer);
  const getPrayerStatus = useLogsStore((state) => state.getPrayerStatus);
  const getDailyLog = useLogsStore((state) => state.getDailyLog);
  const getCompletionPercentage = useLogsStore((state) => state.getCompletionPercentage);

  // আজকের লগ সহজে পাওয়ার জন্য
  const today = formatLocalDateKey(new Date());
  const todayLog = useMemo(() => logs[today] || null, [logs, today]);

  return {
    logs,
    updatePrayer,
    getPrayerStatus,
    getDailyLog,
    getCompletionPercentage,
    todayLog,
  };
}
