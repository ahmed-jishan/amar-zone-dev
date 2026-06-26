'use client'

import type { Loan, MonthlyBudget, Subscription, Transaction } from '@/lib/types'
import type { Task } from '@/app/(tabs)/tasks/types'
import { formatCurrency, todayISO } from '../utils'
import { selectDailySpending, selectMonthlyExpense } from '../selectors'
import SpendingPulse from './SpendingPulse'

interface Props {
  tasks: Task[]
  transactions: Transaction[]
  budget?: MonthlyBudget
  subscriptions: Subscription[]
  loans: Loan[]
  month: string
  currencySymbol: string
  onOpenTasks: () => void
}

export default function DailyBrief({ tasks, transactions, budget, subscriptions, loans, month, currencySymbol, onOpenTasks }: Props) {
  const today = todayISO()
  const todayTasks = tasks.filter((task) => !task.completed && task.status !== 'archived' && (task.status === 'today' || task.dueDate === today))
  const topTask = todayTasks.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority))[0]
  const todaySpend = selectDailySpending(transactions, today)
  const monthSpend = selectMonthlyExpense(transactions, month)
  const budgetRemaining = budget ? budget.salary - monthSpend : null
  const upcomingBill = subscriptions
    .filter((subscription) => subscription.status === 'active' && subscription.nextBillingDate >= today)
    .sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate))[0]
  const dueLoan = loans
    .filter((loan) => !loan.settled && loan.dueDate && loan.dueDate >= today)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))[0]

  return (
    <section className="mb-5 rounded-[var(--mon-radius-2xl)] p-4 mon-animate-spring-in"
      style={{ background: 'linear-gradient(135deg, var(--mon-surface-1), var(--mon-surface-2))', border: '1px solid var(--mon-border)' }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-gold)' }}>
            Daily Brief
          </p>
          <h2 className="mt-1 text-[20px] font-black tracking-[-0.5px]" style={{ color: 'var(--mon-text-1)' }}>
            {topTask ? topTask.title : 'Your day is financially calm'}
          </h2>
        </div>
        <button
          onClick={onOpenTasks}
          className="mon-btn mon-btn-ghost text-[11px] !px-3 !py-1.5"
        >
          Tasks
        </button>
      </div>

      {/* Spending Pulse Mini */}
      <div className="mb-3">
        <SpendingPulse currencySymbol={currencySymbol} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <BriefMetric label="Today spend" value={formatCurrency(todaySpend, currencySymbol)} color={todaySpend > 0 ? 'var(--mon-expense)' : 'var(--mon-text-2)'} />
        <BriefMetric label="Budget left" value={budgetRemaining === null ? 'No budget' : formatCurrency(Math.abs(budgetRemaining), currencySymbol)} color={budgetRemaining !== null && budgetRemaining < 0 ? 'var(--mon-expense)' : 'var(--mon-income)'} />
      </div>

      <div className="mt-3 space-y-2">
        {upcomingBill && (
          <div className="flex items-center justify-between gap-3 text-[12px] p-2 rounded-[var(--mon-radius-md)]" style={{ background: 'var(--mon-amber-bg)', border: '1px solid var(--mon-amber-glow)' }}>
            <span className="flex items-center gap-1.5" style={{ color: 'var(--mon-amber)' }}>
              <span>📋</span> Upcoming Bill
            </span>
            <span className="truncate font-semibold" style={{ color: 'var(--mon-text-2)' }}>
              {upcomingBill.name} · {upcomingBill.nextBillingDate}
            </span>
          </div>
        )}
        {dueLoan && (
          <div className="flex items-center justify-between gap-3 text-[12px] p-2 rounded-[var(--mon-radius-md)]" style={{ background: 'var(--mon-rose-bg)', border: '1px solid var(--mon-rose-glow)' }}>
            <span className="flex items-center gap-1.5" style={{ color: 'var(--mon-rose)' }}>
              <span>💰</span> Loan Due
            </span>
            <span className="truncate font-semibold" style={{ color: 'var(--mon-text-2)' }}>
              {dueLoan.personName} · {dueLoan.dueDate}
            </span>
          </div>
        )}
        {topTask && (
          <div className="flex items-center justify-between gap-3 text-[12px] p-2 rounded-[var(--mon-radius-md)]" style={{ background: 'var(--mon-accent-bg)', border: '1px solid var(--mon-accent-glow)' }}>
            <span className="flex items-center gap-1.5" style={{ color: 'var(--mon-accent)' }}>
              <span>🎯</span> Task Focus
            </span>
            <span className="truncate font-semibold" style={{ color: 'var(--mon-text-2)' }}>
              {topTask.priority} priority
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

function priorityWeight(priority: Task['priority']) {
  return priority === 'critical' ? 4 : priority === 'high' ? 3 : priority === 'medium' ? 2 : 1
}

function BriefMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-[var(--mon-radius-lg)] px-3 py-2.5" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{label}</p>
      <p className="mt-0.5 truncate text-[15px] font-black" style={{ color }}>{value}</p>
    </div>
  )
}