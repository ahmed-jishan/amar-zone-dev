'use client'

import { useState } from 'react'
import { Cloud, CloudOff, Loader2, LogOut, RotateCw, ShieldCheck } from 'lucide-react'
import { gdriveAuth } from '@/lib/sync/gdrive-auth'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import SyncDialog from '@/components/sync/SyncDialog'
import BackupListDialog from '@/components/sync/BackupListDialog'

export default function CloudSyncCard() {
  const [connecting, setConnecting] = useState(false)
  const [syncOpen, setSyncOpen] = useState(false)
  const [backupsOpen, setBackupsOpen] = useState(false)
  const [error, setError] = useState('')
  const [backupRefreshKey, setBackupRefreshKey] = useState(0)
  const settings = useSettingsStore()

  const connect = async () => {
    setConnecting(true)
    setError('')
    try {
      const profile = await gdriveAuth.connect()
      settings.setGDriveConnected(profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect Google Drive.')
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = async () => {
    setConnecting(true)
    try {
      await gdriveAuth.disconnect()
      settings.disconnectGDrive()
    } finally {
      setConnecting(false)
    }
  }

  return (
    <section className="st-section">
      <div className="st-section-head">
        <span className="st-section-icon">{settings.gdriveConnected ? <Cloud size={15} /> : <CloudOff size={15} />}</span>
        <span className="st-section-title">Cloud & Backup</span>
      </div>
      <div className="p-4">
        <div className="st-cloud-card p-4">
          {!settings.gdriveConnected ? (
            <div className="space-y-4">
              <div>
                <div className="st-cloud-title">Google Drive sync</div>
                <p className="st-cloud-sub">
                  Your data is encrypted on your device before uploading. We never see your data.
                </p>
              </div>
              {error && (
                <div className="st-cloud-error">
                  <p className="font-semibold">Google Drive connection failed</p>
                  <p className="mt-1">{error}</p>
                  <ul className="st-cloud-error-ul">
                    <li>Google Drive API must be enabled in the same Google Cloud project.</li>
                    <li>Android OAuth client must use package com.selfsync.app and this APK keystore SHA-1.</li>
                    <li>Rebuild and reinstall the APK after changing OAuth secrets.</li>
                  </ul>
                </div>
              )}
              <button type="button" onClick={connect} disabled={connecting} className="mo-submit mo-submit--neu flex items-center justify-center gap-2">
                {connecting ? <Loader2 className="animate-spin" size={16} /> : <Cloud size={16} />}
                Connect Google Drive
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {settings.gdriveUserPicture ? (
                  <img src={settings.gdriveUserPicture} alt="" className="h-11 w-11 rounded-2xl object-cover" />
                ) : (
                  <div className="st-cloud-avatar-icon">
                    <ShieldCheck size={20} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="st-cloud-user-name">{settings.gdriveUserName || 'Google Drive connected'}</div>
                  <div className="st-cloud-user-email">{settings.gdriveEmail}</div>
                  <div className="st-cloud-last-sync">
                    Last sync: {settings.lastSyncAt ? new Date(settings.lastSyncAt).toLocaleString() : 'Never'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setSyncOpen(true)} className="mo-submit mo-submit--neu flex items-center justify-center gap-2 px-3 py-3 text-sm">
                  <RotateCw size={15} /> Sync Now
                </button>
                <button type="button" onClick={() => setBackupsOpen(true)} className="mo-submit mo-submit--cancel px-3 py-3 text-sm">View Backups</button>
              </div>

              <div className="st-cloud-toggle-section">
                <ToggleRow label="Auto sync" checked={settings.autoSync} onChange={settings.setAutoSync} />
                <ToggleRow label="WiFi only" checked={settings.wifiOnlySync} onChange={(value) => settings.update({ wifiOnlySync: value })} />
              </div>

              <button type="button" onClick={disconnect} disabled={connecting} className="mo-submit mo-submit--cancel flex items-center justify-center gap-2">
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
        onSuccess={() => setBackupRefreshKey((key) => key + 1)}
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
