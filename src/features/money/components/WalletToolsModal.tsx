'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Wallet } from '@/lib/types'
import { WALLET_TYPES } from '../constants'

interface Props {
  wallets: Wallet[]
  selectedWalletId: string | null
  onClose: () => void
  onTransfer: (fromWalletId: string, toWalletId: string, amount: number) => void
  onReconcile: (walletId: string, balance: number, note?: string) => void
  onAddWallet: (wallet: Omit<Wallet, 'id'>) => void
  currencySymbol: string
}

export default function WalletToolsModal({ wallets, selectedWalletId, onClose, onTransfer, onReconcile, onAddWallet, currencySymbol }: Props) {
  const [mounted, setMounted] = useState(false)
  const defaultFrom = selectedWalletId || wallets[0]?.id || ''
  const defaultTo = wallets.find((wallet) => wallet.id !== defaultFrom)?.id || wallets[0]?.id || ''
  const [mode, setMode] = useState<'transfer' | 'reconcile'>('transfer')
  const [fromWalletId, setFromWalletId] = useState(defaultFrom)
  const [toWalletId, setToWalletId] = useState(defaultTo)
  const [amount, setAmount] = useState('')
  const [balance, setBalance] = useState('')
  const [reconcileNote, setReconcileNote] = useState('')
  const [confirmStep, setConfirmStep] = useState<'form' | 'confirm'>('form')
  const [newWalletName, setNewWalletName] = useState('')
  const [newWalletType, setNewWalletType] = useState<Wallet['type']>('mobile')
  const [newWalletBalance, setNewWalletBalance] = useState('')

  const selectedWallet = useMemo(() => wallets.find((wallet) => wallet.id === fromWalletId), [wallets, fromWalletId])
  const destinationWallets = wallets.filter((wallet) => wallet.id !== fromWalletId)

  useEffect(() => {
    if (!wallets.some((wallet) => wallet.id === fromWalletId)) {
      setFromWalletId(wallets[0]?.id || '')
    }
  }, [wallets, fromWalletId])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (destinationWallets.length && !destinationWallets.some((wallet) => wallet.id === toWalletId)) {
      setToWalletId(destinationWallets[0].id)
    }
  }, [destinationWallets, toWalletId])

  // Reset confirm step when mode/wallets change
  useEffect(() => {
    setConfirmStep('form')
  }, [mode, fromWalletId, toWalletId])

  const handleTransferConfirm = () => {
    const numericAmount = Number(amount)
    if (!fromWalletId || !toWalletId || fromWalletId === toWalletId || numericAmount <= 0) return
    onTransfer(fromWalletId, toWalletId, numericAmount)
    onClose()
  }

  const handleReconcileConfirm = () => {
    const numericBalance = Number(balance)
    if (!fromWalletId || Number.isNaN(numericBalance)) return
    onReconcile(fromWalletId, numericBalance, reconcileNote.trim() || undefined)
    onClose()
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (mode === 'transfer') {
      const numericAmount = Number(amount)
      if (!fromWalletId || !toWalletId || fromWalletId === toWalletId || numericAmount <= 0) return
      // Show confirmation step
      setConfirmStep('confirm')
    } else {
      const numericBalance = Number(balance)
      if (!fromWalletId || Number.isNaN(numericBalance)) return
      // If balance differs significantly, show confirmation
      if (selectedWallet && Math.abs(numericBalance - selectedWallet.balance) > 0.01) {
        setConfirmStep('confirm')
      } else {
        onReconcile(fromWalletId, numericBalance, reconcileNote.trim() || undefined)
        onClose()
      }
    }
  }

  const handleAddWallet = () => {
    if (!newWalletName.trim()) return
    const meta = WALLET_TYPES.find((item) => item.type === newWalletType)
    onAddWallet({
      name: newWalletName.trim(),
      type: newWalletType,
      balance: Number(newWalletBalance) || 0,
      currency: 'BDT',
      color: newWalletType === 'cash' ? '#10b981' : newWalletType === 'bank' ? '#3b82f6' : newWalletType === 'mobile' ? '#c9a84c' : '#8b5cf6',
      icon: meta?.icon || '💳',
      isDefault: wallets.length === 0,
    })
    setNewWalletName('')
    setNewWalletBalance('')
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-[mon-fade-in_150ms_ease-out]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <form
        onSubmit={handleSubmit}
        className="relative mx-4 w-full max-w-[420px] overflow-hidden rounded-[var(--mon-radius-2xl)] p-5 mon-glass shadow-[var(--mon-shadow-lg)] animate-[mon-scale-in_200ms_ease-out]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-bold" style={{ color: 'var(--mon-text-1)' }}>
            {confirmStep === 'confirm' ? 'Confirm' : 'Wallet Tools'}
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[var(--mon-text-3)] hover:bg-[var(--mon-surface-hover)] hover:text-[var(--mon-text-1)]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {confirmStep === 'confirm' ? (
          /* ── Confirmation Step ── */
          <div className="space-y-4">
            {mode === 'transfer' ? (
              <>
                <div className="rounded-[var(--mon-radius-xl)] p-4" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>Transfer Details</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 text-center">
                      <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--mon-text-3)' }}>From</p>
                      <p className="text-[15px] font-bold mt-1" style={{ color: 'var(--mon-expense)' }}>
                        {wallets.find(w => w.id === fromWalletId)?.icon} {wallets.find(w => w.id === fromWalletId)?.name}
                      </p>
                      <p className="text-[12px]" style={{ color: 'var(--mon-text-3)' }}>
                        Balance: {currencySymbol}{(selectedWallet?.balance ?? 0).toLocaleString('en-BD')}
                      </p>
                    </div>
                    <div className="text-2xl" style={{ color: 'var(--mon-gold)' }}>→</div>
                    <div className="flex-1 text-center">
                      <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--mon-text-3)' }}>To</p>
                      <p className="text-[15px] font-bold mt-1" style={{ color: 'var(--mon-income)' }}>
                        {wallets.find(w => w.id === toWalletId)?.icon} {wallets.find(w => w.id === toWalletId)?.name}
                      </p>
                      <p className="text-[12px]" style={{ color: 'var(--mon-text-3)' }}>
                        Balance: {currencySymbol}{(wallets.find(w => w.id === toWalletId)?.balance ?? 0).toLocaleString('en-BD')}
                      </p>
                    </div>
                  </div>
                  <div className="text-center py-2 rounded-[var(--mon-radius-lg)]" style={{ background: 'var(--mon-gold-bg)' }}>
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--mon-text-3)' }}>Amount: </span>
                    <span className="text-[18px] font-black" style={{ color: 'var(--mon-gold)' }}>
                      {currencySymbol}{Number(amount).toLocaleString('en-BD')}
                    </span>
                  </div>
                </div>
                <p className="text-[12px] text-center" style={{ color: 'var(--mon-text-3)' }}>
                  After transfer, '{wallets.find(w => w.id === fromWalletId)?.name}' balance will be{' '}
                  {currencySymbol}{((selectedWallet?.balance ?? 0) - Number(amount)).toLocaleString('en-BD')}
                </p>
                <button type="button" onClick={() => setConfirmStep('form')}
                  className="w-full py-2.5 rounded-[var(--mon-radius-xl)] text-[14px] font-bold transition-all active:scale-[0.98]"
                  style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-2)' }}
                >
                  Back
                </button>
                <button type="button" onClick={handleTransferConfirm}
                  className="w-full py-3 rounded-[var(--mon-radius-xl)] text-[15px] font-bold text-white transition-all active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, var(--mon-gold), var(--mon-gold-2))', boxShadow: '0 4px 20px var(--mon-gold-glow)' }}
                >
                  Confirm Transfer
                </button>
              </>
            ) : (
              <>
                <div className="rounded-[var(--mon-radius-xl)] p-4" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
                  <div className="text-center mb-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>Reconciliation</p>
                    <p className="text-[15px] font-bold mt-1" style={{ color: 'var(--mon-gold)' }}>
                      {selectedWallet?.icon} {selectedWallet?.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4 py-2">
                    <div className="text-center">
                      <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--mon-text-3)' }}>Current</p>
                      <p className="text-[16px] font-bold" style={{ color: 'var(--mon-text-1)' }}>
                        {currencySymbol}{(selectedWallet?.balance ?? 0).toLocaleString('en-BD')}
                      </p>
                    </div>
                    <span className="text-xl" style={{ color: 'var(--mon-gold)' }}>→</span>
                    <div className="text-center">
                      <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--mon-text-3)' }}>Actual</p>
                      <p className="text-[16px] font-bold" style={{ color: 'var(--mon-income)' }}>
                        {currencySymbol}{Number(balance).toLocaleString('en-BD')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-[12px] font-semibold" style={{ color: 'var(--mon-text-3)' }}>Difference: </span>
                    <span className="text-[14px] font-bold" style={{
                      color: (Number(balance) - (selectedWallet?.balance ?? 0)) >= 0 ? 'var(--mon-income)' : 'var(--mon-expense)'
                    }}>
                      {((Number(balance) - (selectedWallet?.balance ?? 0)) >= 0 ? '+' : '')}
                      {currencySymbol}{(Number(balance) - (selectedWallet?.balance ?? 0)).toLocaleString('en-BD')}
                    </span>
                  </div>
                  {reconcileNote && (
                    <div className="mt-2 text-center">
                      <span className="text-[11px]" style={{ color: 'var(--mon-text-3)' }}>Note: {reconcileNote}</span>
                    </div>
                  )}
                </div>
                <p className="text-[12px] text-center" style={{ color: 'var(--mon-text-3)' }}>
                  An adjustment transaction will be created for the difference of {currencySymbol}
                  {Math.abs(Number(balance) - (selectedWallet?.balance ?? 0)).toLocaleString('en-BD')}
                </p>
                <button type="button" onClick={() => setConfirmStep('form')}
                  className="w-full py-2.5 rounded-[var(--mon-radius-xl)] text-[14px] font-bold transition-all active:scale-[0.98]"
                  style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-2)' }}
                >
                  Back
                </button>
                <button type="button" onClick={handleReconcileConfirm}
                  className="w-full py-3 rounded-[var(--mon-radius-xl)] text-[15px] font-bold text-white transition-all active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, var(--mon-gold), var(--mon-gold-2))', boxShadow: '0 4px 20px var(--mon-gold-glow)' }}
                >
                  Confirm Reconciliation
                </button>
              </>
            )}
          </div>
        ) : (
          /* ── Form Step ── */
          <>
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-[var(--mon-radius-lg)] p-1" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
              {(['transfer', 'reconcile'] as const).map((item) => (
                <button key={item} type="button" onClick={() => setMode(item)}
                  className="rounded-md py-2 text-[13px] font-semibold capitalize transition-all"
                  style={{ background: mode === item ? 'var(--mon-gold-bg)' : 'transparent', color: mode === item ? 'var(--mon-gold)' : 'var(--mon-text-3)' }}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <WalletSelect label={mode === 'transfer' ? 'From wallet' : 'Wallet'} value={fromWalletId} wallets={wallets} onChange={setFromWalletId} />
              {mode === 'transfer' && destinationWallets.length > 0 && (
                <WalletSelect label="To wallet" value={toWalletId} wallets={destinationWallets} onChange={setToWalletId} />
              )}

              {mode === 'transfer' && destinationWallets.length === 0 && (
                <div className="rounded-[var(--mon-radius-lg)] p-3" style={{ background: 'var(--mon-gold-bg)', border: '1px solid var(--mon-gold-glow)' }}>
                  <p className="text-[13px] font-bold" style={{ color: 'var(--mon-gold)' }}>Add another wallet to transfer</p>
                  <p className="mt-1 text-[12px]" style={{ color: 'var(--mon-text-2)' }}>
                    You currently have only one wallet. Create a Bank, Mobile, or Savings wallet first.
                  </p>
                </div>
              )}

              {mode === 'transfer' ? (
                <AmountInput label="Amount" value={amount} onChange={setAmount} currencySymbol={currencySymbol} />
              ) : (
                <>
                  <AmountInput label="Actual balance" value={balance} onChange={setBalance} currencySymbol={currencySymbol} />
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>
                      Note (optional)
                    </span>
                    <input
                      type="text"
                      value={reconcileNote}
                      onChange={(e) => setReconcileNote(e.target.value)}
                      placeholder="e.g. ATM withdrawal not recorded"
                      className="w-full rounded-[var(--mon-radius-lg)] px-3 py-2 text-[14px] outline-none"
                      style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
                    />
                  </label>
                </>
              )}

              {selectedWallet && (
                <p className="text-[12px]" style={{ color: 'var(--mon-text-3)' }}>
                  Current {selectedWallet.name}: {currencySymbol}{selectedWallet.balance.toLocaleString('en-BD')}
                </p>
              )}
            </div>

            <div className="mt-5 rounded-[var(--mon-radius-xl)] p-3" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>Create wallet</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={newWalletName}
                  onChange={(event) => setNewWalletName(event.target.value)}
                  placeholder="bKash, Bank, Savings"
                  className="rounded-[var(--mon-radius-md)] px-3 py-2 text-[13px] outline-none"
                  style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
                />
                <select
                  value={newWalletType}
                  onChange={(event) => setNewWalletType(event.target.value as Wallet['type'])}
                  className="rounded-[var(--mon-radius-md)] px-3 py-2 text-[13px] outline-none"
                  style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
                >
                  {WALLET_TYPES.map((item) => <option key={item.type} value={item.type}>{item.icon} {item.label}</option>)}
                </select>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  value={newWalletBalance}
                  onChange={(event) => setNewWalletBalance(event.target.value)}
                  placeholder="Opening balance"
                  className="min-w-0 flex-1 rounded-[var(--mon-radius-md)] px-3 py-2 text-[13px] outline-none"
                  style={{ background: 'var(--mon-surface-1)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
                />
                <button
                  type="button"
                  onClick={handleAddWallet}
                  disabled={!newWalletName.trim()}
                  className="rounded-[var(--mon-radius-md)] px-3 py-2 text-[13px] font-bold transition-all disabled:opacity-40"
                  style={{ color: 'var(--mon-gold)', background: 'var(--mon-gold-bg)', border: '1px solid var(--mon-gold-glow)' }}
                >
                  Add
                </button>
              </div>
            </div>

            <button type="submit"
              disabled={mode === 'transfer' && destinationWallets.length === 0}
              className="mt-5 w-full rounded-[var(--mon-radius-xl)] py-3 text-[15px] font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, var(--mon-gold), var(--mon-gold-2))', boxShadow: '0 4px 20px var(--mon-gold-glow)' }}
            >
              Continue
            </button>
          </>
        )}
      </form>
    </div>,
    document.body
  )
}

function WalletSelect({ label, value, wallets, onChange }: { label: string; value: string; wallets: Wallet[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[var(--mon-radius-lg)] px-3 py-2 text-[14px] outline-none"
        style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)', color: 'var(--mon-text-1)' }}
      >
        {wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.icon} {wallet.name}</option>)}
      </select>
    </label>
  )
}

function AmountInput({ label, value, onChange, currencySymbol }: { label: string; value: string; onChange: (value: string) => void; currencySymbol: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--mon-text-3)' }}>{label}</span>
      <div className="flex items-center gap-2 rounded-[var(--mon-radius-lg)] px-3 py-2" style={{ background: 'var(--mon-surface-2)', border: '1px solid var(--mon-border)' }}>
        <span style={{ color: 'var(--mon-text-3)' }}>{currencySymbol}</span>
        <input type="number" value={value} onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[16px] font-bold outline-none"
          style={{ color: 'var(--mon-text-1)' }}
        />
      </div>
    </label>
  )
}