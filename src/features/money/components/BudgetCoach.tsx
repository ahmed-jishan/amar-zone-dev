'use client'

import { EXPENSE_CATEGORIES, CATEGORY_META } from '../constants'
import { formatCurrency } from '../utils'
import type { MonthlyBudget, Transaction } from '@/lib/types'

interface Props {
  budget?: MonthlyBudget
  transactions: Transaction[]
  month: string
  currencySymbol: string
  onCreateTask: (title: string, dueDate?: string) => void
}

export default function BudgetCoach({ budget, transactions, month, currencySymbol, onCreateTask }: Props) {
  if (!budget || budget.salary <= 0) return null

  const today = new Date()
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const daysLeft = Math.max(1, end.getDate() - today.getDate() + 1)
  const monthExpenses = transactions.filter((txn) => txn.type === 'expense' && txn.date.startsWith(month) && txn.status === 'completed')
  const totalSpent = monthExpenses.reduce((sum, txn) => sum + txn.amount, 0)
  const remaining = budget.salary - totalSpent
  const safePerDay = Math.max(0, remaining / daysLeft)

  const categoryRows = EXPENSE_CATEGORIES
    .map((category) => {
      const limit = budget.budgets[category]
      if (!limit) return null
      const spent = monthExpenses.filter((txn) => txn.category === category).reduce((sum, txn) => sum + txn.amount, 0)
      const pct = limit > 0 ? (spent / limit) * 100 : 0
      return { category, limit, spent, pct }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.pct - a.pct)
    .slice(0, 3) as Array<{ category: string; limit: number; spent: number; pct: number }>

  const risk = categoryRows.find((row) => row.pct >= 80)

  return (
    <section className="rounded-[var(--mon-radius-xl)] p-4" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>Budget Coach</p>
          <h3 className="mt-1 text-[20px] font-black" style={{ color: remaining >= 0 ? 'var(--mon-income)' : 'var(--mon-expense)' }}>
            {formatCurrency(safePerDay, currencySymbol)}
          </h3>
          <p className="mt-0.5 text-[12px]" style={{ color: 'var(--mon-text-3)' }}>safe to spend per day</p>
        </div>
        {risk && (
          <button
            onClick={() => onCreateTask(`Review ${CATEGORY_META[risk.category]?.labelEn || risk.category} budget`)}
            className="rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ color: 'var(--mon-gold)', background: 'var(--mon-gold-bg)', border: '1px solid var(--mon-gold-glow)' }}
          >
            Make Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Metric label="Remaining" value={formatCurrency(Math.abs(remaining), currencySymbol)} color={remaining >= 0 ? 'var(--mon-income)' : 'var(--mon-expense)'} />
        <Metric label="Days left" value={daysLeft} color="var(--mon-text-1)" />
      </div>

      {categoryRows.length > 0 && (
        <div className="space-y-3">
          {categoryRows.map((row) => {
            const meta = CATEGORY_META[row.category] || CATEGORY_META.other
            return (
              <div key={row.category}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--mon-text-2)' }}>{meta.icon} {meta.labelEn}</span>
                  <span className="text-[11px]" style={{ color: row.pct > 100 ? 'var(--mon-expense)' : row.pct > 80 ? 'var(--mon-gold)' : 'var(--mon-text-3)' }}>
                    {formatCurrency(row.spent, currencySymbol)} / {formatCurrency(row.limit, currencySymbol)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--mon-surface-3)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(row.pct, 100)}%`, background: row.pct > 100 ? 'var(--mon-expense)' : row.pct > 80 ? 'var(--mon-gold)' : meta.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function Metric({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-[var(--mon-radius-lg)] px-3 py-2" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{label}</p>
      <p className="mt-0.5 text-[16px] font-black" style={{ color }}>{value}</p>
    </div>
  )
}
