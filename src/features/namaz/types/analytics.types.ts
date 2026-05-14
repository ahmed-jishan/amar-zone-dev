import type { PrayerName } from './prayer.types';

export interface HeatmapDay {
  date: string;
  completed: number;
  total: number;
  ratio: number;
}

export interface WeeklyConsistencyPoint {
  weekStart: string;
  onTimePercent: number;
  completedPercent: number;
  totalLogged: number;
}

export interface MissedPrayerInsight {
  prayer: PrayerName;
  missedCount: number;
  totalCount: number;
  missedPercent: number;
}

export interface WeaknessInsights {
  mostMissed?: MissedPrayerInsight;
  bestConsistency?: {
    prayer: PrayerName;
    completedPercent: number;
  };
  currentStreak: number;
  totalDaysTracked: number;
}
