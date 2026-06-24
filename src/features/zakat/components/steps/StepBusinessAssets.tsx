'use client'
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
}