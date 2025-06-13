const mongoose = require('mongoose');

/**
 * Schema per i pasti virtuali nell'app TableTalk
 * Gestisce le informazioni sui pasti, i partecipanti e i link per videochiamata
 */
const MealSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Per favore inserisci un titolo per il pasto virtuale'],
    trim: true,
    maxlength: [100, 'Il titolo non può superare i 100 caratteri'],
    minlength: [10, 'Il titolo deve essere di almeno 10 caratteri']
  },
  type: {
    type: String,
    required: [true, 'Il tipo di pasto è obbligatorio'],
    enum: {
      values: ['breakfast', 'lunch', 'dinner', 'aperitif'],
      message: 'Il tipo di pasto deve essere uno tra: colazione, pranzo, cena, aperitivo' 
    }
  },
  description: {
    type: String,
    required: [true, 'Per favore inserisci una descrizione'],
    maxlength: [1000, 'La descrizione non può superare i 1000 caratteri'],
    minlength: [10, 'La descrizione deve essere di almeno 10 caratteri']
  },
  date: {
    type: Date,
    required: [true, 'Per favore specifica data e ora del pasto'],
    validate: [
      {
        validator: function(date) {
          return date instanceof Date && !isNaN(date.getTime());
        },
        message: 'La data deve essere in formato ISO8601 valido'
      },
      {
        validator: function(date) {
          return date > new Date();
        },
        message: 'La data del pasto deve essere futura'
      }
    ]
  },
  duration: {
    type: Number,
    required: false,
    default: 120,
    min: [15, 'La durata minima è di 15 minuti'],
    max: [180, 'La durata massima è di 3 ore'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value >= 15 && value <= 180;
      },
      message: 'La durata deve essere un numero intero tra 15 e 180 minuti'
    }
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Per favore specifica il numero massimo di partecipanti'],
    min: [2, 'Ci devono essere almeno 2 partecipanti'],
    max: [10, 'Non possono partecipare più di 10 persone'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value >= 2 && value <= 10;
      },
      message: 'Il numero di partecipanti deve essere un intero tra 2 e 10'
    }
  },
  host: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  participantsCount: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    required: [true, 'Per favore specifica la lingua principale della conversazione'],
    enum: {
      values: ['Italiano', 'English', 'Español', 'Français', 'Deutsch', '中文', 'العربية'],
      message: 'La lingua deve essere una tra: Italiano, English, Español, Français, Deutsch, 中文, العربية'
    }
  },
  topics: {
    type: [String],
    validate: [
      {
        validator: function(topics) {
          return Array.isArray(topics) && topics.length >= 1 && topics.length <= 5;
        },
        message: 'Devi specificare da 1 a 5 argomenti'
      },
      {
        validator: function(topics) {
          return topics.every(topic => 
            typeof topic === 'string' && 
            topic.trim().length >= 2 && 
            topic.trim().length <= 50
          );
        },
        message: 'Ogni argomento deve essere una stringa tra 2 e 50 caratteri'
      }
    ]
  },
  videoCallLink: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || v.startsWith('http');
      },
      message: 'Il link della videochiamata deve essere un URL valido'
    }
  },
  videoCallProvider: {
    type: String,
    enum: ['jitsi', 'zoom', 'meet', 'altro'],
    default: 'jitsi'
  },
  chatId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Chat'
  },
  status: {
    type: String,
    required: [true, 'Lo stato del pasto è obbligatorio'],
    enum: {
      values: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      message: 'Lo stato del pasto deve essere uno tra: upcoming, ongoing, completed, cancelled'
    },
    default: 'upcoming'
  },
  settings: {
    allowLateJoin: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    videoQuality: {
      type: String,
      enum: ['SD', 'HD', 'FullHD'],
      default: 'HD'
    },
    backgroundBlur: {
      type: Boolean,
      default: true
    }
  },
  // Nuovo campo per le notifiche
  notifications: [{
    type: {
      type: String,
      enum: ['join', 'leave', 'update', 'reminder', 'system'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    recipient: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Nuovo campo per i rating
  ratings: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indici per ottimizzare le query
MealSchema.index({ date: 1, status: 1 });
MealSchema.index({ host: 1 });
MealSchema.index({ participants: 1 });
MealSchema.index({ language: 1 });
MealSchema.index({ topics: 1 });
MealSchema.index({ 'notifications.recipient': 1, 'notifications.read': 1 });
MealSchema.index({ 'ratings.user': 1 });

// Virtual per vedere se il pasto è pieno
MealSchema.virtual('isFull').get(function() {
  return this.participantsCount >= this.maxParticipants;
});

// Virtual per vedere se il pasto è passato
MealSchema.virtual('isPast').get(function() {
  return new Date(this.date) < new Date();
});

// Virtual per vedere se il pasto è in corso
MealSchema.virtual('isActive').get(function() {
  const now = new Date();
  const endTime = new Date(this.date.getTime() + this.duration * 60000);
  return now >= this.date && now <= endTime;
});

// Virtual per vedere il tempo rimanente
MealSchema.virtual('timeRemaining').get(function() {
  if (this.isPast) return 0;
  return Math.max(0, this.date - new Date());
});

// Virtual per la media dei rating
MealSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, curr) => acc + curr.score, 0);
  return sum / this.ratings.length;
});

