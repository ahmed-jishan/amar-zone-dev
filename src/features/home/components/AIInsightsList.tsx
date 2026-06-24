'use client'

import { motion } from 'framer-motion'
import { Lightbulb, AlertTriangle, Award, TrendingUp, Sparkles, X, ChevronRight } from 'lucide-react'
import type { AIInsight } from '@/lib/ai'

interface AIInsightsListProps {
  insights: AIInsight[]
  onDismiss: (id: string) => void
  onMarkRead: (id: string) => void
  onAction?: (route: string) => void
  unreadCount: number
}

const INSIGHT_STYLES: Record<string, { icon: any; bg: string; border: string; color: string }> = {
  achievement: {
    icon: Award,
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    color: '#10b981',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    color: '#ef4444',
  },
  tip: {
    icon: Lightbulb,
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.2)',
    color: '#6366f1',
  },
  pattern: {
    icon: TrendingUp,
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    color: '#f59e0b',
  },
  suggestion: {
    icon: Sparkles,
    bg: 'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.2)',
    color: '#a855f7',
  },
}

function InsightCard({ insight, onDismiss, onMarkRead, onAction }: {
  insight: AIInsight
  onDismiss: (id: string) => void
  onMarkRead: (id: string) => void
  onAction?: (route: string) => void
}) {
  const style = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.tip
  const Icon = style.icon

  const handleClick = () => {
    onMarkRead(insight.id)
    // If there's an action route and an onAction handler, navigate
    if (insight.actionRoute && onAction) {
      onAction(insight.actionRoute)
    }
  }

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (insight.actionRoute && onAction) {
      onAction(insight.actionRoute)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: 10, height: 0 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-xl p-3.5 border cursor-pointer"
      style={{
        background: style.bg,
        borderColor: style.border,
      }}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: style.bg }}
        >
          <Icon size={16} color={style.color} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: style.color }}
            >
              {insight.type === 'achievement' ? '🎉 Achievement' :
               insight.type === 'warning' ? '⚠️ Warning' :
               insight.type === 'tip' ? '💡 Tip' :
               insight.type === 'pattern' ? '📊 Pattern' : '✨ Suggestion'}
            </span>
            {!insight.read && (
              <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-pulse" />
            )}
          </div>
          <h4 className="text-sm font-semibold text-[var(--hm-text)] mt-0.5">
            {insight.title}
          </h4>
          <p className="text-xs text-[var(--hm-muted)] mt-1 leading-relaxed">
            {insight.description}
          </p>
          {insight.actionLabel && (
            <button
              onClick={handleActionClick}
              className="inline-flex items-center gap-1 mt-2 text-xs font-medium transition-all duration-200 hover:gap-1.5"
              style={{ color: style.color }}
            >
              {insight.actionLabel}
              <ChevronRight size={12} />
            </button>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDismiss(insight.id)
          }}
          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <X size={14} className="text-[var(--hm-muted)]" />
        </button>
      </div>
    </motion.div>
  )
}

export default function AIInsightsList({ insights, onDismiss, onMarkRead, onAction, unreadCount }: AIInsightsListProps) {
  if (insights.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hm-glass-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Lightbulb size={16} className="text-white" />
          </div>
          <span className="font-semibold text-sm text-[var(--hm-text)]">AI Insights</span>
          {unreadCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#6366f1] text-white font-medium">
              {unreadCount} new
            </span>
          )}
        </div>
        {insights.length > 3 && (
          <span className="text-xs text-[var(--hm-muted)]">
            {insights.length} total
          </span>
        )}
      </div>

      {/* Insights list */}
      <div className="space-y-2">
        {insights.slice(0, 5).map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onDismiss={onDismiss}
            onMarkRead={onMarkRead}
            onAction={onAction}
          />
        ))}
      </div>

      {insights.length > 5 && (
        <button className="w-full mt-2 text-xs text-[var(--hm-muted)] hover:text-[var(--hm-text)] transition-colors py-2 text-center">
          +{insights.length - 5} more insights
        </button>
      )}
    </motion.div>
  )
}