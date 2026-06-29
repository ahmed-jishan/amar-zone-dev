// ────────────────────────────────────────────────────────────────
// ╔══════════════════════════════════════════════════════════════╗
// ║   useModeEngine — React Hook                               ║
// ║   The central, reactive mode state for all components.     ║
// ║   Subscribes to prefsStore & computes effects reactively.  ║
// ╚══════════════════════════════════════════════════════════════╝
// ────────────────────────────────────────────────────────────────

'use client';

import { useMemo, useCallback } from 'react';
import { usePrefsStore } from '../../store/prefsStore';
import { usePrayerTimes } from '../../hooks/usePrayerTimes';
import { computeModeEffects } from '../combined';
import { computeIftarSehriTimes, formatIftarCountdown } from '../ramadan';
import type { ModeEffects, IftarSehriTimes, PrayerCombination } from '../types';
import type { PrayerTimesResponse } from '../../types/prayer.types';

type ModeEngineResult = ModeEffects & {
  iftarCountdownString: string | null;
  toggleRamadanMode: () => void;
  toggleTravelMode: () => void;
  setCombinationPreference: (pref: PrayerCombination) => void;
};

/**
 * useModeEngine — The single source of truth for mode effects.
 * 
 * Usage:
 *   const modeEngine = useModeEngine();
 *   const { uiEffects, ramadanData, prayerAdjustments } = modeEngine;
 *   if (modeEngine.activeModes.ramadanMode) { ... }
 */
export function useModeEngine(): ModeEngineResult {
  const { data: prayerTimes } = usePrayerTimes();
  return useModeEngineFromPrayerTimes(prayerTimes);
}

export function useModeEngineFromPrayerTimes(prayerTimes: PrayerTimesResponse | null): ModeEngineResult {
  // Subscribe to the stores
  const ramadanMode = usePrefsStore((s) => s.ramadanMode);
  const travelMode = usePrefsStore((s) => s.travelMode);
  const location = usePrefsStore((s) => s.location);
  const setSpecialMode = usePrefsStore((s) => s.setSpecialMode);

  // Compute effects
  const modeEffects = useMemo(() => {
    return computeModeEffects(
      { ramadanMode, travelMode },
      prayerTimes,
      { latitude: location.latitude, longitude: location.longitude },
      undefined, // fastingLogs — will be connected when fastingStore is created
      undefined, // quranKhatamCompletedJuz
      undefined  // travelCombinationPreference
    );
  }, [ramadanMode, travelMode, prayerTimes, location.latitude, location.longitude]);

  // Compute iftar countdown string — updates every second via re-render
  const iftarCountdownString = useMemo(() => {
    if (!modeEffects.ramadanData.iftarSehri) return null;
    // Update the iftar remaining by recalculating on every render
    const freshIftar = computeIftarSehriTimes(prayerTimes);
    if (!freshIftar) return null;
    return formatIftarCountdown(freshIftar.iftarRemaining, 'bn');
  }, [modeEffects.ramadanData.iftarSehri?.iftarRemaining, prayerTimes]);

  // Toggle functions
  const toggleRamadanMode = useCallback(() => {
    setSpecialMode('ramadanMode', !ramadanMode);
  }, [setSpecialMode, ramadanMode]);

  const toggleTravelMode = useCallback(() => {
    setSpecialMode('travelMode', !travelMode);
  }, [setSpecialMode, travelMode]);

  const setCombinationPreference = useCallback((pref: PrayerCombination) => {
    // Store preference — will be persisted via localStorage in future
    localStorage.setItem('travel_combination_pref', pref);
  }, []);

  return {
    ...modeEffects,
    iftarCountdownString,
    toggleRamadanMode,
    toggleTravelMode,
    setCombinationPreference,
  };
}

/**
 * Get a reactive iftar countdown hook that updates every second.
 * Used by the IftarCountdown component for real-time display.
 */
export function useIftarCountdown(prayerTimesParam?: any): IftarSehriTimes | null {
  const { data: prayerTimes } = usePrayerTimes();
  const times = useMemo(
    () => computeIftarSehriTimes(prayerTimesParam ?? prayerTimes),
    [prayerTimes, prayerTimesParam]
  );
  return times;
}
