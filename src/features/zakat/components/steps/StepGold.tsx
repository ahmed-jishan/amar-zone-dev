'use client'

import { useZakatStore } from '../../store/zakatStore'
import CurrencyInput from '../ui/CurrencyInput'
import { formatBDT, calculateGoldValue, unitSuffix, type WeightUnit } from '../../types'

const PURITIES = [18, 21, 22, 24]
const UNITS: WeightUnit[] = ['gram', 'vori', 'tola']

export default function StepGold() {
  const { inputs, results, setGoldWeight, setGoldPurity, setGoldUnit } = useZakatStore()
  const value = calculateGoldValue(inputs.goldWeight, inputs.goldPurity, inputs.manualGoldPrice, inputs.goldUnit)
  const suffix = unitSuffix(inputs.goldUnit)

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-[var(--zk-text)]">Gold (স্বর্ণ)</h2>
        <p className="text-sm text-[var(--zk-muted)] mt-1">Enter your gold holdings</p>
      </div>

      {/* Unit Selector */}
      <div className="zk-input-group">
        <label className="zk-input-label">Unit (একক)</label>
        <div className="flex gap-2">
          {UNITS.map((u) => (
            <button
              key={u}
              onClick={() => setGoldUnit(u)}
              className={`zk-unit-btn ${inputs.goldUnit === u ? 'zk-unit-active' : ''}`}
            >
              {u === 'gram' ? 'Gram' : u === 'vori' ? 'Vori (ভরি)' : 'Tola (তোলা)'}
            </button>
          ))}
        </div>
      </div>

      {/* Purity Selector */}
      <div className="zk-input-group">
        <label className="zk-input-label">Purity (ক্যারাট)</label>
        <div className="flex gap-2">
          {PURITIES.map((p) => (
            <button
              key={p}
              onClick={() => setGoldPurity(p)}
              className={`zk-purity-btn ${inputs.goldPurity === p ? 'zk-purity-active' : ''}`}
            >
              {p}K
            </button>
          ))}
        </div>
      </div>

      <CurrencyInput
        label={`Weight (${suffix})`}
        value={inputs.goldWeight}
        onChange={setGoldWeight}
        step={1}
        suffix={suffix}
        prefix=""
      />

      <div className="zk-subtotal">
        <span>Gold Value</span>
        <span className="zk-subtotal-value">{formatBDT(value)}</span>
      </div>

      {inputs.goldWeight > 0 && (
        <div className="zk-conversion-note">
          1 {inputs.goldUnit === 'vori' ? 'Vori' : inputs.goldUnit === 'tola' ? 'Tola' : 'Gram'} = 11.664g
          {inputs.goldUnit !== 'gram' && (
            <> · {(inputs.goldWeight * 11.664).toFixed(2)}g total</>
          )}
        </div>
      )}
    </div>
  )
}
