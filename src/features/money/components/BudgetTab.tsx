'use client'

import { useState, useMemo } from 'react'
import { EXPENSE_CATEGORIES, CATEGORY_META } from '../constants'
import { formatCurrency, getCurrentMonth } from '../utils'
import type { MonthlyBudget, Transaction } from '@/lib/types'

export default function BudgetTab({ budgets, transactions, currency_symbol, language, month, t, onSetBudget }: any) {
  const [editing, setEditing] = useState(false)
  const [salaryInput, setSalaryInput] = useState('')
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({})

  const currentBudget = budgets.find((b: MonthlyBudget) => b.month === month)
  const monthTxns = transactions.filter((t: Transaction) => t.date.startsWith(month) && t.type === 'expense')

  const spending = useMemo(() => {
    const map: Record<string, number> = {}
    monthTxns.forEach((t: Transaction) => { map[t.category] = (map[t.category] || 0) + t.amount })
    return map
  }, [monthTxns])

  const totalSpent = Object.values(spending).reduce((a: number, b: number) => a + b, 0)
  const salary = currentBudget?.salary || 0
  const remaining = salary - totalSpent
  const pctUsed = salary > 0 ? (totalSpent / salary) * 100 : 0
  const statusLabel = pctUsed >= 100 ? 'Over budget' : pctUsed >= 80 ? 'Watch closely' : salary > 0 ? 'On track' : 'Not set'
  const statusColor = pctUsed >= 100 ? 'var(--mon-expense)' : pctUsed >= 80 ? 'var(--mon-gold)' : 'var(--mon-income)'
  const topCategory = Object.entries(spending).sort((a, b) => b[1] - a[1])[0]

  const handleSave = () => {
    const newBudgets: Record<string, number> = {}
    EXPENSE_CATEGORIES.forEach((cat) => {
      const val = parseFloat(budgetInputs[cat] || '0')
      if (val > 0) newBudgets[cat] = val
    })
    onSetBudget({ month, salary: parseFloat(salaryInput) || 0, budgets: newBudgets })
    setEditing(false)
  }

  return (
    <div className="space-y-5 animate-[mon-slide-up_400ms_ease-out]">
      <div className="rounded-[var(--mon-radius-xl)] p-4" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>Budget health</p>
            <h3 className="mt-1 text-[18px] font-black" style={{ color: statusColor }}>{statusLabel}</h3>
          </div>
          <span className="rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: 'var(--mon-surface-2)', color: statusColor }}>
            {Math.round(pctUsed)}%
          </span>
        </div>
        <p className="mt-2 text-[13px] leading-5" style={{ color: 'var(--mon-text-2)' }}>
          {salary > 0
            ? `You have spent ${formatCurrency(totalSpent, currency_symbol)} of ${formatCurrency(salary, currency_symbol)} this month.`
            : 'Set a monthly income and category limits to see meaningful budget guidance.'}
        </p>
        {topCategory && (
          <p className="mt-1 text-[12px]" style={{ color: 'var(--mon-text-3)' }}>
            Top spending: {CATEGORY_META[topCategory[0]]?.labelEn || topCategory[0]} at {formatCurrency(topCategory[1], currency_symbol)}.
          </p>
        )}
      </div>

      {/* Budget Header */}
      <div className="p-4 rounded-[var(--mon-radius-xl)]" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>{t.monthlyBudget}</h3>
          <button onClick={() => {
            if (!editing) { setSalaryInput(salary.toString()); setBudgetInputs(currentBudget?.budgets ? Object.fromEntries(Object.entries(currentBudget.budgets as Record<string, number>).map(([k, v]) => [k, v.toString()])) : {}) }
            setEditing(!editing)
          }} className="text-[12px] font-semibold" style={{ color: 'var(--mon-gold)' }}>
            {editing ? t.cancel : t.edit}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--mon-text-3)' }}>{t.amount} (Salary/Income)</label>
              <input type="number" value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--mon-radius-lg)] text-[14px] outline-none"
                style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => (
                <div key={cat}>
                  <label className="text-[10px] font-medium block mb-1" style={{ color: 'var(--mon-text-3)' }}>{CATEGORY_META[cat].icon} {language === 'bn' ? CATEGORY_META[cat].labelBn : CATEGORY_META[cat].labelEn}</label>
                  <input type="number" value={budgetInputs[cat] || ''} onChange={(e) => setBudgetInputs((p: any) => ({ ...p, [cat]: e.target.value }))}
                    placeholder="0"
                    className="w-full px-2 py-1.5 rounded-[var(--mon-radius-md)] text-[13px] outline-none"
                    style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
                  />
                </div>
              ))}
            </div>
            <button onClick={handleSave}
              className="w-full py-2.5 rounded-[var(--mon-radius-lg)] text-[14px] font-semibold text-white transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, var(--mon-gold), var(--mon-gold-2))', boxShadow: '0 4px 16px var(--mon-gold-glow)' }}>
              {t.save}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] font-semibold" style={{ color: 'var(--mon-text-2)' }}>{formatCurrency(totalSpent, currency_symbol)} <span className="text-[11px]" style={{ color: 'var(--mon-text-3)' }}>{t.budgetUsed}</span></span>
              <span className="text-[14px] font-bold" style={{ color: remaining >= 0 ? 'var(--mon-income)' : 'var(--mon-expense)' }}>{formatCurrency(Math.abs(remaining), currency_symbol)} {remaining >= 0 ? t.remaining : t.overspent}</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--mon-surface-3)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(pctUsed, 100)}%`, background: pctUsed > 90 ? 'var(--mon-expense)' : pctUsed > 75 ? 'var(--mon-gold)' : 'var(--mon-income)' }}
              />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: 'var(--mon-text-3)' }}>{Math.round(pctUsed)}% {t.budgetUsed}</p>
          </>
        )}
      </div>

      {/* Category Budgets */}
      {!currentBudget && !editing && (
        <div className="rounded-[var(--mon-radius-xl)] p-4 text-center" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
          <p className="text-[15px] font-bold" style={{ color: 'var(--mon-text-1)' }}>Create your first budget</p>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--mon-text-3)' }}>Start with income, then set limits for food, transport, bills, and shopping.</p>
          <button
            type="button"
            onClick={() => {
              setSalaryInput('')
              setBudgetInputs({ food: '6000', transport: '2500', utilities: '2500', shopping: '3000' })
              setEditing(true)
            }}
            className="mt-3 rounded-[var(--mon-radius-lg)] px-4 py-2 text-[13px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--mon-gold), var(--mon-gold-2))' }}
          >
            Guided setup
          </button>
        </div>
      )}

      {currentBudget && (
        <div className="flex flex-col gap-3">
          {EXPENSE_CATEGORIES.filter((cat) => currentBudget.budgets[cat]).map((cat, i) => {
            const budget = currentBudget.budgets[cat]
            const spent = spending[cat] || 0
            const pct = budget > 0 ? (spent / budget) * 100 : 0
            const m = CATEGORY_META[cat]
            return (
              <div key={cat} className="flex items-center gap-3 p-3 rounded-[var(--mon-radius-lg)]" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)', animation: `mon-slide-up 350ms ease-out ${i * 50}ms both` }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: m.bg }}>{m.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-[13px] font-medium" style={{ color: 'var(--mon-text-2)' }}>{language === 'bn' ? m.labelBn : m.labelEn}</span>
                    <span className="text-[12px] font-semibold" style={{ color: 'var(--mon-text-1)' }}>{formatCurrency(spent, currency_symbol)} / {formatCurrency(budget, currency_symbol)}</span>
                  </div>
                  <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--mon-surface-3)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: pct > 100 ? 'var(--mon-expense)' : pct > 80 ? 'var(--mon-gold)' : m.color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
