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

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const TOKEN_KEY = 'amar-zone-gdrive-token'
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID
  || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  || process.env.GOOGLE_CLIENT_ID
  || '1015865101368-f64lta5461e0ns0m2mj0mtejaqqugodh.apps.googleusercontent.com'

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

  async connect(): Promise<GDriveUserInfo> {
    if (this.isNativeAndroid()) {
      const profile = await this.connectNative()
      return profile
    }

    await this.ensureGis()
    const token = await this.requestWebToken('consent')
    const profile = await this.fetchUserInfo(token.accessToken)
    this.saveToken({ ...token, profile })
    return profile
  }

  async disconnect(): Promise<void> {
    const token = this.readToken()
    if (token?.accessToken && typeof window !== 'undefined') {
      window.google?.accounts?.oauth2?.revoke(token.accessToken, () => undefined)
    }
    localStorage.removeItem(TOKEN_KEY)
  }

  isConnected(): boolean {
    const token = this.readToken()
    return Boolean(token?.accessToken)
  }

  async getValidToken(): Promise<string> {
    const token = this.readToken()
    if (token && token.expiresAt > Date.now() + 60000) return token.accessToken

    if (this.isNativeAndroid()) {
      const profile = await this.connectNative(true)
      const refreshed = this.readToken()
      if (refreshed?.accessToken) return refreshed.accessToken
      throw new Error(`Unable to refresh Google token for ${profile.email ?? 'account'}`)
    }

    await this.ensureGis()
    const refreshed = await this.requestWebToken('')
    this.saveToken({ ...refreshed, profile: token?.profile })
    return refreshed.accessToken
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

  async listBackups(): Promise<GDriveBackupFile[]> {
    const accessToken = await this.getValidToken()
    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      fields: 'files(id,name,size,createdTime,modifiedTime)',
      orderBy: 'createdTime desc',
      q: "name contains 'amar-zone-backup-' and trashed=false",
      pageSize: '50',
    })
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await this.parseDriveResponse<{ files: GDriveBackupFile[] }>(response)
    return data.files
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

  private async requestWebToken(prompt: '' | 'consent'): Promise<{ accessToken: string; expiresAt: number }> {
    const client = this.tokenClient ?? window.google?.accounts?.oauth2?.initTokenClient({
      client_id: CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: () => undefined,
    })
    if (!client) throw new Error('Google Identity Services is not available')
    this.tokenClient = client

    return new Promise((resolve, reject) => {
      this.tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
        client_id: CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error || 'Google sign-in was cancelled'))
            return
          }
          resolve({
            accessToken: response.access_token,
            expiresAt: Date.now() + Math.max((response.expires_in ?? 3600) - 60, 60) * 1000,
          })
        },
      }) ?? null
      this.tokenClient?.requestAccessToken({ prompt })
    })
  }

  private async connectNative(silent = false): Promise<GDriveUserInfo> {
    // Safety check: ensure we're on a native platform
    if (!this.isNativeAndroid()) {
      throw new Error('Native Google Auth is not available on this platform')
    }

    // Try to get the GoogleAuth plugin first, fallback to GoogleLogin
    let plugin: any = null
    try {
      plugin = window.Capacitor?.Plugins?.GoogleAuth
    } catch {
      // Plugin might not be loaded yet
    }

    if (!plugin) {
      try {
        plugin = window.Capacitor?.Plugins?.GoogleLogin
      } catch {
        // Plugin might not be loaded yet
      }
    }

    if (!plugin?.signIn) {
      throw new Error('Google Login plugin is not available. Ensure GoogleAuth is properly configured in your Android build.')
    }

    // Handle silent refresh if requested
    if (silent && plugin.refresh) {
      try {
        const refreshed = await plugin.refresh()
        const accessToken = refreshed?.accessToken
        if (accessToken) {
          const profile = await this.fetchUserInfo(accessToken)
          this.saveToken({ accessToken, expiresAt: Date.now() + 3500000, profile })
          return profile
        }
      } catch (error) {
        // Fall through to interactive sign-in
        console.warn('Silent token refresh failed:', error)
      }
    }

    // Interactive sign-in
    let user: any
    try {
      user = await plugin.signIn()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed'
      
      // Provide more helpful error messages
      if (message.includes('401') || message.includes('403')) {
        throw new Error('Google authentication failed. Check your app SHA-1 and client ID in Google Cloud Console.')
      }
      if (message.includes('no network') || message.includes('timeout')) {
        throw new Error('Network error. Check your internet connection.')
      }
      if (message.includes('cancelled')) {
        throw new Error('Google sign-in was cancelled.')
      }
      
      throw new Error(`Google sign-in failed: ${message}`)
    }

    // Validate the response
    if (!user) {
      throw new Error('Google sign-in returned no user data.')
    }

    const accessToken = user.authentication?.accessToken || user.accessToken
    if (!accessToken) {
      throw new Error('Google sign-in did not return an access token. Please try again.')
    }

    const expiresAt = Date.now() + 3500000
    const profile = { 
      email: user.email, 
      name: user.name || user.displayName, 
      picture: user.imageUrl 
    }

    this.saveToken({ accessToken, expiresAt, profile })
    return profile
  }

  private isNativeAndroid(): boolean {
    try {
      return typeof window !== 'undefined' && Boolean(window.Capacitor?.isNativePlatform?.())
    } catch {
      return false
    }
  }

  private async ensureGis(): Promise<void> {
    if (typeof window === 'undefined') throw new Error('Google Drive sync requires a browser')
    if (window.google?.accounts?.oauth2) return

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]')
      const script = existing ?? document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Unable to load Google Identity Services'))
      if (!existing) document.head.appendChild(script)
    })
  }

  private async fetchUserInfo(accessToken: string): Promise<GDriveUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) return {}
    const data = await response.json()
    return { email: data.email, name: data.name, picture: data.picture }
  }

  private async parseDriveResponse<T>(response: Response): Promise<T> {
    if (!response.ok) throw await this.toDriveError(response)
    return response.json() as Promise<T>
  }

  private async toDriveError(response: Response): Promise<Error> {
    let message = `Google Drive request failed (${response.status})`
    try {
      const data = await response.json()
      message = data.error?.message || message
    } catch {
      message = response.statusText || message
    }
    if (response.status === 403) message = `${message}. Check Drive quota and account permissions.`
    return new Error(message)
  }

  private readToken(): TokenState | null {
    if (typeof localStorage === 'undefined') return null
    try {
      const raw = localStorage.getItem(TOKEN_KEY)
      return raw ? JSON.parse(raw) as TokenState : null
    } catch {
      return null
    }
  }

  private saveToken(token: TokenState): void {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
  }
}

export const gdriveAuth = new GDriveAuth()
