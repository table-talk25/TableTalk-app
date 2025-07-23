// FRONTEND/client/src/contexts/AuthContext.js (Versione Definitiva e Pulita)

import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService'; 
import { authPreferences } from '../utils/preferences';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null); 
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

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
      const data = await authService.login(credentials);
      setUser(data.user);
      setToken(data.token); 
      setIsAuthenticated(true);
    };
    
    const register = async (registrationData) => {
        const data = await authService.register(registrationData);
        setUser(data.user);
        setToken(data.token); 
        setIsAuthenticated(true);
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setToken(null); 
        setIsAuthenticated(false);
    };
    
    return (
        <AuthContext.Provider value={{ user, token, login, logout, register, isAuthenticated, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => useContext(AuthContext);
