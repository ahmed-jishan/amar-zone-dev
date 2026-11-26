'use client'

import { useMemo } from 'react'
import { useTaskStore } from '@/lib/store/taskStore'
import { useMoneyStore } from '@/features/money/store/moneyStore'
import { useNamazStore } from '@/features/namaz/store/namazStore'
import { todayISO } from '@/lib/utils/helpers'

export default function AnalyticsPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const transactions = useMoneyStore((state) => state.transactions)
  const records = useNamazStore((state) => state.records)

  const summary = useMemo(() => {
    const today = todayISO()
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 6)
    const weekStartISO = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`

    const completedTasks = tasks.filter((task) => task.completed || task.completedDates?.includes(today)).length
    const weeklyTasks = tasks.filter((task) => task.completedDates?.some((date) => date >= weekStartISO && date <= today)).length
    const weeklyExpenses = transactions
      .filter((transaction) => transaction.type === 'expense' && transaction.date >= weekStartISO && transaction.date <= today)
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
    const weeklyPrayers = records
      .filter((record) => record.date >= weekStartISO && record.date <= today)
      .reduce((sum, record) => sum + Object.values(record.prayers || {}).filter((status) => status === 'prayed').length, 0)

    return { completedTasks, weeklyTasks, weeklyExpenses, weeklyPrayers }
  }, [tasks, transactions, records])

  const cards = [
    { label: 'Tasks completed today', value: summary.completedTasks, tone: 'var(--hm-accent, #6366f1)' },
    { label: 'Tasks completed this week', value: summary.weeklyTasks, tone: 'var(--hm-success, #10b981)' },
    { label: 'Prayer slots this week', value: summary.weeklyPrayers, tone: 'var(--nz-accent, #10b981)' },
    { label: 'Weekly expenses', value: `৳${summary.weeklyExpenses.toLocaleString('en-BD')}`, tone: 'var(--mon-accent, #f59e0b)' },
  ]

  return (
    <main className="mx-auto max-w-[720px] px-4 pb-28 pt-6">
      <h1 className="text-2xl font-bold">Analytics & Reports</h1>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">A simple 7-day view across tasks, prayer and spending.</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-[rgba(var(--border),0.6)] bg-[rgba(var(--border),0.08)] p-4">
            <div className="text-2xl font-bold" style={{ color: card.tone }}>{card.value}</div>
            <div className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{card.label}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
