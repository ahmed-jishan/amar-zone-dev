'use client';

import { BellRing, Volume2, VolumeX } from 'lucide-react';
import { usePrefsStore } from '../../store/prefsStore';

const RECITERS = [
  { id: 'alafasy', name: 'Mishary Alafasy', note: 'Clear and calm' },
  { id: 'husary', name: 'Mahmoud Khalil Al-Husary', note: 'Measured tajweed' },
  { id: 'sudais', name: 'Abdul Rahman Al-Sudais', note: 'Haram style' },
] as const;

export default function AzanSettings() {
  const azanEnabled = usePrefsStore((state) => state.azanEnabled);
  const setAzanEnabled = usePrefsStore((state) => state.setAzanEnabled);
  const quranReciter = usePrefsStore((state) => state.quranReciter);
  const setQuranReciter = usePrefsStore((state) => state.setQuranReciter);

  const toggleAzan = async () => {
    const next = !azanEnabled;
    if (next && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    setAzanEnabled(next);
  };

  return (
    <section className="rounded-2xl p-5 space-y-5 nz-card">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 nz-text">
            <BellRing size={18} />
            <h3 className="text-lg font-semibold">Azan System</h3>
          </div>
          <p className="mt-1 text-sm nz-muted">
            Automatic prayer-time audio with device permission awareness.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleAzan}
          aria-pressed={azanEnabled}
          className={`relative h-9 w-16 shrink-0 rounded-full p-1 transition ${
            azanEnabled ? 'nz-primary' : 'nz-soft border border-[var(--nz-border)]'
          }`}
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm transition ${
              azanEnabled ? 'translate-x-7 text-emerald-700' : 'translate-x-0 text-slate-500'
            }`}
          >
            {azanEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 nz-soft">
          <p className="text-xs font-semibold uppercase tracking-wide nz-muted">Status</p>
          <p className={`mt-1 text-lg font-bold ${azanEnabled ? 'nz-accent' : 'nz-muted'}`}>
            {azanEnabled ? 'ON' : 'OFF'}
          </p>
        </div>
        <div className="rounded-xl p-3 nz-soft">
          <p className="text-xs font-semibold uppercase tracking-wide nz-gold">Mode</p>
          <p className="mt-1 text-sm font-semibold nz-text">Non-blocking audio</p>
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-semibold nz-text">Quran reciter</span>
        <select
          value={quranReciter}
          onChange={(event) => setQuranReciter(event.target.value as typeof quranReciter)}
          className="mt-2 w-full rounded-xl px-3 py-3 text-sm outline-none nz-control"
        >
          {RECITERS.map((reciter) => (
            <option key={reciter.id} value={reciter.id}>
              {reciter.name} - {reciter.note}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
