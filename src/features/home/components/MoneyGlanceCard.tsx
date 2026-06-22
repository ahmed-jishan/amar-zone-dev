'use client'

import { useMemo, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useMoneyStore } from '@/features/money/store/moneyStore'
import { useRouter } from 'next/navigation'

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))
  const display = useTransform(rounded, (v) => `${prefix}${v.toLocaleString('en-BD')}${suffix}`)

  useEffect(() => {
    const controls = animate(count, value, {
      type: 'spring',
      stiffness: 50,
      damping: 25,
      restDelta: 0.5,
    })
    return controls.stop
  }, [value, count])

  return <motion.span>{display}</motion.span>
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function getMonthISO(): string {
  return getTodayISO().slice(0, 7)
}

export default function MoneyGlanceCard() {
  const router = useRouter()
  const transactions = useMoneyStore((s) => s.transactions)
  const wallets = useMoneyStore((s) => s.wallets)
  const budgets = useMoneyStore((s) => s.budgets)
  const getSpendingPulse = useMoneyStore((s) => s.getSpendingPulse)
  const getMonthSummary = useMoneyStore((s) => s.getMonthSummary)

  const stats = useMemo(() => {
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)
    const today = getTodayISO()
    const month = getMonthISO()
    const pulse = getSpendingPulse()
    const summary = getMonthSummary(month)
    const budget = budgets.find((b) => b.month === month)
    const budgetProgress = budget ? Math.min((summary.expense / (budget.salary || 1)) * 100, 100) : 0
    const recentTxn = transactions
      .filter((t) => t.status === 'completed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null

    const pulseConfig = {
      green: { color: '#10b981', label: 'On track', bg: 'rgba(16,185,129,0.1)' },
      amber: { color: '#f59e0b', label: 'Watch out', bg: 'rgba(245,158,11,0.1)' },
      red: { color: '#ef4444', label: 'Over budget', bg: 'rgba(239,68,68,0.1)' },
    }

    return {
      totalBalance,
      pulse,
      pulseConfig: pulseConfig[pulse.status],
      summary,
      budgetProgress,
      budgetTotal: budget?.salary || 0,
      recentTxn,
    }
  }, [transactions, wallets, budgets, getSpendingPulse, getMonthSummary])

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => router.push('/money')}
      className="hm-glass-card w-full text-left cursor-pointer"
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <span className="card-title">Finance</span>
        </div>
        <div
          className="pulse-status-badge"
          style={{
            backgroundColor: stats.pulseConfig.bg,
            color: stats.pulseConfig.color,
            border: `1px solid ${stats.pulseConfig.color}40`,
          }}
        >
          <span
            className="pulse-dot"
            style={{ backgroundColor: stats.pulseConfig.color }}
          />
          {stats.pulseConfig.label}
        </div>
      </div>

      {/* Balance */}
      <div className="balance-row">
        <span className="balance-label">Total Balance</span>
        <div className="balance-value">
          <span className="balance-currency">৳</span>
          <AnimatedNumber value={stats.totalBalance} />
        </div>
      </div>

      {/* Today's Spending Pulse */}
      <div className="pulse-row">
        <div className="pulse-info">
          <span className="pulse-label">Today's Spending</span>
          <span className="pulse-amount">৳{stats.pulse.todaySpent.toLocaleString('en-BD')}</span>
        </div>
        <div className="pulse-bar-track">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(stats.pulse.percentUsed, 100)}%` }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="pulse-bar-fill"
            style={{
              background: `linear-gradient(90deg, ${stats.pulseConfig.color}, ${stats.pulseConfig.color}80)`,
            }}
          />
        </div>
      </div>

      {/* Monthly Budget */}
      {stats.budgetTotal > 0 && (
        <div className="budget-row">
          <div className="budget-info">
            <span className="budget-label">Monthly Budget</span>
            <span className="budget-text">
              ৳{stats.summary.expense.toLocaleString('en-BD')} / ৳{stats.budgetTotal.toLocaleString('en-BD')}
            </span>
          </div>
          <div className="progress-bar-track">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(stats.budgetProgress, 100)}%` }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="progress-bar-fill"
              style={{
                background: stats.budgetProgress > 90
                  ? 'linear-gradient(90deg, #ef4444, #f87171)'
                  : stats.budgetProgress > 70
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #6366f1, #818cf8)',
              }}
            />
          </div>
        </div>
      )}

      {/* Recent Transaction */}
      {stats.recentTxn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="recent-txn-row"
        >
          <span className="recent-txn-label">Latest</span>
          <div className="recent-txn-detail">
            <span className="recent-txn-cat">{stats.recentTxn.category}</span>
            <span
              className="recent-txn-amount"
              style={{ color: stats.recentTxn.type === 'income' ? '#10b981' : '#ef4444' }}
            >
              {stats.recentTxn.type === 'income' ? '+' : '-'}৳{stats.recentTxn.amount.toLocaleString('en-BD')}
            </span>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!stats.recentTxn && stats.totalBalance === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="empty-finance-state"
        >
          <span>💳</span>
          <span>No transactions yet. Start tracking your finances!</span>
        </motion.div>
      )}
    </motion.button>
  )
}