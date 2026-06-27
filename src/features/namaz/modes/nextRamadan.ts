// ────────────────────────────────────────────────────────────────
// ╔══════════════════════════════════════════════════════════════╗
// ║   Next Ramadan — Astronomical Date Calculator              ║
// ║   Computes next Ramadan start date, days remaining,        ║
// ║   and season detection (before/during/after)               ║
// ╚══════════════════════════════════════════════════════════════╝
// ────────────────────────────────────────────────────────────────

const RAMADAN_DATES: Array<{ gregorian: Date; hijriYear: number }> = [
  { gregorian: new Date(2027, 1, 7), hijriYear: 1448 },
  { gregorian: new Date(2028, 0, 27), hijriYear: 1449 },
  { gregorian: new Date(2029, 0, 15), hijriYear: 1450 },
  { gregorian: new Date(2030, 1, 4), hijriYear: 1451 },
  { gregorian: new Date(2031, 0, 24), hijriYear: 1452 },
  { gregorian: new Date(2032, 0, 13), hijriYear: 1453 },
  { gregorian: new Date(2033, 0, 2), hijriYear: 1454 },
  { gregorian: new Date(2033, 11, 22), hijriYear: 1455 },
];

const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export type RamadanSeason = 'far' | 'approaching' | 'active' | 'just_passed';

export interface NextRamadanInfo {
  nextRamadanDate: Date;
  nextHijriYear: number;
  daysUntilRamadan: number;
  weeksUntilRamadan: number;
  monthsUntilRamadan: number;
  isCurrentlyRamadan: boolean;
  currentRamadanDay: number | null;
  season: RamadanSeason;
  seasonLabel: string;
  progressPercent: number;
  lastRamadanDate: Date | null;
  lastHijriYear: number | null;
}

