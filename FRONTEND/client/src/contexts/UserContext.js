import React, { createContext, useContext, useState, useEffect } from 'react';
import profileService from '../services/profileService';
import { useAuth } from './AuthContext';

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
  const { user: authUser, isAuthenticated } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isAccountDeactivated, setIsAccountDeactivated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Carica i dati del profilo quando l'utente è autenticato
  useEffect(() => {
    if (isAuthenticated && authUser) {
      loadProfileData();
    } else {
      setProfileData(null);
      setIsAccountDeactivated(false);
    }
  }, [isAuthenticated, authUser]);

  /**
   * Carica i dati aggiuntivi del profilo
   */
  const loadProfileData = async () => {
    if (!isAuthenticated || !authUser) {
      throw new Error('Utente non autenticato');
    }

    setIsLoading(true);
    try {
      const data = await profileService.getProfile();
      setProfileData(data);
      return data;
    } catch (error) {
      console.error('Errore durante il caricamento del profilo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Aggiorna i dati aggiuntivi del profilo
   */
  const updateProfileData = async (profileData) => {
    if (!isAuthenticated || !authUser) {
      throw new Error('Utente non autenticato');
    }

    setIsLoading(true);
    try {
      const updatedData = await profileService.updateProfile(profileData);
      setProfileData(updatedData);
      setIsAccountDeactivated(false);
      return updatedData;
    } catch (error) {
      console.error('Errore durante l\'aggiornamento del profilo:', error);
      if (error.message === 'Account disattivato') {
        setIsAccountDeactivated(true);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Aggiorna l'immagine del profilo
   */
  const updateProfileImage = async (imageData) => {
    if (!isAuthenticated || !authUser) {
      throw new Error('Utente non autenticato');
    }

    setIsLoading(true);
    try {
      const updatedData = await profileService.updateProfileImage(imageData);
      setProfileData(updatedData);
      return updatedData;
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dell\'immagine:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sincronizza i dati del profilo con il server
   */
  const syncProfileData = async () => {
    if (!isAuthenticated || !authUser) {
      throw new Error('Utente non autenticato');
    }

    return loadProfileData();
  };

  // Combina i dati base dell'utente con i dati aggiuntivi del profilo
  const user = isAuthenticated && authUser ? {
    ...authUser,
    ...profileData
  } : null;

  // Valore del context
  const contextValue = {
    // Stato
    user,
    profileData,
    isAccountDeactivated,
    isLoading,
    
    // Metodi del profilo
    updateProfile: updateProfileData,
    updateProfileImage,
    syncProfile: syncProfileData,
    refreshProfile: loadProfileData
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export { useUser, UserProvider };
export default UserContext; 