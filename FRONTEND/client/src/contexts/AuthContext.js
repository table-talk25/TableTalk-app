import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import axiosInstance from '../config/axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configurazione del token nell'header delle richieste
  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Verifica del token e caricamento dell'utente
  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (token) {
          const userData = await authService.verifyToken();
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Errore verifica token:', error);
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Login
  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      setToken(data.token);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      console.error('Errore durante il login:', error);
      throw error;
    }
  };

  // Registrazione
  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      setToken(data.token);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      console.error('Errore durante la registrazione:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Errore durante il logout:', error);
    } finally {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Aggiornamento dei dati utente
  const updateUser = (updatedUser) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUser }));
  };

  // Controllo se l'utente è un admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
  }
  return context;
}; 