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
exports.register = asyncHandler(async (req, res, next) => {
    // Verifica risultati validazione
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
    return next(new ErrorResponse('Dati di registrazione non validi', 400, errors.array()));
    }

  const { email, password, name, surname } = req.body;

    // Verifica se l'utente esiste già
    let user = await User.findOne({ 
      $or: [
        { email },
      ]
    });
    
    if (user) {
    return next(new ErrorResponse('Un utente con questa email esiste già', 400));
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
});

/**
 * @desc    Autentica un utente
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
    // Verifica risultati validazione
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
    return next(new ErrorResponse('Dati di login non validi', 400, errors.array()));
    }

    const { email, password } = req.body;

    // Verifica se l'utente esiste
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
    return next(new ErrorResponse('Credenziali non valide', 401));
    }

    // Verifica se l'account è bloccato
    if (user.isLocked()) {
    return next(new ErrorResponse('Account bloccato. Riprova più tardi.', 401));
    }

    // Verifica password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
    return next(new ErrorResponse('Credenziali non valide', 401));
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
    });

/**
 * @desc    Ottiene le informazioni dell'utente loggato
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse('Utente non trovato', 404));
  }

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
});

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
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
    return next(new ErrorResponse('Credenziali non valide', 404));
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
});

/**
 * @desc    Reset della password
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
    return next(new ErrorResponse('Token non valido o scaduto', 400));
    }

    // Aggiorna password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password resettata con successo' });
});

/**
 * @desc    Aggiorna password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    // Verifica password attuale
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
    return next(new ErrorResponse('Password attuale non valida', 401));
    }

    // Aggiorna password
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password aggiornata con successo' });
});

/**
 * @desc    Elimina account
 * @route   DELETE /api/auth/delete-account
 * @access  Private
 */
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse('Utente non trovato', 404));
  }

  await User.deleteOne({ _id: req.user.id });
  res.json({ success: true, message: 'Account eliminato con successo' });
});

/**
 * @desc    Verifica email
 * @route   POST /api/auth/verify-email/:token
 * @access  Public
 */
exports.verifyEmail = asyncHandler(async (req, res, next) => {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
    return next(new ErrorResponse('Token non valido o scaduto', 400));
    }

    // Verifica email
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verificata con successo' });
});

/**
 * @desc    Reinvio verifica email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
exports.resendVerification = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
    return next(new ErrorResponse('Utente non trovato', 404));
    }

    if (user.isVerified) {
    return next(new ErrorResponse('Email già verificata', 400));
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
});

/**
 * @desc    Imposta il primo amministratore del sistema
 * @route   POST /api/auth/setup-first-admin
 * @access  Public
 */
exports.setupFirstAdmin = asyncHandler(async (req, res, next) => {
    // Verifica se esiste già un amministratore
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
    return next(new ErrorResponse('Un amministratore esiste già nel sistema', 400));
    }

    // Credenziali predefinite per l'amministratore
    const adminCredentials = {
      email: 'admin@tabletalk.com',
      password: 'Admin123!',
      name: 'Admin',
      surname: 'TableTalk',
      nickname: 'admin_tabletalk'
    };

    // Hash della password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminCredentials.password, salt);

    // Crea il nuovo amministratore
    const admin = new User({
      email: adminCredentials.email,
      password: hashedPassword,
      name: adminCredentials.name,
      surname: adminCredentials.surname,
      nickname: adminCredentials.nickname,
      role: 'admin',
      isVerified: true,
      profileCompleted: true
    });

    // Salva l'amministratore nel database
    await admin.save();

    // Genera token JWT
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Risposta al client
    res.status(201).json({
      success: true,
      message: 'Amministratore creato con successo',
      token,
      user: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        surname: admin.surname,
        nickname: admin.nickname,
        role: admin.role
      }
    });
});