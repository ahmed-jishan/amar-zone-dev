import { useMemo } from 'react';
import { calculateCurrentStreak } from '../utils/streakCalculator';
import { useLogsStore } from '../store/logsStore';

export function useStreak() {
  const logs = useLogsStore((state) => state.logs);
  return useMemo(() => calculateCurrentStreak(logs), [logs]);
}
