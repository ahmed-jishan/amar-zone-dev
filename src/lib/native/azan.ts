'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';

type AzanScheduleItem = {
  id: string;
  label: string;
  time: number;
  prayerName: string;
  timeString: string;
};

type AzanNativePlugin = {
  schedule(options: { items: AzanScheduleItem[]; audioUrl?: string }): Promise<void>;
  cancelAll(options: { ids: string[] }): Promise<void>;
};

const AzanNative = registerPlugin<AzanNativePlugin>('AzanNative');

export function isNativeAzanSupported() {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function scheduleNativeAzan(items: AzanScheduleItem[], audioUrl?: string) {
  if (!isNativeAzanSupported() || items.length === 0) return;
  try {
    await AzanNative.schedule({ items, audioUrl });
  } catch (error) {
    console.warn('Native azan schedule failed:', error);
  }
}

export async function cancelNativeAzan(ids: string[]) {
  if (!isNativeAzanSupported() || ids.length === 0) return;
  try {
    await AzanNative.cancelAll({ ids });
  } catch (error) {
    console.warn('Native azan cancel failed:', error);
  }
}
