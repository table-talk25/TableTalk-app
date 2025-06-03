import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import profileService from '../services/profileService';

// Crea il Context
const UserContext = createContext();

// Hook personalizzato per usare il UserContext
const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser deve essere usato all\'interno di un UserProvider');
  }
  return context;
};

// Provider del Context
const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAccountDeactivated, setIsAccountDeactivated] = useState(false);

  // Inizializza l'utente all'avvio dell'app
  useEffect(() => {
    initializeUser();
  }, []);

  /**
   * Inizializza l'utente controllando il token e caricando i dati
   */
  const initializeUser = async () => {
    setLoading(true);
    try {
      // Controlla se c'è un token valido
      if (authService.isAuthenticated() && !authService.isTokenExpired()) {
        
        // Carica i dati dell'utente dal localStorage
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          
          // Prova a sincronizzare con il server in background
          try {
            await syncUserData();
          } catch (syncError) {
            console.warn('Impossibile sincronizzare i dati utente:', syncError);
            // Non bloccare l'app se la sincronizzazione fallisce
          }
        } else {
          // Se non ci sono dati utente, prova a verificare il token
          try {
            const userData = await authService.verifyToken();
            setUser(userData);
            setIsAuthenticated(true);
          } catch (error) {
            console.error('Token non valido:', error);
            await handleLogout();
          }
        }
      } else {
        // Token scaduto o non presente
        await handleLogout();
      }
    } catch (error) {
      console.error('Errore durante l\'inizializzazione dell\'utente:', error);
      await handleLogout();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sincronizza i dati dell'utente con il server
   */
  const syncUserData = async () => {
    try {
      const serverData = await profileService.getProfile();
      setUser(serverData);
      return serverData;
    } catch (error) {
      console.error('Errore durante la sincronizzazione:', error);
      throw error;
    }
  };

  /**
   * Effettua il login dell'utente
   */
  const handleLogin = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        return response;
      } else {
        throw new Error('Risposta di login non valida');
      }
    } catch (error) {
      console.error('Errore durante il login:', error);
      throw error;
    }
  };

  /**
   * Registra un nuovo utente
   */
  const handleRegister = async (userData) => {
    try {
      const response = await authService.register(userData);
      
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        return response;
      } else {
        throw new Error('Risposta di registrazione non valida');
      }
    } catch (error) {
      console.error('Errore durante la registrazione:', error);
      throw error;
    }
  };

  /**
   * Aggiorna il profilo dell'utente
   */
  const updateUserProfile = async (profileData) => {
    try {
      const updatedUser = await profileService.updateProfile(profileData);
      setUser(updatedUser);
      setIsAccountDeactivated(false);
      return updatedUser;
    } catch (error) {
      console.error('Errore durante l\'aggiornamento del profilo:', error);
      if (error.message === 'Account disattivato') {
        setIsAccountDeactivated(true);
      }
      throw error;
    }
  };

  /**
   * Aggiorna l'immagine del profilo
   */
  const updateUserProfileImage = async (imageData) => {
    try {
      const updatedUser = await profileService.updateProfileImage(imageData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dell\'immagine:', error);
      throw error;
    }
  };

  /**
   * Effettua il logout dell'utente
   */
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Errore durante il logout:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Ricarica i dati dell'utente dal server
   */
  const refreshUser = async () => {
    try {
      const userData = await syncUserData();
      return userData;
    } catch (error) {
      console.error('Errore durante il refresh dell\'utente:', error);
      throw error;
    }
  };

  /**
   * Ottiene l'URL dell'immagine del profilo
   */
  const getUserProfileImageUrl = () => {
    if (user && user.profileImage) {
      return authService.getProfileImageUrl(user.profileImage);
    }
    return '/default-avatar.jpg';
  };

  // Valore del context
  const contextValue = {
    // Stato
    user,
    isAuthenticated,
    loading,
    isAccountDeactivated,
    
    // Metodi di autenticazione
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    
    // Metodi del profilo
    updateProfile: updateUserProfile,
    updateProfileImage: updateUserProfileImage,
    getUserProfileImageUrl,
    syncUser: syncUserData,
    refreshUser
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export { useUser, UserProvider };
export default UserContext; 