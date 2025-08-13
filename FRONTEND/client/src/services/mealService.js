// File: frontend/client/src/services/mealService.js (Corretto)

import apiClient from './apiService'; // <-- USA L'API CLIENT UNIFICATO
import { CapacitorHttp } from '@capacitor/core';
import { getPreference, PREFERENCE_KEYS } from '../utils/preferences';
import { API_URL } from '../config/capacitorConfig';

const getMeals = async (params = {}) => {
  const { suppressErrorAlert, ...rest } = params || {};
  const response = await apiClient.get('/meals', { params: rest, suppressErrorAlert });
  return response.data;
};

const getMealById = async (id) => {
  const response = await apiClient.get(`/meals/${id}`);
  return response.data;
};

  const createMeal = async (formData) => { // formData qui è un oggetto FormData
  try {
    console.log('📡 [mealService] Invio richiesta POST /meals...');
    console.log('📡 [mealService] FormData:', formData);
    
    const response = await apiClient.post('/meals', formData, {
      // Non impostare Content-Type per FormData: il browser aggiunge il boundary
      suppressErrorAlert: true,
    });
    
    console.log('✅ [mealService] Risposta ricevuta:', response);
    console.log('✅ [mealService] Response data:', response.data);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ [mealService] Errore nella richiesta:', error);
    console.error('❌ [mealService] Error response:', error.response);
    // Fallback nativo su errori di rete/timeout: invia JSON (senza immagine)
    const isTransientNetwork = error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED' || typeof error?.response?.status !== 'number';
    if (isTransientNetwork) {
      try {
        // Estrai i campi dal FormData e costruisci un JSON equivalente (ignora coverImage)
        const plain = {};
        const topics = [];
        for (const [key, value] of formData.entries()) {
          // Non includere dati pesanti nell'emergenza
          if (key === 'coverImage' || key === 'coverImageBase64' || key === 'coverLocalUri') continue;
          if (key === 'topics[]') {
            topics.push(value);
          } else if (key === 'location') {
            plain.location = value; // già stringificato dal form
          } else {
            plain[key] = value;
          }
        }
        if (topics.length) plain.topics = topics;

        const token = await getPreference(PREFERENCE_KEYS.TOKEN, '');
        const url = `${API_URL.replace(/\/$/, '')}/meals`;
        const nativeResp = await CapacitorHttp.post({
          url,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          data: plain,
          connectTimeout: 20000,
          readTimeout: 20000,
        });
        if (nativeResp?.data?.success) {
          return nativeResp.data.data;
        }
      } catch (nativeErr) {
        console.error('❌ [mealService] Fallback nativo POST /meals fallito:', nativeErr);
      }
    }
    throw error;
  }
};

  const updateMeal = async (id, formData) => {
  const response = await apiClient.put(`/meals/${id}`, formData, {
    // Non impostare Content-Type per FormData: il browser aggiunge il boundary
    suppressErrorAlert: true,
  });
  return response.data; // { success, data }
};

const deleteMeal = async (id) => {
  const response = await apiClient.delete(`/meals/${id}`);
  return response.data;
};

const joinMeal = async (id) => {
  try {
    const response = await apiClient.post(`/meals/${id}/participants`, {}, {
      suppressErrorAlert: true,
    });
    return response.data;
  } catch (error) {
    const isTransientNetwork = error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED' || typeof error?.response?.status !== 'number';
    if (isTransientNetwork) {
      try {
        const token = await getPreference(PREFERENCE_KEYS.TOKEN, '');
        const url = `${API_URL.replace(/\/$/, '')}/meals/${id}/participants`;
        const nativeResp = await CapacitorHttp.post({
          url,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          data: {},
          connectTimeout: 20000,
          readTimeout: 20000,
        });
        return nativeResp.data;
      } catch (nativeErr) {
        // Continua con l'errore originale
      }
    }
    throw error;
  }
};

const leaveMeal = async (mealId) => {
  const response = await apiClient.delete(`/meals/${mealId}/participants`);
  return response.data;
};

const searchMeals = async (searchTerm) => {
  const response = await apiClient.get('/meals/search', {
    params: { q: searchTerm }
  });
  return response.data;
};

const getUserMeals = async (params = {}) => {
  const { suppressErrorAlert, ...rest } = params || {};
  const response = await apiClient.get('/meals/user/all', { params: rest, suppressErrorAlert });
  return response.data;
};

const mealService = {
  getMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
  joinMeal,
  leaveMeal,
  searchMeals,
  getUserMeals
};

export default mealService;