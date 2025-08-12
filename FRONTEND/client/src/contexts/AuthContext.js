// FRONTEND/client/src/contexts/AuthContext.js (Versione Definitiva e Pulita)

import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import authService from '../services/authService'; 
import profileService from '../services/profileService';
import { authPreferences } from '../utils/preferences';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null); 
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Stato per errori di login/register

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const storedUser = await authPreferences.getUser();
                const storedToken = await authPreferences.getToken();

                if (storedUser && storedToken) {
                    setUser(JSON.parse(storedUser));
                    setToken(storedToken); 
                    setIsAuthenticated(true);

                    const freshUser = await authService.verifyToken();
                    setUser(freshUser);
                }
            } catch (error) {
                console.error('Verifica iniziale del token fallita, eseguo logout:', error);
                await logout(); // Se il token non è valido, puliamo tutto
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (credentials) => {
      setLoading(true);
      setError(null);
      try {
        const data = await authService.login(credentials);
        setUser(data.user);
        setToken(data.token); 
        setIsAuthenticated(true);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Errore di login');
      } finally {
        setLoading(false);
      }
    };
    
    const register = async (registrationData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.register(registrationData);
            setUser(data.user);
            setToken(data.token); 
            setIsAuthenticated(true);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Errore di registrazione');
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setToken(null); 
        setIsAuthenticated(false);
    };

    const deleteAccount = async (password) => {
        try {
            await profileService.deleteAccount(password);
            // Dopo l'eliminazione, esegui il logout
            await logout();
            return { success: true, message: 'Account eliminato con successo' };
        } catch (error) {
            throw error;
        }
    };
    
    // 2. Creiamo la costante 'value' con useMemo
    const value = useMemo(() => ({
        user,
        token,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        register,
        deleteAccount
      }), [user, token, isAuthenticated, loading, error, login, logout, register, deleteAccount]); // dipendenze corrette
  
  
      // 3. Usiamo la costante 'value' nel Provider
      return (
          <AuthContext.Provider value={value}>
              {!loading && children}
          </AuthContext.Provider>
      );
  };
  
  export const useAuth = () => useContext(AuthContext);
