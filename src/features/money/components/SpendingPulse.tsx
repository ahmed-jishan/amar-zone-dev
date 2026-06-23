'use client'

import { useMemo } from 'react'
import { useMoneyStore } from '../store/moneyStore'
import { formatCurrency } from '../utils'

const CIRCUMFERENCE = 226 // 2 * PI * 36 (radius)

export default function SpendingPulse({ currencySymbol }: { currencySymbol: string }) {
  const pulse = useMoneyStore((s) => s.getSpendingPulse())

  const { offset, color, bg, label } = useMemo(() => {
    const pct = Math.min(pulse.percentUsed, 100)
    const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE
    const colors: Record<string, { stroke: string; bg: string; text: string; label: string }> = {
      green: { stroke: 'var(--mon-income)', bg: 'var(--mon-income-bg)', text: 'var(--mon-income)', label: 'On Track' },
      amber: { stroke: 'var(--mon-amber)', bg: 'var(--mon-amber-bg)', text: 'var(--mon-amber)', label: 'Caution' },
      red: { stroke: 'var(--mon-expense)', bg: 'var(--mon-expense-bg)', text: 'var(--mon-expense)', label: 'Over Budget' },
    }
    const c = colors[pulse.status] || colors.green
    return { offset, color: c.stroke, bg: c.bg, label: c.label }
  }, [pulse])

  return (
        <div className="mon-card p-4 flex items-center gap-4 mon-animate-breathe" style={{ animation: 'mon-breathe 4s ease-in-out infinite' }}>
      <div className="mon-pulse-ring flex-shrink-0">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle
            className="bg-ring"
            cx="40" cy="40" r="36"
            fill="none" strokeWidth="6"
          />
          <circle
            className="fg-ring"
            cx="40" cy="40" r="36"
            fill="none"
            strokeWidth="6"
            stroke={color}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold" style={{ color }}>{Math.round(pulse.percentUsed)}%</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: 'var(--mon-text-3)' }}>
          Spending Pulse
        </p>
        <p className="text-[22px] font-black mt-0.5" style={{ color: 'var(--mon-text-1)' }}>
          {formatCurrency(pulse.todaySpent, currencySymbol)}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[12px]" style={{ color: 'var(--mon-text-2)' }}>
            of {formatCurrency(Math.round(pulse.dailyBudget), currencySymbol)} daily
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: pulse.status === 'green' ? 'var(--mon-income-bg)' : pulse.status === 'amber' ? 'var(--mon-amber-bg)' : 'var(--mon-expense-bg)', color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}