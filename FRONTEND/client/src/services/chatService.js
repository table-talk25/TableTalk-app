// File: FRONTEND/client/src/services/chatService.js (Corretto con apiService)

import apiClient from './apiService'; // <-- Usa il tuo servizio centralizzato

/**
 * Ottiene i dati di una chat e la sua cronologia messaggi
 * @param {string} chatId - L'ID della chat da recuperare
 * @returns {Promise<Object>} L'oggetto della chat
 */
const getChatById = async (chatId) => {
  const response = await apiClient.get(`/chats/${chatId}`);
  return response.data.data;
};

/**
 * Permette all'utente autenticato di lasciare una chat
 * @param {string} chatId - L'ID della chat da lasciare
 * @returns {Promise<Object>} La risposta dall'API
 */
const leaveChat = async (chatId) => {
  const response = await apiClient.delete(`/chats/${chatId}/participants`);
  return response.data;
};

const chatService = {
  getChatById,
  leaveChat
};

export default chatService;