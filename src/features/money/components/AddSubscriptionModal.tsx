'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EXPENSE_CATEGORIES, CATEGORY_META } from '../constants'
import { todayISO } from '../utils'
import type { ExpenseCategory, Subscription } from '@/lib/types'

export default function AddSubscriptionModal({
  onClose,
  onAdd,
  currencySymbol,
  anchorRect,
}: {
  onClose: () => void
  onAdd: (subscription: Omit<Subscription, 'id'>) => void
  currencySymbol: string
  anchorRect?: DOMRect | null
}) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('utilities')
  const [billingCycle, setBillingCycle] = useState<Subscription['billingCycle']>('monthly')
  const [nextBillingDate, setNextBillingDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    if (!anchorRect) {
      setPosition(null)
      return
    }

    const updatePosition = () => {
      const panel = panelRef.current
      const width = Math.min(420, window.innerWidth - 32)
      const height = panel?.offsetHeight ?? 560
      const margin = 16
      const gap = 10
      const hasRoomBelow = window.innerHeight - anchorRect.bottom > Math.min(height, 520) + gap
      const top = hasRoomBelow
        ? anchorRect.bottom + gap
        : Math.max(margin, anchorRect.top - height - gap)
      const anchorCenter = anchorRect.left + (anchorRect.right - anchorRect.left) / 2
      const preferredLeft = Math.min(
        window.innerWidth / 2 - width / 2,
        anchorCenter - width / 2
      )
      const left = Math.max(margin, Math.min(preferredLeft, window.innerWidth - width - margin))
      setPosition({ top, left, width })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [anchorRect])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const numericAmount = Number(amount)
    if (!name.trim() || numericAmount <= 0) return
    onAdd({
      name: name.trim(),
      amount: numericAmount,
      category,
      billingCycle,
      nextBillingDate,
      status: 'active',
      note: note.trim() || undefined,
    })
    onClose()
  }

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-[mon-fade-in_150ms_ease-out]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        ref={panelRef}
        className="relative w-full max-w-[420px] overflow-hidden rounded-[var(--mon-radius-2xl)] mon-glass shadow-[var(--mon-shadow-lg)] animate-[mon-scale-in_200ms_ease-out]"
        style={position ? {
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: position.width,
          margin: 0,
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
          transformOrigin: 'top center',
        } : {
          marginLeft: 16,
          marginRight: 16,
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--mon-border)' }}>
          <h3 className="text-[16px] font-bold" style={{ color: 'var(--mon-text-1)' }}>Add Subscription</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--mon-text-3)] transition-all hover:bg-[var(--mon-surface-hover)] hover:text-[var(--mon-text-1)]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <Field label="Name">
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Internet, Netflix, Rent"
              className="w-full rounded-[var(--mon-radius-lg)] px-3 py-2 text-[14px] outline-none"
              style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
              <div className="flex items-center gap-2 rounded-[var(--mon-radius-lg)] px-3 py-2" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
                <span style={{ color: 'var(--mon-text-3)' }}>{currencySymbol}</span>
                <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" placeholder="0"
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-bold outline-none"
                  style={{ color: 'var(--mon-text-1)' }}
                />
              </div>
            </Field>
            <Field label="Next bill">
              <input type="date" value={nextBillingDate} onChange={(event) => setNextBillingDate(event.target.value)}
                className="w-full rounded-[var(--mon-radius-lg)] px-3 py-2 text-[14px] outline-none"
                style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
              />
            </Field>
          </div>

          <Field label="Cycle">
            <div className="grid grid-cols-3 gap-1.5">
              {(['weekly', 'monthly', 'yearly'] as const).map((cycle) => (
                <button key={cycle} type="button" onClick={() => setBillingCycle(cycle)}
                  className="rounded-[var(--mon-radius-md)] px-2 py-1.5 text-[12px] font-semibold capitalize transition-all"
                  style={{
                    background: billingCycle === cycle ? 'var(--mon-gold-bg)' : 'var(--mon-surface-2)',
                    border: `1px solid ${billingCycle === cycle ? 'var(--mon-gold-glow)' : 'var(--mon-border)'}`,
                    color: billingCycle === cycle ? 'var(--mon-gold)' : 'var(--mon-text-2)',
                  }}
                >
                  {cycle}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Category">
            <div className="flex flex-wrap gap-1.5">
              {EXPENSE_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat]
                return (
                  <button key={cat} type="button" onClick={() => setCategory(cat)}
                    className="rounded-md border px-2.5 py-1.5 text-[12px] font-semibold transition-all"
                    style={category === cat
                      ? { background: meta.color, borderColor: meta.color, color: '#fff' }
                      : { background: 'var(--mon-surface-2)', borderColor: 'var(--mon-border)', color: 'var(--mon-text-2)' }}
                  >
                    {meta.icon} {meta.labelEn}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Note">
            <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional"
              className="w-full rounded-[var(--mon-radius-lg)] px-3 py-2 text-[14px] outline-none"
              style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
            />
          </Field>

          <button type="submit" disabled={!name.trim() || !amount}
            className="w-full rounded-[var(--mon-radius-xl)] py-3 text-[15px] font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, var(--mon-gold), var(--mon-gold-2))', boxShadow: '0 4px 20px var(--mon-gold-glow)' }}
          >
            Save
          </button>
        </form>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{label}</span>
      {children}
    </label>
  )
}
