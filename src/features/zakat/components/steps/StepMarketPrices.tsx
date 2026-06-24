'use client'

import { DollarSign, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useZakatStore } from '../../store/zakatStore'
import { useMarketPrice } from '../../hooks/useMarketPrice'
import CurrencyInput from '../ui/CurrencyInput'
import { formatBDT } from '../../types'

export default function StepMarketPrices() {
  const { inputs, setMarketMode, setManualGoldPrice, setManualSilverPrice, liveGoldPrice, liveSilverPrice } = useZakatStore()
  const { isLive, isLoading, error, refresh } = useMarketPrice()

  return (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-[var(--zk-text)]">Market Prices</h2>
        <p className="text-sm text-[var(--zk-muted)] mt-1">Choose how to get gold & silver prices</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMarketMode('manual')}
          className={`zk-mode-card ${!isLive ? 'zk-mode-active' : ''}`}
        >
          <DollarSign size={20} className={`${!isLive ? 'text-[var(--zk-accent)]' : 'text-[var(--zk-muted)]'}`} />
          <span className="zk-mode-label">My Own Prices</span>
          <span className="zk-mode-desc">Enter local rates</span>
        </button>
        <button
          onClick={() => setMarketMode('live')}
          className={`zk-mode-card ${isLive ? 'zk-mode-active' : ''}`}
        >
          {isLoading ? (
            <RefreshCw size={20} className="animate-spin text-[var(--zk-accent)]" />
          ) : isLive ? (
            <Wifi size={20} className="text-[var(--zk-green)]" />
          ) : (
            <WifiOff size={20} className="text-[var(--zk-muted)]" />
          )}
          <span className="zk-mode-label">Live Prices</span>
          <span className="zk-mode-desc">Market data</span>
        </button>
      </div>

      {isLive ? (
        <div className="zk-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--zk-text)]">Live Market Rates</span>
            <button onClick={refresh} disabled={isLoading} className="text-xs text-[var(--zk-accent)] hover:underline flex items-center gap-1">
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
          {error && <p className="text-xs text-[var(--zk-red)]">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="zk-price-box">
              <span className="zk-price-label">Gold</span>
              <span className="zk-price-value">{liveGoldPrice ? formatBDT(liveGoldPrice) : '---'}</span>
              <span className="zk-price-unit">/ gram</span>
            </div>
            <div className="zk-price-box">
              <span className="zk-price-label">Silver</span>
              <span className="zk-price-value">{liveSilverPrice ? formatBDT(liveSilverPrice) : '---'}</span>
              <span className="zk-price-unit">/ gram</span>
            </div>
          </div>
          <p className="text-xs text-[var(--zk-muted)] mt-2">
            These market values are estimates from external data sources. Enter your own local market prices for more accurate calculations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <CurrencyInput label="Gold Price (per gram)" value={inputs.manualGoldPrice} onChange={setManualGoldPrice} step={100} />
          <CurrencyInput label="Silver Price (per gram)" value={inputs.manualSilverPrice} onChange={setManualSilverPrice} step={10} />
        </div>
      )}
    </div>
  )
}