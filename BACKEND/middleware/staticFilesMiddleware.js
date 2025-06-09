const express = require('express');
const path = require('path');
const fs = require('fs').promises;

// Configurazione per servire i file statici
const staticOptions = {
  maxAge: '1d', // Cache per 1 giorno
  setHeaders: (res, filePath) => {
    // Imposta header di sicurezza
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    
    // Imposta il Content-Type corretto per le immagini
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    if (mimeTypes[ext]) {
      res.set('Content-Type', mimeTypes[ext]);
    }
  }
};

// Middleware per verificare l'esistenza della cartella uploads
const ensureUploadsDirectory = async (req, res, next) => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const profileImagesDir = path.join(uploadsDir, 'profile-images');
    
    // Crea le cartelle se non esistono
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(profileImagesDir, { recursive: true });
    
    next();
  } catch (error) {
    console.error('Errore durante la creazione delle cartelle uploads:', error);
    next(error);
  }
};

// Middleware per servire i file statici
const serveStaticFiles = express.static(
  path.join(__dirname, '..', 'uploads'),
  staticOptions
);

module.exports = {
  ensureUploadsDirectory,
  serveStaticFiles
}; 