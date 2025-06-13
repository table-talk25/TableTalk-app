import axiosInstance from '../config/axiosConfig';

// Funzione helper per aggiornare i dati utente nel localStorage
const updateLocalUserData = (userData) => {
  if (userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }
};

// --- Funzioni del Servizio di Autenticazione ---

export const register = async (userData) => {
  try {
    const response = await axiosInstance.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      updateLocalUserData(response.data.user);
    }
    return response.data;
  } catch (error) {
    // Rilanciamo l'errore che è già stato formattato dal nostro interceptor
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    // Niente più controlli di salute o try/catch complessi.
    // Ci fidiamo del nostro interceptor.
    const response = await axiosInstance.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      updateLocalUserData(response.data.user);
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    // Notifichiamo il backend, ma la pulizia del frontend avviene sempre
    await axiosInstance.post('/auth/logout');
  } catch (error) {
    console.error('Logout fallito sul server, ma il logout locale verrà eseguito:', error);
  } finally {
    // La pulizia avviene qui, nel client, come fonte di verità
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const verifyToken = async () => {
  try {
    const response = await axiosInstance.get('/profile/me'); // Abbiamo già questa rotta per verificare l'utente
    if (response.data.data) {
      updateLocalUserData(response.data.data);
    }
    return response.data.data;
  } catch (error) {
    // L'interceptor del 401 si occuperà già di pulire il token se non è valido
    throw error;
  }
};

// ... qui potresti aggiungere altre funzioni come requestPasswordReset, etc.
// sempre con la stessa struttura semplice: un try/catch che chiama axiosInstance.

const authService = {
  register,
  login,
  logout,
  verifyToken,
  // ...
};

export default authService;