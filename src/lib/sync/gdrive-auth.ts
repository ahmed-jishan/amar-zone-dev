import { Capacitor } from '@capacitor/core'

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: '' | 'consent' | 'select_account' }) => void
}

export type GDriveUserInfo = {
  email?: string
  name?: string
  picture?: string
}

export type GDriveBackupFile = {
  id: string
  name: string
  size?: string
  createdTime?: string
  modifiedTime?: string
}

type TokenState = {
  accessToken: string
  expiresAt: number
  profile?: GDriveUserInfo
}

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const GOOGLE_AUTH_SCOPE = `profile email ${DRIVE_SCOPE}`
const TOKEN_KEY = 'amar-zone-gdrive-token'
const BACKUP_FILE_PREFIX = 'selfsync-backup'
const BACKUP_FILE_ID_KEY = 'amar-zone-gdrive-backup-file-id'
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'
const WEB_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID
  || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  || process.env.GOOGLE_CLIENT_ID
  || ''
const ANDROID_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  || process.env.GOOGLE_ANDROID_CLIENT_ID
  || ''

const REQUEST_TIMEOUT = 30000 // 30 second timeout

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            prompt?: string
            callback: (response: { access_token?: string; expires_in?: number; error?: string }) => void
            error_callback?: () => void
          }) => GoogleTokenClient
          revoke: (token: string, done: () => void) => void
        }
      }
    }
    Capacitor?: {
      isNativePlatform?: () => boolean
      Plugins?: Record<string, any>
    }
  }
}

export class GDriveAuth {
  private tokenClient: GoogleTokenClient | null = null
  private isConnecting = false
  private gisLoadPromise: Promise<void> | null = null
  private nativeInitialized = false

  async connect(): Promise<GDriveUserInfo> {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      throw new Error('Connection already in progress. Please wait.')
    }

    this.isConnecting = true
    let profile: GDriveUserInfo | null = null
    
