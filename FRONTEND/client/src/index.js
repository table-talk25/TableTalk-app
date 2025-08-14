// File: src/index.js (Versione Finale e Pulita)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MealsProvider } from './contexts/MealsContext';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
import './i18n';

// Ora importiamo solo il nostro file CSS principale e quello della libreria di notifiche
import './styles/common/index.css'; 
import 'react-toastify/dist/ReactToastify.css';

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Nascondi lo splash e setta status bar chiara appena possibile
const onReady = async () => {
  try { await SplashScreen.hide(); } catch (_) {}
  try { await StatusBar.setStyle({ style: StatusBarStyle.Light }); } catch(_) {}
};

root.render(
  <BrowserRouter>
    <AuthProvider>
      <MealsProvider>
        <App />
      </MealsProvider>
    </AuthProvider>
  </BrowserRouter>
);

// Rimuovi il placeholder HTML non appena React è montato
try {
  const loader = document.getElementById('app-loader');
  if (loader && loader.parentNode) {
    loader.parentNode.removeChild(loader);
  }
} catch (_) {}

// Nascondi anche lo splash nativo (se ancora visibile)
try { onReady && onReady(); } catch(_) {}