const multer = require('multer');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');

// Configurazione storage per multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filtro per i file
const fileFilter = (req, file, cb) => {
  // Estensione file
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Tipi di file consentiti
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ErrorResponse('Tipo di file non supportato. Usa solo immagini (jpg, jpeg, png, gif)', 400), false);
  }
};

// Configurazione multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Middleware per gestire gli errori di upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ErrorResponse('File troppo grande. Dimensione massima: 5MB', 400));
    }
    return next(new ErrorResponse('Errore durante l\'upload del file', 400));
  }
  
  if (err) {
    return next(new ErrorResponse(err.message, 400));
  }
  
  next();
};

module.exports = {
  upload,
  handleUploadError
}; 