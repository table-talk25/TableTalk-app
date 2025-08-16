import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from './Spinner';
import useProfileCompletion from '../../hooks/useProfileCompletion';

const PrivateRoute = ({ children, requireCompleteProfile = true }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // 🔒 CONTROLLO PROFILO: Verifica se il profilo deve essere completo
  const { isProfileComplete, shouldCompleteProfile } = useProfileCompletion(false);

  if (loading) return <Spinner fullscreen label="Caricamento in corso..." />;

  // Se l'utente non è autenticato, reindirizza al login
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }}
        replace 
      />
    );
  }

  // Se il profilo deve essere completo ma non lo è, reindirizza al completamento
  if (requireCompleteProfile && shouldCompleteProfile) {
    console.log('🔄 [PrivateRoute] Profilo incompleto, reindirizzamento a completamento profilo');
    return (
      <Navigate 
        to="/complete-profile" 
        state={{ from: location }}
        replace 
      />
    );
  }

  // 🔄 REDIRECT INTELLIGENTE: Salva la posizione di partenza
  // così l'utente può tornare alla pagina originale dopo il login
  return children;
};

export default PrivateRoute; 