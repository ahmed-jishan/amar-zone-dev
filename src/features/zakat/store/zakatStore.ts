// ── Zakat Zustand Store with localStorage Persistence ──

import { create } from 'zustand'
import {
  type ZakatInputs,
  type ZakatResults,
  type NisabMethod,
  type MarketMode,
  type WeightUnit,
  DEFAULT_ZAKAT_INPUTS,
  computeZakat,
  STORAGE_KEYS,
} from '../types'

/* ═══════════════════════════════════════════════
   PERSISTENCE HELPERS
   ═══════════════════════════════════════════════ */

interface PersistedPrefs {
  nisabMethod: NisabMethod
  marketMode: MarketMode
  manualGoldPrice: number
  manualSilverPrice: number
}

function loadPrefs(): PersistedPrefs | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ZAKAT_PREFERENCES)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function savePrefs(prefs: PersistedPrefs) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.ZAKAT_PREFERENCES, JSON.stringify(prefs))
  } catch {
    // non-critical
  }
}

/* ═══════════════════════════════════════════════
   STORE TYPES
   ═══════════════════════════════════════════════ */

export interface ZakatStoreState {
  // User inputs
  inputs: ZakatInputs

  // Live market data
  liveGoldPrice: number | null
  liveSilverPrice: number | null
  marketSource: ZakatResults['calculationSource']
  isLiveLoading: boolean
  liveError: string | null

  // Computed results
  results: ZakatResults | null

  // Wizard
  currentStep: number

  // Actions — Inputs
  setNisabMethod: (method: NisabMethod) => void
  setMarketMode: (mode: MarketMode) => void
  setManualGoldPrice: (price: number) => void
  setManualSilverPrice: (price: number) => void
  setCashField: (field: keyof Pick<ZakatInputs, 'cashInHand' | 'bankBalance' | 'mobileBanking' | 'otherSavings'>, value: number) => void
  setGoldWeight: (weight: number) => void
  setGoldPurity: (purity: number) => void
  setSilverWeight: (weight: number) => void
  setBusinessField: (field: keyof Pick<ZakatInputs, 'inventoryValue' | 'saleableStock' | 'businessCash'>, value: number) => void
  setLiabilityField: (field: keyof Pick<ZakatInputs, 'shortTermDebt' | 'outstandingPayments' | 'otherLiabilities'>, value: number) => void

  // Actions — Units
  setGoldUnit: (unit: WeightUnit) => void
  setSilverUnit: (unit: WeightUnit) => void

  // Actions — Market
  setLivePrices: (goldPrice: number, silverPrice: number, source: ZakatResults['calculationSource']) => void
  setLiveLoading: (loading: boolean) => void
  setLiveError: (error: string | null) => void

  // Actions — Wizard
  setCurrentStep: (step: number) => void
  goNext: () => void
  goBack: () => void

  // Actions — Calculation
  recalculate: () => void
}

/* ═══════════════════════════════════════════════
   INITIAL STATE
   ═══════════════════════════════════════════════ */

function getInitialInputs(): ZakatInputs {
  const prefs = loadPrefs()
  if (prefs) {
    return {
      ...DEFAULT_ZAKAT_INPUTS,
      nisabMethod: prefs.nisabMethod,
      marketMode: prefs.marketMode,
      manualGoldPrice: prefs.manualGoldPrice,
      manualSilverPrice: prefs.manualSilverPrice,
    }
  }
  return { ...DEFAULT_ZAKAT_INPUTS }
}

/* ═══════════════════════════════════════════════
   STORE CREATION
   ═══════════════════════════════════════════════ */

