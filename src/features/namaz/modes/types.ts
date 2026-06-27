// ────────────────────────────────────────────────────────────────
// ╔══════════════════════════════════════════════════════════════╗
// ║   Mode Intelligence — Type System                           ║
// ║   Apple/Google-grade mode engine for Ramadan & Travel       ║
// ╚══════════════════════════════════════════════════════════════╝
// ────────────────────────────────────────────────────────────────

import type { PrayerLocation } from '../types/prayer.types';

/** The two primary special modes */
export type SpecialMode = 'ramadanMode' | 'travelMode';

/** Represents which special modes are currently active */
export interface ActiveModeState {
  ramadanMode: boolean;
  travelMode: boolean;
}

/** Fasting status for Ramadan tracking */
export type FastingStatus = 'fasting' | 'not_fasting' | 'qada' | 'excused' | 'unspecified';

/** Taraweeh status for Ramadan tracking */
export type TaraweehStatus = 'completed' | 'partial' | 'missed' | 'not_applicable';

/** Qasr (shortened prayer) status for travel */
export type QasrStatus = 'full' | 'qasr' | 'jama_qasr';

/** Which prayers are combined in travel mode */
export type PrayerCombination =
  | 'none'
  | 'dhuhr_asr'      // Dhuhr + Asr combined
  | 'maghrib_isha';   // Maghrib + Isha combined

/** A marker for Iftar/Sehri time */
export interface IftarSehriTimes {
  sehriEnd: string;       // Last time for Sehri (Fajr start)
  iftarTime: string;      // Iftar time (Maghrib)
  sehriLabel: string;     // Formatted label
  iftarLabel: string;     // Formatted label
  sehriRemaining: number; // ms remaining until Sehri ends
  iftarRemaining: number; // ms remaining until Iftar
  isSehriWindow: boolean; // Is currently Sehri time?
  isIftarSoon: boolean;   // Within 30 min of Iftar?
}

/** Complete computed effects of the active modes */
export interface ModeEffects {
  /** Which modes are active */
  activeModes: ActiveModeState;

  /** Prayer time adjustments */
  prayerAdjustments: {
    /** In travel mode, which prayers to combine */
    combination: PrayerCombination;
    /** In travel mode, which prayers are Qasr (shortened) */
    qasrPrayers: string[];
    /** Display grouping: whether prayers are shown combined */
    showCombined: boolean;
  };

  /** Ramadan-specific data */
  ramadanData: {
    iftarSehri: IftarSehriTimes | null;
    hijriDate: string | null;
    isLastTenDays: boolean;       // Last 10 days of Ramadan
    isLaylatulQadrLikely: boolean; // Odd night in last 10
    dayOfRamadan: number | null;   // Current fasting day (1-30)
    totalRamadanDays: number;      // 30
    /** Next Ramadan date info (for countdown display) */
    nextRamadanDate: string | null;     // Formatted date string
    daysUntilRamadan: number | null;    // Days until next Ramadan
    ramadanSeason: 'far' | 'approaching' | 'active' | 'just_passed' | null;
    nextHijriYear: number | null;       // e.g. 1448
    /** Auto-detected from API Hijri date (not user toggle) */
    autoDetected: boolean;
  };

  /** Fasting tracking state */
  fastingState: {
    todayStatus: FastingStatus;
    streakDays: number;
    totalFasted: number;
    missedQada: number;
  };

  /** UI/UX effects */
  uiEffects: {
    simplifiedView: boolean;          // Travel: simplified
    enableRamadanTheme: boolean;      // Ramadan: special theme
    showIftarCountdown: boolean;      // Ramadan: show iftar
    showSehriAlert: boolean;          // Ramadan: show sehri alert
    showTaraweehTracker: boolean;     // Ramadan: show taraweeh
    showFastingTracker: boolean;      // Ramadan: show fasting
    showQuranKhatamPlan: boolean;     // Ramadan: show khatam plan
    showQasrIndicator: boolean;       // Travel: show qasr badges
    showMosqueFinderPriority: boolean; // Travel: prioritize mosque finder
    boldText: boolean;                // Travel: larger/bold text
    reduceAnimations: boolean;        // Travel: reduce motion
  };

  /** Notification schedule adjustments */
  notifications: {
    sehriAlert: boolean;
    iftarAlert: boolean;
    laylatulQadrAlert: boolean;
    taraweehReminder: boolean;
    travelTimeWarning: boolean;
    combinedPrayerAlert: boolean;
  };
}

