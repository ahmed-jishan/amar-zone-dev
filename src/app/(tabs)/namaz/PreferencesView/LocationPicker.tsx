'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { usePrefsStore } from '../store2/prefsStore';

export default function LocationPicker() {
  const location = usePrefsStore((state) => state.location);
  const autoDetectLocation = usePrefsStore((state) => state.autoDetectLocation);
  const setLocation = usePrefsStore((state) => state.setLocation);
  const setAutoDetectLocation = usePrefsStore((state) => state.setAutoDetectLocation);
  const [city, setCity] = useState(location.city ?? '');
  const [error, setError] = useState<string | null>(null);

  const detectLocation = () => {
    setError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          city: city || 'Current location',
        });
        setAutoDetectLocation(true);
      },
      () => setError('Unable to detect location. Please enter it manually.')
    );
  };

  const saveManual = () => {
    setLocation({ ...location, city: city.trim() || 'Manual location' });
    setAutoDetectLocation(false);
  };

  return (
    <section className="bg-white/70 border border-emerald-100 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-emerald-950">Location</h3>
        <p className="text-sm text-emerald-700">Prayer times are calculated from your saved coordinates.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="City name"
          className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-200"
        />
        <button
          type="button"
          onClick={saveManual}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Save
        </button>
      </div>

      <button
        type="button"
        onClick={detectLocation}
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800"
      >
        <MapPin size={16} />
        Auto-detect location
      </button>

      <div className="text-xs text-emerald-700">
        {autoDetectLocation ? 'Auto detection enabled' : 'Manual mode'} · {location.latitude.toFixed(4)},{' '}
        {location.longitude.toFixed(4)}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
