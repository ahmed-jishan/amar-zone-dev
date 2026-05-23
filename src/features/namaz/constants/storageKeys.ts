// constants/storageKeys.ts
export const STORAGE_KEYS = {
  PRAYER_LOGS: 'namaz_prayer_logs',
  NAMAZ_SETTINGS: 'namaz_settings',
  TASBIH_DATA: 'namaz_tasbih_data',
  DUA_READ_STATUS: 'namaz_dua_read_status',
  LAST_LOCATION: 'namaz_last_location',
} as const;
export const NAMAZ_STORAGE_KEYS = {
  prayerLogs: 'namaz-prayer-logs',
  settings: 'namaz-settings',
  tasbih: 'namaz-tasbih',
  dua: 'namaz-dua-state',
  prayerTimesCache: 'namaz-prayer-times-cache',
  locationCache: 'namaz-location-cache',
  mosqueCache: 'namaz-mosque-cache',
  notifications: 'namaz-notifications',
  quran: 'namaz-quran-state',
  quranCache: 'namaz-quran-cache',
} as const;
