export type CanonicalPrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type LegacyPrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
export type PrayerName = CanonicalPrayerName | LegacyPrayerName;
export type PrayerStatus = 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';
export type Madhab = 'shafi' | 'hanafi';

export interface PrayerLogEntry {
  status: PrayerStatus;
  markedAt?: number;
  note?: string;
}

export type PrayerLog = PrayerLogEntry;
export type DailyPrayerLog = Partial<Record<PrayerName, PrayerLogEntry>>;

export interface PrayerTime {
  name: CanonicalPrayerName;
  label: string;
  time: string;
  timestamp?: string;
}

export interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export type CanonicalPrayerTimes = Record<CanonicalPrayerName, PrayerTime>;

export interface PrayerTimesResponse {
  date: string;
  readableDate: string;
  hijriDate?: string;
  timezone: string;
  latitude: number;
  longitude: number;
  method: number;
  madhab: Madhab;
  timings: CanonicalPrayerTimes;
  rawTimings: PrayerTimes;
}

export interface PrayerTimesRequest {
  latitude: number;
  longitude: number;
  date: Date | string;
  method: number;
  madhab: Madhab;
}

export interface PrayerLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}
