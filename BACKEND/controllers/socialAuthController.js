const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Inizializza il client OAuth2 di Google
const googleClient = new OAuth2Client(
  '534454809499-4vsllugc4jbuft2n20p5sakupvvdcjrb.apps.googleusercontent.com' // Web Client ID
);

/**
 * Autenticazione con Google
 */
const googleAuth = async (req, res) => {
  try {
    const { idToken, user } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Token ID richiesto'
      });
    }

    // Verifica il token ID di Google
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: '534454809499-4vsllugc4jbuft2n20p5sakupvvdcjrb.apps.googleusercontent.com' // Web Client ID
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const profileImage = payload.picture;

    // Cerca l'utente per email o googleId
    let existingUser = await User.findOne({
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    });

    if (existingUser) {
      // Aggiorna le informazioni se necessario
      if (!existingUser.googleId) {
        existingUser.googleId = googleId;
        existingUser.authProvider = 'google';
      }
      
      if (profileImage && !existingUser.profileImage) {
        existingUser.profileImage = profileImage;
      }
      
      if (name && !existingUser.name) {
        existingUser.name = name;
      }

      await existingUser.save();
    } else {
      // Crea un nuovo utente
      existingUser = new User({
        email: email,
        name: name || user?.name,
        profileImage: profileImage || user?.profileImage,
        googleId: googleId,
        authProvider: 'google',
        isEmailVerified: true, // Google verifica automaticamente l'email
        password: undefined // Non serve password per login social
      });

      await existingUser.save();
    }

    // Genera il token JWT
    const token = jwt.sign(
      { 
        userId: existingUser._id,
        email: existingUser.email,
        authProvider: existingUser.authProvider
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Rimuovi la password dalla risposta
    const userResponse = existingUser.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login Google completato con successo',
      token: token,
      user: userResponse
    });

  } catch (error) {
    console.error('Errore autenticazione Google:', error);
    
    if (error.message.includes('Token used too late')) {
      return res.status(400).json({
        success: false,
        message: 'Token scaduto, riprova il login'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'autenticazione Google'
    });
  }
};

/**
 * Autenticazione con Apple
 * TODO: Implementare la verifica del token Apple
 */
const appleAuth = async (req, res) => {
  try {
    const { identityToken, authorizationCode, user } = req.body;

    if (!identityToken || !authorizationCode) {
      return res.status(400).json({
        success: false,
        message: 'Token e codice di autorizzazione richiesti'
      });
    }

    // TODO: Verifica del token Apple usando la libreria appropriata
    // Per ora, accettiamo i dati come validi
    
    const email = user?.email;
    const name = user?.name;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email richiesta per l\'autenticazione Apple'
      });
    }

    // Cerca l'utente per email
    let existingUser = await User.findOne({ email: email });

    if (existingUser) {
      // Aggiorna le informazioni se necessario
      if (!existingUser.appleId) {
        existingUser.appleId = authorizationCode; // Usa il codice come ID temporaneo
        existingUser.authProvider = 'apple';
      }
      
      if (name && !existingUser.name) {
        existingUser.name = name;
      }

      await existingUser.save();
    } else {
      // Crea un nuovo utente
      existingUser = new User({
        email: email,
        name: name,
        appleId: authorizationCode, // Usa il codice come ID temporaneo
        authProvider: 'apple',
        isEmailVerified: true, // Apple verifica automaticamente l'email
        password: undefined // Non serve password per login social
      });

      await existingUser.save();
    }

    // Genera il token JWT
    const token = jwt.sign(
      { 
        userId: existingUser._id,
        email: existingUser.email,
        authProvider: existingUser.authProvider
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Rimuovi la password dalla risposta
    const userResponse = existingUser.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login Apple completato con successo',
      token: token,
      user: userResponse
    });

  } catch (error) {
    console.error('Errore autenticazione Apple:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'autenticazione Apple'
    });
  }
};

module.exports = {
  googleAuth,
  appleAuth
};
