// File: frontend/client/src/services/mealService.js (Corretto)

import apiClient from './apiService'; // <-- USA L'API CLIENT UNIFICATO

const getMeals = async (params = {}) => {
  const response = await apiClient.get('/meals', { params });
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
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ [mealService] Risposta ricevuta:', response);
    console.log('✅ [mealService] Response data:', response.data);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ [mealService] Errore nella richiesta:', error);
    console.error('❌ [mealService] Error response:', error.response);
    throw error;
  }
};

const updateMeal = async (id, formData) => {
  const response = await apiClient.put(`/meals/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

const deleteMeal = async (id) => {
  const response = await apiClient.delete(`/meals/${id}`);
  return response.data;
};

const joinMeal = async (id) => {
  const response = await apiClient.post(`/meals/${id}/participants`);
  return response.data;
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
  const response = await apiClient.get('/meals/user/all', { params });
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