import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NAMAZ_STORAGE_KEYS } from '../constants/storageKeys';
import type { Madhab, PrayerLocation } from '../types/prayer.types';

export type LifeMode = 'normal' | 'busy' | 'sick' | 'focus';
export type QuranReciter = 'alafasy' | 'husary' | 'sudais';
export type PrayerTimeConfigMode = 'offset' | 'fixed';
export type ConfigurablePrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimePreference {
  azanMode: PrayerTimeConfigMode;
  azanOffsetMinutes: number;
  azanFixedTime: string;
  jamatMode: PrayerTimeConfigMode;
  jamatOffsetMinutes: number;
  jamatFixedTime: string;
}

export type PrayerTimePreferences = Record<ConfigurablePrayerName, PrayerTimePreference>;

export const DEFAULT_PRAYER_TIME_PREFERENCES: PrayerTimePreferences = {
  fajr: { azanMode: 'offset', azanOffsetMinutes: 0, azanFixedTime: '05:00', jamatMode: 'offset', jamatOffsetMinutes: 10, jamatFixedTime: '05:15' },
  dhuhr: { azanMode: 'offset', azanOffsetMinutes: 0, azanFixedTime: '13:15', jamatMode: 'offset', jamatOffsetMinutes: 10, jamatFixedTime: '13:30' },
  asr: { azanMode: 'offset', azanOffsetMinutes: 0, azanFixedTime: '16:45', jamatMode: 'offset', jamatOffsetMinutes: 10, jamatFixedTime: '17:00' },
  maghrib: { azanMode: 'offset', azanOffsetMinutes: 0, azanFixedTime: '18:30', jamatMode: 'offset', jamatOffsetMinutes: 5, jamatFixedTime: '18:40' },
  isha: { azanMode: 'offset', azanOffsetMinutes: 0, azanFixedTime: '20:00', jamatMode: 'offset', jamatOffsetMinutes: 10, jamatFixedTime: '20:15' },
};

function mergePrayerTimePreferences(value?: Partial<PrayerTimePreferences>): PrayerTimePreferences {
  return {
    fajr: { ...DEFAULT_PRAYER_TIME_PREFERENCES.fajr, ...value?.fajr },
    dhuhr: { ...DEFAULT_PRAYER_TIME_PREFERENCES.dhuhr, ...value?.dhuhr },
    asr: { ...DEFAULT_PRAYER_TIME_PREFERENCES.asr, ...value?.asr },
    maghrib: { ...DEFAULT_PRAYER_TIME_PREFERENCES.maghrib, ...value?.maghrib },
    isha: { ...DEFAULT_PRAYER_TIME_PREFERENCES.isha, ...value?.isha },
  };
}

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
  prayerTimePreferences: PrayerTimePreferences;
  setLocation: (location: PrayerLocation) => void;
  setCalculationMethod: (method: number) => void;
  setMadhab: (madhab: Madhab) => void;
  setReminderPrefs: (enabled: boolean, minutesBefore?: number) => void;
  setAutoDetectLocation: (enabled: boolean) => void;
  setSpecialMode: (mode: 'ramadanMode' | 'travelMode', enabled: boolean) => void;
  setLifeMode: (mode: LifeMode) => void;
  setAzanEnabled: (enabled: boolean) => void;
  setQuranReciter: (reciter: QuranReciter) => void;
  updatePrayerTimePreference: (prayer: ConfigurablePrayerName, updates: Partial<PrayerTimePreference>) => void;
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
      azanEnabled: true,
      quranReciter: 'alafasy',
      prayerTimePreferences: DEFAULT_PRAYER_TIME_PREFERENCES,
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
      updatePrayerTimePreference: (prayer, updates) =>
        set((state) => ({
          prayerTimePreferences: {
            ...state.prayerTimePreferences,
            [prayer]: {
              ...state.prayerTimePreferences[prayer],
              ...updates,
            },
          },
        })),
    }),
    {
      name: NAMAZ_STORAGE_KEYS.settings,
      version: 3,
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<PrefsState> | undefined;
        return {
          ...current,
          ...persistedState,
          location: { ...current.location, ...persistedState?.location },
          prayerTimePreferences: mergePrayerTimePreferences(persistedState?.prayerTimePreferences),
        };
      },
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<PrefsState> | undefined;
        if (!state) return persistedState;

        const isBangladeshDefault =
          state.location?.country?.toLowerCase() === 'bangladesh' ||
          state.location?.city?.toLowerCase() === 'dhaka';

        let nextState: Partial<PrefsState> = state;

        if (version < 2 && isBangladeshDefault) {
          nextState = { ...nextState, madhab: 'shafi' };
        }

        nextState = {
          ...nextState,
          prayerTimePreferences: mergePrayerTimePreferences(nextState.prayerTimePreferences),
        };

        return nextState;
      },
    }
  )
);
