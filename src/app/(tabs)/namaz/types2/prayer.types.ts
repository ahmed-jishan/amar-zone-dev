// types2/prayer.types.ts
export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
export type PrayerStatus = 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';

export interface PrayerLogEntry {
  status: PrayerStatus;
  markedAt?: number; // timestamp
}

export type DailyPrayerLog = Record<PrayerName, PrayerLogEntry>;

export interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}