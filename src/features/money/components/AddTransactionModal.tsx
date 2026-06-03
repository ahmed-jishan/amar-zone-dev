'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_META } from '../constants'
import type { ExpenseCategory, IncomeCategory, Transaction, TransactionType, Wallet } from '@/lib/types'

type TransactionCategory = ExpenseCategory | IncomeCategory

export default function AddTransactionModal({ onClose, onAdd, translations: t, currencySymbol, wallets = [], selectedWalletId, transaction, initialType }: any) {
  const [mounted, setMounted] = useState(false)
  const editing = !!transaction
  const initialTransaction = transaction as Transaction | undefined
  const [type, setType] = useState<TransactionType>(initialTransaction?.type || initialType || 'expense')
  const [amount, setAmount] = useState(initialTransaction?.amount ? String(initialTransaction.amount) : '')
  const [category, setCategory] = useState<TransactionCategory>(initialTransaction?.category || 'food')
  const [note, setNote] = useState(initialTransaction?.note || '')
  const [date, setDate] = useState(initialTransaction?.date || new Date().toISOString().split('T')[0])
  const [walletId, setWalletId] = useState(initialTransaction?.walletId || selectedWalletId || wallets[0]?.id || 'default')

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
      walletId,
    })
    onClose()
  }

  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const presets = type === 'income'
    ? [
        { label: 'Salary', amount: '0', category: 'salary', note: 'Salary' },
        { label: 'Freelance', amount: '0', category: 'freelance', note: 'Freelance payment' },
        { label: 'Gift', amount: '0', category: 'gift', note: 'Gift' },
      ]
    : [
        { label: 'Food 120', amount: '120', category: 'food', note: 'Food' },
        { label: 'Transport 40', amount: '40', category: 'transport', note: 'Transport' },
        { label: 'Snacks 30', amount: '30', category: 'food', note: 'Snacks' },
        { label: 'Bill', amount: '', category: 'utilities', note: 'Bill payment' },
      ]

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-[mon-fade-in_150ms_ease-out]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-[420px] mx-4 rounded-[var(--mon-radius-2xl)] overflow-hidden animate-[mon-scale-in_200ms_ease-out] mon-glass shadow-[var(--mon-shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--mon-border)' }}>
          <h3 className="text-[16px] font-bold" style={{ color: 'var(--mon-text-1)' }}>{editing ? 'Edit Transaction' : t.addTransaction}</h3>
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

          {/* Quick Presets */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>Quick add</label>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setCategory(preset.category as TransactionCategory);
                    setNote((current) => current || preset.note);
                    if (preset.amount) setAmount(preset.amount);
                  }}
                  className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all active:scale-95"
                  style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-2)' }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
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

          {wallets.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--mon-text-3)' }}>{t.wallet}</label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--mon-radius-lg)] text-[14px] outline-none"
                style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
              >
                {wallets.map((wallet: Wallet) => (
                  <option key={wallet.id} value={wallet.id}>{wallet.icon} {wallet.name}</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" disabled={!amount}
            className="w-full py-3 rounded-[var(--mon-radius-xl)] text-[15px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, var(--mon-gold), var(--mon-gold-2))', boxShadow: '0 4px 20px var(--mon-gold-glow)' }}
          >
            {editing ? 'Save Changes' : t.save}
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}
