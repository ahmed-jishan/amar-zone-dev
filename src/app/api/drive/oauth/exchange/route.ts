import { NextRequest, NextResponse } from 'next/server'
import { exchangeAuthCode } from '@/lib/server/googleDrive'

const COOKIE_NAME = 'selfsync_drive_refresh'
const ONE_YEAR = 60 * 60 * 24 * 365

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = body?.code
    if (!code) {
      return NextResponse.json({ error: 'missing_code' }, { status: 400 })
    }

    const tokens = await exchangeAuthCode(code)
    if (!tokens.refresh_token) {
      return NextResponse.json({ error: 'missing_refresh_token' }, { status: 400 })
    }

    const response = NextResponse.json({ connected: true })
    response.cookies.set(COOKIE_NAME, tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ONE_YEAR,
    })
    return response
  } catch (error) {
    return NextResponse.json({ error: 'exchange_failed' }, { status: 500 })
  }
}
