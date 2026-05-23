'use client';

import { useEffect, useMemo, useState } from 'react';
import { NAMAZ_STORAGE_KEYS } from '../constants/storageKeys';
import { usePrefsStore } from '../store/prefsStore';
import { getItem, setItem } from '../utils/storageHelpers';
import type { PrayerLocation } from '../types/prayer.types';

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
  return `${latitude.toFixed(3)}:${longitude.toFixed(3)}`;
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
  if (location.displayName) return location.displayName;
  if (location.city && location.region && location.city !== location.region) return `${location.city}, ${location.region}`;
  if (location.city && location.country) return `${location.city}, ${location.country}`;
  if (location.city) return location.city;
  if (location.country) return location.country;
  return `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
}

async function reverseGeocode(latitude: number, longitude: number): Promise<Partial<PrayerLocation>> {
  const cache = getItem<Record<string, CachedPlace>>(NAMAZ_STORAGE_KEYS.locationCache, {});
  const key = locationCacheKey(latitude, longitude);
  const cached = cache[key];

  if (cached && Date.now() - cached.savedAt < CACHE_MAX_AGE_MS) {
    return cached.location;
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
    { headers: { Accept: 'application/json' } }
  );

  if (!response.ok) throw new Error('Unable to resolve location name');

  const payload = await response.json() as {
    display_name?: string;
    address?: Record<string, string | undefined>;
  };

  const address = payload.address ?? {};
  const city =
    address.city ||
    address.town ||
    address.municipality ||
    address.upazila ||
    address.village ||
    address.suburb ||
    address.county;
  const region = address.state || address.division || address.county;
  const country = address.country;
  const displayName = city && region && city !== region ? `${city}, ${region}` : city && country ? `${city}, ${country}` : payload.display_name;
  const location = { city, region, country, displayName };

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

  useEffect(() => {
    if (!force && !autoDetectLocation) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setError(null);

    const syncPosition = async (position: GeolocationPosition) => {
      const nextBase: PrayerLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
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

    const onError = (geoError: GeolocationPositionError) => {
      if (cancelled) return;
      setStatus(geoError.code === geoError.PERMISSION_DENIED ? 'denied' : 'error');
      setError(geoError.message);
    };

    navigator.geolocation.getCurrentPosition(syncPosition, onError, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 0,
    });

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        if (shouldSyncLocation(location, next as PrayerLocation, position.coords.accuracy)) {
          void syncPosition(position);
        }
      },
      onError,
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 }
    );

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [autoDetectLocation, force, location, setLocation]);

  return useMemo(() => ({
    location,
    label: formatLocation(location),
    status,
    error,
  }), [error, location, status]);
}
