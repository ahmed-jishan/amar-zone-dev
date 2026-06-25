import type { CanonicalPrayerName, PrayerTime } from '../types/prayer.types';
import {
  cancelAllAppNotifications,
  cancelAppNotification,
  isNativeNotificationPlatform,
  requestAppNotificationPermission,
  scheduleAppNotification,
} from '@/lib/native/notifications';

export interface ScheduledPrayerNotification {
  id: string;
  prayer: CanonicalPrayerName;
  fireAt: number;
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

function buildFireTime(time: string, minutesBefore: number): number {
  const [hours, minutes] = time.split(':').map(Number);
  const target = new Date();
  target.setHours(hours, minutes - minutesBefore, 0, 0);
  return target.getTime();
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return requestAppNotificationPermission();
}

export async function schedulePrayerReminder(
  prayer: PrayerTime,
  minutesBefore: number
): Promise<ScheduledPrayerNotification | null> {
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return null;

  const fireAt = buildFireTime(prayer.time, minutesBefore);
  if (fireAt <= Date.now()) return null;

  const id = `${prayer.name}:${fireAt}`;
  cancelPrayerReminder(id);

  const scheduled = await scheduleAppNotification({
    title: `${prayer.label} prayer reminder`,
    body: minutesBefore > 0 ? `${minutesBefore} minutes remaining` : 'Prayer time has started',
    tag: id,
    at: new Date(fireAt),
    category: 'prayer',
  });

  if (!scheduled) return null;

  if (!isNativeNotificationPlatform() && typeof window !== 'undefined' && 'Notification' in window) {
    const timer = setTimeout(() => {
      new Notification(`${prayer.label} prayer reminder`, {
      body: minutesBefore > 0 ? `${minutesBefore} minutes remaining` : 'Prayer time has started',
      tag: id,
      });
      timers.delete(id);
    }, fireAt - Date.now());

    timers.set(id, timer);
  }

  return { id, prayer: prayer.name, fireAt };
}

export function cancelPrayerReminder(id: string): void {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  void cancelAppNotification(id);
}

export function cancelAllPrayerReminders(): void {
  timers.forEach((timer) => clearTimeout(timer));
  timers.clear();
  void cancelAllAppNotifications();
}
