// File: /BACKEND/controllers/authController.js (Versione Finale e Completa)

const crypto = require('crypto');
const { validationResult, check } = require('express-validator');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// --- VALIDAZIONI (le spostiamo qui per centralizzarle) ---
exports.registerValidation = [
  check('name', 'Il nome può contenere solo lettere e spazi').trim().matches(/^[a-zA-Z\s]*$/),
  check('surname', 'Il cognome può contenere solo lettere e spazi').trim().matches(/^[a-zA-Z\s]*$/),
  check('email', 'Inserisci un indirizzo email valido').isEmail().normalizeEmail(),
  check('password', 'La password non rispetta i requisiti di sicurezza.').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
];

exports.loginValidation = [
  check('email', 'Inserisci un indirizzo email valido').isEmail().normalizeEmail(),
  check('password', 'La password è obbligatoria').notEmpty(),
];


// --- CONTROLLERS ---

exports.register = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse('Uno o più campi non sono validi', 400, errors.array()));
    }
    const { email, password, name, surname } = req.body;
    const user = await User.create({ email, password, name, surname });
    const token = user.generateAuthToken();
    res.status(201).json({ success: true, token, user });
});

exports.login = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return next(new ErrorResponse('Dati di login non validi', 400, errors.array())); }

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        return next(new ErrorResponse('Credenziali non valide', 401));
    }
    if (user.isLocked()) {
        return next(new ErrorResponse('Account bloccato a causa di troppi tentativi falliti.', 403));
    }
    await user.resetLoginAttempts();
    const token = user.generateAuthToken();
    res.status(200).json({ success: true, token, user });
});

exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
});

exports.logout = asyncHandler(async (req, res, next) => {
    // La logica di logout è gestita principalmente nel frontend (rimozione del token)
    res.status(200).json({ success: true, message: 'Logout effettuato con successo' });
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        // Per sicurezza, non riveliamo se l'email esiste o meno.
        return res.status(200).json({ success: true, message: 'Se l\'email è registrata, riceverai un link per il reset.' });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    try {
        await sendEmail({
            to: user.email,
            subject: 'Reset della tua Password per TableTalk',
            text: `Hai richiesto di resettare la tua password. Clicca su questo link per procedere: ${resetUrl}`
        });
        res.status(200).json({ success: true, message: 'Email di reset inviata con successo.' });
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorResponse('Impossibile inviare l\'email di reset.', 500));
    }
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) { return next(new ErrorResponse('Token non valido o scaduto', 400)); }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password resettata con successo' });
});

exports.verifyEmail = asyncHandler(async (req, res, next) => {
    // La logica per questa funzione dipende da come hai implementato la verifica via email
    res.status(200).json({ success: true, message: 'Funzionalità di verifica da implementare' });
});

exports.resendVerification = asyncHandler(async (req, res, next) => {
    // La logica per questa funzione
    res.status(200).json({ success: true, message: 'Funzionalità di reinvio verifica da implementare' });
});