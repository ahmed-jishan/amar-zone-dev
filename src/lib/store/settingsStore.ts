import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings } from '@/lib/types'

interface SettingsState {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        theme: 'system',
        language: 'bn',
        currency: 'BDT',
        currency_symbol: '৳',
        pinEnabled: false,
        onboardingComplete: false,
      },
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),
    }),
    { name: 'amar-zone-settings' }
  )
)
