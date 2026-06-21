'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, ArrowDownLeft, ArrowUpRight, Wallet, Receipt } from 'lucide-react'

interface Props {
  onAddExpense: () => void
  onAddIncome: () => void
  onWalletTools: () => void
  onScanReceipt?: () => void
}

export default function QuickTransactionWidget({ onAddExpense, onAddIncome, onWalletTools, onScanReceipt }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const actions = [
    { icon: ArrowDownLeft, label: 'Expense', color: 'var(--mon-expense)', onClick: () => { onAddExpense(); setIsOpen(false) } },
    { icon: ArrowUpRight, label: 'Income', color: 'var(--mon-income)', onClick: () => { onAddIncome(); setIsOpen(false) } },
    { icon: Wallet, label: 'Wallets', color: 'var(--mon-gold)', onClick: () => { onWalletTools(); setIsOpen(false) } },
    ...(onScanReceipt ? [{ icon: Receipt, label: 'Receipt', color: 'var(--mon-accent)', onClick: () => { onScanReceipt(); setIsOpen(false) } }] : []),
  ]

  return (
    <div ref={ref} className={`mon-fab ${isOpen ? 'open' : ''}`}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full h-full flex items-center justify-center bg-none border-none cursor-pointer"
        aria-label="Quick actions"
      >
        <Plus
          size={24}
          strokeWidth={2.5}
          style={{
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      <div className="fab-actions">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="mon-fab-action"
            aria-label={action.label}
            title={action.label}
          >
            <action.icon size={20} strokeWidth={2} style={{ color: action.color }} />
          </button>
        ))}
      </div>
    </div>
  )
}