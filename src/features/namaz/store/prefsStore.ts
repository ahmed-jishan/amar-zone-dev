import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NAMAZ_STORAGE_KEYS } from '../constants/storageKeys';
import type { Madhab, PrayerLocation } from '../types/prayer.types';

export type LifeMode = 'normal' | 'busy' | 'sick' | 'focus';
export type QuranReciter = 'alafasy' | 'husary' | 'sudais';

interface PrefsState {
  location: PrayerLocation;
  calculationMethod: number;
  madhab: Madhab;
  remindersEnabled: boolean;
  reminderMinutesBefore: number;
  autoDetectLocation: boolean;
  ramadanMode: boolean;
  travelMode: boolean;
  lifeMode: LifeMode;
  azanEnabled: boolean;
  quranReciter: QuranReciter;
  setLocation: (location: PrayerLocation) => void;
  setCalculationMethod: (method: number) => void;
  setMadhab: (madhab: Madhab) => void;
  setReminderPrefs: (enabled: boolean, minutesBefore?: number) => void;
  setAutoDetectLocation: (enabled: boolean) => void;
  setSpecialMode: (mode: 'ramadanMode' | 'travelMode', enabled: boolean) => void;
  setLifeMode: (mode: LifeMode) => void;
  setAzanEnabled: (enabled: boolean) => void;
  setQuranReciter: (reciter: QuranReciter) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      location: { latitude: 23.8103, longitude: 90.4125, city: 'Dhaka', country: 'Bangladesh', source: 'fallback' },
      calculationMethod: 5,
      madhab: 'shafi',
      remindersEnabled: false,
      reminderMinutesBefore: 10,
      autoDetectLocation: true,
      ramadanMode: false,
      travelMode: false,
      lifeMode: 'normal',
      azanEnabled: false,
      quranReciter: 'alafasy',
      setLocation: (location) => set({ location }),
      setCalculationMethod: (calculationMethod) => set({ calculationMethod }),
      setMadhab: (madhab) => set({ madhab }),
      setReminderPrefs: (remindersEnabled, reminderMinutesBefore) =>
        set((state) => ({
          remindersEnabled,
          reminderMinutesBefore: reminderMinutesBefore ?? state.reminderMinutesBefore,
        })),
      setAutoDetectLocation: (autoDetectLocation) => set({ autoDetectLocation }),
      setSpecialMode: (mode, enabled) => set({ [mode]: enabled } as Pick<PrefsState, typeof mode>),
      setLifeMode: (lifeMode) => set({ lifeMode }),
      setAzanEnabled: (azanEnabled) => set({ azanEnabled }),
      setQuranReciter: (quranReciter) => set({ quranReciter }),
    }),
    {
      name: NAMAZ_STORAGE_KEYS.settings,
      version: 2,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<PrefsState> | undefined;
        if (!state) return persistedState;

        const isBangladeshDefault =
          state.location?.country?.toLowerCase() === 'bangladesh' ||
          state.location?.city?.toLowerCase() === 'dhaka';

        if (version < 2 && isBangladeshDefault) {
          return { ...state, madhab: 'shafi' };
        }

        return persistedState;
      },
    }
  )
);
