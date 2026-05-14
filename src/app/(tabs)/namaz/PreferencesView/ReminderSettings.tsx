'use client';

import { Bell, BellOff } from 'lucide-react';
import { usePrefsStore } from '../store2/prefsStore';
import { useNotifications } from '../hooks2/useNotifications';

export default function ReminderSettings() {
  const remindersEnabled = usePrefsStore((state) => state.remindersEnabled);
  const reminderMinutesBefore = usePrefsStore((state) => state.reminderMinutesBefore);
  const setReminderPrefs = usePrefsStore((state) => state.setReminderPrefs);
  const { enable, disable, permission } = useNotifications();

  const toggle = async () => {
    if (remindersEnabled) {
      disable();
      return;
    }
    await enable();
  };

  return (
    <section className="bg-white/70 border border-emerald-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-emerald-950">Prayer Reminders</h3>
          <p className="text-sm text-emerald-700">Browser notifications before each prayer time.</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
            remindersEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {remindersEnabled ? <Bell size={16} /> : <BellOff size={16} />}
          {remindersEnabled ? 'On' : 'Off'}
        </button>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-emerald-900">Minutes before prayer</span>
        <input
          type="number"
          min={0}
          max={60}
          value={reminderMinutesBefore}
          onChange={(event) => setReminderPrefs(remindersEnabled, Number(event.target.value))}
          className="mt-2 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </label>

      <p className="text-xs text-emerald-600">Permission: {permission}</p>
    </section>
  );
}
