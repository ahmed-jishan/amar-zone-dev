'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SparklinePoint {
  date: string
  value: number
}

interface NetWorthSparklineProps {
  history: { date: string; netWorth: number }[]
  currencySymbol: string
  days?: number
}

function formatAmount(amount: number, symbol: string): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) return `${symbol}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${symbol}${(abs / 1_000).toFixed(1)}K`
  return `${symbol}${abs.toFixed(0)}`
}

export default function NetWorthSparkline({
  history,
  currencySymbol,
  days = 30,
}: NetWorthSparklineProps) {
  const sparklineData: SparklinePoint[] = useMemo(() => {
    const sorted = [...history]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-days)
    return sorted.map(h => ({ date: h.date, value: h.netWorth }))
  }, [history, days])

  const { trend, change, changePercent, min, max, avg } = useMemo(() => {
    if (sparklineData.length < 2) {
      return { trend: 'flat' as const, change: 0, changePercent: 0, min: 0, max: 0, avg: 0 }
    }
    const first = sparklineData[0].value
    const last = sparklineData[sparklineData.length - 1].value
    const values = sparklineData.map(d => d.value)
    const change = last - first
    const changePercent = first !== 0 ? (change / Math.abs(first)) * 100 : 0
    const trend = change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'flat' as const
    return {
      trend,
      change,
      changePercent,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    }
  }, [sparklineData])

  // Build SVG path
  const pathData = useMemo(() => {
    if (sparklineData.length < 2) return ''
    const width = 240
    const height = 60
    const padding = 4
    const plotWidth = width - padding * 2
    const plotHeight = height - padding * 2
    const valRange = max - min || 1

    const points = sparklineData.map((d, i) => {
      const x = padding + (i / (sparklineData.length - 1)) * plotWidth
      const y = padding + plotHeight - ((d.value - min) / valRange) * plotHeight
      return `${x},${y}`
    })

    return `M ${points.join(' L ')}`
  }, [sparklineData, min, max])

  const trendColor = trend === 'up' ? 'var(--mon-income)' : trend === 'down' ? 'var(--mon-expense)' : 'var(--mon-text-3)'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  if (sparklineData.length < 2) {
    return null
  }

  return (
    <div
      className="mon-glass-card rounded-[var(--mon-radius-xl)] p-4"
      style={{ animation: 'mon-slide-up 400ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>
            Net Worth Trend
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: trendColor }}>
            <TrendIcon size={12} />
            {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
        </div>
        <span className="text-[11px]" style={{ color: 'var(--mon-text-4)' }}>
          {sparklineData.length}d
        </span>
      </div>

      {/* Sparkline SVG */}
      <div className="relative h-[60px] mb-3">
        <svg width="100%" height="60" viewBox="0 0 240 60" preserveAspectRatio="none">
          {/* Gradient fill under the line */}
          <defs>
            <linearGradient id="sparkline-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Fill area */}
          {pathData && (
            <path
              d={`${pathData} L ${240 - 4},${60 - 4} L ${4},${60 - 4} Z`}
              fill="url(#sparkline-fill)"
            />
          )}
          {/* Line */}
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke={trendColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sparkline-path"
              style={{
                strokeDasharray: 1000,
                strokeDashoffset: 0,
                animation: 'mon-chart-grow 1s ease-out',
              }}
            />
          )}
        </svg>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-[var(--mon-radius-md)]" style={{ background: 'var(--mon-surface-2)' }}>
          <p className="text-[9px] font-semibold uppercase tracking-[0.8px]" style={{ color: 'var(--mon-text-4)' }}>Change</p>
          <p className="text-[13px] font-bold mt-0.5" style={{ color: trendColor }}>
            {change >= 0 ? '+' : ''}{formatAmount(change, currencySymbol)}
          </p>
        </div>
        <div className="text-center p-2 rounded-[var(--mon-radius-md)]" style={{ background: 'var(--mon-surface-2)' }}>
          <p className="text-[9px] font-semibold uppercase tracking-[0.8px]" style={{ color: 'var(--mon-text-4)' }}>Avg</p>
          <p className="text-[13px] font-bold mt-0.5" style={{ color: 'var(--mon-text-1)' }}>
            {formatAmount(avg, currencySymbol)}
          </p>
        </div>
        <div className="text-center p-2 rounded-[var(--mon-radius-md)]" style={{ background: 'var(--mon-surface-2)' }}>
          <p className="text-[9px] font-semibold uppercase tracking-[0.8px]" style={{ color: 'var(--mon-text-4)' }}>Range</p>
          <p className="text-[13px] font-bold mt-0.5" style={{ color: 'var(--mon-text-1)' }}>
            {formatAmount(max - min, currencySymbol)}
          </p>
        </div>
      </div>
    </div>
  )
}