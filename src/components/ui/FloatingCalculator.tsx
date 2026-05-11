// components/ui/FloatingCalculator.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { X, Calculator, Divide, Minus, Plus, Equal, Delete, Percent } from 'lucide-react'

export function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false)
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState(false)

  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return
      const key = e.key
      if (/[0-9.]/.test(key)) append(key)
      else if (key === 'Enter') calculate()
      else if (key === 'Escape') setIsOpen(false)
      else if (key === 'Backspace') backspace()
      else if (['+', '-', '*', '/'].includes(key)) append(key)
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, expression])

  const append = (value: string) => {
    setError(false)
    setExpression(prev => prev + value)
  }

  const clear = () => {
    setExpression('')
    setResult('')
    setError(false)
  }

  const backspace = () => {
    setExpression(prev => prev.slice(0, -1))
    setResult('')
    setError(false)
  }

  const calculate = () => {
    if (!expression.trim()) return
    try {
      // Evaluate safely
      let expr = expression.replace(/×/g, '*').replace(/÷/g, '/')
      // eslint-disable-next-line no-new-func
      const computed = Function('"use strict";return (' + expr + ')')()
      if (isNaN(computed) || !isFinite(computed)) throw new Error('Invalid')
      setResult(String(computed))
      setExpression(String(computed))
      setError(false)
    } catch {
      setError(true)
      setResult('Error')
      setTimeout(() => {
        setError(false)
        setResult('')
      }, 1500)
    }
  }

  const toggleSign = () => {
    if (expression) {
      if (expression.startsWith('-')) setExpression(expression.slice(1))
      else setExpression('-' + expression)
    }
  }

  const percent = () => {
    if (expression) {
      try {
        const val = eval(expression) / 100
        setExpression(String(val))
      } catch {}
    }
  }

  const handleOperator = (op: string) => {
    if (error) clear()
    append(op)
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="floating-calc-btn"
        aria-label="Open calculator"
      >
        <Calculator size={24} strokeWidth={1.8} />
      </button>

      {/* Calculator Modal */}
      {isOpen && (
        <div className="calc-overlay" onClick={() => setIsOpen(false)}>
          <div className="calc-modal" onClick={e => e.stopPropagation()}>
            <div className="calc-header">
              <h3 className="calc-title">Calculator</h3>
              <button className="calc-close" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="calc-screen">
              <div className="calc-expression">{expression || '0'}</div>
              <div className={`calc-result ${error ? 'calc-error' : ''}`}>
                {error ? 'Error' : result}
              </div>
            </div>

            <div className="calc-buttons">
              <button onClick={clear} className="calc-btn calc-btn-clear">AC</button>
              <button onClick={toggleSign} className="calc-btn calc-btn-op">±</button>
              <button onClick={percent} className="calc-btn calc-btn-op">%</button>
              <button onClick={() => handleOperator('÷')} className="calc-btn calc-btn-op">÷</button>

              <button onClick={() => append('7')} className="calc-btn">7</button>
              <button onClick={() => append('8')} className="calc-btn">8</button>
              <button onClick={() => append('9')} className="calc-btn">9</button>
              <button onClick={() => handleOperator('×')} className="calc-btn calc-btn-op">×</button>

              <button onClick={() => append('4')} className="calc-btn">4</button>
              <button onClick={() => append('5')} className="calc-btn">5</button>
              <button onClick={() => append('6')} className="calc-btn">6</button>
              <button onClick={() => handleOperator('-')} className="calc-btn calc-btn-op">-</button>

              <button onClick={() => append('1')} className="calc-btn">1</button>
              <button onClick={() => append('2')} className="calc-btn">2</button>
              <button onClick={() => append('3')} className="calc-btn">3</button>
              <button onClick={() => handleOperator('+')} className="calc-btn calc-btn-op">+</button>

              <button onClick={backspace} className="calc-btn calc-btn-clear">⌫</button>
              <button onClick={() => append('0')} className="calc-btn">0</button>
              <button onClick={() => append('.')} className="calc-btn">.</button>
              <button onClick={calculate} className="calc-btn calc-btn-equal">=</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .floating-calc-btn {
          position: fixed;
          bottom: 80px;
          right: 20px;
          width: 52px;
          height: 52px;
          border-radius: 28px;
          background: rgba(var(--brand), 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.2,0.9,0.4,1.1);
          z-index: 100;
        }
        .floating-calc-btn:hover {
          transform: scale(1.05);
          background: rgb(var(--brand));
          box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        }
        .floating-calc-btn:active {
          transform: scale(0.95);
        }

        .calc-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          animation: fadeIn 0.2s ease-out;
        }

        .calc-modal {
          background: rgba(var(--bg), 0.96);
          backdrop-filter: blur(20px);
          border-radius: 32px;
          width: 320px;
          padding: 16px 20px 24px;
          border: 1px solid rgba(var(--border), 0.6);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          animation: slideUp 0.3s cubic-bezier(0.2,0.9,0.4,1.1);
        }

        .calc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 0 4px;
        }
        .calc-title {
          font-size: 14px;
          font-weight: 600;
          color: rgb(var(--text-muted));
          letter-spacing: 0.5px;
        }
        .calc-close {
          width: 28px;
          height: 28px;
          border-radius: 14px;
          background: rgba(var(--border), 0.5);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgb(var(--muted));
          transition: all 0.15s;
        }
        .calc-close:hover {
          background: rgba(var(--border), 0.8);
          color: rgb(var(--fg));
        }

        .calc-screen {
          background: rgba(var(--card), 0.8);
          border-radius: 20px;
          padding: 20px 16px;
          margin-bottom: 20px;
          border: 1px solid rgba(var(--border), 0.4);
          text-align: right;
        }
        .calc-expression {
          font-size: 28px;
          font-weight: 500;
          color: rgb(var(--fg));
          word-break: break-all;
          min-height: 48px;
          font-family: 'Monaco', 'Menlo', monospace;
        }
        .calc-result {
          font-size: 16px;
          color: rgb(var(--muted));
          margin-top: 8px;
          font-family: monospace;
        }
        .calc-error {
          color: #f87171;
        }

        .calc-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .calc-btn {
          background: rgba(var(--card), 0.9);
          border: 1px solid rgba(var(--border), 0.5);
          border-radius: 20px;
          padding: 14px 0;
          font-size: 20px;
          font-weight: 500;
          color: rgb(var(--fg));
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .calc-btn:active {
          transform: scale(0.94);
          background: rgba(var(--brand), 0.2);
        }
        .calc-btn-op {
          background: rgba(var(--brand), 0.12);
          color: rgb(var(--brand));
          font-weight: 600;
        }
        .calc-btn-clear {
          background: rgba(239,68,68,0.12);
          color: #f87171;
        }
        .calc-btn-equal {
          background: rgb(var(--brand));
          color: white;
          border: none;
          box-shadow: 0 2px 8px rgba(var(--brand), 0.4);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </>
  )
}