const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');

// Configurazione di multer per il caricamento delle immagini
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/profile-images/');
  },
  filename: function(req, file, cb) {
    cb(null, `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Filtro per accettare solo immagini
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Puoi caricare solo file immagine'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
}).single('profileImage');

/**
 * @desc    Ottieni il profilo dell'utente corrente
 * @route   GET /api/users/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Carica l'immagine del profilo
 * @route   POST /api/users/profile/picture
 * @access  Private
 */
exports.uploadProfileImage = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

  if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nessun file caricato'
      });
  }

    try {
      const user = await User.findById(req.user.id);

      // Elimina la vecchia immagine se non è quella di default
      if (user.profileImage !== 'default-profile.jpg') {
        const oldImagePath = path.join(__dirname, '..', 'uploads', 'profiles', user.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Aggiorna l'immagine del profilo
      user.profileImage = req.file.filename;
      await user.save();

  res.status(200).json({
    success: true,
        data: {
          profileImage: user.profileImage
        }
  });
    } catch (err) {
      next(err);
    }
});
};

/**
 * @desc    Ottieni tutti gli utenti
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Costruisci la query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    // Esegui la query con paginazione
    const users = await User.find(query)
      .select('-password')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Conta il totale degli utenti
    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Errore del server');
  }
};

/**
 * @desc    Ottieni un utente specifico
 * @route   GET /api/users/:id
 * @access  Private
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
  if (!user) {
      return res.status(404).json({ msg: 'Utente non trovato' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Utente non trovato' });
  }
    res.status(500).send('Errore del server');
  }
};

/**
 * @desc    Cambia la password dell'utente
 * @route   PUT /api/users/password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new ErrorResponse('Password attuale non valida', 401));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password aggiornata con successo'
  });
});

// Placeholder per ricerca utenti
exports.searchUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Ricerca utenti non ancora implementata.' });
});

/**
 * @desc    Blocca un utente
 * @route   POST /api/users/:id/block
 * @access  Private
 */
exports.blockUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        status: 'blocked',
        blockedAt: Date.now(),
        blockReason: reason
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'Utente non trovato' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Utente non trovato' });
    }
    res.status(500).send('Errore del server');
  }
};

/**
 * @desc    Sblocca un utente
 * @route   DELETE /api/users/:id/block
 * @access  Private
 */
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        status: 'active',
        $unset: { blockedAt: 1, blockReason: 1 }
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'Utente non trovato' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Utente non trovato' });
    }
    res.status(500).send('Errore del server');
  }
};

/**
 * @desc    Cambia il ruolo di un utente
 * @route   PUT /api/users/:id/role
 * @access  Private/Admin
 */
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'Utente non trovato' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Utente non trovato' });
    }
    res.status(500).send('Errore del server');
  }
};

/**
 * @desc    Cambia lo stato di un utente
 * @route   PUT /api/users/:id/status
 * @access  Private/Admin
 */
exports.changeUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        status,
        statusReason: reason,
        statusChangedAt: Date.now()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'Utente non trovato' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Utente non trovato' });
    }
    res.status(500).send('Errore del server');
  }
};

// Placeholder per ottenere la lista degli utenti bloccati
exports.getBlockedUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Lista utenti bloccati non ancora implementata.' });
});

// Placeholder per eliminare l'account
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Eliminazione account non ancora implementata.' });
});