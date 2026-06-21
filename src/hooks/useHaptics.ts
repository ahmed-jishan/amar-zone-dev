'use client';

import { useCallback, useRef } from 'react';

/**
 * Premium Haptic Feedback Engine
 * Wraps Capacitor Haptics API with graceful fallback to CSS vibration
 * Provides Apple/Samsung-level tactile feedback for every interaction
 */

type HapticType =
  | 'light'        // Button taps, filter selection
  | 'medium'       // Task completion, drag start
  | 'heavy'        // Long-press, destructive actions
  | 'selection'    // Radio/checkbox toggle
  | 'success'      // Task complete, save
  | 'warning'      // Overdue, blocked
  | 'error'        // Delete, failure
  | 'impact'       // Drop, snap
  | 'notification'; // System notification feel

interface HapticOptions {
  duration?: number;  // ms for fallback
}

// CSS vibration fallback for web/non-native environments
function injectVibrationStyle() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('az-haptic-style')) return;
  const style = document.createElement('style');
  style.id = 'az-haptic-style';
  style.textContent = `
    @keyframes az-haptic-vibrate {
      0% { transform: translateX(0); }
      25% { transform: translateX(-1px); }
      50% { transform: translateX(1px); }
      75% { transform: translateX(-1px); }
      100% { transform: translateX(0); }
    }
    .az-haptic-feedback {
      animation: az-haptic-vibrate 60ms ease-out;
    }
  `;
  document.head.appendChild(style);
}

// Lazy init
let styleInjected = false;

export function useHaptics() {
  const lastCallRef = useRef<number>(0);

  const trigger = useCallback(async (type: HapticType, _options?: HapticOptions) => {
    // Throttle: prevent haptic spam (max 1 per 50ms)
    const now = Date.now();
    if (now - lastCallRef.current < 50) return;
    lastCallRef.current = now;

    try {
      // Try Capacitor Haptics first
      const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');

      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'selection':
          await Haptics.selectionStart();
          await Haptics.selectionChanged();
          await Haptics.selectionEnd();
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
        case 'impact':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'notification':
          await Haptics.notification({ type: NotificationType.Success });
          break;
      }
    } catch {
      // Fallback: CSS vibration for web
      if (typeof document === 'undefined') return;
      if (!styleInjected) {
        injectVibrationStyle();
        styleInjected = true;
      }
      const el = document.activeElement || document.body;
      if (el) {
        el.classList.add('az-haptic-feedback');
        setTimeout(() => el.classList.remove('az-haptic-feedback'), 100);
      }
    }
  }, []);

  /** Convenience methods for common interactions */
  const haptics = {
    /** Light tap — buttons, chips, filter pills */
    tap: () => trigger('light'),
    /** Medium impact — task completion, drag start, modal open */
    impact: () => trigger('medium'),
    /** Heavy impact — long press, destructive actions */
    heavy: () => trigger('heavy'),
    /** Selection feedback — checkbox, radio, toggle */
    select: () => trigger('selection'),
    /** Success notification — task complete, save */
    success: () => trigger('success'),
    /** Warning notification — overdue, blocked */
    warn: () => trigger('warning'),
    /** Error notification — delete, failure */
    error: () => trigger('error'),
    /** Drag start feedback */
    dragStart: () => trigger('medium'),
    /** Drop feedback */
    drop: () => trigger('impact'),
    /** Swipe threshold reached */
    swipeThreshold: () => trigger('light'),
    /** Long press detected */
    longPress: () => trigger('heavy'),
  };

  return haptics;
}

export type { HapticType, HapticOptions };