export const useZakatStore = create<ZakatStoreState>((set, get) => ({
  inputs: getInitialInputs(),
  liveGoldPrice: null,
  liveSilverPrice: null,
  marketSource: 'manual',
  isLiveLoading: false,
  liveError: null,
  results: null,
  currentStep: 0,

  // ── Input Actions ──

  setNisabMethod: (method) => {
    set((s) => ({ inputs: { ...s.inputs, nisabMethod: method } }))
    savePrefs({ nisabMethod: method, marketMode: get().inputs.marketMode, manualGoldPrice: get().inputs.manualGoldPrice, manualSilverPrice: get().inputs.manualSilverPrice })
    get().recalculate()
  },

  setMarketMode: (mode) => {
    set((s) => ({ inputs: { ...s.inputs, marketMode: mode } }))
    savePrefs({ nisabMethod: get().inputs.nisabMethod, marketMode: mode, manualGoldPrice: get().inputs.manualGoldPrice, manualSilverPrice: get().inputs.manualSilverPrice })
    get().recalculate()
  },

  setManualGoldPrice: (price) => {
    set((s) => ({ inputs: { ...s.inputs, manualGoldPrice: Math.max(0, price) } }))
    savePrefs({ nisabMethod: get().inputs.nisabMethod, marketMode: get().inputs.marketMode, manualGoldPrice: Math.max(0, price), manualSilverPrice: get().inputs.manualSilverPrice })
    get().recalculate()
  },

  setManualSilverPrice: (price) => {
    set((s) => ({ inputs: { ...s.inputs, manualSilverPrice: Math.max(0, price) } }))
    savePrefs({ nisabMethod: get().inputs.nisabMethod, marketMode: get().inputs.marketMode, manualGoldPrice: get().inputs.manualGoldPrice, manualSilverPrice: Math.max(0, price) })
    get().recalculate()
  },

  setCashField: (field, value) => {
    set((s) => ({ inputs: { ...s.inputs, [field]: Math.max(0, value) } }))
    get().recalculate()
  },

  setGoldWeight: (weight) => {
    set((s) => ({ inputs: { ...s.inputs, goldWeight: Math.max(0, weight) } }))
    get().recalculate()
  },

  setGoldPurity: (purity) => {
    set((s) => ({ inputs: { ...s.inputs, goldPurity: Math.max(0, Math.min(24, purity)) } }))
    get().recalculate()
  },

  setSilverWeight: (weight) => {
    set((s) => ({ inputs: { ...s.inputs, silverWeight: Math.max(0, weight) } }))
    get().recalculate()
  },

  setBusinessField: (field, value) => {
    set((s) => ({ inputs: { ...s.inputs, [field]: Math.max(0, value) } }))
    get().recalculate()
  },

  setLiabilityField: (field, value) => {
    set((s) => ({ inputs: { ...s.inputs, [field]: Math.max(0, value) } }))
    get().recalculate()
  },

  // ── Unit Actions ──

  setGoldUnit: (unit) => {
    set((s) => ({ inputs: { ...s.inputs, goldUnit: unit } }))
    get().recalculate()
  },

  setSilverUnit: (unit) => {
    set((s) => ({ inputs: { ...s.inputs, silverUnit: unit } }))
    get().recalculate()
  },

  // ── Market Actions ──

  setLivePrices: (goldPrice, silverPrice, source) => {
    set({ liveGoldPrice: goldPrice, liveSilverPrice: silverPrice, marketSource: source, isLiveLoading: false, liveError: null })
    get().recalculate()
  },

  setLiveLoading: (loading) => set({ isLiveLoading: loading }),
  setLiveError: (error) => set({ liveError: error, isLiveLoading: false }),

  // ── Wizard Actions ──

  setCurrentStep: (step) => set({ currentStep: Math.max(0, Math.min(7, step)) }),
  goNext: () => set((s) => ({ currentStep: Math.min(7, s.currentStep + 1) })),
  goBack: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),

  // ── Recalculate ──

  recalculate: () => {
    const { inputs, liveGoldPrice, liveSilverPrice, marketSource } = get()
    const source = inputs.marketMode === 'manual' ? 'manual' : marketSource
    const results = computeZakat(inputs, liveGoldPrice, liveSilverPrice, source)
    set({ results })
  },
}))