// FRONTEND/client/src/contexts/AuthContext.js (Versione Corretta)

import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import Spinner from '../components/common/Spinner';
import authService from '../services/authService'; 
import profileService from '../services/profileService';
import { authPreferences } from '../utils/preferences';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null); 
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // Questo loading serve solo per il primo avvio dell'app
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const storedUser = await authPreferences.getUser();
                const storedToken = await authPreferences.getToken();

                if (storedUser && storedToken) {
                    setUser(storedUser);
                    setToken(storedToken); 
                    setIsAuthenticated(true);

                    setTimeout(async () => {
                      try {
                        const freshUser = await authService.verifyToken();
                        setUser(freshUser);
                      } catch (err) {
                        const status = err?.response?.status;
                        if (status === 401) {
                          await logout();
                        }
                      }
                    }, 0);
                }
            } catch (error) {
                console.error('Verifica iniziale del token fallita, eseguo logout:', error);
                const status = error?.response?.status;
                if (status === 401) {
                  await logout();
                }
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (credentials) => {
      // setLoading(true); // <-- RIMOSSO
      setError(null);
      try {
        const data = await authService.login(credentials);
        setUser(data.user);
        setToken(data.token); 
        setIsAuthenticated(true);
        try { await authPreferences.saveUser(data.user); await authPreferences.saveToken(data.token); } catch(_) {}
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Errore di login';
        setError(errorMessage);
        throw err; // Rilancia l'errore per gestirlo nella pagina di login
      } finally {
        // setLoading(false); // <-- RIMOSSO
      }
    };
    
    const register = async (registrationData) => {
        // setLoading(true); // <-- RIMOSSO
        setError(null);
        try {
            const data = await authService.register(registrationData);
            setUser(data.user);
            setToken(data.token); 
            setIsAuthenticated(true);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Errore di registrazione';
            setError(errorMessage);
            throw err; // Rilancia l'errore per gestirlo nella pagina di registrazione
        } finally {
            // setLoading(false); // <-- RIMOSSO
        }
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setToken(null); 
        setIsAuthenticated(false);
        // Pulisce le preferenze in modo asincrono
        authPreferences.clearAuth();
    };

    const deleteAccount = async (password) => {
        try {
            await profileService.deleteAccount(password);
            await logout();
            return { success: true, message: 'Account eliminato con successo' };
        } catch (error) {
            throw error;
        }
    };
    
    const updateUser = async (newUserData) => {
      const merged = newUserData ? { ...user, ...newUserData } : user;
      setUser(merged);
      try { await authPreferences.saveUser(merged); } catch (_) {}
    };

    const value = useMemo(() => ({
        user,
        token,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        register,
        deleteAccount,
        updateUser
      }), [user, token, isAuthenticated, loading, error]);
  
      return (
          <AuthContext.Provider value={value}>
              {loading ? <Spinner fullscreen label="Caricamento..." /> : children}
          </AuthContext.Provider>
      );
  };
  
  export const useAuth = () => useContext(AuthContext);
