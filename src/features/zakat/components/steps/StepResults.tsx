'use client'

import { motion } from 'framer-motion'
import { Banknote, Coins, Building2, CircleDollarSign, CheckCircle2, XCircle, Scale, Receipt, HandCoins } from 'lucide-react'
import { useZakatStore } from '../../store/zakatStore'
import ResultCard from '../ui/ResultCard'
import DisclaimerCard from '../ui/DisclaimerCard'
import IslamicEducationCard from '../ui/IslamicEducationCard'
import { formatBDT } from '../../types'

export default function StepResults() {
  const { results, inputs } = useZakatStore()
  if (!results) return null

  const method = inputs.nisabMethod === 'gold' ? 'Gold' : 'Silver'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-[var(--zk-text)]">Your Zakat Summary</h2>
        <p className="text-sm text-[var(--zk-muted)] mt-1">Based on the values you provided</p>
      </div>

      <div className="zk-results-grid">
        <ResultCard icon={<Scale size={18} />} label={method + ' Nisab Threshold'} value={formatBDT(results.selectedNisabThreshold)} accent="var(--zk-accent)" />
        <ResultCard icon={<Banknote size={18} />} label="Cash & Savings" value={formatBDT(results.totalCashSavings)} accent="var(--zk-green)" />
        <ResultCard icon={<Coins size={18} />} label="Gold Value" value={formatBDT(results.goldValue)} accent="var(--zk-amber)" />
        <ResultCard icon={<CircleDollarSign size={18} />} label="Silver Value" value={formatBDT(results.silverValue)} accent="var(--zk-muted)" />
        <ResultCard icon={<Building2 size={18} />} label="Business Assets" value={formatBDT(results.totalBusinessAssets)} accent="var(--zk-blue)" />
        <ResultCard icon={<Scale size={18} />} label="Total Assets" value={formatBDT(results.totalAssets)} accent="var(--zk-accent)" />
        <ResultCard icon={<Receipt size={18} />} label="Total Liabilities" value={formatBDT(results.totalLiabilities)} accent="var(--zk-red)" />
        <ResultCard icon={<Scale size={18} />} label="Net Wealth" value={formatBDT(results.netWealth)} accent="var(--zk-accent)" large />
        <ResultCard icon={results.isEligible ? <CheckCircle2 size={18} /> : <XCircle size={18} />} label="Zakat Eligibility" value={results.isEligible ? 'YES - Eligible' : 'Not Eligible'} accent={results.isEligible ? 'var(--zk-green)' : 'var(--zk-red)'} />
        {results.isEligible && <ResultCard icon={<HandCoins size={22} />} label="Zakat Due (2.5%)" value={formatBDT(results.zakatDue)} accent="var(--zk-green)" large />}
      </div>

      {results.netWealth > 0 && results.selectedNisabThreshold > 0 && (
        <div className="zk-card zk-card-info">
          <p className="text-xs text-[var(--zk-muted)]">
            Net wealth <strong>{formatBDT(results.netWealth)}</strong> is {results.isEligible ? 'above' : 'below'} the {method.toLowerCase()} nisab of <strong>{formatBDT(results.selectedNisabThreshold)}</strong>.{results.isEligible ? ' Zakat is due.' : ' No zakat is due at this time.'}
          </p>
        </div>
      )}

      <DisclaimerCard />
      <IslamicEducationCard />
    </motion.div>
  )
}
