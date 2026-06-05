import { NAMAZ_STORAGE_KEYS } from '@/features/namaz/constants/storageKeys'
import type { Task } from '@/app/(tabs)/tasks/types'
import type { Transaction, Loan, MonthlyBudget, SavingsGoal, Wallet, Subscription, FinancialInsight } from '@/lib/types'
import type { PrayerRecord, NamazSettings } from '@/lib/types'
import type { AppSettings } from '@/features/settings/store/settingsStore'
import type { LifeMode, QuranReciter } from '@/features/namaz/store/prefsStore'

const TEXT_ENCODER = new TextEncoder()
const TEXT_DECODER = new TextDecoder()

const PBKDF2_ITERATIONS = 150000
const SALT_BYTES = 16
const IV_BYTES = 12

export const BACKUP_STORAGE_KEYS = {
  settings: 'selfsync-settings',
  tasks: 'selfsync-tasks',
  money: 'selfsync-money-v2',
  namaz: 'selfsync-namaz',
  namazPrefs: NAMAZ_STORAGE_KEYS.settings,
}

export type PersistedState<T> = {
  state: T
  version?: number
}

export type BackupPayload = {
  version: 1
  createdAt: string
  deviceId: string
  data: {
    settings?: PersistedState<AppSettings>
    tasks?: PersistedState<{ tasks: Task[] }>
    money?: PersistedState<{
      transactions: Transaction[]
      loans: Loan[]
      budgets: MonthlyBudget[]
      savingsGoals: SavingsGoal[]
      wallets: Wallet[]
      subscriptions: Subscription[]
      insights: FinancialInsight[]
    }>
    namaz?: PersistedState<{ records: PrayerRecord[]; settings: NamazSettings }>
    namazPrefs?: PersistedState<{
      location: { latitude: number; longitude: number; city?: string; country?: string; source?: string }
      calculationMethod: number
      madhab: string
      remindersEnabled: boolean
      reminderMinutesBefore: number
      autoDetectLocation: boolean
      ramadanMode: boolean
      travelMode: boolean
      lifeMode: LifeMode
      azanEnabled: boolean
      quranReciter: QuranReciter
    }>
  }
}

export type EncryptedBackup = {
  v: 1
  alg: 'AES-GCM'
  kdf: 'PBKDF2'
  iterations: number
  salt: string
  iv: string
  ciphertext: string
}

export function buildBackupPayload(): BackupPayload {
  ensureBrowser()
  const deviceId = getDeviceId()
  const data: BackupPayload['data'] = {}

  const settings = readPersisted<AppSettings>(BACKUP_STORAGE_KEYS.settings)
  if (settings) data.settings = settings

  const tasks = readPersisted<{ tasks: Task[] }>(BACKUP_STORAGE_KEYS.tasks)
  if (tasks) data.tasks = tasks

  const money = readPersisted<{
    transactions: Transaction[]
    loans: Loan[]
    budgets: MonthlyBudget[]
    savingsGoals: SavingsGoal[]
    wallets: Wallet[]
    subscriptions: Subscription[]
    insights: FinancialInsight[]
  }>(BACKUP_STORAGE_KEYS.money)
  if (money) data.money = money

  const namaz = readPersisted<{ records: PrayerRecord[]; settings: NamazSettings }>(BACKUP_STORAGE_KEYS.namaz)
  if (namaz) data.namaz = namaz

  const namazPrefs = readPersisted<BackupPayload['data']['namazPrefs'] extends PersistedState<infer T> ? T : never>(BACKUP_STORAGE_KEYS.namazPrefs)
  if (namazPrefs) data.namazPrefs = namazPrefs

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    deviceId,
    data,
  }
}

export async function encryptBackup(passphrase: string, payload: BackupPayload): Promise<EncryptedBackup> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await deriveKey(passphrase, salt)
  const plaintext = TEXT_ENCODER.encode(JSON.stringify(payload))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(plaintext))
  return {
    v: 1,
    alg: 'AES-GCM',
    kdf: 'PBKDF2',
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  }
}

export async function decryptBackup(passphrase: string, encrypted: EncryptedBackup): Promise<BackupPayload> {
  if (encrypted.v !== 1 || encrypted.alg !== 'AES-GCM' || encrypted.kdf !== 'PBKDF2') {
    throw new Error('Unsupported backup format')
  }
  const salt = fromBase64(encrypted.salt)
  const iv = fromBase64(encrypted.iv)
  const key = await deriveKey(passphrase, salt, encrypted.iterations)
  const ciphertext = fromBase64(encrypted.ciphertext)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(ciphertext))
  const json = TEXT_DECODER.decode(plaintext)
  return JSON.parse(json) as BackupPayload
}

