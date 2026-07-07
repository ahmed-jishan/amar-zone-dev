'use client'

import { X, Calendar, Wallet, SlidersHorizontal, Search } from 'lucide-react'
import { CATEGORY_META, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants'
import { useMoneyHaptics } from '../hooks/useMoneyHaptics'
import type { Transaction } from '@/lib/types'
import { useCallback, useMemo, useRef, useState } from 'react'

interface FilterState {
  query: string
  type: 'all' | 'income' | 'expense'
  categories: string[]
  walletId: string | null
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
}

interface TransactionFilterBarProps {
  transactions: Transaction[]
  wallets: { id: string; name: string; icon: string }[]
  filter: FilterState
  onChange: (filter: FilterState) => void
  onReset: () => void
}

type ActivePanel = 'categories' | 'wallet' | 'date' | 'amount' | null

export type { FilterState }

export default function TransactionFilterBar({
  transactions,
  wallets,
  filter,
  onChange,
  onReset,
}: TransactionFilterBarProps) {
  const haptics = useMoneyHaptics()
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeCount = useMemo(() => {
    let count = 0
    if (filter.categories.length > 0) count++
    if (filter.walletId) count++
    if (filter.dateFrom || filter.dateTo) count++
    if (filter.minAmount || filter.maxAmount) count++
    return count
  }, [filter])

  const toggleCategory = useCallback((cat: string) => {
    haptics.tap()
    const next = filter.categories.includes(cat)
      ? filter.categories.filter(c => c !== cat)
      : [...filter.categories, cat]
    onChange({ ...filter, categories: next })
  }, [filter, onChange, haptics])

  const handleReset = useCallback(() => {
    haptics.tapMedium()
    onReset()
    setActivePanel(null)
  }, [onReset, haptics])

  const availableCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category))
    return Array.from(cats)
  }, [transactions])

  const panels: { key: ActivePanel; icon: React.ReactNode; label: string; active: boolean }[] = [
    { key: 'categories', icon: <SlidersHorizontal size={14} />, label: 'Category', active: filter.categories.length > 0 },
    { key: 'wallet', icon: <Wallet size={14} />, label: 'Wallet', active: !!filter.walletId },
    { key: 'date', icon: <Calendar size={14} />, label: 'Date', active: !!(filter.dateFrom || filter.dateTo) },
    { key: 'amount', icon: <SlidersHorizontal size={14} />, label: 'Amount', active: !!(filter.minAmount || filter.maxAmount) },
  ]

  return (
    <div className="space-y-3">
      {/* Search + Chips */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--mon-text-3)' }} />
          <input
            ref={inputRef}
            type="text"
            value={filter.query}
            onChange={e => onChange({ ...filter, query: e.target.value })}
            placeholder="Search transactions..."
            className="w-full rounded-[var(--mon-radius-lg)] pl-9 pr-3 py-2.5 text-[13px] font-medium outline-none transition-all duration-200"
            style={{
              background: 'var(--mon-surface-2)',
              border: '1px solid var(--mon-border)',
              color: 'var(--mon-text-1)',
            }}
          />
          {filter.query && (
            <button
              onClick={() => onChange({ ...filter, query: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors"
              style={{ color: 'var(--mon-text-3)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Active filter count badge */}
        {activeCount > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2.5 rounded-[var(--mon-radius-lg)] text-[12px] font-semibold transition-all active:scale-[0.97]"
            style={{
              background: 'var(--mon-expense-bg)',
              color: 'var(--mon-expense)',
              border: '1px solid var(--mon-expense-glow)',
            }}
          >
            <X size={14} />
            {activeCount}
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {/* Type chips */}
        {(['all', 'income', 'expense'] as const).map(type => (
          <button
            key={type}
            onClick={() => { haptics.tap(); onChange({ ...filter, type }) }}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-[0.96]"
            style={{
              background: filter.type === type
                ? type === 'income' ? 'var(--mon-income-bg)' : type === 'expense' ? 'var(--mon-expense-bg)' : 'var(--mon-surface-1)'
                : 'var(--mon-surface-2)',
              border: `1px solid ${
                filter.type === type
                  ? type === 'income' ? 'var(--mon-income-glow)' : type === 'expense' ? 'var(--mon-expense-glow)' : 'var(--mon-border-hover)'
                  : 'var(--mon-border)'
              }`,
              color: filter.type === type
                ? type === 'income' ? 'var(--mon-income)' : type === 'expense' ? 'var(--mon-expense)' : 'var(--mon-text-1)'
                : 'var(--mon-text-3)',
            }}
          >
            {type === 'all' ? 'All' : type === 'income' ? 'Income' : 'Expense'}
          </button>
        ))}

        {/* Panel chips */}
        {panels.map(p => (
          <button
            key={p.key}
            onClick={() => { haptics.tap(); setActivePanel(activePanel === p.key ? null : p.key) }}
            className="flex items-center gap-1.5 flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-[0.96]"
            style={{
              background: p.active ? 'var(--mon-gold-bg)' : 'var(--mon-surface-2)',
              border: `1px solid ${p.active ? 'var(--mon-gold-glow)' : 'var(--mon-border)'}`,
              color: p.active ? 'var(--mon-gold)' : 'var(--mon-text-3)',
            }}
          >
            {p.icon}
            {p.label}
          </button>
        ))}
      </div>

      {/* Active Panel Content */}
      {activePanel && (
        <div
          className="rounded-[var(--mon-radius-lg)] p-4 border animate-[mon-slide-down_200ms_ease-out]"
          style={{
            background: 'var(--mon-surface-1)',
            borderColor: 'var(--mon-border)',
          }}
        >
          {/* Categories panel */}
          {activePanel === 'categories' && (
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(cat => {
                const meta = CATEGORY_META[cat] || CATEGORY_META.other
                const selected = filter.categories.includes(cat)
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-[0.96]"
                    style={{
                      background: selected ? `${meta.color}20` : 'var(--mon-surface-2)',
                      border: `1px solid ${selected ? meta.color : 'var(--mon-border)'}`,
                      color: selected ? meta.color : 'var(--mon-text-3)',
                    }}
                  >
                    <span>{meta.icon}</span>
                    {meta.labelEn}
                    {selected && <X size={12} />}
                  </button>
                )
              })}
            </div>
          )}

          {/* Wallet panel */}
          {activePanel === 'wallet' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { haptics.tap(); onChange({ ...filter, walletId: null }) }}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-[0.96]"
                style={{
                  background: !filter.walletId ? 'var(--mon-surface-2)' : 'transparent',
                  border: `1px solid ${!filter.walletId ? 'var(--mon-border-hover)' : 'var(--mon-border)'}`,
                  color: !filter.walletId ? 'var(--mon-text-1)' : 'var(--mon-text-3)',
                }}
              >
                All Wallets
              </button>
              {wallets.map(w => (
                <button
                  key={w.id}
                  onClick={() => { haptics.tap(); onChange({ ...filter, walletId: w.id }) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-[0.96]"
                  style={{
                    background: filter.walletId === w.id ? 'var(--mon-gold-bg)' : 'var(--mon-surface-2)',
                    border: `1px solid ${filter.walletId === w.id ? 'var(--mon-gold-glow)' : 'var(--mon-border)'}`,
                    color: filter.walletId === w.id ? 'var(--mon-gold)' : 'var(--mon-text-3)',
                  }}
                >
                  <span>{w.icon}</span>
                  {w.name}
                </button>
              ))}
            </div>
          )}

          {/* Date panel */}
          {activePanel === 'date' && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--mon-text-4)' }}>From</label>
                <input
                  type="date"
                  value={filter.dateFrom}
                  onChange={e => onChange({ ...filter, dateFrom: e.target.value })}
                  className="w-full rounded-[var(--mon-radius-md)] px-3 py-2 text-[12px] font-medium outline-none"
                  style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)', colorScheme: 'dark' }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--mon-text-4)' }}>To</label>
                <input
                  type="date"
                  value={filter.dateTo}
                  onChange={e => onChange({ ...filter, dateTo: e.target.value })}
                  className="w-full rounded-[var(--mon-radius-md)] px-3 py-2 text-[12px] font-medium outline-none"
                  style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)', colorScheme: 'dark' }}
                />
              </div>
            </div>
          )}

          {/* Amount panel */}
          {activePanel === 'amount' && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--mon-text-4)' }}>Min</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={filter.minAmount}
                  onChange={e => onChange({ ...filter, minAmount: e.target.value })}
                  className="w-full rounded-[var(--mon-radius-md)] px-3 py-2 text-[12px] font-medium outline-none"
                  style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--mon-text-4)' }}>Max</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="99999"
                  value={filter.maxAmount}
                  onChange={e => onChange({ ...filter, maxAmount: e.target.value })}
                  className="w-full rounded-[var(--mon-radius-md)] px-3 py-2 text-[12px] font-medium outline-none"
                  style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}