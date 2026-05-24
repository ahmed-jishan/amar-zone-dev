'use client';

import { Bell, BellOff } from 'lucide-react';
import { usePrefsStore } from '../../store/prefsStore';
import { useNotifications } from '../../hooks/useNotifications';

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
    <section className="rounded-2xl p-5 space-y-4 nz-card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold nz-text">Prayer Reminders</h3>
          <p className="text-sm nz-muted">Browser notifications before each prayer time.</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
            remindersEnabled ? 'nz-primary' : 'nz-control'
          }`}
        >
          {remindersEnabled ? <Bell size={16} /> : <BellOff size={16} />}
          {remindersEnabled ? 'On' : 'Off'}
        </button>
      </div>

      <label className="block">
        <span className="text-sm font-medium nz-text">Minutes before prayer</span>
        <input
          type="number"
          min={0}
          max={60}
          value={reminderMinutesBefore}
          onChange={(event) => setReminderPrefs(remindersEnabled, Number(event.target.value))}
          className="mt-2 w-full rounded-xl px-3 py-2 outline-none nz-control"
        />
      </label>

      <p className="text-xs nz-muted">Permission: {permission}</p>
    </section>
  );
}
