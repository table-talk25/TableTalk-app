// File: src/App.js (Versione Aggiornata con Profilo Pubblico/Privato)
import TestPage from './pages/TestPage'; 

import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { NotificationProvider } from './contexts/NotificationContext'; // <-- 1. IMPORTA

// Import dei Componenti di Layout e Pagine
import Layout from './components/layout/Layout';
import PrivateRoute from './components/common/PrivateRoute';
import HomePage from './pages/Home';
import LoginPage from './pages/Auth/Login';
import RegisterPage from './pages/Auth/Register';
import ForgotPasswordPage from './pages/Auth/ForgotPassword';
import ResetPasswordPage from './pages/Auth/ResetPassword';
import ProfilePage from './pages/Profile'; // Questa ora è la pagina "Modifica Profilo"
import PublicProfilePage from './pages/PublicProfile'; // <-- 1. IMPORTIAMO LA NUOVA PAGINA
import MealsPage from './pages/Meals/MealsPage';
import MealDetailPage from './pages/Meals/MealDetailPage';
import CreateMealPage from './pages/Meals/CreateMealPage';
import EditMealPage from './pages/Meals/EditMealPage';
import MealHistoryPage from './pages/Meals/MealHistoryPage';
import NotFoundPage from './pages/NotFound';
import VideoCallPage from './pages/VideoCallPage';
import ChatPage from './pages/ChatPage';
import MapPage from './pages/MapPage'; // <-- 1. IMPORTIAMO LA NUOVA PAGINA
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'; // <-- 1. IMPORTA LA NUOVA PAGINA
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import { App as CapacitorApp } from '@capacitor/app';
import usePushPermission from './hooks/usePushPermission';

import { MealsProvider } from './contexts/MealsContext'; // Questo è essenziale
import { AuthProvider } from './contexts/AuthContext'; 

const App = () => {
  console.log('--- L\'APP SI STA CARICANDO ---'); // <-- AGGIUNGI QUESTA RIGA

  const navigate = useNavigate();

  useEffect(() => {
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        navigate(-1); // Se c'è una pagina precedente, torna indietro
      } else {
        CapacitorApp.exitApp(); // Altrimenti, esci dall'app
      }
    });

    // Pulisci il listener quando il componente viene smontato
    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [navigate]);
  
  useEffect(() => {
    const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 'Configurazione non trovata!';
    alert('Sto provando a connettermi a: ' + apiUrl);
  }, []);

  usePushPermission();
  return (
      <AuthProvider>
      <MealsProvider>
      <NotificationProvider> {/* <-- 2. AVVOLGI L'APP */}
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* --- Rotte Pubbliche --- */}
            <Route index element={<HomePage />} />
            <Route path="meals" element={<MealsPage />} />
          
<Route path="/chat/:chatId" element={
    <PrivateRoute>
        <ChatPage />
    </PrivateRoute>
} />

          <Route path="/meals/:id/video" element={
    <PrivateRoute>
        <VideoCallPage />
    </PrivateRoute>
} />
          <Route path="/video/:id" element={
    <PrivateRoute>
        <VideoCallPage />
    </PrivateRoute>
} />
          {/* 2. AGGIUNGIAMO LA NUOVA ROTTA PUBBLICA */}
          {/* Nota che NON è avvolta da <PrivateRoute> */}
          <Route path="profilo/:userId" element={<PublicProfilePage />} />
          
          <Route path="map" element={<PrivateRoute><MapPage /></PrivateRoute>} /> {/* <-- 2. AGGIUNGIAMO LA ROTTA */}


          {/* --- Rotte Private --- */}

          {/* 3. MODIFICHIAMO LA VECCHIA ROTTA PROFILO */}
          {/* Ora è chiaro che questa è una pagina di impostazioni privata */}
          <Route path="impostazioni/profilo" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          
          <Route path="my-meals" element={<PrivateRoute><MealHistoryPage /></PrivateRoute>} />
          <Route path="meals/create" element={<PrivateRoute><CreateMealPage /></PrivateRoute>} />
          <Route path="meals/edit/:id" element={<PrivateRoute><EditMealPage /></PrivateRoute>} />
          <Route path="meals/:id" element={<PrivateRoute><MealDetailPage /></PrivateRoute>} />
        </Route>

        {/* Rotte senza layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} /> {/* <-- 2. AGGIUNGI LA NUOVA ROTTA */}
        <Route path="/termini-e-condizioni" element={<TermsAndConditionsPage />} />
        <Route path="/test" element={<TestPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      </NotificationProvider>
      </MealsProvider>
      </AuthProvider>
  );
};

export default App;