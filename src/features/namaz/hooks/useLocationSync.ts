'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { NAMAZ_STORAGE_KEYS } from '../constants/storageKeys';
import { usePrefsStore } from '../store/prefsStore';
import { getItem, setItem } from '../utils/storageHelpers';
import type { PrayerLocation } from '../types/prayer.types';
import {
  formatPrayerLocation,
  getCurrentPrayerLocation,
  LocationPermissionError,
  reverseGeocodeLocation,
  watchPrayerLocation,
} from '@/lib/native/location';

type LocationStatus = 'idle' | 'loading' | 'ready' | 'denied' | 'error' | 'unsupported';

interface CachedPlace {
  savedAt: number;
  location: PrayerLocation;
}

const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24;
const MIN_LOCATION_DELTA = 0.0005;
const MAX_STALE_MS = 5 * 60 * 1000;
const MIN_ACCURACY_IMPROVEMENT = 15;

function locationCacheKey(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
}

function shouldSyncLocation(previous: PrayerLocation, next: PrayerLocation, accuracy?: number) {
  if (!previous) return true;

  const moved =
    Math.abs(previous.latitude - next.latitude) > MIN_LOCATION_DELTA ||
    Math.abs(previous.longitude - next.longitude) > MIN_LOCATION_DELTA;

  const stale = Date.now() - (previous.updatedAt ?? 0) > MAX_STALE_MS;

  const accuracyImproved =
    typeof accuracy === 'number' &&
    typeof previous.accuracy === 'number' &&
    accuracy + MIN_ACCURACY_IMPROVEMENT < previous.accuracy;

  return moved || stale || accuracyImproved;
}

export function formatLocation(location: PrayerLocation) {
  return formatPrayerLocation(location);
}

async function reverseGeocode(latitude: number, longitude: number): Promise<Partial<PrayerLocation>> {
  const cache = getItem<Record<string, CachedPlace>>(NAMAZ_STORAGE_KEYS.locationCache, {});
  const key = locationCacheKey(latitude, longitude);
  const cached = cache[key];

  if (cached && Date.now() - cached.savedAt < CACHE_MAX_AGE_MS) {
    return cached.location;
  }

  const location = await reverseGeocodeLocation({ latitude, longitude });

  setItem<Record<string, CachedPlace>>(NAMAZ_STORAGE_KEYS.locationCache, {
    ...cache,
    [key]: { savedAt: Date.now(), location: { latitude, longitude, ...location } },
  });

  return location;
}

export function useLocationSync(force = false) {
  const location = usePrefsStore((state) => state.location);
  const autoDetectLocation = usePrefsStore((state) => state.autoDetectLocation);
  const setLocation = usePrefsStore((state) => state.setLocation);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const locationRef = useRef(location);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    if (!force && !autoDetectLocation) return;
    if (typeof window === 'undefined') {
      setStatus('unsupported');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setError(null);

    const syncPosition = async (positionLocation: PrayerLocation) => {
      const nextBase: PrayerLocation = {
        ...positionLocation,
        source: 'device',
        updatedAt: Date.now(),
      };

      try {
        const place = await reverseGeocode(nextBase.latitude, nextBase.longitude);
        if (cancelled) return;
        const next = { ...nextBase, ...place };
        setLocation(next);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setLocation(nextBase);
        setStatus('ready');
        setError(err instanceof Error ? err.message : 'Location name unavailable');
      }
    };

    const onError = (geoError: Error) => {
      if (cancelled) return;
      setStatus(geoError instanceof LocationPermissionError ? 'denied' : 'error');
      setError(geoError.message);
    };

    let cleanupWatch: (() => void) | undefined;

    void getCurrentPrayerLocation()
      .then(syncPosition)
      .catch(onError);

    void watchPrayerLocation(
      (next) => {
        if (shouldSyncLocation(locationRef.current, next, next.accuracy)) {
          void syncPosition(next);
        }
      },
      onError
    )
      .then((cleanup) => {
        if (cancelled) {
          cleanup();
          return;
        }
        cleanupWatch = cleanup;
      })
      .catch(onError);

    return () => {
      cancelled = true;
      cleanupWatch?.();
    };
  }, [autoDetectLocation, force, setLocation]);

  return useMemo(() => ({
    location,
    label: formatLocation(location),
    status,
    error,
  }), [error, location, status]);
}
