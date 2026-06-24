// ─── SelfSync AI — Core Types ───────────────────────────────────────────────

/** Score ranges from 0–100 */
export interface WellnessScores {
  islamic: number      // Namaz consistency + Quran + Islamic finance
  productivity: number // Task completion, focus time, energy patterns
  financial: number    // Income/expense ratio, savings, debt
  health: number       // BMI tracking, consistency
  overall: number      // Weighted composite
}

export interface ScoreBreakdown {
  category: string
  score: number
  maxScore: number
  label: string
  detail: string
}

export interface AIContextSnapshot {
  timestamp: number
  date: string // ISO date

  // Tasks
  totalTasks: number
  completedToday: number
  completionRate7d: number  // 0–1
  completionRate30d: number // 0–1
  overdueCount: number
  totalFocusMinutes: number
  avgFocusSessionMinutes: number
  peakProductivityHour: number // 0–23
  topCategory: string
  tasksByStatus: Record<string, number>
  tasksByPriority: Record<string, number>

  // Namaz
  prayerConsistency7d: number  // 0–1
  prayerConsistency30d: number // 0–1
  onTimeRate7d: number         // 0–1 (prayed vs missed/qaza)
  currentStreak: number
  longestStreak: number
  prayersByStatus: Record<string, number>
  quranBookmarks: number
  quranLastReadSurah: number | null

  // Money
  totalIncome: number
  totalExpense: number
  savingsRate: number          // 0–1
  monthlyBudgetUtilization: number // 0–1+
  activeLoans: number
  totalDebt: number
  totalSavings: number
  topExpenseCategory: string
  expenseTrend7d: number       // positive = increasing
  subscriptionsActive: number
  netWorth: number

  // Health
  bmiRecords: number
  latestBMI: number | null
  bmiCategory: string | null
  healthTrackingConsistency: number // 0–1

  // Notes
  totalNotes: number
  notesThisWeek: number
  pinnedNotes: number
}

export interface AIInsight {
  id: string
  type: 'achievement' | 'warning' | 'tip' | 'pattern' | 'suggestion'
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  actionLabel?: string
  actionRoute?: string
  source: 'tasks' | 'namaz' | 'money' | 'health' | 'cross'
  timestamp: number
  read: boolean
  dismissed: boolean
}

export interface FocusSuggestion {
  timeSlot: string // e.g., "06:00–07:00"
  label: string
  reason: string
  score: number // 0–100 confidence
}

export interface DailyBrief {
  date: string
  scores: WellnessScores
  topInsight: AIInsight | null
  focusSuggestion: FocusSuggestion | null
  taskCount: number
  prayerStatus: string
  spendingPulse: string
  quote: string
}

export interface Pattern {
  id: string
  type: 'correlation' | 'trend' | 'anomaly'
  title: string
  description: string
  strength: number // 0–1 confidence
  sourceA: string
  sourceB: string
  actionable: boolean
}

export interface AIState {
  scores: WellnessScores | null
  insights: AIInsight[]
  dailyBrief: DailyBrief | null
  patterns: Pattern[]
  lastComputed: number | null
  isComputing: boolean
}