import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trustlink.app',
  appName: 'TrustLink',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
