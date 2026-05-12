// lib2/streakCalculator.ts
import { DailyPrayerLog } from '../types2/prayer.types';
import { PRAYER_NAMES } from '../constants/prayerNames';

function isDayComplete(log: DailyPrayerLog): boolean {
  return PRAYER_NAMES.every(prayer => {
    const status = log[prayer as keyof DailyPrayerLog]?.status;
    return status && status !== 'pending' && status !== 'missed';
  });
}

export function calculateStreak(logs: Record<string, DailyPrayerLog>): { current: number; best: number } {
  const dates = Object.keys(logs).sort();
  let streak = 0;
  let best = 0;
  let current = 0;

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    if (isDayComplete(logs[date])) {
      streak++;
      if (streak > best) best = streak;
      const nextDate = dates[i + 1];
      if (nextDate) {
        const diffDays = (new Date(nextDate).getTime() - new Date(date).getTime()) / (1000 * 3600 * 24);
        if (diffDays !== 1) streak = 0;
      }
    } else {
      streak = 0;
    }
  }
  const today = new Date().toISOString().split('T')[0];
  if (logs[today] && isDayComplete(logs[today])) current = streak;
  else current = 0;

  return { current, best };
}