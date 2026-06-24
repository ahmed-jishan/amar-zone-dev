'use client'

// ── Hook: Hybrid Market Price Manager ──

import { useCallback, useEffect, useRef } from 'react'
import { useZakatStore } from '../store/zakatStore'
import { fetchMarketPrices, getCachedPrices } from '../services/marketApi'
import type { ZakatResults } from '../types'

export function useMarketPrice() {
  const {
    inputs,
    isLiveLoading,
    liveError,
    setLivePrices,
    setLiveLoading,
    setLiveError,
  } = useZakatStore()

  const fetchingRef = useRef(false)

  const refresh = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLiveLoading(true)
    try {
      const result = await fetchMarketPrices()
      setLivePrices(result.goldPrice, result.silverPrice, result.source as ZakatResults['calculationSource'])
    } catch {
      setLiveError('Failed to fetch market prices')
    } finally {
      fetchingRef.current = false
    }
  }, [setLivePrices, setLiveLoading, setLiveError])

  // Auto-fetch on mount if live mode
  useEffect(() => {
    if (inputs.marketMode === 'live') {
      // First try cached prices for instant display
      const cached = getCachedPrices()
      if (cached) {
        setLivePrices(cached.goldPrice, cached.silverPrice, 'cached')
      }
      // Then refresh from API
      refresh()
    }
  }, [inputs.marketMode, refresh, setLivePrices])

  return {
    isLive: inputs.marketMode === 'live',
    isLoading: isLiveLoading,
    error: liveError,
    refresh,
  }
}