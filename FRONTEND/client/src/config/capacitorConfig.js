// ====================================================================
// PARTE 1: LOGICA DINAMICA PER LA TUA APP (dal vecchio .js)
// Calcola e esporta l'URL del backend che la tua app deve contattare.
// ====================================================================

// Usa l'URL di produzione per default, a meno che non venga passato REACT_APP_API_URL a build-time
const apiUrl = process.env.REACT_APP_API_URL || 'https://tabletalk-app-backend.onrender.com/api';

/**
 * Esportazioni NOMINALI per essere usate nel resto della tua app (es. nel tuo ApiService).
 * Esempio di utilizzo: import { API_URL } from './capacitor.config';
 */
export const API_URL = apiUrl;

// Per compatibilità con i vecchi file, esportiamo anche isNative
// In build time non possiamo rilevare la piattaforma, quindi usiamo false come default
export const isNative = false;

// Manteniamo anche i vecchi export per compatibilità
export const DEV_SERVER_URL = isProduction ? 'https://tabletalk-app-backend.onrender.com' : 'http://192.168.1.224:5001';
export const SERVER_URL = isProduction ? 'https://tabletalk-app-backend.onrender.com' : 'http://192.168.1.224:5001';


// ====================================================================
// PARTE 2: CONFIGURAZIONE NATIVA PER CAPACITOR (dal vecchio .json)
// Configura i plugin nativi e il comportamento dell'app.
// ====================================================================

const config = {
  appId: 'com.TableTalkApp.tabletalk',
  appName: 'TableTalk',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleMaps: {
      apiKey: process.env.MAPS_API_KEY || '' // Usa la variabile d'ambiente per la chiave
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
    allowMixedContent: false, // Impostato a false per maggiore sicurezza
    webContentsDebuggingEnabled: false // Impostato a false per la release finale
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true
  }
};

/**
 * Esportazione di DEFAULT per essere usata da Capacitor stesso durante la build.
 */
export default config;