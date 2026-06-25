'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTaskStore } from '@/lib/store/taskStore'
import { useRouter } from 'next/navigation'
import ProgressRing from './ProgressRing'
import type { Task } from '@/app/(tabs)/tasks/types'

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#6366f1',
  low: '#6b7280',
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}

function isTask(value: unknown): value is Task {
  return isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string'
}

function asArray<T>(value: unknown, guard: (item: unknown) => item is T): T[] {
  return Array.isArray(value) ? value.filter(guard) : []
}

function safeDateMs(value: unknown): number {
  if (typeof value !== 'string') return Number.POSITIVE_INFINITY
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY
}

function getTodayTasks(tasks: Task[]): Task[] {
  const today = new Date().toISOString().split('T')[0]
  return tasks.filter(
    (t) =>
      t.status !== 'archived' &&
      (t.dueDate === today || t.status === 'today' || (typeof t.createdAt === 'string' && t.createdAt.startsWith(today)))
  )
}

function getNextPriorityTask(tasks: Task[]): Task | null {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  return tasks
    .filter((t) => !t.completed && t.status !== 'archived')
    .sort((a, b) => {
      const pDiff = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
      if (pDiff !== 0) return pDiff
      if (a.dueDate && b.dueDate) return safeDateMs(a.dueDate) - safeDateMs(b.dueDate)
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return 0
    })[0] ?? null
}

export default function TodayFocusCard() {
  const router = useRouter()
  const tasks = useTaskStore((s) => asArray(s.tasks, isTask))
  const focusedTask = useTaskStore((s) => s.focusedTask)

  const stats = useMemo(() => {
    const todayTasks = getTodayTasks(tasks)
    const total = todayTasks.length
    const completed = todayTasks.filter((t) => t.completed).length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    const nextTask = getNextPriorityTask(tasks)
    const totalActive = tasks.filter((t) => !t.completed && t.status !== 'archived').length
    const overdueCount = tasks.filter(
      (t) => !t.completed && t.dueDate && safeDateMs(t.dueDate) < Date.now() && t.status !== 'archived'
    ).length
    return { total, completed, progress, nextTask, totalActive, overdueCount }
  }, [tasks, focusedTask])

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => router.push('/tasks')}
      className="hm-glass-card w-full text-left cursor-pointer"
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <span className="card-title">Today's Focus</span>
        </div>
        {stats.overdueCount > 0 && (
          <div className="overdue-badge">
            {stats.overdueCount} overdue
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex items-center gap-4">
        {/* Progress Ring */}
        <ProgressRing
          progress={stats.progress}
          size={80}
          strokeWidth={6}
          color={stats.progress === 100 ? '#10b981' : '#6366f1'}
        >
          <div className="text-center">
            <div className="ring-value">{stats.completed}</div>
            <div className="ring-label">done</div>
          </div>
        </ProgressRing>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <div className="today-stats-row">
            <span className="today-stat-value">{stats.total}</span>
            <span className="today-stat-label">tasks today</span>
          </div>
          <div className="today-stats-row">
            <span className="today-stat-value">{stats.totalActive}</span>
            <span className="today-stat-label">total active</span>
          </div>
        </div>
      </div>

      {/* Next Task */}
      {stats.nextTask && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="next-task-card"
        >
          <div className="next-task-header">
            <span className="next-task-label">Next Priority</span>
            <span
              className="priority-badge"
              style={{
                backgroundColor: PRIORITY_COLORS[stats.nextTask.priority] + '20',
                color: PRIORITY_COLORS[stats.nextTask.priority],
                border: `1px solid ${PRIORITY_COLORS[stats.nextTask.priority]}40`,
              }}
            >
              {PRIORITY_LABELS[stats.nextTask.priority] || stats.nextTask.priority}
            </span>
          </div>
          <div className="next-task-title">{stats.nextTask.title}</div>
          {stats.nextTask.dueDate && (
            <div className="next-task-due">
              Due {new Date(safeDateMs(stats.nextTask.dueDate)).toLocaleDateString('en-BD', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!stats.nextTask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="empty-task-state"
        >
          <span>🎉</span>
          <span>All clear! No pending tasks.</span>
        </motion.div>
      )}
    </motion.button>
  )
}
