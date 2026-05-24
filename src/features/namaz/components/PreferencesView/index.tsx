'use client';

import CalculationMethod from './CalculationMethod';
import LocationPicker from './LocationPicker';
import ReminderSettings from './ReminderSettings';
import AzanSettings from './AzanSettings';
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
      <AzanSettings />

      <section className="rounded-2xl p-5 space-y-4 nz-card">
        <h3 className="text-lg font-semibold nz-text">Special Modes</h3>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm nz-control">
            <input type="checkbox" checked={ramadanMode} onChange={(e) => setSpecialMode('ramadanMode', e.target.checked)} />
            Ramadan mode
          </label>
          <label className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm nz-control">
            <input type="checkbox" checked={travelMode} onChange={(e) => setSpecialMode('travelMode', e.target.checked)} />
            Travel mode
          </label>
          <select
            value={lifeMode}
            onChange={(event) => setLifeMode(event.target.value as typeof lifeMode)}
            className="rounded-xl px-4 py-2 text-sm nz-control"
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
