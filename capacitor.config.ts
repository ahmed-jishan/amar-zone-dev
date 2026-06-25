/// <reference types="@codetrix-studio/capacitor-google-auth" />
import fs from 'fs'
import path from 'path'
import type { CapacitorConfig } from '@capacitor/cli';

const envPath = path.resolve(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([A-Za-z0-9_\.\-]+)\s*=\s*(.*)$/)
    if (!match) return
    const [, key, rawValue] = match
    if (process.env[key] !== undefined) return
    let value = rawValue
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  })
}

const googleAndroidClientId = process.env.NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  || process.env.GOOGLE_ANDROID_CLIENT_ID
  || '';
const googleWebClientId = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID
  || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  || process.env.GOOGLE_CLIENT_ID
  || '';

const config: CapacitorConfig = {
  appId: 'com.selfsync.app',
  appName: 'SelfSync',
  webDir: 'out',
  server: { androidScheme: 'https' },
  plugins: {
    GoogleAuth: {
      clientId: googleWebClientId,
      androidClientId: googleAndroidClientId,
      serverClientId: googleWebClientId,
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.appdata'],
      forceCodeForRefreshToken: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#63f18b',
    },
  },
};
export default config;
