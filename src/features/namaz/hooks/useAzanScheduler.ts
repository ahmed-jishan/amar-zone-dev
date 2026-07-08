'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePrefsStore } from '../store/prefsStore';
import type { PrayerTimesResponse } from '../types/prayer.types';
import { AZAN_PRAYER_ORDER, buildPrayerDate, formatRemaining, getNextAzan } from '../utils/prayerSchedule';
import { computePrayerTimeConfig } from '../utils/azanJamatConfig';
import type { ConfigurablePrayerName } from '../store/prefsStore';
import { getNotificationPermission, isNativeNotificationPlatform, scheduleAppNotification } from '@/lib/native/notifications';
import { cancelNativeAzan, isNativeAzanSupported, scheduleNativeAzan } from '@/lib/native/azan';
import { useSettingsStore } from '@/features/settings/store/settingsStore';

const AZAN_AUDIO_URL = 'https://www.islamcan.com/audio/adhan/azan1.mp3';
let currentAzanAudio: HTMLAudioElement | null = null;

function updateAzanMediaSession(label: string): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: `${label} Azan`,
    artist: 'SelfSync',
    album: 'Prayer Time',
  });
  navigator.mediaSession.setActionHandler('play', () => {
    currentAzanAudio?.play().catch(() => undefined);
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    currentAzanAudio?.pause();
  });
}

function playAzan(label: string): void {
  if (typeof window === 'undefined') return;

  currentAzanAudio?.pause();
  const audio = new Audio(AZAN_AUDIO_URL);
  currentAzanAudio = audio;
  audio.preload = 'auto';
  audio.volume = 0.85;
  updateAzanMediaSession(label);
  audio.play().catch(() => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance('Prayer time has started');
    utterance.rate = 0.9;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  });
}