export function serializeEncryptedBackup(encrypted: EncryptedBackup): string {
  return JSON.stringify(encrypted, null, 2)
}

export function parseEncryptedBackup(text: string): EncryptedBackup {
  return JSON.parse(text) as EncryptedBackup
}

export function mergeBackupPayload(payload: BackupPayload): string[] {
  ensureBrowser()
  const mergedKeys: string[] = []

  if (payload.data.settings) {
    const merged = mergeSettings(readPersisted<AppSettings>(BACKUP_STORAGE_KEYS.settings), payload.data.settings)
    writePersisted(BACKUP_STORAGE_KEYS.settings, merged)
    mergedKeys.push(BACKUP_STORAGE_KEYS.settings)
  }

  if (payload.data.tasks) {
    const merged = mergeTasks(readPersisted<{ tasks: Task[] }>(BACKUP_STORAGE_KEYS.tasks), payload.data.tasks)
    writePersisted(BACKUP_STORAGE_KEYS.tasks, merged)
    mergedKeys.push(BACKUP_STORAGE_KEYS.tasks)
  }

  if (payload.data.money) {
    const merged = mergeMoney(readPersisted<any>(BACKUP_STORAGE_KEYS.money), payload.data.money)
    writePersisted(BACKUP_STORAGE_KEYS.money, merged)
    mergedKeys.push(BACKUP_STORAGE_KEYS.money)
  }

  if (payload.data.namaz) {
    const merged = mergeNamaz(readPersisted<{ records: PrayerRecord[]; settings: NamazSettings }>(BACKUP_STORAGE_KEYS.namaz), payload.data.namaz)
    writePersisted(BACKUP_STORAGE_KEYS.namaz, merged)
    mergedKeys.push(BACKUP_STORAGE_KEYS.namaz)
  }

  if (payload.data.namazPrefs) {
    const merged = mergeNamazPrefs(readPersisted<any>(BACKUP_STORAGE_KEYS.namazPrefs), payload.data.namazPrefs)
    writePersisted(BACKUP_STORAGE_KEYS.namazPrefs, merged)
    mergedKeys.push(BACKUP_STORAGE_KEYS.namazPrefs)
  }

  return mergedKeys
}

/**
 * Replace all local data with the backup data (overwrite, not merge).
 * This is the correct behavior for "Restore" operations.
 */
export function replaceBackupPayload(payload: BackupPayload): string[] {
  ensureBrowser()
  const replacedKeys: string[] = []

  if (payload.data.settings) {
    writePersisted(BACKUP_STORAGE_KEYS.settings, payload.data.settings)
    replacedKeys.push(BACKUP_STORAGE_KEYS.settings)
  }

  if (payload.data.tasks) {
    writePersisted(BACKUP_STORAGE_KEYS.tasks, payload.data.tasks)
    replacedKeys.push(BACKUP_STORAGE_KEYS.tasks)
  }

  if (payload.data.money) {
    writePersisted(BACKUP_STORAGE_KEYS.money, payload.data.money)
    replacedKeys.push(BACKUP_STORAGE_KEYS.money)
  }

  if (payload.data.namaz) {
    writePersisted(BACKUP_STORAGE_KEYS.namaz, payload.data.namaz)
    replacedKeys.push(BACKUP_STORAGE_KEYS.namaz)
  }

  if (payload.data.namazPrefs) {
    writePersisted(BACKUP_STORAGE_KEYS.namazPrefs, payload.data.namazPrefs)
    replacedKeys.push(BACKUP_STORAGE_KEYS.namazPrefs)
  }

  return replacedKeys
}

function mergeSettings(local: PersistedState<AppSettings> | null, incoming: PersistedState<AppSettings>): PersistedState<AppSettings> {
  if (!local) return incoming
  return {
    state: { ...local.state, ...incoming.state },
    version: incoming.version ?? local.version,
  }
}

function mergeTasks(
  local: PersistedState<{ tasks: Task[] }> | null,
  incoming: PersistedState<{ tasks: Task[] }>
): PersistedState<{ tasks: Task[] }> {
  if (!local) return incoming
  const mergedTasks = mergeById(local.state.tasks, incoming.state.tasks, (t) => t.updatedAt || t.createdAt)
  return {
    state: { ...local.state, ...incoming.state, tasks: mergedTasks },
    version: incoming.version ?? local.version,
  }
}

