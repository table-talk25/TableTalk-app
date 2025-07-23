// File: FRONTEND/client/src/services/videoService.js (Corretto)

import apiClient from './apiService'; // <-- USA L'API CLIENT UNIFICATO

const getTwilioToken = async (mealId) => {
  const response = await apiClient.post(`/video/meals/${mealId}/token`);
  return response.data;
};

// Funzione per permettere all'host di terminare la chiamata per tutti
const endCall = async (mealId) => {
  const response = await apiClient.post(`/video/meals/${mealId}/end`);
  return response.data;
};

const videoService = {
  getTwilioToken,
  endCall,
};

export default videoService;