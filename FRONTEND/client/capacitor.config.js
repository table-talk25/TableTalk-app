// Configurazione Capacitor diretta
const devServerUrl = process.env.DEV_SERVER_URL || '';
const config = {
  appId: 'com.tabletalk.socialapp',
  appName: 'TableTalk Social',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    ...(devServerUrl ? { url: devServerUrl, cleartext: true } : {})
  },
  plugins: {
    GoogleMaps: {
      apiKey: process.env.MAPS_API_KEY || ''
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: [
        "badge",
        "sound", 
        "alert"
      ]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF"
    }
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true
  }
};

module.exports = config;
