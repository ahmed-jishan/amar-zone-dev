'use client'

import { useState, useMemo } from 'react'
import { useMoneyStore } from '../store/moneyStore'
import { formatCurrency, getCurrentMonth } from '../utils'
import { CATEGORY_META, EXPENSE_CATEGORIES } from '../constants'
import type { ExpenseCategory, CategoryLimit } from '@/lib/types'

const CIRCUMFERENCE = 138 // 2 * PI * 22

export default function CategoryLimits({ currencySymbol }: { currencySymbol: string }) {
  const month = getCurrentMonth()
  const categoryLimits = useMoneyStore((s) => s.categoryLimits)
  const spendingByCategory = useMoneyStore((s) => s.getCategoryBreakdown(month))
  const setCategoryLimit = useMoneyStore((s) => s.setCategoryLimit)
  const removeCategoryLimit = useMoneyStore((s) => s.removeCategoryLimit)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editLimit, setEditLimit] = useState(0)
  const [editAlert, setEditAlert] = useState(80)

  const limitsWithSpend = useMemo(() => {
    const existingLimits = categoryLimits.filter((cl) => cl.enabled)
    return existingLimits.map((cl) => ({
      ...cl,
      spent: spendingByCategory[cl.category] || 0,
    }))
  }, [categoryLimits, spendingByCategory])

  const enabledCategories = limitsWithSpend.map((l) => l.category)
  const availableCategories = EXPENSE_CATEGORIES.filter(
    (cat) => !enabledCategories.includes(cat as ExpenseCategory)
  ) as ExpenseCategory[]

  function handleAdd(category: ExpenseCategory) {
    setEditingCategory(category)
    setEditLimit(5000)
    setEditAlert(80)
  }

  function handleSave() {
    if (!editingCategory || editLimit <= 0) return
    setCategoryLimit({
      category: editingCategory as ExpenseCategory,
      monthlyLimit: editLimit,
      spent: spendingByCategory[editingCategory] || 0,
      alertAtPercent: editAlert,
      enabled: true,
    })
    setEditingCategory(null)
  }

  function handleRemove(category: string) {
    removeCategoryLimit(category as ExpenseCategory)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>
          Category Limits
        </h3>
      </div>

      {limitsWithSpend.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
            🎯
          </div>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--mon-text-2)' }}>No limits set</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--mon-text-3)' }}>Set monthly spending limits per category</p>
        </div>
      )}

      <div className="space-y-2">
        {limitsWithSpend.map((limit) => {
          const meta = CATEGORY_META[limit.category] || CATEGORY_META.other
          const pct = limit.monthlyLimit > 0 ? (limit.spent / limit.monthlyLimit) * 100 : 0
          const isOver = pct >= 100
          const isWarning = pct >= limit.alertAtPercent && !isOver
          const offset = CIRCUMFERENCE - (Math.min(pct, 100) / 100) * CIRCUMFERENCE

          return (
            <div key={limit.category} className="mon-card p-3.5 flex items-center gap-3">
              <div className="mon-limit-ring flex-shrink-0">
                <svg width="50" height="50" viewBox="0 0 50 50">
                  <circle className="limit-bg" cx="25" cy="25" r="22" fill="none" strokeWidth="4" />
                  <circle
                    className="limit-fg"
                    cx="25" cy="25" r="22"
                    fill="none"
                    strokeWidth="4"
                    stroke={isOver ? 'var(--mon-expense)' : isWarning ? 'var(--mon-amber)' : 'var(--mon-income)'}
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={offset}
                  />
                </svg>
                <span className="absolute text-[9px] font-bold" style={{ color: isOver ? 'var(--mon-expense)' : isWarning ? 'var(--mon-amber)' : 'var(--mon-income)' }}>
                  {Math.round(pct)}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium" style={{ color: 'var(--mon-text-1)' }}>
                    {meta.icon} {meta.labelEn}
                  </span>
                  <button
                    onClick={() => handleRemove(limit.category)}
                    className="text-[10px] font-medium opacity-0 group-hover:opacity-100 hover:text-[var(--mon-expense)] transition"
                    style={{ color: 'var(--mon-text-3)' }}
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--mon-text-2)' }}>
                    {formatCurrency(limit.spent, currencySymbol)}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--mon-text-3)' }}>/</span>
                  <span className="text-[12px]" style={{ color: 'var(--mon-text-3)' }}>
                    {formatCurrency(limit.monthlyLimit, currencySymbol)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add new limit */}
      {editingCategory ? (
        <div className="mon-card p-4 space-y-3">
          <p className="text-[13px] font-semibold" style={{ color: 'var(--mon-text-1)' }}>
            Limit for {CATEGORY_META[editingCategory]?.labelEn || editingCategory}
          </p>
          <div>
            <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--mon-text-3)' }}>Monthly Limit</label>
            <input
              type="number"
              value={editLimit}
              onChange={(e) => setEditLimit(Math.max(0, Number(e.target.value)))}
              className="w-full p-2.5 rounded-[var(--mon-radius-md)] text-[14px] font-semibold"
              style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
            />
          </div>
          <div>
            <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--mon-text-3)' }}>Alert at {editAlert}%</label>
            <input
              type="range"
              min={50}
              max={100}
              value={editAlert}
              onChange={(e) => setEditAlert(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="mon-btn mon-btn-primary flex-1">Save Limit</button>
            <button onClick={() => setEditingCategory(null)} className="mon-btn mon-btn-ghost">Cancel</button>
          </div>
        </div>
      ) : (
        availableCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableCategories.slice(0, 4).map((cat) => (
              <button
                key={cat}
                onClick={() => handleAdd(cat)}
                className="text-[11px] font-medium rounded-full px-3 py-1.5 transition-all active:scale-95"
                style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-2)' }}
              >
                + {CATEGORY_META[cat]?.labelEn || cat}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  )
}