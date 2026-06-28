import type { BackupPayload } from './types'
import { BACKUP_STORAGE_KEYS } from './types'
import type { Transaction, Wallet } from '@/lib/types'

type MoneyCollection = BackupPayload['money']

const DEFAULT_WALLET: Wallet = {
  id: 'default',
  name: 'Cash',
  type: 'cash',
  balance: 0,
  currency: 'BDT',
  color: '#10b981',
  icon: '$',
  isDefault: true,
}

export function normalizeMoneyCollection(money: MoneyCollection): MoneyCollection {
  const transactions = normalizeTransactions(money.transactions)
  const walletMap = new Map<string, Wallet>()

  for (const wallet of money.wallets) {
    if (!wallet?.id) continue
    walletMap.set(wallet.id, {
      ...wallet,
      balance: safeNumber(wallet.balance),
      isDefault: Boolean(wallet.isDefault),
    })
  }

  if (walletMap.size === 0) {
    walletMap.set(DEFAULT_WALLET.id, DEFAULT_WALLET)
  }

  for (const transaction of transactions) {
    const walletId = getTransactionWalletId(transaction)
    if (!walletMap.has(walletId)) {
      walletMap.set(walletId, {
        ...DEFAULT_WALLET,
        id: walletId,
        name: walletId === 'default' ? DEFAULT_WALLET.name : `Recovered Wallet ${walletId.slice(0, 6)}`,
        isDefault: false,
      })
    }
  }

  const wallets = reconcileWalletBalances(Array.from(walletMap.values()), transactions)
  const hasDefault = wallets.some((wallet) => wallet.isDefault)

  return {
    ...money,
    transactions,
    wallets: wallets.map((wallet, index) => ({
      ...wallet,
      isDefault: hasDefault ? wallet.isDefault : index === 0,
    })),
  }
}

export function normalizeMergedMoneyCollection(
  merged: MoneyCollection,
  incoming: MoneyCollection,
  local: MoneyCollection,
): MoneyCollection {
  const normalizedMerged = normalizeMoneyCollection(merged)
  const incomingLedger = buildLedger(incoming.transactions)
  const localLedger = buildLedger(local.transactions)
  const mergedLedger = buildLedger(normalizedMerged.transactions)
  const incomingWallets = new Map(incoming.wallets.map((wallet) => [wallet.id, wallet]))
  const localWallets = new Map(local.wallets.map((wallet) => [wallet.id, wallet]))

  return {
    ...normalizedMerged,
    wallets: normalizedMerged.wallets.map((wallet) => {
      const localWallet = localWallets.get(wallet.id)
      const incomingWallet = incomingWallets.get(wallet.id)
      const localBaseline = localWallet
        ? safeNumber(localWallet.balance) - (localLedger.get(wallet.id) ?? 0)
        : null
      const incomingBaseline = incomingWallet
        ? safeNumber(incomingWallet.balance) - (incomingLedger.get(wallet.id) ?? 0)
        : null
      const baseline = mergeBaselines(localBaseline, incomingBaseline)

      return {
        ...wallet,
        balance: roundMoney(baseline + (mergedLedger.get(wallet.id) ?? 0)),
      }
    }),
  }
}

export function repairPersistedMoneyConsistency(): boolean {
  if (typeof localStorage === 'undefined') return false

  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEYS.money)
    if (!raw) return false

    const parsed = JSON.parse(raw)
    const state = parsed?.state ?? parsed
    if (!state || typeof state !== 'object') return false

    const normalized = normalizeMoneyCollection({
      transactions: Array.isArray(state.transactions) ? state.transactions : [],
      loans: Array.isArray(state.loans) ? state.loans : [],
      budgets: Array.isArray(state.budgets) ? state.budgets : [],
      savingsGoals: Array.isArray(state.savingsGoals) ? state.savingsGoals : [],
      wallets: Array.isArray(state.wallets) ? state.wallets : [],
      subscriptions: Array.isArray(state.subscriptions) ? state.subscriptions : [],
      insights: Array.isArray(state.insights) ? state.insights : [],
      categoryLimits: Array.isArray(state.categoryLimits) ? state.categoryLimits : [],
      recurringTemplates: Array.isArray(state.recurringTemplates) ? state.recurringTemplates : [],
      assets: Array.isArray(state.assets) ? state.assets : [],
      netWorthHistory: Array.isArray(state.netWorthHistory) ? state.netWorthHistory : [],
    })

    const repaired = {
      ...parsed,
      state: {
        ...state,
        ...normalized,
      },
    }

    localStorage.setItem(BACKUP_STORAGE_KEYS.money, JSON.stringify('state' in parsed ? repaired : repaired.state))
    return true
  } catch {
    return false
  }
}

function normalizeTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.map((transaction) => ({
    ...transaction,
    amount: safeNumber(transaction.amount),
    status: transaction.status || 'completed',
    walletId: getTransactionWalletId(transaction),
  }))
}

function reconcileWalletBalances(wallets: Wallet[], transactions: Transaction[]): Wallet[] {
  const ledgerByWallet = buildLedger(transactions)

  return wallets.map((wallet) => {
    const ledgerBalance = ledgerByWallet.get(wallet.id) ?? 0
    const currentBalance = safeNumber(wallet.balance)
    const baseline = currentBalance === 0 && Math.abs(ledgerBalance) >= 0.01
      ? 0
      : currentBalance - ledgerBalance

    return {
      ...wallet,
      balance: roundMoney(baseline + ledgerBalance),
    }
  })
}

function buildLedger(transactions: Transaction[]): Map<string, number> {
  const ledgerByWallet = new Map<string, number>()

  for (const transaction of transactions) {
    if (transaction.status !== 'completed') continue
    const walletId = getTransactionWalletId(transaction)
    const signedAmount = transaction.type === 'income'
      ? safeNumber(transaction.amount)
      : -safeNumber(transaction.amount)
    ledgerByWallet.set(walletId, roundMoney((ledgerByWallet.get(walletId) ?? 0) + signedAmount))
  }

  return ledgerByWallet
}

function mergeBaselines(localBaseline: number | null, incomingBaseline: number | null): number {
  if (localBaseline === null) return roundMoney(incomingBaseline ?? 0)
  if (incomingBaseline === null) return roundMoney(localBaseline)
  if (Math.abs(localBaseline - incomingBaseline) < 0.01) return roundMoney(localBaseline)
  return Math.abs(incomingBaseline) > Math.abs(localBaseline)
    ? roundMoney(incomingBaseline)
    : roundMoney(localBaseline)
}

function getTransactionWalletId(transaction: Transaction): string {
  return transaction.walletId || 'default'
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}
