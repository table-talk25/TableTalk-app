import axios from 'axios';

// Configurazione base per axios
const axiosConfig = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000, // Aumentato il timeout a 15 secondi
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Accetta tutte le risposte HTTP
  }
};

console.log('🔧 Configurazione axios:', {
  baseURL: axiosConfig.baseURL,
  timeout: axiosConfig.timeout
});

// Crea un'istanza di axios con la configurazione
const axiosInstance = axios.create(axiosConfig);

// Interceptor per le richieste
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('📤 Richiesta in uscita:', {
      url: `${config.baseURL}${config.url}`,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    
    // Aggiungi il token di autenticazione se presente
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Token aggiunto alla richiesta:', token);
    } else {
      console.warn('⚠️ Nessun token trovato nel localStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ Errore nella configurazione della richiesta:', error);
    return Promise.reject(new Error('Errore nella configurazione della richiesta. Riprova più tardi.'));
  }
);

// Interceptor per le risposte
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('📥 Risposta ricevuta:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('❌ Errore nella risposta:', error);

    // Gestione errori CORS
    if (error.message === 'Network Error') {
      console.error('🌐 Errore di rete - Verifica la connessione al server');
      console.error('URL tentato:', error.config?.baseURL + error.config?.url);
      return Promise.reject(new Error('Impossibile connettersi al server. Verifica che:\n1. Il server backend sia in esecuzione su http://localhost:5001\n2. Non ci siano problemi di CORS\n3. La porta 5001 sia accessibile'));
    }

    // Gestione errori di timeout
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout della richiesta');
      return Promise.reject(new Error('La richiesta ha impiegato troppo tempo. Verifica la tua connessione internet.'));
    }

    // Gestione errori di autenticazione
    if (error.response?.status === 401) {
      console.log('🔒 Sessione scaduta - Reindirizzamento al login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(new Error('Sessione scaduta. Effettua nuovamente il login.'));
    }

    // Gestione degli errori di rete
    if (!error.response) {
      console.error('🌐 Errore di rete:', error);
      console.error('Configurazione della richiesta:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers
      });
      return Promise.reject(new Error('Impossibile connettersi al server. Verifica che:\n1. Il server backend sia in esecuzione\n2. La tua connessione internet sia attiva\n3. Non ci siano problemi di firewall'));
    }

    // Gestione errori del server
    if (error.response?.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }

    // Gestione altri errori
    return Promise.reject(new Error('Si è verificato un errore durante la richiesta. Riprova più tardi.'));
  }
);

export default axiosInstance; 