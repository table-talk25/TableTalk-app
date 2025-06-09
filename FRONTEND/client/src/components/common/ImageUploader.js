import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './ImageUploader.css';

const ImageUploader = ({ 
  onImageSelect, 
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  aspectRatio = 1,
  minWidth = 200,
  minHeight = 200,
  maxWidth = 2000,
  maxHeight = 2000,
  className = '',
  children 
}) => {
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const validateImage = (file) => {
    // Verifica dimensione file
    const maxSize = maxSizeMB * 1024 * 1024; // Converti in bytes
    if (file.size > maxSize) {
      throw new Error(`L'immagine deve essere più piccola di ${maxSizeMB}MB`);
    }

    // Verifica tipo file
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Formato immagine non supportato. Usa JPG, PNG, GIF o WebP');
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Verifica dimensioni
        if (img.width < minWidth || img.height < minHeight) {
          reject(new Error(`L'immagine deve essere almeno ${minWidth}x${minHeight}px`));
        }
        if (img.width > maxWidth || img.height > maxHeight) {
          reject(new Error(`L'immagine non può essere più grande di ${maxWidth}x${maxHeight}px`));
        }

        // Verifica aspect ratio
        const currentRatio = img.width / img.height;
        const ratioError = Math.abs(currentRatio - aspectRatio);
        if (ratioError > 0.1) { // Tolleranza del 10%
          reject(new Error(`L'immagine deve avere un rapporto di ${aspectRatio}:1`));
        }

        resolve(img);
      };
      img.onerror = () => reject(new Error('Errore durante il caricamento dell\'immagine'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    try {
      // Valida l'immagine
      await validateImage(file);

      // Crea preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Notifica il componente padre
      onImageSelect(file);
    } catch (err) {
      setError(err.message);
      // Resetta l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`image-uploader ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={allowedTypes.join(',')}
        style={{ display: 'none' }}
      />
      
      <div 
        className="image-uploader-content"
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        {preview ? (
          <img 
            src={preview} 
            alt="Preview" 
            className="image-preview"
          />
        ) : (
          children || (
            <div className="upload-placeholder">
              <i className="fas fa-camera"></i>
              <p>Clicca per caricare un'immagine</p>
            </div>
          )
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="upload-requirements">
        <p>Requisiti:</p>
        <ul>
          <li>Dimensione massima: {maxSizeMB}MB</li>
          <li>Formati supportati: {allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}</li>
          <li>Dimensioni minime: {minWidth}x{minHeight}px</li>
          <li>Dimensioni massime: {maxWidth}x{maxHeight}px</li>
          <li>Rapporto: {aspectRatio}:1</li>
        </ul>
      </div>
    </div>
  );
};

ImageUploader.propTypes = {
  onImageSelect: PropTypes.func.isRequired,
  maxSizeMB: PropTypes.number,
  allowedTypes: PropTypes.arrayOf(PropTypes.string),
  aspectRatio: PropTypes.number,
  minWidth: PropTypes.number,
  minHeight: PropTypes.number,
  maxWidth: PropTypes.number,
  maxHeight: PropTypes.number,
  className: PropTypes.string,
  children: PropTypes.node
};

export default ImageUploader; 