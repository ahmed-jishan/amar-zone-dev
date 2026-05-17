import { useCallback } from 'react';
import { formatLocalDateKey } from '../utils/dateHelpers';
import { useLogsStore } from '../store/logsStore';
import type { PrayerName, PrayerStatus } from '../types/prayer.types';

export function usePrayerTracking(date = formatLocalDateKey(new Date())) {
  const logs = useLogsStore((state) => state.logs);
  const updatePrayer = useLogsStore((state) => state.updatePrayer);
  const getPrayerStatus = useLogsStore((state) => state.getPrayerStatus);

  const markPrayer = useCallback(
    (prayer: PrayerName, status: PrayerStatus) => updatePrayer(date, prayer, status),
    [date, updatePrayer]
  );

  return {
    logs,
    dateLog: logs[date] ?? {},
    markPrayer,
    getPrayerStatus,
  };
}
