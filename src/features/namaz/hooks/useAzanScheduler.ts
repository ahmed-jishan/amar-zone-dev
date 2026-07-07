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

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  // === WEB/BROWSER TIMER: ALWAYS schedule in-app audio playback ===
  // This handles foreground playback on ALL platforms (Web + Native)
  // On native Android, this runs alongside the native AlarmManager scheduling
  // to ensure audio plays even if Android defers/suppresses the native alarm.
  useEffect(() => {
    if (!azanEnabled || !notificationsEnabled || !prayerNotificationsEnabled || !prayerTimes) return;

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

          // Schedule in-app audio playback via setTimeout (ALWAYS, regardless of native support)
          // This ensures audio plays when the app is in the foreground or background (with page active)
          // Native Android AlarmManager is a SEPARATE fallback for cold-start scenarios.
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
  }, [azanEnabled, notificationsEnabled, prayerNotificationsEnabled, prayerTimes, prayerTimePreferences, quietHoursEnabled, quietHoursEnd, quietHoursStart]);

  // === NATIVE ANDROID SCHEDULING (separate, parallel path) ===
  // This uses Android AlarmManager to wake the device and play audio
  // even if the app process is killed by the OS.
  // NOTE: Native Azan scheduling only depends on azanEnabled, NOT on notification settings.
  // The Azan audio plays via a foreground service (AzanPlaybackService) which is independent
  // of notification permissions. Notifications are a separate bonus UI element.
  // We ALSO schedule a Capacitor LocalNotification here so the user sees a system notification
  // with the azan name. The AzanPlaybackService shows its own foreground notification (with
  // Play/Pause/Stop controls), but some Android skins may suppress it. This dual approach
  // ensures the user ALWAYS gets a notification they can interact with.
  useEffect(() => {
    if (!prayerTimes || !isNativeAzanSupported()) return;
    let cancelled = false;

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
      const nextIds = items.map((item) => item.id);
      const enabled = azanEnabled; // Only check azanEnabled - native foreground service plays audio independently

      if (!enabled) {
        const previousIds = nativeScheduledIdsRef.current;
        nativeScheduledIdsRef.current = [];
        void cancelNativeAzan(previousIds);
        return;
      }

      const staleIds = nativeScheduledIdsRef.current.filter((id) => !nextIds.includes(id));
      if (staleIds.length > 0) {
        void cancelNativeAzan(staleIds);
      }
      nativeScheduledIdsRef.current = nextIds;

      // Also schedule a Capacitor notification for each azan (visible even on restrictive Android skins)
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

      const scheduleTimer = window.setTimeout(() => {
        if (cancelled) return;
        void scheduleNativeAzan(items, AZAN_AUDIO_URL);
      }, 1500);

      return () => {
        cancelled = true;
        window.clearTimeout(scheduleTimer);
      };
    } catch (error) {
      console.warn('Native azan scheduler effect error:', error);
      return undefined;
    }
  }, [azanEnabled, notificationsEnabled, prayerNotificationsEnabled, prayerTimes, prayerTimePreferences, quietHoursEnabled, quietHoursEnd, quietHoursStart]);

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
