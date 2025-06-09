const multer = require('multer');
const path = require('path');

// Configurazione di multer per il caricamento delle immagini
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-images');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo le immagini sono permesse!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Middleware per gestire gli errori di multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Errore di multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Il file è troppo grande. Dimensione massima consentita: 5MB'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Troppi file caricati. È consentito caricare un solo file alla volta'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Errore durante il caricamento del file: ${err.message}`
    });
  } else if (err) {
    // Altri errori
    return res.status(400).json({
      success: false,
      message: err.message || 'Errore durante il caricamento del file'
    });
  }
  next();
};

// Middleware per verificare se è stato caricato un file
const checkFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Nessun file caricato. Per favore, seleziona un\'immagine'
    });
  }
  next();
};

module.exports = {
  upload,
  handleMulterError,
  checkFileUpload
}; 