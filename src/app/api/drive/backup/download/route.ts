import { NextRequest, NextResponse } from 'next/server'
import { downloadBackup, getAccessToken } from '@/lib/server/googleDrive'

const COOKIE_NAME = 'selfsync_drive_refresh'

export async function GET(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(COOKIE_NAME)?.value
    if (!refreshToken) {
      return NextResponse.json({ error: 'not_connected' }, { status: 401 })
    }

    const { access_token } = await getAccessToken(refreshToken)
    const content = await downloadBackup(access_token)
    const encrypted = JSON.parse(content)

    return NextResponse.json({ encrypted })
  } catch (error) {
    return NextResponse.json({ error: 'download_failed' }, { status: 500 })
  }
}
