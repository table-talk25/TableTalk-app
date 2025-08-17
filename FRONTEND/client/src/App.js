// File: src/App.js (Versione Aggiornata con Profilo Pubblico/Privato e Sentry)
import TestPage from './pages/TestPage'; 

import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { NotificationProvider } from './contexts/NotificationContext'; // <-- 1. IMPORTA

// Import dei Componenti di Layout (statici) e Pagine (lazy)
import Layout from './components/layout/Layout';
import PrivateRoute from './components/common/PrivateRoute';
import { App as CapacitorApp } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import usePushPermission from './hooks/usePushPermission';
// Providers sono già montati in index.js
import Spinner from './components/common/Spinner';
import DeleteAccountPage from './pages/DeleteAccountPage';

// Import dell'ErrorBoundary integrato con Sentry
import ErrorBoundary from './components/common/ErrorBoundary';

// ErrorBoundary integrato con Sentry è ora importato da './components/common/ErrorBoundary'

const HomePage = lazy(() => import('./pages/Home'));
const LoginPage = lazy(() => import('./pages/Auth/Login'));
const RegisterPage = lazy(() => import('./pages/Auth/Register'));
const ForgotPasswordPage = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('./pages/Auth/ResetPassword'));
const ProfilePage = lazy(() => import('./pages/Profile')); // Pagina "Modifica Profilo"
const CompleteProfilePage = lazy(() => import('./pages/Profile/CompleteProfilePage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfile'));
const MealsPage = lazy(() => import('./pages/Meals/MealsPage'));
const SearchMealsPage = lazy(() => import('./pages/Meals/SearchMealsPage'));
const MealDetailPage = lazy(() => import('./pages/Meals/MealDetailPage'));
const CreateMealPage = lazy(() => import('./pages/Meals/CreateMealPage'));
const EditMealPage = lazy(() => import('./pages/Meals/EditMealPage'));
const MealHistoryPage = lazy(() => import('./pages/Meals/MealHistoryPage'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));
const VideoCallPage = lazy(() => import('./pages/VideoCallPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsAndConditionsPage = lazy(() => import('./pages/TermsAndConditionsPage'));

const App = () => {
  console.log('--- L\'APP SI STA CARICANDO ---'); // <-- AGGIUNGI QUESTA RIGA

  const navigate = useNavigate();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ridimensiona il body quando la tastiera appare, così i campi non vengono coperti
        await Keyboard.setResizeMode({ mode: 'body' });
        console.log('[App] Keyboard resize mode configurato');
      } catch (error) {
        console.warn('[App] Impossibile configurare keyboard resize mode:', error);
      }

      try {
        // Configura il listener per il pulsante indietro
        CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            navigate(-1); // Se c'è una pagina precedente, torna indietro
          } else {
            CapacitorApp.exitApp(); // Altrimenti, esci dall'app
          }
        });
        console.log('[App] Listener back button configurato');
      } catch (error) {
        console.warn('[App] Impossibile configurare back button listener:', error);
      }
    };

    initializeApp();

    // Pulisci il listener quando il componente viene smontato
    return () => {
      try {
        CapacitorApp.removeAllListeners();
        console.log('[App] Listener rimossi');
      } catch (error) {
        console.warn('[App] Errore nella rimozione dei listener:', error);
      }
    };
  }, [navigate]);
  
  // Hook per le notifiche push (ora sicuro)
  try {
    usePushPermission();
  } catch (error) {
    console.warn('[App] Errore nell\'inizializzazione push permission:', error);
  }

  return (
    <ErrorBoundary componentName="App">
      <NotificationProvider> {/* <-- 2. AVVOLGI L'APP */}
        <Suspense fallback={<Spinner fullscreen label="Caricamento app..." />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* --- Rotte Pubbliche --- */}
            <Route index element={<HomePage />} />
            <Route path="meals" element={<MealsPage />} />
            <Route path="meals/search" element={<SearchMealsPage />} />
          
          <Route path="/chat/:chatId" element={
    <PrivateRoute requireCompleteProfile={true}>
        <ChatPage />
    </PrivateRoute>
} />

          <Route path="/meals/:id/video" element={
    <PrivateRoute requireCompleteProfile={true}>
        <VideoCallPage />
    </PrivateRoute>
} />
          <Route path="/video/:id" element={
    <PrivateRoute requireCompleteProfile={true}>
        <VideoCallPage />
    </PrivateRoute>
} />
          {/* Rotta profilo pubblico coerente con i link */}
          <Route path="public-profile/:userId" element={<PublicProfilePage />} />
          
          <Route path="map" element={<PrivateRoute requireCompleteProfile={true}><MapPage /></PrivateRoute>} /> {/* <-- 2. AGGIUNGIAMO LA ROTTA */}


          {/* --- Rotte Private --- */}

          {/* 3. MODIFICHIAMO LA VECCHIA ROTTA PROFILO */}
          {/* Ora è chiaro che questa è una pagina di impostazioni privata */}
          <Route path="impostazioni/profilo" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          
          <Route path="my-meals" element={<PrivateRoute requireCompleteProfile={true}><MealHistoryPage /></PrivateRoute>} />
          <Route path="meals/create" element={<PrivateRoute requireCompleteProfile={true}><CreateMealPage /></PrivateRoute>} />
          <Route path="meals/edit/:id" element={<PrivateRoute requireCompleteProfile={true}><EditMealPage /></PrivateRoute>} />
          <Route path="meals/:id" element={<PrivateRoute requireCompleteProfile={true}><MealDetailPage /></PrivateRoute>} />
        </Route>

        {/* Rotte senza layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} /> {/* <-- 2. AGGIUNGI LA NUOVA ROTTA */}
        <Route path="/termini-e-condizioni" element={<TermsAndConditionsPage />} />
        <Route path="/test" element={<TestPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
       </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;