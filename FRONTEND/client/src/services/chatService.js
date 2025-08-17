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
  const response = await apiClient.delete(`/chats/${chatId}/participants`, { suppressErrorAlert: true });
  return response.data;
};

const closeChat = async (chatId) => {
  const response = await apiClient.put(`/chats/${chatId}/close`, {}, { suppressErrorAlert: true });
  return response.data;
};

/**
 * Inizia l'indicatore "sta scrivendo"
 * @param {string} chatId - L'ID della chat
 * @returns {Promise<Object>} La risposta dall'API
 */
const startTyping = async (chatId) => {
  const response = await apiClient.post(`/chats/${chatId}/typing/start`);
  return response.data;
};

/**
 * Ferma l'indicatore "sta scrivendo"
 * @param {string} chatId - L'ID della chat
 * @returns {Promise<Object>} La risposta dall'API
 */
const stopTyping = async (chatId) => {
  const response = await apiClient.post(`/chats/${chatId}/typing/stop`);
  return response.data;
};

/**
 * Marca i messaggi come letti
 * @param {string} chatId - L'ID della chat
 * @returns {Promise<Object>} La risposta dall'API
 */
const markAsRead = async (chatId) => {
  const response = await apiClient.post(`/chats/${chatId}/read`);
  return response.data;
};

/**
 * Ottiene lo stato della chat (typing e lettura)
 * @param {string} chatId - L'ID della chat
 * @returns {Promise<Object>} La risposta dall'API
 */
const getChatStatus = async (chatId) => {
  const response = await apiClient.get(`/chats/${chatId}/status`);
  return response.data;
};

const chatService = {
  getChatById,
  leaveChat,
  startTyping,
  stopTyping,
  markAsRead,
  getChatStatus
};
// Esporta anche closeChat per gli host
chatService.closeChat = closeChat;

export default chatService;