import axiosInstance from '../config/axiosConfig';

// Costanti per la traduzione dei tipi di pasto
const MEAL_TYPES = {
  'colazione': 'breakfast',
  'pranzo': 'lunch',
  'cena': 'dinner',
  'aperitivo': 'aperitif'
};

// Costanti per la traduzione degli stati
const STATUS_TYPES = {
  'pianificato': 'upcoming',
  'in corso': 'ongoing',
  'completato': 'completed',
  'cancellato': 'cancelled'
};

const LANGUAGES = {
  it: 'italiano',
  en: 'inglese',
  es: 'spagnolo',
  fr: 'francese',
  de: 'tedesco',
  zh: 'cinese',
  ar: 'arabo'
};

const VALID_LANGUAGES = ['Italiano', 'English', 'Español', 'Français', 'Deutsch', '中文', 'العربية'];

// Funzione per convertire i valori in italiano
const translateToItalian = (data) => {
  if (!data) return data;
  
  const translated = { ...data };
  
  if (translated.type) {
    const italianType = Object.entries(MEAL_TYPES).find(([_, value]) => value === translated.type)?.[0];
    if (italianType) translated.type = italianType;
  }
  
  if (translated.status) {
    const italianStatus = Object.entries(STATUS_TYPES).find(([_, value]) => value === translated.status)?.[0];
    if (italianStatus) translated.status = italianStatus;
  }
  
  return translated;
};

// Funzione per convertire i valori in inglese
const translateToEnglish = (data) => {
  if (!data) return data;
  
  const translated = { ...data };
  
  if (translated.type) {
    translated.type = MEAL_TYPES[translated.type] || translated.type;
  }
  
  if (translated.status) {
    translated.status = STATUS_TYPES[translated.status] || translated.status;
  }
  
  return translated;
};

// Classe personalizzata per gli errori
class MealServiceError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'MealServiceError';
    this.status = status;
    this.code = code;
  }
}

// Funzione per gestire gli errori
const handleError = (error) => {
  console.error('❌ Errore nel servizio pasti:', error);
  
  if (error.response) {
    // Il server ha risposto con un codice di errore
    console.error('Dettagli errore server:', {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers
    });
    throw new MealServiceError(
      error.response.data?.message || 'Si è verificato un errore',
      error.response.status,
      error.response.data?.code
    );
  } else if (error.request) {
    // La richiesta è stata fatta ma non c'è stata risposta
    console.error('Nessuna risposta dal server:', error.request);
    throw new MealServiceError('Errore di connessione al server', 503, 'CONNECTION_ERROR');
  } else {
    // Errore nella configurazione della richiesta
    console.error('Errore nella configurazione:', error.message);
    throw new MealServiceError(`Errore nella configurazione della richiesta: ${error.message}`, 500, 'CONFIG_ERROR');
  }
};

// Funzione per tradurre i filtri
const translateFilters = (filters) => {
  const translatedFilters = { ...filters };
  if (translatedFilters.type) {
    translatedFilters.type = MEAL_TYPES[translatedFilters.type] || translatedFilters.type;
  }
  if (translatedFilters.status) {
    translatedFilters.status = STATUS_TYPES[translatedFilters.status] || translatedFilters.status;
  }
  return translatedFilters;
};

// Funzione per tradurre i dati del pasto
const translateMealData = (meal) => {
  if (!meal) return meal;
  return {
    ...meal,
    type: MEAL_TYPES[meal.type] || meal.type,
    status: STATUS_TYPES[meal.status] || meal.status
  };
};

/**
 * Crea un nuovo pasto
 * @param {Object} mealData - Dati del pasto da creare
 * @returns {Promise} Promise con i dati del pasto creato
 */
