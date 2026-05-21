'use client'

import { useState } from 'react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_META } from '../constants'
import type { TransactionType } from '@/lib/types'

export default function AddTransactionModal({ onClose, onAdd, translations: t, currencySymbol }: any) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    onAdd({
      type,
      amount: parseFloat(amount),
      category: category as any,
      note: note || undefined,
      date,
      isRecurring: false,
      walletId: 'default',
    })
    onClose()
  }

  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-[mon-fade-in_150ms_ease-out]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-[420px] mx-4 rounded-[var(--mon-radius-2xl)] overflow-hidden animate-[mon-scale-in_200ms_ease-out] mon-glass shadow-[var(--mon-shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--mon-border)' }}>
          <h3 className="text-[16px] font-bold" style={{ color: 'var(--mon-text-1)' }}>{t.addTransaction}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--mon-text-3)] hover:text-[var(--mon-text-1)] hover:bg-[var(--mon-surface-hover)] transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type Toggle */}
          <div className="flex p-1 rounded-[var(--mon-radius-lg)]" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
            {(['expense', 'income'] as const).map((tType) => (
              <button key={tType} type="button" onClick={() => { setType(tType); setCategory(tType === 'income' ? 'salary' : 'food') }}
                className={`flex-1 py-2 rounded-md text-[13px] font-semibold transition-all ${type === tType ? 'text-white shadow-sm' : 'text-[var(--mon-text-3)]'}`}
                style={type === tType ? { background: tType === 'income' ? 'var(--mon-income)' : 'var(--mon-expense)' } : {}}
              >
                {(t as any)[tType + '_type']}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.amount}</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--mon-radius-lg)]" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
              <span className="text-[18px] font-light" style={{ color: 'var(--mon-text-3)' }}>{currencySymbol}</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" autoFocus
                className="flex-1 bg-transparent text-[20px] font-bold outline-none" style={{ color: 'var(--mon-text-1)' }}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.category}</label>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((cat) => {
                const m = CATEGORY_META[cat]
                return (
                  <button key={cat} type="button" onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1.5 rounded-md text-[12px] font-semibold border transition-all flex items-center gap-1 ${category === cat ? 'text-white shadow-sm' : 'hover:border-[var(--mon-border-hover)]'}`}
                    style={category === cat ? { background: m.color, borderColor: m.color } : { background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-2)' }}
                  >
                    <span>{m.icon}</span>
                    <span>{m.labelEn}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Note & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.note}</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2 rounded-[var(--mon-radius-lg)] text-[14px] outline-none"
                style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.date}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--mon-radius-lg)] text-[14px] outline-none"
                style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
              />
            </div>
          </div>

          <button type="submit" disabled={!amount}
            className="w-full py-3 rounded-[var(--mon-radius-xl)] text-[15px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, var(--mon-gold), var(--mon-gold-2))', boxShadow: '0 4px 20px var(--mon-gold-glow)' }}
          >
            {t.save}
          </button>
        </form>
      </div>
    </div>
  )
}
