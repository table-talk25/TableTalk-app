// Esempio di servizio profilo utente (mock)

import axiosInstance from '../config/axiosConfig';
import authService from './authService';

/**
 * Ottiene i dati del profilo dell'utente corrente
 * @returns {Promise} Promise con i dati del profilo
 */
export const getProfile = async () => {
  try {
    const response = await axiosInstance.get('/api/auth/me');

    // Aggiorna i dati nel localStorage dopo averli recuperati
    if (response.data) {
      authService.updateLocalUserData(response.data);
    }

    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero del profilo:', error);
    throw error.response?.data || error;
  }
};

/**
 * Aggiorna i dati del profilo dell'utente
 * @param {Object} profileData - Nuovi dati del profilo
 * @returns {Promise} Promise con i dati aggiornati
 */
export const updateProfile = async (profileData) => {
  try {
    console.log('Invio dati profilo al server:', profileData);

    // Verifica che il token sia presente
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token non trovato. Effettua nuovamente il login.');
    }

    // Verifica se il token è scaduto
    if (authService.isTokenExpired()) {
      console.log('Token scaduto, tentativo di refresh...');
      try {
        await authService.refreshToken();
      } catch (refreshError) {
        console.error('Errore durante il refresh del token:', refreshError);
        // Se il refresh fallisce, reindirizza al login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Sessione scaduta. Effettua nuovamente il login.');
      }
    }

    const response = await axiosInstance.put('/api/auth/update-profile', profileData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    console.log('Risposta dal server per aggiornamento profilo:', response.data);

    // IMPORTANTE: Aggiorna i dati nel localStorage dopo la risposta positiva dal server
    if (response.data && response.data.success !== false) {
      // Se il server restituisce l'utente aggiornato
      const updatedUser = response.data.user || response.data;
      authService.updateLocalUserData(updatedUser);
      
      console.log('Profilo aggiornato con successo nel localStorage');
      return updatedUser;
    } else {
      throw new Error(response.data?.message || 'Errore durante l\'aggiornamento del profilo');
    }
  } catch (error) {
    console.error('Errore durante l\'aggiornamento del profilo:', error);

    // Gestione errori più dettagliata
    if (error.response) {
      console.error('Dettagli errore server:', error.response.data);
      
      // Se il token è scaduto o non valido
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Sessione scaduta. Effettua nuovamente il login.');
      }
      
      throw new Error(error.response.data?.message || 'Errore del server durante l\'aggiornamento');
    } else if (error.request) {
      throw new Error('Nessuna risposta dal server. Verifica la connessione.');
    } else {
      throw error;
    }
  }
};

/**
 * Aggiorna l'immagine del profilo
 * @param {FormData} imageData - Dati dell'immagine da caricare
 * @returns {Promise} Promise con i dati aggiornati
 */
export const updateProfileImage = async (imageData) => {
  try {
    console.log('Caricamento immagine profilo...');

    const response = await axiosInstance.put('/api/auth/profile/image', imageData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('Risposta caricamento immagine:', response.data);

    // Aggiorna i dati dell'utente con la nuova immagine
    if (response.data && response.data.success !== false) {
      const updatedUser = response.data.user || response.data;
      authService.updateLocalUserData(updatedUser);
      
      console.log('Immagine profilo aggiornata con successo');
      return updatedUser;
    } else {
      throw new Error(response.data?.message || 'Errore durante il caricamento dell\'immagine');
    }
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dell\'immagine del profilo:', error);
    
    if (error.response) {
      console.error('Dettagli errore server:', error.response.data);
      throw new Error(error.response.data?.message || 'Errore del server durante il caricamento dell\'immagine');
    } else if (error.request) {
      throw new Error('Nessuna risposta dal server. Verifica la connessione.');
    } else {
      throw error;
    }
  }
};

/**
 * Sincronizza i dati del profilo con il server
 * Utile per assicurarsi che i dati locali siano aggiornati
 * @returns {Promise} Promise con i dati sincronizzati
 */
export const syncProfile = async () => {
  try {
    console.log('Sincronizzazione profilo con il server...');
    const profileData = await getProfile();
    console.log('Profilo sincronizzato:', profileData);
    return profileData;
  } catch (error) {
    console.error('Errore durante la sincronizzazione del profilo:', error);
    throw error;
  }
};

// Servizio profilo
const profileService = {
  getProfile,
  updateProfile,
  updateProfileImage,
  syncProfile
};

export default profileService;