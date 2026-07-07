'use client'

import { useCallback, useRef } from 'react'
import { triggerHaptic } from '@/lib/native/haptics'

/**
 * ─── Premium Haptic Feedback System ───
 *
 * Apple/Haptic Engine refined feedback patterns for Money Tab.
 * All patterns gracefully degrade on unsupported devices.
 *
 * Pattern Guide:
 *   light     → Subtle tap (buttons, chips, small toggles)
 *   medium    → Standard press (cards, list items, tabs)
 *   selection → Tab switch, segment control change
 *   success   → Transaction complete, goal reached
 *   warning   → Budget alert, unusual spending
 *   error     → Insufficient funds, invalid input
 *   heavy     → Destructive action (delete, clear)
 *   double    → Rapid double tap (for confirmations)
 *   tick      → Incremental tick (slider, counter)
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error'
type HapticSequence = HapticPattern | HapticPattern[]

export function useMoneyHaptics() {
  // Throttle to prevent rapid-fire haptics (max 1 per 50ms)
  const lastHapticRef = useRef(0)
  const THROTTLE_MS = 50

  const fire = useCallback(async (pattern: HapticPattern) => {
    const now = Date.now()
    if (now - lastHapticRef.current < THROTTLE_MS) return
    lastHapticRef.current = now
    try {
      await triggerHaptic(pattern)
    } catch {
      // Silently degrade on unsupported devices
    }
  }, [])

  const sequence = useCallback(async (patterns: HapticPattern[]) => {
    for (const p of patterns) {
      await fire(p)
      // Small inter-pattern delay for tactile rhythm
      await new Promise(r => setTimeout(r, 60))
    }
  }, [fire])

  const tap = useCallback(() => { void fire('light') }, [fire])
  const tapMedium = useCallback(() => { void fire('medium') }, [fire])
  const heavy = useCallback(() => { void fire('heavy') }, [fire])
  const success = useCallback(() => { void sequence(['medium', 'light']) }, [sequence])
  const warning = useCallback(() => { void sequence(['warning', 'light']) }, [sequence])
  const errorFeedback = useCallback(() => { void fire('error') }, [fire])
  const tabChange = useCallback(() => { void fire('selection') }, [fire])
  const deleteAction = useCallback(() => { void fire('heavy') }, [fire])
  const confirmAction = useCallback(() => { void sequence(['light', 'light']) }, [sequence])
  const amountChange = useCallback(() => { void fire('light') }, [fire])

  return {
    tap, tapMedium, heavy, success, warning, errorFeedback,
    tabChange, deleteAction, confirmAction, amountChange,
    fire, sequence,
  }
}
