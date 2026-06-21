'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { StickyNote, Heart, TrendingUp, Clock } from 'lucide-react'
import { useNotesStore } from '@/features/notes/store/notesStore'
import { useHealthStore } from '@/features/health/store/healthStore'
import { HomeSubTab } from './HomeTabs'

interface DashboardViewProps {
  onNavigate: (tab: HomeSubTab) => void
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const notes = useNotesStore((s) => s.notes)
  const healthHistory = useHealthStore((s) => s.history)

  const stats = useMemo(() => ({
    totalNotes: notes.length,
    pinnedNotes: notes.filter((n) => n.pinned).length,
    recentNotes: notes.filter((n) => Date.now() - n.createdAt < 86400000 * 7).length,
    bmiRecords: healthHistory.length,
    latestBMI: healthHistory[0] ?? null,
  }), [notes, healthHistory])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }, [])

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
    <div className="space-y-5">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="hm-greeting">{greeting} 👋</h1>
        <p className="hm-greeting-sub">Here's your day at a glance</p>
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h2 className="text-sm font-semibold text-[var(--hm-muted)] mb-3 uppercase tracking-wider">
          Quick Actions
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.06 }}
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

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="hm-card">
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

        <div className="hm-card">
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
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="text-sm font-semibold text-[var(--hm-muted)] mb-3 uppercase tracking-wider">
          Recent Activity
        </h2>
        <div className="hm-card space-y-3">
          {notes.slice(0, 3).map((note, i) => (
            <div key={note.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--hm-soft)] flex items-center justify-center text-sm">
                {note.type === 'text' ? '📄' : note.type === 'link' ? '🔗' : note.type === 'password' ? '🔒' : '🖼️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--hm-text)] truncate">
                  {note.title}
                </div>
                <div className="text-xs text-[var(--hm-muted)]">
                  {new Date(note.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="text-sm text-[var(--hm-muted)] text-center py-4">
              <Clock size={20} className="mx-auto mb-2 opacity-40" />
              No recent activity. Start by creating a note!
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}