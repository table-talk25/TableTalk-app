const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  // --- Campi di Identità e Profilo ---
  email: { type: String, required: [true, 'Email obbligatoria'], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Email non valida'] },
  password: { type: String, required: [true, 'Password obbligatoria'], minlength: [8, 'La password deve essere di almeno 8 caratteri'], select: false },
  name: { type: String, required: [true, 'Nome obbligatorio'], trim: true },
  surname: { type: String, required: [true, 'Cognome obbligatorio'], trim: true },
  nickname: { type: String, unique: true, trim: true, minlength: [3, 'Il nickname deve essere di almeno 3 caratteri'], maxlength: [50, 'Il nickname non può essere più lungo di 50 caratteri'] },
  profileImage: { type: String, default: 'default-avatar.jpg' },
  bio: { type: String, maxlength: [500, 'La bio non può essere più lunga di 500 caratteri'], trim: true },
  gender: { type: String, enum: ['uomo', 'donna', 'altro', 'preferisco_non_dirlo'], default: 'preferisco_non_dirlo' },
  age: { type: Number, min: [18, 'Devi avere almeno 18 anni'], max: [120, 'Età non valida'] },
  location: { type: String, trim: true, maxlength: [100, 'La posizione non può essere più lunga di 100 caratteri'] },
  interests: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  preferredCuisine: { type: String, trim: true, default: '' },
  
  // --- Campi di Stato e Ruoli ---
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  profileCompleted: { type: Boolean, default: false },

  // --- Campi per Sicurezza e Token ---
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },

  // --- Relazioni con altri Modelli ---
  createdMeals: [{ type: mongoose.Schema.ObjectId, ref: 'Meal' }],
  joinedMeals: [{ type: mongoose.Schema.ObjectId, ref: 'Meal' }],

  // --- Impostazioni Utente ---
  settings: {
    notifications: { email: { type: Boolean, default: true }, push: { type: Boolean, default: true } },
    privacy: { showAge: { type: Boolean, default: true }, showEmail: { type: Boolean, default: false } },
    language: { type: String, default: 'it' }
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- VIRTUALS ---
UserSchema.virtual('mealsCount').get(function() {
  // Se this.createdMeals esiste, restituisci la sua lunghezza, altrimenti restituisci 0.
  return this.createdMeals ? this.createdMeals.length : 0;
});

UserSchema.virtual('joinedMealsCount').get(function() {
  // Se this.joinedMeals esiste, restituisci la sua lunghezza, altrimenti restituisci 0.
  return this.joinedMeals ? this.joinedMeals.length : 0;
});

// --- MIDDLEWARE ---
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- METODI DELLO SCHEMA ---

// Metodo per confrontare la password durante il login
UserSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Metodo per generare il token JWT
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// --- SOLUZIONE: I METODI PER LA GESTIONE DEL LOGIN CHE MANCAVANO ---

// Metodo per verificare se l'account è bloccato
UserSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Metodo per incrementare i tentativi di login falliti
UserSchema.methods.incrementLoginAttempts = async function() {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Blocca per 15 minuti
  }
  await this.save({ validateBeforeSave: false }); // Salva senza eseguire altre validazioni
};

// Metodo per resettare i tentativi di login dopo un accesso riuscito
UserSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false }); // Salva senza eseguire altre validazioni
};


// --- Metodo Ufficiale per Aggiornare il Profilo ---
UserSchema.methods.updateProfile = async function(updates) {
  const allowedUpdates = [
    'nickname', 'gender', 'age', 'location', 'interests', 
    'languages', 'bio', 'settings', 'preferredCuisine'
  ];
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      this[key] = updates[key];
    }
  });
  this.profileCompleted = this.checkProfileCompletion();
  return await this.save();
};

// Metodo per verificare se il profilo è completo
UserSchema.methods.checkProfileCompletion = function() {
  return !!(
    this.nickname &&
    this.gender &&
    this.age &&
    this.location &&
    this.languages.length > 0 &&
    this.interests.length > 0 &&
    this.bio &&
    this.preferredCuisine
  );
};


const User = mongoose.model('User', UserSchema);
module.exports = User;