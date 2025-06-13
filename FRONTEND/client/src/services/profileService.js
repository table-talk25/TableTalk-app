// File: frontend/client/src/services/profileService.js (Versione Definitiva)

import axiosInstance from '../config/axiosConfig';

const getProfile = async () => {
  try {
    const response = await axiosInstance.get('/profile/me');
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

const updateProfile = async (profileData) => {
  try {
    // Chiama l'UNICA rotta corretta
    const response = await axiosInstance.put('/profile/me', profileData);
    // Legge la risposta dall'UNICO formato corretto
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

const updateAvatar = async (formData) => {
  try {
    const response = await axiosInstance.put('/profile/me/avatar', formData);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

const deleteAccount = async (password) => {
    try {
      const response = await axiosInstance.delete('/profile/me', {
        data: { password }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

const profileService = {
  getProfile,
  updateProfile,
  updateAvatar,
  deleteAccount,
};

export default profileService;