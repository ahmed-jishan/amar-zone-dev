'use client'

import { useZakatStore } from '../../store/zakatStore'
import CurrencyInput from '../ui/CurrencyInput'
import { formatBDT } from '../../types'

export default function StepCashSavings() {
  const { inputs, results, setCashField } = useZakatStore()

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-[var(--zk-text)]">Cash & Savings</h2>
        <p className="text-sm text-[var(--zk-muted)] mt-1">Enter all liquid assets</p>
      </div>
      <CurrencyInput label="Cash in Hand" value={inputs.cashInHand} onChange={(v) => setCashField('cashInHand', v)} step={500} />
      <CurrencyInput label="Bank Balance" value={inputs.bankBalance} onChange={(v) => setCashField('bankBalance', v)} step={1000} />
      <CurrencyInput label="Mobile Banking" value={inputs.mobileBanking} onChange={(v) => setCashField('mobileBanking', v)} step={500} />
      <CurrencyInput label="Other Savings" value={inputs.otherSavings} onChange={(v) => setCashField('otherSavings', v)} step={500} />
      {results && (
        <div className="zk-subtotal">
          <span>Subtotal</span>
          <span className="zk-subtotal-value">{formatBDT(results.totalCashSavings)}</span>
        </div>
      )}
    </div>
  )
}