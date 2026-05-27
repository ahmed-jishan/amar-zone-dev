const fs = require('fs')
const path = require('path')

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
  if (!strings.includes('title_activity_auth_activity')) {
    strings = strings.replace('</resources>', '    <string name="title_activity_auth_activity">SelfSync authentication</string>\n</resources>')
    fs.writeFileSync(stringsPath, strings)
    console.log('Android biometric activity title added.')
  }
}
