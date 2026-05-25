'use client';

import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { usePrefsStore } from '../../store/prefsStore';
import { useNotifications } from '../../hooks/useNotifications';

export default function ReminderSettings() {
  const remindersEnabled = usePrefsStore((state) => state.remindersEnabled);
  const reminderMinutesBefore = usePrefsStore((state) => state.reminderMinutesBefore);
  const setReminderPrefs = usePrefsStore((state) => state.setReminderPrefs);
  const { permission } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    setIsLoading(true);

    try {
      if (remindersEnabled) {
        // Disable: directly set to false
        setReminderPrefs(false, reminderMinutesBefore);
      } else {
        // Enable: request permission first
        if (!('Notification' in window)) {
          alert('Browser notifications are not supported in this browser.');
          return;
        }

        // Check current permission status
        if (Notification.permission === 'denied') {
          alert('Notification permission is denied. Please enable it in browser settings.');
          return;
        }

        // Request permission if needed
        if (Notification.permission === 'default') {
          const permissionResult = await Notification.requestPermission();
          if (permissionResult !== 'granted') {
            alert('Notification permission denied.');
            return;
          }
        }

        // Permission is granted, enable reminders
        setReminderPrefs(true, reminderMinutesBefore);
      }
    } catch (error) {
      console.error('Error toggling reminders:', error);
      alert('An error occurred while toggling reminders.');
    } finally {
      setIsLoading(false);
    }
  }, [remindersEnabled, reminderMinutesBefore, setReminderPrefs]);

  const handleMinutesChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newMinutes = Number(event.target.value);
      // Keep current enabled state, only update minutes
      setReminderPrefs(remindersEnabled, newMinutes);
    },
    [remindersEnabled, setReminderPrefs]
  );

  return (
    <section className="rounded-2xl p-5 space-y-4 nz-card">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold nz-text">Prayer Reminders</h3>
          <p className="text-sm nz-muted">Browser notifications before each prayer time.</p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isLoading}
          aria-pressed={remindersEnabled}
          className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
            remindersEnabled ? 'nz-primary' : 'nz-control'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              {remindersEnabled ? <Bell size={16} /> : <BellOff size={16} />}
              <span>{remindersEnabled ? 'On' : 'Off'}</span>
            </>
          )}
        </button>
      </div>

      {/* Minutes Before Prayer */}
      <label className="block">
        <span className="text-sm font-medium nz-text">Minutes before prayer</span>
        <input
          type="number"
          min={0}
          max={60}
          value={reminderMinutesBefore}
          onChange={handleMinutesChange}
          disabled={!remindersEnabled || isLoading}
          className="mt-2 w-full rounded-xl px-3 py-2 outline-none disabled:opacity-50 nz-control"
        />
      </label>

      {/* Status Display */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 nz-soft">
          <p className="text-xs font-semibold uppercase tracking-wide nz-muted">Status</p>
          <p className={`mt-1 text-lg font-bold ${remindersEnabled ? 'text-emerald-600' : 'nz-muted'}`}>
            {remindersEnabled ? 'ON' : 'OFF'}
          </p>
        </div>
        <div className="rounded-xl p-3 nz-soft">
          <p className="text-xs font-semibold uppercase tracking-wide nz-muted">Permission</p>
          <p className={`mt-1 text-sm font-semibold ${
            permission === 'granted' ? 'text-emerald-600' :
            permission === 'denied' ? 'text-red-600' :
            'text-amber-600'
          }`}>
            {permission === 'granted' ? 'Granted' :
             permission === 'denied' ? 'Denied' :
             'Ask'}
          </p>
        </div>
      </div>

      {/* Permission Warning */}
      {remindersEnabled && permission !== 'granted' && (
        <div className="rounded-lg p-3 bg-amber-50 border border-amber-200 text-xs text-amber-700">
          <p className="font-semibold mb-1">⚠️ Permission Required</p>
          <p>Notification permission must be granted for prayer reminders to work. Click the toggle above to enable.</p>
        </div>
      )}

      {/* Success Indicator */}
      {remindersEnabled && permission === 'granted' && (
        <div className="rounded-lg p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
          <p className="font-semibold">✓ Ready</p>
          <p>You will receive notifications {reminderMinutesBefore} minutes before each prayer time.</p>
        </div>
      )}
    </section>
  );
}
