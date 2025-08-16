// File: frontend/client/src/components/profile/PersonalInfo.js (Integrato con PlacesAutocomplete)

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEye, FaEyeSlash, FaMapMarkerAlt } from 'react-icons/fa';
import PlacesAutocompleteInput from '../../Map/PlacesAutocompleteInput';
import ProfileSectionWrapper from '../ProfileSectionWrapper';
import styles from './PersonalInfo.module.css';

const PersonalInfo = ({ profileData, onUpdate, isPublicView = false }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nickname: '', bio: '', dateOfBirth: '', 
    location: { address: '', coordinates: undefined }, // <-- 'location' ora è un oggetto GeoJSON
    gender: '', phone: '',
    privacy: { showAge: true, showLocation: true, showPhone: false }
  });

  useEffect(() => {
    if (profileData) {
      setFormData({
        nickname: profileData.nickname || '',
        bio: profileData.bio || '',
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
        // 🔄 LOCATION GEOJSON: Manteniamo l'oggetto completo con address e coordinates
        location: {
          address: profileData.location?.address || '',
          coordinates: profileData.location?.coordinates || undefined
        },
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
    if (isPublicView) return; // Non permettere modifiche in modalità pubblica
    
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePrivacyToggle = (field) => {
    if (isPublicView) return; // Non permettere modifiche privacy in modalità pubblica
    
    setFormData(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [field]: !prev.privacy[field] }
    }));
  };

  // 🔄 LOCATION GEOJSON: Gestisce la selezione della location dal PlacesAutocompleteInput
  const handleLocationSelect = (locationData) => {
    if (isPublicView) return; // Non permettere modifiche location in modalità pubblica
    
    console.log('📍 [PersonalInfo] Location selezionata:', locationData);
    setFormData(prev => ({
      ...prev,
      location: {
        address: locationData.address || '',
        coordinates: locationData.coordinates || undefined
      }
    }));
  };

  // 🔄 LOCATION GEOJSON: Gestisce il cambio manuale dell'indirizzo
  const handleLocationChange = (address) => {
    if (isPublicView) return; // Non permettere modifiche location in modalità pubblica
    
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        address: address
      }
    }));
  };

  const handleSave = async () => {
    if (isPublicView || !onUpdate) return; // Non permettere il salvataggio in modalità pubblica
    
    setError(''); // Pulisci eventuali errori precedenti
    try {
      // 🔄 LOCATION GEOJSON: Invia l'oggetto location completo con address e coordinates
      const dataToUpdate = {
        nickname: formData.nickname,
        bio: formData.bio,
        dateOfBirth: formData.dateOfBirth,
        // Invia l'oggetto location completo nel formato GeoJSON
        location: {
          type: 'Point',
          address: formData.location.address,
          coordinates: formData.location.coordinates
        },
        gender: formData.gender,
        phone: formData.phone,
        settings: { ...profileData.settings, privacy: { ...formData.privacy, showPhone: false } }
      };
      await onUpdate(dataToUpdate);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || t('profile.personalInfo.updateError'));
    }
  };

  const handleCancel = () => {
    if (isPublicView) return; // Non permettere l'annullamento in modalità pubblica
    
    setError(''); // Pulisci errori quando si annulla
    if (profileData) {
        setFormData({
            nickname: profileData.nickname || '',
            bio: profileData.bio || '',
            dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
            // 🔄 LOCATION GEOJSON: Manteniamo l'oggetto completo anche nell'annulla
            location: {
              address: profileData.location?.address || '',
              coordinates: profileData.location?.coordinates || undefined
            },
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
  
  const renderInfoField = (label, value, defaultValue = t('profile.personalInfo.notSpecified')) => (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}:</span>
      <span className={styles.infoValue}>{value || defaultValue}</span>
    </div>
  );

  return (
    <ProfileSectionWrapper
      title={t('profile.personalInfo.title')}
      isPublicView={isPublicView}
      showEditButton={!isEditing}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancel={handleCancel}
      showSaveCancel={isEditing}
    >

      {!isEditing ? (
        <div className={styles.infoDisplay}>
          {/* 🔄 LOCATION GEOJSON: Mostra l'indirizzo e le coordinate se disponibili */}
          {renderInfoField(t('profile.personalInfo.nickname'), formData.nickname)}
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>{t('profile.personalInfo.location')}:</span>
            <div className={styles.locationInfo}>
              <span className={styles.infoValue}>
                {formData.location.address || t('profile.personalInfo.notSpecified')}
              </span>
              {formData.location.coordinates && (
                <small className={styles.coordinatesInfo}>
                  📍 {formData.location.coordinates[1]?.toFixed(6)}, {formData.location.coordinates[0]?.toFixed(6)}
              </small>
              )}
            </div>
          </div>
          {renderInfoField(t('profile.personalInfo.age'), profileData?.age, t('profile.personalInfo.notSpecifiedAge'))}
          {renderInfoField(t('profile.personalInfo.gender'), formData.gender)}
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>{t('profile.personalInfo.bio')}:</span>
            <p className={styles.infoValueBio}>{formData.bio || t('profile.personalInfo.noBio')}</p>
          </div>
        </div>
      ) : !isPublicView ? (
        <div className={styles.form}>
          {error && (
            <div className={styles.errorMessage} style={{ 
              color: 'red', 
              backgroundColor: '#ffe6e6', 
              padding: '10px', 
              borderRadius: '5px', 
              marginBottom: '20px',
              border: '1px solid #ff9999'
            }}>
              {error}
            </div>
          )}
          {/* --- NESSUNA MODIFICA QUI ---
              Anche questa parte ora funziona perché formData.location è una stringa */}
          <input name="nickname" value={formData.nickname} onChange={handleChange} placeholder={t('profile.personalInfo.nickname')} className={styles.input} />
          <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder={t('profile.personalInfo.bioPlaceholder')} className={styles.textarea} />
          <hr className={styles.divider} />
          
          <select name="gender" value={formData.gender} onChange={handleChange} className={styles.input}>
            <option value="">{t('profile.personalInfo.selectGender')}</option>
            <option value="male">{t('profile.personalInfo.male')}</option>
            <option value="female">{t('profile.personalInfo.female')}</option>
            <option value="non-binary">{t('profile.personalInfo.nonBinary')}</option>
            <option value="other">{t('profile.personalInfo.other')}</option>
          </select>

          <div className={styles.fieldWithPrivacy}>
            <div className={styles.locationInputContainer}>
              <PlacesAutocompleteInput
                value={formData.location}
                onSelect={handleLocationSelect}
                onChange={handleLocationChange}
                placeholder={t('profile.personalInfo.locationPlaceholder')}
                className={styles.input}
                inputProps={{
                  'data-testid': 'location-input'
                }}
              />
              <div className={styles.locationStatus}>
                {formData.location.coordinates ? (
                  <span className={styles.coordinatesStatus} title="Coordinate disponibili">
                    📍
                  </span>
                ) : (
                  <span className={styles.noCoordinatesStatus} title="Coordinate non disponibili">
                    ❓
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => handlePrivacyToggle('showLocation')} className={styles.privacyBtn} title={t('profile.personalInfo.locationVisibility')}>
                {formData.privacy.showLocation ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>
          <div className={styles.fieldWithPrivacy}>
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={styles.input} />
            <button onClick={() => handlePrivacyToggle('showAge')} className={styles.privacyBtn} title={t('profile.personalInfo.ageVisibility')}>
                {formData.privacy.showAge ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder={t('profile.personalInfo.phonePlaceholder')} className={styles.input} />
        </div>
      ) : null}
    </ProfileSectionWrapper>
  );
};

export default PersonalInfo;