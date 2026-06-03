'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePrefsStore } from '../store/prefsStore';
import type { PrayerTimesResponse } from '../types/prayer.types';
import { AZAN_PRAYER_ORDER, buildPrayerDate, formatRemaining, getNextAzan } from '../utils/prayerSchedule';
import { isNativeNotificationPlatform, requestAppNotificationPermission, scheduleAppNotification } from '@/lib/native/notifications';
import { cancelNativeAzan, isNativeAzanSupported, scheduleNativeAzan } from '@/lib/native/azan';

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
  const [now, setNow] = useState(new Date());
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!azanEnabled || !prayerTimes) return;

    const timers = AZAN_PRAYER_ORDER.map((prayer) => {
      const entry = prayerTimes.timings[prayer];
      const target = buildPrayerDate(entry.time, new Date(), prayerTimes.timezone);
      const delay = target.getTime() - Date.now();
      const key = `${prayerTimes.date}:${prayer}:${entry.time}`;

      if (delay <= 0 || firedRef.current.has(key)) return null;

      if (isNativeNotificationPlatform()) {
        void (async () => {
          const permission = await requestAppNotificationPermission();
          if (permission !== 'granted') return;
          await scheduleAppNotification({
            tag: key,
            title: `${entry.label} Azan`,
            body: 'Prayer time has started. Use mobile media controls to pause or resume.',
            at: target,
            channelId: 'selfsync_azan',
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
  }, [azanEnabled, prayerTimes]);

  useEffect(() => {
    if (!azanEnabled || !prayerTimes || !isNativeAzanSupported()) return;
    const items = AZAN_PRAYER_ORDER.map((prayer) => {
      const entry = prayerTimes.timings[prayer];
      const target = buildPrayerDate(entry.time, new Date(), prayerTimes.timezone);
      return {
        id: `${prayerTimes.date}:${prayer}:${entry.time}`,
        label: entry.label,
        time: target.getTime(),
      };
    }).filter((item) => item.time > Date.now());

    void scheduleNativeAzan(items, AZAN_AUDIO_URL).catch((error) => console.warn('Native azan schedule failed:', error));
    return () => {
      void cancelNativeAzan(items.map((item) => item.id)).catch((error) => console.warn('Native azan cancel failed:', error));
    };
  }, [azanEnabled, prayerTimes]);

  const nextAzan = useMemo(() => getNextAzan(prayerTimes, now), [prayerTimes, now]);

  return {
    enabled: azanEnabled,
    nextAzan,
    remaining: formatRemaining(nextAzan?.target, now),
  };
}
