'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';

type AzanScheduleItem = {
  id: string;
  label: string;
  time: number;
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
  await AzanNative.schedule({ items, audioUrl });
}

export async function cancelNativeAzan(ids: string[]) {
  if (!isNativeAzanSupported() || ids.length === 0) return;
  await AzanNative.cancelAll({ ids });
}
