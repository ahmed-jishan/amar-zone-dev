import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NAMAZ_STORAGE_KEYS } from '../constants/storageKeys';
import type { Madhab, PrayerLocation } from '../types/prayer.types';

export type LifeMode = 'normal' | 'busy' | 'sick' | 'focus';

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
  setLocation: (location: PrayerLocation) => void;
  setCalculationMethod: (method: number) => void;
  setMadhab: (madhab: Madhab) => void;
  setReminderPrefs: (enabled: boolean, minutesBefore?: number) => void;
  setAutoDetectLocation: (enabled: boolean) => void;
  setSpecialMode: (mode: 'ramadanMode' | 'travelMode', enabled: boolean) => void;
  setLifeMode: (mode: LifeMode) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      location: { latitude: 23.8103, longitude: 90.4125, city: 'Dhaka', country: 'Bangladesh' },
      calculationMethod: 5,
      madhab: 'hanafi',
      remindersEnabled: false,
      reminderMinutesBefore: 10,
      autoDetectLocation: false,
      ramadanMode: false,
      travelMode: false,
      lifeMode: 'normal',
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
    }),
    { name: NAMAZ_STORAGE_KEYS.settings }
  )
);
