import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ehs.permitwork',
  appName: 'Permit to Work',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
