'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, ArrowDownLeft, ArrowUpRight, Wallet, Receipt, type LucideIcon } from 'lucide-react'
import { useMoneyHaptics } from '../hooks/useMoneyHaptics'

interface FabAction {
  icon: LucideIcon
  label: string
  color: string
  onClick: () => void
}

interface Props {
  onAddExpense: () => void
  onAddIncome: () => void
  onWalletTools: () => void
  onScanReceipt?: () => void
}

export default function QuickTransactionWidget({ onAddExpense, onAddIncome, onWalletTools, onScanReceipt }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const haptics = useMoneyHaptics()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleFab = () => {
    if (!isOpen) haptics.tapMedium()
    setIsOpen((v) => !v)
  }

  const actions: FabAction[] = [
    { icon: ArrowDownLeft, label: 'Expense', color: 'var(--mon-expense)', onClick: () => { onAddExpense(); setIsOpen(false); haptics.tap() } },
    { icon: ArrowUpRight, label: 'Income', color: 'var(--mon-income)', onClick: () => { onAddIncome(); setIsOpen(false); haptics.tap() } },
    { icon: Wallet, label: 'Wallets', color: 'var(--mon-gold)', onClick: () => { onWalletTools(); setIsOpen(false); haptics.tap() } },
  ]

  if (onScanReceipt) {
    actions.push({ icon: Receipt, label: 'Receipt', color: 'var(--mon-accent)', onClick: () => { onScanReceipt(); setIsOpen(false); haptics.tap() } })
  }

  return (
    <div ref={ref} className={`mon-fab ${isOpen ? 'open' : ''}`} style={{ zIndex: 40 }}>
      <button
        onClick={toggleFab}
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