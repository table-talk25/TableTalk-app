import React, { useState } from 'react';
import { FaCamera } from 'react-icons/fa';
import '../../styles/ProfileHeader.css';
import { toast } from 'react-toastify';
import { authService } from '../../services/authService';

const ProfileHeader = ({ profileImage, nickname, onUpdateImage }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB massimo
    
    if (file.size > maxSize) {
      toast.error('L\'immagine è troppo grande. Il limite è di 5MB.');
      return;
    }
    
    // Verifica che sia un'immagine
    if (!file.type.match('image.*')) {
      toast.error('Il file deve essere un\'immagine.');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Crea un FormData per caricare l'immagine
      const formData = new FormData();
      formData.append('profileImage', file);
      
      // Qui chiamiamo il metodo per aggiornare l'immagine
      await onUpdateImage({ profileImage: formData });
      
      toast.success('Immagine profilo aggiornata!');
      setIsUploading(false);
    } catch (error) {
      console.error('Errore durante il caricamento dell\'immagine:', error);
      setIsUploading(false);
      toast.error('Errore durante il caricamento dell\'immagine. Riprova più tardi.');
    }
  };

  // Ottieni l'URL dell'immagine dalla cache
  const imageUrl = profileImage ? authService.getProfileImageUrl(profileImage) : null;

  return (
    <div className="profile-header">
      <div className="profile-image-container">
        <div className="profile-image">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={`${nickname} profile`} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-avatar.jpg';
              }}
            />
          ) : (
            <div className="profile-image-placeholder">
              {nickname ? nickname.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          
          <label className="image-upload-button" htmlFor="profile-image-upload">
            <FaCamera />
            <input
              id="profile-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
          </label>
          
          {isUploading && (
            <div className="upload-loading-overlay">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      </div>
      
      <div className="profile-header-info">
        <h1 className="profile-nickname">{nickname}</h1>
      </div>
    </div>
  );
};

export default ProfileHeader;