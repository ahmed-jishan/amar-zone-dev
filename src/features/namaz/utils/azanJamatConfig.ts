import { formatPrayerTime12h } from './prayerSchedule';
import { DEFAULT_PRAYER_TIME_PREFERENCES } from '../store/prefsStore';
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
  if (!value || typeof value !== 'string') return 0;
  const parts = value.split(':');
  if (parts.length < 2) return 0;
  const [rawHours, rawMinutes] = parts.map(Number);
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

function withSafePreference(startTime: string, preference?: PrayerTimePreference): PrayerTimePreference {
  const fallback = DEFAULT_PRAYER_TIME_PREFERENCES.fajr;
  return {
    azanMode: preference?.azanMode === 'fixed' || preference?.azanMode === 'offset' ? preference.azanMode : fallback.azanMode,
    azanOffsetMinutes: Number.isFinite(preference?.azanOffsetMinutes) ? Number(preference?.azanOffsetMinutes) : 0,
    azanFixedTime: preference?.azanFixedTime || startTime,
    jamatMode: preference?.jamatMode === 'fixed' || preference?.jamatMode === 'offset' ? preference.jamatMode : fallback.jamatMode,
    jamatOffsetMinutes: Number.isFinite(preference?.jamatOffsetMinutes) ? Number(preference?.jamatOffsetMinutes) : fallback.jamatOffsetMinutes,
    jamatFixedTime: preference?.jamatFixedTime || fallback.jamatFixedTime,
  };
}

export function computePrayerTimeConfig(startTime: string, preference?: PrayerTimePreference): ComputedPrayerTimeConfig {
  try {
    const safePreference = withSafePreference(startTime, preference);
    const startMinutes = parseTimeToMinutes(startTime);
    const azanMinutes = safePreference.azanMode === 'fixed'
      ? parseTimeToMinutes(safePreference.azanFixedTime)
      : startMinutes + safePreference.azanOffsetMinutes;
    const jamatMinutes = safePreference.jamatMode === 'fixed'
      ? parseTimeToMinutes(safePreference.jamatFixedTime)
      : azanMinutes + safePreference.jamatOffsetMinutes;

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
  } catch (error) {
    console.warn('computePrayerTimeConfig error:', error);
    const fallback = minutesToTime(parseTimeToMinutes(startTime));
    return {
      prayerStart: fallback,
      azanTime: fallback,
      jamatTime: fallback,
      prayerStartDisplay: formatPrayerTime12h(fallback, { padHour: true }),
      azanDisplay: formatPrayerTime12h(fallback, { padHour: true }),
      jamatDisplay: formatPrayerTime12h(fallback, { padHour: true }),
      errors: ['Invalid configuration. Using prayer start time as fallback.'],
    };
  }
}

export function getConfiguredAzanTime(
  prayer: ConfigurablePrayerName,
  startTime: string,
  preferences: PrayerTimePreferences
): string {
  return computePrayerTimeConfig(startTime, preferences[prayer]).azanTime;
}
