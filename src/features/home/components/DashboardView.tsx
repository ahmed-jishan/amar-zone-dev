'use client'

import { useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { StickyNote, Heart, TrendingUp, Clock, Sparkles, RefreshCw } from 'lucide-react'
import { useNotesStore } from '@/features/notes/store/notesStore'
import { useHealthStore } from '@/features/health/store/healthStore'
import { useTaskStore } from '@/lib/store/taskStore'
import { useAI } from '@/lib/ai'
import SafeRender from '@/components/shared/SafeRender'
import type { Note } from '@/features/notes/types'
import type { BMIRecord } from '@/features/health/types'
import type { Task } from '@/app/(tabs)/tasks/types'
import { HomeSubTab } from './HomeTabs'
import LiveTimeHeader from './LiveTimeHeader'
import NamazPulseCard from './NamazPulseCard'
import TodayFocusCard from './TodayFocusCard'
import MoneyGlanceCard from './MoneyGlanceCard'
import AIWellnessScore from './AIWellnessScore'
import AIInsightsList from './AIInsightsList'
import AIFocusCard from './AIFocusCard'

interface DashboardViewProps {
  onNavigate: (tab: HomeSubTab) => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}

function isNote(value: unknown): value is Note {
  return isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string'
}

function isBMIRecord(value: unknown): value is BMIRecord {
  return isRecord(value) && typeof value.id === 'string' && typeof value.bmi === 'number'
}

function isTask(value: unknown): value is Task {
  return isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string'
}

function asArray<T>(value: unknown, guard: (item: unknown) => item is T): T[] {
  return Array.isArray(value) ? value.filter(guard) : []
}

function safeTimestamp(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return Date.now()
}

function safeIso(value: unknown): string {
  return new Date(safeTimestamp(value)).toISOString()
}

function safeLocaleDate(value: unknown): string {
  return new Date(safeTimestamp(value)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

const ITEM = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const notes = useNotesStore((s) => asArray(s.notes, isNote))
  const healthHistory = useHealthStore((s) => asArray(s.history, isBMIRecord))
  const tasks = useTaskStore((s) => asArray(s.tasks, isTask))

  const router = useRouter()

  const {
    scores,
    insights,
    isComputing,
    unreadCount,
    focusSuggestion,
    overallScore,
    dismissInsight,
    markInsightRead,
    refresh,
  } = useAI()

  // Handle insight action routing — maps insight routes to tab navigation
  const handleInsightAction = useCallback((route: string) => {
    // Extract the base route (strip query params)
    const baseRoute = route.split('?')[0]
    // Map routes to tab navigation:
    // Tasks tab
    if (baseRoute === '/tasks') {
      router.push('/tasks')
      return
    }
    // Money tab
    if (baseRoute === '/money') {
      router.push('/money')
      return
    }
    // Namaz tab
    if (baseRoute === '/namaz') {
      router.push('/namaz')
      return
    }
    // Home sub-tabs (health, notes)
    if (baseRoute === '/home') {
      onNavigate('health')
      return
    }
    // Fallback: just navigate to the route directly
    router.push(baseRoute)
  }, [router, onNavigate])

  const stats = useMemo(() => ({
    totalNotes: notes.length,
    pinnedNotes: notes.filter((n) => n.pinned).length,
    recentNotes: notes.filter((n) => Date.now() - safeTimestamp(n.createdAt) < 86400000 * 7).length,
    bmiRecords: healthHistory.length,
    latestBMI: healthHistory[0] ?? null,
    tasksCompletedToday: tasks.filter((t) => {
      const today = new Date().toISOString().split('T')[0]
      return t.completedDates?.includes(today)
    }).length,
  }), [notes, healthHistory, tasks])

  const recentActivity = useMemo(() => {
    const items: { id: string; icon: string; title: string; date: string; type: string }[] = []

    // Recent notes
    notes.slice(0, 2).forEach((note) => {
      items.push({
        id: `note-${note.id}`,
        icon: note.type === 'text' ? '📄' : note.type === 'link' ? '🔗' : '🔒',
        title: note.title,
        date: safeIso(note.createdAt),
        type: 'note',
      })
    })

    // Recent completed tasks
    tasks
      .filter((t) => t.completed)
      .sort((a, b) => safeTimestamp(b.updatedAt) - safeTimestamp(a.updatedAt))
      .slice(0, 2)
      .forEach((task) => {
        items.push({
          id: `task-${task.id}`,
          icon: '✅',
          title: task.title,
          date: safeIso(task.updatedAt),
          type: 'task',
        })
      })

    return items.sort((a, b) => safeTimestamp(b.date) - safeTimestamp(a.date)).slice(0, 4)
  }, [notes, tasks])

  const quickActions = [
    {
      icon: '📝',
      label: 'New Note',
      gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
      onClick: () => onNavigate('notes'),
    },
    {
      icon: '❤️',
      label: 'Check BMI',
      gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
      onClick: () => onNavigate('health'),
    },
    {
      icon: '📊',
      label: 'All Notes',
      gradient: 'linear-gradient(135deg, #10b981, #34d399)',
      onClick: () => onNavigate('notes'),
    },
    {
      icon: '🏥',
      label: 'Health',
      gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      onClick: () => onNavigate('health'),
    },
  ]

  return (
    <motion.div className="space-y-4" variants={CONTAINER} initial="hidden" animate="show">
      {/* Live Time Header — animated clock + date */}
      <motion.div variants={ITEM}>
        <SafeRender name="LiveTimeHeader">
          <LiveTimeHeader />
        </SafeRender>
      </motion.div>

      {/* Premium Cards Grid */}
      <motion.div variants={ITEM} className="space-y-3.5">
        <SafeRender name="NamazPulseCard">
          <NamazPulseCard />
        </SafeRender>
        <SafeRender name="TodayFocusCard">
          <TodayFocusCard />
        </SafeRender>
        <SafeRender name="MoneyGlanceCard">
          <MoneyGlanceCard />
        </SafeRender>
      </motion.div>

      {/* ── AI SECTION ───────────────────────────────────────────── */}
      {/* Wellness Score (only show when scores are computed) */}
      {scores && overallScore !== null && (
        <motion.div variants={ITEM}>
          <SafeRender name="AIWellnessScore">
            <AIWellnessScore scores={scores} overallScore={overallScore} />
          </SafeRender>
        </motion.div>
      )}

      {/* Focus Suggestion */}
      {focusSuggestion && (
        <motion.div variants={ITEM}>
          <SafeRender name="AIFocusCard">
            <AIFocusCard suggestion={focusSuggestion} overallScore={overallScore} />
          </SafeRender>
        </motion.div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <motion.div variants={ITEM}>
          <SafeRender name="AIInsightsList">
            <AIInsightsList
              insights={insights}
              onDismiss={dismissInsight}
              onMarkRead={markInsightRead}
              unreadCount={unreadCount}
            />
          </SafeRender>
        </motion.div>
      )}

      {/* Refresh AI Button (shown when computing or as a subtle refresh) */}
      <motion.div variants={ITEM} className="flex justify-center">
        <button
          onClick={refresh}
          disabled={isComputing}
          className="flex items-center gap-1.5 text-[10px] text-[var(--hm-muted)] hover:text-[var(--hm-text)] 
                     transition-colors px-3 py-1.5 rounded-full border border-[var(--hm-border)] 
                     hover:bg-[var(--hm-soft)] disabled:opacity-50"
        >
          <RefreshCw size={12} className={isComputing ? 'animate-spin' : ''} />
          {isComputing ? 'Analyzing...' : 'Refresh AI'}
        </button>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={ITEM}>
        <h2 className="section-label">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={action.onClick}
              className="hm-action-btn"
            >
              <div
                className="icon-wrapper"
                style={{ background: action.gradient, color: '#fff' }}
              >
                {action.icon}
              </div>
              <span className="label">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={ITEM}>
        <h2 className="section-label">Overview</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="hm-glass-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-[var(--hm-accent-soft)] flex items-center justify-center">
                <StickyNote size={16} className="text-[var(--hm-accent)]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--hm-text)]">{stats.totalNotes}</div>
            <div className="text-xs text-[var(--hm-muted)] mt-1">
              Total Notes {stats.pinnedNotes > 0 && `· ${stats.pinnedNotes} pinned`}
            </div>
          </div>

          <div className="hm-glass-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-[var(--hm-accent-soft)] flex items-center justify-center">
                <Heart size={16} className="text-[var(--hm-accent)]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--hm-text)]">{stats.bmiRecords}</div>
            <div className="text-xs text-[var(--hm-muted)] mt-1">
              BMI Records
              {stats.latestBMI && ` · Last: ${stats.latestBMI.bmi}`}
            </div>
          </div>

          <div className="hm-glass-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-[var(--hm-accent-soft)] flex items-center justify-center">
                <TrendingUp size={16} className="text-[var(--hm-accent)]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--hm-text)]">{stats.tasksCompletedToday}</div>
            <div className="text-xs text-[var(--hm-muted)] mt-1">Tasks done today</div>
          </div>

          <div className="hm-glass-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-[var(--hm-accent-soft)] flex items-center justify-center">
                <Clock size={16} className="text-[var(--hm-accent)]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--hm-text)]">{stats.recentNotes}</div>
            <div className="text-xs text-[var(--hm-muted)] mt-1">Notes this week</div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={ITEM}>
        <h2 className="section-label">Recent Activity</h2>
        <div className="hm-glass-card space-y-3">
          {recentActivity.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--hm-soft)] flex items-center justify-center text-sm">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--hm-text)] truncate">
                  {item.title}
                </div>
                <div className="text-xs text-[var(--hm-muted)]">
                  {item.type === 'note' ? '📝 Note' : '✅ Task'} · {safeLocaleDate(item.date)}
                </div>
              </div>
            </motion.div>
          ))}
          {recentActivity.length === 0 && (
            <div className="text-sm text-[var(--hm-muted)] text-center py-4">
              <Clock size={20} className="mx-auto mb-2 opacity-40" />
              No recent activity. Start by creating a note or task!
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
