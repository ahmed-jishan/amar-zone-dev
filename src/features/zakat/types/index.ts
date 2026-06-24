// ── Zakat Types, Constants & Pure Calculation Engine ──

/* ═══════════════════════════════════════════════
   ISLAMIC ZAKAT CONSTANTS
   ═══════════════════════════════════════════════ */

/** Gold Nisab threshold in grams (87.48g = 20 mithqal / 87.48g according to Hanafi) */
export const GOLD_NISAB_GRAMS = 87.48

/** Silver Nisab threshold in grams (612.36g = 200 dirhams / 612.36g) */
export const SILVER_NISAB_GRAMS = 612.36

/** Zakat rate: 2.5% = 1/40 */
export const ZAKAT_RATE = 0.025

/* ═══════════════════════════════════════════════
   TRADITIONAL UNIT CONVERSIONS
   ═══════════════════════════════════════════════ */

/** 1 Vori = 11.664 grams (standard in Bangladesh & South Asia) */
export const GRAMS_PER_VORI = 11.664

/** 1 Tola = 11.664 grams (standard in Bangladesh & South Asia) */
export const GRAMS_PER_TOLA = 11.664

/** Gold Nisab in Vori: 87.48 / 11.664 = 7.5 vori */
export const GOLD_NISAB_VORI = 7.5

/** Silver Nisab in Vori: 612.36 / 11.664 = 52.5 vori */
export const SILVER_NISAB_VORI = 52.5

/** Gold Nisab in Tola: 87.48 / 11.664 = 7.5 tola */
export const GOLD_NISAB_TOLA = 7.5

/** Silver Nisab in Tola: 612.36 / 11.664 = 52.5 tola */
export const SILVER_NISAB_TOLA = 52.5

/* ═══════════════════════════════════════════════
   CACHE CONSTANTS
   ═══════════════════════════════════════════════ */

/** How long market data is considered fresh (5 minutes) */
export const MARKET_CACHE_TTL_MS = 5 * 60 * 1000

/** localStorage keys */
export const STORAGE_KEYS = {
  ZAKAT_PREFERENCES: 'az-zakat-prefs',
  MARKET_CACHE: 'az-zakat-market-cache',
} as const

/** Fallback market values (BDT per gram) when no cache/API available */
export const FALLBACK_PRICES = {
  GOLD_BDT_PER_GRAM: 12500,
  SILVER_BDT_PER_GRAM: 180,
} as const

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

export type NisabMethod = 'gold' | 'silver'

export type MarketMode = 'manual' | 'live'

export type WeightUnit = 'gram' | 'vori' | 'tola'

export interface MarketCacheData {
  goldPrice: number
  silverPrice: number
  timestamp: number
}

/** All user input fields for the Zakat calculator */
export interface ZakatInputs {
  // Market
  nisabMethod: NisabMethod
  marketMode: MarketMode
  manualGoldPrice: number
  manualSilverPrice: number

  // Cash & Savings
  cashInHand: number
  bankBalance: number
  mobileBanking: number
  otherSavings: number

  // Gold
  goldWeight: number
  goldPurity: number         // 18, 21, 22, 24 (karat)
  goldUnit: WeightUnit       // gram, vori, or tola

  // Silver
  silverWeight: number
  silverUnit: WeightUnit     // gram, vori, or tola

  // Business Assets
  inventoryValue: number
  saleableStock: number
  businessCash: number

  // Liabilities
  shortTermDebt: number
  outstandingPayments: number
  otherLiabilities: number
}

/** Results computed from the calculation engine */
export interface ZakatResults {
  goldNisabThreshold: number
  silverNisabThreshold: number
  selectedNisabThreshold: number
  totalCashSavings: number
  goldValue: number
  silverValue: number
  totalBusinessAssets: number
  totalAssets: number
  totalLiabilities: number
  netWealth: number
  isEligible: boolean
  zakatDue: number
  calculationSource: 'manual' | 'live' | 'cached' | 'fallback'
}

/* ═══════════════════════════════════════════════
   UNIT CONVERSION HELPERS
   ═══════════════════════════════════════════════ */

/** Convert weight from any unit to grams */
export function toGrams(weight: number, unit: WeightUnit): number {
  const w = Math.max(0, weight)
  switch (unit) {
    case 'vori': return w * GRAMS_PER_VORI
    case 'tola': return w * GRAMS_PER_TOLA
    default: return w
  }
}

/** Convert grams to a display unit */
export function fromGrams(grams: number, unit: WeightUnit): number {
  const g = Math.max(0, grams)
  switch (unit) {
    case 'vori': return g / GRAMS_PER_VORI
    case 'tola': return g / GRAMS_PER_TOLA
    default: return g
  }
}

/** Get unit suffix string */
export function unitSuffix(unit: WeightUnit): string {
  switch (unit) {
    case 'vori': return 'ভরি'
    case 'tola': return 'তোলা'
    default: return 'g'
  }
}

/** Get unit full name */
export function unitName(unit: WeightUnit): string {
  switch (unit) {
    case 'vori': return 'Vori (ভরি)'
    case 'tola': return 'Tola (তোলা)'
    default: return 'Gram'
  }
}

/* ═══════════════════════════════════════════════
   PURE CALCULATION ENGINE
   All functions are deterministic — no side effects
   ═══════════════════════════════════════════════ */

