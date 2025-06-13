/**
 * Formatta una data in un formato leggibile in italiano
 * @param {string} dateString - La data da formattare
 * @returns {string} La data formattata
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Data non disponibile';
  const options = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return new Date(dateString).toLocaleDateString('it-IT', options);
};

/**
 * Ottiene il testo in italiano per il tipo di pasto
 * @param {string} type - Il tipo di pasto
 * @returns {string} Il testo in italiano del tipo di pasto
 */
export const getMealTypeText = (type) => {
  const types = {
    colazione: 'Colazione',
    pranzo: 'Pranzo',
    cena: 'Cena',
    aperitivo: 'Aperitivo'
  };
  return types[type] || type;
};

/**
 * Ottiene il colore associato al tipo di pasto
 * @param {string} type - Il tipo di pasto
 * @returns {string} Il codice colore esadecimale
 */
export const getMealTypeColor = (type) => {
  const colors = {
    colazione: '#ffc107', // Giallo per colazione
    pranzo: '#28a745',    // Verde per pranzo
    cena: '#6f42c1',      // Viola per cena
    aperitivo: '#fd7e14'  // Arancione per aperitivo
  };
  return colors[type] || '#007bff'; // Blu predefinito
}; 

/**
 * Traduce lo stato di un pasto (ricevuto dal backend in inglese)
 * in un testo leggibile in italiano per l'utente.
 * @param {string} statusKey - La chiave dello stato (es. 'upcoming').
 * @returns {string} Il testo in italiano (es. 'Pianificato').
 */
export const getMealStatusText = (statusKey) => {
  const statusTranslations = {
    upcoming: 'Pianificato',
    ongoing: 'In corso',
    completed: 'Completato',
    cancelled: 'Cancellato',
  };
  return statusTranslations[statusKey] || statusKey;
};