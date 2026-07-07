'use client'

import { useMemo, useState } from 'react'
import { Lightbulb, X, ChevronRight } from 'lucide-react'
import type { Transaction, FinancialInsight } from '@/lib/types'
import { CATEGORY_META } from '../../constants'
import { formatCurrency } from '../../utils'
import type { MoneyTabKey } from './types'

interface SmartInsightsProps {
  transactions: Transaction[]
  insights: FinancialInsight[]
  month: string
  currencySymbol: string
  onDismiss: (id: string) => void
  onSetTab: (tab: MoneyTabKey) => void
}

interface SpendingTip {
  id: string
  type: 'trend' | 'alert' | 'tip'
  title: string
  description: string
  icon: string
  color: string
  action?: { label: string; tab: MoneyTabKey }
}

export default function SmartInsights({
  transactions,
  insights,
  month,
  currencySymbol,
  onDismiss,
  onSetTab,
}: SmartInsightsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const tips: SpendingTip[] = useMemo(() => {
    const result: SpendingTip[] = []
    const monthTxns = transactions.filter(t => t.date.startsWith(month) && t.status === 'completed')

    // Compare vs last month
    const prevMonth = new Date(month + '-01')
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    const prevMonthStr = prevMonth.toISOString().slice(0, 7)
    const prevTxns = transactions.filter(t => t.date.startsWith(prevMonthStr) && t.status === 'completed')

    const categorySpend: Record<string, number> = {}
    monthTxns.filter(t => t.type === 'expense').forEach(t => {
      categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount
    })

    const prevCategorySpend: Record<string, number> = {}
    prevTxns.filter(t => t.type === 'expense').forEach(t => {
      prevCategorySpend[t.category] = (prevCategorySpend[t.category] || 0) + t.amount
    })

    // Category spike alerts
    Object.entries(categorySpend).forEach(([cat, amount]) => {
      const prev = prevCategorySpend[cat] || 0
      if (prev > 0 && amount > prev * 1.5) {
        const meta = CATEGORY_META[cat] || CATEGORY_META.other
        result.push({
          id: `spike-${cat}`,
          type: 'alert',
          title: `${meta.labelEn} spending up ${Math.round((amount / prev - 1) * 100)}%`,
          description: `Spent ${formatCurrency(amount, currencySymbol)} vs ${formatCurrency(prev, currencySymbol)} last month`,
          icon: meta.icon,
          color: 'var(--mon-expense)',
          action: { label: 'View', tab: 'analytics' },
        })
      }
    })

    // Savings rate
    const income = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    if (income > 0) {
      const rate = ((income - expense) / income) * 100
      if (rate < 10 && rate >= 0) {
        result.push({
          id: 'savings-rate',
          type: 'tip',
          title: 'Low savings rate',
          description: `You're saving only ${Math.round(rate)}% of income. Try to save at least 20%.`,
          icon: '💡',
          color: 'var(--mon-amber)',
          action: { label: 'Budget', tab: 'budget' },
        })
      } else if (rate >= 20) {
        result.push({
          id: 'savings-rate-good',
          type: 'trend',
          title: 'Great savings rate!',
          description: `You're saving ${Math.round(rate)}% of income. Keep it up!`,
          icon: '🎯',
          color: 'var(--mon-income)',
        })
      }
    }

    return result.slice(0, 5)
  }, [transactions, month, currencySymbol])

  const visibleItems = useMemo(() => tips.filter(t => !dismissed.has(t.id)), [tips, dismissed])

  if (visibleItems.length === 0 && insights.filter(i => !i.read).length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb size={14} style={{ color: 'var(--mon-gold)' }} />
        <span className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>
          Smart Insights
        </span>
        {visibleItems.length > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--mon-gold-bg)', color: 'var(--mon-gold)' }}>
            {visibleItems.length}
          </span>
        )}
      </div>

      {visibleItems.map(item => (
        <div
          key={item.id}
          className="flex items-start gap-3 p-3 rounded-[var(--mon-radius-lg)] animate-[mon-slide-up_300ms_ease-out]"
          style={{
            background: item.type === 'alert' ? 'var(--mon-expense-bg)' : item.type === 'trend' ? 'var(--mon-accent-bg)' : 'var(--mon-amber-bg)',
            border: `1px solid ${
              item.type === 'alert' ? 'var(--mon-expense-glow)' : item.type === 'trend' ? 'var(--mon-accent-glow)' : 'var(--mon-amber-glow)'
            }`,
          }}
        >
          <span className="text-lg flex-shrink-0">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold" style={{ color: 'var(--mon-text-1)' }}>{item.title}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--mon-text-2)' }}>{item.description}</p>
            {item.action && (
              <button
                onClick={() => onSetTab(item.action!.tab)}
                className="mt-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-[0.5px] transition-colors"
                style={{ color: item.color }}
              >
                {item.action.label}
                <ChevronRight size={12} />
              </button>
            )}
          </div>
          <button
            onClick={() => setDismissed(prev => new Set(prev).add(item.id))}
            className="p-1 rounded-full flex-shrink-0 transition-colors"
            style={{ color: 'var(--mon-text-3)' }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}