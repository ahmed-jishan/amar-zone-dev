import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.selfsync.app',
  appName: 'SelfSync',
  webDir: 'out',
  server: { androidScheme: 'https' },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#63f18b',
    },
  },
};
export default config;
