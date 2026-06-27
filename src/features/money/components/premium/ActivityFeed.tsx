'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, ChevronRight, X, Bell, Target, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '../../utils'
import { CATEGORY_META } from '../../constants'
import type { Transaction, Subscription, MonthlyBudget, FinancialInsight, Loan, SavingsGoal } from '@/lib/types'

interface ActivityItem {
  id: string
  type: 'transaction' | 'bill' | 'insight' | 'goal' | 'budget' | 'loan'
  timestamp: string
  title: string
  description: string
  amount?: number
  isIncome?: boolean
  icon: string
  color: string
  badge?: { label: string; color: string }
  actionable?: boolean
  onAction?: () => void
  onDismiss?: () => void
}

interface ActivityFeedProps {
  transactions: Transaction[]
  subscriptions: Subscription[]
  insights: FinancialInsight[]
  savingsGoals: SavingsGoal[]
  loans: Loan[]
  budgets: MonthlyBudget[]
  currentBudget: { category: string; limit: number; spent: number } | null
  month: string
  currencySymbol: string
  onDismissInsight: (id: string) => void
  onSetTab: (tab: string) => void
  onDeleteTxn: (id: string) => void
  language: string
}

type FeedFilter = 'all' | 'transactions' | 'alerts' | 'bills'

