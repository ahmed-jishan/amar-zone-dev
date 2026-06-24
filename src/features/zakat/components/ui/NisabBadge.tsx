'use client'

// ── Live Nisab Threshold Badge ──

import { useZakatStore } from '../../store/zakatStore'
import { formatBDT } from '../../types'

export default function NisabBadge() {
  const { results, inputs } = useZakatStore()

  if (!results) return null

  const method = inputs.nisabMethod === 'gold' ? 'Gold' : 'Silver'
  const threshold = results.selectedNisabThreshold

  return (
    <div className="zk-nisab-badge">
      <div className="zk-nisab-dot" />
      <div>
        <span className="zk-nisab-label">Current {method} Nisab</span>
        <span className="zk-nisab-value">{formatBDT(threshold)}</span>
      </div>
    </div>
  )
}