'use client';

import methods from '../../data/calculationMethods.json';
import { usePrefsStore } from '../../store/prefsStore';
import type { Madhab } from '../../types/prayer.types';

interface CalculationMethodOption {
  id: number;
  name: string;
  shortName: string;
  description: string;
}

export default function CalculationMethod() {
  const calculationMethod = usePrefsStore((state) => state.calculationMethod);
  const madhab = usePrefsStore((state) => state.madhab);
  const setCalculationMethod = usePrefsStore((state) => state.setCalculationMethod);
  const setMadhab = usePrefsStore((state) => state.setMadhab);

  return (
    <section className="bg-white/70 border border-emerald-100 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-emerald-950">Calculation Method</h3>
        <p className="text-sm text-emerald-700">Choose the prayer-time convention and Asr school.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(methods as CalculationMethodOption[]).map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => setCalculationMethod(method.id)}
            className={`text-left rounded-xl border p-4 transition ${
              calculationMethod === method.id
                ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                : 'border-emerald-100 bg-white/60 text-emerald-900 hover:bg-emerald-50'
            }`}
          >
            <span className="block text-sm font-semibold">{method.shortName}</span>
            <span className="block text-xs text-emerald-700">{method.description}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {([
          { id: 'shafi', label: 'Standard Asr', note: 'Matches Dhaka reference time, e.g. 03:17 PM' },
          { id: 'hanafi', label: 'Hanafi Asr', note: 'Later Asr shadow calculation, e.g. 04:34 PM' },
        ] as const).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMadhab(item.id as Madhab)}
            className={`rounded-xl border p-3 text-left text-sm transition ${
              madhab === item.id
                ? 'border-emerald-500 bg-emerald-600 text-white'
                : 'border-emerald-100 bg-white/70 text-emerald-900 hover:bg-emerald-50'
            }`}
          >
            <span className="block font-semibold">{item.label}</span>
            <span className={`mt-1 block text-xs ${madhab === item.id ? 'text-emerald-50' : 'text-emerald-700'}`}>
              {item.note}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
