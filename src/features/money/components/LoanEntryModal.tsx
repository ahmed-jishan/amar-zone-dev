'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { todayISO, formatCurrency } from '../utils'
import type { Loan } from '@/lib/types'

export default function LoanEntryModal({ loan, type, onClose, onSubmit, translations: t, currencySymbol }: {
  loan: Loan; type: 'repay' | 'add'; onClose: () => void; onSubmit: (loanId: string, amount: number, note: string, date: string) => void; translations: any; currencySymbol: string
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())
  const [mounted, setMounted] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)

  const maxAmount = loan.currentBalance
  const isRepay = type === 'repay'

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    // Auto-focus amount input after animation
    setTimeout(() => amountRef.current?.focus(), 250)
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    if (isRepay && val > maxAmount) return
    onSubmit(loan.id, isRepay ? -val : val, note, date)
    onClose()
  }

  const quickAmounts = isRepay
    ? [maxAmount * 0.25, maxAmount * 0.5, maxAmount * 0.75, maxAmount]
    : [1000, 5000, 10000, 20000]

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-[mon-fade-in_150ms_ease-out]" onClick={onClose}>
      {/* Backdrop with enhanced blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Premium Modal Card */}
      <div
        className="relative w-full max-w-[400px] max-h-[90vh] overflow-y-auto rounded-[var(--mon-radius-2xl)] animate-[mon-scale-in_250ms_ease-out] mon-glass shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
        style={{ border: '1px solid var(--mon-glass-border-2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold accent line at top */}
        <div className="absolute top-0 left-8 right-8 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--mon-gold), transparent)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{
                background: isRepay ? 'var(--mon-income-bg)' : 'var(--mon-expense-bg)',
                border: `1px solid ${isRepay ? 'var(--mon-income-glow)' : 'var(--mon-expense-glow)'}`
              }}
            >
              {isRepay ? '💳' : '➕'}
            </div>
            <div>
              <h3 className="text-[17px] font-bold tracking-[-0.3px]" style={{ color: 'var(--mon-text-1)' }}>
                {isRepay ? 'Repay' : 'Add'} — {loan.personName}
              </h3>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--mon-text-3)' }}>
                Current balance: <span className="font-bold" style={{ color: 'var(--mon-gold)' }}>{formatCurrency(loan.currentBalance, currencySymbol)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 hover:bg-[var(--mon-surface-2)]"
            style={{ border: '1px solid var(--mon-border)', color: 'var(--mon-text-3)' }}
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Amount Display */}
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--mon-text-3)' }}>{t.amount}</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-[22px] font-light" style={{ color: 'var(--mon-text-3)' }}>{currencySymbol}</span>
              <input
                ref={amountRef}
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                step="any"
                className="w-36 bg-transparent text-[36px] font-black text-center outline-none tabular-nums"
                style={{ color: isRepay ? 'var(--mon-income)' : 'var(--mon-expense)', caretColor: 'var(--mon-gold)' }}
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          {isRepay && maxAmount > 0 && (
            <div className="flex gap-2 justify-center">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setAmount(String(Math.round((maxAmount * pct) / 100)))}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                  style={{
                    background: 'var(--mon-surface-2)',
                    border: '1px solid var(--mon-border)',
                    color: parseFloat(amount) >= maxAmount * pct / 100 ? 'var(--mon-gold)' : 'var(--mon-text-3)'
                  }}
                >
                  {pct}%
                </button>
              ))}
            </div>
          )}

          {/* Note & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.note}</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2.5 rounded-[var(--mon-radius-lg)] text-[14px] outline-none transition-all"
                style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.date}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-[var(--mon-radius-lg)] text-[14px] outline-none transition-all"
                style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0 || (isRepay && parseFloat(amount) > maxAmount)}
            className="w-full py-3.5 rounded-[var(--mon-radius-xl)] text-[15px] font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isRepay
                ? 'linear-gradient(135deg, var(--mon-income), #16a34a)'
                : 'linear-gradient(135deg, var(--mon-expense), #dc2626)',
              boxShadow: isRepay ? '0 8px 24px var(--mon-income-glow)' : '0 8px 24px var(--mon-expense-glow)',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              {isRepay ? '↓' : '↑'}
              {isRepay ? t.repay : t.add}
              {amount && parseFloat(amount) > 0 ? ` ${formatCurrency(parseFloat(amount), currencySymbol)}` : ''}
            </span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}