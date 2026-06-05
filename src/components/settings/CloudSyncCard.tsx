'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Cloud, CloudOff, Loader2, LogOut, RotateCw, ShieldCheck,
  CheckCircle2, AlertTriangle, XCircle, WifiOff, Clock, Database,
  HardDrive, ChevronDown, ChevronUp,
} from 'lucide-react'
import { gdriveAuth } from '@/lib/sync/gdrive-auth'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { collectBackupPayload, getBackupCounts, getTotalAmount } from '@/lib/backup/collector'
import { getPendingChangesCount } from '@/lib/sync/sync-engine'
import type { SyncState } from '@/lib/sync/sync-engine'
import SyncDialog from '@/components/sync/SyncDialog'
import BackupListDialog from '@/components/sync/BackupListDialog'

type HealthStatus = 'healthy' | 'warning' | 'error' | 'inactive'

export default function CloudSyncCard() {
  const [connecting, setConnecting] = useState(false)
  const [syncOpen, setSyncOpen] = useState(false)
  const [backupsOpen, setBackupsOpen] = useState(false)
  const [error, setError] = useState('')
  const [backupRefreshKey, setBackupRefreshKey] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [status, setStatus] = useState<SyncState>('offline')
  const settings = useSettingsStore()

  // Recalculate pending changes
  const refreshPending = useCallback(() => {
    setPendingCount(getPendingChangesCount())
    setStatus(settings.gdriveConnected ? (pendingCount > 0 ? 'pending' : 'synced') : 'offline')
  }, [settings.gdriveConnected, pendingCount])

  useEffect(() => {
    refreshPending()
    const interval = setInterval(refreshPending, 10000) // every 10s
    return () => clearInterval(interval)
  }, [refreshPending])

  const connect = async () => {
    setConnecting(true)
    setError('')
    try {
      const profile = await gdriveAuth.connect()
      settings.setGDriveConnected(profile)
      setStatus('synced')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect Google Drive.')
      setStatus('offline')
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = async () => {
    setConnecting(true)
    try {
      await gdriveAuth.disconnect()
      settings.disconnectGDrive()
      setStatus('offline')
    } finally {
      setConnecting(false)
    }
  }

  const getStatusConfig = (): { icon: React.ReactNode; label: string; color: string; health: HealthStatus } => {
    if (!settings.gdriveConnected) {
      return {
        icon: <CloudOff size={18} />,
        label: 'Not Connected',
        color: 'var(--st-text-3)',
        health: 'inactive',
      }
    }
    if (status === 'syncing') return {
      icon: <Loader2 size={18} className="animate-spin" />,
      label: 'Syncing...',
      color: 'var(--st-accent)',
      health: 'warning',
    }
    if (status === 'pending') return {
      icon: <AlertTriangle size={18} />,
      label: `${pendingCount} Pending Changes`,
      color: '#f59e0b',
      health: 'warning',
    }
    if (status === 'failed') return {
      icon: <XCircle size={18} />,
      label: 'Sync Failed',
      color: 'var(--st-danger)',
      health: 'error',
    }
    return {
      icon: <CheckCircle2 size={18} />,
      label: 'All Synced',
      color: 'var(--st-success)',
      health: 'healthy',
    }
  }

  const statusConfig = getStatusConfig()
  const localPayload = collectBackupPayload()
  const localCounts = getBackupCounts(localPayload)
  const localAmount = getTotalAmount(localPayload)
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const totalRecords =
    localCounts.tasks + localCounts.transactions + localCounts.loans +
    localCounts.budgets + localCounts.savingsGoals + localCounts.wallets +
    localCounts.subscriptions + localCounts.namazDays + localCounts.namazRecords

  const formatBytes = () => {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('selfsync') || key.startsWith('namaz') || key.startsWith('money_') || key.startsWith('amar'))) {
        total += (localStorage.getItem(key) || '').length
      }
    }
    if (total < 1024) return `${total} B`
    if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`
    return `${(total / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <section className="st-section">
      <div className="st-section-head">
        <span className="st-section-icon">{settings.gdriveConnected ? <Cloud size={15} /> : <CloudOff size={15} />}</span>
        <span className="st-section-title">Cloud & Backup</span>
      </div>
      <div className="p-4">
        <div className="st-cloud-card overflow-hidden">
          {/* ── Health Status Banner ── */}
          <div
            className="st-cloud-health-banner"
            style={{
              background: statusConfig.health === 'healthy'
                ? 'color-mix(in srgb, var(--st-success) 10%, transparent 90%)'
                : statusConfig.health === 'warning'
                  ? 'color-mix(in srgb, #f59e0b 10%, transparent 90%)'
                  : statusConfig.health === 'error'
                    ? 'color-mix(in srgb, var(--st-danger) 10%, transparent 90%)'
                    : 'color-mix(in srgb, var(--st-text-3) 8%, transparent 92%)',
            }}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div style={{ color: statusConfig.color }}>{statusConfig.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: statusConfig.color }}>{statusConfig.label}</span>
                  {statusConfig.health === 'healthy' && <span className="st-health-badge">100%</span>}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--st-text-3)' }}>
                  {settings.lastSyncAt
                    ? `Last sync: ${new Date(settings.lastSyncAt).toLocaleString()}`
                    : 'Never synced'}
                </div>
              </div>
            </div>
          </div>

          {/* ── Connected / Not Connected ── */}
          {!settings.gdriveConnected ? (
            <div className="p-4 space-y-4">
              <div>
                <div className="st-cloud-title">Google Drive Sync</div>
                <p className="st-cloud-sub mt-1">
                  Your data is encrypted on your device before uploading.
                </p>
              </div>
              {error && (
                <div className="st-cloud-error">
                  <p className="font-semibold">Connection failed</p>
                  <p className="mt-1 text-xs">{error}</p>
                </div>
              )}
              <button type="button" onClick={connect} disabled={connecting} className="mo-submit mo-submit--neu flex items-center justify-center gap-2 w-full">
                {connecting ? <Loader2 className="animate-spin" size={16} /> : <Cloud size={16} />}
                Connect Google Drive
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* ── Profile & Stats ── */}
              <div className="flex items-center gap-3">
                {settings.gdriveUserPicture ? (
                  <img src={settings.gdriveUserPicture} alt="" className="h-12 w-12 rounded-2xl object-cover ring-2 ring-[var(--st-accent-border)]" />
                ) : (
                  <div className="st-cloud-avatar-icon h-12 w-12">
                    <ShieldCheck size={22} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="st-cloud-user-name">{settings.gdriveUserName || 'Connected'}</div>
                  <div className="st-cloud-user-email">{settings.gdriveEmail}</div>
                </div>
              </div>

              {/* ── Storage & Record Stats ── */}
              <div className="grid grid-cols-2 gap-3">
                <div className="st-cloud-stat">
                  <HardDrive size={14} />
                  <div>
                    <div className="st-cloud-stat-value">{formatBytes()}</div>
                    <div className="st-cloud-stat-label">Storage Used</div>
                  </div>
                </div>
                <div className="st-cloud-stat">
                  <Database size={14} />
                  <div>
                    <div className="st-cloud-stat-value">{totalRecords.toLocaleString()}</div>
                    <div className="st-cloud-stat-label">Records</div>
                  </div>
                </div>
              </div>

              {/* ── Record Breakdown (Collapsible) ── */}
              <div className="st-cloud-breakdown">
                <button
                  type="button"
                  onClick={() => setBreakdownOpen(!breakdownOpen)}
                  className="st-cloud-breakdown-head"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--st-text-2)]">Record Breakdown</span>
                  {breakdownOpen ? <ChevronUp size={15} className="text-[var(--st-text-3)]" /> : <ChevronDown size={15} className="text-[var(--st-text-3)]" />}
                </button>

                {breakdownOpen && (
                  <div className="st-cloud-breakdown-body">
                    <div className="st-cloud-breakdown-row">
                      <span>Tasks</span>
                      <span className="font-semibold">{localCounts.tasks}</span>
                    </div>
                    <div className="st-cloud-breakdown-row">
                      <span>Transactions</span>
                      <span className="font-semibold">{localCounts.transactions}</span>
                    </div>
                    <div className="st-cloud-breakdown-row">
                      <span>Loans</span>
                      <span className="font-semibold">{localCounts.loans}</span>
                    </div>
                    <div className="st-cloud-breakdown-row">
                      <span>Budgets</span>
                      <span className="font-semibold">{localCounts.budgets}</span>
                    </div>
                    <div className="st-cloud-breakdown-row">
                      <span>Savings Goals</span>
                      <span className="font-semibold">{localCounts.savingsGoals}</span>
                    </div>
                    <div className="st-cloud-breakdown-row">
                      <span>Wallets</span>
                      <span className="font-semibold">{localCounts.wallets}</span>
                    </div>
                    <div className="st-cloud-breakdown-row">
                      <span>Subscriptions</span>
                      <span className="font-semibold">{localCounts.subscriptions}</span>
                    </div>
                    <div className="st-cloud-breakdown-row">
                      <span>Namaz Logs</span>
                      <span className="font-semibold">{localCounts.namazDays}</span>
                    </div>
                    <div className="st-cloud-breakdown-row">
                      <span>Prayer Days</span>
                      <span className="font-semibold">{localCounts.namazRecords}</span>
                    </div>
                    <div className="st-cloud-breakdown-row border-t border-[var(--st-border-strong)] pt-2 mt-1">
                      <span className="font-bold">Financial Total</span>
                      <span className="font-bold">{localAmount.toLocaleString()} ৳</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Sync & Backup Actions ── */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSyncOpen(true)}
                  className="mo-submit mo-submit--neu flex items-center justify-center gap-2 px-3 py-3 text-sm"
                >
                  <RotateCw size={15} /> Sync Changes
                </button>
                <button
                  type="button"
                  onClick={() => setBackupsOpen(true)}
                  className="mo-submit mo-submit--cancel px-3 py-3 text-sm"
                >
                  Backup History
                </button>
              </div>

              {/* ── Auto Sync Toggles ── */}
              <div className="st-cloud-toggle-section">
                <ToggleRow label="Auto sync" checked={settings.autoSync} onChange={settings.setAutoSync} />
                <ToggleRow label="WiFi only" checked={settings.wifiOnlySync} onChange={(value) => settings.update({ wifiOnlySync: value })} />
              </div>

              {/* ── Disconnect ── */}
              <button type="button" onClick={disconnect} disabled={connecting} className="mo-submit mo-submit--cancel flex items-center justify-center gap-2 w-full">
                {connecting ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      <SyncDialog
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        onSuccess={() => {
          setBackupRefreshKey((key) => key + 1)
          setStatus('syncing')
          setTimeout(() => {
            setPendingCount(0)
            setStatus('synced')
            refreshPending()
          }, 2000)
        }}
      />
      <BackupListDialog
        open={backupsOpen}
        onClose={() => setBackupsOpen(false)}
        refreshKey={backupRefreshKey}
      />
    </section>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="st-toggle-label">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={`st-switch ${checked ? 'st-switch--on' : ''}`} aria-pressed={checked}>
        <span className="st-switch-thumb" />
      </button>
    </div>
  )
}