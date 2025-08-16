// File: BACKEND/models/User.js (Versione Definitiva e Completa)

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Meal = require('./Meal');
const Chat = require('./Chat');
const Invitation = require('./Invitation');

const UserSchema = new mongoose.Schema(
  {
    // --- CAMPI DI REGISTRAZIONE E IDENTITÀ ---
    name: { type: String, required: [true, 'Il nome è obbligatorio'], trim: true },
    surname: { type: String, required: [true, 'Il cognome è obbligatorio'], trim: true },
    email: { type: String, required: [true, 'L\'email è obbligatoria'], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Email non valida'] },
    password: { type: String, minlength: 8, select: false }, // Rimosso required per permettere login social
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // --- CAMPI PER AUTENTICAZIONE SOCIAL ---
    googleId: { type: String, unique: true, sparse: true },
    appleId: { type: String, unique: true, sparse: true },
    authProvider: { type: String, enum: ['local', 'google', 'apple'], default: 'local' },
    isEmailVerified: { type: Boolean, default: false },

    // --- CAMPI DEL PROFILO (Modificabili dall'utente) ---
    nickname: { type: String, unique: true, sparse: true, trim: true, minlength: 3 },
    profileImage: { type: String, default: 'uploads/profile-images/default-avatar.jpg'  },
    bio: { type: String, maxlength: 500, default: '' },
    gender: { type: String, enum: ['', 'male', 'female', 'non-binary', 'other'], default: '' },
    dateOfBirth: { 
      type: Date, 
      required: [true, 'La data di nascita è obbligatoria'],
      validate: {
        validator: function(dateOfBirth) {
          if (!dateOfBirth) return false;
          
          const today = new Date();
          const birthDate = new Date(dateOfBirth);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          return age >= 18;
        },
        message: 'Devi avere almeno 18 anni per registrarti'
      }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitudine, latitudine]
      },
      address: { type: String, maxlength: 255, default: '' } // Per salvare l'indirizzo testuale (es. "Milano, Italia")
    },
        residence: { type: String, trim: true, maxlength: 100, default: '' },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    interests: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    // CORRETTO: Il default per una String è una stringa vuota ''
    preferredCuisine: { type: String, default: '' },

    // --- CAMPI DI STATO E RELAZIONI ---
    profileCompleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    createdMeals: [{ type: mongoose.Schema.ObjectId, ref: 'Meal' }],
    joinedMeals: [{ type: mongoose.Schema.ObjectId, ref: 'Meal' }],
    blockedUsers: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],

    // --- CAMPI DI SICUREZZA ---
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

        // NOTIFICHE PUSH ▼▼▼
        fcmTokens: {
          type: [String],
          default: []
        },

    // --- IMPOSTAZIONI ---
    settings: {
      notifications: { email: { type: Boolean, default: true }, push: { type: Boolean, default: true } },
      privacy: {
        showLocationOnMap: { type: Boolean, default: false }, // <-- AGGIUNTO (per la mappa)
        showResidence: { type: Boolean, default: true },
        showPhone: { type: Boolean, default: false },
        // CORRETTO: rimossa la parentesi graffa in più
        showAge: { type: Boolean, default: true }
      }
    }
    // --- FINE DELL'OGGETTO DEI CAMPI ---
  },
  {
    // --- CORRETTO: le opzioni sono in un oggetto separato ---
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Creiamo l'indice 2dsphere sul campo location.coordinates per le query geospaziali
UserSchema.index({ 'location.coordinates': '2dsphere' });

// --- CAMPI VIRTUALI (calcolati, non salvati nel DB) ---
UserSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) {
    return null; // O 'Non specificata', se preferisci
  }
  const today = new Date();
  let age = today.getFullYear() - this.dateOfBirth.getFullYear();
  const m = today.getMonth() - this.dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < this.dateOfBirth.getDate())) {
    age--;
  }
  return age;
});

UserSchema.virtual('mealsCount').get(function() {
  return this.createdMeals ? this.createdMeals.length : 0;
});
UserSchema.virtual('joinedMealsCount').get(function() {
  return this.joinedMeals ? this.joinedMeals.length : 0;
});


// --- MIDDLEWARE (eseguito prima di un .save()) ---
UserSchema.pre('save', async function(next) {
  // Esegui l'hashing solo se la password è stata modificata
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Middleware per la pulizia dati prima della cancellazione di un utente
UserSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  console.log(`--- Pulizia dati per l'utente ${this._id} ---`);
  try {
    // 1. Cancella tutti i pasti creati da questo utente
    await mongoose.model('Meal').deleteMany({ host: this._id });
    // 2. Rimuovi questo utente da tutti i pasti a cui partecipava
    await mongoose.model('Meal').updateMany(
      { participants: this._id },
      { $pull: { participants: this._id }, $inc: { participantsCount: -1 } }
    );
    // 3. Cancella le chat associate e gli inviti
    await mongoose.model('Chat').deleteMany({ participants: this._id });
    await mongoose.model('Invitation').deleteMany({ $or: [{ sender: this._id }, { receiver: this._id }] });
    console.log(`--- Pulizia completata per l'utente ${this._id} ---`);
    next();
  } catch (error) {
    console.error(`Errore durante la pulizia dei dati per l'utente ${this._id}:`, error);
    next(error);
  }
});

