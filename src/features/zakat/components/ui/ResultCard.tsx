'use client'

// ── Premium Result Metric Card ──

import type { ReactNode } from 'react'

interface ResultCardProps {
  icon: ReactNode
  label: string
  value: string
  accent?: string
  large?: boolean
}

export default function ResultCard({ icon, label, value, accent, large }: ResultCardProps) {
  return (
    <div
      className="zk-result-card"
      style={accent ? { borderLeftColor: accent } : undefined}
    >
      <div className="zk-result-icon">{icon}</div>
      <div className="zk-result-body">
        <span className="zk-result-label">{label}</span>
        <span className={`zk-result-value ${large ? 'zk-result-value-lg' : ''}`}>
          {value}
        </span>
      </div>
    </div>
  )
}