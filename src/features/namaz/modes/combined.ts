// ────────────────────────────────────────────────────────────────
// ╔══════════════════════════════════════════════════════════════╗
// ║   Combined Mode Strategy                                   ║
// ║   Resolves conflicts when BOTH Ramadan + Travel are active ║
// ║   Priority: Ramadan (theme/ui) + Travel (prayer calc)      ║
// ╚══════════════════════════════════════════════════════════════╝
// ────────────────────────────────────────────────────────────────

import type { ModeEffects, ActiveModeState, PrayerCombination } from './types';
import { DEFAULT_MODE_EFFECTS } from './types';
import type { PrayerTimesResponse } from '../types/prayer.types';
import { computeIftarSehriTimes, detectRamadanPosition, extractDayFromHijri } from './ramadan';
import { computeTravelPrayerAdjustments } from './travel';
import { getNextRamadan, formatNextRamadanDate, isHijriDateRamadan } from './nextRamadan';

/**
 * Check if Ramadan is detected based on the Hijri date.
 * Approximately Ramadan is the 9th month. Simple heuristic:
 * If hijriDate contains "Ramadan" or month is 9.
 */
function isRamadanFromDate(hijriDate?: string | null): boolean {
  if (!hijriDate) return false;
  const lower = hijriDate.toLowerCase();
  return lower.includes('ramadan') || lower.includes('রমজান');
}

/**
 * THE MAIN MODE ENGINE — computes all effects from the active mode state.
 * 
 * This is the single source of truth. Every component subscribes to this.
 * No data contradictions.
 */
