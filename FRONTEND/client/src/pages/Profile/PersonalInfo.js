import React, { useState } from 'react';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import '../../styles/PersonalInfo.css';

const PersonalInfo = ({ profileData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nickname: profileData.nickname || '',
    gender: profileData.gender || '',
    age: profileData.age || '',
    bio: profileData.bio || '',
    location: profileData.location || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data to original profile data
    setFormData({
      nickname: profileData.nickname || '',
      gender: profileData.gender || '',
      age: profileData.age || '',
      bio: profileData.bio || '',
      location: profileData.location || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="personal-info-container">
      <div className="section-header">
        <h2>Informazioni Personali</h2>
        {!isEditing ? (
          <button 
            className="edit-button"
            onClick={() => setIsEditing(true)}
            aria-label="Modifica informazioni personali"
          >
            <FaEdit />
          </button>
        ) : (
          <div className="edit-buttons">
            <button 
              className="cancel-button"
              onClick={handleCancel}
              aria-label="Annulla modifiche"
            >
              <FaTimes />
            </button>
            <button 
              className="save-button"
              onClick={handleSubmit}
              aria-label="Salva modifiche"
            >
              <FaSave />
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="info-display">
          <div className="info-row">
            <span className="info-label">Nickname:</span>
            <span className="info-value">{profileData.nickname}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Genere:</span>
            <span className="info-value">{profileData.gender || 'Non specificato'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Età:</span>
            <span className="info-value">{profileData.age || 'Non specificata'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Posizione:</span>
            <span className="info-value">{profileData.location || 'Non specificata'}</span>
          </div>
          <div className="info-row bio-row">
            <span className="info-label">Bio:</span>
            <p className="info-value bio-text">{profileData.bio || 'Nessuna biografia inserita.'}</p>
          </div>
        </div>
      ) : (
        <form className="info-edit-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nickname">Nickname</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              required
              maxLength={30}
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender">Genere</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Preferisco non specificare</option>
              <option value="male">Uomo</option>
              <option value="female">Donna</option>
              <option value="non-binary">Non binario</option>
              <option value="other">Altro</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="age">Età</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min={18}
              max={120}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Posizione</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              maxLength={500}
              rows={4}
              placeholder="Racconta qualcosa su di te..."
            />
            <div className="char-count">
              {formData.bio ? formData.bio.length : 0}/500
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default PersonalInfo;