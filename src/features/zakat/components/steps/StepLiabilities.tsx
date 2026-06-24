'use client'
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
}