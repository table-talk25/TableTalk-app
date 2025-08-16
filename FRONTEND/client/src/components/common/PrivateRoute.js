import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from './Spinner';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner fullscreen label="Caricamento in corso..." />;

  // 🔄 REDIRECT INTELLIGENTE: Salva la posizione di partenza
  // così l'utente può tornare alla pagina originale dopo il login
  return isAuthenticated ? children : (
    <Navigate 
      to="/login" 
      state={{ from: location }}
      replace 
    />
  );
};

export default PrivateRoute; 