    try {
      if (this.isNativeAndroid()) {
        profile = await this.connectNative()
        return profile
      }

      await this.ensureGis()
      const token = await this.requestWebToken('consent')
      profile = await this.fetchUserInfo(token.accessToken)
      await this.verifyDriveAccess(token.accessToken)
      this.saveToken({ ...token, profile })
      return profile
    } catch (error) {
      // Clear token on any connection failure
      try {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(BACKUP_FILE_ID_KEY)
      } catch (e) {
        console.warn('Could not clear token on error:', e)
      }
      throw this.toUserFacingAuthError(error)
    } finally {
      this.isConnecting = false
    }
  }

  async disconnect(): Promise<void> {
    const token = this.readToken()
    if (this.isNativeAndroid()) {
      try {
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
        if (typeof GoogleAuth.signOut === 'function') await GoogleAuth.signOut()
      } catch (error) {
        console.warn('Native Google sign-out failed:', error)
      }
    }
    if (token?.accessToken && typeof window !== 'undefined') {
      try {
        window.google?.accounts?.oauth2?.revoke(token.accessToken, () => undefined)
      } catch (error) {
        console.warn('Token revoke failed:', error)
      }
    }
    localStorage.removeItem(TOKEN_KEY)
    this.tokenClient = null
  }

  isConnected(): boolean {
    const token = this.readToken()
    return Boolean(token?.accessToken)
  }

  async getValidToken(): Promise<string> {
    const token = this.readToken()
    if (token && token.expiresAt > Date.now() + 60000) return token.accessToken

    if (this.isNativeAndroid()) {
      try {
        const profile = await this.connectNative(true)
        const refreshed = this.readToken()
        if (refreshed?.accessToken) return refreshed.accessToken
        throw new Error(`Unable to refresh Google token for ${profile.email ?? 'account'}`)
      } catch (error) {
        // If refresh fails, clear the stored token
        localStorage.removeItem(TOKEN_KEY)
        throw error
      }
    }

    try {
      await this.ensureGis()
      const refreshed = await this.requestWebToken('')
      this.saveToken({ ...refreshed, profile: token?.profile })
      return refreshed.accessToken
    } catch (error) {
      // If refresh fails, clear the stored token
      localStorage.removeItem(TOKEN_KEY)
      throw error
    }
  }

  async getUserInfo(): Promise<GDriveUserInfo> {
    const token = this.readToken()
    if (token?.profile?.email) return token.profile
    const accessToken = await this.getValidToken()
    const profile = await this.fetchUserInfo(accessToken)
    this.saveToken({ accessToken, expiresAt: this.readToken()?.expiresAt ?? Date.now() + 3500000, profile })
    return profile
  }

  async uploadToAppDataFolder(name: string, content: string, mimeType = 'application/json'): Promise<GDriveBackupFile> {
    const accessToken = await this.getValidToken()
    const metadata = { name, parents: ['appDataFolder'], mimeType }
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', new Blob([content], { type: mimeType }))

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime,modifiedTime', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    })

    return this.parseDriveResponse<GDriveBackupFile>(response)
  }

  async upsertBackupFile(content: string, backupName: string, mimeType = 'application/json'): Promise<GDriveBackupFile> {
    this.ensureValidJson(content)
    const accessToken = await this.getValidToken()
    const existing = await this.resolveBackupFile(accessToken)

    if (existing?.id) {
      const updateResponse = await fetch(`${DRIVE_UPLOAD_URL}/${encodeURIComponent(existing.id)}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': mimeType,
        },
        body: content,
      })

      if (updateResponse.status === 404) {
        this.clearBackupFileId()
      } else if (!updateResponse.ok) {
        throw await this.toDriveError(updateResponse)
      } else {
        return { ...existing, modifiedTime: new Date().toISOString() }
      }
    }

    const metadata = { name: backupName, parents: ['appDataFolder'], mimeType }
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', new Blob([content], { type: mimeType }))

    const response = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,name,size,createdTime,modifiedTime`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    })

    const file = await this.parseDriveResponse<GDriveBackupFile>(response)
    if (file.id) this.saveBackupFileId(file.id)
    return file
  }

  async listBackups(): Promise<GDriveBackupFile[]> {
    const accessToken = await this.getValidToken()
    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      fields: 'files(id,name,size,createdTime,modifiedTime)',
      orderBy: 'modifiedTime desc',
      q: `name contains '${BACKUP_FILE_PREFIX}' and 'appDataFolder' in parents and trashed=false`,
      pageSize: '10',
    })

    const response = await fetch(`${DRIVE_FILES_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await this.parseDriveResponse<{ files?: GDriveBackupFile[] }>(response)
    return data.files ?? []
  }

  async downloadBackup(): Promise<string> {
    const accessToken = await this.getValidToken()
    const file = await this.resolveBackupFile(accessToken)
    if (!file?.id) throw new Error('drive_file_missing')

    const response = await fetch(`${DRIVE_FILES_URL}/${encodeURIComponent(file.id)}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) throw await this.toDriveError(response)
    return response.text()
  }

  async downloadFile(fileId: string): Promise<string> {
    const accessToken = await this.getValidToken()
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) throw await this.toDriveError(response)
    return response.text()
  }

  async deleteFile(fileId: string): Promise<void> {
    const accessToken = await this.getValidToken()
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) throw await this.toDriveError(response)
  }

  private ensureValidJson(raw: string): void {
    try {
      JSON.parse(raw)
    } catch {
      throw new Error('Backup JSON is invalid and cannot be uploaded.')
    }
  }

  private async resolveBackupFile(accessToken: string): Promise<GDriveBackupFile | null> {
    const cachedId = this.readBackupFileId()
    if (cachedId) {
      const cached = await this.fetchBackupById(accessToken, cachedId)
      if (cached) return cached
      this.clearBackupFileId()
    }

    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      fields: 'files(id,name,size,createdTime,modifiedTime)',
      orderBy: 'modifiedTime desc',
      q: `name contains '${BACKUP_FILE_PREFIX}' and 'appDataFolder' in parents and trashed=false`,
      pageSize: '1',
    })

    const response = await fetch(`${DRIVE_FILES_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await this.parseDriveResponse<{ files?: GDriveBackupFile[] }>(response)
    const file = data.files?.[0] ?? null
    if (file?.id) this.saveBackupFileId(file.id)
    return file
  }

  private async fetchBackupById(accessToken: string, fileId: string): Promise<GDriveBackupFile | null> {
    const params = new URLSearchParams({
      fields: 'id,name,size,createdTime,modifiedTime,trashed',
    })
    const response = await fetch(`${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (response.status === 404) return null
    if (!response.ok) throw await this.toDriveError(response)

    const data = await response.json() as GDriveBackupFile & { trashed?: boolean }
    if (data.trashed || !data.name?.startsWith(BACKUP_FILE_PREFIX)) return null
    return data
  }

  private async requestWebToken(prompt: '' | 'consent'): Promise<{ accessToken: string; expiresAt: number }> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null
      let resolved = false

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId)
      }

      const handleResolve = (value: any) => {
        if (!resolved) {
          resolved = true
          cleanup()
          resolve(value)
        }
      }

      const handleReject = (error: Error) => {
        if (!resolved) {
          resolved = true
          cleanup()
          reject(error)
        }
      }

      // Set timeout for the entire request
      timeoutId = setTimeout(() => {
        handleReject(new Error('Google sign-in request timed out. Please check your internet connection and try again.'))
      }, REQUEST_TIMEOUT)

      try {
        if (!WEB_CLIENT_ID) {
          handleReject(new Error('Missing Google web client ID. Set NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID.'))
          return
        }

        const newTokenClient = window.google?.accounts?.oauth2?.initTokenClient({
          client_id: WEB_CLIENT_ID,
          scope: GOOGLE_AUTH_SCOPE,
          prompt: prompt || undefined,
          callback: (response) => {
            if (response.error) {
              handleReject(new Error(`Google authentication error: ${response.error}`))
              return
            }
            if (!response.access_token) {
              handleReject(new Error('Google sign-in was cancelled or failed to return a token'))
              return
            }
            handleResolve({
              accessToken: response.access_token,
              expiresAt: Date.now() + Math.max((response.expires_in ?? 3600) - 60, 60) * 1000,
            })
          },
          error_callback: () => {
            handleReject(new Error('Could not open Google sign-in dialog. It may have been blocked by your browser.'))
          },
        }) ?? null

        if (!newTokenClient) {
          handleReject(new Error('Google Identity Services is not available'))
          return
        }

        this.tokenClient = newTokenClient
        this.tokenClient.requestAccessToken()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error during Google sign-in'
        handleReject(new Error(`Google sign-in failed: ${message}`))
      }
    })
  }

  private async connectNative(silent = false): Promise<GDriveUserInfo> {
    // Safety check: ensure we're on a native platform
    if (!this.isNativeAndroid()) {
      throw new Error('Native Google Auth is not available on this platform')
    }
    if (!ANDROID_CLIENT_ID) {
      throw new Error('Missing Google Android client ID. Set NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID and rebuild the app.')
    }

    if (!WEB_CLIENT_ID) {
      throw new Error('Missing Google web client ID. Set NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID and rebuild the app.')
    }

    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
    if (!this.nativeInitialized) {
      await GoogleAuth.initialize({
        clientId: WEB_CLIENT_ID,
        androidClientId: ANDROID_CLIENT_ID,
        serverClientId: WEB_CLIENT_ID,
        scopes: ['profile', 'email', DRIVE_SCOPE].join(','),
        forceCodeForRefreshToken: true,
        grantOfflineAccess: true,
      } as any)
      this.nativeInitialized = true
    }

    if (!silent && typeof GoogleAuth.signOut === 'function') {
      try {
        await GoogleAuth.signOut()
      } catch {
        // Fresh sign-in should still continue even if no prior session exists.
      }
    }

    // Handle silent refresh if requested
    if (silent && typeof GoogleAuth.refresh === 'function') {
      try {
        const refreshed = await GoogleAuth.refresh()
        const accessToken = refreshed?.accessToken
        if (accessToken) {
          const profile = await this.fetchUserInfo(accessToken)
          await this.verifyDriveAccess(accessToken)
          this.saveToken({ accessToken, expiresAt: this.getNativeExpiry(refreshed), profile })
          return profile
        }
      } catch (error) {
        // Fall through to interactive sign-in
        console.warn('Silent token refresh failed:', error)
      }
    }

    // Interactive sign-in with timeout protection
    let user: any
    try {
      const signInPromise = GoogleAuth.signIn()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Google sign-in timed out')), REQUEST_TIMEOUT)
      )

      user = await Promise.race([signInPromise, timeoutPromise])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed'

      // Provide more helpful error messages
      if (message.includes('401') || message.includes('403')) {
        throw new Error(
          'Google authentication failed. ' +
          'Please verify your app SHA-1 fingerprint in Google Cloud Console matches your Android build.'
        )
      }
      if (message.includes('status code 10') || message.includes('DEVELOPER_ERROR')) {
        throw new Error(
          'Google sign-in configuration mismatch. ' +
          'Add this SHA-1 to the Android OAuth client for com.selfsync.app in Google Cloud Console: ' +
          '1D:C4:51:9E:BD:2C:8F:EC:25:4C:F8:97:D0:9C:EA:20:AE:8D:7E:7E'
        )
      }
      if (message.includes('no network') || message.includes('timeout') || message.includes('timed out')) {
        throw new Error('Network error or timeout. Please check your internet connection and try again.')
      }
      if (message.includes('cancelled') || message.includes('user_cancelled')) {
        throw new Error('Google sign-in was cancelled.')
      }
      if (message.includes('NETWORK_ERROR')) {
        throw new Error(
          `Google authentication error: ${message}. ` +
          'Please ensure your app is properly configured in Google Cloud Console.'
        )
      }
      if (message.includes('retrieving access token') || message.includes('Something went wrong')) {
        throw new Error(
          'Google connected, but Drive token permission failed. ' +
          'Enable Google Drive API, keep the Web and Android OAuth clients in the same Google Cloud project, ' +
          'and rebuild the APK after adding the APK SHA-1 fingerprint.'
        )
      }

      throw new Error(`Google sign-in failed: ${message}`)
    }

    // Validate the response
    if (!user) {
      throw new Error('Google sign-in returned no user data. Please try again.')
    }

    const accessToken = user.authentication?.accessToken || user.accessToken
    if (!accessToken) {
      throw new Error('Google sign-in did not return an access token. Please try again.')
    }

    const profile = {
      email: user.email,
      name: user.name || user.displayName,
      picture: user.imageUrl,
    }

    await this.verifyDriveAccess(accessToken)
    const expiresAt = this.getNativeExpiry(user.authentication)
    this.saveToken({ accessToken, expiresAt, profile })
    return profile
  }

  private getNativeExpiry(authentication: any): number {
    const expires = Number(authentication?.expires)
    const expiresIn = Number(authentication?.expires_in ?? authentication?.expiresIn)
    if (Number.isFinite(expires) && expires > 0) return expires * 1000
    if (Number.isFinite(expiresIn) && expiresIn > 0) return Date.now() + Math.max(expiresIn - 60, 60) * 1000
    return Date.now() + 3500000
  }

  private isNativeAndroid(): boolean {
    try {
      return typeof window !== 'undefined'
        && Capacitor.isNativePlatform()
        && Capacitor.getPlatform() === 'android'
    } catch {
      return false
    }
  }

  private async ensureGis(): Promise<void> {
    if (typeof window === 'undefined') throw new Error('Google Drive sync requires a browser')
    if (window.google?.accounts?.oauth2) return

    // Use singleton promise to prevent duplicate loading
    if (this.gisLoadPromise) {
      return this.gisLoadPromise
    }

    this.gisLoadPromise = new Promise<void>((resolve, reject) => {
      try {
        const existing = document.querySelector<HTMLScriptElement>(
          'script[src="https://accounts.google.com/gsi/client"]'
        )
        
        // If script exists and is already loaded, resolve immediately
        if (existing) {
          if (window.google?.accounts?.oauth2) {
            this.gisLoadPromise = null
            resolve()
            return
          }
          // Script exists but not loaded yet, wait for it
          const timeoutId = setTimeout(() => {
            reject(new Error('Timeout loading Google Identity Services. Check your internet connection.'))
            this.gisLoadPromise = null
          }, REQUEST_TIMEOUT)

          const checkInterval = setInterval(() => {
            if (window.google?.accounts?.oauth2) {
              clearInterval(checkInterval)
              clearTimeout(timeoutId)
              this.gisLoadPromise = null
              resolve()
            }
          }, 100)
          return
        }

        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true

        const timeoutId = setTimeout(() => {
          reject(new Error('Timeout loading Google Identity Services. Check your internet connection.'))
          this.gisLoadPromise = null
        }, REQUEST_TIMEOUT)

        script.onload = () => {
          clearTimeout(timeoutId)
          this.gisLoadPromise = null
          resolve()
        }
        script.onerror = () => {
          clearTimeout(timeoutId)
          this.gisLoadPromise = null
          reject(new Error('Failed to load Google Identity Services. It may be blocked by your network or adblocker.'))
        }

        document.head.appendChild(script)
      } catch (error) {
        this.gisLoadPromise = null
        reject(
          new Error(
            `Could not initialize Google Identity Services: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        )
      }
    })

    return this.gisLoadPromise
  }

  private async fetchUserInfo(accessToken: string): Promise<GDriveUserInfo> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) {
        console.warn('Could not fetch user info:', response.status)
        return {}
      }
      const data = await response.json()
      return { email: data.email, name: data.name, picture: data.picture }
    } catch (error) {
      console.warn('Error fetching user info:', error)
      return {}
    }
  }

  private async verifyDriveAccess(accessToken: string): Promise<void> {
    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      fields: 'files(id)',
      pageSize: '1',
    })
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) {
      throw await this.toDriveError(response)
    }
  }

  private async parseDriveResponse<T>(response: Response): Promise<T> {
    if (!response.ok) throw await this.toDriveError(response)
    return response.json() as Promise<T>
  }

  private async toDriveError(response: Response): Promise<Error> {
    let message = `Google Drive request failed (${response.status})`
    try {
      const data = await response.json()
      if (data.error?.message) {
        message = data.error.message
      }
    } catch {
      message = response.statusText || message
    }

    if (response.status === 401) {
      message = `${message}. Please reconnect your Google Drive account.`
    } else if (response.status === 403) {
      message = `${message}. Check your Google Drive quota and account permissions.`
    } else if (response.status === 429) {
      message = `${message}. Rate limited. Please try again in a few minutes.`
    }

    return new Error(message)
  }

  private readToken(): TokenState | null {
    if (typeof localStorage === 'undefined') return null
    try {
      const raw = localStorage.getItem(TOKEN_KEY)
      return raw ? JSON.parse(raw) as TokenState : null
    } catch (error) {
      console.warn('Error reading token from storage:', error)
      return null
    }
  }

  private readBackupFileId(): string | null {
    if (typeof localStorage === 'undefined') return null
    try {
      return localStorage.getItem(BACKUP_FILE_ID_KEY)
    } catch (error) {
      console.warn('Error reading backup file id from storage:', error)
      return null
    }
  }

  private saveBackupFileId(fileId: string): void {
    try {
      localStorage.setItem(BACKUP_FILE_ID_KEY, fileId)
    } catch (error) {
      console.warn('Error saving backup file id to storage:', error)
    }
  }

  private clearBackupFileId(): void {
    try {
      localStorage.removeItem(BACKUP_FILE_ID_KEY)
    } catch (error) {
      console.warn('Error clearing backup file id from storage:', error)
    }
  }

  private saveToken(token: TokenState): void {
    try {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
    } catch (error) {
      console.error('Error saving token to storage:', error)
      throw new Error('Could not save authentication token to device storage')
    }
  }

  private toUserFacingAuthError(error: unknown): Error {
    const message = error instanceof Error ? error.message : String(error || 'Google sign-in failed')

    if (message.includes('status code 10') || message.includes('DEVELOPER_ERROR')) {
      return new Error(
        'Google sign-in configuration mismatch. Add this APK keystore SHA-1 to the Android OAuth client for package com.selfsync.app, then rebuild and reinstall the APK.'
      )
    }

    if (message.includes('retrieving access token') || message.includes('Something went wrong')) {
      return new Error(
        'Google Drive permission token failed after account selection. Enable Google Drive API, verify both OAuth clients are in the same project, add the APK SHA-1, then rebuild the APK.'
      )
    }

    if (message.includes('Missing Google')) {
      return new Error(`${message} The APK must be rebuilt after updating GitHub secrets or .env.local.`)
    }

    return error instanceof Error ? error : new Error(message)
  }
}

export const gdriveAuth = new GDriveAuth()
