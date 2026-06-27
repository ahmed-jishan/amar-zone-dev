// ────────────────────────────────────────────────────────────────
// ╔══════════════════════════════════════════════════════════════╗
// ║   Ramadan Mode — Computation Engine                         ║
// ║   Location-aware Iftar/Sehri, Hijri detection, Last-10     ║
// ╚══════════════════════════════════════════════════════════════╝
// ────────────────────────────────────────────────────────────────

import type { PrayerTimesResponse } from '../types/prayer.types';
import type { IftarSehriTimes, FastingStatus } from './types';

/**
 * Parse a time string "HH:MM" to total minutes from midnight
 */
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Get current time in minutes from midnight
 */
function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Compute Iftar & Sehri times from prayer times response
 * Iftar = Maghrib time. Sehri ends = Fajr time.
 * 
 * The engine also provides "remaining" counts for real-time countdown.
 */
export function computeIftarSehriTimes(
  prayerTimes: PrayerTimesResponse | null
): IftarSehriTimes | null {
  if (!prayerTimes) return null;

  const maghribTime = prayerTimes.rawTimings.Maghrib;
  const fajrTime = prayerTimes.rawTimings.Fajr;

  if (!maghribTime || !fajrTime) return null;

  const iftarMinutes = parseTimeToMinutes(maghribTime);
  const sehriEndMinutes = parseTimeToMinutes(fajrTime);
  const now = nowMinutes();

  // Calculate remaining ms
  const iftarRemaining = iftarMinutes > now
    ? (iftarMinutes - now) * 60 * 1000
    : ((iftarMinutes + 1440) - now) * 60 * 1000; // Next day

  const sehriRemaining = sehriEndMinutes > now
    ? (sehriEndMinutes - now) * 60 * 1000
    : 0; // Sehri already passed for today

  const isSehriWindow = now >= sehriEndMinutes - 45 && now < sehriEndMinutes; // 45 min before Fajr
  const isIftarSoon = iftarMinutes > now && (iftarMinutes - now) <= 30; // Within 30 min

  return {
    sehriEnd: fajrTime,
    iftarTime: maghribTime,
    sehriLabel: `সেহরির শেষ ${fajrTime}`,
    iftarLabel: `ইফতার ${maghribTime}`,
    sehriRemaining,
    iftarRemaining,
    isSehriWindow,
    isIftarSoon,
  };
}

/**
 * Detect if we're in the last 10 days of Ramadan
 * Requires that dayOfRamadan was already verified by extractDayFromHijri()
 * which only returns a number when the month is actually Ramadan.
 * 
 * Laylatul Qadr is likely on odd nights of the last 10:
 * 21st, 23rd, 25th, 27th, 29th
 */
export function detectRamadanPosition(
  hijriDate: string | null | undefined,
  dayOfRamadan: number | null
): { isLastTenDays: boolean; isLaylatulQadrLikely: boolean } {
  // dayOfRamadan is null if not in Ramadan (extractDayFromHijri handles this)
  if (dayOfRamadan === null) {
    return { isLastTenDays: false, isLaylatulQadrLikely: false };
  }

  const isLastTenDays = dayOfRamadan >= 21 && dayOfRamadan <= 30;

  // Odd nights of last 10: 21, 23, 25, 27, 29
  const isLaylatulQadrLikely = isLastTenDays && dayOfRamadan % 2 === 1;

  return { isLastTenDays, isLaylatulQadrLikely };
}

/**
 * Extract day of Ramadan from Hijri date string
 * e.g. "27 Ramadan 1445" => 27
 * e.g. "22 Shawwal 1447" => null (not Ramadan)
 * 
 * ONLY returns a number if the Hijri month is actually Ramadan.
 * Non-Ramadan dates return null so the UI never shows fake Ramadan data.
 */
