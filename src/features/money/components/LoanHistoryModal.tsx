'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { formatCurrency } from '../utils'
import type { Loan } from '@/lib/types'

export default function LoanHistoryModal({ loan, onClose, translations: t, currencySymbol }: { loan: Loan; onClose: () => void; translations: any; currencySymbol: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const sortedEntries = [...loan.entries].reverse()

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-[mon-fade-in_150ms_ease-out]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Premium Modal Card */}
      <div
        className="relative w-full max-w-[420px] max-h-[85vh] rounded-[var(--mon-radius-2xl)] animate-[mon-scale-in_250ms_ease-out] mon-glass shadow-[0_32px_64px_rgba(0,0,0,0.5)] flex flex-col"
        style={{ border: '1px solid var(--mon-glass-border-2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold accent line */}
        <div className="absolute top-0 left-8 right-8 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--mon-gold), transparent)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'var(--mon-gold-bg)', border: '1px solid var(--mon-gold-glow)' }}
            >
              📋
            </div>
            <div>
              <h3 className="text-[17px] font-bold tracking-[-0.3px]" style={{ color: 'var(--mon-text-1)' }}>
                {loan.personName}
              </h3>
              <p className="text-[12px]" style={{ color: 'var(--mon-text-3)' }}>{t.history} · {loan.entries.length} entries</p>
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

        {/* Summary Card */}
        <div className="mx-6 mb-4 flex items-center justify-between p-4 rounded-[var(--mon-radius-xl)] flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--mon-surface-2), var(--mon-surface-3))', border: '1px solid var(--mon-border)' }}
        >
          <div className="text-center flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{t.principal}</p>
            <p className="text-[18px] font-black mt-1" style={{ color: 'var(--mon-text-1)' }}>{formatCurrency(loan.initialAmount, currencySymbol)}</p>
          </div>
          <div className="w-px h-10" style={{ background: 'var(--mon-border)' }} />
          <div className="text-center flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{t.currentBalance}</p>
            <p className="text-[18px] font-black mt-1" style={{ color: loan.direction === 'given' ? 'var(--mon-income)' : 'var(--mon-expense)' }}>
              {formatCurrency(loan.currentBalance, currencySymbol)}
            </p>
          </div>
          <div className="w-px h-10" style={{ background: 'var(--mon-border)' }} />
          <div className="text-center flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>Repaid</p>
            <p className="text-[18px] font-black mt-1" style={{ color: 'var(--mon-income)' }}>
              {formatCurrency(loan.initialAmount - loan.currentBalance, currencySymbol)}
            </p>
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 mon-scrollbar">
          {sortedEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3"
                style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}
              >
                📭
              </div>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--mon-text-2)' }}>No activity yet</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--mon-text-3)' }}>Transactions will appear here</p>
            </div>
          ) : (
            sortedEntries.map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3.5 rounded-[var(--mon-radius-lg)] transition-all hover:border-[var(--mon-border-hover)]"
                style={{
                  background: 'var(--mon-surface-1)',
                  border: '1px solid var(--mon-border)',
                  animation: `mon-slide-up 300ms ease-out ${i * 30}ms both`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-bold flex-shrink-0"
                  style={{
                    background: entry.type === 'repaid' ? 'var(--mon-income-bg)' : 'var(--mon-expense-bg)',
                    color: entry.type === 'repaid' ? 'var(--mon-income)' : 'var(--mon-expense)',
                    border: `1px solid ${entry.type === 'repaid' ? 'var(--mon-income-glow)' : 'var(--mon-expense-glow)'}`,
                  }}
                >
                  {entry.type === 'repaid' ? '↓' : '↑'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--mon-text-1)' }}>
                    {entry.type === 'repaid' ? 'Repayment' : 'Addition'}
                  </p>
                  {entry.note && (
                    <p className="text-[11px] truncate" style={{ color: 'var(--mon-text-3)' }}>{entry.note}</p>
                  )}
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--mon-text-4)' }}>{entry.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[14px] font-bold" style={{
                    color: entry.type === 'repaid' ? 'var(--mon-income)' : 'var(--mon-expense)'
                  }}>
                    {entry.type === 'repaid' ? '-' : '+'}{formatCurrency(entry.amount, currencySymbol)}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--mon-text-4)' }}>Bal: {formatCurrency(entry.balanceAfter, currencySymbol)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}