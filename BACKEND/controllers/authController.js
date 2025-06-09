const crypto = require('crypto');
const { validationResult, check } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const bcrypt = require('bcryptjs');

// Validazioni per la registrazione
exports.registerValidation = [
  check('email')
    .trim()
    .isEmail()
    .withMessage('Inserisci un indirizzo email valido')
    .normalizeEmail()
    .isLength({ min: 5, max: 100 })
    .withMessage('L\'email deve essere tra 5 e 100 caratteri'),
  
  check('password')
    .isLength({ min: 8 })
    .withMessage('La password deve essere di almeno 8 caratteri')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('La password deve contenere almeno una lettera maiuscola, una minuscola, un numero e un carattere speciale'),
  
  check('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Il nome deve essere tra 2 e 50 caratteri')
    .matches(/^[a-zA-Z\s]*$/)
    .withMessage('Il nome può contenere solo lettere e spazi'),
  
  check('surname')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Il cognome deve essere tra 2 e 50 caratteri')
    .matches(/^[a-zA-Z\s]*$/)
    .withMessage('Il cognome può contenere solo lettere e spazi'),
];

// Validazioni per il login
exports.loginValidation = [
  check('email')
    .trim()
    .isEmail()
    .withMessage('Inserisci un indirizzo email valido')
    .normalizeEmail(),
  
  check('password')
    .notEmpty()
    .withMessage('La password è obbligatoria')
];

/**
 * @desc    Registra un nuovo utente
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    // Verifica risultati validazione
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, name, surname, } = req.body;

    // Verifica se l'utente esiste già
    let user = await User.findOne({ 
      $or: [
        { email },
      ]
    });
    
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Un utente con questa email esiste già' 
      });
    }

    // Hash della password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crea il nuovo utente
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      surname
    });

    // Salva l'utente nel database
    await newUser.save();

    // Genera token JWT
    const token = jwt.sign(
      { id: newUser._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Risposta al client
    res.status(201).json({
      success: true,
      message: 'Utente registrato con successo',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        surname: newUser.surname
            }
    });

  } catch (error) {
    console.error('Errore durante la registrazione:', error);
    res.status(500).json({ 
      success: false,
      message: 'Errore del server durante la registrazione' 
    });
  }
};

/**
 * @desc    Autentica un utente
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    // Verifica risultati validazione
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Verifica se l'utente esiste
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // Verifica se l'account è bloccato
    if (user.isLocked()) {
      return res.status(401).json({
        success: false,
        message: 'Account bloccato. Riprova più tardi.'
      });
    }

    // Verifica password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // Reset tentativi di login
    await user.resetLoginAttempts();

    // Genera token JWT
    const token = user.generateAuthToken();

    // Risposta al client
    res.json({
      success: true,
      message: 'Login effettuato con successo',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Errore durante il login:', error);
    res.status(500).json({
      success: false,
      message: 'Errore del server durante il login'
    });
  }
};

/**
 * @desc    Ottiene le informazioni dell'utente loggato
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (error) {
    console.error('Errore durante il recupero del profilo:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};

/**
 * @desc    Logout - Cancella il cookie con il token
 * @route   GET /api/auth/logout
 * @access  Private
 */
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logout effettuato con successo' });
};

/**
 * @desc    Invia email per il reset della password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Genera token di reset
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Invia email di reset
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Reset Password',
      message: `Clicca sul link per resettare la password: ${resetUrl}`
    });

    res.json({ success: true, message: 'Email di reset inviata' });
  } catch (error) {
    console.error('Errore durante il recupero password:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};

/**
 * @desc    Reset della password
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token non valido o scaduto' });
    }

    // Aggiorna password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password resettata con successo' });
  } catch (error) {
    console.error('Errore durante il reset della password:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};

/**
 * @desc    Aggiorna password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    // Verifica password attuale
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password attuale non valida' });
    }

    // Aggiorna password
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password aggiornata con successo' });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento della password:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};

/**
 * @desc    Aggiorna il profilo base dell'utente 
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const updates = req.body; // Prendi tutti gli aggiornamenti inviati

  const validUpdateKeys = Object.keys(updates).filter(key => updates[key] !== undefined && updates[key] !== null);

  // Validazione dei campi
  if (validUpdateKeys.length === 0) {
    return next(new ErrorResponse('Nessun dato fornito per l\'aggiornamento', 400));
  }

  // Trova l'utente e aggiorna i campi
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse('Utente non trovato', 404));
  }

  try {
    // Chiama il metodo del modello User che sa come gestire tutti gli aggiornamenti
    const updatedUser = await user.updateProfile(updates);

    res.status(200).json({
      success: true,
      message: 'Profilo aggiornato con successo',
      user: updatedUser // Restituisci l'utente aggiornato completo (il metodo toJSON lo pulirà)
    });
  } catch (error) {
    // Se user.updateProfile (e quindi user.save()) lancia un errore (es. validazione Mongoose)
    console.error('Errore durante user.updateProfile o user.save():', error);
    if (error.name === 'ValidationError') {
      // Estrai messaggi di validazione più specifici se vuoi
      const messages = Object.values(error.errors).map(val => val.message);
      return next(new ErrorResponse(`Errore di validazione: ${messages.join(', ')}`, 400));
    }
    return next(new ErrorResponse('Errore durante l\'aggiornamento del profilo nel server.', 500));
  }
});

/**
 * @desc    Elimina account
 * @route   DELETE /api/auth/delete-account
 * @access  Private
 */
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ success: true, message: 'Account eliminato con successo' });
  } catch (error) {
    console.error('Errore durante l\'eliminazione dell\'account:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};

/**
 * @desc    Verifica email
 * @route   POST /api/auth/verify-email/:token
 * @access  Public
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token non valido o scaduto' });
    }

    // Verifica email
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verificata con successo' });
  } catch (error) {
    console.error('Errore durante la verifica email:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};

/**
 * @desc    Reinvio verifica email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email già verificata' });
    }

    // Genera nuovo token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Invia email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Verifica il tuo account',
      message: `Clicca sul link per verificare il tuo account: ${verificationUrl}`
    });

    res.json({ success: true, message: 'Email di verifica reinviata' });
  } catch (error) {
    console.error('Errore durante il reinvio della verifica:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};

/**
 * @desc    Aggiorna l'immagine del profilo
 * @route   PUT /api/auth/profile/image
 * @access  Private
 */
exports.updateProfileImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Nessun file caricato', 400));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse('Utente non trovato', 404));
  }

  // Aggiorna l'immagine del profilo
  user.profileImage = req.file.filename;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Immagine del profilo aggiornata con successo',
    data: {
      profileImage: user.profileImage
    }
  });
});