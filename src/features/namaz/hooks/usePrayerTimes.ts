import { useEffect, useMemo, useState } from 'react';
import { fetchPrayerTimes, getCachedPrayerTimes } from '../utils/prayerTimesApi';
import { usePrefsStore } from '../store/prefsStore';
import type { PrayerTimesResponse } from '../types/prayer.types';

export function usePrayerTimes(date: Date = new Date()) {
  const location = usePrefsStore((state) => state.location);
  const calculationMethod = usePrefsStore((state) => state.calculationMethod);
  const madhab = usePrefsStore((state) => state.madhab);
  const [data, setData] = useState<PrayerTimesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const request = useMemo(
    () => ({
      latitude: location.latitude,
      longitude: location.longitude,
      date,
      method: calculationMethod,
      madhab,
    }),
    [calculationMethod, date, location.latitude, location.longitude, madhab]
  );

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedPrayerTimes(request);
    if (cached) setData(cached);

    setIsLoading(!cached);
    setError(null);

    fetchPrayerTimes(request)
      .then((value) => {
        if (!cancelled) setData(value);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load prayer times');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [request]);

  return { data, error, isLoading, refetch: () => fetchPrayerTimes(request).then(setData) };
}
