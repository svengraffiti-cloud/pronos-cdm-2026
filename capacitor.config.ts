import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lespronosdepapy.app',
  appName: 'Les Pronos de Papy',
  webDir: 'public',
  server: {
    url: 'https://www.lespronosdepapy.com',
    cleartext: false
  }
};

export default config;
