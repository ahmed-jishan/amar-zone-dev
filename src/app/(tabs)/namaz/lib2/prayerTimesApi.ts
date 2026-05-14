import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { NAMAZ_STORAGE_KEYS } from '../constants/storageKeys';
import { PRAYER_NAME_LABELS } from '../constants/prayerNames';
import { formatLocalDateKey } from './dateHelpers';
import { getItem, setItem } from './storageHelpers';
import type {
  CanonicalPrayerName,
  Madhab,
  PrayerTime,
  PrayerTimesRequest,
  PrayerTimesResponse,
} from '../types2/prayer.types';

interface AladhanTimingResponse {
  code: number;
  status: string;
  data: {
    timings: Record<string, string>;
    date: {
      readable: string;
      gregorian: { date: string };
      hijri?: { date: string };
    };
    meta: {
      timezone: string;
      method?: { id: number; name: string };
      latitude?: number;
      longitude?: number;
    };
  };
}

type PrayerTimesCache = Record<string, { savedAt: number; value: PrayerTimesResponse }>;

const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 12;

function formatDate(date: Date | string): string {
  if (typeof date === 'string') return date;
  return formatLocalDateKey(date);
}

function cacheKey(input: PrayerTimesRequest): string {
  return [
    formatDate(input.date),
    input.latitude.toFixed(4),
    input.longitude.toFixed(4),
    input.method,
    input.madhab,
  ].join(':');
}

function cleanTime(value: string): string {
  return value.replace(/\s*\(.+\)\s*$/, '').trim();
}

function mapTiming(name: CanonicalPrayerName, timings: Record<string, string>): PrayerTime {
  const apiName = PRAYER_NAME_LABELS[name].en;
  return {
    name,
    label: PRAYER_NAME_LABELS[name].bn,
    time: cleanTime(timings[apiName] ?? '00:00'),
  };
}

function normalizeResponse(
  input: PrayerTimesRequest,
  payload: AladhanTimingResponse
): PrayerTimesResponse {
  const { timings, date, meta } = payload.data;

  return {
    date: formatDate(input.date),
    readableDate: date.readable,
    hijriDate: date.hijri?.date,
    timezone: meta.timezone,
    latitude: input.latitude,
    longitude: input.longitude,
    method: input.method,
    madhab: input.madhab,
    timings: {
      fajr: mapTiming('fajr', timings),
      dhuhr: mapTiming('dhuhr', timings),
      asr: mapTiming('asr', timings),
      maghrib: mapTiming('maghrib', timings),
      isha: mapTiming('isha', timings),
    },
    rawTimings: {
      Fajr: cleanTime(timings.Fajr),
      Dhuhr: cleanTime(timings.Dhuhr),
      Asr: cleanTime(timings.Asr),
      Maghrib: cleanTime(timings.Maghrib),
      Isha: cleanTime(timings.Isha),
    },
  };
}

export async function fetchPrayerTimes(input: PrayerTimesRequest): Promise<PrayerTimesResponse> {
  const key = cacheKey(input);
  const cache = getItem<PrayerTimesCache>(NAMAZ_STORAGE_KEYS.prayerTimesCache, {});
  const cached = cache[key];

  if (cached && Date.now() - cached.savedAt < CACHE_MAX_AGE_MS) {
    return cached.value;
  }

  const params = new URLSearchParams({
    latitude: String(input.latitude),
    longitude: String(input.longitude),
    method: String(input.method),
    school: input.madhab === 'hanafi' ? '1' : '0',
  });

  // External data fetch: Aladhan API returns prayer timings for one date and location.
  const response = await fetch(`${API_ENDPOINTS.aladhanTimings}/${formatDate(input.date)}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch prayer times: ${response.status}`);
  }

  const payload = (await response.json()) as AladhanTimingResponse;
  if (payload.code !== 200 || !payload.data?.timings) {
    throw new Error(payload.status || 'Invalid prayer times response');
  }

  const value = normalizeResponse(input, payload);
  setItem<PrayerTimesCache>(NAMAZ_STORAGE_KEYS.prayerTimesCache, {
    ...cache,
    [key]: { savedAt: Date.now(), value },
  });

  return value;
}

export function getCachedPrayerTimes(input: PrayerTimesRequest): PrayerTimesResponse | null {
  const cached = getItem<PrayerTimesCache>(NAMAZ_STORAGE_KEYS.prayerTimesCache, {})[cacheKey(input)];
  return cached?.value ?? null;
}
