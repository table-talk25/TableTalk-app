// File: /src/components/PrivateRoute.js (Versione Migliorata)

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from 'react-bootstrap'; // Un componente per il caricamento

const PrivateRoute = ({ children }) => {
  // 1. Chiediamo la verità al nostro AuthContext invece che a localStorage
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();


  
  // 2. Gestiamo lo stato di caricamento iniziale
  // Se il context sta ancora verificando il token, mostriamo uno spinner
  // invece di reindirizzare l'utente prematuramente.
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center">
        <Spinner animation="border" />
      </div>
    );
  }

  // 3. Basiamo la nostra decisione su 'isAuthenticated', che è sempre aggiornato
  if (!isAuthenticated) {
    // Se l'utente non è autenticato, lo reindirizziamo al login.
    // Salviamo anche la pagina che stava cercando di visitare (location),
    // così dopo il login potremo riportarlo lì.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se è tutto a posto, mostriamo la pagina richiesta.
  return children;
};

export default PrivateRoute;