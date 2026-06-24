// ─── SelfSync AI — Cross-Module Data Aggregator ────────────────────────────
// This file pulls data from all Zustand stores and computes a unified snapshot.
// It runs in a Web Worker for performance, but also has a sync fallback.

import type { AIContextSnapshot, WellnessScores, AIInsight, FocusSuggestion, DailyBrief, Pattern } from './types'
import { generateId } from '@/lib/utils/helpers'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

// ─── ISLAMIC QUOTES ─────────────────────────────────────────────────────────

const QUOTES: { text: string; source: string }[] = [
  { text: 'The best of you are those who are best to their families.', source: 'Tirmidhi' },
  { text: 'Whoever does not thank people, does not thank Allah.', source: 'Abu Dawud' },
  { text: 'Make things easy, do not make things difficult.', source: 'Bukhari' },
  { text: 'A good word is charity.', source: 'Bukhari & Muslim' },
  { text: 'The strongest person is not the one who can wrestle, but the one who controls himself at times of anger.', source: 'Bukhari' },
  { text: 'Whoever removes a worldly grief from a believer, Allah will remove a grief from him on the Day of Judgment.', source: 'Muslim' },
  { text: 'Take benefit of five before five: your youth before your old age, your health before your sickness, your wealth before your poverty, your free time before your preoccupation, and your life before your death.', source: 'Al-Hakim' },
  { text: 'The most beloved of deeds to Allah is consistency, even if it is small.', source: 'Bukhari & Muslim' },
  { text: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.', source: 'Bukhari' },
  { text: 'The best of you is the one who learns the Quran and teaches it.', source: 'Bukhari' },
  { text: 'Do not be people without minds of your own, saying that if others treat you well you will treat them well, and that if they do wrong you will do wrong. Instead, accustom yourselves to do good if people do good and not to do wrong if they do evil.', source: 'Tirmidhi' },
  { text: 'The world is a prison for the believer and a paradise for the disbeliever.', source: 'Muslim' },
  { text: 'Every son of Adam makes mistakes, and the best of those who make mistakes are those who repent.', source: 'Tirmidhi' },
  { text: 'Richness is not having many possessions, but richness is contentment of the soul.', source: 'Bukhari & Muslim' },
  { text: 'Whoever is not merciful to people, Allah will not be merciful to him.', source: 'Bukhari & Muslim' },
]

function getQuote(): { text: string; source: string } {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}

// ─── DATA AGGREGATOR ────────────────────────────────────────────────────────

export interface AggregatorInput {
  tasks: any[]
  namazRecords: any[]
  namazSettings: any
  transactions: any[]
  loans: any[]
  budgets: any[]
  savingsGoals: any[]
  wallets: any[]
  subscriptions: any[]
  assets: any[]
  netWorthHistory: any[]
  healthHistory: any[]
  notes: any[]
  quranBookmarks: any[]
  quranLastRead: any
}

export function computeSnapshot(input: AggregatorInput): AIContextSnapshot {
  const now = Date.now()
  const today = todayISO()
  const weekAgo = daysAgo(7)
  const monthAgo = daysAgo(30)

  // ── TASKS ────────────────────────────────────────────────────────────────
  const tasks = input.tasks || []
  const totalTasks = tasks.length
  const completedToday = tasks.filter((t: any) =>
    t.completedDates?.includes(today)
  ).length

  const completed7d = tasks.filter((t: any) =>
    (t.completedDates || []).some((d: string) => d >= weekAgo)
  ).length
  const totalDue7d = tasks.filter((t: any) =>
    t.dueDate && t.dueDate >= weekAgo && t.dueDate <= today
  ).length
  const completionRate7d = totalDue7d > 0 ? clamp(completed7d / totalDue7d, 0, 1) : 0

  const completed30d = tasks.filter((t: any) =>
    (t.completedDates || []).some((d: string) => d >= monthAgo)
  ).length
  const totalDue30d = tasks.filter((t: any) =>
    t.dueDate && t.dueDate >= monthAgo
  ).length
  const completionRate30d = totalDue30d > 0 ? clamp(completed30d / totalDue30d, 0, 1) : 0

  const overdueCount = tasks.filter((t: any) =>
    !t.completed && t.dueDate && t.dueDate < today
  ).length

  // Focus time
  const totalFocusMinutes = tasks.reduce((sum: number, t: any) => {
    return sum + (t.actualTime || 0)
  }, 0)
  const sessions = tasks.flatMap((t: any) => t.sessions || [])
  const avgFocusSessionMinutes = sessions.length > 0
    ? Math.round(sessions.reduce((sum: number, s: any) => sum + (s.durationSeconds || 0), 0) / sessions.length / 60)
    : 0

  // Peak productivity hour — find hour with most completed tasks
  const hourCounts: Record<number, number> = {}
  tasks.forEach((t: any) => {
    if (t.completedAt) {
      const h = new Date(t.completedAt).getHours()
      hourCounts[h] = (hourCounts[h] || 0) + 1
    }
  })
  let peakProductivityHour = 9 // default
  let maxCount = 0
  for (let h = 0; h < 24; h++) {
    if ((hourCounts[h] || 0) > maxCount) {
      maxCount = hourCounts[h]
      peakProductivityHour = h
    }
  }

  // Top category
  const catCounts: Record<string, number> = {}
  tasks.forEach((t: any) => {
    const cat = t.category || 'other'
    catCounts[cat] = (catCounts[cat] || 0) + 1
  })
  let topCategory = 'other'
  let maxCat = 0
  for (const [cat, count] of Object.entries(catCounts)) {
    if (count > maxCat) {
      maxCat = count
      topCategory = cat
    }
  }

  const tasksByStatus: Record<string, number> = {}
  const tasksByPriority: Record<string, number> = {}
  tasks.forEach((t: any) => {
    const status = t.status || 'inbox'
    tasksByStatus[status] = (tasksByStatus[status] || 0) + 1
    const priority = t.priority || 'medium'
    tasksByPriority[priority] = (tasksByPriority[priority] || 0) + 1
  })

  // ── NAMAZ ────────────────────────────────────────────────────────────────
  const records = input.namazRecords || []
  const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

  // Prayer consistency: % of prayers marked (prayed or qaza) in last 7/30 days
  const last7Days = Array.from({ length: 7 }, (_, i) => daysAgo(i))
  const last30Days = Array.from({ length: 30 }, (_, i) => daysAgo(i))

  let prayed7d = 0
  let total7d = 0
  let onTime7d = 0
  last7Days.forEach((date) => {
    const rec = records.find((r: any) => r.date === date)
    if (rec) {
      prayerNames.forEach((p) => {
        total7d++
        const status = rec.prayers?.[p]
        if (status === 'prayed' || status === 'qaza') {
          prayed7d++
          if (status === 'prayed') onTime7d++
        }
      })
    }
  })
  const prayerConsistency7d = total7d > 0 ? clamp(prayed7d / total7d, 0, 1) : 0
  const onTimeRate7d = total7d > 0 ? clamp(onTime7d / total7d, 0, 1) : 0

  let prayed30d = 0
  let total30d = 0
  last30Days.forEach((date) => {
    const rec = records.find((r: any) => r.date === date)
    if (rec) {
      prayerNames.forEach((p) => {
        total30d++
        if (rec.prayers?.[p] === 'prayed' || rec.prayers?.[p] === 'qaza') {
          prayed30d++
        }
      })
    }
  })
  const prayerConsistency30d = total30d > 0 ? clamp(prayed30d / total30d, 0, 1) : 0

  // Streak calculation
  let currentStreak = 0
  for (let i = 0; i < 365; i++) {
    const date = daysAgo(i)
    const rec = records.find((r: any) => r.date === date)
    if (rec) {
      const allPrayed = prayerNames.every(
        (p) => rec.prayers?.[p] === 'prayed' || rec.prayers?.[p] === 'qaza'
      )
      if (allPrayed) {
        currentStreak++
      } else {
        break
      }
    } else {
      break
    }
  }

  let longestStreak = 0
  let tempStreak = 0
  for (let i = 0; i < 365; i++) {
    const date = daysAgo(i)
    const rec = records.find((r: any) => r.date === date)
    if (rec) {
      const allPrayed = prayerNames.every(
        (p) => rec.prayers?.[p] === 'prayed' || rec.prayers?.[p] === 'qaza'
      )
      if (allPrayed) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    } else {
      tempStreak = 0
    }
  }

  const prayersByStatus: Record<string, number> = {}
  records.forEach((r: any) => {
    if (r.prayers) {
      prayerNames.forEach((p) => {
        const status = r.prayers[p] || 'pending'
        prayersByStatus[status] = (prayersByStatus[status] || 0) + 1
      })
    }
  })

  const quranBookmarks = input.quranBookmarks?.length || 0
  const quranLastReadSurah = input.quranLastRead?.surah || null

  // ── MONEY ────────────────────────────────────────────────────────────────
  const transactions = input.transactions || []
  const month = today.slice(0, 7)

  const monthTxns = transactions.filter((t: any) =>
    t.date?.startsWith(month) && t.status === 'completed'
  )
  const totalIncome = monthTxns
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
  const totalExpense = monthTxns
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
  const savingsRate = totalIncome > 0 ? clamp((totalIncome - totalExpense) / totalIncome, 0, 1) : 0

  // Budget utilization
  const budgets = input.budgets || []
  const monthBudget = budgets.find((b: any) => b.month === month)
  const monthlyBudgetUtilization = monthBudget && monthBudget.salary > 0
    ? clamp(totalExpense / monthBudget.salary, 0, 2)
    : 0

  const loans = input.loans || []
  const activeLoans = loans.filter((l: any) => !l.settled).length
  const totalDebt = loans
    .filter((l: any) => l.direction === 'taken' && !l.settled)
    .reduce((sum: number, l: any) => sum + (l.currentBalance || 0), 0)

  const savingsGoals = input.savingsGoals || []
  const totalSavings = savingsGoals.reduce((sum: number, g: any) => sum + (g.currentAmount || 0), 0)

  // Top expense category
  const expenseCats: Record<string, number> = {}
  monthTxns
    .filter((t: any) => t.type === 'expense')
    .forEach((t: any) => {
      const cat = t.category || 'other'
      expenseCats[cat] = (expenseCats[cat] || 0) + t.amount
    })
  let topExpenseCategory = 'other'
  let maxExpense = 0
  for (const [cat, amt] of Object.entries(expenseCats)) {
    if (amt > maxExpense) {
      maxExpense = amt
      topExpenseCategory = cat
    }
  }

  // Expense trend (last 7 days vs previous 7 days)
  const last7Expense = transactions
    .filter((t: any) => t.type === 'expense' && t.date >= weekAgo && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
  const prev7Expense = transactions
    .filter((t: any) => t.type === 'expense' && t.date >= daysAgo(14) && t.date < weekAgo && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
  const expenseTrend7d = prev7Expense > 0
    ? round2((last7Expense - prev7Expense) / prev7Expense)
    : 0

  const subscriptions = input.subscriptions || []
  const subscriptionsActive = subscriptions.filter((s: any) => s.status === 'active').length

  // Net worth
  const wallets = input.wallets || []
  const assets = input.assets || []
  const totalWalletBalance = wallets.reduce((sum: number, w: any) => sum + (w.balance || 0), 0)
  const totalAssetValue = assets.reduce((sum: number, a: any) => sum + (a.value || 0), 0)
  const totalLoanLiabilities = loans
    .filter((l: any) => l.direction === 'taken' && !l.settled)
    .reduce((sum: number, l: any) => sum + (l.currentBalance || 0), 0)
  const netWorth = totalWalletBalance + totalAssetValue + totalSavings - totalLoanLiabilities

  // ── HEALTH ───────────────────────────────────────────────────────────────
  const healthHistory = input.healthHistory || []
  const bmiRecords = healthHistory.length
  const latestBMI = healthHistory.length > 0 ? healthHistory[0].bmi : null
  const bmiCategory = healthHistory.length > 0 ? healthHistory[0].category : null

  // Health tracking consistency: how many days in last 30 have a record
  const healthDays = new Set(
    healthHistory.map((r: any) => new Date(r.date || r.createdAt).toISOString().split('T')[0])
  )
  const healthTrackingConsistency = clamp(healthDays.size / 30, 0, 1)

  // ── NOTES ────────────────────────────────────────────────────────────────
  const notes = input.notes || []
  const totalNotes = notes.length
  const notesThisWeek = notes.filter((n: any) => {
    const noteDate = new Date(n.createdAt || n.updatedAt).toISOString().split('T')[0]
    return noteDate >= weekAgo
  }).length
  const pinnedNotes = notes.filter((n: any) => n.pinned).length

  return {
    timestamp: now,
    date: today,
    totalTasks,
    completedToday,
    completionRate7d: round2(completionRate7d),
    completionRate30d: round2(completionRate30d),
    overdueCount,
    totalFocusMinutes,
    avgFocusSessionMinutes,
    peakProductivityHour,
    topCategory,
    tasksByStatus,
    tasksByPriority,
    prayerConsistency7d: round2(prayerConsistency7d),
    prayerConsistency30d: round2(prayerConsistency30d),
    onTimeRate7d: round2(onTimeRate7d),
    currentStreak,
    longestStreak,
    prayersByStatus,
    quranBookmarks,
    quranLastReadSurah,
    totalIncome: round2(totalIncome),
    totalExpense: round2(totalExpense),
    savingsRate: round2(savingsRate),
    monthlyBudgetUtilization: round2(monthlyBudgetUtilization),
    activeLoans,
    totalDebt: round2(totalDebt),
    totalSavings: round2(totalSavings),
    topExpenseCategory,
    expenseTrend7d,
    subscriptionsActive,
    netWorth: round2(netWorth),
    bmiRecords,
    latestBMI: latestBMI ? round2(latestBMI) : null,
    bmiCategory,
    healthTrackingConsistency: round2(healthTrackingConsistency),
    totalNotes,
    notesThisWeek,
    pinnedNotes,
  }
}

// ─── SCORING ENGINE ─────────────────────────────────────────────────────────

export function computeScores(snapshot: AIContextSnapshot): WellnessScores {
  // Islamic Score (0–100)
  const prayerScore = snapshot.prayerConsistency30d * 60 + snapshot.onTimeRate7d * 20
  const streakBonus = Math.min(snapshot.currentStreak / 30, 1) * 10
  const quranScore = Math.min(snapshot.quranBookmarks / 10, 1) * 10
  const islamic = Math.round(clamp(prayerScore + streakBonus + quranScore, 0, 100))

  // Productivity Score (0–100)
  const completionScore = snapshot.completionRate30d * 50
  const focusScore = Math.min(snapshot.totalFocusMinutes / (30 * 60), 1) * 20 // 30 hours/month target
  const overduePenalty = Math.max(0, 15 - snapshot.overdueCount * 3)
  const taskLoadScore = Math.min(snapshot.totalTasks / 20, 1) * 15
  const productivity = Math.round(clamp(completionScore + focusScore + overduePenalty + taskLoadScore, 0, 100))

  // Financial Score (0–100)
  const savingsScore = snapshot.savingsRate * 40
  const budgetScore = Math.max(0, (1 - snapshot.monthlyBudgetUtilization)) * 25
  const debtPenalty = Math.max(0, 20 - snapshot.totalDebt / 10000 * 5)
  const netWorthScore = Math.min(snapshot.netWorth / 100000, 1) * 15
  const financial = Math.round(clamp(savingsScore + budgetScore + debtPenalty + netWorthScore, 0, 100))

  // Health Score (0–100)
  const bmiScore = snapshot.latestBMI !== null
    ? (snapshot.latestBMI >= 18.5 && snapshot.latestBMI <= 24.9) ? 50 : 20
    : 0
  const consistencyScore = snapshot.healthTrackingConsistency * 50
  const health = Math.round(clamp(bmiScore + consistencyScore, 0, 100))

  // Overall Score (weighted)
  const overall = Math.round(
    islamic * 0.30 + productivity * 0.30 + financial * 0.25 + health * 0.15
  )

  return { islamic, productivity, financial, health, overall }
}

// ─── INSIGHT GENERATOR ──────────────────────────────────────────────────────

export function generateInsights(
  snapshot: AIContextSnapshot,
  previousInsights: AIInsight[]
): AIInsight[] {
  const insights: AIInsight[] = []
  const now = Date.now()

  // ── Cross-module patterns ──
  // Prayer + Productivity correlation
  if (snapshot.prayerConsistency7d > 0.8 && snapshot.completionRate7d > 0.7) {
    insights.push({
      id: generateId(),
      type: 'pattern',
      severity: 'low',
      title: 'Deen & Dunya in Balance ✨',
      description: 'Your prayer consistency and task completion are both high. This balance is the key to barakah in your day.',
      actionLabel: 'Keep it up',
      source: 'cross',
      timestamp: now,
      read: false,
      dismissed: false,
    })
  }

  // Late night spending pattern
  if (snapshot.expenseTrend7d > 0.3 && snapshot.prayerConsistency7d < 0.6) {
    insights.push({
      id: generateId(),
      type: 'pattern',
      severity: 'medium',
      title: 'Spending & Iman Connection',
      description: 'Your expenses increased while prayer consistency dropped. Consider reviewing your late-night spending habits.',
      actionLabel: 'View expenses',
      actionRoute: '/money',
      source: 'cross',
      timestamp: now,
      read: false,
      dismissed: false,
    })
  }

  // ── Task insights ──
  if (snapshot.overdueCount > 5) {
    insights.push({
      id: generateId(),
      type: 'warning',
      severity: 'high',
      title: `${snapshot.overdueCount} tasks overdue`,
      description: 'Overdue tasks pile up fast. Try focusing on 3 high-priority tasks today to clear the backlog.',
      actionLabel: 'View overdue',
      actionRoute: '/tasks?filter=overdue',
      source: 'tasks',
      timestamp: now,
      read: false,
      dismissed: false,
    })
  }

  if (snapshot.completionRate7d > 0.8 && snapshot.completionRate7d > snapshot.completionRate30d) {
    insights.push({
      id: generateId(),
      type: 'achievement',
      severity: 'low',
      title: 'Productivity Surge 🚀',
      description: `You completed ${Math.round(snapshot.completionRate7d * 100)}% of tasks this week — that's higher than your monthly average!`,
      actionLabel: 'See tasks',
      actionRoute: '/tasks',
      source: 'tasks',
      timestamp: now,
      read: false,
      dismissed: false,
    })
  }

  if (snapshot.avgFocusSessionMinutes > 0 && snapshot.avgFocusSessionMinutes < 15) {
    insights.push({
      id: generateId(),
      type: 'tip',
      severity: 'medium',
      title: 'Short focus sessions',
      description: `Your average focus session is only ${snapshot.avgFocusSessionMinutes} min. Try the Pomodoro technique (25 min) for deeper work.`,
      actionLabel: 'Start focus',
      actionRoute: '/tasks',
      source: 'tasks',
      timestamp: now,
      read: false,
      dismissed: false,
    })
  }

  // ── Namaz insights ──
  if (snapshot.currentStreak >= 7) {
    insights.push({
      id: generateId(),
      type: 'achievement',
      severity: 'low',
      title: `${snapshot.currentStreak}-Day Prayer Streak 🔥`,
      description: snapshot.currentStreak >= 30
        ? 'Masha\'Allah! A full month of consistent prayers. This is truly remarkable.'
        : `You've prayed all 5 prayers on time for ${snapshot.currentStreak} days in a row!`,
      actionLabel: 'View prayer log',
      actionRoute: '/namaz',
      source: 'namaz',
      timestamp: now,
      read: false,
      dismissed: false,
    })
  }

  if (snapshot.prayerConsistency7d < 0.5 && snapshot.prayerConsistency30d > 0.5) {
    insights.push({
      id: generateId(),
      type: 'warning',
      severity: 'high',
      title: 'Prayer consistency dropped',
      description: 'Your prayer consistency this week is lower than your monthly average. Try setting adhan reminders.',
      actionLabel: 'Check settings',
      actionRoute: '/namaz',
      source: 'namaz',
      timestamp: now,
      read: false,
      dismissed: false,
    })
  }

  // ── Money insights ──
  if (snapshot.savingsRate < 0.1 && snapshot.totalIncome > 0) {
    insights.push({
      id: generateId(),
      type: 'warning',
      severity: 'high',
      title: 'Savings rate critical',
      description: `You're saving only ${Math.round(snapshot.savingsRate * 100)}% of your income. Aim for at least 20% to build financial security.`,
      actionLabel: 'Set budget',
      actionRoute: '/money',
      source: 'money',
      timestamp: now,
      read: false,
      dismissed: false,
    })
  }

  if (snapshot.savingsRate > 0.3) {
    insights.push({
      id: generateId(),
      type: 'achievement',
      severity: 'low',
      title: 'Strong Saver 💪',
      description: `You're saving ${Math.round(snapshot.savingsRate * 100)}% of your income. This is excellent financial discipline!`,
      actionLabel: 'View savings',
      actionRoute: '/money',
      source: 'money',
      timestamp: now,
      read: false,
      dismissed: false,
    })
  }

  if (snapshot.monthlyBudgetUtilization > 1.0) {
    insights.push({
      id: generateId(),
      type: 'warning',
      severity: 'high',
      title: 'Budget exceeded',
      description: `You've spent ${Math.round(snapshot.monthlyBudgetUtilization * 100)}% of your monthly budget. Consider cutting non-essential expenses.`,
      actionLabel: 'Review budget',
      actionRoute: '/money',
      source: 'money',
      timestamp: now,
      read: false,
      dismissed: false,
    })
  }

  // ── Health insights ──
  if (snapshot.latestBMI !== null && (snapshot.latestBMI < 18.5 || snapshot.latestBMI > 24.9)) {
    insights.push({
      id: generateId(),
      type: 'tip',
      severity: 'medium',
      title: 'BMI needs attention',
      description: `Your BMI is ${snapshot.latestBMI} (${snapshot.bmiCategory}). A healthy range is 18.5–24.9. Small daily habits make a big difference.`,
      actionLabel: 'Track health',
      actionRoute: '/home',
      source: 'health',
      timestamp: now,
      read: false,
      dismissed: false,
    })
  }

  // ── Cross-module: Islamic Financial Health ──
  if (snapshot.totalDebt > 0 && snapshot.savingsRate < 0.05) {
    insights.push({
      id: generateId(),
      type: 'suggestion',
      severity: 'high',
      title: 'Debt & Savings Imbalance',
      description: `You have ৳${snapshot.totalDebt.toLocaleString()} in debt but minimal savings. Consider a debt repayment plan before taking on new financial obligations.`,
      actionLabel: 'View loans',
      actionRoute: '/money',
      source: 'cross',
      timestamp: now,
      read: false,
      dismissed: false,
    })
  }

  // Deduplicate against previous insights (keep if same type + source combo is new)
  const existingKeys = new Set(
    previousInsights
      .filter((i) => !i.dismissed)
      .map((i) => `${i.type}-${i.source}-${i.title.slice(0, 20)}`)
  )

  const newInsights = insights.filter(
    (i) => !existingKeys.has(`${i.type}-${i.source}-${i.title.slice(0, 20)}`)
  )

  // Merge: new insights first, then previous non-dismissed, limit to 20
  const merged = [
    ...newInsights,
    ...previousInsights.filter((i) => !i.dismissed),
  ].slice(0, 20)

  return merged
}

// ─── FOCUS SUGGESTION ENGINE ────────────────────────────────────────────────

export function computeFocusSuggestion(snapshot: AIContextSnapshot): FocusSuggestion | null {
  const peakHour = snapshot.peakProductivityHour
  const peakEnd = (peakHour + 1) % 24
  const peakLabel = `${String(peakHour).padStart(2, '0')}:00–${String(peakEnd).padStart(2, '0')}:00`

  // Check if peak hour aligns with Fajr time (roughly 4-6am)
  const isFajrAligned = peakHour >= 4 && peakHour <= 7

  let reason: string
  let score: number

  if (isFajrAligned && snapshot.prayerConsistency7d > 0.6) {
    reason = 'Your peak productivity aligns with post-Fajr hours. This is a blessed time for deep work.'
    score = 95
  } else if (snapshot.completionRate7d > 0.7) {
    reason = `You complete most tasks around ${peakLabel}. Schedule your most important work here.`
    score = 85
  } else if (snapshot.overdueCount > 3) {
    reason = 'Start with your most overdue task first thing to break the backlog cycle.'
    score = 75
  } else {
    reason = `Your historical peak is ${peakLabel}. Try a focused session then.`
    score = 70
  }

  return {
    timeSlot: peakLabel,
    label: `Focus: ${peakLabel}`,
    reason,
    score,
  }
}

// ─── DAILY BRIEF GENERATOR ──────────────────────────────────────────────────

export function generateDailyBrief(
  snapshot: AIContextSnapshot,
  scores: WellnessScores,
  insights: AIInsight[],
): DailyBrief {
  const topInsight = insights.length > 0 ? insights[0] : null
  const focusSuggestion = computeFocusSuggestion(snapshot)

  // Prayer status summary
  const prayerStatus = snapshot.prayerConsistency7d > 0.8
    ? 'Excellent'
    : snapshot.prayerConsistency7d > 0.5
      ? 'Good'
      : snapshot.prayerConsistency7d > 0.3
        ? 'Needs improvement'
        : 'Low'

  // Spending pulse
  const spendingPulse = snapshot.expenseTrend7d > 0.2
    ? 'Increasing ⬆️'
    : snapshot.expenseTrend7d < -0.2
      ? 'Decreasing ⬇️'
      : 'Stable ➡️'

  const quote = getQuote()

  return {
    date: snapshot.date,
    scores,
    topInsight,
    focusSuggestion,
    taskCount: snapshot.completedToday,
    prayerStatus,
    spendingPulse,
    quote: `${quote.text} — ${quote.source}`,
  }
}

// ─── PATTERN DETECTOR ───────────────────────────────────────────────────────

export function detectPatterns(snapshot: AIContextSnapshot): Pattern[] {
  const patterns: Pattern[] = []
  const now = Date.now()

  // Correlation: Prayer consistency vs Productivity
  if (snapshot.prayerConsistency7d > 0.6 && snapshot.completionRate7d > 0.6) {
    patterns.push({
      id: generateId(),
      type: 'correlation',
      title: 'Prayer fuels productivity',
      description: 'When your prayer consistency is high, your task completion rate also rises. This is the barakah effect.',
      strength: 0.85,
      sourceA: 'namaz',
      sourceB: 'tasks',
      actionable: true,
    })
  }

  // Trend: Expense increasing
  if (snapshot.expenseTrend7d > 0.3) {
    patterns.push({
      id: generateId(),
      type: 'trend',
      title: 'Expenses rising',
      description: `Your spending increased ${Math.round(snapshot.expenseTrend7d * 100)}% compared to last week. Top category: ${snapshot.topExpenseCategory}.`,
      strength: 0.7,
      sourceA: 'money',
      sourceB: 'money',
      actionable: true,
    })
  }

  // Anomaly: High overdue with low prayer
  if (snapshot.overdueCount > 10 && snapshot.prayerConsistency7d < 0.3) {
    patterns.push({
      id: generateId(),
      type: 'anomaly',
      title: 'Spiritual & productivity dip',
      description: 'Both prayer consistency and task management are low. A structured morning routine after Fajr could help reset both.',
      strength: 0.8,
      sourceA: 'namaz',
      sourceB: 'tasks',
      actionable: true,
    })
  }

  // Health trend
  if (snapshot.bmiRecords > 0 && snapshot.healthTrackingConsistency < 0.3) {
    patterns.push({
      id: generateId(),
      type: 'trend',
      title: 'Health tracking inconsistent',
      description: 'You have BMI records but haven\'t been tracking regularly. Weekly check-ins help maintain awareness.',
      strength: 0.6,
      sourceA: 'health',
      sourceB: 'health',
      actionable: true,
    })
  }

  return patterns
}