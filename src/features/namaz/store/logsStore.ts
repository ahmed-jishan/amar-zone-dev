import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PRAYER_NAME_LABELS, normalizePrayerName } from '../constants/prayerNames';
import { NAMAZ_STORAGE_KEYS } from '../constants/storageKeys';
import type { DailyPrayerLog, PrayerName, PrayerStatus } from '../types/prayer.types';

const COMPLETED_STATUSES: PrayerStatus[] = ['onTime', 'late', 'jamaat'];

export const TRACKED_PRAYERS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

interface LogsStore {
  logs: Record<string, DailyPrayerLog>;
  updatePrayer: (date: string, prayer: PrayerName, status: PrayerStatus) => void;
  getPrayerStatus: (date: string, prayer: PrayerName) => PrayerStatus;
  getDailyLog: (date: string) => DailyPrayerLog;
  getCompletionPercentage: (date: string) => number;
  clearDate: (date: string) => void;
}

export function getPrayerStatusFromLog(log: DailyPrayerLog | undefined, prayer: PrayerName): PrayerStatus {
  const canonical = normalizePrayerName(prayer) as PrayerName;
  const legacy = PRAYER_NAME_LABELS[canonical]?.en as PrayerName | undefined;
  return log?.[prayer]?.status ?? log?.[canonical]?.status ?? (legacy ? log?.[legacy]?.status : undefined) ?? 'pending';
}

export function getCompletionPercentageFromLog(log: DailyPrayerLog | undefined): number {
  if (!log) return 0;
  const completed = TRACKED_PRAYERS.filter((prayer) =>
    COMPLETED_STATUSES.includes(getPrayerStatusFromLog(log, prayer))
  ).length;
  return Math.round((completed / TRACKED_PRAYERS.length) * 100);
}

export const useLogsStore = create<LogsStore>()(
  persist(
    (set, get) => ({
      logs: {},
      updatePrayer: (date, prayer, status) =>
        set((state) => {
          // Deep clone logs to ensure new reference for every update
          const newLogs = { ...state.logs };
          newLogs[date] = { ...newLogs[date], [prayer]: { status, markedAt: Date.now() } };
          return { logs: newLogs };
        }),
      getPrayerStatus: (date, prayer) => {
        const log = get().logs[date];
        return getPrayerStatusFromLog(log, prayer);
      },
      getDailyLog: (date) => get().logs[date] || {},
      getCompletionPercentage: (date) => getCompletionPercentageFromLog(get().logs[date]),
      clearDate: (date) =>
        set((state) => {
          const { [date]: _removed, ...logs } = state.logs;
          return { logs };
        }),
    }),
    { name: NAMAZ_STORAGE_KEYS.prayerLogs }
  )
);
