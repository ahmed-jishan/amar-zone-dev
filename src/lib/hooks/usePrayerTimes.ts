'use client'
import { useMemo } from 'react'
import { useNamazStore } from '@/lib/store/namazStore'
import { getPrayerTimes } from '@/lib/utils/prayerTimes'
import type { MethodKey } from '@/lib/utils/prayerTimes'
import type { PrayerTimes } from 'adhan'

export function usePrayerTimes(date = new Date()): PrayerTimes | null {
  const { settings } = useNamazStore()
  const dateStr = date.toDateString()

  return useMemo(() => {
    try {
      return getPrayerTimes(
        settings.latitude,
        settings.longitude,
        date,
        settings.calculationMethod as MethodKey
      )
    } catch {
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.latitude, settings.longitude, settings.calculationMethod, dateStr])
}
