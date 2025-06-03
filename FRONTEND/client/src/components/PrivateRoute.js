import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  // Se non c'è il token, reindirizza al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  // Altrimenti mostra la pagina richiesta
  return children;
}

export default PrivateRoute;