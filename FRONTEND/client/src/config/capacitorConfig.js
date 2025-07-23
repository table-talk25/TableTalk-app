import { Capacitor } from '@capacitor/core';

// 1. Controlliamo se l'app è nativa (su telefono) o web
export const isNative = Capacitor.isNativePlatform();

// 2. Definiamo gli URL separatamente
// Per il telefono, usiamo l'IP del tuo computer
export const DEV_SERVER_URL = 'http://192.168.1.151:5001';
// Per il browser sul PC, usiamo localhost
export const SERVER_URL = 'http://localhost:5001';