export function extractDayFromHijri(hijriDate: string | null | undefined): number | null {
  if (!hijriDate) return null;
  
  // First check: if the date string doesn't mention Ramadan, return null immediately
  const lower = hijriDate.toLowerCase();
  if (!lower.includes('ramadan') && !lower.includes('রমজান')) {
    return null; // Not in Ramadan — no day number
  }
  
  // Extract day number from "27 Ramadan" or "Ramadan 27" or "৩ রমজান"
  const match = hijriDate.match(/(\d+)\s*(?:Ramadan|রমজান)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  // Also try "Ramadan 27" format
  const reversedMatch = hijriDate.match(/(?:Ramadan|রমজান)\s*(\d+)/i);
  if (reversedMatch) {
    return parseInt(reversedMatch[1], 10);
  }
  
  return null;
}

/**
 * Get the current fasting status display info
 */
export function getFastingDisplayInfo(
  status: FastingStatus,
  language: 'bn' | 'en'
): { label: string; color: string; icon: string } {
  const map: Record<FastingStatus, { bn: string; en: string; color: string; icon: string }> = {
    fasting: { bn: 'রোজা রাখছি', en: 'Fasting', color: '#34d399', icon: '🌙' },
    not_fasting: { bn: 'রোজা রাখিনি', en: 'Not Fasting', color: '#f87171', icon: '❌' },
    qada: { bn: 'কাজা করব', en: 'Qada Later', color: '#fbbf24', icon: '📝' },
    excused: { bn: 'ওজর আছে', en: 'Excused', color: '#9ca3af', icon: '🕊️' },
    unspecified: { bn: 'নির্বাচন করুন', en: 'Select', color: '#6b7280', icon: '❓' },
  };
  const info = map[status];
  return {
    label: language === 'bn' ? info.bn : info.en,
    color: info.color,
    icon: info.icon,
  };
}

/**
 * Calculate the remaining time until Iftar in a human-friendly format
 */
export function formatIftarCountdown(ms: number, language: 'bn' | 'en'): string {
  if (ms <= 0) {
    return language === 'bn' ? 'ইফতার হয়েছে!' : 'Iftar time!';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return language === 'bn'
      ? `${hours} ঘন্টা ${minutes} মিনিট`
      : `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return language === 'bn'
      ? `${minutes} মিনিট ${seconds} সেকেন্ড`
      : `${minutes}m ${seconds}s`;
  }

  return language === 'bn'
    ? `${seconds} সেকেন্ড`
    : `${seconds}s`;
}

/**
 * Get the recommended Taraweeh rakat count based on travel mode
 */
export function getRecommendedTaraweeh(
  isTraveling: boolean,
  language: 'bn' | 'en'
): { rakat: number; label: string; description: string } {
  if (isTraveling) {
    return {
      rakat: 8,
      label: language === 'bn' ? '৮ রাকাত' : '8 Rakat',
      description: language === 'bn'
        ? 'ভ্রমণে তারাবীহ ৮ রাকাত পড়া উত্তম'
        : '8 rakat Taraweeh is recommended while traveling',
    };
  }

  return {
    rakat: 20,
    label: language === 'bn' ? '২০ রাকাত' : '20 Rakat',
    description: language === 'bn'
      ? 'তারাবীহ ২০ রাকাত পড়া উত্তম'
      : '20 rakat Taraweeh is recommended',
  };
}

/**
 * Generate a suggested Quran khatam plan
 * Day 1-30: which juz to read each day
 */
export function generateKhatamPlan(
  currentDay: number | null,
  completedJuz: number[]
): { todayJuz: number | null; remainingDays: number; progressPercent: number } {
  const today = currentDay ?? 1;
  const completed = completedJuz.length;
  const progressPercent = Math.round((completed / 30) * 100);
  const remainingDays = 30 - today;

  // Suggested juz for today (aligned with traditional 30-day plan)
  const todayJuz = completed < today ? today : (today < 30 ? today + 1 : null);

  return { todayJuz, remainingDays, progressPercent };
}