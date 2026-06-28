// ─── Post-Sync Store Rehydration ──────────────────────────────────────────────
// After a WebRTC / QR / File restore writes fresh data to localStorage,
// all Zustand-persisted stores need to rehydrate from localStorage so their
// in-memory state reflects the new data. Plain stores dispatch a custom event.
//
// Call this AFTER restoreBackup() succeeds.
// ───────────────────────────────────────────────────────────────────────────────

import { useTaskStore } from '@/lib/store/taskStore'
import { useMoneyStore } from '@/features/money/store/moneyStore'
import { useNamazStore } from '@/features/namaz/store/namazStore'
import { usePrefsStore } from '@/features/namaz/store/prefsStore'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { useLogsStore } from '@/features/namaz/store/logsStore'
import { useTasbihStore } from '@/features/namaz/store/tasbihStore'
import { useQuranStore } from '@/features/namaz/store/quranStore'
import { useDuaStore } from '@/features/namaz/store/duaStore'
import { useAIStore } from '@/lib/ai/store'
import { repairPersistedMoneyConsistency } from '@/lib/backup/money-consistency'
import { useState, useEffect } from 'react'

/**
 * Custom event name dispatched when plain (non-Zustand) stores get new data.
 * Components that read from plain localStorage can listen to this event
 * and re-read their data.
 */
export const SYNC_DATA_REFRESH_EVENT = 'selfsync:data-refreshed'

/**
 * Dispatch a custom DOM event to signal that plain localStorage data has changed.
 * Notes, Health/BMI, and Namaz extras stores are plain — they listen for this.
 */
export function dispatchDataRefreshEvent(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SYNC_DATA_REFRESH_EVENT, {
    detail: { timestamp: Date.now() },
  }))
}

/**
 * Force-rehydrate ALL Zustand persisted stores from localStorage.
 * After a sync/restore, localStorage contains fresh data but the stores'
 * in-memory state is stale. Rehydrate() reads localStorage and updates state.
 */
export function rehydrateAllStores(): void {
  if (typeof window === 'undefined') return

  repairPersistedMoneyConsistency()

  // Main stores (used in backup/restore)
  rehydrateStore('useTaskStore',     () => { useTaskStore.persist.rehydrate() })
  rehydrateStore('useMoneyStore',    () => { useMoneyStore.persist.rehydrate() })
  rehydrateStore('useNamazStore',    () => { useNamazStore.persist.rehydrate() })
  rehydrateStore('usePrefsStore',    () => { usePrefsStore.persist.rehydrate() })
  rehydrateStore('useSettingsStore', () => { useSettingsStore.persist.rehydrate() })

  // Secondary namaz stores
  rehydrateStore('useLogsStore',     () => { useLogsStore?.persist?.rehydrate() })
  rehydrateStore('useTasbihStore',   () => { useTasbihStore?.persist?.rehydrate() })
  rehydrateStore('useQuranStore',    () => { useQuranStore?.persist?.rehydrate() })
  rehydrateStore('useDuaStore',      () => { useDuaStore?.persist?.rehydrate() })

  // AI store
  rehydrateStore('useAIStore',       () => { useAIStore?.persist?.rehydrate() })

  // Dispatch event for plain stores (notes, health, namaz extras)
  dispatchDataRefreshEvent()
}

/**
 * React hook — call in any component that needs to react to sync data refreshes.
 * Returns a counter that increments every time data is refreshed via sync.
 * Use as a dependency in useEffect / useMemo that reads plain stores.
 *
 * @example
 * ```tsx
 * const refreshCount = useDataRefreshListener()
 * const notes = useMemo(() => loadNotes(), [refreshCount])
 * ```
 */
export function useDataRefreshListener(): number {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const handler = () => setVersion(v => v + 1)
    window.addEventListener(SYNC_DATA_REFRESH_EVENT, handler)
    return () => window.removeEventListener(SYNC_DATA_REFRESH_EVENT, handler)
  }, [])

  return version
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rehydrateStore(name: string, fn: () => void): void {
  try {
    fn()
  } catch (err) {
    // Silently skip stores that aren't loaded yet
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SyncRehydration] Skipped ${name}:`, err)
    }
  }
}
