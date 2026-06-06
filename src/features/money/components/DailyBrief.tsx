'use client'

import type { Loan, MonthlyBudget, Subscription, Transaction } from '@/lib/types'
import type { Task } from '@/app/(tabs)/tasks/types'
import { formatCurrency, todayISO } from '../utils'

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
  const todaySpend = transactions
    .filter((txn) => txn.type === 'expense' && txn.date === today && txn.status === 'completed')
    .reduce((sum, txn) => sum + txn.amount, 0)
  const monthSpend = transactions
    .filter((txn) => txn.type === 'expense' && txn.date.startsWith(month) && txn.status === 'completed')
    .reduce((sum, txn) => sum + txn.amount, 0)
  const budgetRemaining = budget ? budget.salary - monthSpend : null
  const upcomingBill = subscriptions
    .filter((subscription) => subscription.status === 'active' && subscription.nextBillingDate >= today)
    .sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate))[0]
  const dueLoan = loans
    .filter((loan) => !loan.settled && loan.dueDate && loan.dueDate >= today)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))[0]

  return (
    <section className="mb-5 rounded-[var(--mon-radius-2xl)] p-4" style={{ background: 'linear-gradient(135deg, var(--mon-surface-1), var(--mon-surface-2))', border: '1px solid var(--mon-border)' }}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: 'var(--mon-gold)' }}>Daily Brief</p>
          <h2 className="mt-1 text-[20px] font-black tracking-[-0.5px]" style={{ color: 'var(--mon-text-1)' }}>
            {topTask ? topTask.title : 'Your day is financially calm'}
          </h2>
        </div>
        <button onClick={onOpenTasks} className="rounded-full px-3 py-1.5 text-[12px] font-bold" style={{ color: 'var(--mon-gold)', background: 'var(--mon-gold-bg)', border: '1px solid var(--mon-gold-glow)' }}>
          Tasks
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <BriefMetric label="Today spend" value={formatCurrency(todaySpend, currencySymbol)} color={todaySpend > 0 ? 'var(--mon-expense)' : 'var(--mon-text-2)'} />
        <BriefMetric label="Budget left" value={budgetRemaining === null ? 'No budget' : formatCurrency(Math.abs(budgetRemaining), currencySymbol)} color={budgetRemaining !== null && budgetRemaining < 0 ? 'var(--mon-expense)' : 'var(--mon-income)'} />
      </div>

      <div className="mt-3 space-y-2">
        {upcomingBill && <Line label="Next bill" value={`${upcomingBill.name} · ${upcomingBill.nextBillingDate}`} />}
        {dueLoan && <Line label="Loan due" value={`${dueLoan.personName} · ${dueLoan.dueDate}`} />}
        {topTask && <Line label="Task focus" value={`${topTask.priority} priority`} />}
      </div>
    </section>
  )
}

function priorityWeight(priority: Task['priority']) {
  return priority === 'critical' ? 4 : priority === 'high' ? 3 : priority === 'medium' ? 2 : 1
}

function BriefMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-[var(--mon-radius-lg)] px-3 py-2" style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{label}</p>
      <p className="mt-0.5 truncate text-[15px] font-black" style={{ color }}>{value}</p>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <span style={{ color: 'var(--mon-text-3)' }}>{label}</span>
      <span className="truncate font-semibold" style={{ color: 'var(--mon-text-2)' }}>{value}</span>
    </div>
  )
}