export function computeModeEffects(
  activeModes: ActiveModeState,
  prayerTimes: PrayerTimesResponse | null,
  currentLocation: { latitude: number; longitude: number },
  fastingLogs?: Record<string, { status: string }>,
  quranKhatamCompletedJuz?: number[],
  travelCombinationPreference?: PrayerCombination
): ModeEffects {
  const { ramadanMode, travelMode } = activeModes;

  // Start with defaults
  const effects: ModeEffects = {
    ...DEFAULT_MODE_EFFECTS,
    activeModes: { ...activeModes },
  };

  // ─── RAMADAN EFFECTS ─────────────────────────────────────
  if (ramadanMode) {
    const iftarSehri = computeIftarSehriTimes(prayerTimes);
    const hijriDate = prayerTimes?.hijriDate ?? null;
    const dayOfRamadan = extractDayFromHijri(hijriDate);
    const { isLastTenDays, isLaylatulQadrLikely } = detectRamadanPosition(hijriDate, dayOfRamadan);
    
    // Compute next Ramadan info
    const nextRamadanInfo = getNextRamadan();
    const isCurrentlyRamadan = hijriDate ? isHijriDateRamadan(hijriDate) : false;

    effects.ramadanData = {
      iftarSehri,
      hijriDate,
      isLastTenDays,
      isLaylatulQadrLikely,
      dayOfRamadan,
      totalRamadanDays: 30,
      nextRamadanDate: formatNextRamadanDate(nextRamadanInfo, 'bn'),
      daysUntilRamadan: nextRamadanInfo.daysUntilRamadan,
      ramadanSeason: isCurrentlyRamadan ? 'active' : nextRamadanInfo.season,
      nextHijriYear: nextRamadanInfo.nextHijriYear,
      autoDetected: !ramadanMode && isCurrentlyRamadan,
    };

    effects.fastingState = {
      todayStatus: fastingLogs?.[getTodayKey()]?.status as any ?? 'unspecified',
      streakDays: computeFastingStreak(fastingLogs ?? {}),
      totalFasted: countFastingDays(fastingLogs ?? {}),
      missedQada: countMissedQada(fastingLogs ?? {}),
    };

    // UI effects for Ramadan
    effects.uiEffects = {
      ...effects.uiEffects,
      enableRamadanTheme: true,
      showIftarCountdown: true,
      showSehriAlert: iftarSehri?.isSehriWindow ?? false,
      showTaraweehTracker: true,
      showFastingTracker: true,
      showQuranKhatamPlan: true,
    };

    // Notification effects for Ramadan
    effects.notifications = {
      ...effects.notifications,
      sehriAlert: true,
      iftarAlert: true,
      laylatulQadrAlert: isLaylatulQadrLikely,
      taraweehReminder: true,
    };
  }

  // ─── TRAVEL EFFECTS ─────────────────────────────────────
  if (travelMode) {
    const travelAdj = computeTravelPrayerAdjustments(true, travelCombinationPreference);

    effects.prayerAdjustments = travelAdj;

    effects.uiEffects = {
      ...effects.uiEffects,
      simplifiedView: true,
      showQasrIndicator: true,
      showMosqueFinderPriority: true,
      boldText: true,
      reduceAnimations: true,
    };

    effects.notifications = {
      ...effects.notifications,
      travelTimeWarning: true,
      combinedPrayerAlert: travelAdj.combination !== 'none',
    };
  }

  // ─── COMBINED CONFLICT RESOLUTION ───────────────────────
  // When both modes are active, apply these rules:
  if (ramadanMode && travelMode) {
    // Ramadan theme takes priority over travel simplification
    effects.uiEffects.enableRamadanTheme = true;
    effects.uiEffects.simplifiedView = true; // Both apply

    // Travel prayer adjustments take priority
    // (Qasr/Jam'a still apply during Ramadan travel)
    
    // Taraweeh still shown but with travel recommendation
    effects.uiEffects.showTaraweehTracker = true;

    // Iftar/Sehri adapts to current travel location timezone
    // (already handled by prayerTimes from API)

    // Ramadan notifications remain active
    effects.notifications.iftarAlert = true;
    effects.notifications.sehriAlert = true;

    // Fasting tracking remains active even while traveling
    effects.uiEffects.showFastingTracker = true;
  }

  // ─── AUTO-DETECT RAMADAN FROM DATE ──────────────────────
  // If Ramadan mode is off but we detect Ramadan from Hijri date,
  // we still compute some data (non-intrusive)
  if (!ramadanMode && prayerTimes?.hijriDate && isRamadanFromDate(prayerTimes.hijriDate)) {
    const dayOfRamadan = extractDayFromHijri(prayerTimes.hijriDate);
    const { isLastTenDays, isLaylatulQadrLikely } = detectRamadanPosition(
      prayerTimes.hijriDate,
      dayOfRamadan
    );
    
    // Non-intrusive: provide data but don't activate UI effects
    const nextRamadanInfoAuto = getNextRamadan();
    effects.ramadanData = {
      iftarSehri: computeIftarSehriTimes(prayerTimes),
      hijriDate: prayerTimes.hijriDate,
      isLastTenDays,
      isLaylatulQadrLikely,
      dayOfRamadan,
      totalRamadanDays: 30,
      nextRamadanDate: formatNextRamadanDate(nextRamadanInfoAuto, 'bn'),
      daysUntilRamadan: nextRamadanInfoAuto.daysUntilRamadan,
      ramadanSeason: 'active',
      nextHijriYear: nextRamadanInfoAuto.nextHijriYear,
      autoDetected: true,
    };
  }

  return effects;
}

// ─── FASTING STREAK HELPERS ──────────────────────────────

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeFastingStreak(logs: Record<string, { status: string }>): number {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const entry = logs[key];
    
    if (entry?.status === 'fasting') {
      streak++;
    } else if (i > 0) {
      // Only break if it's not today (today might not be logged yet)
      break;
    }
  }
  
  return streak;
}

function countFastingDays(logs: Record<string, { status: string }>): number {
  return Object.values(logs).filter((l) => l.status === 'fasting').length;
}

function countMissedQada(logs: Record<string, { status: string }>): number {
  return Object.values(logs).filter((l) => l.status === 'qada').length;
}