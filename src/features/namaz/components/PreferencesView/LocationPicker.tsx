'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { usePrefsStore } from '../../store/prefsStore';
import type { PrayerLocation } from '../../types/prayer.types';
import {
  formatPrayerLocation,
  getCurrentPrayerLocation,
  LocationPermissionError,
  reverseGeocodeLocation,
} from '@/lib/native/location';

type DetectState = 'idle' | 'loading' | 'success' | 'error';

export default function LocationPicker() {
  const location = usePrefsStore((state) => state.location);
  const autoDetectLocation = usePrefsStore((state) => state.autoDetectLocation);
  const setLocation = usePrefsStore((state) => state.setLocation);
  const setAutoDetectLocation = usePrefsStore((state) => state.setAutoDetectLocation);

  const [address, setAddress] = useState(formatPrayerLocation(location));
  const [detectedLocation, setDetectedLocation] = useState<PrayerLocation | null>(null);
  const [detectState, setDetectState] = useState<DetectState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setAddress(formatPrayerLocation(location));
  }, [location]);

  const detectLocation = useCallback(async () => {
    setError(null);
    setSuccessMsg(null);
    setDetectState('loading');

    try {
      const detected = await getCurrentPrayerLocation();
      let nextLocation: PrayerLocation = { ...detected, displayName: 'Current location' };

      try {
        const place = await reverseGeocodeLocation(detected);
        nextLocation = {
          ...detected,
          ...place,
          displayName: place.displayName ?? formatPrayerLocation({ ...detected, ...place }),
          source: 'device',
          updatedAt: Date.now(),
        };
      } catch (err) {
        console.error('Reverse geocode failed:', err);
      }

      setLocation(nextLocation);
      setAutoDetectLocation(true);
      setDetectedLocation(nextLocation);
      setAddress(formatPrayerLocation(nextLocation));
      setSuccessMsg(`Location saved: ${formatPrayerLocation(nextLocation)}`);
      setDetectState('success');
      window.setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      const message =
        err instanceof LocationPermissionError
          ? 'Location permission denied. Enable location for SelfSync from phone settings, then try again.'
          : err instanceof Error
            ? err.message
            : 'Unable to detect location. Please try again.';
      setError(message);
      setDetectState('error');
      console.error('Geolocation error:', err);
    }
  }, [setLocation, setAutoDetectLocation]);

  const saveLocation = useCallback(() => {
    const nextAddress = address.trim();
    if (!nextAddress) {
      setError('Please enter a location');
      return;
    }

    const base = detectedLocation ?? location;
    setError(null);
    setLocation({
      ...base,
      displayName: nextAddress,
      addressLines: nextAddress.split(',').map((part) => part.trim()).filter(Boolean),
      updatedAt: Date.now(),
    });
    setAutoDetectLocation(Boolean(detectedLocation || autoDetectLocation));
    setSuccessMsg('Location saved');
    window.setTimeout(() => setSuccessMsg(null), 2500);
  }, [address, autoDetectLocation, detectedLocation, location, setLocation, setAutoDetectLocation]);

  return (
    <section className="space-y-4 rounded-2xl p-5 nz-card">
      <div>
        <h3 className="text-lg font-semibold nz-text">Location</h3>
        <p className="text-sm nz-muted">Prayer times use your saved exact GPS coordinates and address.</p>
      </div>

      <div className="rounded-lg bg-opacity-50 p-3 text-xs nz-muted nz-soft">
        <div className="mb-1 flex items-center gap-2">
          {autoDetectLocation && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
          <span className="font-medium">
            {autoDetectLocation ? 'Auto-detection enabled' : 'Saved location'}
          </span>
        </div>
        <div className="font-mono text-xs">
          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </div>
        {location.accuracy && (
          <div className="text-[10px] opacity-70">
            Accuracy: +/-{Math.round(location.accuracy)}m
          </div>
        )}
        <div className="mt-2 text-sm font-semibold nz-text">
          {formatPrayerLocation(location)}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <textarea
          value={address}
          onChange={(event) => {
            setAddress(event.target.value);
            setDetectedLocation(null);
            setError(null);
          }}
          placeholder="House/Road, Area, City, Country"
          disabled={detectState === 'loading'}
          rows={3}
          className="resize-none rounded-xl px-3 py-2 outline-none disabled:opacity-50 nz-control"
        />
        <button
          type="button"
          onClick={saveLocation}
          disabled={detectState === 'loading'}
          className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 nz-primary"
        >
          Save
        </button>
      </div>

      <button
        type="button"
        onClick={detectLocation}
        disabled={detectState === 'loading'}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 nz-control hover:nz-soft"
      >
        {detectState === 'loading' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Detecting exact location...
          </>
        ) : (
          <>
            <MapPin size={16} />
            Auto-detect exact location
          </>
        )}
      </button>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">
          <CheckCircle2 size={14} className="flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}
