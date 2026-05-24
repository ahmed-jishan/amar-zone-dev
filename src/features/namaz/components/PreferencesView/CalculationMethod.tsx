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
    <section className="rounded-2xl p-5 space-y-4 nz-card">
      <div>
        <h3 className="text-lg font-semibold nz-text">Calculation Method</h3>
        <p className="text-sm nz-muted">Choose the prayer-time convention and Asr school.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(methods as CalculationMethodOption[]).map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => setCalculationMethod(method.id)}
            className={`text-left rounded-xl border p-4 transition ${
              calculationMethod === method.id
                ? 'nz-primary border-transparent'
                : 'nz-control'
            }`}
          >
            <span className="block text-sm font-semibold">{method.shortName}</span>
            <span className={`block text-xs ${calculationMethod === method.id ? 'text-white/80' : 'nz-muted'}`}>{method.description}</span>
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
                ? 'nz-primary border-transparent'
                : 'nz-control'
            }`}
          >
            <span className="block font-semibold">{item.label}</span>
            <span className={`mt-1 block text-xs ${madhab === item.id ? 'text-white/80' : 'nz-muted'}`}>
              {item.note}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
