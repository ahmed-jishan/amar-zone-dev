import { PRAYER_NAMES, PRAYER_NAME_LABELS, normalizePrayerName } from '../constants/prayerNames';
import type { HeatmapDay, WeeklyConsistencyPoint, WeaknessInsights } from '../types2/analytics.types';
import type { DailyPrayerLog, PrayerName, PrayerStatus } from '../types2/prayer.types';
import { formatLocalDateKey, parseLocalDateKey } from './dateHelpers';
import { calculateCurrentStreak } from './streakCalculator';

const DONE: PrayerStatus[] = ['onTime', 'jamaat', 'late'];
const TRACKED_PRAYERS = PRAYER_NAMES.map((name) => PRAYER_NAME_LABELS[name].en as PrayerName);

function dateKey(date: Date): string {
  return formatLocalDateKey(date);
}

function statusFor(log: DailyPrayerLog | undefined, prayer: string): PrayerStatus {
  const canonical = normalizePrayerName(prayer) as PrayerName;
  const legacy = PRAYER_NAME_LABELS[canonical]?.en as PrayerName | undefined;
  return log?.[prayer as PrayerName]?.status ?? log?.[canonical]?.status ?? (legacy ? log?.[legacy]?.status : undefined) ?? 'pending';
}

export function buildHeatmapData(logs: Record<string, DailyPrayerLog>, month = new Date()): HeatmapDay[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const days = new Date(year, monthIndex + 1, 0).getDate();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(year, monthIndex, index + 1);
    const key = dateKey(date);
    const completed = PRAYER_NAMES.filter((name) => DONE.includes(statusFor(logs[key], name))).length;
    return { date: key, completed, total: PRAYER_NAMES.length, ratio: completed / PRAYER_NAMES.length };
  });
}

export interface GeneratedHeatmapDay {
  date: string;
  completionRate: number;
  completed: number;
  total: number;
}

export interface GeneratedConsistencyPoint {
  prayer: PrayerName;
  label: string;
  percentage: number;
  onTimeCount: number;
  totalCount: number;
}

export interface GeneratedWeaknessInsights {
  mostMissedPrayer: PrayerName | null;
  bestPrayer: PrayerName | null;
  currentStreak: number;
  completionRate: number;
  totalDaysTracked: number;
}

export function generateHeatmapData(
  logs: Record<string, DailyPrayerLog>,
  month = new Date()
): GeneratedHeatmapDay[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const days = new Date(year, monthIndex + 1, 0).getDate();

  // Collect all log keys for the visible month
  const logKeysForMonth = Object.keys(logs).filter((key) => {
    const parsed = parseLocalDateKey(key);
    return parsed.getFullYear() === year && parsed.getMonth() === monthIndex;
  });

  // Build a map for quick lookup
  const logMap = new Map(logKeysForMonth.map((key) => [key, logs[key]]));

  // For each day in the month, use log if present, else empty
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(year, monthIndex, index + 1);
    const key = dateKey(date);
    const log = logMap.get(key);
    const completed = TRACKED_PRAYERS.filter((prayer) => DONE.includes(statusFor(log, prayer))).length;
    const total = TRACKED_PRAYERS.length;
    return {
      date: key,
      completionRate: Math.round((completed / total) * 100),
      completed,
      total,
    };
  });
}

export function generateConsistencyChartData(
  logs: Record<string, DailyPrayerLog>
): GeneratedConsistencyPoint[] {
  const entries = Object.values(logs);

  return TRACKED_PRAYERS.map((prayer) => {
    const totalCount = entries.filter((log) => statusFor(log, prayer) !== 'pending').length;
    const onTimeCount = entries.filter((log) => {
      const status = statusFor(log, prayer);
      return status === 'onTime' || status === 'jamaat';
    }).length;

    return {
      prayer,
      label: PRAYER_NAME_LABELS[prayer].bn,
      percentage: totalCount ? Math.round((onTimeCount / totalCount) * 100) : 0,
      onTimeCount,
      totalCount,
    };
  });
}

