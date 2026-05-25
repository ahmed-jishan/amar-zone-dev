// features/settings/store/settingsStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type Language = 'bn' | 'en'

export interface AppSettings {
  theme: Theme
  language: Language
  currency: 'BDT' | 'USD'
  currency_symbol: string
  pinEnabled: boolean
  pinHash?: string
  biometricLockEnabled: boolean
  onboardingComplete: boolean
  notificationsEnabled: boolean
  calculatorEnabled: boolean
  notificationCategories: {
    tasks: boolean
    money: boolean
    prayer: boolean
  }
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  autoLockEnabled: boolean
  autoLockMinutes: number
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'bn',
  currency: 'BDT',
  currency_symbol: '৳',
  pinEnabled: false,
  biometricLockEnabled: false,
  onboardingComplete: true,
  notificationsEnabled: true,
  calculatorEnabled: true,
  notificationCategories: {
    tasks: true,
    money: true,
    prayer: true,
  },
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  autoLockEnabled: false,
  autoLockMinutes: 10,
}

// Helper to apply theme to document root
function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

interface SettingsStore extends AppSettings {
  update: (patch: Partial<AppSettings>) => void
  toggleTheme: () => void
  _hydrated: boolean
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      _hydrated: false,
      update: (patch) => {
        set(patch)
        if (patch.theme !== undefined) {
          applyThemeToDOM(patch.theme)
        }
      },
      toggleTheme: () => {
        const current = get().theme
        const next: Theme = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light'
        set({ theme: next })
        applyThemeToDOM(next)
      },
    }),
    {
      name: 'selfsync-settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDOM(state.theme)
          ;(state as any)._hydrated = true
        }
      },
    }
  )
)
