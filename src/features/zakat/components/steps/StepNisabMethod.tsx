'use client'

import { motion } from 'framer-motion'
import { Gem, Sparkles } from 'lucide-react'
import { useZakatStore } from '../../store/zakatStore'
import { formatBDT, calculateGoldNisab, calculateSilverNisab } from '../../types'

export default function StepNisabMethod() {
  const { inputs, results, setNisabMethod } = useZakatStore()

  const goldNisab = calculateGoldNisab(inputs.manualGoldPrice)
  const silverNisab = calculateSilverNisab(inputs.manualSilverPrice)

  const options = [
    {
      value: 'gold' as const,
      label: 'Gold Nisab',
      desc: '87.48g × ' + formatBDT(inputs.manualGoldPrice) + '/g',
      valueDisplay: formatBDT(goldNisab),
      icon: Gem,
    },
    {
      value: 'silver' as const,
      label: 'Silver Nisab',
      desc: '612.36g × ' + formatBDT(inputs.manualSilverPrice) + '/g',
      valueDisplay: formatBDT(silverNisab),
      icon: Sparkles,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-[var(--zk-text)]">Choose Nisab Method</h2>
        <p className="text-sm text-[var(--zk-muted)] mt-1">Select how to calculate your wealth threshold</p>
      </div>

      <div className="grid gap-3">
        {options.map((opt) => {
          const isActive = inputs.nisabMethod === opt.value
          const Icon = opt.icon
          return (
            <motion.button
              key={opt.value}
              onClick={() => setNisabMethod(opt.value)}
              className={`zk-option-card ${isActive ? 'zk-option-active' : ''}`}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-4">
                <div className={`zk-option-icon ${isActive ? 'zk-option-icon-active' : ''}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 text-left">
                  <span className="zk-option-label">{opt.label}</span>
                  <span className="zk-option-desc">{opt.desc}</span>
                </div>
                <div className="text-right">
                  <span className="zk-option-value">{opt.valueDisplay}</span>
                  <span className="zk-option-unit">Threshold</span>
                </div>
                <div className={`zk-radio ${isActive ? 'zk-radio-active' : ''}`}>
                  {isActive && <div className="zk-radio-dot" />}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {results && (
        <div className="zk-nisab-summary">
          Current Nisab: <strong>{formatBDT(results.selectedNisabThreshold)}</strong>
          {' '}({inputs.nisabMethod === 'gold' ? 'Gold' : 'Silver'} Method)
        </div>
      )}
    </div>
  )
}