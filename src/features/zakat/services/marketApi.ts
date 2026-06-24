// ── Market API Service — Free, Reliable, Islamically Accurate ──

import { MARKET_CACHE_TTL_MS, FALLBACK_PRICES, type MarketCacheData, STORAGE_KEYS } from '../types'

/* ═══════════════════════════════════════════════
   FREE MARKET DATA PROVIDERS
   
   Primary: metals.live (free, no API key needed)
   - Gold: https://api.metals.live/v1/spot/gold
   - Silver: https://api.metals.live/v1/spot/silver
   Returns price in USD per troy ounce
   
   Exchange Rate: exchangerate-api.com (free, no key)
   - USD to BDT: https://api.exchangerate-api.com/v4/latest/USD
   
   Conversion: 1 troy oz = 31.1034768 grams
   ═══════════════════════════════════════════════ */

const TROY_OZ_TO_GRAM = 31.1034768

const METALS_API = {
  GOLD: 'https://api.metals.live/v1/spot/gold',
  SILVER: 'https://api.metals.live/v1/spot/silver',
} as const

const EXCHANGE_API = 'https://api.exchangerate-api.com/v4/latest/USD'

/* ═══════════════════════════════════════════════
   CACHE HELPERS
   ═══════════════════════════════════════════════ */

function loadCache(): MarketCacheData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MARKET_CACHE)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCache(data: MarketCacheData) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.MARKET_CACHE, JSON.stringify(data))
  } catch {
    // Silently fail — cache is non-critical
  }
}

function isCacheValid(cache: MarketCacheData): boolean {
  return Date.now() - cache.timestamp < MARKET_CACHE_TTL_MS
}

/* ═══════════════════════════════════════════════
   LIVE FETCH
   ═══════════════════════════════════════════════ */

interface MetalsLiveResponse {
  [currency: string]: number
}

interface ExchangeRateResponse {
  rates: Record<string, number>
}

/** Fetch gold price in USD per troy ounce */
async function fetchGoldUsdPerOz(): Promise<number> {
  const res = await fetch(METALS_API.GOLD, {
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Gold API returned ${res.status}`)
  const data: MetalsLiveResponse = await res.json()
  const usdPrice = data['USD']
  if (typeof usdPrice !== 'number' || usdPrice <= 0) {
    throw new Error('Invalid gold price from API')
  }
  return usdPrice
}

/** Fetch silver price in USD per troy ounce */
async function fetchSilverUsdPerOz(): Promise<number> {
  const res = await fetch(METALS_API.SILVER, {
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Silver API returned ${res.status}`)
  const data: MetalsLiveResponse = await res.json()
  const usdPrice = data['USD']
  if (typeof usdPrice !== 'number' || usdPrice <= 0) {
    throw new Error('Invalid silver price from API')
  }
  return usdPrice
}

/** Fetch USD to BDT exchange rate */
async function fetchUsdToBdt(): Promise<number> {
  const res = await fetch(EXCHANGE_API, {
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Exchange API returned ${res.status}`)
  const data: ExchangeRateResponse = await res.json()
  const bdt = data.rates['BDT']
  if (typeof bdt !== 'number' || bdt <= 0) {
    throw new Error('Invalid BDT rate from API')
  }
  return bdt
}

/** Convert USD per troy ounce to BDT per gram */
function usdPerOzToBdtPerGram(usdPerOz: number, usdToBdt: number): number {
  return (usdPerOz / TROY_OZ_TO_GRAM) * usdToBdt
}

/* ═══════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════ */

export interface MarketPriceResult {
  goldPrice: number    // BDT per gram
  silverPrice: number  // BDT per gram
  timestamp: number
  source: 'live' | 'cached' | 'fallback'
}

/**
 * Fetch current gold & silver prices in BDT per gram.
 *
 * Strategy (resilient, never throws):
 * 1. Check cache — return if fresh
 * 2. Fetch live — cache & return on success
 * 3. If live fails — return cache if exists
 * 4. If no cache — return fallback defaults
 */
export async function fetchMarketPrices(): Promise<MarketPriceResult> {
  // 1. Check cache
  const cache = loadCache()
  if (cache && isCacheValid(cache)) {
    return {
      goldPrice: cache.goldPrice,
      silverPrice: cache.silverPrice,
      timestamp: cache.timestamp,
      source: 'cached',
    }
  }

  try {
    // 2. Fetch live prices in parallel
    const [goldUsd, silverUsd, usdToBdt] = await Promise.all([
      fetchGoldUsdPerOz(),
      fetchSilverUsdPerOz(),
      fetchUsdToBdt(),
    ])

    const goldBdt = Math.round(usdPerOzToBdtPerGram(goldUsd, usdToBdt))
    const silverBdt = Math.round(usdPerOzToBdtPerGram(silverUsd, usdToBdt))
    const timestamp = Date.now()

    // Cache the result
    saveCache({ goldPrice: goldBdt, silverPrice: silverBdt, timestamp })

    return { goldPrice: goldBdt, silverPrice: silverBdt, timestamp, source: 'live' }
  } catch {
    // 3. Fallback to cache if live fails
    if (cache) {
      return {
        goldPrice: cache.goldPrice,
        silverPrice: cache.silverPrice,
        timestamp: cache.timestamp,
        source: 'cached',
      }
    }

    // 4. Final fallback — use predefined defaults
    return {
      goldPrice: FALLBACK_PRICES.GOLD_BDT_PER_GRAM,
      silverPrice: FALLBACK_PRICES.SILVER_BDT_PER_GRAM,
      timestamp: Date.now(),
      source: 'fallback',
    }
  }
}

/**
 * Get cached prices synchronously (for instant load)
 */
export function getCachedPrices(): { goldPrice: number; silverPrice: number } | null {
  const cache = loadCache()
  if (cache) {
    return { goldPrice: cache.goldPrice, silverPrice: cache.silverPrice }
  }
  return null
}