function formatDateBn(d: Date): string {
  return `${d.getDate()} ${BN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateEn(d: Date): string {
  return `${EN_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Get the next upcoming Ramadan start date and all related info
 */
export function getNextRamadan(now: Date = new Date()): NextRamadanInfo {
  let nextRamadan: Date | null = null;
  let nextHijriYear = 1448;

  for (const r of RAMADAN_DATES) {
    if (r.gregorian > now) {
      nextRamadan = r.gregorian;
      nextHijriYear = r.hijriYear;
      break;
    }
  }

  if (!nextRamadan) {
    const lastKnown = RAMADAN_DATES[RAMADAN_DATES.length - 1];
    const yearsSince = now.getFullYear() - lastKnown.gregorian.getFullYear();
    nextRamadan = new Date(lastKnown.gregorian);
    nextRamadan.setFullYear(nextRamadan.getFullYear() + yearsSince);
    nextRamadan.setDate(nextRamadan.getDate() - 11 * yearsSince);
    while (nextRamadan <= now) {
      nextRamadan.setFullYear(nextRamadan.getFullYear() + 1);
      nextRamadan.setDate(nextRamadan.getDate() - 11);
    }
    nextHijriYear = lastKnown.hijriYear + yearsSince + 1;
  }

  let lastRamadan: Date | null = null;
  let lastHijriYear: number | null = null;
  for (const r of [...RAMADAN_DATES].reverse()) {
    if (r.gregorian <= now) {
      lastRamadan = r.gregorian;
      lastHijriYear = r.hijriYear;
      break;
    }
  }

  const diffMs = nextRamadan.getTime() - now.getTime();
  const daysUntilRamadan = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const weeksUntilRamadan = Math.floor(daysUntilRamadan / 7);
  const monthDiff = (nextRamadan.getFullYear() - now.getFullYear()) * 12 +
    (nextRamadan.getMonth() - now.getMonth());
  const monthsUntilRamadan = Math.max(1, monthDiff);

  let season: RamadanSeason;
  if (daysUntilRamadan > 180) season = 'far';
  else if (daysUntilRamadan > 60) season = 'approaching';
  else if (daysUntilRamadan > 0) season = 'approaching';
  else if (daysUntilRamadan > -10) season = 'just_passed';
  else season = 'far';

  let progressPercent = 0;
  if (lastRamadan && nextRamadan) {
    const totalDuration = nextRamadan.getTime() - lastRamadan.getTime();
    const elapsed = now.getTime() - lastRamadan.getTime();
    progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
  }

  return {
    nextRamadanDate: nextRamadan,
    nextHijriYear,
    daysUntilRamadan,
    weeksUntilRamadan,
    monthsUntilRamadan,
    isCurrentlyRamadan: false,
    currentRamadanDay: null,
    season,
    seasonLabel: getSeasonLabel(season),
    progressPercent,
    lastRamadanDate: lastRamadan,
    lastHijriYear,
  };
}

/**
 * Format the next Ramadan date for display
 */
export function formatNextRamadanDate(info: NextRamadanInfo, language: 'bn' | 'en'): string {
  const { nextRamadanDate, nextHijriYear } = info;
  const dateStr = language === 'bn' ? formatDateBn(nextRamadanDate) : formatDateEn(nextRamadanDate);
  const hijriLabel = language === 'bn' ? `${nextHijriYear} হি.` : `${nextHijriYear} AH`;
  return `${dateStr} (${hijriLabel})`;
}

/**
 * Format the LAST Ramadan date for use as progress bar label
 */
export function formatLastRamadanDate(info: NextRamadanInfo, language: 'bn' | 'en'): string {
  if (!info.lastRamadanDate || !info.lastHijriYear) return '';
  const dateStr = language === 'bn' ? formatDateBn(info.lastRamadanDate) : formatDateEn(info.lastRamadanDate);
  const hijriLabel = language === 'bn' ? `${info.lastHijriYear} হি.` : `${info.lastHijriYear} AH`;
  return `${hijriLabel}`;
}

/**
 * Format NEXT Ramadan date for progress bar label (short: just year)
 */
export function formatNextRamadanShort(info: NextRamadanInfo, language: 'bn' | 'en'): string {
  const label = language === 'bn' ? `${info.nextHijriYear} হি.` : `${info.nextHijriYear} AH`;
  return label;
}

/**
 * Format days remaining — big number display (simple)
 * e.g. "225 দিন" or "7 মাস 15 দিন"
 */
export function formatDaysString(days: number, language: 'bn' | 'en'): string {
  if (days <= 0) return language === 'bn' ? '০ দিন' : '0 days';
  if (language === 'bn') {
    if (days < 30) return `${days} দিন`;
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) return `${months} মাস`;
    return `${months} মাস ${remainingDays} দিন`;
  } else {
    if (days < 30) return `${days} days`;
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) return `${months} months`;
    return `${months}m ${remainingDays}d`;
  }
}

/**
 * Format full countdown text for display
 * e.g. "225 days remaining" or "7 months 15 days remaining"
 */
export function formatDaysUntilRamadan(days: number, language: 'bn' | 'en'): string {
  if (days <= 0) return language === 'bn' ? 'রমজান শুরু!' : 'Ramadan started!';
  const base = formatDaysString(days, language);
  if (language === 'bn') return `${base} বাকি`;
  return `${base} remaining`;
}

function getSeasonLabel(season: RamadanSeason): string {
  const labels: Record<RamadanSeason, { bn: string; en: string }> = {
    far: { bn: 'রমজান এখনো অনেক দূরে', en: 'Ramadan is far ahead' },
    approaching: { bn: 'রমজান আসছে — প্রস্তুতি নিন', en: 'Ramadan is coming — prepare' },
    active: { bn: 'রমজান মোবারক!', en: 'Ramadan Mubarak!' },
    just_passed: { bn: 'রমজান শেষ — ঈদ মোবারক!', en: 'Ramadan ended — Eid Mubarak!' },
  };
  return labels[season].bn;
}

/**
 * Check if a Hijri date string indicates Ramadan month
 */
export function isHijriDateRamadan(hijriDate?: string | null): boolean {
  if (!hijriDate) return false;
  const lower = hijriDate.toLowerCase();
  return lower.includes('ramadan') || lower.includes('রমজান');
}