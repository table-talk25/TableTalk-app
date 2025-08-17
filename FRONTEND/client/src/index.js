// File: src/index.js (Versione Finale e Pulita con Sentry)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MealsProvider } from './contexts/MealsContext';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
import { initializeDebugSystem, safeLog } from './utils/debugHelper';
import { initializeSentry } from './config/sentry';
import './i18n';

// Ora importiamo solo il nostro file CSS principale e quello della libreria di notifiche
import './styles/common/index.css'; 
import 'react-toastify/dist/ReactToastify.css';

import App from './App';

// Inizializza il sistema di debug PRIMA di tutto
try {
  initializeDebugSystem();
} catch (error) {
  console.error('Errore nell\'inizializzazione del sistema di debug:', error);
}

// Inizializza Sentry per il monitoraggio degli errori
try {
  const sentryInitialized = initializeSentry();
  if (sentryInitialized) {
    safeLog('info', 'Sentry inizializzato correttamente per il monitoraggio errori');
  } else {
    safeLog('warn', 'Sentry non inizializzato - monitoraggio errori disabilitato');
  }
} catch (error) {
  safeLog('error', 'Errore nell\'inizializzazione di Sentry:', error);
}

const root = ReactDOM.createRoot(document.getElementById('root'));

// Nascondi lo splash e setta status bar chiara appena possibile
const onReady = async () => {
  try { 
    await SplashScreen.hide(); 
    safeLog('info', 'Splash screen nascosto con successo');
  } catch (error) { 
    safeLog('warn', 'Impossibile nascondere splash screen:', error);
  }
  
  try { 
    await StatusBar.setStyle({ style: StatusBarStyle.Light }); 
    safeLog('info', 'Status bar configurata con successo');
  } catch(error) { 
    safeLog('warn', 'Impossibile configurare status bar:', error);
  }
};

// Renderizza l'app con gestione degli errori
try {
  root.render(
    <BrowserRouter>
      <AuthProvider>
        <MealsProvider>
          <App />
        </MealsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
  safeLog('info', 'App renderizzata con successo');
} catch (error) {
  safeLog('error', 'Errore critico durante il rendering dell\'app:', error);
  
  // Fallback: mostra un messaggio di errore
  const errorDiv = document.createElement('div');
  errorDiv.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h2>😔 Errore di caricamento</h2>
      <p>L'app non è riuscita a caricarsi. Prova a riavviarla.</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Riavvia App
      </button>
    </div>
  `;
  document.body.appendChild(errorDiv);
}

// Rimuovi il placeholder HTML non appena React è montato
try {
  const loader = document.getElementById('app-loader');
  if (loader && loader.parentNode) {
    loader.parentNode.removeChild(loader);
    safeLog('info', 'Loader HTML rimosso');
  }
} catch (error) {
  safeLog('warn', 'Impossibile rimuovere loader HTML:', error);
}

// Nascondi anche lo splash nativo (se ancora visibile)
try { 
  onReady && onReady(); 
  safeLog('info', 'Inizializzazione app completata');
} catch(error) { 
  safeLog('error', 'Errore durante l\'inizializzazione finale:', error);
}