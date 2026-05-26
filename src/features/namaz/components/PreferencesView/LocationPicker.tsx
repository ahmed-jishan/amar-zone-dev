'use client';

import { useState, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePrefsStore } from '../../store/prefsStore';
import { getCurrentPrayerLocation, LocationPermissionError, reverseGeocodeLocation } from '@/lib/native/location';

type DetectState = 'idle' | 'loading' | 'success' | 'error';

export default function LocationPicker() {
  const location = usePrefsStore((state) => state.location);
  const autoDetectLocation = usePrefsStore((state) => state.autoDetectLocation);
  const setLocation = usePrefsStore((state) => state.setLocation);
  const setAutoDetectLocation = usePrefsStore((state) => state.setAutoDetectLocation);
  
  const [city, setCity] = useState(location.city ?? '');
  const [detectState, setDetectState] = useState<DetectState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const detectLocation = useCallback(async () => {
    setError(null);
    setSuccessMsg(null);
    setDetectState('loading');

    try {
      const detected = await getCurrentPrayerLocation();
      let nextLocation = { ...detected, city: 'Current location' };

      try {
        const place = await reverseGeocodeLocation(detected);
        nextLocation = {
          ...detected,
          ...place,
          city: place.city ?? place.displayName ?? 'Current location',
        };
      } catch (err) {
        console.error('Reverse geocode failed:', err);
      }

      setLocation(nextLocation);
      setAutoDetectLocation(true);
      setCity(nextLocation.city ?? 'Current location');
      setSuccessMsg(`Location detected: ${nextLocation.displayName ?? nextLocation.city ?? 'Current location'}`);
      setDetectState('success');
      setTimeout(() => setSuccessMsg(null), 2000);
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

  const saveManual = useCallback(() => {
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }
    setError(null);
    setLocation({ 
      ...location, 
      city: city.trim(),
      updatedAt: Date.now(),
    });
    setAutoDetectLocation(false);
    setSuccessMsg('Location saved');
    setTimeout(() => setSuccessMsg(null), 2000);
  }, [city, location, setLocation, setAutoDetectLocation]);

  return (
    <section className="rounded-2xl p-5 space-y-4 nz-card">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold nz-text">Location</h3>
        <p className="text-sm nz-muted">Prayer times are calculated from your saved coordinates.</p>
      </div>

      {/* Current Location Status */}
      <div className="text-xs nz-muted rounded-lg p-3 bg-opacity-50 nz-soft">
        <div className="flex items-center gap-2 mb-1">
          {autoDetectLocation && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
          <span className="font-medium">
            {autoDetectLocation ? 'Auto-detection enabled' : 'Manual mode'}
          </span>
        </div>
        <div className="font-mono text-xs">
          {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
        </div>
        {location.accuracy && (
          <div className="text-[10px] opacity-70">
            Accuracy: ±{Math.round(location.accuracy)}m
          </div>
        )}
      </div>

      {/* City Input & Save Button */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setError(null);
          }}
          placeholder="Enter city name"
          disabled={detectState === 'loading'}
          className="rounded-xl px-3 py-2 outline-none disabled:opacity-50 nz-control"
        />
        <button
          type="button"
          onClick={saveManual}
          disabled={detectState === 'loading'}
          className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 nz-primary"
        >
          Save
        </button>
      </div>

      {/* Auto-detect Button */}
      <button
        type="button"
        onClick={detectLocation}
        disabled={detectState === 'loading'}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 nz-control hover:nz-soft"
      >
        {detectState === 'loading' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Detecting location...
          </>
        ) : (
          <>
            <MapPin size={16} />
            Auto-detect location
          </>
        )}
      </button>

      {/* Success Message */}
      {successMsg && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
          <CheckCircle2 size={14} className="flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}
