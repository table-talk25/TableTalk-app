// File: frontend/client/src/components/profile/PersonalInfo.js (Corretto per la nuova location)

import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from './PersonalInfo.module.css';

const PersonalInfo = ({ profileData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '', bio: '', dateOfBirth: '', location: '', // <-- 'location' ora conterrà solo la stringa dell'indirizzo
    gender: '', phone: '',
    privacy: { showAge: true, showLocation: true, showPhone: false }
  });

  useEffect(() => {
    if (profileData) {
      setFormData({
        nickname: profileData.nickname || '',
        bio: profileData.bio || '',
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
        // --- MODIFICA 1 ---
        // Estraiamo solo la stringa 'address' dall'oggetto location.
        location: profileData.location?.address || '', 
        phone: profileData.phone || '',
        gender: profileData.gender || '',
        privacy: {
          showAge: profileData.settings?.privacy?.showAge ?? true,
          showLocation: profileData.settings?.privacy?.showLocation ?? true,
          showPhone: false
        }
      });
    }
  }, [profileData]);

  if (!profileData) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePrivacyToggle = (field) => {
    setFormData(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [field]: !prev.privacy[field] }
    }));
  };

  const handleSave = () => {
    // --- MODIFICA 2 ---
    // Quando salviamo, ricostruiamo l'oggetto location nel formato corretto per il backend.
    const dataToUpdate = {
      nickname: formData.nickname,
      bio: formData.bio,
      dateOfBirth: formData.dateOfBirth,
      // Invia l'indirizzo dentro l'oggetto location
      location: { address: formData.location },
      gender: formData.gender,
      phone: formData.phone,
      settings: { ...profileData.settings, privacy: { ...formData.privacy, showPhone: false } }
    };
    onUpdate(dataToUpdate);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (profileData) {
        setFormData({
            nickname: profileData.nickname || '',
            bio: profileData.bio || '',
            dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
            // --- MODIFICA 3 ---
            // Facciamo lo stesso anche nell'annulla
            location: profileData.location?.address || '',
            phone: profileData.phone || '',
            gender: profileData.gender || '',
            privacy: {
                showAge: profileData.settings?.privacy?.showAge ?? true,
                showLocation: profileData.settings?.privacy?.showLocation ?? true,
                showPhone: false
            }
        });
    }
    setIsEditing(false);
  };
  
  const renderInfoField = (label, value, defaultValue = 'Non specificato') => (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}:</span>
      <span className={styles.infoValue}>{value || defaultValue}</span>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Informazioni Personali</h2>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className={`${styles.btn} ${styles.btnEdit}`}><FaEdit /> Modifica</button>
        ) : (
          <div className={styles.editButtons}>
            <button onClick={handleCancel} className={`${styles.btn} ${styles.btnCancel}`}><FaTimes /> Annulla</button>
            <button onClick={handleSave} className={`${styles.btn} ${styles.btnSave}`}><FaSave /> Salva</button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className={styles.infoDisplay}>
          {/* --- NESSUNA MODIFICA QUI ---
              Questa parte ora funziona perché formData.location è una stringa */}
          {renderInfoField('Nickname', formData.nickname)}
          {renderInfoField('Posizione', formData.location)}
          {renderInfoField('Età', profileData?.age, 'Non specificata')}
          {renderInfoField('Genere', formData.gender)}
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Bio:</span>
            <p className={styles.infoValueBio}>{formData.bio || 'Nessuna biografia inserita.'}</p>
          </div>
        </div>
      ) : (
        <div className={styles.form}>
          {/* --- NESSUNA MODIFICA QUI ---
              Anche questa parte ora funziona perché formData.location è una stringa */}
          <input name="nickname" value={formData.nickname} onChange={handleChange} placeholder="Nickname" className={styles.input} />
          <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="La tua bio..." className={styles.textarea} />
          <hr className={styles.divider} />
          
          <select name="gender" value={formData.gender} onChange={handleChange} className={styles.input}>
            <option value="">Seleziona genere...</option>
            <option value="male">Maschio</option>
            <option value="female">Femmina</option>
            <option value="non-binary">Non binario</option>
            <option value="other">Altro</option>
          </select>

          <div className={styles.fieldWithPrivacy}>
            <input name="location" value={formData.location} onChange={handleChange} placeholder="La tua Posizione (es. Roma, Italia)" className={styles.input} />
            <button onClick={() => handlePrivacyToggle('showLocation')} className={styles.privacyBtn} title="Visibilità Posizione">
                {formData.privacy.showLocation ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>
          <div className={styles.fieldWithPrivacy}>
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={styles.input} />
            <button onClick={() => handlePrivacyToggle('showAge')} className={styles.privacyBtn} title="Visibilità Età">
                {formData.privacy.showAge ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Numero di telefono (privato)" className={styles.input} />
        </div>
      )}
    </div>
  );
};

export default PersonalInfo;