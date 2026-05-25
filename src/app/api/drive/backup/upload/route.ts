import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, uploadBackup } from '@/lib/server/googleDrive'

const COOKIE_NAME = 'selfsync_drive_refresh'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(COOKIE_NAME)?.value
    if (!refreshToken) {
      return NextResponse.json({ error: 'not_connected' }, { status: 401 })
    }

    const body = await request.json()
    if (!body?.encrypted) {
      return NextResponse.json({ error: 'missing_payload' }, { status: 400 })
    }

    const { access_token } = await getAccessToken(refreshToken)
    const content = JSON.stringify(body.encrypted)
    await uploadBackup(access_token, content)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 })
  }
}
