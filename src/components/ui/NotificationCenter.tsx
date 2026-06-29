'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Bell, BellRing, CheckCircle2, X } from 'lucide-react'
import { useDraggable } from '@/lib/hooks/useDraggable'
import { CATEGORY_META, EXPENSE_CATEGORIES } from '@/features/money/constants'
import { getRecurringOccurrences } from '@/features/money/recurring'
import { useMoneyStore } from '@/features/money/store/moneyStore'
import { formatCurrency, getCurrentMonth } from '@/features/money/utils'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { useTaskStore } from '@/lib/store/taskStore'
import type { Loan, MonthlyBudget, SavingsGoal, Subscription, Transaction } from '@/lib/types'
import type { Task } from '@/app/(tabs)/tasks/types'
import {
  cancelAllAppNotifications,
  ensureNotificationChannels,
  getNotificationPermission,
  isNativeNotificationPlatform,
  requestAppNotificationPermission,
  scheduleAppNotification,
} from '@/lib/native/notifications'

type AlertSeverity = 'low' | 'medium' | 'high'
type AlertKind = 'task' | 'subscription' | 'loan' | 'budget' | 'goal' | 'recurring'

type AppAlert = {
  id: string
  kind: AlertKind
  title: string
  body: string
  severity: AlertSeverity
}

const FIRED_KEY = 'selfsync-fired-alerts-v1'
const DAY_MS = 24 * 60 * 60 * 1000
const BELL_SIZE = 48
const BELL_MODAL_WIDTH = 360
const VIEWPORT_GAP = 12
const MODAL_ESTIMATED_HEIGHT = 440

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const daysUntil = (dateString?: string) => {
  if (!dateString) return Number.POSITIVE_INFINITY
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY
  return Math.ceil((startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / DAY_MS)
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object'

const isTask = (value: unknown): value is Task =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.completed === 'boolean' &&
  Array.isArray(value.reminders)

const isTransaction = (value: unknown): value is Transaction =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.amount === 'number' &&
  typeof value.type === 'string' &&
  typeof value.category === 'string'

const isLoan = (value: unknown): value is Loan =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.personName === 'string' &&
  typeof value.currentBalance === 'number'

const isMonthlyBudget = (value: unknown): value is MonthlyBudget =>
  isRecord(value) &&
  typeof value.month === 'string' &&
  isRecord(value.budgets)

const isSavingsGoal = (value: unknown): value is SavingsGoal =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.targetAmount === 'number' &&
  typeof value.currentAmount === 'number'

const isSubscription = (value: unknown): value is Subscription =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.amount === 'number' &&
  typeof value.status === 'string' &&
  typeof value.nextBillingDate === 'string'

const asArray = <T,>(value: unknown, guard: (item: unknown) => item is T): T[] =>
  Array.isArray(value) ? value.filter(guard) : []

const readFiredAlerts = (): Record<string, string> => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem(FIRED_KEY) || '{}')
  } catch {
    return {}
  }
}

const markAlertFired = (id: string) => {
  const today = new Date().toISOString().slice(0, 10)
  const fired = readFiredAlerts()
  window.localStorage.setItem(FIRED_KEY, JSON.stringify({ ...fired, [id]: today }))
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const getViewportSize = () => {
  if (typeof window === 'undefined') return { width: 0, height: 0 }
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  }
}

