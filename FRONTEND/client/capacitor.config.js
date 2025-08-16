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
      launchShowDuration: 3000, // Aumentato per dare più tempo all'app di caricarsi
      backgroundColor: '#ffffff',
      showSpinner: false,
      launchAutoHide: false // Non nascondere automaticamente per evitare crash
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
    webContentsDebuggingEnabled: false,
    // Configurazioni aggiuntive per stabilità
    captureInput: true,
    webContentsDebuggingEnabled: false,
    allowMixedContent: false,
    // Timeout più lunghi per evitare crash
    initialFocus: false
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    // Configurazioni aggiuntive per stabilità
    limitsNavigationsToAppBoundDomains: true
  }
};

module.exports = config;
