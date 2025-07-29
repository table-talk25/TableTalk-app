import { Capacitor } from '@capacitor/core';

// 1. Controlliamo direttamente se la variabile d'ambiente di produzione ESISTE
const isProduction = !!process.env.REACT_APP_API_URL;

// 2. Controlliamo se l'app è nativa (iOS/Android) o web
const isNative = Capacitor.isNativePlatform();

// 3. Decidiamo quale URL usare
let apiUrl;

if (isProduction) {
  // Se la variabile esiste, siamo per forza in produzione (su Render). Usiamo quella.
  apiUrl = process.env.REACT_APP_API_URL;
} else {
  // Altrimenti, siamo in sviluppo (sul tuo computer)
  if (isNative) {
    // App nativa su un telefono, collegata al Wi-Fi
    apiUrl = 'http://192.168.1.45:5001/api'; // Assicurati che l'IP sia quello del tuo PC
  } else {
    // App aperta nel browser del tuo PC
    apiUrl = 'http://localhost:5001/api';
  }
}

// 4. Esportiamo le variabili finali
export const API_URL = apiUrl;
export { isNative };
export const IS_NATIVE_PLATFORM = isNative;

// Manteniamo anche i vecchi export per compatibilità
export const DEV_SERVER_URL = isProduction ? 'https://tabletalk-app-backend.onrender.com' : 'http://192.168.1.45:5001';
export const SERVER_URL = isProduction ? 'https://tabletalk-app-backend.onrender.com' : 'http://192.168.1.45:5001';