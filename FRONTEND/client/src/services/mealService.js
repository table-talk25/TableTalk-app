// File: frontend/client/src/services/mealService.js (Versione Finale e Semplificata)

import axiosInstance from '../config/axiosConfig';

/**
 * Ottiene una lista di pasti, con la possibilità di filtrare tramite parametri.
 * Chiamerà l'URL /api/meals?param1=valore1&param2=valore2...
 * @param {object} params - Un oggetto di parametri per la query (es. { user: 'ID_UTENTE' }).
 */
const getMeals = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/meals', { params });
    return response.data; 
  } catch (error) {
    throw error;
  }
};

/**
 * Ottiene i dettagli di un singolo pasto tramite il suo ID.
 * @param {string} mealId - L'ID del pasto.
 */
const getMealById = async (mealId) => {
  try {
    const response = await axiosInstance.get(`/meals/${mealId}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

const mealService = {
  getMeals,
  getMealById,
};

export default mealService;