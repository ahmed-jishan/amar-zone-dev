'use client'

import { useZakatStore } from '../../store/zakatStore'
import CurrencyInput from '../ui/CurrencyInput'
import { formatBDT, calculateSilverValue, unitSuffix, type WeightUnit } from '../../types'

const UNITS: WeightUnit[] = ['gram', 'vori', 'tola']

export default function StepSilver() {
  const { inputs, setSilverWeight, setSilverUnit } = useZakatStore()
  const value = calculateSilverValue(inputs.silverWeight, inputs.manualSilverPrice, inputs.silverUnit)
  const suffix = unitSuffix(inputs.silverUnit)

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-[var(--zk-text)]">Silver (Silver)</h2>
        <p className="text-sm text-[var(--zk-muted)] mt-1">Enter your silver holdings</p>
      </div>

      <div className="zk-input-group">
        <label className="zk-input-label">Unit (Unit)</label>
        <div className="flex gap-2">
          {UNITS.map((u) => (
            <button
              key={u}
              onClick={() => setSilverUnit(u)}
              className={`zk-unit-btn ${inputs.silverUnit === u ? 'zk-unit-active' : ''}`}
            >
              {u === 'gram' ? 'Gram' : u === 'vori' ? 'Vori (Vori)' : 'Tola (Tola)'}
            </button>
          ))}
        </div>
      </div>

      <CurrencyInput
        label={'Weight (' + suffix + ')'}
        value={inputs.silverWeight}
        onChange={setSilverWeight}
        step={1}
        suffix={suffix}
        prefix=""
      />

      <div className="zk-subtotal">
        <span>Silver Value</span>
        <span className="zk-subtotal-value">{formatBDT(value)}</span>
      </div>

      {inputs.silverWeight > 0 && inputs.silverUnit !== 'gram' && (
        <div className="zk-conversion-note">
          1 {inputs.silverUnit === 'vori' ? 'Vori' : 'Tola'} = 11.664g
        </div>
      )}
    </div>
  )
}
