'use client'

import { useState, useMemo, useCallback } from 'react'
import { Sun, Moon, Bell, Target, ArrowRight, Check, TrendingUp, TrendingDown, CreditCard, CalendarClock, AlertTriangle, ChevronRight } from 'lucide-react'
import type { Loan, MonthlyBudget, Subscription, Transaction, Wallet } from '@/lib/types'
import type { Task } from '@/app/(tabs)/tasks/types'
import { formatCurrency, todayISO } from '../../utils'
import { selectDailySpending, selectMonthlyExpense } from '../../selectors'
import { useMoneyHaptics } from '../../hooks/useMoneyHaptics'

interface Props {
  tasks: Task[]
  transactions: Transaction[]
  budget?: MonthlyBudget
  subscriptions: Subscription[]
  loans: Loan[]
  wallets: Wallet[]
  month: string
  currencySymbol: string
  onOpenTasks: () => void
  onAddTransaction?: (type: 'income' | 'expense') => void
}

type CardId = 'focus' | 'pulse' | 'actions'

interface CardConfig {
  id: CardId
  icon: typeof Target
  label: string
  color: string
  bgColor: string
  glowColor: string
}

export default function SmartMorningDashboard({
  tasks, transactions, budget, subscriptions, loans, wallets, month, currencySymbol, onOpenTasks, onAddTransaction
}: Props) {
  const [activeCard, setActiveCard] = useState<CardId>('focus')
  const [greeting, setGreeting] = useState<string>(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  })
  const haptics = useMoneyHaptics()

  const today = todayISO()
  const todayTasks = tasks.filter(t => !t.completed && t.status !== 'archived' && (t.status === 'today' || t.dueDate === today))
  const topTask = todayTasks.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority))[0]

  const todaySpend = useMemo(() => selectDailySpending(transactions, today), [transactions, today])
  const yesterdaySpend = useMemo(() => {
    const y = new Date()
    y.setDate(y.getDate() - 1)
    return selectDailySpending(transactions, y.toISOString().split('T')[0])
  }, [transactions])
  const monthSpend = useMemo(() => selectMonthlyExpense(transactions, month), [transactions, month])
  const hasBudget = !!budget
  const budgetRemaining = budget ? budget.salary - monthSpend : null
  const budgetPct = budget && budget.salary > 0 ? (monthSpend / budget.salary) * 100 : 0

  const upcomingBill = useMemo(() => 
    subscriptions
      .filter(s => s.status === 'active' && s.nextBillingDate >= today)
      .sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate))[0]
  , [subscriptions, today])

  const dueLoan = useMemo(() =>
    loans
      .filter(l => !l.settled && l.dueDate && l.dueDate >= today)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))[0]
  , [loans, today])

  const totalBalance = wallets.reduce((a, w) => a + w.balance, 0)

  const needsAttention = useMemo(() => {
    const items: { label: string; color: string; action?: () => void }[] = []
    if (upcomingBill) items.push({ label: `${upcomingBill.name} due ${upcomingBill.nextBillingDate}`, color: 'var(--mon-amber)' })
    if (dueLoan) items.push({ label: `Loan from ${dueLoan.personName} due`, color: 'var(--mon-rose)' })
    if (budgetPct > 80) items.push({ label: `${Math.round(budgetPct)}% of budget used`, color: budgetPct > 100 ? 'var(--mon-expense)' : 'var(--mon-gold)' })
    return items
  }, [upcomingBill, dueLoan, budgetPct])

  const cards: CardConfig[] = [
    { id: 'focus', icon: Target, label: 'Today\'s Focus', color: 'var(--mon-accent)', bgColor: 'var(--mon-accent-bg)', glowColor: 'var(--mon-accent-glow)' },
    { id: 'pulse', icon: TrendingUp, label: 'Budget Pulse', color: budgetPct >= 100 ? 'var(--mon-expense)' : budgetPct >= 80 ? 'var(--mon-gold)' : 'var(--mon-income)', bgColor: 'var(--mon-surface-1)', glowColor: 'transparent' },
    { id: 'actions', icon: Bell, label: 'Quick Actions', color: needsAttention.length > 0 ? 'var(--mon-gold)' : 'var(--mon-teal)', bgColor: 'var(--mon-surface-1)', glowColor: 'transparent' },
  ]

  const handleCardChange = useCallback((cardId: CardId) => {
    haptics.tabChange()
    setActiveCard(cardId)
  }, [haptics])

  return (
    <section className="mon-smart-dashboard mb-5 mon-animate-spring-in">
      {/* Greeting Header */}
      <div className="sd-greeting">
        <div className="sd-greeting-left">
          <span className="sd-greeting-icon">{greeting.includes('morning') ? '🌅' : greeting.includes('afternoon') ? '☀️' : '🌙'}</span>
          <div>
            <p className="sd-greeting-text">{greeting}!</p>
            <p className="sd-greeting-sub">
              {topTask ? (
                <span className="sd-task-chip">
                  <Target size={10} /> {topTask.title}
                </span>
              ) : needsAttention.length > 0 ? (
                <span style={{ color: 'var(--mon-amber)' }}>{needsAttention.length} item{needsAttention.length > 1 ? 's' : ''} needs attention</span>
              ) : (
                <span style={{ color: 'var(--mon-income)' }}>All clear. Great job! ✅</span>
              )}
            </p>
          </div>
        </div>
        <div className="sd-greeting-right">
          <div className="sd-balance-pill">
            <span className="sd-balance-label">Balance</span>
            <span className="sd-balance-value">{formatCurrency(totalBalance, currencySymbol)}</span>
          </div>
        </div>
      </div>

      {/* Card Navigation Pills */}
      <div className="sd-nav-pills">
        {cards.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleCardChange(c.id)}
            className={`sd-nav-pill ${activeCard === c.id ? 'active' : ''}`}
            style={activeCard === c.id ? { background: c.color, color: '#fff' } : undefined}
          >
            <c.icon size={12} strokeWidth={2.5} />
            {c.label}
          </button>
        ))}
      </div>

      {/* Active Card Content */}
      <div className="sd-card-container">
        {activeCard === 'focus' && (
          <div className="sd-card sd-card-focus">
            <div className="sd-focus-header">
              <span className="sd-focus-icon" style={{ background: 'var(--mon-accent-bg)', color: 'var(--mon-accent)' }}>🎯</span>
              <div>
                <p className="sd-focus-title">{topTask ? topTask.title : 'Financially calm day'}</p>
                <p className="sd-focus-desc">
                  {topTask
                    ? `${topTask.priority} priority · ${topTask.category}`
                    : 'No pending tasks. Enjoy your day!'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenTasks}
                className="sd-card-btn"
              >
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="sd-focus-metrics">
              <div className="sd-metric">
                <span className="sd-metric-icon" style={{ color: 'var(--mon-expense)' }}>
                  <TrendingDown size={14} />
                </span>
                <div>
                  <p className="sd-metric-label">Spent Today</p>
                  <p className="sd-metric-value" style={{ color: todaySpend > 0 ? 'var(--mon-expense)' : 'var(--mon-text-2)' }}>
                    {formatCurrency(todaySpend, currencySymbol)}
                  </p>
                </div>
              </div>
              <div className="sd-metric-divider" />
              <div className="sd-metric">
                <span className="sd-metric-icon" style={{ color: 'var(--mon-text-3)' }}>
                  <CalendarClock size={14} />
                </span>
                <div>
                  <p className="sd-metric-label">Yesterday</p>
                  <p className="sd-metric-value" style={{ color: 'var(--mon-text-1)' }}>
                    {formatCurrency(yesterdaySpend, currencySymbol)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCard === 'pulse' && (
          <div className="sd-card sd-card-pulse">
            <div className="sd-pulse-ring-container">
              <svg width="80" height="80" viewBox="0 0 80 80" className="sd-pulse-ring-svg">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--mon-surface-3)" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none"
                  stroke={budgetPct >= 100 ? 'var(--mon-expense)' : budgetPct >= 80 ? 'var(--mon-gold)' : 'var(--mon-income)'}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${hasBudget ? (Math.min(budgetPct, 100) / 100) * 213.6 : 0} 213.6`}
                  transform="rotate(-90 40 40)"
                  className="sd-pulse-ring-fg"
                />
              </svg>
              <div className="sd-pulse-ring-center">
                <span className="sd-pulse-pct">{hasBudget ? `${Math.round(budgetPct)}%` : '--'}</span>
              </div>
            </div>
            <div className="sd-pulse-details">
              <p className="sd-pulse-title">
                {hasBudget
                  ? budgetPct >= 100 ? 'Budget Exceeded' : budgetPct >= 80 ? 'Watch Closely' : 'On Track'
                  : 'No Budget Set'
                }
              </p>
              <div className="sd-pulse-stats">
                <div className="sd-pulse-stat">
                  <span className="sd-pulse-stat-label">Spent</span>
                  <span className="sd-pulse-stat-value" style={{ color: 'var(--mon-expense)' }}>{formatCurrency(monthSpend, currencySymbol)}</span>
                </div>
                <div className="sd-pulse-stat">
                  <span className="sd-pulse-stat-label">Budget</span>
                  <span className="sd-pulse-stat-value" style={{ color: 'var(--mon-text-1)' }}>{hasBudget ? formatCurrency(budget.salary, currencySymbol) : 'Not set'}</span>
                </div>
                {budgetRemaining !== null && (
                  <div className="sd-pulse-stat">
                    <span className="sd-pulse-stat-label">Left</span>
                    <span className="sd-pulse-stat-value" style={{ color: budgetRemaining >= 0 ? 'var(--mon-income)' : 'var(--mon-expense)' }}>
                      {formatCurrency(Math.abs(budgetRemaining), currencySymbol)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeCard === 'actions' && (
          <div className="sd-card sd-card-actions">
            {needsAttention.length > 0 ? (
              <div className="sd-actions-list">
                {needsAttention.map((item, i) => (
                  <div key={i} className="sd-action-item" style={{ borderLeftColor: item.color }}>
                    <div className="sd-action-icon" style={{ background: `${item.color}15`, color: item.color }}>
                      <AlertTriangle size={14} />
                    </div>
                    <span className="sd-action-label">{item.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="sd-actions-empty">
                <span className="sd-actions-empty-icon">✨</span>
                <p className="sd-actions-empty-text">Everything looks good today</p>
              </div>
            )}
            {onAddTransaction && (
              <div className="sd-actions-quick">
                <p className="sd-actions-quick-label">Quick Add</p>
                <div className="sd-actions-quick-btns">
                  <button type="button" onClick={() => onAddTransaction('expense')} className="sd-quick-btn expense">
                    <TrendingDown size={12} /> Expense
                  </button>
                  <button type="button" onClick={() => onAddTransaction('income')} className="sd-quick-btn income">
                    <TrendingUp size={12} /> Income
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function priorityWeight(priority: Task['priority']) {
  return priority === 'critical' ? 4 : priority === 'high' ? 3 : priority === 'medium' ? 2 : 1
}