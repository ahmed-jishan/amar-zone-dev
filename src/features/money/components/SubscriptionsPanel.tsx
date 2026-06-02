'use client'

import type { Subscription } from '@/lib/types'
import { CATEGORY_META } from '../constants'
import { formatCurrency, getRelativeDate } from '../utils'

interface Props {
  subscriptions: Subscription[]
  currencySymbol: string
  onAdd: (anchor?: DOMRect) => void
  onPause: (id: string) => void
  onResume: (id: string) => void
  onDelete: (id: string) => void
  onCreateTask: (subscription: Subscription) => void
}

export default function SubscriptionsPanel({
  subscriptions,
  currencySymbol,
  onAdd,
  onPause,
  onResume,
  onDelete,
  onCreateTask,
}: Props) {
  const active = subscriptions
    .filter((subscription) => subscription.status !== 'cancelled')
    .sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate))
  const monthlyTotal = active.reduce((sum, subscription) => {
    if (subscription.status !== 'active') return sum
    if (subscription.billingCycle === 'yearly') return sum + subscription.amount / 12
    if (subscription.billingCycle === 'weekly') return sum + subscription.amount * 4
    return sum + subscription.amount
  }, 0)

  return (
    <section className="rounded-[var(--mon-radius-xl)] p-4" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>Subscriptions</p>
          <h3 className="mt-1 text-[20px] font-black" style={{ color: 'var(--mon-text-1)' }}>{formatCurrency(monthlyTotal, currencySymbol)}</h3>
          <p className="mt-0.5 text-[12px]" style={{ color: 'var(--mon-text-3)' }}>estimated monthly commitment</p>
        </div>
        <button onClick={(event) => onAdd(event.currentTarget.getBoundingClientRect())}
          className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all active:scale-95"
          style={{ color: 'var(--mon-gold)', background: 'var(--mon-gold-bg)', border: '1px solid var(--mon-gold-glow)' }}
        >
          Add
        </button>
      </div>

      {active.length === 0 ? (
        <div className="rounded-[var(--mon-radius-lg)] px-3 py-6 text-center" style={{ background: 'var(--mon-surface-2)', color: 'var(--mon-text-3)' }}>
          <p className="text-[14px] font-semibold">No subscriptions yet</p>
          <p className="mt-1 text-[12px]">Track bills and recurring charges here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {active.slice(0, 5).map((subscription) => {
            const meta = CATEGORY_META[subscription.category] || CATEGORY_META.other
            const rel = getRelativeDate(subscription.nextBillingDate)
            return (
              <div key={subscription.id} className="rounded-[var(--mon-radius-lg)] p-3" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: meta.bg }}>
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-bold" style={{ color: 'var(--mon-text-1)' }}>{subscription.name}</p>
                        <p className="mt-0.5 text-[11px]" style={{ color: rel.isOverdue ? 'var(--mon-expense)' : 'var(--mon-text-3)' }}>
                          {rel.label} · {subscription.billingCycle}
                        </p>
                      </div>
                      <p className="text-[14px] font-black" style={{ color: 'var(--mon-expense)' }}>
                        {formatCurrency(subscription.amount, currencySymbol)}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button onClick={() => onCreateTask(subscription)} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: 'var(--mon-gold-bg)', color: 'var(--mon-gold)', border: '1px solid var(--mon-gold-glow)' }}>Task</button>
                      <button onClick={() => subscription.status === 'paused' ? onResume(subscription.id) : onPause(subscription.id)}
                        className="rounded-md px-2 py-1 text-[11px] font-semibold"
                        style={{ background: 'var(--mon-surface-1)', color: 'var(--mon-text-2)', border: '1px solid var(--mon-border)' }}
                      >
                        {subscription.status === 'paused' ? 'Resume' : 'Pause'}
                      </button>
                      <button onClick={() => onDelete(subscription.id)} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: 'var(--mon-expense-bg)', color: 'var(--mon-expense)', border: '1px solid var(--mon-expense-glow)' }}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
