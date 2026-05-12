// store2/logsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DailyPrayerLog, PrayerName, PrayerStatus } from '../types2/prayer.types';

interface LogsStore {
  logs: Record<string, DailyPrayerLog>;
  updatePrayer: (date: string, prayer: PrayerName, status: PrayerStatus) => void;
  getPrayerStatus: (date: string, prayer: PrayerName) => PrayerStatus;
}

export const useLogsStore = create<LogsStore>()(
  persist(
    (set, get) => ({
      logs: {},
      updatePrayer: (date, prayer, status) =>
        set((state) => ({
          logs: {
            ...state.logs,
            [date]: {
              ...state.logs[date],
              [prayer]: { status, markedAt: Date.now() },
            },
          },
        })),
      getPrayerStatus: (date, prayer) => {
        const log = get().logs[date];
        return log?.[prayer]?.status || 'pending';
      },
    }),
    { name: 'prayer-logs' }
  )
);