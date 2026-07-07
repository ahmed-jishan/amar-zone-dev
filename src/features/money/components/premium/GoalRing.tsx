'use client'

import { useMemo } from 'react'
import type { SavingsGoal } from '@/lib/types'

interface GoalRingProps {
  goal: SavingsGoal
  currencySymbol: string
  size?: number
  strokeWidth?: number
}

export default function GoalRing({ goal, currencySymbol, size = 80, strokeWidth = 6 }: GoalRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = goal.targetAmount > 0 ? Math.min(goal.currentAmount / goal.targetAmount, 1) : 0
  const offset = circumference * (1 - progress)
  const percentage = Math.round(progress * 100)

  const milestone = useMemo(() => {
    if (percentage >= 100) return { label: 'Complete!', color: 'var(--mon-income)' }
    if (percentage >= 75) return { label: 'Almost there', color: 'var(--mon-teal)' }
    if (percentage >= 50) return { label: 'Halfway', color: 'var(--mon-gold)' }
    if (percentage >= 25) return { label: 'Started', color: 'var(--mon-amber)' }
    return { label: 'New goal', color: 'var(--mon-text-3)' }
  }, [percentage])

  const ringColor = milestone.color

  const formatAmount = (amount: number) => {
    const abs = Math.abs(amount)
    if (abs >= 1_000_000) return `${currencySymbol}${(abs / 1_000_000).toFixed(1)}M`
    if (abs >= 1_000) return `${currencySymbol}${(abs / 1_000).toFixed(1)}K`
    return `${currencySymbol}${abs.toFixed(0)}`
  }

  return (
    <div className="flex flex-col items-center gap-2 animate-[mon-scale-in_400ms_ease-out]">
      {/* Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--mon-surface-3)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        {/* Center percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[14px] font-black" style={{ color: 'var(--mon-text-1)' }}>
            {percentage}%
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center min-w-0 max-w-[120px]">
        <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--mon-text-1)' }}>
          {goal.title}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--mon-text-3)' }}>
          {formatAmount(goal.currentAmount)} / {formatAmount(goal.targetAmount)}
        </p>
      </div>

      {/* Milestone badge */}
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-[0.5px]"
        style={{
          background: `${ringColor}20`,
          color: ringColor,
        }}
      >
        {milestone.label}
      </span>
    </div>
  )
}