import React, { useState } from 'react';
import { FaEdit, FaSave, FaTimes, FaLock, FaLockOpen } from 'react-icons/fa';
import '../../styles/profile/PersonalInfo.css';

const PersonalInfo = ({ profileData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nickname: profileData.nickname || '',
    gender: profileData.gender || '',
    age: profileData.age || '',
    bio: profileData.bio || '',
    location: profileData.location || '',
    privacy: {
      gender: profileData.privacy?.gender || false,
      age: profileData.privacy?.age || false,
      location: profileData.privacy?.location || false
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        privacy: {
          ...prev.privacy,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
    }
  };

  const togglePrivacy = (field) => {
    setFormData(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [field]: !prev.privacy[field]
      }
    }));
  };

  return (
    <div className="profile-form">
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
              onClick={() => setIsEditing(false)}
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

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nickname">Nickname *</label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            required
            maxLength={30}
            placeholder="Il tuo nickname"
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">Genere</label>
          <div className="privacy-input-group">
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
            <button
              type="button"
              className={`privacy-toggle ${formData.privacy.gender ? 'private' : 'public'}`}
              onClick={() => togglePrivacy('gender')}
              title={formData.privacy.gender ? 'Privato' : 'Pubblico'}
            >
              {formData.privacy.gender ? <FaLock /> : <FaLockOpen />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="age">Età</label>
          <div className="privacy-input-group">
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min={18}
              max={120}
              placeholder="La tua età"
            />
            <button
              type="button"
              className={`privacy-toggle ${formData.privacy.age ? 'private' : 'public'}`}
              onClick={() => togglePrivacy('age')}
              title={formData.privacy.age ? 'Privato' : 'Pubblico'}
            >
              {formData.privacy.age ? <FaLock /> : <FaLockOpen />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Posizione</label>
          <div className="privacy-input-group">
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              maxLength={100}
              placeholder="La tua città"
            />
            <button
              type="button"
              className={`privacy-toggle ${formData.privacy.location ? 'private' : 'public'}`}
              onClick={() => togglePrivacy('location')}
              title={formData.privacy.location ? 'Privato' : 'Pubblico'}
            >
              {formData.privacy.location ? <FaLock /> : <FaLockOpen />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="bio">Bio *</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            maxLength={500}
            rows={4}
            placeholder="Racconta qualcosa su di te..."
            required
          />
          <div className="char-count">
            {formData.bio ? formData.bio.length : 0}/500
          </div>
        </div>
      </form>
    </div>
  );
};

export default PersonalInfo;