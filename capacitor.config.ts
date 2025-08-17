import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tabletalk.app',
  appName: 'TableTalk',
  webDir: 'FRONTEND/client/build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleMaps: {
      apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#667eea",
      showSpinner: true,
      spinnerColor: "#ffffff"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
