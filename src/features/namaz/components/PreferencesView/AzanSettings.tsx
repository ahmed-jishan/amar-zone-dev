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
    <section className="bg-white/75 border border-emerald-100 rounded-2xl p-5 space-y-5 shadow-sm shadow-emerald-900/5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-emerald-950">
            <BellRing size={18} />
            <h3 className="text-lg font-semibold">Azan System</h3>
          </div>
          <p className="mt-1 text-sm text-emerald-700">
            Automatic prayer-time audio with device permission awareness.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleAzan}
          aria-pressed={azanEnabled}
          className={`relative h-9 w-16 shrink-0 rounded-full p-1 transition ${
            azanEnabled ? 'bg-emerald-600' : 'bg-slate-200'
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
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Status</p>
          <p className={`mt-1 text-lg font-bold ${azanEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
            {azanEnabled ? 'ON' : 'OFF'}
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Mode</p>
          <p className="mt-1 text-sm font-semibold text-amber-900">Non-blocking audio</p>
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-emerald-950">Quran reciter</span>
        <select
          value={quranReciter}
          onChange={(event) => setQuranReciter(event.target.value as typeof quranReciter)}
          className="mt-2 w-full rounded-xl border border-emerald-100 bg-white px-3 py-3 text-sm text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-200"
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
