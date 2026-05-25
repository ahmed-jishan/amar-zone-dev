import 'server-only'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'
const FILE_NAME = 'selfsync-backup.json'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

export async function exchangeAuthCode(code: string) {
  const params = new URLSearchParams({
    code,
    client_id: requireEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID'),
    client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
    redirect_uri: requireEnv('GOOGLE_REDIRECT_URI'),
    grant_type: 'authorization_code',
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`token_exchange_failed:${text}`)
  }

  return res.json() as Promise<{ access_token: string; refresh_token?: string; expires_in: number }>
}

export async function getAccessToken(refreshToken: string) {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: requireEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID'),
    client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
    grant_type: 'refresh_token',
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`refresh_failed:${text}`)
  }

  return res.json() as Promise<{ access_token: string; expires_in: number }>
}

async function findBackupFileId(accessToken: string): Promise<string | null> {
  const q = "name='" + FILE_NAME + "' and 'appDataFolder' in parents"
  const url = new URL(DRIVE_FILES_URL)
  url.searchParams.set('spaces', 'appDataFolder')
  url.searchParams.set('fields', 'files(id,name,modifiedTime)')
  url.searchParams.set('q', q)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`drive_list_failed:${text}`)
  }

  const data = await res.json() as { files?: Array<{ id: string }> }
  return data.files?.[0]?.id ?? null
}

export async function uploadBackup(accessToken: string, content: string) {
  const fileId = await findBackupFileId(accessToken)

  if (fileId) {
    const url = `${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: content,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`drive_update_failed:${text}`)
    }

    return
  }

  const boundary = `selfsync-${Date.now()}`
  const metadata = JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'] })
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`,
    '',
  ].join('\r\n')

  const res = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`drive_create_failed:${text}`)
  }
}

export async function downloadBackup(accessToken: string): Promise<string> {
  const fileId = await findBackupFileId(accessToken)
  if (!fileId) {
    throw new Error('drive_file_missing')
  }

  const res = await fetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`drive_download_failed:${text}`)
  }

  return res.text()
}
