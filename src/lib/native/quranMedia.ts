'use client';

import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

type QuranMediaNotificationPlugin = {
  update(options: { title: string; subtitle?: string; ayahLine?: string; playing: boolean }): Promise<void>;
  hide(): Promise<void>;
  addListener(
    eventName: 'quranMediaAction',
    listenerFunc: (event: { action: 'playPause' | 'stop' | 'next' | 'previous'; playing?: boolean }) => void
  ): Promise<PluginListenerHandle>;
};

const QuranMediaNotification = registerPlugin<QuranMediaNotificationPlugin>('QuranMediaNotification');

export function isNativeQuranMediaSupported() {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function updateQuranMediaNotification(options: { title: string; subtitle?: string; ayahLine?: string; playing: boolean }) {
  if (!isNativeQuranMediaSupported()) return;
  await QuranMediaNotification.update(options);
}

export async function hideQuranMediaNotification() {
  if (!isNativeQuranMediaSupported()) return;
  await QuranMediaNotification.hide();
}

export async function addQuranMediaActionListener(
  listener: (event: { action: 'playPause' | 'stop' | 'next' | 'previous'; playing?: boolean }) => void
) {
  if (!isNativeQuranMediaSupported()) return undefined;
  return QuranMediaNotification.addListener('quranMediaAction', listener);
}
