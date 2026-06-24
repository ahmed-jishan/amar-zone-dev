'use client'

import { motion } from 'framer-motion'
import { Target, Clock, ArrowRight } from 'lucide-react'
import type { FocusSuggestion } from '@/lib/ai'

interface AIFocusCardProps {
  suggestion: FocusSuggestion
  overallScore: number | null
}

export default function AIFocusCard({ suggestion, overallScore }: AIFocusCardProps) {
  const confidenceColor = suggestion.score >= 85 ? '#10b981' : suggestion.score >= 70 ? '#6366f1' : '#f59e0b'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="hm-glass-card overflow-hidden relative"
    >
      {/* Background gradient accent */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${confidenceColor}, transparent)`,
          transform: 'translate(30%, -30%)',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${confidenceColor}18` }}
          >
            <Target size={16} color={confidenceColor} />
          </div>
          <span className="font-semibold text-sm text-[var(--hm-text)]">Focus Suggestion</span>
        </div>
        <div
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{
            background: `${confidenceColor}18`,
            color: confidenceColor,
          }}
        >
          {suggestion.score}% match
        </div>
      </div>

      {/* Time slot */}
      <div className="flex items-center gap-2 mb-2">
        <Clock size={14} className="text-[var(--hm-muted)]" />
        <span className="text-xs font-medium text-[var(--hm-text)]">{suggestion.timeSlot}</span>
      </div>

      {/* Reason */}
      <p className="text-xs text-[var(--hm-muted)] leading-relaxed">
        {suggestion.reason}
      </p>

      {/* CTA */}
      <button
        className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-colors"
        style={{
          background: `${confidenceColor}12`,
          color: confidenceColor,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${confidenceColor}20`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${confidenceColor}12`
        }}
      >
        Start Focus Session
        <ArrowRight size={14} />
      </button>
    </motion.div>
  )
}