// File: src/constants/mealConstants.js (Versione Finale con Traduttore Universale)

import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// --- TIPI DI PASTO ---

// 1. Definiamo le CHIAVI INGLESI che il backend si aspetta
export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  APERITIF: 'aperitif' // Corretto da APERITIVO per coerenza
};

// 2. Mappiamo le chiavi inglesi alle ETICHETTE ITALIANE per l'utente
export const MEAL_TYPE_LABELS = {
  [MEAL_TYPES.BREAKFAST]: 'Colazione',
  [MEAL_TYPES.LUNCH]: 'Pranzo',
  [MEAL_TYPES.DINNER]: 'Cena',
  [MEAL_TYPES.APERITIF]: 'Aperitivo',
};

// 3. Creiamo le opzioni per i form, che mostrano l'italiano ma salvano l'inglese
export const mealTypeOptions = Object.values(MEAL_TYPES).map(typeKey => ({
  value: typeKey, // Il valore inviato al backend (es. 'lunch')
  label: MEAL_TYPE_LABELS[typeKey] // L'etichetta mostrata all'utente (es. 'Pranzo')
}));


// --- STATI DEI PASTI ---
export const MEAL_STATUS = { UPCOMING: 'upcoming', ONGOING: 'ongoing', COMPLETED: 'completed', CANCELLED: 'cancelled' };
export const MEAL_STATUS_LABELS = {
  [MEAL_STATUS.UPCOMING]: 'In Programma',
  [MEAL_STATUS.ONGOING]: 'In Corso',
  [MEAL_STATUS.COMPLETED]: 'Completato',
  [MEAL_STATUS.CANCELLED]: 'Cancellato',
};


// --- FUNZIONI HELPER UNIFICATE ---

// Questa funzione ora traduce la chiave inglese nell'etichetta italiana
export const getMealTypeText = (typeKey) => MEAL_TYPE_LABELS[typeKey] || typeKey;

export const getMealStatusText = (statusKey) => MEAL_STATUS_LABELS[statusKey] || statusKey;

export const getMealTypeColor = (typeKey) => {
  const colors = {
    [MEAL_TYPES.BREAKFAST]: '#ffc107',
    [MEAL_TYPES.LUNCH]: '#28a745',
    [MEAL_TYPES.DINNER]: '#6f42c1',
    [MEAL_TYPES.APERITIF]: '#fd7e14'
  };
  return colors[typeKey] || '#007bff';
};

export const formatDate = (dateString, formatString = "d MMM yy 'alle' HH:mm") => {
    if (!dateString) return 'Data non disponibile';
    try {
        return format(new Date(dateString), formatString, { locale: it });
    } catch (error) {
        console.error("Errore nella formattazione della data:", error);
        return 'Data non valida';
    }
};

// @param {string} imageName - Il nome del file dell'immagine.
// @returns {string} L'URL completo o un'immagine di fallback.

// File: src/constants/mealConstants.js

export const getMealCoverImageUrl = (imageName) => {
  if (!imageName || imageName.includes('default-meal')) {
    return '/images/default-meal-background.jpg';
  }
  // Caso Capacitor (foto locale su device)
  if (imageName.startsWith('capacitor://')) {
    return imageName;
  }
  // Caso URL assoluto (già pronto)
  if (imageName.startsWith('http')) {
    return imageName;
  }
  // Caso path relativo dal backend
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  const baseUrl = apiUrl.replace('/api', '');
  if (imageName.includes('uploads/')) {
    return `${baseUrl}/${imageName}`;
  } else {
    return `${baseUrl}/uploads/meal-images/${imageName}`;
  }
};

/**
 * Ottiene l'URL completo per l'avatar dell'host.
 * Restituisce un avatar di default se non specificato.
 * @param {string} profileImage - Il nome del file dell'immagine del profilo.
 * @returns {string} - L'URL completo dell'immagine.
 */
export const getHostAvatarUrl = (profileImage) => {
  // Se non c'è un'immagine o è quella di default, usa il placeholder locale
  if (!profileImage || profileImage.includes('default')) {
    return '/default-avatar.jpg';
  }

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  
  // Otteniamo l'indirizzo base del server rimuovendo '/api'
  const baseUrl = apiUrl.replace('/api', ''); // Risultato: http://localhost:5001

  // Il percorso 'profileImage' dal database (es. "uploads/profile-images/avatar.jpg") è già corretto.
  // Dobbiamo solo anteporre l'indirizzo base del server.
  return `${baseUrl}/${profileImage}`;

};