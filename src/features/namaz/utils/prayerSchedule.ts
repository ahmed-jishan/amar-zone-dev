import type { PrayerTimesResponse } from '../types/prayer.types';

export const AZAN_PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export type AzanPrayerName = (typeof AZAN_PRAYER_ORDER)[number];
export type PrayerWindowStatus = 'before' | 'active' | 'ended';

export interface PrayerWindow {
  prayer: AzanPrayerName;
  label: string;
  start: Date;
  end: Date;
  startTime: string;
  endTime: string;
  displayStart: string;
  displayEnd: string;
  status: PrayerWindowStatus;
  remainingSeconds: number;
  isCurrent: boolean;
  isNext: boolean;
  endsTomorrow: boolean;
}

const DEFAULT_TIME_ZONE = 'Asia/Dhaka';

function getTimeZoneParts(date: Date, timeZone = DEFAULT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone = DEFAULT_TIME_ZONE): number {
  const parts = getTimeZoneParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
}

function zonedWallTimeToDate(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timeZone = DEFAULT_TIME_ZONE
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const firstPass = new Date(utcGuess - getTimeZoneOffsetMs(new Date(utcGuess), timeZone));
  return new Date(utcGuess - getTimeZoneOffsetMs(firstPass, timeZone));
}

export function buildPrayerDate(time: string, baseDate: Date = new Date(), timeZone = DEFAULT_TIME_ZONE): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const parts = getTimeZoneParts(baseDate, timeZone);
  return zonedWallTimeToDate(parts.year, parts.month, parts.day, hours || 0, minutes || 0, timeZone);
}

export function getNextAzan(prayerTimes?: PrayerTimesResponse | null, now: Date = new Date()) {
  if (!prayerTimes) return null;
  const timeZone = prayerTimes.timezone || DEFAULT_TIME_ZONE;

  for (const prayer of AZAN_PRAYER_ORDER) {
    const entry = prayerTimes.timings[prayer];
    const target = buildPrayerDate(entry.time, now, timeZone);
    if (target.getTime() > now.getTime()) {
      return { prayer, label: entry.label, time: entry.time, displayTime: formatPrayerTime12h(entry.time), target };
    }
  }

  const fajr = prayerTimes.timings.fajr;
  const target = buildPrayerDate(fajr.time, now, timeZone);
  target.setUTCDate(target.getUTCDate() + 1);
  return { prayer: 'fajr' as const, label: fajr.label, time: fajr.time, displayTime: formatPrayerTime12h(fajr.time), target };
}

export function buildPrayerWindows(prayerTimes?: PrayerTimesResponse | null, now: Date = new Date()): PrayerWindow[] {
  if (!prayerTimes) return [];

  const timeZone = prayerTimes.timezone || DEFAULT_TIME_ZONE;
  const starts = AZAN_PRAYER_ORDER.map((prayer) => ({
    prayer,
    label: prayerTimes.timings[prayer].label,
    time: prayerTimes.timings[prayer].time,
    date: buildPrayerDate(prayerTimes.timings[prayer].time, now, timeZone),
  }));

  if (starts[starts.length - 1].date.getTime() <= starts[0].date.getTime()) {
    starts[starts.length - 1].date.setUTCDate(starts[starts.length - 1].date.getUTCDate() - 1);
  }

  const nowMs = now.getTime();
  return starts.map((entry, index) => {
    let end: Date;
    let endTime: string;
    let endsTomorrow = false;

    if (entry.prayer === 'fajr' && prayerTimes.rawTimings.Sunrise) {
      end = buildPrayerDate(prayerTimes.rawTimings.Sunrise, now, timeZone);
      endTime = prayerTimes.rawTimings.Sunrise;
    } else {
      const next = starts[index + 1] ?? starts[0];
      end = new Date(next.date);
      endTime = next.time;
      if (index === starts.length - 1) {
        end.setUTCDate(end.getUTCDate() + 1);
        endsTomorrow = true;
      }
    }

    if (end.getTime() <= entry.date.getTime()) {
      end.setUTCDate(end.getUTCDate() + 1);
      endsTomorrow = true;
    }

    const isCurrent = nowMs >= entry.date.getTime() && nowMs < end.getTime();
    const isNext = entry.date.getTime() > nowMs && !starts.some((candidate) => {
      if (candidate.date.getTime() <= nowMs) return false;
      return candidate.date.getTime() < entry.date.getTime();
    });

    return {
      prayer: entry.prayer,
      label: entry.label,
      start: entry.date,
      end,
      startTime: entry.time,
      endTime,
      displayStart: formatPrayerTime12h(entry.time),
      displayEnd: formatPrayerTime12h(endTime),
      status: isCurrent ? 'active' : entry.date.getTime() > nowMs ? 'before' : 'ended',
      remainingSeconds: Math.max(0, Math.floor(((isCurrent ? end : entry.date).getTime() - nowMs) / 1000)),
      isCurrent,
      isNext,
      endsTomorrow,
    };
  });
}

export function getCurrentOrNextPrayer(prayerTimes?: PrayerTimesResponse | null, now: Date = new Date()): PrayerWindow | null {
  const windows = buildPrayerWindows(prayerTimes, now);
  const current = windows.find((window) => window.isCurrent);
  if (current) return current;
  const next = windows.find((window) => window.start.getTime() > now.getTime());
  if (next) return { ...next, isNext: true };
  const fajr = windows[0];
  if (!fajr) return null;
  const tomorrowStart = new Date(fajr.start);
  const tomorrowEnd = new Date(fajr.end);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
  tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 1);
  return {
    ...fajr,
    start: tomorrowStart,
    end: tomorrowEnd,
    status: 'before',
    remainingSeconds: Math.max(0, Math.floor((tomorrowStart.getTime() - now.getTime()) / 1000)),
    isCurrent: false,
    isNext: true,
  };
}

export function formatRemaining(target?: Date | null, now: Date = new Date()): string {
  if (!target) return '--:--';
  const totalSeconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

interface PrayerTimeFormatOptions {
  banglaDigits?: boolean;
  padHour?: boolean;
}

function toBanglaDigits(value: string): string {
  const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return value.replace(/\d/g, (digit) => digits[Number(digit)] ?? digit);
}

export function formatPrayerTime12h(time: string, options: PrayerTimeFormatOptions = {}): string {
  const [rawHours, rawMinutes] = time.split(':').map(Number);
  const hours = Number.isFinite(rawHours) ? rawHours : 0;
  const minutes = Number.isFinite(rawMinutes) ? rawMinutes : 0;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const hourText = options.padHour ? String(displayHours).padStart(2, '0') : String(displayHours);
  const value = `${hourText}:${String(minutes).padStart(2, '0')} ${period}`;
  return options.banglaDigits ? toBanglaDigits(value) : value;
}
