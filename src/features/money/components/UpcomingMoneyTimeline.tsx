'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Check, PauseCircle, PlusCircle } from 'lucide-react'
import type { Subscription, Transaction, Wallet } from '@/lib/types'
import { CATEGORY_META } from '../constants'
import { formatCurrency, getRelativeDate } from '../utils'
import { getNextSubscriptionDate, getUpcomingSchedule, type ScheduleItem } from '../recurring'

interface Props {
  transactions: Transaction[]
  subscriptions: Subscription[]
  wallets: Wallet[]
  selectedWalletId: string | null
  currencySymbol: string
  onPostTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'status'>) => void
  onUpdateSubscription: (id: string, updates: Partial<Subscription>) => void
}

const SKIPPED_KEY = 'selfsync-money-skipped-schedule-v1'

function readSkipped(): Record<string, true> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem(SKIPPED_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveSkipped(skipped: Record<string, true>) {
  window.localStorage.setItem(SKIPPED_KEY, JSON.stringify(skipped))
}

function isPosted(item: ScheduleItem, transactions: Transaction[]) {
  return transactions.some((transaction) => {
    if (transaction.date !== item.date) return false
    if (transaction.amount !== item.amount || transaction.type !== item.type) return false
    if (item.kind === 'subscription') return transaction.note === item.title && transaction.category === item.source.category
    return transaction.category === item.source.category && transaction.note === item.source.note
  })
}

export default function UpcomingMoneyTimeline({
  transactions,
  subscriptions,
  wallets,
  selectedWalletId,
  currencySymbol,
  onPostTransaction,
  onUpdateSubscription,
}: Props) {
  const [skipped, setSkipped] = useState<Record<string, true>>({})

  useEffect(() => {
    setSkipped(readSkipped())
  }, [])

  const walletId = selectedWalletId || wallets.find((wallet) => wallet.isDefault)?.id || wallets[0]?.id
  const schedule = useMemo(() => {
    return getUpcomingSchedule({ transactions, subscriptions, daysAhead: 30 })
      .filter((item) => !skipped[item.id])
      .slice(0, 8)
  }, [skipped, subscriptions, transactions])

  const totals = useMemo(() => {
    return schedule.reduce(
      (sum, item) => ({
        income: sum.income + (item.type === 'income' ? item.amount : 0),
        expense: sum.expense + (item.type === 'expense' ? item.amount : 0),
      }),
      { income: 0, expense: 0 }
    )
  }, [schedule])

  const skipItem = (item: ScheduleItem) => {
    const next = { ...skipped, [item.id]: true as const }
    setSkipped(next)
    saveSkipped(next)

    if (item.kind === 'subscription') {
      onUpdateSubscription(item.source.id, { nextBillingDate: getNextSubscriptionDate(item.source) })
    }
  }

  const postItem = (item: ScheduleItem) => {
    if (isPosted(item, transactions)) return

    if (item.kind === 'subscription') {
      onPostTransaction({
        type: 'expense',
        amount: item.amount,
        category: item.source.category,
        note: item.title,
        date: item.date,
        isRecurring: false,
        walletId,
      })
      onUpdateSubscription(item.source.id, { nextBillingDate: getNextSubscriptionDate(item.source) })
      return
    }

    onPostTransaction({
      type: item.source.type,
      amount: item.source.amount,
      category: item.source.category,
      note: item.source.note,
      date: item.date,
      isRecurring: false,
      walletId: item.source.walletId || walletId,
      tags: item.source.tags,
    })
  }

  return (
    <section
      className="rounded-[var(--mon-radius-xl)] p-4 animate-[mon-slide-up_400ms_ease-out]"
      style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-text-3)' }}>
            Upcoming Schedule
          </p>
          <h3 className="mt-1 text-[20px] font-black" style={{ color: 'var(--mon-text-1)' }}>
            {formatCurrency(totals.expense - totals.income, currencySymbol)}
          </h3>
          <p className="mt-0.5 text-[12px]" style={{ color: 'var(--mon-text-3)' }}>
            next 30 days planned cash movement
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--mon-gold-bg)', color: 'var(--mon-gold)' }}>
          <CalendarClock className="h-5 w-5" />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Metric label="Incoming" value={formatCurrency(totals.income, currencySymbol)} color="var(--mon-income)" />
        <Metric label="Outgoing" value={formatCurrency(totals.expense, currencySymbol)} color="var(--mon-expense)" />
      </div>

      {schedule.length === 0 ? (
        <div className="rounded-[var(--mon-radius-lg)] px-3 py-6 text-center" style={{ background: 'var(--mon-surface-2)', color: 'var(--mon-text-3)' }}>
          <p className="text-[14px] font-semibold">No upcoming money events</p>
          <p className="mt-1 text-[12px]">Recurring transactions and active subscriptions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedule.map((item) => {
            const meta = CATEGORY_META[item.kind === 'subscription' ? item.source.category : item.source.category] || CATEGORY_META.other
            const rel = getRelativeDate(item.date)
            const posted = isPosted(item, transactions)
            return (
              <div key={item.id} className="rounded-[var(--mon-radius-lg)] p-3" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: meta.bg }}>
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-bold" style={{ color: 'var(--mon-text-1)' }}>{item.title}</p>
                        <p className="mt-0.5 text-[11px]" style={{ color: rel.isOverdue ? 'var(--mon-expense)' : 'var(--mon-text-3)' }}>
                          {rel.label} · {item.kind === 'subscription' ? 'subscription' : `${item.source.recurringInterval} recurring`}
                        </p>
                      </div>
                      <p className="shrink-0 text-[14px] font-black" style={{ color: item.type === 'income' ? 'var(--mon-income)' : 'var(--mon-expense)' }}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, currencySymbol)}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        onClick={() => postItem(item)}
                        disabled={posted}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold disabled:opacity-60"
                        style={{ background: 'var(--mon-income-bg)', color: 'var(--mon-income)', border: '1px solid var(--mon-income-glow)' }}
                      >
                        {posted ? <Check className="h-3 w-3" /> : <PlusCircle className="h-3 w-3" />}
                        {posted ? 'Posted' : 'Post'}
                      </button>
                      <button
                        onClick={() => skipItem(item)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold"
                        style={{ background: 'var(--mon-surface-1)', color: 'var(--mon-text-2)', border: '1px solid var(--mon-border)' }}
                      >
                        <PauseCircle className="h-3 w-3" />
                        Skip
                      </button>
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

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-[var(--mon-radius-lg)] px-3 py-2" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{label}</p>
      <p className="mt-0.5 text-[15px] font-black" style={{ color }}>{value}</p>
    </div>
  )
}
