const fs = require('fs');
const d = 'src/features/zakat/components/steps/';

const gold = `'use client'
import { useZakatStore } from '../../store/zakatStore'
import CurrencyInput from '../ui/CurrencyInput'
import { formatBDT, calculateGoldValue } from '../../types'
const PURITIES = [18, 21, 22, 24]
export default function StepGold() {
  const { inputs, setGoldWeight, setGoldPurity } = useZakatStore()
  const value = calculateGoldValue(inputs.goldWeight, inputs.goldPurity, inputs.manualGoldPrice)
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-[var(--zk-text)]">Gold</h2>
        <p className="text-sm text-[var(--zk-muted)] mt-1">Enter your gold holdings</p>
      </div>
      <div className="zk-input-group">
        <label className="zk-input-label">Purity (Karat)</label>
        <div className="flex gap-2">
          {PURITIES.map((p) => (
            <button key={p} onClick={() => setGoldPurity(p)} className={\`zk-purity-btn \${inputs.goldPurity === p ? 'zk-purity-active' : ''}\`}>{p}K</button>
          ))}
        </div>
      </div>
      <CurrencyInput label="Weight (grams)" value={inputs.goldWeight} onChange={setGoldWeight} step={1} suffix="g" prefix="" />
      <div className="zk-subtotal"><span>Gold Value</span><span className="zk-subtotal-value">{formatBDT(value)}</span></div>
    </div>
  )
}`;

const silver = `'use client'
import { useZakatStore } from '../../store/zakatStore'
import CurrencyInput from '../ui/CurrencyInput'
import { formatBDT, calculateSilverValue } from '../../types'
export default function StepSilver() {
  const { inputs, setSilverWeight } = useZakatStore()
  const value = calculateSilverValue(inputs.silverWeight, inputs.manualSilverPrice)
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-[var(--zk-text)]">Silver</h2>
        <p className="text-sm text-[var(--zk-muted)] mt-1">Enter your silver holdings</p>
      </div>
      <CurrencyInput label="Weight (grams)" value={inputs.silverWeight} onChange={setSilverWeight} step={10} suffix="g" prefix="" />
      <div className="zk-subtotal"><span>Silver Value</span><span className="zk-subtotal-value">{formatBDT(value)}</span></div>
    </div>
  )
}`;

const business = `'use client'
import { useZakatStore } from '../../store/zakatStore'
import CurrencyInput from '../ui/CurrencyInput'
import { formatBDT } from '../../types'
export default function StepBusinessAssets() {
  const { inputs, results, setBusinessField } = useZakatStore()
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-[var(--zk-text)]">Business Assets</h2>
        <p className="text-sm text-[var(--zk-muted)] mt-1">Enter your business inventory & cash</p>
      </div>
      <CurrencyInput label="Inventory Value" value={inputs.inventoryValue} onChange={(v) => setBusinessField('inventoryValue', v)} step={1000} />
      <CurrencyInput label="Saleable Stock" value={inputs.saleableStock} onChange={(v) => setBusinessField('saleableStock', v)} step={1000} />
      <CurrencyInput label="Business Cash" value={inputs.businessCash} onChange={(v) => setBusinessField('businessCash', v)} step={1000} />
      {results && <div className="zk-subtotal"><span>Subtotal</span><span className="zk-subtotal-value">{formatBDT(results.totalBusinessAssets)}</span></div>}
    </div>
  )
}`;

const debts = `'use client'
import { useZakatStore } from '../../store/zakatStore'
import CurrencyInput from '../ui/CurrencyInput'
import { formatBDT } from '../../types'
export default function StepLiabilities() {
  const { inputs, results, setLiabilityField } = useZakatStore()
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-[var(--zk-text)]">Liabilities</h2>
        <p className="text-sm text-[var(--zk-muted)] mt-1">Enter your debts & outstanding payments</p>
        <p className="text-xs text-[var(--zk-amber)] mt-1">Only include immediate/short-term debts due within one lunar year.</p>
      </div>
      <CurrencyInput label="Short-Term Debt" value={inputs.shortTermDebt} onChange={(v) => setLiabilityField('shortTermDebt', v)} step={1000} />
      <CurrencyInput label="Outstanding Payments" value={inputs.outstandingPayments} onChange={(v) => setLiabilityField('outstandingPayments', v)} step={500} />
      <CurrencyInput label="Other Liabilities" value={inputs.otherLiabilities} onChange={(v) => setLiabilityField('otherLiabilities', v)} step={500} />
      {results && <div className="zk-subtotal zk-subtotal-danger"><span>Total Liabilities</span><span className="zk-subtotal-value">{formatBDT(results.totalLiabilities)}</span></div>}
    </div>
  )
}`;

const results = `'use client'
import { motion } from 'framer-motion'
import { Banknote, Coins, Building2, PiggyBank, CheckCircle2, XCircle, Scale, Receipt, HandCoins } from 'lucide-react'
import { useZakatStore } from '../../store/zakatStore'
import ResultCard from '../ui/ResultCard'
import DisclaimerCard from '../ui/DisclaimerCard'
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
        <ResultCard icon={<PiggyBank size={18} />} label="Silver Value" value={formatBDT(results.silverValue)} accent="var(--zk-muted)" />
        <ResultCard icon={<Building2 size={18} />} label="Business Assets" value={formatBDT(results.totalBusinessAssets)} accent="var(--zk-blue)" />
        <ResultCard icon={<Scale size={18} />} label="Total Assets" value={formatBDT(results.totalAssets)} accent="var(--zk-accent)" />
        <ResultCard icon={<Receipt size={18} />} label="Total Liabilities" value={formatBDT(results.totalLiabilities)} accent="var(--zk-red)" />
        <ResultCard icon={<Scale size={18} />} label="Net Wealth" value={formatBDT(results.netWealth)} accent="var(--zk-accent)" large />
        <ResultCard icon={results.isEligible ? <CheckCircle2 size={18} /> : <XCircle size={18} />} label="Zakat Eligibility" value={results.isEligible ? 'YES - Eligible' : 'Not Eligible'} accent={results.isEligible ? 'var(--zk-green)' : 'var(--zk-red)'} />
        {results.isEligible && <ResultCard icon={<HandCoins size={22} />} label="Zakat Due (2.5%)" value={formatBDT(results.zakatDue)} accent="var(--zk-green)" large />}
      </div>
      {results.netWealth > 0 && results.selectedNisabThreshold > 0 && (
        <div className="zk-card zk-card-info">
          <p className="text-xs text-[var(--zk-muted)]">Net wealth <strong>{formatBDT(results.netWealth)}</strong> is {results.isEligible ? 'above' : 'below'} the {method.toLowerCase()} nisab of <strong>{formatBDT(results.selectedNisabThreshold)}</strong>.{results.isEligible ? ' Zakat is due.' : ' No zakat is due at this time.'}</p>
        </div>
      )}
      <DisclaimerCard />
    </motion.div>
  )
}`;

fs.writeFileSync(d + 'StepGold.tsx', gold);
fs.writeFileSync(d + 'StepSilver.tsx', silver);
fs.writeFileSync(d + 'StepBusinessAssets.tsx', business);
fs.writeFileSync(d + 'StepLiabilities.tsx', debts);
fs.writeFileSync(d + 'StepResults.tsx', results);

console.log('Created remaining step files');
