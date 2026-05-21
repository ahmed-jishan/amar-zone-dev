'use client'

import { getRelativeDate, formatCurrency } from '../utils'
import type { Loan } from '@/lib/types'

export default function LoansTab({ t, activeLoans, completedLoans, currency_symbol, onAdd, onHistory, onPayment, onAddExtra, onEdit, onDelete, onSettle, onReactivate }: any) {
  return (
    <div className="space-y-4 animate-[mon-slide-up_400ms_ease-out]">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>{t.activeLoans}</h3>
        <button onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all hover:scale-105"
          style={{ color: 'var(--mon-gold)', background: 'var(--mon-gold-bg)', border: '1px solid var(--mon-gold-glow)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4v16m8-8H4" /></svg>
          {t.addLoan}
        </button>
      </div>

      {activeLoans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-16 h-16 rounded-[var(--mon-radius-xl)] flex items-center justify-center text-2xl mb-4 animate-[mon-float_4s_ease-in-out_infinite]"
            style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>🤝</div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--mon-text-2)' }}>{t.emptyLoan}</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--mon-text-3)' }}>{t.emptyLoanSub}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeLoans.map((loan: Loan, i: number) => (
            <LoanCard key={loan.id} loan={loan} index={i} currency_symbol={currency_symbol} t={t}
              onHistory={() => onHistory(loan)} onPayment={() => onPayment(loan)} onAddExtra={() => onAddExtra(loan)}
              onEdit={() => onEdit(loan)} onDelete={() => onDelete(loan.id)} onSettle={() => onSettle(loan.id)} />
          ))}
        </div>
      )}

      {completedLoans.length > 0 && (
        <>
          <h3 className="text-[11px] font-semibold uppercase tracking-[1.2px] mt-6" style={{ color: 'var(--mon-text-3)' }}>{t.completedLoans}</h3>
          <div className="flex flex-col gap-3">
            {completedLoans.map((loan: Loan, i: number) => (
              <LoanCard key={loan.id} loan={loan} index={i} currency_symbol={currency_symbol} t={t} isCompleted
                onHistory={() => onHistory(loan)} onReactivate={() => onReactivate(loan.id)} onDelete={() => onDelete(loan.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function LoanCard({ loan, index, currency_symbol, t, isCompleted, onHistory, onPayment, onAddExtra, onEdit, onDelete, onSettle, onReactivate }: any) {
  const repaid = loan.initialAmount - loan.currentBalance
  const pct = loan.initialAmount > 0 ? (repaid / loan.initialAmount) * 100 : 0
  const isGiven = loan.direction === 'given'
  const rel = loan.dueDate ? getRelativeDate(loan.dueDate) : null

  return (
    <div className="p-4 rounded-[var(--mon-radius-xl)] transition-all duration-200 hover:border-[var(--mon-border-hover)] group"
      style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)', animation: `mon-slide-up 350ms ease-out ${index * 40}ms both` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{isGiven ? '📤' : '📥'}</span>
          <div>
            <p className="text-[15px] font-bold" style={{ color: 'var(--mon-text-1)' }}>{loan.personName}</p>
            <p className="text-[11px]" style={{ color: 'var(--mon-text-3)' }}>
              {isGiven ? t.given : t.taken} · {formatCurrency(loan.initialAmount, currency_symbol)}
              {loan.dueDate && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${rel?.isOverdue ? 'text-[var(--mon-expense)] bg-[var(--mon-expense-bg)]' : 'text-[var(--mon-text-3)] bg-[var(--mon-surface-2)]'}`}>
                  {rel?.label}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-black" style={{ color: isGiven ? 'var(--mon-income)' : 'var(--mon-expense)' }}>
            {formatCurrency(loan.currentBalance, currency_symbol)}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--mon-text-3)' }}>{t.currentBalance}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="h-[4px] rounded-full overflow-hidden mb-3" style={{ background: 'var(--mon-surface-3)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: isGiven ? 'var(--mon-income)' : 'var(--mon-expense)' }} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--mon-text-3)' }}>{Math.round(pct)}% {t.repaidPercent}</span>
        <span className="text-[11px]" style={{ color: 'var(--mon-text-3)' }}>{loan.entries.length} {t.history}</span>
      </div>

      {/* Actions */}
      {!isCompleted ? (
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={onPayment}
            className="flex-1 min-w-[80px] px-3 py-2 rounded-[var(--mon-radius-md)] text-[12px] font-semibold text-center transition-all active:scale-[0.97]"
            style={{ background: 'var(--mon-gold-bg)', color: 'var(--mon-gold)', border: '1px solid var(--mon-gold-glow)' }}>
            {t.repay}
          </button>
          <button onClick={onAddExtra}
            className="flex-1 min-w-[80px] px-3 py-2 rounded-[var(--mon-radius-md)] text-[12px] font-semibold text-center transition-all active:scale-[0.97]"
            style={{ background: 'var(--mon-surface-2)', color: 'var(--mon-text-2)', border: '1px solid var(--mon-border)' }}>
            {t.add}
          </button>
          <button onClick={onHistory}
            className="px-3 py-2 rounded-[var(--mon-radius-md)] text-[12px] font-semibold text-center transition-all active:scale-[0.97]"
            style={{ background: 'var(--mon-surface-2)', color: 'var(--mon-text-2)', border: '1px solid var(--mon-border)' }}>
            {t.history}
          </button>
          <button onClick={onSettle}
            className="px-3 py-2 rounded-[var(--mon-radius-md)] text-[12px] font-semibold text-center transition-all active:scale-[0.97]"
            style={{ background: 'var(--mon-income-bg)', color: 'var(--mon-income)', border: '1px solid var(--mon-income-glow)' }}>
            {t.settled}
          </button>
          <button onClick={onEdit}
            className="p-2 rounded-[var(--mon-radius-md)] text-[var(--mon-text-3)] hover:text-[var(--mon-text-1)] hover:bg-[var(--mon-surface-hover)] transition-all opacity-0 group-hover:opacity-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={onDelete}
            className="p-2 rounded-[var(--mon-radius-md)] text-[var(--mon-text-3)] hover:text-[var(--mon-expense)] hover:bg-[var(--mon-expense-bg)] transition-all opacity-0 group-hover:opacity-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-[var(--mon-income-bg)] text-[var(--mon-income)] border border-[var(--mon-income-glow)]">✓ {t.settled}</span>
          <button onClick={onReactivate} className="px-3 py-1.5 rounded-[var(--mon-radius-md)] text-[12px] font-semibold text-[var(--mon-text-2)] hover:bg-[var(--mon-surface-hover)] transition-all">{t.reactivate}</button>
          <button onClick={onDelete} className="p-1.5 rounded-[var(--mon-radius-md)] text-[var(--mon-text-3)] hover:text-[var(--mon-expense)] hover:bg-[var(--mon-expense-bg)] transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      )}
    </div>
  )
}
