'use client'

import { useState, useRef, useCallback } from 'react'
import { CATEGORY_META } from '../constants'
import { formatCurrency, toLocalDateISO, todayISO } from '../utils'
import type { Transaction } from '@/lib/types'
import { useMoneyHaptics } from '../hooks/useMoneyHaptics'

function transactionGroup(date: string) {
  const today = todayISO()
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = toLocalDateISO(yesterdayDate)
  if (date === today) return 'Today'
  if (date === yesterday) return 'Yesterday'
  return date
}

// ─── Swipe-to-Delete Row ───
function SwipeableRow({
  txn,
  index,
  currency_symbol,
  language,
  onDelete,
  onEdit,
}: {
  txn: Transaction
  index: number
  currency_symbol: string
  language: string
  onDelete: (id: string) => void
  onEdit: (txn: Transaction) => void
}) {
  const [swiped, setSwiped] = useState(false)
  const touchStart = useRef(0)
  const haptics = useMoneyHaptics()
  const m = CATEGORY_META[txn.category] || CATEGORY_META.other
  const isIncome = txn.type === 'income'

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStart.current
    if (deltaX < -40) {
      setSwiped(true)
      haptics.tapMedium()
    } else if (deltaX > 40) {
      setSwiped(false)
    }
  }, [haptics])

  const handleDelete = useCallback(() => {
    setSwiped(false)
    onDelete(txn.id)
  }, [txn.id, onDelete])

  return (
    <div className="mon-swipe-row">
      <div className={`swipe-content ${swiped ? 'swiped' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-3 p-3 rounded-[var(--mon-radius-lg)] transition-all duration-200 hover:border-[var(--mon-border-hover)] group"
          style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)', animation: `mon-slide-up 350ms ease-out ${index * 40}ms both` }}
          onClick={() => onEdit(txn)}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: m.bg }}>{m.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--mon-text-1)' }}>{txn.note || (language === 'bn' ? m.labelBn : m.labelEn)}</p>
            <p className="text-[11px]" style={{ color: 'var(--mon-text-3)' }}>{txn.date} / {language === 'bn' ? m.labelBn : m.labelEn}</p>
          </div>
          <div className="text-right">
            <p className="text-[15px] font-bold" style={{ color: isIncome ? 'var(--mon-income)' : 'var(--mon-expense)' }}>
              {isIncome ? '+' : '-'}{formatCurrency(txn.amount, currency_symbol)}
            </p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); handleDelete() }} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg text-[var(--mon-text-3)] hover:text-[var(--mon-expense)] hover:bg-[var(--mon-expense-bg)] transition-all" aria-label="Delete transaction">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
      <div className="swipe-delete-action" onClick={handleDelete}>
        Delete
      </div>
    </div>
  )
}

export default function TransactionsTab({ t, monthTxns, searchQuery, filterType, currency_symbol, language, onSearch, onFilter, onDelete, onEdit }: any) {
  const groupedTxns = monthTxns.reduce((groups: Record<string, Transaction[]>, txn: Transaction) => {
    const label = transactionGroup(txn.date)
    groups[label] = groups[label] || []
    groups[label].push(txn)
    return groups
  }, {})

  return (
    <div className="space-y-4 animate-[mon-slide-up_400ms_ease-out]">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--mon-text-3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={searchQuery} onChange={(e) => onSearch(e.target.value)} placeholder={t.search}
            className="w-full pl-9 pr-4 py-2.5 rounded-[var(--mon-radius-xl)] text-[14px] outline-none transition-all"
            style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'income', 'expense'] as const).map((ft) => (
          <button key={ft} onClick={() => onFilter(ft)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${filterType === ft ? 'text-white shadow-sm' : 'border hover:border-[var(--mon-border-hover)]'}`}
            style={filterType === ft
              ? { background: ft === 'income' ? 'var(--mon-income)' : ft === 'expense' ? 'var(--mon-expense)' : 'var(--mon-gold)' }
              : { background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-2)' }
            }
          >
            {(t as any)[ft === 'all' ? 'all' : ft + '_type'] || ft}
          </button>
        ))}
      </div>
      <p className="text-[12px]" style={{ color: 'var(--mon-text-3)' }}>
        Showing {monthTxns.length} {filterType === 'all' ? 'transactions' : filterType} this month.
      </p>

      {monthTxns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-16 h-16 rounded-[var(--mon-radius-xl)] flex items-center justify-center text-2xl mb-4 animate-[mon-float_4s_ease-in-out_infinite]"
            style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>$</div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--mon-text-2)' }}>{t.emptyTx}</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--mon-text-3)' }}>{t.emptySub}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(Object.entries(groupedTxns) as Array<[string, Transaction[]]>).map(([group, txns]) => (
            <section key={group} className="space-y-2">
              <p className="px-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{group}</p>
              {txns.map((txn: Transaction, i: number) => (
                <SwipeableRow
                  key={txn.id}
                  txn={txn}
                  index={i}
                  currency_symbol={currency_symbol}
                  language={language}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}