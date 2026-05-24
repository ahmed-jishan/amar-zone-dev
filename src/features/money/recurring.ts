import type { Subscription, Transaction } from '@/lib/types'

export type RecurringOccurrence = {
  id: string
  date: string
  source: Transaction
}

export type ScheduleItem =
  | { id: string; kind: 'subscription'; date: string; title: string; amount: number; type: 'expense'; source: Subscription }
  | { id: string; kind: 'recurring'; date: string; title: string; amount: number; type: Transaction['type']; source: Transaction }

const dayMs = 24 * 60 * 60 * 1000

export function toDateInput(date: Date) {
  return date.toISOString().split('T')[0]
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addInterval(date: Date, interval: NonNullable<Transaction['recurringInterval']> | Subscription['billingCycle']) {
  const next = new Date(date)
  if (interval === 'daily') next.setDate(next.getDate() + 1)
  if (interval === 'weekly') next.setDate(next.getDate() + 7)
  if (interval === 'monthly') next.setMonth(next.getMonth() + 1)
  if (interval === 'yearly') next.setFullYear(next.getFullYear() + 1)
  return next
}

export function daysBetween(start: Date, end: Date) {
  return Math.ceil((parseLocalDate(toDateInput(end)).getTime() - parseLocalDate(toDateInput(start)).getTime()) / dayMs)
}

export function getNextRecurringDate(transaction: Transaction, fromDate = new Date()) {
  if (!transaction.isRecurring || !transaction.recurringInterval) return null
  let next = parseLocalDate(transaction.date)
  const from = parseLocalDate(toDateInput(fromDate))
  let guard = 0

  while (next <= from && guard < 500) {
    next = addInterval(next, transaction.recurringInterval)
    guard += 1
  }

  return toDateInput(next)
}

export function getRecurringOccurrences(transactions: Transaction[], fromDate = new Date(), daysAhead = 30): RecurringOccurrence[] {
  const end = new Date(parseLocalDate(toDateInput(fromDate)).getTime() + daysAhead * dayMs)

  return transactions
    .filter((transaction) => transaction.isRecurring && !!transaction.recurringInterval && transaction.status === 'completed')
    .map((transaction) => {
      const date = getNextRecurringDate(transaction, fromDate)
      return date ? { id: `recurring-${transaction.id}-${date}`, date, source: transaction } : null
    })
    .filter((item): item is RecurringOccurrence => !!item && parseLocalDate(item.date) <= end)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function getUpcomingSchedule({
  transactions,
  subscriptions,
  fromDate = new Date(),
  daysAhead = 30,
}: {
  transactions: Transaction[]
  subscriptions: Subscription[]
  fromDate?: Date
  daysAhead?: number
}): ScheduleItem[] {
  const start = parseLocalDate(toDateInput(fromDate))
  const end = new Date(start.getTime() + daysAhead * dayMs)

  const subscriptionItems: ScheduleItem[] = subscriptions
    .filter((subscription) => subscription.status === 'active')
    .filter((subscription) => {
      const due = parseLocalDate(subscription.nextBillingDate)
      return due >= start && due <= end
    })
    .map((subscription) => ({
      id: `subscription-${subscription.id}-${subscription.nextBillingDate}`,
      kind: 'subscription',
      date: subscription.nextBillingDate,
      title: subscription.name,
      amount: subscription.amount,
      type: 'expense',
      source: subscription,
    }))

  const recurringItems: ScheduleItem[] = getRecurringOccurrences(transactions, fromDate, daysAhead).map((occurrence) => ({
    id: occurrence.id,
    kind: 'recurring',
    date: occurrence.date,
    title: occurrence.source.note || occurrence.source.category,
    amount: occurrence.source.amount,
    type: occurrence.source.type,
    source: occurrence.source,
  }))

  return [...subscriptionItems, ...recurringItems].sort((a, b) => a.date.localeCompare(b.date))
}

export function getNextSubscriptionDate(subscription: Subscription) {
  return toDateInput(addInterval(parseLocalDate(subscription.nextBillingDate), subscription.billingCycle))
}