/** Calculate Gold Nisab threshold */
export function calculateGoldNisab(goldPricePerGram: number): number {
  return GOLD_NISAB_GRAMS * Math.max(0, goldPricePerGram)
}

/** Calculate Silver Nisab threshold */
export function calculateSilverNisab(silverPricePerGram: number): number {
  return SILVER_NISAB_GRAMS * Math.max(0, silverPricePerGram)
}

/** Calculate gold value based on weight, unit, and purity */
export function calculateGoldValue(
  weight: number,
  purityKarat: number,
  pricePerGram: number,
  unit: WeightUnit = 'gram',
): number {
  const grams = toGrams(weight, unit)
  const p = Math.max(0, Math.min(24, purityKarat)) / 24
  const pr = Math.max(0, pricePerGram)
  return grams * p * pr
}

/** Calculate silver value based on weight and unit */
export function calculateSilverValue(
  weight: number,
  pricePerGram: number,
  unit: WeightUnit = 'gram',
): number {
  const grams = toGrams(weight, unit)
  return grams * Math.max(0, pricePerGram)
}

/** Calculate total assets from all categories */
export function calculateTotalAssets(inputs: ZakatInputs, goldPrice: number, silverPrice: number): number {
  const cashSavings =
    inputs.cashInHand + inputs.bankBalance + inputs.mobileBanking + inputs.otherSavings
  const goldVal = calculateGoldValue(inputs.goldWeight, inputs.goldPurity, goldPrice, inputs.goldUnit)
  const silverVal = calculateSilverValue(inputs.silverWeight, silverPrice, inputs.silverUnit)
  const business = inputs.inventoryValue + inputs.saleableStock + inputs.businessCash
  return Math.max(0, cashSavings + goldVal + silverVal + business)
}

/** Calculate net wealth after liabilities */
export function calculateNetWealth(totalAssets: number, totalLiabilities: number): number {
  return Math.max(0, totalAssets - Math.max(0, totalLiabilities))
}

/** Determine if wealth meets Nisab threshold */
export function isWealthEligible(netWealth: number, nisabThreshold: number): boolean {
  return netWealth >= nisabThreshold
}

/** Calculate Zakat due (2.5% of net wealth if eligible) */
export function calculateZakatDue(netWealth: number, nisabThreshold: number): number {
  if (!isWealthEligible(netWealth, nisabThreshold)) return 0
  return netWealth * ZAKAT_RATE
}

/** Main calculation: takes inputs + current prices → full results */
export function computeZakat(
  inputs: ZakatInputs,
  liveGoldPrice: number | null,
  liveSilverPrice: number | null,
  source: ZakatResults['calculationSource'],
): ZakatResults {
  const goldPrice = inputs.marketMode === 'live' && liveGoldPrice !== null
    ? liveGoldPrice
    : inputs.manualGoldPrice
  const silverPrice = inputs.marketMode === 'live' && liveSilverPrice !== null
    ? liveSilverPrice
    : inputs.manualSilverPrice

  const goldNisab = calculateGoldNisab(goldPrice)
  const silverNisab = calculateSilverNisab(silverPrice)
  const selectedNisab = inputs.nisabMethod === 'gold' ? goldNisab : silverNisab

  const cashSavings =
    inputs.cashInHand + inputs.bankBalance + inputs.mobileBanking + inputs.otherSavings
  const goldVal = calculateGoldValue(inputs.goldWeight, inputs.goldPurity, goldPrice, inputs.goldUnit)
  const silverVal = calculateSilverValue(inputs.silverWeight, silverPrice, inputs.silverUnit)
  const businessAssets = inputs.inventoryValue + inputs.saleableStock + inputs.businessCash
  const totalAssets = cashSavings + goldVal + silverVal + businessAssets
  const totalLiabs = inputs.shortTermDebt + inputs.outstandingPayments + inputs.otherLiabilities
  const netWealth = calculateNetWealth(totalAssets, totalLiabs)
  const eligible = isWealthEligible(netWealth, selectedNisab)
  const zakatDue = calculateZakatDue(netWealth, selectedNisab)

  return {
    goldNisabThreshold: goldNisab,
    silverNisabThreshold: silverNisab,
    selectedNisabThreshold: selectedNisab,
    totalCashSavings: cashSavings,
    goldValue: goldVal,
    silverValue: silverVal,
    totalBusinessAssets: businessAssets,
    totalAssets,
    totalLiabilities: totalLiabs,
    netWealth,
    isEligible: eligible,
    zakatDue,
    calculationSource: source,
  }
}

/** Default empty inputs */
export const DEFAULT_ZAKAT_INPUTS: ZakatInputs = {
  nisabMethod: 'silver',
  marketMode: 'manual',
  manualGoldPrice: 12500,
  manualSilverPrice: 180,
  cashInHand: 0,
  bankBalance: 0,
  mobileBanking: 0,
  otherSavings: 0,
  goldWeight: 0,
  goldPurity: 24,
  goldUnit: 'vori',
  silverWeight: 0,
  silverUnit: 'vori',
  inventoryValue: 0,
  saleableStock: 0,
  businessCash: 0,
  shortTermDebt: 0,
  outstandingPayments: 0,
  otherLiabilities: 0,
}

/** Format number to BDT currency string */
export function formatBDT(amount: number): string {
  return '৳' + Math.round(amount).toLocaleString('en-BD')
}