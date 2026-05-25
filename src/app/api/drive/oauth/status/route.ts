import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'selfsync_drive_refresh'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  return NextResponse.json({ connected: Boolean(token) })
}