export const createMeal = async (mealData) => {
  try {
    // Log iniziale dei dati ricevuti
    console.log('📝 Dati del pasto ricevuti:', {
      title: mealData.title,
      type: mealData.type,
      date: mealData.date,
      maxParticipants: mealData.maxParticipants,
      description: mealData.description,
      language: mealData.language,
      topics: mealData.topics,
      settings: mealData.settings
    });

    // Verifica il token
    const token = localStorage.getItem('token');
    console.log('🔑 Token presente:', !!token);

    if (!token) {
      console.error('❌ Token mancante');
      throw new MealServiceError('Token di autenticazione mancante. Effettua il login.', 401, 'NO_TOKEN');
    }

    // Verifica i dati prima dell'invio
    console.log('🔍 Verifica dati prima dell\'invio:', {
      title: mealData.title,
      type: mealData.type,
      date: mealData.date,
      maxParticipants: mealData.maxParticipants,
      description: mealData.description,
      language: mealData.language,
      topics: mealData.topics,
      settings: mealData.settings
    });

    // Verifica che mealData sia un oggetto valido
    if (!mealData || typeof mealData !== 'object') {
      console.error('❌ Dati non validi:', mealData);
      throw new MealServiceError('Dati del pasto non validi', 400, 'INVALID_DATA');
    }
    
    // Verifica che tutti i campi obbligatori siano presenti e validi
    const requiredFields = ['title', 'type', 'date', 'maxParticipants', 'description', 'language', 'topics'];
    const missingFields = requiredFields.filter(field => {
      const value = mealData[field];
      return !value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim().length === 0);
    });
    
    if (missingFields.length > 0) {
      console.error('❌ Campi mancanti:', missingFields);
      throw new MealServiceError(
        `Campi obbligatori mancanti o vuoti: ${missingFields.join(', ')}`,
        400,
        'MISSING_FIELDS'
      );
    }

    // Verifica il formato dei dati
    if (typeof mealData.title !== 'string' || mealData.title.trim().length < 10) {
      console.error('❌ Titolo non valido:', mealData.title);
      throw new MealServiceError('Il titolo deve essere di almeno 10 caratteri', 400, 'INVALID_TITLE');
    }

    if (typeof mealData.description !== 'string' || mealData.description.trim().length < 10 || mealData.description.trim().length > 1000) {
      console.error('❌ Descrizione non valida:', mealData.description);
      throw new MealServiceError('La descrizione deve essere tra 10 e 1000 caratteri', 400, 'INVALID_DESCRIPTION');
    }

    const VALID_MEAL_TYPES = ['colazione', 'pranzo', 'cena', 'aperitivo'];
    
    if (!VALID_MEAL_TYPES.includes(mealData.type)) {
      console.error('❌ Tipo di pasto non valido:', mealData.type);
      throw new MealServiceError(
        `Il tipo di pasto deve essere uno tra: ${VALID_MEAL_TYPES.join(', ')}`,
        400,
        'INVALID_TYPE'
      );
    }

    // Verifica gli argomenti
    if (!Array.isArray(mealData.topics) || mealData.topics.length < 1 || mealData.topics.length > 5) {
      console.error('❌ Numero di argomenti non valido:', mealData.topics);
      throw new MealServiceError(
        'Devi specificare da 1 a 5 argomenti',
        400,
        'INVALID_TOPICS_COUNT'
      );
    }

    // Verifica ogni argomento
    const invalidTopic = mealData.topics.find(topic => 
      typeof topic !== 'string' || 
      topic.trim().length < 2 || 
      topic.trim().length > 50
    );

    if (invalidTopic) {
      console.error('❌ Argomento non valido:', invalidTopic);
      throw new MealServiceError(
        'Ogni argomento deve essere una stringa tra 2 e 50 caratteri',
        400,
        'INVALID_TOPIC_FORMAT'
      );
    }

    // Converti i dati in inglese prima dell'invio
    const formattedMealData = translateToEnglish({
      ...mealData,
      title: mealData.title.trim(),
      description: mealData.description.trim(),
      date: new Date(mealData.date).toISOString(),
      maxParticipants: parseInt(mealData.maxParticipants, 10),
      topics: [...new Set(mealData.topics.map(topic => topic.trim()))],
      language: mealData.language,
      duration: parseInt(mealData.duration, 10) || 120,
      settings: {
        allowLateJoin: mealData.settings?.allowLateJoin ?? true,
        requireApproval: mealData.settings?.requireApproval ?? false,
        videoQuality: mealData.settings?.videoQuality ?? 'HD',
        backgroundBlur: mealData.settings?.backgroundBlur ?? true,
        ...mealData.settings
      }
    });

    console.log('📤 Dati formattati per l\'invio:', formattedMealData);

    // Verifica la configurazione di axios
    console.log('🔧 Configurazione axios:', {
      baseURL: axiosInstance.defaults.baseURL,
      timeout: axiosInstance.defaults.timeout,
      hasAuthHeader: !!axiosInstance.defaults.headers?.Authorization || !!axiosInstance.defaults.headers?.common?.Authorization
    });
    
    // Esegui la richiesta con gestione dettagliata degli errori
    const response = await axiosInstance.post('/api/meals', formattedMealData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000 // 30 secondi di timeout
    });
    
    console.log('📥 Risposta dal server:', {
      status: response.status,
      data: response.data
    });

    // Verifica che la risposta contenga i dati necessari
    if (!response.data) {
      console.error('❌ Risposta non valida:', response);
      throw new MealServiceError(
        'Risposta non valida dal server',
        500,
        'INVALID_RESPONSE'
      );
    }
    
    // Gestisci diversi formati di risposta
    if (response.data.success === false) {
      console.error('❌ Errore dal server:', response.data);
      throw new MealServiceError(
        response.data.message || 'Errore durante la creazione del pasto',
        response.status || 400,
        response.data.code || 'SERVER_ERROR'
      );
    }

    // Restituisci i dati del pasto creato
    const createdMeal = response.data.data || response.data;
    console.log('✅ Pasto creato con successo:', createdMeal);
    return createdMeal;

  } catch (error) {
    console.error('❌ Errore nella creazione del pasto:', error);
    
    // Se è già un MealServiceError, ri-lancialo
    if (error instanceof MealServiceError) {
      throw error;
    }
        
    // Log dettagliato dell'errore per debugging
    if (error.config) {
      console.error('Configurazione della richiesta:', {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL,
        headers: error.config.headers ? Object.keys(error.config.headers) : 'none',
        data: typeof error.config.data === 'string' ? 'string data' : 'object data'
      });
    }
    
    if (error.response) {
      console.error('Risposta del server:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: Object.keys(error.response.headers || {})
      });
    }
    
    // Gestisci l'errore usando la funzione helper
    handleError(error);
  }
};

