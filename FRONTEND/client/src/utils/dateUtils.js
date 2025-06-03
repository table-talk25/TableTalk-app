// Formatta una data in formato italiano
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Formatta una data e ora in formato italiano
export const formatDateTime = (date) => {
  return new Date(date).toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calcola il tempo rimanente fino a una data
export const getTimeRemaining = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diff = target - now;

  if (diff <= 0) {
    return 'In corso';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} giorni e ${hours} ore`;
  } else if (hours > 0) {
    return `${hours} ore e ${minutes} minuti`;
  } else {
    return `${minutes} minuti`;
  }
};

// Verifica se una data è passata
export const isPastDate = (date) => {
  return new Date(date) < new Date();
};

// Verifica se una data è futura
export const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

// Formatta la durata in ore e minuti
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes} minuti`;
  } else if (remainingMinutes === 0) {
    return `${hours} ore`;
  } else {
    return `${hours} ore e ${remainingMinutes} minuti`;
  }
};