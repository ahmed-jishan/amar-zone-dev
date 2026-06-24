'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useZakatStore } from '../store/zakatStore'
import { useMarketPrice } from '../hooks/useMarketPrice'
import NisabBadge from './ui/NisabBadge'
import '@/features/zakat/components/zakat.css'

import StepNisabMethod from './steps/StepNisabMethod'
import StepMarketPrices from './steps/StepMarketPrices'
import StepCashSavings from './steps/StepCashSavings'
import StepGold from './steps/StepGold'
import StepSilver from './steps/StepSilver'
import StepBusinessAssets from './steps/StepBusinessAssets'
import StepLiabilities from './steps/StepLiabilities'
import StepResults from './steps/StepResults'

const STEPS = [
  { id: 'nisab', label: 'Method', component: StepNisabMethod },
  { id: 'prices', label: 'Prices', component: StepMarketPrices },
  { id: 'cash', label: 'Cash', component: StepCashSavings },
  { id: 'gold', label: 'Gold', component: StepGold },
  { id: 'silver', label: 'Silver', component: StepSilver },
  { id: 'business', label: 'Business', component: StepBusinessAssets },
  { id: 'debts', label: 'Debts', component: StepLiabilities },
  { id: 'results', label: 'Results', component: StepResults },
]

export default function ZakatWizard() {
  const { currentStep, goNext, goBack, recalculate } = useZakatStore()
  useMarketPrice()

  useEffect(() => {
    recalculate()
  }, [recalculate])

  const StepComponent = STEPS[currentStep].component
  const isFirst = currentStep === 0
  const isLast = currentStep === STEPS.length - 1

  return (
    <div className="zk-root">
      {/* Step Progress Dots */}
      <div className="zk-progress-row">
        {STEPS.map((s, i) => (
          <div key={s.id} className="zk-progress-item">
            <div className={`zk-progress-dot ${i <= currentStep ? 'zk-progress-active' : ''} ${i === currentStep ? 'zk-progress-current' : ''}`}>
              {i + 1}
            </div>
            <span className="zk-progress-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Nisab Badge */}
      {currentStep > 0 && <NisabBadge />}

      {/* Step Content */}
      <div className="zk-step-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="zk-nav-row">
        <button
          onClick={goBack}
          disabled={isFirst}
          className="zk-nav-btn zk-nav-back"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {isLast ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--zk-green)] font-medium">Complete ✓</span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="zk-nav-btn zk-nav-top"
            >
              ↑ Top
            </button>
          </div>
        ) : (
          <button onClick={goNext} className="zk-nav-btn zk-nav-next">
            Next
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}