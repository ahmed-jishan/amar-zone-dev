'use client';

import CalculationMethod from './CalculationMethod';
import LocationPicker from './LocationPicker';
import ReminderSettings from './ReminderSettings';
import { usePrefsStore } from '../../store/prefsStore';

export default function PreferencesView() {
  const ramadanMode = usePrefsStore((state) => state.ramadanMode);
  const travelMode = usePrefsStore((state) => state.travelMode);
  const lifeMode = usePrefsStore((state) => state.lifeMode);
  const setSpecialMode = usePrefsStore((state) => state.setSpecialMode);
  const setLifeMode = usePrefsStore((state) => state.setLifeMode);

  return (
    <div className="space-y-5">
      <LocationPicker />
      <CalculationMethod />
      <ReminderSettings />

      <section className="bg-white/70 border border-emerald-100 rounded-2xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-emerald-950">Special Modes</h3>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm text-emerald-900">
            <input type="checkbox" checked={ramadanMode} onChange={(e) => setSpecialMode('ramadanMode', e.target.checked)} />
            Ramadan mode
          </label>
          <label className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm text-emerald-900">
            <input type="checkbox" checked={travelMode} onChange={(e) => setSpecialMode('travelMode', e.target.checked)} />
            Travel mode
          </label>
          <select
            value={lifeMode}
            onChange={(event) => setLifeMode(event.target.value as typeof lifeMode)}
            className="rounded-xl border border-emerald-100 bg-white px-4 py-2 text-sm text-emerald-900"
          >
            <option value="normal">Normal</option>
            <option value="busy">Busy</option>
            <option value="sick">Sick</option>
            <option value="focus">Focus</option>
          </select>
        </div>
      </section>
    </div>
  );
}
