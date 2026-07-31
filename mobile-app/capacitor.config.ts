import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fittrackpro.app',
  appName: 'FitTrack Pro',
  webDir: 'dist/fittrack-pro-mobile/browser',
  // App icon source — run `npx capacitor-assets generate` to auto-generate all sizes
  // from src/assets/mobile_logo.png for both Android and iOS
  plugins: {
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
