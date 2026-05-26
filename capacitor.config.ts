/// <reference types="@codetrix-studio/capacitor-google-auth" />
import type { CapacitorConfig } from '@capacitor/cli';

const googleAndroidClientId = process.env.NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  || process.env.GOOGLE_CLIENT_ID;
const googleWebClientId = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID
  || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  || process.env.GOOGLE_CLIENT_ID;

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
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#63f18b',
    },
  },
};
export default config;