export default function ActivityFeed({
  transactions, subscriptions, insights, savingsGoals, loans, currentBudget, budgets,
  month, currencySymbol, onDismissInsight, onSetTab, onDeleteTxn, language
}: ActivityFeedProps) {
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const feedItems: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = []

    // Recent transactions
    transactions
      .filter(t => t.date.startsWith(month))
      .slice(0, 8)
      .forEach(t => {
        const meta = CATEGORY_META[t.category] || CATEGORY_META.other
        items.push({
          id: `txn-${t.id}`,
          type: 'transaction',
          timestamp: t.date,
          title: t.note || (language === 'bn' ? meta.labelBn : meta.labelEn),
          description: meta.labelEn,
          amount: t.amount,
          isIncome: t.type === 'income',
          icon: meta.icon,
          color: meta.color,
          actionable: true,
          onDismiss: () => onDeleteTxn(t.id),
        })
      })

    // Active insights
    insights
      .filter(i => !i.read)
      .slice(0, 3)
      .forEach(i => {
        items.push({
          id: `insight-${i.id}`,
          type: 'insight',
          timestamp: '',
          title: i.title,
          description: i.description,
          icon: i.type === 'warning' ? '⚠️' : i.type === 'achievement' ? '🎉' : '💡',
          color: i.type === 'warning' ? 'var(--mon-expense)' : i.type === 'achievement' ? 'var(--mon-income)' : 'var(--mon-gold)',
          badge: { label: i.type, color: i.type === 'warning' ? 'var(--mon-expense-bg)' : i.type === 'achievement' ? 'var(--mon-income-bg)' : 'var(--mon-gold-bg)' },
          onDismiss: () => onDismissInsight(i.id),
        })
      })

    // Upcoming bills
    subscriptions
      .filter(s => s.status !== 'paused')
      .slice(0, 3)
      .forEach(s => {
        items.push({
          id: `bill-${s.id}`,
          type: 'bill',
          timestamp: s.nextBillingDate,
          title: s.name,
          description: `${s.billingCycle} · ${s.category}`,
          amount: s.amount,
          isIncome: false,
          icon: '📋',
          color: 'var(--mon-rose)',
        })
      })

    // Budget alerts
    if (currentBudget) {
      const spent = currentBudget.spent || 0
      const pct = currentBudget.limit > 0 ? (spent / currentBudget.limit) * 100 : 0
      if (pct > 80) {
        items.push({
          id: 'budget-alert',
          type: 'budget',
          timestamp: '',
          title: pct >= 100 ? `${currentBudget.category} budget exhausted` : `${currentBudget.category} at ${Math.round(pct)}%`,
          description: `Spent ${formatCurrency(spent, currencySymbol)} of ${formatCurrency(currentBudget.limit, currencySymbol)}`,
          icon: '📊',
          color: pct >= 100 ? 'var(--mon-expense)' : 'var(--mon-gold)',
          badge: { label: pct >= 100 ? 'Over' : 'Warning', color: pct >= 100 ? 'var(--mon-expense-bg)' : 'var(--mon-gold-bg)' },
        })
      }
    }

    // Sort by timestamp (most recent first), insights first
    items.sort((a, b) => {
      if (a.type === 'insight' && b.type !== 'insight') return -1
      if (b.type === 'insight' && a.type !== 'insight') return 1
      if (a.timestamp && b.timestamp) return b.timestamp.localeCompare(a.timestamp)
      return 0
    })

    return items
  }, [transactions, subscriptions, insights, currentBudget, month, currencySymbol, language, onDeleteTxn, onDismissInsight])

  const filteredItems = useMemo(() => {
    const f = filter === 'all' ? feedItems : feedItems.filter(i => {
      if (filter === 'transactions') return i.type === 'transaction'
      if (filter === 'alerts') return i.type === 'insight' || i.type === 'budget'
      if (filter === 'bills') return i.type === 'bill'
      return true
    })
    return f.filter(i => !dismissed.has(i.id))
  }, [feedItems, filter, dismissed])

  const dismissItem = (id: string) => {
    setDismissed(prev => new Set(prev).add(id))
    const item = feedItems.find(i => i.id === id)
    item?.onDismiss?.()
  }

  const filters: { key: FeedFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: feedItems.length },
    { key: 'transactions', label: 'Spends', count: feedItems.filter(i => i.type === 'transaction').length },
    { key: 'alerts', label: 'Alerts', count: feedItems.filter(i => i.type === 'insight' || i.type === 'budget').length },
    { key: 'bills', label: 'Bills', count: feedItems.filter(i => i.type === 'bill').length },
  ]

  return (
    <div className="mon-activity-feed">
      {/* Feed Filter Bar */}
      <div className="feed-filter-bar">
        {filters.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`feed-filter-btn ${filter === f.key ? 'active' : ''}`}
          >
            {f.label}
            {f.count > 0 && <span className="feed-filter-count">{f.count}</span>}
          </button>
        ))}
      </div>

      {/* Feed Items */}
      <div className="feed-list">
        {filteredItems.length === 0 ? (
          <div className="feed-empty">
            <div className="feed-empty-icon">✨</div>
            <p className="feed-empty-text">All clear! No activity to show.</p>
            <p className="feed-empty-sub">Your financial dashboard is up to date</p>
          </div>
        ) : (
          filteredItems.map((item, i) => (
            <div
              key={item.id}
              className="feed-item"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="feed-item-icon" style={{ background: `${item.color}15` }}>
                <span>{item.icon}</span>
              </div>

              <div className="feed-item-content">
                <div className="feed-item-top">
                  <p className="feed-item-title">{item.title}</p>
                  {item.amount != null && (
                    <p
                      className="feed-item-amount"
                      style={{ color: item.isIncome ? 'var(--mon-income)' : 'var(--mon-expense)' }}
                    >
                      {item.isIncome ? '+' : '-'}{formatCurrency(item.amount, currencySymbol)}
                    </p>
                  )}
                </div>
                <div className="feed-item-bottom">
                  <span className="feed-item-desc">{item.description}</span>
                  {item.badge && (
                    <span className="feed-item-badge" style={{ background: item.badge.color }}>
                      {item.badge.label}
                    </span>
                  )}
                  {item.timestamp && (
                    <span className="feed-item-time">{item.timestamp}</span>
                  )}
                </div>
              </div>

              {item.onDismiss && (
                <button
                  type="button"
                  onClick={() => dismissItem(item.id)}
                  className="feed-item-dismiss"
                  aria-label="Dismiss"
                >
                  <X size={12} />
                </button>
              )}

              {item.type === 'transaction' && (
                <div className="feed-item-type-indicator" style={{ background: item.isIncome ? 'var(--mon-income)' : 'var(--mon-expense)' }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}