// Metodo per ottenere i pasti futuri
MealSchema.statics.findUpcoming = function() {
  return this.find({
    date: { $gt: new Date() },
    status: 'upcoming'
  }).sort({ date: 1 });
};

// Metodo per ottenere i pasti attivi
MealSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    date: { $lte: now },
    status: 'ongoing'
  });
};

// Metodo per ottenere i pasti di un utente
MealSchema.statics.findUserMeals = function(userId) {
  return this.find({
    $or: [
      { host: userId },
      { participants: userId }
    ]
  }).sort({ date: -1 });
};

// Unico pre-save hook combinato e corretto
MealSchema.pre('save', function(next) {
  // Aggiorna il conteggio dei partecipanti se l'array è stato modificato
  if (this.isModified('participants')) {
    this.participantsCount = this.participants.length;
  }

  // Aggiunge automaticamente l'organizzatore (host) ai partecipanti alla creazione del pasto
  if (this.isNew && !this.participants.includes(this.host)) {
    this.participants.push(this.host);
  }

  next();
});

// Metodo per verificare se un utente è l'host del pasto
MealSchema.methods.isHost = function(userId) {
  return this.host.toString() === userId.toString();
};

// Metodo per verificare se un utente è partecipante al pasto
MealSchema.methods.isParticipant = function(userId) {
  return this.participants.some(participant => 
    participant.toString() === userId.toString()
  );
};

// Metodo per aggiungere un partecipante
MealSchema.methods.addParticipant = function(userId) {
  if (this.isFull) {
    throw new Error('Il pasto ha raggiunto il numero massimo di partecipanti');
  }
  if (this.isParticipant(userId)) {
    throw new Error('Sei già un partecipante di questo pasto');
  }
  if (this.isPast) {
    throw new Error('Non è possibile unirsi a un pasto già passato');
  }
  if (!this.settings.allowLateJoin && this.isActive) {
    throw new Error('Non è possibile unirsi a un pasto già iniziato');
  }
  
  this.participants.push(userId);
  
  // Aggiungi notifica all'array, ma non salvare ancora
  this.notifications.push({
    type: 'join',
    message: 'Un nuovo partecipante si è unito al pasto',
    recipient: this.host
  });
  
  // Un solo salvataggio alla fine
  return this.save();
};

// Metodo per rimuovere un partecipante
MealSchema.methods.removeParticipant = function(userId) {
  if (this.isHost(userId)) {
    throw new Error('L\'host non può lasciare il pasto');
  }
  if (!this.isParticipant(userId)) {
    throw new Error('Non sei un partecipante di questo pasto');
  }
  
  this.participants = this.participants.filter(
    p => p.toString() !== userId.toString()
  );
  
  // Aggiungi notifica all'array, ma non salvare ancora
  this.notifications.push({
    type: 'leave',
    message: 'Un partecipante ha lasciato il pasto',
    recipient: this.host
  });
  
  // Un solo salvataggio alla fine
  return this.save();
};

// Metodo per aggiungere un rating
MealSchema.methods.addRating = function(userId, score, comment) {
  if (!this.isParticipant(userId)) {
    throw new Error('Solo i partecipanti possono lasciare un rating');
  }
  
  const existingRating = this.ratings.find(r => r.user.toString() === userId.toString());
  if (existingRating) {
    existingRating.score = score;
    existingRating.comment = comment;
    existingRating.createdAt = Date.now();
  } else {
    this.ratings.push({ user: userId, score, comment });
  }
  
  return this.save();
};

// Metodo per aggiungere una notifica
MealSchema.methods.addNotification = function(type, message, recipient) {
  this.notifications.push({
    type,
    message,
    recipient,
    read: false
  });
  return this.save();
};

// Metodo per marcare le notifiche come lette
MealSchema.methods.markNotificationsAsRead = function(userId) {
  this.notifications.forEach(notification => {
    if (notification.recipient.toString() === userId.toString()) {
      notification.read = true;
    }
  });
  return this.save();
};

// Metodo per aggiornare lo stato del pasto
MealSchema.methods.updateStatus = function(newStatus) {
  if (!['upcoming', 'ongoing', 'completed', 'cancelled'].includes(newStatus)) {
    throw new Error('Stato non valido');
  }
  
  this.status = newStatus;
  
  // Aggiungi notifica per tutti i partecipanti
  const notificationMessage = `Il pasto è stato ${newStatus}`;
  this.participants.forEach(participant => {
    this.notifications.push({
      type: 'update',
      message: notificationMessage,
      recipient: participant
    });
  });
  
  return this.save();
};

module.exports = mongoose.model('Meal', MealSchema);