// components/ui/CalculatorModal.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

interface CalculatorModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CalculatorModal({ isOpen, onClose }: CalculatorModalProps) {
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState(false)
  const [memory, setMemory] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const inputRef = useRef<HTMLDivElement>(null)

  // Auto‑focus the calculator when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return
      const key = e.key
      if (/[0-9.]/.test(key)) append(key)
      else if (key === 'Enter') calculate()
      else if (key === 'Escape') onClose()
      else if (key === 'Backspace') backspace()
      else if (['+', '-', '*', '/'].includes(key)) append(key)
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, expression])

  const append = (value: string) => {
    if (error) clearAll()
    setExpression(prev => prev + value)
  }

  const clearAll = () => {
    setExpression('')
    setResult('')
    setError(false)
  }

  const clearEntry = () => {
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
      let expr = expression.replace(/×/g, '*').replace(/÷/g, '/')
      // eslint-disable-next-line no-new-func
      const computed = Function('"use strict";return (' + expr + ')')()
      if (isNaN(computed) || !isFinite(computed)) throw new Error('Invalid')
      const computedStr = String(computed)
      setResult(computedStr)
      // Add to history
      const historyEntry = `${expression} = ${computedStr}`
      setHistory(prev => [historyEntry, ...prev].slice(0, 10))
      setExpression(computedStr)
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
        // Simple percent: last number divided by 100
        const match = expression.match(/(\d+(?:\.\d+)?)([+\-×÷]|$)/)
        if (match) {
          const num = parseFloat(match[1])
          const percentValue = num / 100
          const newExpr = expression.replace(/(\d+(?:\.\d+)?)/, percentValue.toString())
          setExpression(newExpr)
        } else {
          const val = eval(expression) / 100
          setExpression(String(val))
        }
      } catch {}
    }
  }

  const handleOperator = (op: string) => {
    if (error) clearAll()
    append(op)
  }

  // Memory functions
  const memoryAdd = () => {
    const current = expression ? parseFloat(expression) : 0
    if (!isNaN(current)) setMemory(prev => prev + current)
  }
  const memorySubtract = () => {
    const current = expression ? parseFloat(expression) : 0
    if (!isNaN(current)) setMemory(prev => prev - current)
  }
  const memoryRecall = () => {
    setExpression(memory.toString())
    setResult('')
  }
  const memoryClear = () => setMemory(0)

  if (!isOpen) return null

  return (
    <div className="calc-overlay" onClick={onClose}>
      <div className="calc-modal" onClick={e => e.stopPropagation()} ref={inputRef} tabIndex={-1}>
        <div className="calc-header">
          <h3 className="calc-title">
            Calculator
            {memory !== 0 && <span className="calc-memory-indicator">M</span>}
          </h3>
          <button className="calc-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="calc-screen">
          <div className="calc-expression">{expression || '0'}</div>
          <div className={`calc-result ${error ? 'calc-error' : ''}`}>
            {error ? 'Error' : result}
          </div>
        </div>

        {/* History toggle */}
        <button className="calc-history-toggle" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          History
        </button>

        {showHistory && history.length > 0 && (
          <div className="calc-history">
            {history.map((entry, idx) => (
              <div key={idx} className="calc-history-item">{entry}</div>
            ))}
          </div>
        )}

        <div className="calc-buttons">
          {/* Memory row */}
          <button onClick={memoryClear} className="calc-btn calc-btn-mem" title="Memory Clear">MC</button>
          <button onClick={memoryRecall} className="calc-btn calc-btn-mem" title="Memory Recall">MR</button>
          <button onClick={memoryAdd} className="calc-btn calc-btn-mem" title="Memory Add">M+</button>
          <button onClick={memorySubtract} className="calc-btn calc-btn-mem" title="Memory Subtract">M-</button>

          {/* Clear row */}
          <button onClick={clearEntry} className="calc-btn calc-btn-clear">CE</button>
          <button onClick={clearAll} className="calc-btn calc-btn-clear">AC</button>
          <button onClick={backspace} className="calc-btn calc-btn-clear">⌫</button>
          <button onClick={() => handleOperator('÷')} className="calc-btn calc-btn-op">÷</button>

          {/* Digits row 1 */}
          <button onClick={() => append('7')} className="calc-btn">7</button>
          <button onClick={() => append('8')} className="calc-btn">8</button>
          <button onClick={() => append('9')} className="calc-btn">9</button>
          <button onClick={() => handleOperator('×')} className="calc-btn calc-btn-op">×</button>

          {/* Digits row 2 */}
          <button onClick={() => append('4')} className="calc-btn">4</button>
          <button onClick={() => append('5')} className="calc-btn">5</button>
          <button onClick={() => append('6')} className="calc-btn">6</button>
          <button onClick={() => handleOperator('-')} className="calc-btn calc-btn-op">-</button>

          {/* Digits row 3 */}
          <button onClick={() => append('1')} className="calc-btn">1</button>
          <button onClick={() => append('2')} className="calc-btn">2</button>
          <button onClick={() => append('3')} className="calc-btn">3</button>
          <button onClick={() => handleOperator('+')} className="calc-btn calc-btn-op">+</button>

          {/* Bottom row */}
          <button onClick={toggleSign} className="calc-btn calc-btn-op">±</button>
          <button onClick={() => append('0')} className="calc-btn">0</button>
          <button onClick={() => append('.')} className="calc-btn">.</button>
          <button onClick={calculate} className="calc-btn calc-btn-equal">=</button>
        </div>
      </div>

      <style jsx>{`
        .calc-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          animation: fadeIn 0.2s ease-out;
        }
        .calc-modal {
          background: rgb(var(--bg));
          backdrop-filter: blur(20px);
          border-radius: 32px;
          width: 380px;
          max-width: 90vw;
          padding: 20px;
          border: 1px solid rgba(var(--border), 0.5);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          outline: none;
        }
        .calc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 0 4px;
        }
        .calc-title {
          font-size: 14px;
          font-weight: 600;
          color: rgb(var(--muted));
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .calc-memory-indicator {
          font-size: 10px;
          background: rgba(var(--brand), 0.2);
          color: rgb(var(--brand));
          padding: 2px 6px;
          border-radius: 20px;
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
          background: rgba(var(--card), 0.6);
          border-radius: 24px;
          padding: 20px 16px;
          margin-bottom: 16px;
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
        .calc-history-toggle {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(var(--border), 0.4);
          border-radius: 20px;
          padding: 6px;
          margin-bottom: 12px;
          font-size: 11px;
          font-weight: 500;
          color: rgb(var(--muted));
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .calc-history-toggle:hover {
          background: rgba(var(--border), 0.2);
        }
        .calc-history {
          background: rgba(var(--card), 0.5);
          border-radius: 16px;
          padding: 8px;
          margin-bottom: 16px;
          max-height: 120px;
          overflow-y: auto;
          border: 1px solid rgba(var(--border), 0.3);
        }
        .calc-history-item {
          font-size: 12px;
          font-family: monospace;
          padding: 6px 8px;
          color: rgb(var(--muted));
          border-bottom: 1px solid rgba(var(--border), 0.2);
          white-space: nowrap;
          overflow-x: hidden;
          text-overflow: ellipsis;
        }
        .calc-history-item:last-child {
          border-bottom: none;
        }
        .calc-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .calc-btn {
          background: rgba(var(--card), 0.8);
          border: 1px solid rgba(var(--border), 0.5);
          border-radius: 24px;
          padding: 12px 0;
          font-size: 18px;
          font-weight: 500;
          color: rgb(var(--fg));
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .calc-btn:active {
          transform: scale(0.94);
          background: rgba(var(--brand), 0.15);
        }
        .calc-btn-op {
          background: rgba(var(--brand), 0.12);
          color: rgb(var(--brand));
          font-weight: 600;
        }
        .calc-btn-mem {
          background: rgba(var(--muted), 0.12);
          color: rgb(var(--muted));
          font-size: 12px;
          font-weight: 600;
        }
        .calc-btn-clear {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
        }
        .calc-btn-equal {
          background: rgb(var(--brand));
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(var(--brand), 0.3);
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
    </div>
  )
}