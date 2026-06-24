'use client'

// ── Islamic Guidance & Disclaimer Card ──

import { useZakatStore } from '../../store/zakatStore'
import { Info } from 'lucide-react'

export default function DisclaimerCard() {
  const { inputs, marketSource } = useZakatStore()

  const isLive = inputs.marketMode === 'live'
  const sourceLabel = isLive ? 'Live Market Data' : 'Your Custom Values'
  const sourceIcon = isLive ? '📡' : '✋'

  return (
    <div className="zk-card zk-card-warning">
      <div className="flex items-start gap-3">
        <Info size={18} className="text-[var(--zk-amber)] mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <p className="text-xs text-[var(--zk-muted)] leading-relaxed">
            <strong>Calculation Source:</strong> {sourceIcon} {sourceLabel}
          </p>
          <p className="text-xs text-[var(--zk-muted)] leading-relaxed">
            This calculator provides an estimated zakat amount based on the values you entered.
            For complex financial situations, consult a qualified Islamic scholar.
          </p>
          <p className="text-xs text-[var(--zk-muted)] leading-relaxed">
            For the most accurate calculation, use the current market prices available in your local area.
            Live market values are provided for convenience and may differ from local rates.
          </p>
        </div>
      </div>
    </div>
  )
}