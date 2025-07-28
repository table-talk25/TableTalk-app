import apiClient from './apiService';

// Statistiche generali delle lingue
export const getLanguageStats = async () => {
  const response = await apiClient.get('/analytics/languages');
  return response.data;
};

// Statistiche dettagliate per una lingua specifica
export const getLanguageDetails = async (languageCode) => {
  const response = await apiClient.get(`/analytics/languages/${languageCode}`);
  return response.data;
};

// Report di priorità traduzioni
export const getTranslationPriority = async () => {
  const response = await apiClient.get('/analytics/translation-priority');
  return response.data;
}; 