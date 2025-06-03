const crypto = require('crypto');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const bcrypt = require('bcryptjs');

/**
 * @desc    Registra un nuovo utente
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name, surname, nickname } = req.body;

    // Validazione dei dati
    if (!email || !password || !name || !surname || !nickname) {
      return res.status(400).json({
        success: false,
        message: 'Per favore fornisci tutti i campi obbligatori: email, password, nome, cognome e nickname'
      });
    }

    // Verifica se l'utente esiste già
    let user = await User.findOne({ 
      $or: [
        { email },
        { nickname }
      ]
    });
    
    if (user) {
      return res.status(400).json({
        success: false,
        message: user.email === email ? 
          'Un utente con questa email esiste già' : 
          'Questo nickname è già in uso'
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
      surname,
      nickname
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
        surname: newUser.surname,
        nickname: newUser.nickname
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
    const { email, password } = req.body;

    // Validazione dei dati
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Per favore fornisci email e password'
      });
    }

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
        nickname: user.nickname,
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
        nickname: user.nickname,
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
 * @desc    Aggiorna profilo
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user.id);

    // Aggiorna profilo
    await user.updateProfile(updates);

    res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        nickname: user.nickname,
        role: user.role,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento del profilo:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};

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