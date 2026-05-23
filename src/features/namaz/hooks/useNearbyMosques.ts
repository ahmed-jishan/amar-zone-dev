'use client';

import { useCallback, useMemo, useState } from 'react';
import { NAMAZ_STORAGE_KEYS } from '../constants/storageKeys';
import { getItem, setItem } from '../utils/storageHelpers';
import type { PrayerLocation } from '../types/prayer.types';

export interface NearbyMosque {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  address?: string;
}

type MosqueState = 'idle' | 'loading' | 'ready' | 'empty' | 'denied' | 'error';

interface MosqueCacheEntry {
  savedAt: number;
  mosques: NearbyMosque[];
}

const CACHE_MAX_AGE_MS = 1000 * 60 * 30;
const SEARCH_RADIUS_METERS = 3000;

function cacheKey(location: PrayerLocation) {
  return `${location.latitude.toFixed(3)}:${location.longitude.toFixed(3)}`;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(a: PrayerLocation, b: { latitude: number; longitude: number }) {
  const earthRadius = 6371000;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
}

function formatAddress(tags: Record<string, string | undefined>) {
  return [
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'] || tags['addr:district'],
  ].filter(Boolean).join(', ');
}

async function fetchMosques(location: PrayerLocation): Promise<NearbyMosque[]> {
  const cache = getItem<Record<string, MosqueCacheEntry>>(NAMAZ_STORAGE_KEYS.mosqueCache, {});
  const key = cacheKey(location);
  const cached = cache[key];
  if (cached && Date.now() - cached.savedAt < CACHE_MAX_AGE_MS) return cached.mosques;

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${SEARCH_RADIUS_METERS},${location.latitude},${location.longitude});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${SEARCH_RADIUS_METERS},${location.latitude},${location.longitude});
      relation["amenity"="place_of_worship"]["religion"="muslim"](around:${SEARCH_RADIUS_METERS},${location.latitude},${location.longitude});
      node["building"="mosque"](around:${SEARCH_RADIUS_METERS},${location.latitude},${location.longitude});
      way["building"="mosque"](around:${SEARCH_RADIUS_METERS},${location.latitude},${location.longitude});
    );
    out center tags 20;
  `;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ data: query }).toString(),
  });

  if (!response.ok) throw new Error('Unable to load nearby mosques');

  const payload = await response.json() as {
    elements?: Array<{
      id: number;
      type: string;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string | undefined>;
    }>;
  };

  const seen = new Set<string>();
  const mosques = (payload.elements ?? [])
    .map((element) => {
      const latitude = element.lat ?? element.center?.lat;
      const longitude = element.lon ?? element.center?.lon;
      if (!latitude || !longitude) return null;
      const tags = element.tags ?? {};
      const id = `${element.type}:${element.id}`;
      if (seen.has(id)) return null;
      seen.add(id);
      return {
        id,
        name: tags.name || tags['name:bn'] || tags['name:en'] || 'Nearby mosque',
        latitude,
        longitude,
        distanceMeters: distanceMeters(location, { latitude, longitude }),
        address: formatAddress(tags) || undefined,
      } satisfies NearbyMosque;
    })
    .filter(Boolean) as NearbyMosque[];

  const sorted = mosques.sort((a, b) => a.distanceMeters - b.distanceMeters);
  setItem<Record<string, MosqueCacheEntry>>(NAMAZ_STORAGE_KEYS.mosqueCache, {
    ...cache,
    [key]: { savedAt: Date.now(), mosques: sorted },
  });
  return sorted;
}

export function useNearbyMosques(location: PrayerLocation) {
  const [mosques, setMosques] = useState<NearbyMosque[]>([]);
  const [status, setStatus] = useState<MosqueState>('idle');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!location.latitude || !location.longitude) {
      setStatus('denied');
      return;
    }

    setStatus('loading');
    setError(null);
    try {
      const result = await fetchMosques(location);
      setMosques(result);
      setStatus(result.length ? 'ready' : 'empty');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to load nearby mosques');
    }
  }, [location]);

  return useMemo(() => ({
    mosques,
    nearest: mosques[0] ?? null,
    status,
    error,
    load,
  }), [error, load, mosques, status]);
}

export function formatMosqueDistance(distanceMetersValue: number) {
  if (distanceMetersValue < 1000) return `${distanceMetersValue} m`;
  return `${(distanceMetersValue / 1000).toFixed(1)} km`;
}

export function mosqueMapUrl(mosque: NearbyMosque) {
  return `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}&travelmode=walking`;
}
