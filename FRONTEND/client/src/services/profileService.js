// File: frontend/client/src/services/profileService.js (Versione Corretta)

import apiClient from './apiService';

const getProfile = async () => {
  // CORRETTO: Rimosso /api dall'inizio
  const response = await apiClient.get('/profile/me', { suppressErrorAlert: true });
  return response.data.data;
};

const getPublicProfileById = async (userId) => {
  // CORRETTO: Rimosso /api dall'inizio
  const response = await apiClient.get(`/profile/public/${userId}`);
  return response.data.data;
};

const updateProfile = async (profileData) => {
  // CORRETTO: Rimosso /api dall'inizio
  const response = await apiClient.put('/profile/me', profileData);
  return response.data.data;
};

const updateProfileImage = async (formData) => {
  // CORRETTO: Rimosso /api dall'inizio
  const response = await apiClient.put('/profile/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

const deleteAccount = async (password) => {
  // CORRETTO: Rimosso /api dall'inizio
  const response = await apiClient.delete('/profile/me', {
    data: { password }
  });
  return response.data;
};

const getFullImageUrl = (imageName) => {
  if (!imageName || imageName.includes('default-avatar.jpg')) {
    return '/default-avatar.jpg';
  }
  const baseUrl = (apiClient.defaults.baseURL || '').replace('/api', '');
  return `${baseUrl}/${imageName}`;
};

const updateUserLocation = async (locationData) => {
  // CORRETTO: Rimosso /api dall'inizio
  const response = await apiClient.put('/users/me/location', locationData);
  return response.data;
};

const getNearbyUsers = async (params) => {
  // CORRETTO: Rimosso /api dall'inizio
  const response = await apiClient.get('/users/nearby', { params });
  return response.data.data;
};

const updateLocationFromCoords = async (locationData) => {
  // locationData sarà un oggetto { latitude, longitude }
  const response = await apiClient.put('/users/me/location-from-coords', locationData);
  return response.data.data;
};

const removeUserLocation = async () => {
  // Rimuove la posizione dell'utente quando l'app si chiude
  const response = await apiClient.delete('/users/me/location');
  return response.data;
};

const profileService = {
  getProfile,
  getPublicProfileById,
  updateProfile,
  updateProfileImage,
  deleteAccount,
  getFullImageUrl,
  updateUserLocation,
  getNearbyUsers,
  updateLocationFromCoords,
  removeUserLocation,
};

export default profileService;