import { formatPrayerTime12h } from './prayerSchedule';
import type { ConfigurablePrayerName, PrayerTimePreference, PrayerTimePreferences } from '../store/prefsStore';

export const CONFIGURABLE_PRAYERS: ConfigurablePrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_CONFIG_LABELS: Record<ConfigurablePrayerName, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export interface ComputedPrayerTimeConfig {
  prayerStart: string;
  azanTime: string;
  jamatTime: string;
  azanDisplay: string;
  jamatDisplay: string;
  prayerStartDisplay: string;
  errors: string[];
}

function parseTimeToMinutes(value: string): number {
  const [rawHours, rawMinutes] = value.split(':').map(Number);
  const hours = Number.isFinite(rawHours) ? rawHours : 0;
  const minutes = Number.isFinite(rawMinutes) ? rawMinutes : 0;
  return Math.max(0, Math.min(23, hours)) * 60 + Math.max(0, Math.min(59, minutes));
}

function minutesToTime(value: number): string {
  const bounded = Math.max(0, Math.min(1439, value));
  const hours = Math.floor(bounded / 60);
  const minutes = bounded % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function computePrayerTimeConfig(startTime: string, preference: PrayerTimePreference): ComputedPrayerTimeConfig {
  const startMinutes = parseTimeToMinutes(startTime);
  const azanMinutes = preference.azanMode === 'fixed'
    ? parseTimeToMinutes(preference.azanFixedTime)
    : startMinutes + preference.azanOffsetMinutes;
  const jamatMinutes = preference.jamatMode === 'fixed'
    ? parseTimeToMinutes(preference.jamatFixedTime)
    : azanMinutes + preference.jamatOffsetMinutes;

  const errors: string[] = [];
  if (azanMinutes < startMinutes) errors.push('Azan time cannot be earlier than prayer start time.');
  if (jamatMinutes < azanMinutes) errors.push('Jamat time cannot be earlier than Azan time.');
  if (jamatMinutes < startMinutes) errors.push('Jamat time must be after prayer start time.');

  const azanTime = minutesToTime(azanMinutes);
  const jamatTime = minutesToTime(jamatMinutes);

  return {
    prayerStart: minutesToTime(startMinutes),
    azanTime,
    jamatTime,
    prayerStartDisplay: formatPrayerTime12h(minutesToTime(startMinutes), { padHour: true }),
    azanDisplay: formatPrayerTime12h(azanTime, { padHour: true }),
    jamatDisplay: formatPrayerTime12h(jamatTime, { padHour: true }),
    errors,
  };
}

export function getConfiguredAzanTime(
  prayer: ConfigurablePrayerName,
  startTime: string,
  preferences: PrayerTimePreferences
): string {
  return computePrayerTimeConfig(startTime, preferences[prayer]).azanTime;
}