// 🔄 MIDDLEWARE: Aggiorna automaticamente profileCompleted prima di ogni save
UserSchema.pre('save', function(next) {
  // Aggiorna profileCompleted solo se i campi del profilo sono stati modificati
  if (this.isModified('nickname') || this.isModified('bio') || this.isModified('interests') || 
      this.isModified('gender') || this.isModified('residence') || this.isModified('preferredCuisine') ||
      this.isModified('location')) {
    this.profileCompleted = this.checkProfileCompletion();
    console.log(`[User] Pre-save: profileCompleted aggiornato a ${this.profileCompleted}`);
  }
  next();
});

// --- METODI (le "abilità" di ogni utente) ---

UserSchema.methods.comparePassword = function(candidatePassword) {
  // Se l'utente usa autenticazione social, non ha password
  if (this.authProvider !== 'local' || !this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateAuthToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

UserSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

UserSchema.methods.incrementLoginAttempts = async function() {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Blocca per 15 minuti
  }
  await this.save({ validateBeforeSave: false });
};

UserSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

// Metodo per generare il token di verifica email
UserSchema.methods.generateVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 ore
  return verificationToken;
};

// Il metodo che useremo per aggiornare il profilo
UserSchema.methods.updateProfile = async function(updates) {
  console.log('\n--- ESEGUO User.updateProfile ---');
  console.log('Dati ricevuti da aggiornare:', JSON.stringify(updates, null, 2));

  const allowedUpdates = [
    'nickname', 'bio', 'gender', 'dateOfBirth', 'location', 'residence', 'phone', 'profileImage',
    'interests', 'languages', 'preferredCuisine', 'settings'
  ];
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      this[key] = updates[key];

        if (key === 'settings') {
          this.markModified('settings');
      }
    }
  });

  // 🔄 CONTROLLO AUTOMATICO: Verifica se il profilo è realmente completo
  this.profileCompleted = this.checkProfileCompletion();

try {
    console.log('Sto per eseguire .save() sul documento...');
    await this.save(); 
    console.log('✅ .save() eseguito con successo.');
  } catch (error) {
    console.error('❌ ERRORE durante .save():', error);
  }

  console.log('--- Fine User.updateProfile ---\n');
  return this;
};

/**
 * 🔄 CONTROLLO AUTOMATICO: Verifica se il profilo è completo
 * @returns {boolean} True se il profilo è completo
 */
UserSchema.methods.checkProfileCompletion = function() {
  // Campi obbligatori per considerare il profilo completo
  const requiredFields = {
    nickname: this.nickname && this.nickname.trim().length >= 3,
    interests: this.interests && this.interests.length >= 1,
    bio: this.bio && this.bio.trim().length >= 10
  };
  
  // Campi opzionali che migliorano il profilo
  const optionalFields = {
    gender: this.gender && this.gender.trim().length > 0,
    residence: this.residence && this.residence.trim().length > 0,
    preferredCuisine: this.preferredCuisine && this.preferredCuisine.trim().length > 0,
    // 🔄 LOCATION GEOJSON: Aggiungiamo la location come campo opzionale
    location: this.location && this.location.address && this.location.address.trim().length > 0
  };
  
  // Il profilo è completo se ha almeno i campi obbligatori
  const hasRequiredFields = Object.values(requiredFields).every(Boolean);
  
  // Bonus: se ha anche campi opzionali, il profilo è ancora migliore
  const hasOptionalFields = Object.values(optionalFields).filter(Boolean).length >= 2;
  
  console.log(`[User] Controllo completamento profilo:`, {
    required: requiredFields,
    optional: optionalFields,
    hasRequired: hasRequiredFields,
    hasOptional: hasOptionalFields,
    profileCompleted: hasRequiredFields,
    locationInfo: this.location ? {
      hasAddress: !!this.location.address,
      hasCoordinates: !!this.location.coordinates,
      address: this.location.address
    } : null
  });
  
  return hasRequiredFields;
};

// Metodi per gestire i blocchi utente
UserSchema.methods.blockUser = async function(userIdToBlock) {
  if (!this.blockedUsers.includes(userIdToBlock)) {
    this.blockedUsers.push(userIdToBlock);
    await this.save();
  }
  return this;
};

UserSchema.methods.unblockUser = async function(userIdToUnblock) {
  this.blockedUsers = this.blockedUsers.filter(id => id.toString() !== userIdToUnblock.toString());
  await this.save();
  return this;
};

UserSchema.methods.isUserBlocked = function(userId) {
  return this.blockedUsers.some(id => id.toString() === userId.toString());
};

UserSchema.methods.getBlockedUsers = function() {
  return this.blockedUsers;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;