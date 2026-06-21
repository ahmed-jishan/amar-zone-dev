/**
 * Haptic feedback utility for Capacitor Haptics plugin.
 * Provides a unified API for haptic feedback across the app.
 * Falls back gracefully on web/non-native platforms.
 */

// Lightweight enum-style constants
export const HapticStyle = {
  /** For subtle feedback like tab switches, button confirms */
  LIGHT: 'light',
  /** For medium impact like prayer status changes, selection changes */
  MEDIUM: 'medium',
  /** For heavy impact like milestone achievements, errors */
  HEAVY: 'heavy',
  /** For selection feedback (click-like) */
  SELECTION: 'selection',
  /** For success notification (double tap) */
  SUCCESS: 'success',
  /** For warning notification */
  WARNING: 'warning',
  /** For error notification */
  ERROR: 'error',
} as const;

type HapticType = (typeof HapticStyle)[keyof typeof HapticStyle];

let hapticsModule: any = null;

async function getHaptics() {
  if (hapticsModule) return hapticsModule;
  try {
    hapticsModule = await import('@capacitor/haptics');
  } catch {
    hapticsModule = { Haptics: null };
  }
  return hapticsModule;
}

/**
 * Trigger haptic feedback. Safely handles non-native environments.
 */
export async function triggerHaptic(type: HapticType): Promise<void> {
  try {
    const { Haptics } = await getHaptics();
    if (!Haptics) return;

    switch (type) {
      case 'light':
        await Haptics.impact({ style: 'Light' }).catch(() => {});
        break;
      case 'medium':
        await Haptics.impact({ style: 'Medium' }).catch(() => {});
        break;
      case 'heavy':
        await Haptics.impact({ style: 'Heavy' }).catch(() => {});
        break;
      case 'selection':
        await Haptics.selectionStart().catch(() => {});
        setTimeout(() => Haptics.selectionEnd().catch(() => {}), 100);
        break;
      case 'success':
        await Haptics.notification({ type: 'Success' }).catch(() => {});
        break;
      case 'warning':
        await Haptics.notification({ type: 'Warning' }).catch(() => {});
        break;
      case 'error':
        await Haptics.notification({ type: 'Error' }).catch(() => {});
        break;
    }
  } catch {
    // Silently fail on non-native platforms
  }
}

/**
 * Quick vibration fallback for browsers (via navigator.vibrate)
 */
export function vibrateBrowser(pattern: number | number[] = 10): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/**
 * Create a haptic tap handler for buttons
 */
export function createHapticHandler(type: HapticType = 'light') {
  return () => {
    triggerHaptic(type).catch(() => {});
    vibrateBrowser(5);
  };
}