/**
 * Ottiene la lista dei pasti
 * @param {Object} filters - Filtri da applicare
 * @returns {Promise} Promise con la lista dei pasti
 */
export const getMeals = async (filters = {}) => {
  try {
    const translatedFilters = translateFilters(filters);
    const queryString = new URLSearchParams(translatedFilters).toString();
    const response = await axiosInstance.get('/api/meals', { params: translatedFilters });
    return response.data.data.map(translateMealData);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * @param {string} mealId - ID del pasto
 * @returns {Promise} Promise con i dettagli del pasto
 */
export const getMealById = async (mealId) => {
  try {
    if (!mealId) {
      throw new MealServiceError('ID del pasto mancante', 400, 'MISSING_MEAL_ID');
    }
    
    const response = await axiosInstance.get(`/api/meals/${mealId}`);
    return response.data.data || response.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Aggiorna un pasto
 * @param {string} mealId - ID del pasto
 * @param {Object} mealData - Nuovi dati del pasto
 * @returns {Promise} Promise con i dati aggiornati
 */
export const updateMeal = async (mealId, mealData) => {
  try {
    if (!mealId) {
      throw new MealServiceError('ID del pasto mancante', 400, 'MISSING_MEAL_ID');
    }
    
    const translatedData = translateFilters(mealData);
    const response = await axiosInstance.put(`/api/meals/${mealId}`, translatedData);
    return response.data.data || response.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Cancella un pasto
 * @param {string} mealId - ID del pasto
 * @returns {Promise} Promise con il risultato dell'operazione
 */
export const deleteMeal = async (mealId) => {
  try {
    if (!mealId) {
      throw new MealServiceError('ID del pasto mancante', 400, 'MISSING_MEAL_ID');
    }
    
    const response = await axiosInstance.delete(`/api/meals/${mealId}`);
    return response.data.data || response.data;
  } catch (error) {
    handleError(error);
  }
};
/**Partecipa a un pasto
 * @param {string} mealId - ID del pasto
 * @returns {Promise} Promise con i dati aggiornati del pasto
 */
export const joinMeal = async (mealId) => {
  try {
    if (!mealId) {
      throw new MealServiceError('ID del pasto mancante', 400, 'MISSING_MEAL_ID');
    }
    
    const response = await axiosInstance.post(`/api/meals/${mealId}/join`);
    return response.data.data || response.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Lascia un pasto
 * @param {string} mealId - ID del pasto
 * @returns {Promise} Promise con i dati aggiornati del pasto
 */
export const leaveMeal = async (mealId) => {
  try {
    if (!mealId) {
      throw new MealServiceError('ID del pasto mancante', 400, 'MISSING_MEAL_ID');
    }
    
    const response = await axiosInstance.post(`/api/meals/${mealId}/leave`);
    return response.data.data || response.data;
  } catch (error) {
    handleError(error);
  }
};


/**
 * Ottiene i pasti dell'utente
 * @param {string} type - Tipo di pasti da recuperare ('hosted' o 'joined')
 * @returns {Promise} Promise con la lista dei pasti
 */
export const getUserMeals = async (type = 'hosted') => {
  try {
    if (!['hosted', 'joined'].includes(type)) {
      throw new MealServiceError('Tipo di pasti non valido', 400, 'INVALID_TYPE');
    }
    
    const response = await axiosInstance.get(`/api/meals/user/${type}`);
    const meals = response.data.data || response.data;
    
    if (!Array.isArray(meals)) {
      throw new MealServiceError('Formato risposta non valido', 500, 'INVALID_RESPONSE');
    }
    
    return meals.map(translateMealData);
  } catch (error) {
    handleError(error);
  }
};

// Oggetto del servizio pasti per compatibilità
const mealService = {
  createMeal,
  getMeals,
  getMealById,
  updateMeal,
  deleteMeal,
  joinMeal,
  leaveMeal,
  getUserMeals
};

// Esporta sia come default che come named export
export { mealService, MealServiceError };
export default mealService;