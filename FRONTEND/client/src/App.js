// File: /src/App.js (Versione Finale e Corretta)

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';

// ===== IMPORT MANCANTI AGGIUNTI QUI =====
import { AuthProvider } from './contexts/AuthContext';
import { MealsProvider } from './contexts/MealsContext';
// ==========================================

import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/PrivateRoute';

import 'react-toastify/dist/ReactToastify.css';
import './styles/App.css';

// Importa le pagine principali
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ProfilePage from './pages/Profile/ProfilePage';
import MealsPage from './pages/Meals/MealsPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import MealDetailPage from './pages/Meals/MealDetailPage';
import CreateMealPage from './pages/Meals/CreateMealPage';
import EditMealPage from './pages/Meals/EditMealPage';
import MealHistoryPage from './pages/Meals/MealHistoryPage'; // Assicurati di importare la pagina della cronologia


const App = () => {
  return (
    <AuthProvider>
      <MealsProvider> {/* Spostato qui per avvolgere tutto, è più semplice */}
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Container fluid className="app-container">
            
            {/* ===== ROTTE PULITE E SENZA DUPLICATI ===== */}
            <Routes>
              {/* Rotte Pubbliche */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Rotte Private */}
              <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="/meals" element={<PrivateRoute><MealsPage /></PrivateRoute>} />
              <Route path="/meals/create" element={<PrivateRoute><CreateMealPage /></PrivateRoute>} />
              <Route path="/meals/history" element={<PrivateRoute><MealHistoryPage /></PrivateRoute>} />
              <Route path="/meals/:id" element={<PrivateRoute><MealDetailPage /></PrivateRoute>} />
              <Route path="/meals/:id/edit" element={<PrivateRoute><EditMealPage /></PrivateRoute>} />
              
              {/* Rotta per Pagine Non Trovate */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            
          </Container>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </MealsProvider>
    </AuthProvider>
  );
};

export default App;