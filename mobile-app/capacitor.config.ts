import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitly.app',
  appName: 'Fitly',
  webDir: 'dist/fittrack-pro-mobile/browser',
  // App icon source — run `npx capacitor-assets generate` to auto-generate all sizes
  // from src/assets/mobile_logo.png for both Android and iOS
  server: {
    androidScheme: 'https',
    hostname: 'fitly.app',
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '1011187607007-34hmqenbn4262d5oo9cqnk46689fal1m.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#6C63FF',
      sound: 'beep.wav'
    },
    BackgroundGeolocation: {
      // Android foreground service notification
      notificationTitle: 'FitTrack Pro',
      notificationText: 'Tracking your activity in background',
      notificationIconColor: '#6C63FF'
    }
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
