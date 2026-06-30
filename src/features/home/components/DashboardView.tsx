'use client'

import { useMemo, useCallback, memo } from 'react'
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
import QuickNoteWidget from '@/features/notes/components/QuickNoteWidget'

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

// Optimized: Use CSS transitions instead of Framer Motion for stagger animations
// Only use motion.div for elements that truly need spring physics
const ITEM_TRANSITION = 'opacity 0.4s ease-out, transform 0.4s ease-out'

// Memoized card components to prevent re-renders
const StatsCard = memo(function StatsCard({
  icon: Icon,
  value,
  label,
  sublabel,
}: {
  icon: React.ElementType
  value: string | number
  label: string
  sublabel?: string
}) {
  return (
    <div className="hm-glass-card" style={{ opacity: 1, transform: 'translateY(0)', transition: ITEM_TRANSITION }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-[var(--hm-accent-soft)] flex items-center justify-center">
          <Icon size={16} className="text-[var(--hm-accent)]" />
        </div>
      </div>
      <div className="text-2xl font-bold text-[var(--hm-text)]">{value}</div>
      <div className="text-xs text-[var(--hm-muted)] mt-1">
        {label}
        {sublabel && <span> · {sublabel}</span>}
      </div>
    </div>
  )
})

const QuickActionBtn = memo(function QuickActionBtn({
  icon,
  label,
  gradient,
  onClick,
}: {
  icon: string
  label: string
  gradient: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="hm-action-btn"
      style={{ willChange: 'transform' }}
    >
      <div
        className="icon-wrapper"
        style={{ background: gradient, color: '#fff' }}
      >
        {icon}
      </div>
      <span className="label">{label}</span>
    </button>
  )
})

const ActivityItem = memo(function ActivityItem({
  icon,
  title,
  type,
  date,
  delay,
}: {
  icon: string
  title: string
  type: string
  date: string
  delay: number
}) {
  return (
    <div
      className="flex items-center gap-3"
      style={{
        opacity: 1,
        transform: 'translateX(0)',
        transition: `opacity 0.3s ease-out ${delay}s, transform 0.3s ease-out ${delay}s`,
      }}
    >
      <div className="w-8 h-8 rounded-lg bg-[var(--hm-soft)] flex items-center justify-center text-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--hm-text)] truncate">
          {title}
        </div>
        <div className="text-xs text-[var(--hm-muted)]">
          {type === 'note' ? '📝 Note' : '✅ Task'} · {safeLocaleDate(date)}
        </div>
      </div>
    </div>
  )
})

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  // Optimized: Use individual selectors instead of whole store subscriptions
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
    const baseRoute = route.split('?')[0]
    if (baseRoute === '/tasks') { router.push('/tasks'); return }
    if (baseRoute === '/money') { router.push('/money'); return }
    if (baseRoute === '/namaz') { router.push('/namaz'); return }
    if (baseRoute === '/home') { onNavigate('health'); return }
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

    notes.slice(0, 2).forEach((note) => {
      items.push({
        id: `note-${note.id}`,
        icon: note.type === 'text' ? '📄' : note.type === 'link' ? '🔗' : '🔒',
        title: note.title,
        date: safeIso(note.createdAt),
        type: 'note',
      })
    })

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

  const quickActions = useMemo(() => [
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
  ], [onNavigate])

  return (
    <div className="space-y-4">
      {/* Live Time Header — animated clock + date */}
      <SafeRender name="LiveTimeHeader">
        <LiveTimeHeader />
      </SafeRender>

      {/* Premium Cards Grid */}
      <div className="space-y-3.5">
        <SafeRender name="NamazPulseCard">
          <NamazPulseCard />
        </SafeRender>
        <SafeRender name="TodayFocusCard">
          <TodayFocusCard />
        </SafeRender>
        <SafeRender name="MoneyGlanceCard">
          <MoneyGlanceCard />
        </SafeRender>
      </div>

      {/* ── AI SECTION ───────────────────────────────────────────── */}
      {scores && overallScore !== null && (
        <SafeRender name="AIWellnessScore">
          <AIWellnessScore scores={scores} overallScore={overallScore} />
        </SafeRender>
      )}

      {focusSuggestion && (
        <SafeRender name="AIFocusCard">
          <AIFocusCard suggestion={focusSuggestion} overallScore={overallScore} />
        </SafeRender>
      )}

      {insights.length > 0 && (
        <SafeRender name="AIInsightsList">
          <AIInsightsList
            insights={insights}
            onDismiss={dismissInsight}
            onMarkRead={markInsightRead}
            unreadCount={unreadCount}
          />
        </SafeRender>
      )}

      {/* Refresh AI Button */}
      <div className="flex justify-center">
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
      </div>

      {/* Quick Note Widget */}
      <SafeRender name="QuickNoteWidget">
        <QuickNoteWidget />
      </SafeRender>

      {/* Quick Actions */}
      <div>
        <h2 className="section-label">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <QuickActionBtn key={action.label} {...action} />
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <h2 className="section-label">Overview</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            icon={StickyNote}
            value={stats.totalNotes}
            label="Total Notes"
            sublabel={stats.pinnedNotes > 0 ? `${stats.pinnedNotes} pinned` : undefined}
          />
          <StatsCard
            icon={Heart}
            value={stats.bmiRecords}
            label="BMI Records"
            sublabel={stats.latestBMI ? `Last: ${stats.latestBMI.bmi}` : undefined}
          />
          <StatsCard
            icon={TrendingUp}
            value={stats.tasksCompletedToday}
            label="Tasks done today"
          />
          <StatsCard
            icon={Clock}
            value={stats.recentNotes}
            label="Notes this week"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="section-label">Recent Activity</h2>
        <div className="hm-glass-card space-y-3">
          {recentActivity.map((item, i) => (
            <ActivityItem key={item.id} {...item} delay={0.4 + i * 0.05} />
          ))}
          {recentActivity.length === 0 && (
            <div className="text-sm text-[var(--hm-muted)] text-center py-4">
              <Clock size={20} className="mx-auto mb-2 opacity-40" />
              No recent activity. Start by creating a note or task!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}