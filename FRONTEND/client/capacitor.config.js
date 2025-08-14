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
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '534454809499-4vsllugc4jbuft2n20p5sakupvvdcjrb.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    },
    SignInWithApple: {
      clientId: 'com.tabletalk.socialapp',
      redirectURI: 'https://tabletalk.app/auth/apple/callback',
      scopes: 'email name'
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
