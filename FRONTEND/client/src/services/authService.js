import axiosInstance from '../config/axiosConfig';

// Cache per le immagini del profilo
const profileImageCache = new Map();

// URL base dell'API
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

/**
 * Ottiene l'URL dell'immagine del profilo con cache
 * @param {string} imagePath - Percorso dell'immagine
 * @returns {string} URL completo dell'immagine
 */
const getProfileImageUrl = (imagePath) => {
  if (!imagePath) return '/default-avatar.jpg';
  
  if (profileImageCache.has(imagePath)) {
    return profileImageCache.get(imagePath);
  }

  const imageUrl = `${apiUrl}/uploads/${imagePath}`;
  profileImageCache.set(imagePath, imageUrl);
  return imageUrl;
};
/**
 * Aggiorna i dati dell'utente nel localStorage e nella cache
 * @param {Object} userData - Dati dell'utente aggiornati
 */
const updateLocalUserData = (userData) => {
  if (userData) {
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Aggiorna anche la cache dell'immagine del profilo se presente
    if (userData.profileImage) {
      getProfileImageUrl(userData.profileImage);
    }
    
    console.log('Dati utente aggiornati nel localStorage:', userData);
  }
};

/**
 * Registra un nuovo utente
 * @param {Object} userData - Dati dell'utente da registrare
 * @returns {Promise} Promise con la risposta dal server
 */
const register = async (userData) => {
  try {
    const response = await axiosInstance.post('/api/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    console.error('Errore durante la registrazione:', error);
    throw error.response?.data || error;
  }
};

/**
 * Effettua il login di un utente
 * @param {string} email - Email dell'utente
 * @param {string} password - Password dell'utente
 * @returns {Promise} Promise con la risposta dal server
 */
const login = async (email, password) => {
  try {
    console.log('Tentativo di login con:', { email });
    console.log('URL del backend:', apiUrl);

    // Verifica che il server sia raggiungibile
    try {
      await axiosInstance.get('/api/health');
    } catch (error) {
      console.error('Server non raggiungibile:', error);
      throw new Error(`Il server non è raggiungibile. Verifica che sia in esecuzione su ${apiUrl}`);
    }

    // Effettua la richiesta di login
    const response = await axiosInstance.post('/api/auth/login', { email, password });
    console.log('Risposta completa dal server:', response);

    if (!response.data) {
      throw new Error('Risposta vuota dal server');
    }

    if (!response.data.success) {
      throw new Error(response.data.message || 'Errore durante il login');
    }

    if (!response.data.token) {
      console.error('Risposta senza token:', response.data);
      throw new Error('Token non ricevuto dal server. Verifica le credenziali e riprova.');
    }

    // Salva il token e i dati utente
    localStorage.setItem('token', response.data.token);
    updateLocalUserData(response.data.user);

    return response.data;
  } catch (error) {
    console.error('Errore durante il login:', error);
    
    if (error.response) {
      // Il server ha risposto con un errore
      console.error('Dettagli errore server:', error.response.data);
      if (error.response.status === 401) {
        throw new Error('Credenziali non valide');
      } else if (error.response.status === 404) {
        throw new Error(`Endpoint non trovato. Verifica la configurazione del server (${apiUrl})`);
      } else {
        throw new Error(error.response.data?.message || 'Errore durante il login');
      }
    } else if (error.request) {
      // La richiesta è stata fatta ma non c'è stata risposta
      throw new Error(`Nessuna risposta dal server. Verifica che sia in esecuzione su ${apiUrl}`);
    } else {
      // Errore nella configurazione della richiesta
      throw error;
    }
  }
};

/**
 * Effettua il logout dell'utente
 */
const logout = async () => {
  try {
    await axiosInstance.post('/api/auth/logout');
  } catch (error) {
    console.error('Errore durante il logout:', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    profileImageCache.clear();
  }
};

/**
 * Recupera l'utente corrente dal localStorage
 * @returns {Object|null} Oggetto utente o null se non autenticato
 */
const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Verifica se l'utente è autenticato
 * @returns {boolean} true se l'utente è autenticato
 */
const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Ottiene il token di autenticazione
 * @returns {string|null} Il token di autenticazione o null
 */
const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Verifica il token dell'utente
 * @returns {Promise} Promise con i dati dell'utente
 */
const verifyToken = async () => {
  try {
    const response = await axiosInstance.get('/api/auth/me');
    if (response.data) {
      // Aggiorna i dati dell'utente nel localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
      if (response.data.profileImage) {
        getProfileImageUrl(response.data.profileImage);
      }
    }
    return response.data;
  } catch (error) {
    console.error('Errore durante la verifica del token:', error);
    // Se il token non è valido, pulisci il localStorage
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw error.response?.data || error;
  }
};

/**
 * Verifica se il token è scaduto
 * @returns {boolean} true se il token è scaduto
 */
const isTokenExpired = () => {
  const token = localStorage.getItem('token');
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    console.error('Errore durante la verifica della scadenza del token:', error);
    return true;
  }
};

/**
 * Aggiorna il token
 * @returns {Promise} Promise con il nuovo token
 */
const refreshToken = async () => {
  try {
    const response = await axiosInstance.post('/api/auth/refresh-token');
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('Errore durante il refresh del token:', error);
    throw error.response?.data || error;
  }
};

/**
 * Aggiorna i dati dell'utente
 * @param {Object} userData - Nuovi dati dell'utente
 * @returns {Promise} Promise con i dati aggiornati
 */
const updateProfile = async (userData) => {
  try {
    const response = await axiosInstance.put('/api/auth/update-profile', userData);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    console.error('Errore durante l\'aggiornamento del profilo:', error);
    throw error.response?.data || error;
  }
};

/**
 * Cambia la password dell'utente
 * @param {Object} passwordData - Vecchia e nuova password
 * @returns {Promise} Promise con il risultato dell'operazione
 */
const changePassword = async (passwordData) => {
  try {
    const response = await axiosInstance.put('/api/auth/password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Errore durante il cambio password:', error);
    throw error.response?.data || error;
  }
};

/**
 * Richiede il reset della password
 * @param {string} email - Email dell'utente
 * @returns {Promise} Promise con il risultato dell'operazione
 */
const requestPasswordReset = async (email) => {
  try {
    const response = await axiosInstance.post('/api/auth/reset-password', { email });
    return response.data;
  } catch (error) {
    console.error('Errore durante la richiesta di reset password:', error);
    throw error.response?.data || error;
  }
};

// Oggetto del servizio di autenticazione
const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  getAuthToken,
  verifyToken,
  getProfileImageUrl,
  updateProfile,
  changePassword,
  requestPasswordReset,
  isTokenExpired,
  refreshToken,
  updateLocalUserData
};

// Esporta sia come default che come named export
export { authService };
export default authService;