const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Schema utente per l'app TableTalk
 * Gestisce i dati dell'utente, l'autenticazione e le relazioni con i pasti
 */
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email obbligatoria'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email non valida']
  },
  password: {
    type: String,
    required: [true, 'Password obbligatoria'],
    minlength: [8, 'La password deve essere di almeno 8 caratteri'],
    select: false
  },
  name: {
    type: String,
    required: [true, 'Nome obbligatorio'],
    trim: true
  },
  surname: {
    type: String,
    required: [true, 'Cognome obbligatorio'],
    trim: true
  },
  nickname: {
    type: String,
    unique: true,
    trim: true,
    minlength: [3, 'Il nickname deve essere di almeno 3 caratteri'],
    maxlength: [50, 'Il nickname non può essere più lungo di 50 caratteri'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Il nickname può contenere solo lettere, numeri, trattini e underscore']
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  gender: {
    type: String,
    enum: ['uomo', 'donna', 'altro', 'preferisco_non_dirlo'],
    default: 'preferisco_non_dirlo'
  },
  age: {
    type: Number,
    min: [18, 'Devi avere almeno 18 anni per utilizzare questa app'],
    max: [120, 'Per favore inserisci un\'età valida']
  },
  interests: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 10;
      },
      message: 'Non possono essere specificati più di 10 interessi'
    }
  },
  languages: {
    type: [String],
    default: ['Italiano'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'Deve essere specificata almeno una lingua'
    }
  },
  bio: {
    type: String,
    maxlength: [500, 'La bio non può essere più lunga di 500 caratteri'],
    trim: true
  },
  profileImage: {
    type: String,
    default: 'default-avatar.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdMeals: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Meal'
  }],
  joinedMeals: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Meal'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  settings: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      showAge: {
        type: Boolean,
        default: true
      },
      showEmail: {
        type: Boolean,
        default: false
      }
    },
    language: {
      type: String,
      default: 'it'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indici per ottimizzare le query
UserSchema.index({ email: 1 });
UserSchema.index({ nickname: 1 });
UserSchema.index({ languages: 1 });
UserSchema.index({ interests: 1 });

// Virtual per ottenere il numero di pasti creati
UserSchema.virtual('mealsCount').get(function() {
  return this.createdMeals.length;
});

// Virtual per ottenere il numero di pasti a cui partecipa
UserSchema.virtual('joinedMealsCount').get(function() {
  return this.joinedMeals.length;
});

// Middleware pre-save per hashare la password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Aggiorna updatedAt quando il documento viene modificato
UserSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

// Metodo per confrontare le password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Metodo per generare il token JWT
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Metodo per generare token di verifica
UserSchema.methods.generateVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = token;
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 ore
  return token;
};

// Metodo per generare token di reset password
UserSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = token;
  this.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 ora
  return token;
};

// Metodo per pulire i dati sensibili
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.verificationTokenExpires;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

// Metodo per verificare se l'account è bloccato
UserSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Metodo per incrementare i tentativi di login
UserSchema.methods.incrementLoginAttempts = async function() {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Blocca per 30 minuti
  }
  await this.save();
};

// Metodo per resettare i tentativi di login
UserSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  await this.save();
};

// Metodo per aggiornare il profilo
UserSchema.methods.updateProfile = async function(updates) {
  const allowedUpdates = [
    'nickname', 'gender', 'age', 'interests', 
    'languages', 'bio', 'profileImage', 'settings'
  ];

  let hasValidUpdate = false;
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      // Aggiungi un controllo per non sovrascrivere con undefined se il campo non è esplicitamente inviato per essere cancellato
      if (updates[key] !== undefined) {
        this[key] = updates[key];
        hasValidUpdate = true;
      }
    }
  });

  if (!hasValidUpdate && Object.keys(updates).length > 0) {
    // Se sono stati inviati solo campi non permessi
    // Questo caso potrebbe essere gestito meglio nel controller
  }

  this.profileCompleted = this.checkProfileCompletion();
  return this.save(); // Qui avvengono le validazioni Mongoose
};

// Metodo per verificare se il profilo è completo
UserSchema.methods.checkProfileCompletion = function() {
  return !!(
    this.nickname &&
    this.gender &&
    this.age &&
    this.languages.length > 0 &&
    this.interests.length > 0 &&
    this.bio
  );
};

const User = mongoose.model('User', UserSchema);

module.exports = User;