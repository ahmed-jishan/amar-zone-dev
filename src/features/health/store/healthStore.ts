// ── Health Zustand Store with localStorage Persistence ──

import { create } from 'zustand'
import { BMIRecord, calculateBMI, getBMICategory } from '../types'

const STORAGE_KEY = 'az-health'

function loadHistory(): BMIRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(records: BMIRecord[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch (e) {
    console.warn('Failed to save health records:', e)
  }
}

let recordCounter = 0
function generateId(): string {
  recordCounter++
  return `bmi_${Date.now()}_${recordCounter}_${Math.random().toString(36).slice(2, 8)}`
}

interface HealthState {
  history: BMIRecord[]
  weightKg: number
  heightCm: number

  setWeight: (kg: number) => void
  setHeight: (cm: number) => void
  calculateAndSave: () => BMIRecord | null
  clearHistory: () => void
}

export const useHealthStore = create<HealthState>((set, get) => ({
  history: loadHistory(),
  weightKg: 70,
  heightCm: 175,

  setWeight: (kg) => set({ weightKg: Math.max(20, Math.min(350, kg)) }),
  setHeight: (cm) => set({ heightCm: Math.max(50, Math.min(280, cm)) }),

  calculateAndSave: () => {
    const { weightKg, heightCm, history } = get()
    const bmi = calculateBMI(weightKg, heightCm)
    if (bmi <= 0) return null

    const record: BMIRecord = {
      id: generateId(),
      weightKg,
      heightCm,
      bmi,
      category: getBMICategory(bmi),
      date: Date.now(),
    }

    const updated = [record, ...history]
    set({ history: updated })
    saveHistory(updated)
    return record
  },

  clearHistory: () => {
    set({ history: [] })
    saveHistory([])
  },
}))