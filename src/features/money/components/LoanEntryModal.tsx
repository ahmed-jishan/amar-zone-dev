'use client'

import { useState } from 'react'
import { todayISO, formatCurrency } from '../utils'
import type { Loan } from '@/lib/types'

export default function LoanEntryModal({ loan, type, onClose, onSubmit, translations: t, currencySymbol }: {
  loan: Loan; type: 'repay' | 'add'; onClose: () => void; onSubmit: (loanId: string, amount: number, note: string, date: string) => void; translations: any; currencySymbol: string
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())

  const maxAmount = loan.currentBalance
  const isRepay = type === 'repay'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    if (isRepay && val > maxAmount) return
    onSubmit(loan.id, isRepay ? -val : val, note, date)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-[mon-fade-in_150ms_ease-out]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-[380px] mx-4 rounded-[var(--mon-radius-2xl)] overflow-hidden animate-[mon-scale-in_200ms_ease-out] mon-glass shadow-[var(--mon-shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--mon-border)' }}>
          <h3 className="text-[16px] font-bold" style={{ color: 'var(--mon-text-1)' }}>
            {isRepay ? t.repay : t.add} — {loan.personName}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--mon-text-3)] hover:text-[var(--mon-text-1)] hover:bg-[var(--mon-surface-hover)] transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.amount}</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--mon-radius-lg)]" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
              <span className="text-[18px] font-light" style={{ color: 'var(--mon-text-3)' }}>{currencySymbol}</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" autoFocus
                className="flex-1 bg-transparent text-[20px] font-bold outline-none" style={{ color: 'var(--mon-text-1)' }}
              />
            </div>
            {isRepay && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--mon-text-3)' }}>{t.maxRepayHint}: {formatCurrency(maxAmount, currencySymbol)}</p>
            )}
          </div>

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

          <button type="submit" disabled={!amount || parseFloat(amount) <= 0 || (isRepay && parseFloat(amount) > maxAmount)}
            className="w-full py-3 rounded-[var(--mon-radius-xl)] text-[15px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: isRepay ? 'linear-gradient(135deg, var(--mon-income), #16a34a)' : 'linear-gradient(135deg, var(--mon-expense), #dc2626)', boxShadow: isRepay ? '0 4px 20px var(--mon-income-glow)' : '0 4px 20px var(--mon-expense-glow)' }}
          >
            {isRepay ? t.repay : t.add}
          </button>
        </form>
      </div>
    </div>
  )
}
