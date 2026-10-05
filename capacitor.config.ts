import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartpoultry.app',
  appName: 'Smart Poultry',
  webDir: 'dist',
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'AAB'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#16a34a',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;
