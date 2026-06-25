'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePrefsStore } from '../store/prefsStore';
import type { PrayerTimesResponse } from '../types/prayer.types';
import { AZAN_PRAYER_ORDER, buildPrayerDate, formatRemaining, getNextAzan } from '../utils/prayerSchedule';
import { computePrayerTimeConfig } from '../utils/azanJamatConfig';
import type { ConfigurablePrayerName } from '../store/prefsStore';
import { isNativeNotificationPlatform, requestAppNotificationPermission, scheduleAppNotification } from '@/lib/native/notifications';
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

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!azanEnabled || !notificationsEnabled || !prayerNotificationsEnabled || !prayerTimes) return;

    const timers = AZAN_PRAYER_ORDER.map((prayer) => {
      const entry = prayerTimes.timings[prayer];
      // Use user's configured azan time instead of prayer start time
      const config = computePrayerTimeConfig(entry.time, prayerTimePreferences[prayer as ConfigurablePrayerName]);
      const azanTimeStr = config.azanTime;
      const target = buildPrayerDate(azanTimeStr, new Date(), prayerTimes.timezone);
      const delay = target.getTime() - Date.now();
      const key = `${prayerTimes.date}:${prayer}:${azanTimeStr}`;

      if (delay <= 0 || firedRef.current.has(key) || isWithinQuietHours(target, quietHoursEnabled, quietHoursStart, quietHoursEnd)) return null;

      if (isNativeNotificationPlatform()) {
        void (async () => {
          const permission = await requestAppNotificationPermission();
          if (permission !== 'granted') return;
          await scheduleAppNotification({
            tag: key,
            title: `${entry.label} Azan`,
            body: `Azan time at ${azanTimeStr}. Use mobile media controls to pause or resume.`,
            at: target,
            channelId: 'selfsync_azan',
            category: 'prayer',
          });
        })();
      }

      if (isNativeAzanSupported()) return null;

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
    });

    return () => {
      timers.forEach((timer) => {
        if (timer) window.clearTimeout(timer);
      });
    };
  }, [azanEnabled, notificationsEnabled, prayerNotificationsEnabled, prayerTimes, prayerTimePreferences, quietHoursEnabled, quietHoursEnd, quietHoursStart]);

  useEffect(() => {
    if (!azanEnabled || !notificationsEnabled || !prayerNotificationsEnabled || !prayerTimes || !isNativeAzanSupported()) return;
    const items = AZAN_PRAYER_ORDER.map((prayer) => {
      const entry = prayerTimes.timings[prayer];
      // Use user's configured azan time
      const config = computePrayerTimeConfig(entry.time, prayerTimePreferences[prayer as ConfigurablePrayerName]);
      const azanTimeStr = config.azanTime;
      const target = buildPrayerDate(azanTimeStr, new Date(), prayerTimes.timezone);
      return {
        id: `${prayerTimes.date}:${prayer}:${azanTimeStr}`,
        label: entry.label,
        time: target.getTime(),
      };
    }).filter((item) => item.time > Date.now() && !isWithinQuietHours(new Date(item.time), quietHoursEnabled, quietHoursStart, quietHoursEnd));

    void scheduleNativeAzan(items, AZAN_AUDIO_URL).catch((error) => console.warn('Native azan schedule failed:', error));
    return () => {
      void cancelNativeAzan(items.map((item) => item.id)).catch((error) => console.warn('Native azan cancel failed:', error));
    };
  }, [azanEnabled, notificationsEnabled, prayerNotificationsEnabled, prayerTimes, prayerTimePreferences, quietHoursEnabled, quietHoursEnd, quietHoursStart]);

  // Custom getNextAzan that uses user's configured azan times
  const nextAzan = useMemo(() => {
    if (!prayerTimes) return null;
    const timeZone = prayerTimes.timezone || 'Asia/Dhaka';

    for (const prayer of AZAN_PRAYER_ORDER) {
      const entry = prayerTimes.timings[prayer];
      const config = computePrayerTimeConfig(entry.time, prayerTimePreferences[prayer as ConfigurablePrayerName]);
      const azanTarget = buildPrayerDate(config.azanTime, now, timeZone);
      if (azanTarget.getTime() > now.getTime()) {
        return { prayer, label: entry.label, time: config.azanTime, displayTime: config.azanDisplay, target: azanTarget };
      }
    }

    // Next day Fajr
    const fajr = prayerTimes.timings.fajr;
    const config = computePrayerTimeConfig(fajr.time, prayerTimePreferences.fajr);
    const target = buildPrayerDate(config.azanTime, now, timeZone);
    target.setUTCDate(target.getUTCDate() + 1);
    return { prayer: 'fajr' as const, label: fajr.label, time: config.azanTime, displayTime: config.azanDisplay, target };
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
