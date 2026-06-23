'use client'

import { useCallback } from 'react'
import { triggerHaptic } from '@/lib/native/haptics'

/**
 * Unified haptic feedback hook for money tab interactions.
 * Provides consistent haptic patterns across all components.
 */
export function useMoneyHaptics() {
  const tap = useCallback(() => {
    triggerHaptic('light').catch(() => {})
  }, [])

  const tapMedium = useCallback(() => {
    triggerHaptic('medium').catch(() => {})
  }, [])

  const success = useCallback(() => {
    triggerHaptic('success').catch(() => {})
  }, [])

  const warning = useCallback(() => {
    triggerHaptic('warning').catch(() => {})
  }, [])

  const errorFeedback = useCallback(() => {
    triggerHaptic('error').catch(() => {})
  }, [])

  const tabChange = useCallback(() => {
    triggerHaptic('selection').catch(() => {})
  }, [])

  const deleteAction = useCallback(() => {
    triggerHaptic('medium').catch(() => {})
  }, [])

  return { tap, tapMedium, success, warning, errorFeedback, tabChange, deleteAction }
}
