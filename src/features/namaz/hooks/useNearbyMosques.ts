'use client';

import { useCallback, useMemo, useState } from 'react';
import { NAMAZ_STORAGE_KEYS } from '../constants/storageKeys';
import { getItem, setItem } from '../utils/storageHelpers';
import type { PrayerLocation } from '../types/prayer.types';
import { formatPrayerLocation, getCurrentPrayerLocation, reverseGeocodeLocation } from '@/lib/native/location';

export interface NearbyMosque {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  address?: string;
  verified: boolean;
  priority: number;
  searchUrl?: string;
}

type MosqueState = 'idle' | 'loading' | 'ready' | 'empty' | 'denied' | 'error';

interface MosqueCacheEntry {
  savedAt: number;
  location: PrayerLocation;
  mosques: NearbyMosque[];
}

const CACHE_MAX_AGE_MS = 1000 * 60 * 30;
const SEARCH_RADIUS_METERS = 2500;
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
] as const;

function cacheKey(location: PrayerLocation) {
  return `${location.latitude.toFixed(4)}:${location.longitude.toFixed(4)}`;
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

function clean(value?: string) {
  const next = value?.trim();
  return next || undefined;
}

function formatAddress(tags: Record<string, string | undefined>) {
  const street = clean(
    tags['addr:housenumber'] && tags['addr:street']
      ? `${tags['addr:housenumber']} ${tags['addr:street']}`
      : tags['addr:street']
  );
  const locality = clean(tags['addr:neighbourhood'] || tags['addr:suburb'] || tags['addr:quarter']);
  const city = clean(tags['addr:city'] || tags['addr:district']);
  const country = clean(tags['addr:country']);
  const seen = new Set<string>();
  return [street, locality, city, country].filter((part): part is string => {
    if (!part) return false;
    const key = part.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join(', ');
}

function mosquePriority(tags: Record<string, string | undefined>) {
  let score = 0;
  if (tags.amenity === 'place_of_worship' && tags.religion === 'muslim') score += 30;
  if (tags.amenity === 'mosque' || tags.building === 'mosque' || tags.mosque) score += 20;
  if (tags.name || tags['name:en'] || tags['name:bn']) score += 10;
  if (tags.operator || tags.wikidata || tags.website || tags.phone) score += 5;
  return score;
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
      node["amenity"="mosque"](around:${SEARCH_RADIUS_METERS},${location.latitude},${location.longitude});
      way["amenity"="mosque"](around:${SEARCH_RADIUS_METERS},${location.latitude},${location.longitude});
      node["building"="mosque"](around:${SEARCH_RADIUS_METERS},${location.latitude},${location.longitude});
      way["building"="mosque"](around:${SEARCH_RADIUS_METERS},${location.latitude},${location.longitude});
      relation["building"="mosque"](around:${SEARCH_RADIUS_METERS},${location.latitude},${location.longitude});
    );
    out center tags 30;
  `;

  let payload: {
    elements?: Array<{
      id: number;
      type: string;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string | undefined>;
    }>;
  } | null = null;

  let lastError: unknown = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams({ data: query }).toString(),
      });
      if (!response.ok) throw new Error(`Mosque source failed: ${response.status}`);
      payload = await response.json();
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!payload) {
    const nominatimResult = await fetchMosquesFromNominatim(location).catch((error) => {
      lastError = error;
      return [];
    });
    if (nominatimResult.length) {
      cacheMosques(cache, key, location, nominatimResult);
      return nominatimResult;
    }
    const fallback = [buildMapSearchFallback(location)];
    cacheMosques(cache, key, location, fallback);
    console.warn('Nearby mosque lookup fell back to map search:', lastError);
    return fallback;
  }

  const seen = new Set<string>();
  const mosques = (payload.elements ?? [])
    .map((element) => {
      const latitude = element.lat ?? element.center?.lat;
      const longitude = element.lon ?? element.center?.lon;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
      const tags = element.tags ?? {};
      const id = `${element.type}:${element.id}`;
      if (seen.has(id)) return null;
      seen.add(id);
      const priority = mosquePriority(tags);
      return {
        id,
        name: tags.name || tags['name:bn'] || tags['name:en'] || 'Nearby mosque',
        latitude,
        longitude,
        distanceMeters: distanceMeters(location, { latitude, longitude }),
        address: formatAddress(tags) || undefined,
        verified: priority >= 35,
        priority,
      } satisfies NearbyMosque;
    })
    .filter(Boolean) as NearbyMosque[];

  const sorted = mosques
    .filter((mosque) => mosque.distanceMeters <= SEARCH_RADIUS_METERS)
    .sort((a, b) => a.distanceMeters - b.distanceMeters || b.priority - a.priority);
  const result = sorted.length ? sorted : [buildMapSearchFallback(location)];
  cacheMosques(cache, key, location, result);
  return result;
}

function cacheMosques(
  cache: Record<string, MosqueCacheEntry>,
  key: string,
  location: PrayerLocation,
  mosques: NearbyMosque[]
) {
  setItem<Record<string, MosqueCacheEntry>>(NAMAZ_STORAGE_KEYS.mosqueCache, {
    ...cache,
    [key]: { savedAt: Date.now(), location, mosques },
  });
}

function mapSearchUrl(location: PrayerLocation) {
  return `https://www.google.com/maps/search/mosque/@${location.latitude},${location.longitude},17z`;
}

function buildMapSearchFallback(location: PrayerLocation): NearbyMosque {
  return {
    id: `maps:${location.latitude.toFixed(5)}:${location.longitude.toFixed(5)}`,
    name: 'Nearby mosques on map',
    latitude: location.latitude,
    longitude: location.longitude,
    distanceMeters: 0,
    address: formatPrayerLocation(location),
    verified: false,
    priority: 0,
    searchUrl: mapSearchUrl(location),
  };
}

async function fetchMosquesFromNominatim(location: PrayerLocation): Promise<NearbyMosque[]> {
  const delta = 0.025;
  const viewbox = [
    location.longitude - delta,
    location.latitude + delta,
    location.longitude + delta,
    location.latitude - delta,
  ].join(',');
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=mosque&limit=20&addressdetails=1&bounded=1&viewbox=${viewbox}`,
    { headers: { Accept: 'application/json', 'Accept-Language': 'en' } }
  );
  if (!response.ok) throw new Error('Mosque search source failed');

  const payload = await response.json() as Array<{
    osm_type?: string;
    osm_id?: number;
    lat?: string;
    lon?: string;
    display_name?: string;
    name?: string;
    address?: Record<string, string | undefined>;
  }>;

  return payload
    .map((item, index): NearbyMosque | null => {
      const latitude = Number(item.lat);
      const longitude = Number(item.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      const address = item.address ? formatAddress({
        'addr:housenumber': item.address.house_number,
        'addr:street': item.address.road,
        'addr:neighbourhood': item.address.neighbourhood,
        'addr:suburb': item.address.suburb,
        'addr:city': item.address.city || item.address.town,
        'addr:district': item.address.district,
        'addr:country': item.address.country,
      }) : item.display_name;
      return {
        id: `nominatim:${item.osm_type ?? 'place'}:${item.osm_id ?? index}`,
        name: item.name || item.address?.amenity || 'Nearby mosque',
        latitude,
        longitude,
        distanceMeters: distanceMeters(location, { latitude, longitude }),
        address: address || item.display_name,
        verified: Boolean(item.osm_id),
        priority: item.osm_id ? 25 : 10,
      } satisfies NearbyMosque;
    })
    .filter((item): item is NearbyMosque => item !== null)
    .filter((mosque) => mosque.distanceMeters <= SEARCH_RADIUS_METERS * 2)
    .sort((a, b) => a.distanceMeters - b.distanceMeters || b.priority - a.priority);
}

export function useNearbyMosques(location: PrayerLocation) {
  const [mosques, setMosques] = useState<NearbyMosque[]>([]);
  const [searchLocation, setSearchLocation] = useState<PrayerLocation>(location);
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
      const currentLocation = await getCurrentPrayerLocation().catch(() => location);
      const place = await reverseGeocodeLocation(currentLocation).catch(() => ({}));
      const preciseLocation = { ...currentLocation, ...place, updatedAt: Date.now() };
      setSearchLocation(preciseLocation);
      const result = await fetchMosques(preciseLocation);
      setMosques(result);
      setStatus('ready');
    } catch (err) {
      const fallback = [buildMapSearchFallback(location)];
      setMosques(fallback);
      setStatus('ready');
      setError(err instanceof Error ? err.message : null);
    }
  }, [location]);

  return useMemo(() => ({
    mosques,
    nearest: mosques[0] ?? null,
    searchLocation,
    searchLabel: formatPrayerLocation(searchLocation),
    status,
    error,
    load,
  }), [error, load, mosques, searchLocation, status]);
}

export function formatMosqueDistance(distanceMetersValue: number) {
  if (distanceMetersValue < 1000) return `${distanceMetersValue} m`;
  return `${(distanceMetersValue / 1000).toFixed(1)} km`;
}

export function mosqueMapUrl(mosque: NearbyMosque) {
  if (mosque.searchUrl) return mosque.searchUrl;
  return `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}&travelmode=walking`;
}