export default function NotificationCenter() {
  const taskItems = useTaskStore((s) => s.tasks)
  const markReminderTriggered = useTaskStore((s) => s.markReminderTriggered)
  const transactionItems = useMoneyStore((s) => s.transactions)
  const loanItems = useMoneyStore((s) => s.loans)
  const budgetItems = useMoneyStore((s) => s.budgets)
  const savingsGoalItems = useMoneyStore((s) => s.savingsGoals)
  const subscriptionItems = useMoneyStore((s) => s.subscriptions)
  const getCategoryBreakdown = useMoneyStore((s) => s.getCategoryBreakdown)
  const {
    currency_symbol,
    notificationsEnabled,
    notificationCategories,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
    update,
  } = useSettingsStore()
  const [open, setOpen] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [viewport, setViewport] = useState(getViewportSize)
  const tasks = useMemo(() => asArray(taskItems, isTask), [taskItems])
  const transactions = useMemo(() => asArray(transactionItems, isTransaction), [transactionItems])
  const loans = useMemo(() => asArray(loanItems, isLoan), [loanItems])
  const budgets = useMemo(() => asArray(budgetItems, isMonthlyBudget), [budgetItems])
  const savingsGoals = useMemo(() => asArray(savingsGoalItems, isSavingsGoal), [savingsGoalItems])
  const subscriptions = useMemo(() => asArray(subscriptionItems, isSubscription), [subscriptionItems])

  useEffect(() => {
    const loadPermission = async () => {
      await ensureNotificationChannels().catch((error) => console.warn('Notification channel setup failed:', error))
      const nextPermission = await getNotificationPermission()
      setPermission(nextPermission)
    }
    loadPermission()
  }, [])

  useEffect(() => {
    const openNotifications = () => setOpen(true)
    window.addEventListener('selfsync-open-notifications', openNotifications)
    return () => window.removeEventListener('selfsync-open-notifications', openNotifications)
  }, [])

  useEffect(() => {
    const updateViewport = () => setViewport(getViewportSize())
    updateViewport()
    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)
    window.visualViewport?.addEventListener('resize', updateViewport)
    window.visualViewport?.addEventListener('scroll', updateViewport)
    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
      window.visualViewport?.removeEventListener('resize', updateViewport)
      window.visualViewport?.removeEventListener('scroll', updateViewport)
    }
  }, [])

  const alerts = useMemo<AppAlert[]>(() => {
    const now = Date.now()
    const month = getCurrentMonth()
    const currentBudget = budgets.find((budget) => budget.month === month)
    const categorySpend = (() => {
      try {
        return getCategoryBreakdown(month)
      } catch (error) {
        console.warn('[SelfSync] Category breakdown recovered:', error)
        return {} as Record<string, number>
      }
    })()
    const tasksEnabled = notificationCategories.tasks
    const moneyEnabled = notificationCategories.money
    const taskAlerts = tasks
      .filter(() => tasksEnabled)
      .filter((task) => !task.completed && task.status !== 'archived')
      .flatMap((task) =>
        task.reminders
          .filter((reminder) => !reminder.triggered && new Date(reminder.remindAt).getTime() <= now)
          .map((reminder) => ({
            id: `task-${task.id}-${reminder.id}`,
            kind: 'task' as const,
            title: task.title,
            body: reminder.message || 'Task reminder is due now.',
            severity: task.priority === 'critical' || task.priority === 'high' ? 'high' as const : 'medium' as const,
          }))
      )

    const subscriptionAlerts = subscriptions
      .filter(() => moneyEnabled)
      .filter((sub) => sub.status === 'active')
      .map((sub) => ({ sub, days: daysUntil(sub.nextBillingDate) }))
      .filter(({ days }) => days <= 3)
      .map(({ sub, days }) => ({
        id: `subscription-${sub.id}-${sub.nextBillingDate}`,
        kind: 'subscription' as const,
        title: `${sub.name} bill ${days < 0 ? 'overdue' : days === 0 ? 'due today' : `due in ${days} days`}`,
        body: `${formatCurrency(sub.amount, currency_symbol)} upcoming ${sub.billingCycle} payment.`,
        severity: days <= 0 ? 'high' as const : 'medium' as const,
      }))

    const recurringAlerts = moneyEnabled
      ? getRecurringOccurrences(transactions, new Date(), 3).map((occurrence) => ({
          id: occurrence.id,
          kind: 'recurring' as const,
          title: `${occurrence.source.note || occurrence.source.category} ${occurrence.source.type === 'income' ? 'income' : 'expense'} upcoming`,
          body: `${formatCurrency(occurrence.source.amount, currency_symbol)} scheduled on ${occurrence.date}.`,
          severity: 'medium' as const,
        }))
      : []

    const loanAlerts = loans
      .filter(() => moneyEnabled)
      .filter((loan) => !loan.settled && loan.reminderEnabled && loan.dueDate)
      .map((loan) => ({ loan, days: daysUntil(loan.dueDate) }))
      .filter(({ days }) => days <= 3)
      .map(({ loan, days }) => ({
        id: `loan-${loan.id}-${loan.dueDate}`,
        kind: 'loan' as const,
        title: `${loan.personName} loan ${days < 0 ? 'overdue' : days === 0 ? 'due today' : `due in ${days} days`}`,
        body: `${formatCurrency(loan.currentBalance, currency_symbol)} remaining balance.`,
        severity: days <= 0 ? 'high' as const : 'medium' as const,
      }))

    const goalAlerts = savingsGoals
      .filter(() => moneyEnabled)
      .filter((goal) => goal.deadline && goal.currentAmount < goal.targetAmount)
      .map((goal) => ({ goal, days: daysUntil(goal.deadline) }))
      .filter(({ days }) => days <= 7)
      .map(({ goal, days }) => ({
        id: `goal-${goal.id}-${goal.deadline}`,
        kind: 'goal' as const,
        title: `${goal.title} deadline ${days < 0 ? 'passed' : days === 0 ? 'today' : `in ${days} days`}`,
        body: `${formatCurrency(goal.targetAmount - goal.currentAmount, currency_symbol)} still needed.`,
        severity: days <= 1 ? 'high' as const : 'medium' as const,
      }))

    const budgetAlerts = currentBudget && moneyEnabled
      ? EXPENSE_CATEGORIES.map((category) => {
          const limit = currentBudget.budgets[category] || 0
          const spent = categorySpend[category] || 0
          const ratio = limit > 0 ? spent / limit : 0
          return { category, limit, spent, ratio }
        })
          .filter((row) => row.limit > 0 && row.ratio >= 0.8)
          .map((row) => {
            const label = CATEGORY_META[row.category]?.labelEn || row.category
            return {
              id: `budget-${month}-${row.category}`,
              kind: 'budget' as const,
              title: `${label} budget ${row.ratio >= 1 ? 'exceeded' : 'near limit'}`,
              body: `${formatCurrency(row.spent, currency_symbol)} of ${formatCurrency(row.limit, currency_symbol)} used.`,
              severity: row.ratio >= 1 ? 'high' as const : 'medium' as const,
            }
          })
      : []

    return [...taskAlerts, ...subscriptionAlerts, ...recurringAlerts, ...loanAlerts, ...goalAlerts, ...budgetAlerts].slice(0, 12)
  }, [budgets, currency_symbol, getCategoryBreakdown, loans, notificationCategories.money, notificationCategories.tasks, savingsGoals, subscriptions, tasks, transactions])

  const isWithinQuietHours = (date: Date) => {
    if (!quietHoursEnabled) return false
    const [startH, startM] = quietHoursStart.split(':').map((v) => Number(v))
    const [endH, endM] = quietHoursEnd.split(':').map((v) => Number(v))
    if (Number.isNaN(startH) || Number.isNaN(startM) || Number.isNaN(endH) || Number.isNaN(endM)) return false
    const start = new Date(date)
    start.setHours(startH, startM, 0, 0)
    const end = new Date(date)
    end.setHours(endH, endM, 0, 0)
    if (start.getTime() === end.getTime()) return true
    if (start < end) return date >= start && date <= end
    return date >= start || date <= end
  }

  useEffect(() => {
    if (!notificationsEnabled || permission !== 'granted' || isWithinQuietHours(new Date()) || !notificationCategories.tasks) return
    const now = Date.now()
    tasks.forEach((task) => {
      if (task.completed || task.status === 'archived') return
      task.reminders.forEach((reminder) => {
        if (reminder.triggered || new Date(reminder.remindAt).getTime() > now) return
        if (isNativeNotificationPlatform()) {
          void scheduleAppNotification({
            tag: `task-${task.id}-${reminder.id}`,
            title: task.title,
            body: reminder.message || 'Task reminder is due now.',
            at: new Date(Math.max(Date.now() + 500, new Date(reminder.remindAt).getTime())),
          }).catch((error) => console.warn('Task notification failed:', error))
        } else {
          new Notification(task.title, {
            body: reminder.message || 'Task reminder is due now.',
            tag: `task-${task.id}-${reminder.id}`,
          })
        }
        markReminderTriggered(task.id, reminder.id)
      })
    })
  }, [markReminderTriggered, notificationCategories.tasks, notificationsEnabled, permission, quietHoursEnabled, quietHoursEnd, quietHoursStart, tasks])

  useEffect(() => {
    if (!notificationsEnabled || permission !== 'granted' || isWithinQuietHours(new Date()) || !notificationCategories.money) return
    const today = new Date().toISOString().slice(0, 10)
    const fired = readFiredAlerts()
    alerts
      .filter((alert) => alert.kind !== 'task' && alert.severity !== 'low')
      .forEach((alert) => {
        if (fired[alert.id] === today) return
        if (isNativeNotificationPlatform()) {
          void scheduleAppNotification({
            tag: alert.id,
            title: alert.title,
            body: alert.body,
            at: new Date(Date.now() + 500),
          }).catch((error) => console.warn('Money alert notification failed:', error))
        } else {
          new Notification(alert.title, { body: alert.body, tag: alert.id })
        }
        markAlertFired(alert.id)
      })
  }, [alerts, notificationCategories.money, notificationsEnabled, permission, quietHoursEnabled, quietHoursEnd, quietHoursStart])

  useEffect(() => {
    if (!notificationsEnabled && isNativeNotificationPlatform()) {
      cancelAllAppNotifications().catch((error) => {
        console.warn('Failed to cancel pending notifications:', error)
      })
    }
  }, [notificationsEnabled])

  const requestPermission = async () => {
    const next = await requestAppNotificationPermission()
    setPermission(next)
    if (next === 'granted') update({ notificationsEnabled: true })
  }

  const severityClass = (severity: AlertSeverity) =>
    severity === 'high'
      ? 'border-red-500/35 bg-red-500/10 text-red-300'
      : severity === 'medium'
        ? 'border-amber-500/35 bg-amber-500/10 text-amber-300'
        : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'

  const {
    position,
    elementRef: bellRef,
    isDragging: bellDragging,
    wasDragged: wasBellDragged,
    handlers: bellHandlers,
  } = useDraggable({
    storageKey: 'selfsync-bell-position',
    elementWidth: BELL_SIZE,
    elementHeight: BELL_SIZE,
    viewportPadding: VIEWPORT_GAP,
  })  

  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleBellClick = useCallback(() => {
    if (wasBellDragged()) return
    setOpen((value) => !value)
  }, [wasBellDragged])

  const modalPosition = useMemo(() => {
    const width = viewport.width || 360
    const height = viewport.height || 640
    const modalWidth = Math.min(BELL_MODAL_WIDTH, Math.max(0, width - VIEWPORT_GAP * 2))
    const maxLeft = Math.max(VIEWPORT_GAP, width - modalWidth - VIEWPORT_GAP)
    const left = clamp(position.x, VIEWPORT_GAP, maxLeft)
    const belowTop = position.y + BELL_SIZE + VIEWPORT_GAP
    const aboveTop = position.y - MODAL_ESTIMATED_HEIGHT - VIEWPORT_GAP
    const hasRoomBelow = belowTop + MODAL_ESTIMATED_HEIGHT <= height - VIEWPORT_GAP
    const top = clamp(hasRoomBelow ? belowTop : aboveTop, VIEWPORT_GAP, Math.max(VIEWPORT_GAP, height - VIEWPORT_GAP - 160))

    return {
      left,
      top,
      width: modalWidth,
      maxHeight: Math.max(220, height - top - VIEWPORT_GAP),
    }
  }, [position.x, position.y, viewport.height, viewport.width])

  return (
    <>
      <div
        ref={bellRef}
        className="fixed z-[10040]"
        style={{
          left: position.x,
          top: position.y,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          cursor: bellDragging ? 'grabbing' : 'grab',
        }}
        {...bellHandlers}
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={handleBellClick}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(var(--border),0.65)] bg-[rgb(var(--bg))]/95 text-[rgb(var(--fg))] shadow-lg shadow-black/10 backdrop-blur-xl transition hover:border-indigo-400/50 hover:text-indigo-400"
          style={{ pointerEvents: 'auto', padding: 0 }}
          aria-label="Open notifications"
        >
          {alerts.length ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          {alerts.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {alerts.length}
            </span>
          )}
        </button>
      </div>

      {open && (
        <div
          className="fixed z-[10030] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[rgba(var(--border),0.7)] bg-[rgb(var(--bg))]/98 shadow-2xl shadow-black/20 backdrop-blur-2xl"
          style={{
            left: modalPosition.left,
            top: modalPosition.top,
            width: modalPosition.width,
            maxHeight: modalPosition.maxHeight,
            transformOrigin: 'top left',
          }}
        >
          <div className="flex items-start justify-between border-b border-[rgba(var(--border),0.55)] p-4">
            <div>
              <p className="text-sm font-bold text-[rgb(var(--fg))]">Notification Center</p>
              <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                Tasks, bills, loans, goals and budget signals.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-[rgb(var(--muted))] hover:bg-[rgba(var(--border),0.25)] hover:text-[rgb(var(--fg))]"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            className="space-y-3 overflow-y-auto p-4"
            style={{ maxHeight: Math.max(120, modalPosition.maxHeight - 92) }}
          >
            {permission === 'default' && (
              <button
                type="button"
                onClick={requestPermission}
                className="flex w-full items-center justify-between rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-3 text-left text-sm font-semibold text-indigo-300"
              >
                  Enable notifications
                <Bell className="h-4 w-4" />
              </button>
            )}

            {!notificationsEnabled && (
              <button
                type="button"
                onClick={requestPermission}
                className="flex w-full items-center justify-between rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-3 text-left text-sm font-semibold text-amber-300"
              >
                App notifications are off
                <AlertTriangle className="h-4 w-4" />
              </button>
            )}

            {alerts.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-[rgba(var(--border),0.55)] bg-[rgba(var(--border),0.14)] p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">All clear</p>
                  <p className="text-xs text-[rgb(var(--muted))]">No urgent reminders right now.</p>
                </div>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-xl border border-[rgba(var(--border),0.55)] bg-[rgba(var(--border),0.12)] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold leading-snug text-[rgb(var(--fg))]">{alert.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">{alert.body}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${severityClass(alert.severity)}`}>
                      {alert.kind}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}
