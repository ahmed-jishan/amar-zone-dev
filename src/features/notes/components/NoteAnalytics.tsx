'use client'

import { useMemo } from 'react'
import { useNotesStore } from '../store/notesStore'
import { NOTE_CATEGORY_COLORS, NOTE_CATEGORIES } from '../types'
import { TrendingUp, BookOpen, Flame, Calendar, Tag, Clock, Archive, Trash2 } from 'lucide-react'

function StatCard({ icon: Icon, value, label, color }: { icon: any; value: string | number; label: string; color?: string }) {
  return (
    <div className="hm-glass-card flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color || 'var(--hm-accent)'}14`, color: color || 'var(--hm-accent)' }}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xl font-bold text-[var(--hm-text)]">{value}</div>
        <div className="text-xs text-[var(--hm-muted)]">{label}</div>
      </div>
    </div>
  )
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="hm-mini-bar-track">
      <div className="hm-mini-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function NoteAnalytics() {
  const analytics = useNotesStore((s) => s.analytics)

  const maxCategory = useMemo(() => Math.max(...Object.values(analytics.categoryDistribution), 1), [analytics.categoryDistribution])
  const maxMonthly = useMemo(() => Math.max(...Object.values(analytics.monthlyCounts), 1), [analytics.monthlyCounts])
  const monthKeys = Object.keys(analytics.monthlyCounts)
  const monthLabels = monthKeys.map((k) => {
    const [y, m] = k.split('-')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[parseInt(m) - 1]
  })

  return (
    <div className="hm-analytics-root space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={BookOpen} value={analytics.totalNotes} label="Total Notes" color="#6366f1" />
        <StatCard icon={TrendingUp} value={analytics.totalWords.toLocaleString()} label="Words Written" color="#10b981" />
        <StatCard icon={Flame} value={`${analytics.writingStreak} days`} label="Current Streak" color="#f59e0b" />
        <StatCard icon={Clock} value={analytics.mostProductiveDay} label="Most Productive Day" color="#3b82f6" />
      </div>

      {/* Writing Streak */}
      <div className="hm-glass-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="card-title flex items-center gap-2">
            <Flame size={16} className="text-[var(--hm-amber)]" /> Writing Streak
          </h3>
          <span className="text-xs text-[var(--hm-muted)]">Best: {analytics.longestStreak} days</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-[var(--hm-soft)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--hm-amber)] to-[var(--hm-accent)]"
              style={{ width: `${Math.min(100, (analytics.writingStreak / Math.max(analytics.longestStreak, 1)) * 100)}%` }}
            />
          </div>
          <span className="text-sm font-bold text-[var(--hm-amber)]">{analytics.writingStreak}</span>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="hm-glass-card">
        <h3 className="card-title flex items-center gap-2 mb-3">
          <Tag size={16} className="text-[var(--hm-accent)]" /> Categories
        </h3>
        <div className="space-y-2">
          {NOTE_CATEGORIES.map((cat) => {
            const count = analytics.categoryDistribution[cat.value] || 0
            const color = NOTE_CATEGORY_COLORS[cat.value]
            return (
              <div key={cat.value} className="flex items-center gap-3">
                <span className="text-sm w-6">{cat.emoji}</span>
                <span className="text-xs font-medium text-[var(--hm-text-soft)] w-16 truncate">
                  {cat.label}
                </span>
                <div className="flex-1">
                  <MiniBar value={count} max={maxCategory} color={color} />
                </div>
                <span className="text-xs font-bold text-[var(--hm-text)] w-6 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Monthly Activity */}
      <div className="hm-glass-card">
        <h3 className="card-title flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-[var(--hm-accent)]" /> Monthly Notes
        </h3>
        <div className="flex items-end gap-2 h-24">
          {monthKeys.map((key, i) => {
            const count = analytics.monthlyCounts[key] || 0
            const height = maxMonthly > 0 ? (count / maxMonthly) * 100 : 0
            return (
              <div key={key} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-[var(--hm-text)]">{count}</span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${Math.max(4, height)}%`,
                    background: 'var(--hm-accent)',
                    opacity: 0.5 + (count / Math.max(maxMonthly, 1)) * 0.5,
                  }}
                />
                <span className="text-[9px] text-[var(--hm-muted)]">{monthLabels[i]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Tags */}
      {analytics.topTags.length > 0 && (
        <div className="hm-glass-card">
          <h3 className="card-title flex items-center gap-2 mb-3">
            <Tag size={16} className="text-[var(--hm-accent)]" /> Top Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {analytics.topTags.map(({ tag, count }) => (
              <span key={tag} className="hm-note-tag flex items-center gap-1">
                #{tag}
                <span className="text-[9px] opacity-60">({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Status Counts */}
      <div className="grid grid-cols-3 gap-3">
        <div className="hm-glass-card text-center py-3">
          <div className="flex items-center justify-center gap-1 text-[var(--hm-accent)] mb-1">
            <Archive size={14} />
          </div>
          <div className="text-lg font-bold text-[var(--hm-text)]">{analytics.archivedCount}</div>
          <div className="text-[10px] text-[var(--hm-muted)]">Archived</div>
        </div>
        <div className="hm-glass-card text-center py-3">
          <div className="flex items-center justify-center gap-1 text-[var(--hm-red)] mb-1">
            <Trash2 size={14} />
          </div>
          <div className="text-lg font-bold text-[var(--hm-text)]">{analytics.trashedCount}</div>
          <div className="text-[10px] text-[var(--hm-muted)]">Trashed</div>
        </div>
        <div className="hm-glass-card text-center py-3">
          <div className="flex items-center justify-center gap-1 text-[var(--hm-amber)] mb-1">
            <BookOpen size={14} />
          </div>
          <div className="text-lg font-bold text-[var(--hm-text)]">{analytics.notesThisWeek}</div>
          <div className="text-[10px] text-[var(--hm-muted)]">This Week</div>
        </div>
      </div>
    </div>
  )
}
