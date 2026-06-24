// ─── SelfSync AI — Public API Hook ────────────────────────────────────────
// This hook connects all Zustand stores to the AI engine.
// Components call useAI() to get scores, insights, daily brief, etc.

'use client'

import { useEffect, useCallback, useMemo } from 'react'
import { useAIStore } from './store'
import { useTaskStore } from '@/lib/store/taskStore'
import { useNamazStore } from '@/features/namaz/store/namazStore'
import { useQuranStore } from '@/features/namaz/store/quranStore'
import { useMoneyStore } from '@/features/money/store/moneyStore'
import { useHealthStore } from '@/features/health/store/healthStore'
import { useNotesStore } from '@/features/notes/store/notesStore'
import type { AggregatorInput } from './orchestrator'
import type { WellnessScores, AIInsight, DailyBrief, Pattern, FocusSuggestion } from './types'

export interface AIApi {
  /** Wellness scores (0–100) for each dimension */
  scores: WellnessScores | null
  /** All active insights */
  insights: AIInsight[]
  /** Today's daily brief */
  dailyBrief: DailyBrief | null
  /** Detected cross-module patterns */
  patterns: Pattern[]
  /** Whether AI is currently computing */
  isComputing: boolean
  /** When AI was last computed */
  lastComputed: number | null
  /** Force a fresh recompute now */
  refresh: () => void
  /** Dismiss an insight */
  dismissInsight: (id: string) => void
  /** Mark insight as read */
  markInsightRead: (id: string) => void
  /** Get unread insight count */
  unreadCount: number
  /** Get top focus suggestion */
  focusSuggestion: FocusSuggestion | null
  /** Get the overall wellness score (0–100) */
  overallScore: number | null
}

function gatherInput(): AggregatorInput {
  // Tasks
  const taskState = useTaskStore.getState()
  const tasks = taskState.tasks

  // Namaz
  const namazState = useNamazStore.getState()
  const namazRecords = namazState.records
  const namazSettings = namazState.settings

  // Quran
  const quranState = useQuranStore.getState()
  const quranBookmarks = quranState.bookmarks
  const quranLastRead = quranState.lastRead

  // Money
  const moneyState = useMoneyStore.getState()
  const transactions = moneyState.transactions
  const loans = moneyState.loans
  const budgets = moneyState.budgets
  const savingsGoals = moneyState.savingsGoals
  const wallets = moneyState.wallets
  const subscriptions = moneyState.subscriptions
  const assets = moneyState.assets
  const netWorthHistory = moneyState.netWorthHistory

  // Health
  const healthState = useHealthStore.getState()
  const healthHistory = healthState.history

  // Notes
  const notesState = useNotesStore.getState()
  const notes = notesState.notes

  return {
    tasks,
    namazRecords,
    namazSettings,
    transactions,
    loans,
    budgets,
    savingsGoals,
    wallets,
    subscriptions,
    assets,
    netWorthHistory,
    healthHistory,
    notes,
    quranBookmarks,
    quranLastRead,
  }
}

export function useAI(): AIApi {
  const store = useAIStore()

  const refresh = useCallback(() => {
    const input = gatherInput()
    store.recompute(input)
  }, [store.recompute])

  // Auto-compute on mount if stale
  useEffect(() => {
    const input = gatherInput()
    store.maybeRecompute(input)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const unreadCount = useMemo(
    () => store.insights.filter((i) => !i.read).length,
    [store.insights]
  )

  const focusSuggestion = useMemo(
    () => store.dailyBrief?.focusSuggestion ?? null,
    [store.dailyBrief]
  )

  const overallScore = useMemo(
    () => store.scores?.overall ?? null,
    [store.scores]
  )

  return {
    scores: store.scores,
    insights: store.insights,
    dailyBrief: store.dailyBrief,
    patterns: store.patterns,
    isComputing: store.isComputing,
    lastComputed: store.lastComputed,
    refresh,
    dismissInsight: store.dismissInsight,
    markInsightRead: store.markInsightRead,
    unreadCount,
    focusSuggestion,
    overallScore,
  }
}