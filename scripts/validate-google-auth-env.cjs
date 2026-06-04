const fs = require('fs')
const path = require('path')

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=\s*(.*)$/)
    if (!match) return
    const [, key, rawValue] = match
    if (process.env[key] !== undefined) return
    let value = rawValue.trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  })
}

const webClientId = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID
  || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  || process.env.GOOGLE_CLIENT_ID
  || ''

const androidClientId = process.env.NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  || process.env.GOOGLE_ANDROID_CLIENT_ID
  || ''

const errors = []

if (!webClientId) {
  errors.push('Missing NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID. Google Drive sync needs the Web OAuth client ID in the APK.')
}

if (!androidClientId) {
  errors.push('Missing NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID. Add the Android OAuth client ID for package com.selfsync.app.')
}

for (const [label, value] of [
  ['NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID', webClientId],
  ['NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', androidClientId],
]) {
  if (value && !/^[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(value)) {
    errors.push(`${label} does not look like a valid Google OAuth client ID.`)
  }
}

if (errors.length > 0) {
  console.error('\nGoogle Auth configuration is incomplete:\n')
  errors.forEach((error) => console.error(`- ${error}`))
  console.error('\nCreate OAuth clients in the same Google Cloud project, enable Google Drive API, and add the APK SHA-1 to the Android client.\n')
  process.exit(1)
}

console.log('Google Auth environment validated.')
