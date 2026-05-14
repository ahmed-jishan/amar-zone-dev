import { useMemo } from 'react';
import { calculateCurrentStreak } from '../lib2/streakCalculator';
import { useLogsStore } from '../store2/logsStore';

export function useStreak() {
  const logs = useLogsStore((state) => state.logs);
  return useMemo(() => calculateCurrentStreak(logs), [logs]);
}
