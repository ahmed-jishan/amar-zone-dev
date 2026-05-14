'use client';

import methods from '../data/calculationMethods.json';
import { usePrefsStore } from '../store2/prefsStore';
import type { Madhab } from '../types2/prayer.types';

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

      <div className="inline-flex rounded-xl border border-emerald-100 bg-white/70 p-1">
        {(['shafi', 'hanafi'] as Madhab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMadhab(item)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              madhab === item ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </section>
  );
}