function mergeMoney(
  local: PersistedState<{
    transactions: Transaction[]
    loans: Loan[]
    budgets: MonthlyBudget[]
    savingsGoals: SavingsGoal[]
    wallets: Wallet[]
    subscriptions: Subscription[]
    insights: FinancialInsight[]
  }> | null,
  incoming: PersistedState<{
    transactions: Transaction[]
    loans: Loan[]
    budgets: MonthlyBudget[]
    savingsGoals: SavingsGoal[]
    wallets: Wallet[]
    subscriptions: Subscription[]
    insights: FinancialInsight[]
  }>
): PersistedState<{
  transactions: Transaction[]
  loans: Loan[]
  budgets: MonthlyBudget[]
  savingsGoals: SavingsGoal[]
  wallets: Wallet[]
  subscriptions: Subscription[]
  insights: FinancialInsight[]
}> {
  if (!local) return incoming
  const merged: PersistedState<any> = {
    state: {
      ...local.state,
      ...incoming.state,
      transactions: mergeById(local.state.transactions || [], incoming.state.transactions || [], (t) => t.createdAt || t.date),
      loans: mergeById(local.state.loans || [], incoming.state.loans || [], (l) => l.date),
      budgets: mergeByKey(local.state.budgets || [], incoming.state.budgets || [], (b) => b.month),
      savingsGoals: mergeById(local.state.savingsGoals || [], incoming.state.savingsGoals || [], (g) => g.createdAt),
      wallets: mergeById(local.state.wallets || [], incoming.state.wallets || [], () => ''),
      subscriptions: mergeById(local.state.subscriptions || [], incoming.state.subscriptions || [], (s) => s.nextBillingDate),
      insights: mergeById(local.state.insights || [], incoming.state.insights || [], (i) => i.date),
    },
    version: incoming.version ?? local.version,
  }

  if (merged.state.wallets && merged.state.wallets.length > 0) {
    const hasDefault = merged.state.wallets.some((w: Wallet) => w.isDefault)
    if (!hasDefault) merged.state.wallets[0].isDefault = true
  }

  return merged
}

function mergeNamaz(
  local: PersistedState<{ records: PrayerRecord[]; settings: NamazSettings }> | null,
  incoming: PersistedState<{ records: PrayerRecord[]; settings: NamazSettings }>
): PersistedState<{ records: PrayerRecord[]; settings: NamazSettings }> {
  if (!local) return incoming
  return {
    state: {
      ...local.state,
      ...incoming.state,
      records: mergeByKey(local.state.records || [], incoming.state.records || [], (r) => r.date),
      settings: { ...local.state.settings, ...incoming.state.settings },
    },
    version: incoming.version ?? local.version,
  }
}

function mergeNamazPrefs(
  local: PersistedState<any> | null,
  incoming: PersistedState<any>
): PersistedState<any> {
  if (!local) return incoming
  return {
    state: { ...local.state, ...incoming.state },
    version: incoming.version ?? local.version,
  }
}

function mergeById<T extends { id: string }>(
  local: T[],
  incoming: T[],
  getUpdatedAt: (item: T) => string | undefined
): T[] {
  const map = new Map<string, T>()
  local.forEach((item) => map.set(item.id, item))
  incoming.forEach((item) => {
    const existing = map.get(item.id)
    if (!existing) {
      map.set(item.id, item)
      return
    }
    const existingTime = parseTime(getUpdatedAt(existing))
    const incomingTime = parseTime(getUpdatedAt(item))
    if (incomingTime === null && existingTime === null) {
      map.set(item.id, item)
      return
    }
    if (incomingTime !== null && (existingTime === null || incomingTime >= existingTime)) {
      map.set(item.id, item)
      return
    }
  })
  return Array.from(map.values())
}

function mergeByKey<T>(local: T[], incoming: T[], getKey: (item: T) => string): T[] {
  const map = new Map<string, T>()
  local.forEach((item) => map.set(getKey(item), item))
  incoming.forEach((item) => map.set(getKey(item), item))
  return Array.from(map.values())
}

function parseTime(value?: string): number | null {
  if (!value) return null
  const t = Date.parse(value)
  return Number.isNaN(t) ? null : t
}

function readPersisted<T>(key: string): PersistedState<T> | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PersistedState<T>
  } catch {
    return null
  }
}

function writePersisted<T>(key: string, value: PersistedState<T>) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getDeviceId(): string {
  const key = 'selfsync-device-id'
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  localStorage.setItem(key, id)
  return id
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations = PBKDF2_ITERATIONS) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(TEXT_ENCODER.encode(passphrase)),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function ensureBrowser() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    throw new Error('Backup utilities require browser environment')
  }
}