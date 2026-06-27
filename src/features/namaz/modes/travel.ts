// ────────────────────────────────────────────────────────────────
// ╔══════════════════════════════════════════════════════════════╗
// ║   Travel Mode — Computation Engine                         ║
// ║   Qasr/Jam'a logic, timezone adaptation, location context  ║
// ╚══════════════════════════════════════════════════════════════╝
// ────────────────────────────────────────────────────────────────

import type { PrayerTimes } from '../types/prayer.types';
import type { PrayerCombination, QasrStatus } from './types';

/**
 * Determine prayer combination strategy based on travel mode.
 * 
 * Islamic ruling for travel (Safar):
 * - Dhuhr (4) → Qasr (2)
 * - Asr (4) → Qasr (2)  
 * - Combine Dhuhr + Asr at either time (Jam'a Taqdim or Ta'khir)
 * - Maghrib (3) stays as 3 (no qasr for maghrib)
 * - Isha (4) → Qasr (2)
 * - Combine Maghrib + Isha at either time
 * - Fajr stays as 2 (no qasr)
 */
export function computeTravelPrayerAdjustments(
  isTravelMode: boolean,
  userPreference?: PrayerCombination
): {
  combination: PrayerCombination;
  qasrPrayers: string[];
  showCombined: boolean;
} {
  if (!isTravelMode) {
    return { combination: 'none', qasrPrayers: [], showCombined: false };
  }

  // In travel mode, all 4-rakat prayers become Qasr (2 rakat)
  const qasrPrayers = ['dhuhr', 'asr', 'isha'];

  // User can choose combination preference, default to both combined
  const combination = userPreference ?? 'dhuhr_asr';

  // Show combined prayer cards
  const showCombined = combination !== 'none';

  return { combination, qasrPrayers, showCombined };
}

/**
 * Get the display label for a combined prayer pair
 */
export function getCombinationLabel(
  combination: PrayerCombination,
  language: 'bn' | 'en'
): string {
  const labels: Record<PrayerCombination, { bn: string; en: string }> = {
    none: { bn: '', en: '' },
    dhuhr_asr: {
      bn: 'যোহর + আসর (জমা ও কসর)',
      en: 'Dhuhr + Asr (Jam\'a & Qasr)',
    },
    maghrib_isha: {
      bn: 'মাগরিব + ইশা (জমা ও কসর)',
      en: 'Maghrib + Isha (Jam\'a & Qasr)',
    },
  };
  return labels[combination][language];
}

/**
 * Combine two prayer times into one display block
 */
export function combinePrayerTimes(
  timings: PrayerTimes,
  combination: PrayerCombination
): {
  pairs: Array<{
    label: string;
    firstPrayer: string;
    firstTime: string;
    secondPrayer: string;
    secondTime: string;
  }>;
} {
  const pairs: Array<{
    label: string;
    firstPrayer: string;
    firstTime: string;
    secondPrayer: string;
    secondTime: string;
  }> = [];

  if (combination === 'dhuhr_asr' || combination === 'none') {
    pairs.push({
      label: 'Dhuhr + Asr',
      firstPrayer: 'Dhuhr',
      firstTime: timings.Dhuhr,
      secondPrayer: 'Asr',
      secondTime: timings.Asr,
    });
  }

  if (combination === 'maghrib_isha' || combination === 'none') {
    pairs.push({
      label: 'Maghrib + Isha',
      firstPrayer: 'Maghrib',
      firstTime: timings.Maghrib,
      secondPrayer: 'Isha',
      secondTime: timings.Isha,
    });
  }

  return { pairs };
}

/**
 * Get Qasr status display info
 */
export function getQasrDisplayInfo(
  prayerName: string,
  qasrPrayers: string[]
): {
  isQasr: boolean;
  label: string;
  badgeClass: string;
} {
  const isQasr = qasrPrayers.includes(prayerName.toLowerCase());
  return {
    isQasr,
    label: isQasr ? 'কসর ২ রাকাত' : 'পূর্ণ',
    badgeClass: isQasr ? 'travel-badge--qasr' : 'travel-badge--full',
  };
}

/**
 * Adjust date for timezone — ensure prayer times match local time
 * Returns the offset-adjusted date
 */
