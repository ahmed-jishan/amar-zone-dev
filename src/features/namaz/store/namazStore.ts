import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PrayerRecord, PrayerName, PrayerStatus, NamazSettings } from '@/lib/types'

interface NamazState {
  records: PrayerRecord[]
  settings: NamazSettings
  updatePrayerStatus: (date: string, prayer: PrayerName, status: PrayerStatus) => void
  getRecord: (date: string) => PrayerRecord | undefined
  updateSettings: (s: Partial<NamazSettings>) => void
}

const defaultSettings: NamazSettings = {
  latitude: 23.8103,
  longitude: 90.4125,
  calculationMethod: 'Karachi',
  adhanEnabled: true,
  reminderMinutesBefore: 10,
}

const emptyPrayers = (): Record<PrayerName, PrayerStatus> => ({
  Fajr: 'pending', Dhuhr: 'pending', Asr: 'pending',
  Maghrib: 'pending', Isha: 'pending',
})

export const useNamazStore = create<NamazState>()(
  persist(
    (set, get) => ({
      records: [],
      settings: defaultSettings,

      updatePrayerStatus: (date, prayer, status) => set((state) => {
        const existing = state.records.find((r) => r.date === date)
        if (existing) {
          return {
            records: state.records.map((r) =>
              r.date === date ? { ...r, prayers: { ...r.prayers, [prayer]: status } } : r
            ),
          }
        }
        return {
          records: [...state.records, { date, prayers: { ...emptyPrayers(), [prayer]: status } }],
        }
      }),

      getRecord: (date) => get().records.find((r) => r.date === date),

      updateSettings: (s) => set((state) => ({
        settings: { ...state.settings, ...s },
      })),
    }),
    { name: 'amar-zone-namaz' }
  )
)
