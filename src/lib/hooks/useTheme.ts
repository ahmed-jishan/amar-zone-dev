'use client'
import { useEffect } from 'react'
import { useSettingsStore } from '@/lib/store/settingsStore'

export function useTheme() {
  const { settings } = useSettingsStore()

  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark =
      settings.theme === 'dark' || (settings.theme === 'system' && prefersDark)
    root.classList.toggle('dark', isDark)
  }, [settings.theme])
}
