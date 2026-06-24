'use client'

import { motion } from 'framer-motion'
import { Sparkles, Brain, Heart, Wallet, Moon } from 'lucide-react'
import type { WellnessScores } from '@/lib/ai'

interface AIWellnessScoreProps {
  scores: WellnessScores
  overallScore: number
}

const SCORE_RINGS = [
  { key: 'islamic', label: 'Iman', icon: Moon, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { key: 'productivity', label: 'Focus', icon: Brain, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  { key: 'financial', label: 'Wealth', icon: Wallet, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { key: 'health', label: 'Health', icon: Heart, color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
] as const

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#6366f1'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function ScoreRing({ value, label, icon: Icon, color, bg }: {
  value: number
  label: string
  icon: any
  color: string
  bg: string
}) {
  const circumference = 2 * Math.PI * 36
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke="rgba(var(--border),0.15)"
            strokeWidth="4"
          />
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: bg }}
        >
          <Icon size={20} color={color} />
        </div>
      </div>
      <span className="text-[11px] font-semibold text-[var(--hm-muted)]">{label}</span>
      <span className="text-lg font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

export default function AIWellnessScore({ scores, overallScore }: AIWellnessScoreProps) {
  const overallColor = getScoreColor(overallScore)
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (overallScore / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="hm-glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-semibold text-sm text-[var(--hm-text)]">SelfSync Score</span>
        </div>
        <motion.div
          key={overallScore}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            background: `${overallColor}18`,
            color: overallColor,
          }}
        >
          {overallScore >= 80 ? '🌟 Excellent' : overallScore >= 60 ? '👏 Great' : overallScore >= 40 ? '💪 Building' : '🌱 Starting'}
        </motion.div>
      </div>

      {/* Overall Ring + Score Rings */}
      <div className="flex items-center gap-6">
        {/* Overall ring */}
        <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="rgba(var(--border),0.1)"
              strokeWidth="6"
            />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={overallColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 6px ${overallColor}40)`,
              }}
            />
          </svg>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold" style={{ color: overallColor }}>
              {overallScore}
            </span>
            <span className="text-[10px] text-[var(--hm-muted)] font-medium">OVERALL</span>
          </div>
        </div>

        {/* Score rings */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          {SCORE_RINGS.map((ring) => (
            <ScoreRing
              key={ring.key}
              value={scores[ring.key as keyof WellnessScores]}
              label={ring.label}
              icon={ring.icon}
              color={ring.color}
              bg={ring.bg}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}