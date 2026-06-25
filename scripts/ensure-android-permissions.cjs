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

const manifestPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'AndroidManifest.xml')

if (!fs.existsSync(manifestPath)) {
  console.log('AndroidManifest.xml not found yet. Run cap:add:android first.')
  process.exit(0)
}

let manifest = fs.readFileSync(manifestPath, 'utf8')

// Permissions to add
const permissions = [
  'android.permission.USE_BIOMETRIC',
  'android.permission.USE_FINGERPRINT',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.CAMERA',
  'android.permission.RECORD_AUDIO',
  'android.permission.MODIFY_AUDIO_SETTINGS',
  'android.permission.WAKE_LOCK',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'android.permission.POST_NOTIFICATIONS',
]

let changed = false
for (const permission of permissions) {
  if (manifest.includes(permission)) continue
  manifest = manifest.replace(
    /<manifest([^>]*)>/,
    `<manifest$1>\n    <uses-permission android:name="${permission}" />`
  )
  changed = true
}

if (changed) {
  fs.writeFileSync(manifestPath, manifest)
  console.log('Android permissions added (biometric + location).')
} else {
  console.log('Android permissions already present.')
}

const stringsPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml')
if (fs.existsSync(stringsPath)) {
  let strings = fs.readFileSync(stringsPath, 'utf8')
  let stringsChanged = false
  if (!strings.includes('title_activity_auth_activity')) {
    strings = strings.replace('</resources>', '    <string name="title_activity_auth_activity">SelfSync authentication</string>\n</resources>')
    stringsChanged = true
    console.log('Android biometric activity title added.')
  }

  const webClientId = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID
    || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    || process.env.GOOGLE_CLIENT_ID
    || ''

  if (webClientId) {
    if (strings.includes('name="server_client_id"')) {
      strings = strings.replace(
        /<string name="server_client_id">[^<]*<\/string>/,
        `<string name="server_client_id">${webClientId}</string>`
      )
    } else {
      strings = strings.replace('</resources>', `    <string name="server_client_id">${webClientId}</string>\n</resources>`)
    }
    stringsChanged = true
    console.log('Android Google Auth server_client_id configured.')
  }

  if (stringsChanged) fs.writeFileSync(stringsPath, strings)
}

if (!manifest.includes('android.permission.WRITE_EXTERNAL_STORAGE')) {
  manifest = manifest.replace(
    /<manifest([^>]*)>/,
    `<manifest$1>\n    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />`
  )
  changed = true
}

if (!manifest.includes('android.hardware.camera')) {
  manifest = manifest.replace(
    /<application/,
    `    <uses-feature android:name="android.hardware.camera" android:required="false" />\n\n    <application`
  )
  changed = true
}

if (!manifest.includes('android.hardware.microphone')) {
  manifest = manifest.replace(
    /<application/,
    `    <uses-feature android:name="android.hardware.microphone" android:required="false" />\n\n    <application`
  )
  changed = true
}

if (changed) {
  fs.writeFileSync(manifestPath, manifest)
}
