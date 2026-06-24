// ─── SelfSync AI — Zustand Store ──────────────────────────────────────────
// Persists insights, patterns, last computed timestamp to localStorage.
// Computes the AI snapshot, scores, insights in a throttled manner.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AIState, AIInsight, WellnessScores, DailyBrief, Pattern, AIContextSnapshot } from './types'
import {
  computeSnapshot,
  computeScores,
  generateInsights,
  generateDailyBrief,
  detectPatterns,
} from './orchestrator'
import type { AggregatorInput } from './orchestrator'
import { generateId } from '@/lib/utils/helpers'

const STORAGE_KEY = 'selfsync-ai-v1'

// Throttle: recompute max once every 5 minutes
const RECOMPUTE_INTERVAL_MS = 5 * 60 * 1000

interface AIStore extends AIState {
  /** Compute a fresh AI analysis from all module data */
  recompute: (input: AggregatorInput) => void
  /** Dismiss an insight permanently */
  dismissInsight: (id: string) => void
  /** Mark an insight as read */
  markInsightRead: (id: string) => void
  /** Clear all insights */
  clearInsights: () => void
  /** Check if a recompute is needed (e.g., on app open) */
  maybeRecompute: (input: AggregatorInput) => void
  /** Get the latest snapshot (computed during last recompute) */
  getSnapshot: () => AIContextSnapshot | null
  /** Get a specific score breakdown */
  getScores: () => WellnessScores | null
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      scores: null,
      insights: [],
      dailyBrief: null,
      patterns: [],
      lastComputed: null,
      isComputing: false,

      recompute: (input: AggregatorInput) => {
        set({ isComputing: true })

        // Use setTimeout to avoid blocking the UI thread
        setTimeout(() => {
          try {
            const snapshot = computeSnapshot(input)
            const scores = computeScores(snapshot)
            const previousInsights = get().insights
            const insights = generateInsights(snapshot, previousInsights)
            const dailyBrief = generateDailyBrief(snapshot, scores, insights)
            const patterns = detectPatterns(snapshot)

            set({
              scores,
              insights,
              dailyBrief,
              patterns,
              lastComputed: Date.now(),
              isComputing: false,
            })
          } catch (error) {
            console.error('[SelfSync AI] Recompute failed:', error)
            set({ isComputing: false })
          }
        }, 50) // small delay to let UI breathe
      },

      maybeRecompute: (input: AggregatorInput) => {
        const state = get()
        const now = Date.now()
        if (
          !state.lastComputed ||
          now - state.lastComputed > RECOMPUTE_INTERVAL_MS
        ) {
          get().recompute(input)
        }
      },

      dismissInsight: (id: string) => {
        set((state) => ({
          insights: state.insights.filter((i) => i.id !== id),
        }))
      },

      markInsightRead: (id: string) => {
        set((state) => ({
          insights: state.insights.map((i) =>
            i.id === id ? { ...i, read: true } : i
          ),
        }))
      },

      clearInsights: () => {
        set({ insights: [] })
      },

      getSnapshot: () => {
        // Snapshot is transient — computed on each recompute
        return null
      },

      getScores: () => {
        return get().scores
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        scores: state.scores,
        insights: state.insights,
        dailyBrief: state.dailyBrief,
        patterns: state.patterns,
        lastComputed: state.lastComputed,
      }),
    }
  )
)