export function buildWeeklyConsistencyData(
  logs: Record<string, DailyPrayerLog>,
  weeks = 8,
  fromDate = new Date()
): WeeklyConsistencyPoint[] {
  return Array.from({ length: weeks }, (_, reverseIndex) => {
    const index = weeks - reverseIndex - 1;
    const weekEnd = new Date(fromDate);
    weekEnd.setDate(fromDate.getDate() - index * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);

    let onTime = 0;
    let completed = 0;
    let total = 0;

    for (let i = 0; i < 7; i += 1) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const log = logs[dateKey(day)];
      PRAYER_NAMES.forEach((name) => {
        const status = statusFor(log, name);
        if (status !== 'pending') total += 1;
        if (status === 'onTime' || status === 'jamaat') onTime += 1;
        if (DONE.includes(status)) completed += 1;
      });
    }

    const denominator = Math.max(total, 1);
    return {
      weekStart: dateKey(weekStart),
      onTimePercent: Math.round((onTime / denominator) * 100),
      completedPercent: Math.round((completed / denominator) * 100),
      totalLogged: total,
    };
  });
}

export function getWeaknessInsights(logs: Record<string, DailyPrayerLog>): WeaknessInsights {
  const totals = new Map<PrayerName, { missed: number; completed: number; total: number }>();

  PRAYER_NAMES.forEach((name) => totals.set(name, { missed: 0, completed: 0, total: 0 }));
  Object.values(logs).forEach((log) => {
    PRAYER_NAMES.forEach((name) => {
      const status = statusFor(log, name);
      const current = totals.get(name)!;
      if (status !== 'pending') current.total += 1;
      if (status === 'missed') current.missed += 1;
      if (DONE.includes(status)) current.completed += 1;
    });
  });

  const rows = Array.from(totals.entries());
  const mostMissed = rows
    .map(([prayer, value]) => ({
      prayer,
      missedCount: value.missed,
      totalCount: value.total,
      missedPercent: value.total ? Math.round((value.missed / value.total) * 100) : 0,
    }))
    .sort((a, b) => b.missedCount - a.missedCount)[0];

  const bestConsistency = rows
    .map(([prayer, value]) => ({
      prayer,
      completedPercent: value.total ? Math.round((value.completed / value.total) * 100) : 0,
    }))
    .sort((a, b) => b.completedPercent - a.completedPercent)[0];

  return {
    mostMissed,
    bestConsistency,
    currentStreak: calculateCurrentStreak(logs),
    totalDaysTracked: Object.keys(logs).length,
  };
}

export function generateWeaknessInsights(
  logs: Record<string, DailyPrayerLog>,
  month = new Date()
): GeneratedWeaknessInsights {
  const totals = new Map<PrayerName, { missed: number; completed: number; total: number }>();
  TRACKED_PRAYERS.forEach((prayer) => totals.set(prayer, { missed: 0, completed: 0, total: 0 }));

  Object.values(logs).forEach((log) => {
    TRACKED_PRAYERS.forEach((prayer) => {
      const status = statusFor(log, prayer);
      const current = totals.get(prayer)!;
      if (status !== 'pending') current.total += 1;
      if (status === 'missed') current.missed += 1;
      if (DONE.includes(status)) current.completed += 1;
    });
  });

  const rows = Array.from(totals.entries());
  const mostMissed = rows
    .filter(([, value]) => value.missed > 0)
    .sort(([, a], [, b]) => b.missed - a.missed)[0]?.[0] ?? null;
  const bestPrayer = rows
    .filter(([, value]) => value.total > 0 && value.completed > 0)
    .sort(([, a], [, b]) => (b.completed / b.total) - (a.completed / a.total))[0]?.[0] ?? null;

  const monthRows = Object.entries(logs).filter(([key]) => {
    const parsed = parseLocalDateKey(key);
    return parsed.getFullYear() === month.getFullYear() && parsed.getMonth() === month.getMonth();
  });
  const totalSlots = monthRows.length * TRACKED_PRAYERS.length;
  const completedSlots = monthRows.reduce(
    (sum, [, log]) => sum + TRACKED_PRAYERS.filter((prayer) => DONE.includes(statusFor(log, prayer))).length,
    0
  );

  return {
    mostMissedPrayer: mostMissed,
    bestPrayer,
    currentStreak: calculateCurrentStreak(logs),
    completionRate: totalSlots ? Math.round((completedSlots / totalSlots) * 100) : 0,
    totalDaysTracked: Object.keys(logs).length,
  };
}
