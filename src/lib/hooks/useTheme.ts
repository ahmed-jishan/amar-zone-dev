// lib/hooks/useTheme.ts
import { useEffect } from 'react'
import { useSettingsStore } from '@/features/settings/store/settingsStore'

export function useTheme() {
  const { theme, _hydrated } = useSettingsStore()

  useEffect(() => {
    // Only apply theme after store is hydrated
    if (!_hydrated) return

    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark)

    root.classList.toggle('dark', isDark)
  }, [theme, _hydrated])
}