export const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export const LEGACY_PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

export const PRAYER_NAMES_BN = {
  fajr: 'ফজর',
  dhuhr: 'যোহর',
  asr: 'আসর',
  maghrib: 'মাগরিব',
  isha: 'এশা',
  Fajr: 'ফজর',
  Dhuhr: 'যোহর',
  Asr: 'আসর',
  Maghrib: 'মাগরিব',
  Isha: 'এশা',
} as const;

export const PRAYER_NAME_LABELS: Record<string, { en: string; bn: string }> = {
  fajr: { en: 'Fajr', bn: 'ফজর' },
  dhuhr: { en: 'Dhuhr', bn: 'যোহর' },
  asr: { en: 'Asr', bn: 'আসর' },
  maghrib: { en: 'Maghrib', bn: 'মাগরিব' },
  isha: { en: 'Isha', bn: 'এশা' },
  Fajr: { en: 'Fajr', bn: 'ফজর' },
  Dhuhr: { en: 'Dhuhr', bn: 'যোহর' },
  Asr: { en: 'Asr', bn: 'আসর' },
  Maghrib: { en: 'Maghrib', bn: 'মাগরিব' },
  Isha: { en: 'Isha', bn: 'এশা' },
};

export function normalizePrayerName(name: string) {
  const key = name.toLowerCase();
  return key === 'dhuhr' || key === 'fajr' || key === 'asr' || key === 'maghrib' || key === 'isha'
    ? key
    : 'fajr';
}
