import type { CanonicalPrayerName, PrayerTime } from '../types2/prayer.types';

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
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export async function schedulePrayerReminder(
  prayer: PrayerTime,
  minutesBefore: number
): Promise<ScheduledPrayerNotification | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return null;

  const fireAt = buildFireTime(prayer.time, minutesBefore);
  if (fireAt <= Date.now()) return null;

  const id = `${prayer.name}:${fireAt}`;
  cancelPrayerReminder(id);

  const timer = setTimeout(() => {
    new Notification(`${prayer.label} prayer reminder`, {
      body: minutesBefore > 0 ? `${minutesBefore} minutes remaining` : 'Prayer time has started',
      tag: id,
    });
    timers.delete(id);
  }, fireAt - Date.now());

  timers.set(id, timer);
  return { id, prayer: prayer.name, fireAt };
}

export function cancelPrayerReminder(id: string): void {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
}

export function cancelAllPrayerReminders(): void {
  timers.forEach((timer) => clearTimeout(timer));
  timers.clear();
}
