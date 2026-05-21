'use client'

import { formatCurrency } from '../utils'
import type { Loan } from '@/lib/types'

export default function LoanHistoryModal({ loan, onClose, translations: t, currencySymbol }: { loan: Loan; onClose: () => void; translations: any; currencySymbol: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-[mon-fade-in_150ms_ease-out]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-[420px] mx-4 max-h-[80vh] rounded-[var(--mon-radius-2xl)] overflow-hidden animate-[mon-scale-in_200ms_ease-out] mon-glass shadow-[var(--mon-shadow-lg)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--mon-border)' }}>
          <div>
            <h3 className="text-[16px] font-bold" style={{ color: 'var(--mon-text-1)' }}>{loan.personName}</h3>
            <p className="text-[12px]" style={{ color: 'var(--mon-text-3)' }}>{t.history}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--mon-text-3)] hover:text-[var(--mon-text-1)] hover:bg-[var(--mon-surface-hover)] transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2 mon-scrollbar">
          <div className="flex items-center justify-between p-3 rounded-[var(--mon-radius-lg)] mb-4" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
            <div>
              <p className="text-[11px]" style={{ color: 'var(--mon-text-3)' }}>{t.principal}</p>
              <p className="text-[16px] font-bold" style={{ color: 'var(--mon-text-1)' }}>{formatCurrency(loan.initialAmount, currencySymbol)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px]" style={{ color: 'var(--mon-text-3)' }}>{t.currentBalance}</p>
              <p className="text-[16px] font-bold" style={{ color: loan.direction === 'given' ? 'var(--mon-income)' : 'var(--mon-expense)' }}>
                {formatCurrency(loan.currentBalance, currencySymbol)}
              </p>
            </div>
          </div>

          {[...loan.entries].reverse().map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 p-3 rounded-[var(--mon-radius-lg)]" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${entry.type === 'repaid' ? 'text-[var(--mon-income)] bg-[var(--mon-income-bg)]' : 'text-[var(--mon-expense)] bg-[var(--mon-expense-bg)]'}`}>
                {entry.type === 'repaid' ? '↓' : '↑'}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold" style={{ color: 'var(--mon-text-1)' }}>
                  {entry.type === 'repaid' ? 'Repayment' : 'Additional'} {formatCurrency(entry.amount, currencySymbol)}
                </p>
                {entry.note && <p className="text-[11px]" style={{ color: 'var(--mon-text-3)' }}>{entry.note}</p>}
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--mon-text-4)' }}>{entry.date}</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-semibold" style={{ color: 'var(--mon-text-2)' }}>Bal: {formatCurrency(entry.balanceAfter, currencySymbol)}</p>
              </div>
            </div>
          ))}

          {loan.entries.length === 0 && (
            <div className="text-center py-8 text-[14px]" style={{ color: 'var(--mon-text-3)' }}>No payment history yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
