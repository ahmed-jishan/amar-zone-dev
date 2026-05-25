'use client';

import { useState, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePrefsStore } from '../../store/prefsStore';

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

  const detectLocation = useCallback(() => {
    setError(null);
    setSuccessMsg(null);
    setDetectState('loading');

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      setDetectState('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          // Reverse geocode to get city name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );

          if (!response.ok) throw new Error('Failed to get location name');

          const data = await response.json();
          const detectedCity = 
            data.address?.city || 
            data.address?.town || 
            data.address?.municipality ||
            data.address?.village || 
            'Unknown location';

          setLocation({
            latitude: lat,
            longitude: lng,
            city: detectedCity,
            accuracy: position.coords.accuracy,
            source: 'device',
            updatedAt: Date.now(),
          });
          setAutoDetectLocation(true);
          setCity(detectedCity);
          setSuccessMsg(`Location detected: ${detectedCity}`);
          setDetectState('success');

          // Clear success message after 2 seconds
          setTimeout(() => setSuccessMsg(null), 2000);
        } catch (err) {
          console.error('Reverse geocode failed:', err);
          // Fallback: save location without city name
          setLocation({
            latitude: lat,
            longitude: lng,
            city: 'Current location',
            accuracy: position.coords.accuracy,
            source: 'device',
            updatedAt: Date.now(),
          });
          setAutoDetectLocation(true);
          setCity('Current location');
          setSuccessMsg('Location saved (city name unavailable)');
          setDetectState('success');
          setTimeout(() => setSuccessMsg(null), 2000);
        }
      },
      (geoError) => {
        let message = 'Unable to detect location';
        
        if (geoError.code === 1) {
          message = 'Location permission denied. Enable it in browser settings.';
        } else if (geoError.code === 2) {
          message = 'Location service unavailable. Try again later.';
        } else if (geoError.code === 3) {
          message = 'Location request timed out. Please try again.';
        }
        
        setError(message);
        setDetectState('error');
        console.error('Geolocation error:', geoError.code, geoError.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
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