export function useAzanScheduler(prayerTimes?: PrayerTimesResponse | null) {
  const azanEnabled = usePrefsStore((state) => state.azanEnabled);
  const prayerTimePreferences = usePrefsStore((state) => state.prayerTimePreferences);
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const prayerNotificationsEnabled = useSettingsStore((state) => state.notificationCategories.prayer);
  const quietHoursEnabled = useSettingsStore((state) => state.quietHoursEnabled);
  const quietHoursStart = useSettingsStore((state) => state.quietHoursStart);
  const quietHoursEnd = useSettingsStore((state) => state.quietHoursEnd);
  const [now, setNow] = useState(new Date());
  const firedRef = useRef<Set<string>>(new Set());
  const nativeScheduledIdsRef = useRef<string[]>([]);
  const lastWebScheduledDateRef = useRef<string>('');
  const lastNativeScheduledDateRef = useRef<string>('');

  // Track current time for UI display updates (no second-level dependencies needed for scheduling)
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  // === DAILY DATE CHANGE DETECTOR ===
  // Runs every 60s to detect date boundary crossing and clear fired/native refs.
  // This lets us remove `now` from scheduling effect dependencies,
  // preventing the bug where setTimeout-based native scheduling gets cancelled
  // by rapid re-renders every second.
  useEffect(() => {
    const check = () => {
      const today = new Date().toDateString();
      const webDate = lastWebScheduledDateRef.current;
      const nativeDate = lastNativeScheduledDateRef.current;

      // If today doesn't match what we've scheduled, clear refs so effects re-schedule
      if (webDate !== today) {
        lastWebScheduledDateRef.current = '';
        firedRef.current = new Set();
      }
      if (nativeDate !== today) {
        lastNativeScheduledDateRef.current = '';
        firedRef.current = new Set();
      }
    };

    const interval = window.setInterval(check, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  // === WEB/BROWSER TIMER: ALWAYS schedule in-app audio playback ===
  // This handles foreground playback on ALL platforms (Web + Native)
  // On native Android, this runs alongside the native AlarmManager scheduling
  // to ensure audio plays even if Android defers/suppresses the native alarm.
  // NOTE: `now` is intentionally NOT in deps — we use `Date.now()` inside.
  // The date-change detector above handles daily re-scheduling.
  useEffect(() => {
    if (!azanEnabled || !notificationsEnabled || !prayerNotificationsEnabled || !prayerTimes) return;

    // Check if the date has changed — if same date as last scheduled, skip re-scheduling
    const todayDate = new Date().toDateString();
    if (lastWebScheduledDateRef.current === todayDate) return;
    lastWebScheduledDateRef.current = todayDate;
    // Clear firedRef for the new day so prayers can fire again
    firedRef.current = new Set();

    try {
      const timers = AZAN_PRAYER_ORDER.map((prayer) => {
        try {
          const entry = prayerTimes.timings[prayer];
          if (!entry || !entry.time) return null;
          // Use user's configured azan time instead of prayer start time
          const config = computePrayerTimeConfig(entry.time, prayerTimePreferences[prayer as ConfigurablePrayerName]);
          const azanTimeStr = config.azanTime;
          const target = buildPrayerDate(azanTimeStr, new Date(), prayerTimes.timezone);
          const delay = target.getTime() - Date.now();
          const key = `${prayerTimes.date}:${prayer}:${azanTimeStr}`;

          if (delay <= 0 || firedRef.current.has(key) || isWithinQuietHours(target, quietHoursEnabled, quietHoursStart, quietHoursEnd)) return null;

          if (isNativeNotificationPlatform()) {
            void (async () => {
              try {
                const permission = await getNotificationPermission();
                if (permission !== 'granted') return;
                await scheduleAppNotification({
                  tag: key,
                  title: `${entry.label} Azan`,
                  body: `Azan time at ${azanTimeStr}. Use mobile media controls to pause or resume.`,
                  at: target,
                  channelId: 'selfsync_azan',
                  category: 'prayer',
                });
              } catch (error) {
                console.warn('Failed to schedule azan notification:', error);
              }
            })();
          }

          // Schedule in-app audio playback via setTimeout
          return window.setTimeout(() => {
            firedRef.current.add(key);
            playAzan(entry.label);
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`${entry.label} Azan`, {
                body: 'Prayer time has started. Use mobile media controls to pause or resume.',
                tag: key,
              });
            }
          }, delay);
        } catch (error) {
          console.warn(`Failed to schedule azan for ${prayer}:`, error);
          return null;
        }
      });

      return () => {
        timers.forEach((timer) => {
          if (timer) window.clearTimeout(timer);
        });
      };
    } catch (error) {
      console.warn('Azan scheduler effect error:', error);
      return undefined;
    }
  // CRITICAL: `now` removed from deps to prevent 1-second re-renders from
  // cancelling the timers before they fire. Date-change detection is handled
  // by a separate 60-second interval above.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [azanEnabled, notificationsEnabled, prayerNotificationsEnabled, prayerTimes, prayerTimePreferences, quietHoursEnabled, quietHoursEnd, quietHoursStart]);

  // === NATIVE ANDROID SCHEDULING (separate, parallel path) ===
  // This uses Android AlarmManager to wake the device and play audio
  // even if the app process is killed by the OS.
  // NOTE: The `now` dependency is intentionally removed — the 60s date-change
  // detector above handles daily re-scheduling. This prevents the critical bug
  // where the 1500ms setTimeout for scheduleNativeAzan was being cancelled
  // by React's cleanup on every 1-second re-render.
  useEffect(() => {
    if (!prayerTimes || !isNativeAzanSupported()) return;

    // Check if the date has changed — if same date as last scheduled, skip re-scheduling
    const todayDate = new Date().toDateString();
    if (lastNativeScheduledDateRef.current === todayDate) return;
    lastNativeScheduledDateRef.current = todayDate;
    // Clear firedRef for the new day so prayers can fire again
    firedRef.current = new Set();

    try {
      const items = AZAN_PRAYER_ORDER.map((prayer) => {
        try {
          const entry = prayerTimes.timings[prayer];
          if (!entry || !entry.time) return null;
          const config = computePrayerTimeConfig(entry.time, prayerTimePreferences[prayer as ConfigurablePrayerName]);
          const azanTimeStr = config.azanTime;
          const target = buildPrayerDate(azanTimeStr, new Date(), prayerTimes.timezone);
          return {
            id: `${prayerTimes.date}:${prayer}:${azanTimeStr}`,
            label: entry.label,
            time: target.getTime(),
          };
        } catch (error) {
          console.warn(`Failed to compute native azan time for ${prayer}:`, error);
          return null;
        }
      }).filter((item): item is NonNullable<typeof item> => item !== null && item.time > Date.now() && !isWithinQuietHours(new Date(item.time), quietHoursEnabled, quietHoursStart, quietHoursEnd));

      const enabled = azanEnabled;

      if (!enabled) {
        const previousIds = nativeScheduledIdsRef.current;
        nativeScheduledIdsRef.current = [];
        void cancelNativeAzan(previousIds);
        return;
      }

      const nextIds = items.map((item) => item.id);
      const staleIds = nativeScheduledIdsRef.current.filter((id) => !nextIds.includes(id));
      if (staleIds.length > 0) {
        void cancelNativeAzan(staleIds);
      }
      nativeScheduledIdsRef.current = nextIds;

      // Schedule Capacitor notifications for each azan (visible even on restrictive Android skins)
      for (const item of items) {
        const targetDate = new Date(item.time);
        const key = item.id;
        void (async () => {
          try {
            const permission = await getNotificationPermission();
            if (permission !== 'granted') return;
            await scheduleAppNotification({
              tag: key,
              title: `${item.label} Azan`,
              body: `Azan time. Use phone controls to pause or stop.`,
              at: targetDate,
              channelId: 'selfsync_azan',
              category: 'prayer',
            });
          } catch (err) {
            console.warn('Failed to schedule native azan notification:', err);
          }
        })();
      }

      // Schedule native Android AlarmManager alarms DIRECTLY (no setTimeout wrapper)
      // The old setTimeout(1500ms) was getting cancelled by React cleanup on every
      // second-level re-render due to `now` in deps. With `now` removed from deps,
      // this runs once per configuration change and directly schedules the alarms.
      void scheduleNativeAzan(items, AZAN_AUDIO_URL);
    } catch (error) {
      console.warn('Native azan scheduler effect error:', error);
      return undefined;
    }
  // CRITICAL: `now` removed from deps to prevent the 1500ms native alarm
  // scheduling setTimeout from being cancelled by React cleanup on every
  // 1-second re-render. Date-change detection is handled by the 60s interval above.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [azanEnabled, prayerNotificationsEnabled, prayerTimes, prayerTimePreferences, quietHoursEnabled, quietHoursEnd, quietHoursStart]);

  // Custom getNextAzan that uses user's configured azan times
  const nextAzan = useMemo(() => {
    if (!prayerTimes) return null;
    const timeZone = prayerTimes.timezone || 'Asia/Dhaka';

    try {
      for (const prayer of AZAN_PRAYER_ORDER) {
        const entry = prayerTimes.timings[prayer];
        if (!entry || !entry.time) continue;
        const config = computePrayerTimeConfig(entry.time, prayerTimePreferences[prayer as ConfigurablePrayerName]);
        const azanTarget = buildPrayerDate(config.azanTime, now, timeZone);
        if (azanTarget.getTime() > now.getTime()) {
          return { prayer, label: entry.label, time: config.azanTime, displayTime: config.azanDisplay, target: azanTarget };
        }
      }

      // Next day Fajr
      const fajr = prayerTimes.timings.fajr;
      if (!fajr || !fajr.time) return null;
      const config = computePrayerTimeConfig(fajr.time, prayerTimePreferences.fajr);
      const target = buildPrayerDate(config.azanTime, now, timeZone);
      target.setUTCDate(target.getUTCDate() + 1);
      return { prayer: 'fajr' as const, label: fajr.label, time: config.azanTime, displayTime: config.azanDisplay, target };
    } catch (error) {
      console.warn('nextAzan computation error:', error);
      return null;
    }
  }, [prayerTimes, now, prayerTimePreferences]);

  return {
    enabled: azanEnabled,
    nextAzan,
    remaining: formatRemaining(nextAzan?.target, now),
  };
}

function isWithinQuietHours(date: Date, enabled: boolean, startValue: string, endValue: string): boolean {
  if (!enabled) return false;
  const [startH, startM] = startValue.split(':').map((value) => Number(value));
  const [endH, endM] = endValue.split(':').map((value) => Number(value));
  if (Number.isNaN(startH) || Number.isNaN(startM) || Number.isNaN(endH) || Number.isNaN(endM)) return false;

  const start = new Date(date);
  start.setHours(startH, startM, 0, 0);
  const end = new Date(date);
  end.setHours(endH, endM, 0, 0);
  if (start.getTime() === end.getTime()) return true;
  if (start < end) return date >= start && date <= end;
  return date >= start || date <= end;
}
