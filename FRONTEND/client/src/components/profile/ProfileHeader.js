import React, { useState } from 'react';
import { FaCamera } from 'react-icons/fa';
import '../../styles/profile/ProfileHeader.css';
import { toast } from 'react-toastify';

const ProfileHeader = ({ profile, onUpdateImage, isUpdating }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
        // Validazione del file...
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          return toast.error('L\'immagine è troppo grande (max 5MB).');
        }
        if (!file.type.startsWith('image/')) {
          return toast.error('Il file selezionato non è un\'immagine.');
        }
   
      setIsUploading(true);
      try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Chiamiamo il metodo per aggiornare l'immagine
      await onUpdateImage(formData); 
      toast.success('Immagine profilo aggiornata!');

    } catch (error) {
      toast.error('Errore durante il caricamento dell\'immagine. Riprova più tardi.');
    } finally {
      setIsUploading(false);
    }
  };

  // Ottieni l'URL dell'immagine
  const defaultAvatarUrl = '/default-avatar.jpg';

  const userImage = profile?.profileImage;
  const userAvatarUrl = (userImage && userImage !== 'default-avatar.jpg')
  ? `${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/profile-images/${userImage}` 
    : defaultAvatarUrl;

  return (
    <div className="profile-header">
      <div className="profile-image-container">
        <div className="profile-image">
           <img 
            src={userAvatarUrl} 
              alt={`${profile?.nickname || 'User'} profile`} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultAvatarUrl;
              }}
            />

          
          <label className="image-upload-button" htmlFor="profile-image-upload">
            <FaCamera />
            <input
              id="profile-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
              disabled={isUploading || isUpdating}
            />
          </label>
          
          {(isUploading || isUpdating) && (
            <div className="upload-loading-overlay">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      </div>
      
      <div className="profile-header-info">
        <h1 className="profile-nickname">{profile?.nickname || 'Utente'}</h1>
        {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
      </div>
    </div>
  );
};

export default ProfileHeader;