/** Default empty effects (no modes active) */
export const DEFAULT_MODE_EFFECTS: ModeEffects = {
  activeModes: { ramadanMode: false, travelMode: false },
  prayerAdjustments: {
    combination: 'none',
    qasrPrayers: [],
    showCombined: false,
  },
  ramadanData: {
    iftarSehri: null,
    hijriDate: null,
    isLastTenDays: false,
    isLaylatulQadrLikely: false,
    dayOfRamadan: null,
    totalRamadanDays: 30,
    nextRamadanDate: null,
    daysUntilRamadan: null,
    ramadanSeason: null,
    nextHijriYear: null,
    autoDetected: false,
  },
  fastingState: {
    todayStatus: 'unspecified',
    streakDays: 0,
    totalFasted: 0,
    missedQada: 0,
  },
  uiEffects: {
    simplifiedView: false,
    enableRamadanTheme: false,
    showIftarCountdown: false,
    showSehriAlert: false,
    showTaraweehTracker: false,
    showFastingTracker: false,
    showQuranKhatamPlan: false,
    showQasrIndicator: false,
    showMosqueFinderPriority: false,
    boldText: false,
    reduceAnimations: false,
  },
  notifications: {
    sehriAlert: false,
    iftarAlert: false,
    laylatulQadrAlert: false,
    taraweehReminder: false,
    travelTimeWarning: false,
    combinedPrayerAlert: false,
  },
};

/** Extended prayer log entry for mode tracking */
export interface ModeAwarePrayerLogEntry {
  status: 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';
  markedAt?: number;
  note?: string;
  /** Travel: location where this prayer was performed */
  locationContext?: {
    city?: string;
    country?: string;
    latitude: number;
    longitude: number;
    label?: string;
  };
  /** Travel: was this performed as Qasr? */
  qasr?: boolean;
  /** Travel: was this a combined prayer? */
  combined?: boolean;
  /** Travel: combination partner (e.g., 'asr' for dhuhr) */
  combinedWith?: string;
}

/** Fasting daily log */
export interface FastingLogEntry {
  date: string;
  status: FastingStatus;
  note?: string;
  sehriTime?: string;
  iftarTime?: string;
  /** Travel: timezone of iftar */
  location?: string;
  markedAt: number;
}

/** Taraweeh daily log */
export interface TaraweehLogEntry {
  date: string;
  status: TaraweehStatus;
  rakatCount?: number;  // 8 or 20
  imamName?: string;
  mosqueName?: string;
  location?: string;
  markedAt: number;
}

/** Quran khatam tracking for Ramadan */
export interface QuranKhatamProgress {
  juzCompleted: number[];   // Array of juz numbers completed (1-30)
  currentJuz: number;       // Currently on
  startedAt: number;
  targetCompletionDate?: string;
  completedAt?: number;
}

/** Travel journey log */
export interface TravelJourneyEntry {
  date: string;
  departureLocation: PrayerLocation;
  arrivalLocation: PrayerLocation;
  departureTime: string;
  arrivalTime: string;
  prayersPerformed: {
    fajr?: boolean;
    dhuhr?: boolean;
    asr?: boolean;
    maghrib?: boolean;
    isha?: boolean;
  };
  notes?: string;
}

/**
 * Type guard: check if a mode is active
 */
export function isModeActive(state: ActiveModeState, mode: SpecialMode): boolean {
  return state[mode];
}

/**
 * Get human-readable mode labels
 */
export function getModeLabel(mode: SpecialMode, language: 'bn' | 'en'): string {
  const labels: Record<SpecialMode, { bn: string; en: string }> = {
    ramadanMode: { bn: 'রমজান', en: 'Ramadan' },
    travelMode: { bn: 'ভ্রমণ', en: 'Travel' },
  };
  return labels[mode][language];
}

/**
 * Get mode description
 */
export function getModeDescription(mode: SpecialMode, language: 'bn' | 'en'): string {
  const descriptions: Record<SpecialMode, { bn: string; en: string }> = {
    ramadanMode: {
      bn: 'ইফতার, সেহরি, তারাবীহ ও রোজা ট্র্যাকিং চালু করুন',
      en: 'Enable Iftar, Sehri, Taraweeh & Fasting tracking',
    },
    travelMode: {
      bn: 'কসর ও জমা নামাজ, লোকেশন-অ্যাওয়্যার সময় ও সরল UI',
      en: 'Qasr & combined prayers, location-aware times & simplified UI',
    },
  };
  return descriptions[mode][language];
}