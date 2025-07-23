// File: /BACKEND/middleware/upload.js (Versione Finale e Corretta)

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Funzione per assicurarsi che una directory esista
const ensureExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configurazione dello storage con destinazione dinamica
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Controlliamo il percorso della rotta per decidere dove salvare!
    let uploadPath = 'uploads/';
    if (req.originalUrl.includes('/profile')) {
      uploadPath += 'profile-images/';
    } else if (req.originalUrl.includes('/meals')) {
      uploadPath += 'meal-images/';
    }

    ensureExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Nome file pulito: nomecampo-idutente-data.estensione
    const uniqueSuffix = `${req.user.id}-${Date.now()}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Filtro per accettare solo immagini
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Formato file non supportato. Solo immagini permesse.'), false);
  }
};

// Esportiamo direttamente l'istanza di multer configurata
module.exports = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite di 5MB
  fileFilter: fileFilter
});