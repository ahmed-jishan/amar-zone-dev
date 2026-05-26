import { useEffect, useState } from 'react';
import {
  cancelAllPrayerReminders,
  requestNotificationPermission,
  schedulePrayerReminder,
  type ScheduledPrayerNotification,
} from '../utils/notificationManager';
import { getNotificationPermission } from '@/lib/native/notifications';
import { usePrefsStore } from '../store/prefsStore';
import type { PrayerTimesResponse } from '../types/prayer.types';

export function useNotifications(prayerTimes?: PrayerTimesResponse | null) {
  const remindersEnabled = usePrefsStore((state) => state.remindersEnabled);
  const reminderMinutesBefore = usePrefsStore((state) => state.reminderMinutesBefore);
  const setReminderPrefs = usePrefsStore((state) => state.setReminderPrefs);
  const [scheduled, setScheduled] = useState<ScheduledPrayerNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    void getNotificationPermission().then(setPermission);
  }, []);

  useEffect(() => {
    if (!remindersEnabled || !prayerTimes) {
      cancelAllPrayerReminders();
      setScheduled([]);
      return;
    }

    let cancelled = false;
    cancelAllPrayerReminders();
    Promise.all(
      Object.values(prayerTimes.timings).map((time) => schedulePrayerReminder(time, reminderMinutesBefore))
    ).then((items) => {
      if (!cancelled) setScheduled(items.filter(Boolean) as ScheduledPrayerNotification[]);
    });

    return () => {
      cancelled = true;
      cancelAllPrayerReminders();
    };
  }, [prayerTimes, reminderMinutesBefore, remindersEnabled]);

  const enable = async () => {
    const next = await requestNotificationPermission();
    setPermission(next);
    setReminderPrefs(next === 'granted');
    return next;
  };

  return { scheduled, permission, enable, disable: () => setReminderPrefs(false) };
}
