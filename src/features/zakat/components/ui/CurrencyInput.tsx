'use client'

// ── Premium BDT Currency Input with Stepper ──

import { useCallback, useMemo } from 'react'

interface CurrencyInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  placeholder?: string
  min?: number
  max?: number
  step?: number
  suffix?: string
  prefix?: string
}

export default function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = '0',
  min = 0,
  max = 999999999,
  step = 100,
  suffix,
  prefix = '৳',
}: CurrencyInputProps) {
  const displayValue = useMemo(() => {
    if (value <= 0) return ''
    return value.toString()
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, '')
      const num = raw ? parseInt(raw, 10) : 0
      onChange(Math.min(max, Math.max(min, num)))
    },
    [onChange, min, max],
  )

  const increment = useCallback(() => {
    onChange(Math.min(max, value + step))
  }, [onChange, value, step, max])

  const decrement = useCallback(() => {
    onChange(Math.max(min, value - step))
  }, [onChange, value, step, min])

  return (
    <div className="zk-input-group">
      <label className="zk-input-label">{label}</label>
      <div className="zk-input-wrapper">
        <button
          type="button"
          onClick={decrement}
          className="zk-stepper-btn"
          aria-label="Decrease"
          tabIndex={-1}
        >
          −
        </button>
        <div className="zk-input-field-wrap">
          {prefix && <span className="zk-input-prefix">{prefix}</span>}
          <input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            className="zk-input-field"
          />
          {suffix && <span className="zk-input-suffix">{suffix}</span>}
        </div>
        <button
          type="button"
          onClick={increment}
          className="zk-stepper-btn"
          aria-label="Increase"
          tabIndex={-1}
        >
          +
        </button>
      </div>
    </div>
  )
}