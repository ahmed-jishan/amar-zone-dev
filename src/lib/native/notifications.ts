'use client';

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export type AppNotificationPermission = NotificationPermission;

const idByTag = new Map<string, number>();
let channelsReady = false;

export function isNativeNotificationPlatform() {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

function notificationId(tag: string): number {
  const existing = idByTag.get(tag);
  if (existing) return existing;

  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  const id = (hash % 2147483000) + 1;
  idByTag.set(tag, id);
  return id;
}

function permissionFromNative(value?: string): AppNotificationPermission {
  if (value === 'granted') return 'granted';
  if (value === 'denied') return 'denied';
  return 'default';
}

export async function getNotificationPermission(): Promise<AppNotificationPermission> {
  if (typeof window === 'undefined') return 'denied';

  if (isNativeNotificationPlatform()) {
    const status = await LocalNotifications.checkPermissions();
    return permissionFromNative(status.display);
  }

  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function requestAppNotificationPermission(): Promise<AppNotificationPermission> {
  if (typeof window === 'undefined') return 'denied';

  if (isNativeNotificationPlatform()) {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === 'granted' || current.display === 'denied') {
      return permissionFromNative(current.display);
    }
    const next = await LocalNotifications.requestPermissions();
    return permissionFromNative(next.display);
  }

  if (!('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export async function ensureNotificationChannels(): Promise<void> {
  if (!isNativeNotificationPlatform() || channelsReady) return;
  const platform = Capacitor.getPlatform();
  if (platform !== 'android') return;

  await LocalNotifications.createChannel({
    id: 'selfsync_alerts',
    name: 'SelfSync Alerts',
    description: 'Tasks, money, prayer and app reminders',
    importance: 5,
    visibility: 1,
    lights: true,
    vibration: true,
  });
  await LocalNotifications.createChannel({
    id: 'selfsync_azan',
    name: 'Azan Alerts',
    description: 'Prayer time azan reminders',
    importance: 5,
    visibility: 1,
    lights: true,
    vibration: true,
  });
  channelsReady = true;
}

export async function scheduleAppNotification(params: {
  tag: string;
  title: string;
  body: string;
  at: Date;
  channelId?: string;
}): Promise<boolean> {
  const permission = await requestAppNotificationPermission();
  if (permission !== 'granted') return false;

  if (isNativeNotificationPlatform()) {
    await ensureNotificationChannels();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId(params.tag),
          title: params.title,
          body: params.body,
          schedule: { at: params.at, allowWhileIdle: true },
          channelId: params.channelId || 'selfsync_alerts',
          extra: { tag: params.tag },
        },
      ],
    });
    return true;
  }

  return true;
}

export async function cancelAppNotification(tag: string): Promise<void> {
  if (!isNativeNotificationPlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: notificationId(tag) }] });
}

export async function cancelAllAppNotifications(): Promise<void> {
  if (!isNativeNotificationPlatform()) return;
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((item) => ({ id: item.id })) });
  }
}
