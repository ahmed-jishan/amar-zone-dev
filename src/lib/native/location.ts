'use client';

import { Capacitor } from '@capacitor/core';
import { Geolocation, type Position } from '@capacitor/geolocation';
import type { PrayerLocation } from '@/features/namaz/types/prayer.types';

export type NativeLocationStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export class LocationPermissionError extends Error {
  constructor(message = 'Location permission is required to detect your current position.') {
    super(message);
    this.name = 'LocationPermissionError';
  }
}

export function isNativeApp() {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

function permissionFromCapacitor(value?: string): NativeLocationStatus {
  if (value === 'granted') return 'granted';
  if (value === 'denied') return 'denied';
  return 'prompt';
}

function toPrayerLocation(position: Position | GeolocationPosition): PrayerLocation {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? undefined,
    source: 'device',
    updatedAt: Date.now(),
  };
}

function cleanAddressPart(value?: string | null) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function uniqueParts(parts: Array<string | undefined>) {
  const seen = new Set<string>();
  return parts.filter((part): part is string => {
    const value = cleanAddressPart(part);
    if (!value) return false;
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildHumanLocation(address: Record<string, string | undefined>, fallbackDisplayName?: string) {
  const houseNumber = cleanAddressPart(address.house_number);
  const road = cleanAddressPart(
    address.road ||
    address.pedestrian ||
    address.footway ||
    address.street ||
    address.residential ||
    address.path
  );
  const streetAddress = cleanAddressPart(
    houseNumber && road ? `${houseNumber} ${road}` : road || address.house_name || address.building
  );
  const neighborhood = cleanAddressPart(
    address.neighbourhood ||
    address.suburb ||
    address.quarter ||
    address.city_block ||
    address.hamlet
  );
  const subLocality = cleanAddressPart(
    address.suburb ||
    address.neighbourhood ||
    address.quarter ||
    address.city_district ||
    address.subdistrict ||
    address.upazila ||
    address.thana
  );
  const city = cleanAddressPart(
    address.city ||
    address.town ||
    address.municipality ||
    address.village ||
    address.union ||
    address.county
  );
  const district = cleanAddressPart(address.district || address.county || address.state_district);
  const region = cleanAddressPart(address.state || address.division || district);
  const country = cleanAddressPart(address.country);

  const fallbackParts = uniqueParts((fallbackDisplayName ?? '').split(',').map((part) => part.trim()).slice(0, 5));
  const addressLines = uniqueParts([
    streetAddress,
    neighborhood,
    subLocality,
    city,
    district,
    country,
    ...fallbackParts,
  ]);

  return {
    houseNumber,
    road,
    streetAddress,
    neighborhood,
    subLocality,
    city,
    district,
    region,
    country,
    addressLines,
    displayName: addressLines.join(', ') || fallbackDisplayName,
  } satisfies Partial<PrayerLocation>;
}

export function formatPrayerLocation(location: PrayerLocation) {
  const lines = location.addressLines?.filter(Boolean);
  if (lines?.length) return lines.join(', ');
  if (location.displayName) return location.displayName;
  return uniqueParts([
    location.streetAddress,
    location.neighborhood,
    location.subLocality,
    location.city,
    location.district || location.region,
    location.country,
  ]).join(', ') || `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
}

export async function requestLocationPermission(): Promise<NativeLocationStatus> {
  if (typeof window === 'undefined') return 'unsupported';

  if (isNativeApp()) {
    const current = await Geolocation.checkPermissions();
    if (current.location === 'granted' || current.coarseLocation === 'granted') return 'granted';

    const requested = await Geolocation.requestPermissions({ permissions: ['location'] });
    return requested.location === 'granted' || requested.coarseLocation === 'granted'
      ? 'granted'
      : permissionFromCapacitor(requested.location);
  }

  if (!navigator.geolocation) return 'unsupported';
  if (!navigator.permissions?.query) return 'prompt';

  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    if (status.state === 'granted') return 'granted';
    if (status.state === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'prompt';
  }
}

export async function getCurrentPrayerLocation(): Promise<PrayerLocation> {
  if (typeof window === 'undefined') {
    throw new Error('Location is only available in the app.');
  }

  if (isNativeApp()) {
    const permission = await requestLocationPermission();
    if (permission === 'denied') throw new LocationPermissionError();
    if (permission === 'unsupported') throw new Error('Location is not available on this device.');

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
    return toPrayerLocation(position);
  }

  if (!navigator.geolocation) {
    throw new Error('Location is not supported in this browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(toPrayerLocation(position)),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new LocationPermissionError('Location permission was denied.'));
          return;
        }
        reject(new Error(error.message || 'Unable to detect location.'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export async function watchPrayerLocation(
  onPosition: (location: PrayerLocation) => void,
  onError: (error: Error) => void
): Promise<() => void> {
  if (isNativeApp()) {
    const permission = await requestLocationPermission();
    if (permission === 'denied') throw new LocationPermissionError();

    const watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
      (position, error) => {
        if (error) {
          onError(new Error(error.message || 'Unable to watch location.'));
          return;
        }
        if (position) onPosition(toPrayerLocation(position));
      }
    );

    return () => {
      void Geolocation.clearWatch({ id: watchId });
    };
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Location is not supported in this browser.');
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => onPosition(toPrayerLocation(position)),
    (error) => onError(new Error(error.message || 'Unable to watch location.')),
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

export async function reverseGeocodeLocation(location: PrayerLocation): Promise<Partial<PrayerLocation>> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1&namedetails=1`,
    { headers: { Accept: 'application/json', 'Accept-Language': 'en' } }
  );

  if (!response.ok) throw new Error('Unable to resolve location name');

  const payload = (await response.json()) as {
    display_name?: string;
    address?: Record<string, string | undefined>;
  };
  return buildHumanLocation(payload.address ?? {}, payload.display_name);
}
