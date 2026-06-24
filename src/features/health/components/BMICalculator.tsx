'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, Ruler, Heart, Activity, RotateCcw, History, TrendingDown, TrendingUp } from 'lucide-react'
import { useHealthStore } from '../store/healthStore'
import { calculateBMI, getBMICategory, BMI_CATEGORIES, BMIRecord } from '../types'

function asArray<T>(value: T[] | unknown): T[] {
  return Array.isArray(value) ? value : []
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BMICalculator() {
  const {
    weightKg,
    heightCm,
    setWeight,
    setHeight,
    calculateAndSave,
    history,
    clearHistory,
  } = useHealthStore((s) => ({
    weightKg: s.weightKg,
    heightCm: s.heightCm,
    setWeight: s.setWeight,
    setHeight: s.setHeight,
    calculateAndSave: s.calculateAndSave,
    history: asArray<BMIRecord>(s.history),
    clearHistory: s.clearHistory,
  }))

  const [weightInput, setWeightInput] = useState(weightKg.toString())
  const [heightInput, setHeightInput] = useState(heightCm.toString())
  const [showHistory, setShowHistory] = useState(false)
  const [savedRecord, setSavedRecord] = useState<BMIRecord | null>(null)
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')

  // Convert for display
  const displayWeight = useMemo(() => {
    const val = parseFloat(weightInput) || 0
    return unitSystem === 'metric' ? val : Math.round(val * 2.20462 * 10) / 10
  }, [weightInput, unitSystem])
  const displayHeight = useMemo(() => {
    const val = parseFloat(heightInput) || 0
    return unitSystem === 'metric' ? val : Math.round(val * 0.393701 * 10) / 10
  }, [heightInput, unitSystem])

  const bmi = useMemo(() => calculateBMI(parseFloat(weightInput) || 0, parseFloat(heightInput) || 0), [weightInput, heightInput])
  const category = useMemo(() => getBMICategory(bmi), [bmi])
  const categoryInfo = useMemo(() => BMI_CATEGORIES[category], [category])

  const handleWeightChange = useCallback((value: string) => {
    setWeightInput(value)
    const num = parseFloat(value)
    if (!isNaN(num) && num > 0) {
      setWeight(num)
    }
  }, [setWeight])

  const handleHeightChange = useCallback((value: string) => {
    setHeightInput(value)
    const num = parseFloat(value)
    if (!isNaN(num) && num > 0) {
      setHeight(num)
    }
  }, [setHeight])

  const handleSave = useCallback(() => {
    const record = calculateAndSave()
    if (record) {
      setSavedRecord(record)
      setTimeout(() => setSavedRecord(null), 2500)
    }
  }, [calculateAndSave])

  const recentRecords = useMemo(() => history.slice(0, 5), [history])

  return (
    <div className="space-y-5">
      {/* Unit Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--hm-muted)] uppercase tracking-wider">
          BMI Calculator
        </h2>
        <div className="flex gap-1 bg-[var(--hm-soft)] rounded-lg p-0.5 border border-[var(--hm-border)]">
          <button
            onClick={() => setUnitSystem('metric')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              unitSystem === 'metric'
                ? 'bg-[var(--hm-surface)] text-[var(--hm-text)] shadow-sm'
                : 'text-[var(--hm-muted)]'
            }`}
          >
            Metric
          </button>
          <button
            onClick={() => setUnitSystem('imperial')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              unitSystem === 'imperial'
                ? 'bg-[var(--hm-surface)] text-[var(--hm-text)] shadow-sm'
                : 'text-[var(--hm-muted)]'
            }`}
          >
            Imperial
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="hm-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--hm-accent-soft)] flex items-center justify-center">
              <Scale size={14} className="text-[var(--hm-accent)]" />
            </div>
            <span className="text-xs font-semibold text-[var(--hm-muted)]">
              Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const val = Math.max(20, parseFloat(weightInput) - 1)
                handleWeightChange(val.toString())
              }}
              className="w-8 h-8 rounded-lg bg-[var(--hm-soft)] text-[var(--hm-muted)] hover:bg-[var(--hm-border)] transition-colors flex items-center justify-center text-lg font-medium"
            >
              −
            </button>
            <input
              value={weightInput}
              onChange={(e) => handleWeightChange(e.target.value)}
              type="number"
              min="20"
              max="350"
              className="flex-1 text-center bg-transparent text-xl font-bold text-[var(--hm-text)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => {
                const val = Math.min(350, parseFloat(weightInput) + 1)
                handleWeightChange(val.toString())
              }}
              className="w-8 h-8 rounded-lg bg-[var(--hm-soft)] text-[var(--hm-muted)] hover:bg-[var(--hm-border)] transition-colors flex items-center justify-center text-lg font-medium"
            >
              +
            </button>
          </div>
          <input
            type="range"
            min="20"
            max="350"
            step="0.1"
            value={parseFloat(weightInput) || 70}
            onChange={(e) => handleWeightChange(e.target.value)}
            className="hm-slider mt-3"
          />
        </div>

        <div className="hm-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--hm-accent-soft)] flex items-center justify-center">
              <Ruler size={14} className="text-[var(--hm-accent)]" />
            </div>
            <span className="text-xs font-semibold text-[var(--hm-muted)]">
              Height ({unitSystem === 'metric' ? 'cm' : 'in'})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const val = Math.max(50, parseFloat(heightInput) - 1)
                handleHeightChange(val.toString())
              }}
              className="w-8 h-8 rounded-lg bg-[var(--hm-soft)] text-[var(--hm-muted)] hover:bg-[var(--hm-border)] transition-colors flex items-center justify-center text-lg font-medium"
            >
              −
            </button>
            <input
              value={heightInput}
              onChange={(e) => handleHeightChange(e.target.value)}
              type="number"
              min="50"
              max="280"
              className="flex-1 text-center bg-transparent text-xl font-bold text-[var(--hm-text)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => {
                const val = Math.min(280, parseFloat(heightInput) + 1)
                handleHeightChange(val.toString())
              }}
              className="w-8 h-8 rounded-lg bg-[var(--hm-soft)] text-[var(--hm-muted)] hover:bg-[var(--hm-border)] transition-colors flex items-center justify-center text-lg font-medium"
            >
              +
            </button>
          </div>
          <input
            type="range"
            min="50"
            max="280"
            step="0.5"
            value={parseFloat(heightInput) || 175}
            onChange={(e) => handleHeightChange(e.target.value)}
            className="hm-slider mt-3"
          />
        </div>
      </div>

      {/* BMI Result Ring */}
      <motion.div
        className="hm-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="hm-bmi-ring" style={{ background: `${categoryInfo.color}15` }}>
          <div className="text-center">
            <motion.div
              key={bmi}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="bmi-value"
              style={{ color: categoryInfo.color }}
            >
              {bmi > 0 ? bmi : '—'}
            </motion.div>
            <div className="bmi-label">BMI</div>
          </div>
        </div>

        {/* Category Badge */}
        {bmi > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-3"
          >
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold"
              style={{
                background: `${categoryInfo.color}20`,
                color: categoryInfo.color,
              }}
            >
              {categoryInfo.icon} {categoryInfo.label} · {categoryInfo.range}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Professional Advice */}
      {bmi > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hm-card"
          style={{ borderLeft: `3px solid ${categoryInfo.color}` }}
        >
          <div className="flex items-start gap-3">
            <Heart size={18} style={{ color: categoryInfo.color }} className="mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-[var(--hm-text)] mb-1">
                {categoryInfo.adviceTitle}
              </h3>
              <ul className="space-y-1.5">
                {categoryInfo.advice.map((item, i) => (
                  <li key={i} className="text-xs text-[var(--hm-muted)] flex items-start gap-1.5">
                    <span style={{ color: categoryInfo.color }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>

              <details className="mt-3 group">
                <summary className="text-xs font-semibold text-[var(--hm-accent)] cursor-pointer hover:opacity-80 transition-opacity list-none flex items-center gap-1">
                  <Activity size={12} />
                  View Recommendations
                </summary>
                <div className="mt-2 space-y-1.5 pl-3">
                  {categoryInfo.recommendations.map((rec, i) => (
                    <div key={i} className="text-xs text-[var(--hm-muted)] flex items-start gap-1.5">
                      <TrendingUp size={10} className="mt-0.5 flex-shrink-0" style={{ color: categoryInfo.color }} />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </motion.div>
      )}

      {/* Save Button */}
      {bmi > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleSave}
          disabled={!!savedRecord}
          className="w-full py-3 rounded-2xl font-semibold text-sm transition-all"
          style={{
            background: categoryInfo.gradient,
            color: '#fff',
            opacity: savedRecord ? 0.7 : 1,
          }}
        >
          {savedRecord ? `✓ Saved — BMI ${savedRecord.bmi}` : 'Save to History'}
        </motion.button>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="hm-card">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <History size={14} className="text-[var(--hm-muted)]" />
              <span className="text-sm font-semibold text-[var(--hm-text)]">History</span>
              <span className="text-xs text-[var(--hm-muted)]">({history.length})</span>
            </div>
            <motion.div
              animate={{ rotate: showHistory ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <TrendingDown size={14} className="text-[var(--hm-muted)]" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2 pt-3 border-t border-[var(--hm-border)]">
                  {recentRecords.map((record) => {
                    const catInfo = BMI_CATEGORIES[record.category as keyof typeof BMI_CATEGORIES] ?? BMI_CATEGORIES.normal
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: catInfo.color }}
                          />
                          <span className="text-xs text-[var(--hm-muted)]">{formatDate(record.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--hm-text)]">
                            BMI {record.bmi}
                          </span>
                          <span className="text-[10px] text-[var(--hm-muted)]" style={{ color: catInfo.color }}>
                            {catInfo.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {history.length > 5 && (
                    <p className="text-xs text-center text-[var(--hm-muted)] pt-1">
                      +{history.length - 5} more records
                    </p>
                  )}
                  <button
                    onClick={clearHistory}
                    className="w-full mt-2 py-1.5 rounded-lg bg-[var(--hm-soft)] text-xs text-[var(--hm-muted)] hover:bg-[var(--hm-border)] transition-colors flex items-center justify-center gap-1"
                  >
                    <RotateCcw size={10} />
                    Clear History
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
