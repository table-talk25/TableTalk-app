// File: /BACKEND/controllers/authController.js (Versione Finale, Completa e Corretta)

const crypto = require('crypto');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail'); // Assicurati che questo utility esista e funzioni

/**
 * @desc    Registra un nuovo utente
 * @route   POST /api/auth/register
 */
exports.register = asyncHandler(async (req, res, next) => {
    console.time('Tempo Registrazione');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse('Uno o più campi non sono validi', 400, errors.array()));
    }
    
    const { name, surname, email, password } = req.body;

    console.log('\n--- TENTATIVO DI REGISTRAZIONE RICEVUTO ---');
    console.log('Dati ricevuti per la registrazione:', { name, surname, email });

    // Lasciamo che sia il nostro errorHandler (con la regola per il codice 11000)
    // a gestire il caso dell'email duplicata per dare un messaggio specifico.
    
    // Passiamo la password in chiaro. Il modello User.js si occuperà di criptarla
    // UNA SOLA VOLTA prima di salvare, grazie al middleware pre-save.
    const user = await User.create({ name, surname, email, password });
    
    console.log('✅ Utente creato con successo nel database!');
    console.log('Dettagli utente salvato:', user);
    console.log('-------------------------------------------\n');
    
    // Genera il token e invia la risposta
    const token = user.generateAuthToken();
    // Genera il token di verifica email
    const verificationToken = user.generateVerificationToken();
    user.isVerified = false;
    await user.save({ validateBeforeSave: false });

    // Invia l'email di verifica
    try {
      await sendEmail.sendVerificationEmail(user.email, verificationToken);
    } catch (err) {
      console.error('Errore invio email di verifica:', err.message);
    }
    console.timeEnd('Tempo Registrazione');
    // Creo un oggetto con solo i dati essenziali per il frontend
    const userInfo = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted,
      isVerified: user.isVerified
    };
    res.status(201).json({ success: true, token, user: userInfo, message: 'Registrazione effettuata con successo. Controlla la tua email per verificare il tuo account.' });
});

/**
 * @desc    Autentica un utente
 * @route   POST /api/auth/login
 */
exports.login = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { 
        return next(new ErrorResponse('Dati di login non validi', 400, errors.array())); 
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
        // Incrementa i tentativi falliti solo se l'utente esiste ma la password è sbagliata
        if (user) await user.incrementLoginAttempts();
        return next(new ErrorResponse('Credenziali non valide', 401));
    }

    // 🔒 SICUREZZA: Verifica che l'email sia stata verificata
    if (!user.isEmailVerified) {
        return next(new ErrorResponse('Account non verificato. Controlla la tua email e clicca sul link di verifica per completare la registrazione.', 403));
    }

    if (user.isLocked()) {
        return next(new ErrorResponse('Account bloccato a causa di troppi tentativi falliti. Riprova più tardi.', 403));
    }

    await user.resetLoginAttempts();
    const token = user.generateAuthToken();
    res.status(200).json({ success: true, token, user });
});

/**
 * @desc    Ottiene i dati dell'utente loggato
 * @route   GET /api/auth/me
 */
exports.getMe = asyncHandler(async (req, res, next) => {
    // req.user viene popolato dal middleware 'protect'
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new ErrorResponse('Utente non trovato', 404));
    }
    
    // 🔒 SICUREZZA: Verifica che l'email sia stata verificata
    if (!user.isEmailVerified) {
        return next(new ErrorResponse('Account non verificato. Controlla la tua email e clicca sul link di verifica per completare la registrazione.', 403));
    }
    
    res.status(200).json({ success: true, data: user });
});

/**
 * @desc    Esegue il logout (lato server non fa nulla, il token viene invalidato nel frontend)
 * @route   POST /api/auth/logout
 */
exports.logout = asyncHandler(async (req, res, next) => {
    res.status(200).json({ success: true, message: 'Logout effettuato con successo' });
});

/**
 * @desc    Invia email per il reset della password
 * @route   POST /api/auth/forgot-password
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        // Per sicurezza, non riveliamo se l'utente esiste.
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
        res.status(200).json({ success: true, message: 'Email di reset inviata.' });
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorResponse('Impossibile inviare l\'email di reset.', 500));
    }
});


/**
 * @desc    Resetta la password usando un token
 * @route   POST /api/auth/reset-password/:token
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
    // La logica per questa funzione dipende dal metodo generatePasswordResetToken nel modello User
    // Si assume che il token salvato sia già hash-ato
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

/**
 * @desc    Verifica l'email di un utente
 * @route   POST /api/auth/verify-email/:token
 */
exports.verifyEmail = asyncHandler(async (req, res, next) => {
    const verificationToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        verificationToken,
        verificationTokenExpires: { $gt: Date.now() }
    });
    if (!user) {
        return next(new ErrorResponse('Token di verifica non valido o scaduto', 400));
    }
    
    // 🔒 SICUREZZA: Aggiorna il campo corretto per la verifica email
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({ success: true, message: 'Email verificata con successo. Ora puoi accedere a tutte le funzionalità.' });
});

/**
 * @desc    Reinvia l'email di verifica
 * @route   POST /api/auth/resend-verification
 */
exports.resendVerification = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return next(new ErrorResponse('Utente non trovato', 404));
    }
    
    // 🔒 SICUREZZA: Controlla il campo corretto per la verifica email
    if (user.isEmailVerified) {
        return res.status(200).json({ success: true, message: 'Account già verificato.' });
    }
    
    const verificationToken = user.generateVerificationToken();
    await user.save({ validateBeforeSave: false });
    try {
        await sendEmail.sendVerificationEmail(user.email, verificationToken);
    } catch (err) {
        console.error('Errore invio email di verifica:', err.message);
        return next(new ErrorResponse('Errore nell\'invio dell\'email di verifica', 500));
    }
    res.status(200).json({ success: true, message: 'Nuova email di verifica inviata. Controlla la tua casella di posta.' });
});