'use client'

import { useState, useMemo } from 'react'
import { useMoneyStore } from '../store/moneyStore'
import { formatCurrency, todayISO } from '../utils'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants'
import type { TransactionType } from '@/lib/types'

export default function RecurringManager({ currencySymbol }: { currencySymbol: string }) {
  const recurringTemplates = useMoneyStore((s) => s.recurringTemplates)
  const addRecurringTemplate = useMoneyStore((s) => s.addRecurringTemplate)
  const updateRecurringTemplate = useMoneyStore((s) => s.updateRecurringTemplate)
  const deleteRecurringTemplate = useMoneyStore((s) => s.deleteRecurringTemplate)
  const pauseRecurringTemplate = useMoneyStore((s) => s.pauseRecurringTemplate)
  const resumeRecurringTemplate = useMoneyStore((s) => s.resumeRecurringTemplate)
  const [showForm, setShowForm] = useState(false)

  const [formType, setFormType] = useState<TransactionType>('expense')
  const [formAmount, setFormAmount] = useState(0)
  const [formCategory, setFormCategory] = useState('food')
  const [formNote, setFormNote] = useState('')
  const [formInterval, setFormInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')

  const activeTemplates = useMemo(() => recurringTemplates.filter((rt) => rt.status === 'active'), [recurringTemplates])
  const pausedTemplates = useMemo(() => recurringTemplates.filter((rt) => rt.status === 'paused'), [recurringTemplates])

  function handleSubmit() {
    if (formAmount <= 0) return
    addRecurringTemplate({
      type: formType,
      amount: formAmount,
      category: formCategory as any,
      note: formNote || undefined,
      interval: formInterval,
      nextDate: todayISO(),
      status: 'active',
    })
    setShowForm(false)
    setFormAmount(0)
    setFormNote('')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>
          Recurring Transactions
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="mon-btn mon-btn-ghost text-[11px] !px-3 !py-1.5">
          + Add
        </button>
      </div>

      {recurringTemplates.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
            🔄
          </div>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--mon-text-2)' }}>No recurring transactions</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--mon-text-3)' }}>Auto-create transactions on a schedule</p>
        </div>
      )}

      {activeTemplates.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--mon-text-4)' }}>Active</p>
          <div className="space-y-1.5">
            {activeTemplates.map((rt) => (
              <div key={rt.id} className="mon-card p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: rt.type === 'income' ? 'var(--mon-income-bg)' : 'var(--mon-expense-bg)' }}>
                  {rt.type === 'income' ? '📥' : '📤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--mon-text-1)' }}>{rt.note || rt.category}</p>
                  <p className="text-[11px]" style={{ color: 'var(--mon-text-3)' }}>
                    {rt.interval} · Next: {rt.nextDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-bold" style={{ color: rt.type === 'income' ? 'var(--mon-income)' : 'var(--mon-expense)' }}>
                    {rt.type === 'income' ? '+' : '-'}{formatCurrency(rt.amount, currencySymbol)}
                  </p>
                </div>
                <button
                  onClick={() => pauseRecurringTemplate(rt.id)}
                  className="text-[10px] rounded-full px-2 py-1 hover:bg-[var(--mon-surface-2)] transition"
                  style={{ color: 'var(--mon-text-3)' }}
                >
                  ⏸
                </button>
                <button
                  onClick={() => deleteRecurringTemplate(rt.id)}
                  className="text-[10px] hover:text-[var(--mon-expense)] transition"
                  style={{ color: 'var(--mon-text-4)' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pausedTemplates.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--mon-text-4)' }}>Paused</p>
          <div className="space-y-1.5">
            {pausedTemplates.map((rt) => (
              <div key={rt.id} className="mon-card p-3 flex items-center gap-3 opacity-60">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'var(--mon-surface-2)' }}>⏸</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--mon-text-2)' }}>{rt.note || rt.category}</p>
                  <p className="text-[11px]" style={{ color: 'var(--mon-text-4)' }}>{rt.interval} · Paused</p>
                </div>
                <button
                  onClick={() => resumeRecurringTemplate(rt.id)}
                  className="text-[10px] rounded-full px-2 py-1 transition"
                  style={{ color: 'var(--mon-text-3)', background: 'var(--mon-surface-2)' }}
                >
                  ▶ Resume
                </button>
                <button
                  onClick={() => deleteRecurringTemplate(rt.id)}
                  className="text-[10px] hover:text-[var(--mon-expense)] transition"
                  style={{ color: 'var(--mon-text-4)' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="mon-card p-4 space-y-3 animate-[mon-slide-down_300ms_ease-out]">
          <div className="flex gap-2">
            <button
              onClick={() => setFormType('expense')}
              className={`flex-1 py-2 rounded-[var(--mon-radius-md)] text-[12px] font-bold transition ${formType === 'expense' ? 'bg-[var(--mon-expense-bg)] text-[var(--mon-expense)]' : 'bg-[var(--mon-surface-2)] text-[var(--mon-text-3)]'}`}
            >
              Expense
            </button>
            <button
              onClick={() => setFormType('income')}
              className={`flex-1 py-2 rounded-[var(--mon-radius-md)] text-[12px] font-bold transition ${formType === 'income' ? 'bg-[var(--mon-income-bg)] text-[var(--mon-income)]' : 'bg-[var(--mon-surface-2)] text-[var(--mon-text-3)]'}`}
            >
              Income
            </button>
          </div>

          <input
            type="number"
            placeholder="Amount"
            value={formAmount || ''}
            onChange={(e) => setFormAmount(Math.max(0, Number(e.target.value)))}
            className="w-full p-2.5 rounded-[var(--mon-radius-md)] text-[14px] font-semibold"
            style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
          />

          <select
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            className="w-full p-2.5 rounded-[var(--mon-radius-md)] text-[13px]"
            style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
          >
            {(formType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Note (optional)"
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
            className="w-full p-2.5 rounded-[var(--mon-radius-md)] text-[13px]"
            style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
          />

          <select
            value={formInterval}
            onChange={(e) => setFormInterval(e.target.value as any)}
            className="w-full p-2.5 rounded-[var(--mon-radius-md)] text-[13px]"
            style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          <div className="flex gap-2">
            <button onClick={handleSubmit} className="mon-btn mon-btn-primary flex-1">Add Recurring</button>
            <button onClick={() => setShowForm(false)} className="mon-btn mon-btn-ghost">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}