export function adjustForTimezone(
  date: Date,
  currentTimezone: string,
  targetTimezone: string
): Date {
  if (currentTimezone === targetTimezone) return date;

  // Get offset difference in hours (simplified)
  const currentOffset = getTimezoneOffsetHours(currentTimezone);
  const targetOffset = getTimezoneOffsetHours(targetTimezone);
  const diffHours = targetOffset - currentOffset;

  const adjusted = new Date(date);
  adjusted.setHours(adjusted.getHours() + diffHours);
  return adjusted;
}

/**
 * Get timezone offset in hours from UTC
 * Handles common timezone formats
 */
function getTimezoneOffsetHours(timezone: string): number {
  const offsetMap: Record<string, number> = {
    'Asia/Dhaka': 6,
    'Asia/Kolkata': 5.5,
    'Asia/Karachi': 5,
    'Asia/Riyadh': 3,
    'Asia/Dubai': 4,
    'Asia/Doha': 3,
    'Asia/Kabul': 4.5,
    'Asia/Tehran': 3.5,
    'Asia/Bangkok': 7,
    'Asia/Singapore': 8,
    'Asia/Kuala_Lumpur': 8,
    'Asia/Jakarta': 7,
    'Europe/London': 1,
    'Europe/Berlin': 2,
    'America/New_York': -5,
    'America/Chicago': -6,
    'America/Denver': -7,
    'America/Los_Angeles': -8,
    'America/Toronto': -5,
    'Australia/Sydney': 11,
    'Australia/Melbourne': 11,
    'Africa/Cairo': 2,
    'Africa/Johannesburg': 2,
    'Africa/Lagos': 1,
    'UTC': 0,
  };

  return offsetMap[timezone] ?? 0;
}

/**
 * Get the distance threshold for considering prayer time adjustments
 * If traveling beyond ~48 miles (77km), Qasr applies
 */
export function isQasrDistance(
  startLat: number,
  startLng: number,
  currentLat: number,
  currentLng: number
): boolean {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(currentLat - startLat);
  const dLng = toRad(currentLng - startLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(startLat)) *
      Math.cos(toRad(currentLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Qasr applies when distance > ~77 km (48 miles)
  return distance > 77;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Get prayer-specific travel adjustment text
 */
export function getTravelPrayerNote(
  prayerName: string,
  qasrPrayers: string[],
  language: 'bn' | 'en'
): string | null {
  const lower = prayerName.toLowerCase();

  if (qasrPrayers.includes(lower)) {
    return language === 'bn'
      ? 'কসর (২ রাকাত)'
      : 'Qasr (2 rakat)';
  }

  // Fajr and Maghrib remain full
  if (lower === 'fajr') {
    return language === 'bn'
      ? 'ফজর ২ রাকাত (পূর্ণ)'
      : 'Fajr 2 rakat (full)';
  }
  if (lower === 'maghrib') {
    return language === 'bn'
      ? 'মাগরিব ৩ রাকাত (পূর্ণ)'
      : 'Maghrib 3 rakat (full)';
  }

  return null;
}

/**
 * Generate a location label for prayer log context
 */
export function getLocationContextLabel(
  city?: string,
  country?: string,
  language?: 'bn' | 'en'
): string {
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;
  return language === 'bn' ? 'অজানা অবস্থান' : 'Unknown location';
}

/**
 * Calculate remaining travel mode time indicators
 */
export function getTravelTimeInfo(prayerTimes: PrayerTimes): {
  asrToMaghrib: number;  // ms between Asr and Maghrib (combined window)
  maghribToIsha: number; // ms between Maghrib and Isha (combined window)
  isCombinedWindow: boolean;
} {
  const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const asrMins = parseTime(prayerTimes.Asr);
  const maghribMins = parseTime(prayerTimes.Maghrib);
  const ishaMins = parseTime(prayerTimes.Isha);
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const asrToMaghrib = Math.max(0, (maghribMins - asrMins) * 60 * 1000);
  const maghribToIsha = Math.max(0, (ishaMins - maghribMins) * 60 * 1000);

  const isCombinedWindow =
    (nowMins >= asrMins && nowMins <= maghribMins + 30) ||
    (nowMins >= maghribMins && nowMins <= ishaMins + 30);

  return { asrToMaghrib, maghribToIsha, isCombinedWindow };
}