// File: src/index.js (Versione Finale e Pulita)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MealsProvider } from './contexts/MealsContext';

// Ora importiamo solo il nostro file CSS principale e quello della libreria di notifiche
import './styles/common/index.css'; 
import 'react-toastify/dist/ReactToastify.css';

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MealsProvider>
          <App />
        </MealsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);