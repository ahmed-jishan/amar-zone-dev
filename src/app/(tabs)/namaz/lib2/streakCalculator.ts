import { PRAYER_NAMES, PRAYER_NAME_LABELS, normalizePrayerName } from '../constants/prayerNames';
import type { DailyPrayerLog, PrayerName } from '../types2/prayer.types';
import { formatLocalDateKey, parseLocalDateKey } from './dateHelpers';

const COMPLETE_STATUSES = new Set(['onTime', 'jamaat', 'late']);

function formatDate(date: Date): string {
  return formatLocalDateKey(date);
}

function isCompletedDay(log?: DailyPrayerLog): boolean {
  if (!log) return false;
  return PRAYER_NAMES.every((name) => {
    const canonical = normalizePrayerName(name) as PrayerName;
    const legacy = PRAYER_NAME_LABELS[canonical]?.en as PrayerName;
    const entry = log[name as PrayerName] ?? log[canonical] ?? log[legacy];
    return entry ? COMPLETE_STATUSES.has(entry.status) : false;
  });
}

export function calculateCurrentStreak(logs: Record<string, DailyPrayerLog>, fromDate = new Date()): number {
  let streak = 0;
  const cursor = new Date(fromDate);

  while (true) {
    const key = formatDate(cursor);
    if (!isCompletedDay(logs[key])) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function calculateStreak(logs: Record<string, DailyPrayerLog>): { current: number; best: number } {
  const dates = Object.keys(logs).sort();
  let best = 0;
  let running = 0;
  let previous: Date | null = null;

  dates.forEach((dateKey) => {
    const currentDate = parseLocalDateKey(dateKey);
    const consecutive = previous
      ? (currentDate.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24) === 1
      : true;

    running = isCompletedDay(logs[dateKey]) ? (consecutive ? running + 1 : 1) : 0;
    best = Math.max(best, running);
    previous = currentDate;
  });

  return { current: calculateCurrentStreak(logs), best };
}
