// Formatta data e ora in un formato leggibile
export const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    
    // Ottieni data formattata (es. "15 Maggio 2024")
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('it-IT', options);
    
    // Ottieni ora formattata (es. "18:30")
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    
    return `${formattedDate}, ${formattedTime}`;
  };
  
  // Controlla se la data è oggi
  export const isToday = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const today = new Date();
    
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  // Calcola il tempo rimanente fino a una data (in formato leggibile)
  export const getTimeUntil = (dateTimeString) => {
    const now = new Date();
    const date = new Date(dateTimeString);
    const diffMs = date - now;
    
    // Se la data è passata
    if (diffMs < 0) {
      return 'Evento passato';
    }
    
    // Calcola giorni, ore e minuti
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `Tra ${diffDays} ${diffDays === 1 ? 'giorno' : 'giorni'}`;
    } else if (diffHours > 0) {
      return `Tra ${diffHours} ${diffHours === 1 ? 'ora' : 'ore'}`;
    } else {
      return `Tra ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minuti'}`;
    }
  };