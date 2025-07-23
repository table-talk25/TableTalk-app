import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaTimes, FaPlus } from 'react-icons/fa';
import { availableCuisines } from '../../../constants/profileConstants';
import styles from './InterestsSection.module.css';

const InterestsSection = ({ profileData, onUpdate, isPublicView = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [interests, setInterests] = useState(profileData?.interests || []);
  const [languages, setLanguages] = useState(profileData?.languages || []);
  const [preferredCuisine, setPreferredCuisine] = useState(profileData?.preferredCuisine || '');
  const [newInterest, setNewInterest] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  useEffect(() => {
    if (profileData) {
      setInterests(profileData.interests || []);
      setLanguages(profileData.languages || []);
      setPreferredCuisine(profileData.preferredCuisine || '');
    }
  }, [profileData]);

  if (!profileData) {
    return null;
  }
  
  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (langToRemove) => {
    setLanguages(languages.filter(lang => lang !== langToRemove));
  };
  
  const handleSave = () => {
    const dataToUpdate = {
      interests: interests,
      languages: languages,
      preferredCuisine: preferredCuisine
    };
    onUpdate(dataToUpdate);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (profileData) {
      setInterests(profileData.interests || []);
      setLanguages(profileData.languages || []);
      setPreferredCuisine(profileData.preferredCuisine || '');
    }
    setIsEditing(false);
  };

  return (
    <div className={styles.interestsContainer}>
      <div className={styles.sectionHeader}>
        <h2>Interessi e Preferenze</h2>
        {!isPublicView && !isEditing && (
          <button className={styles.editButton} onClick={() => setIsEditing(true)}><FaEdit /> Modifica</button>
        )}
        {isEditing && (
          <div className={styles.editButtons}>
            <button className={styles.cancelButton} onClick={handleCancel}><FaTimes /> Annulla</button>
            <button className={styles.saveButton} onClick={handleSave}> Salva</button>
          </div>
        )}
      </div>

      <div className={styles.interestsSection}>
        <h3>I tuoi interessi</h3>
        {isEditing && (
          <div className={styles.inputGroup}>
            <input type="text" value={newInterest} onChange={(e) => setNewInterest(e.target.value)} placeholder="Aggiungi interesse..." />
            <button onClick={handleAddInterest}><FaPlus /></button>
          </div>
        )}
        <div className={styles.tagsList}>
          {interests.length > 0 ? interests.map((item, index) => (
            <span key={index} className={styles.interestTag}>
              {item}
              {isEditing && <button onClick={() => handleRemoveInterest(item)}><FaTimes /></button>}
            </span>
          )) : !isEditing && <p className={styles.noItems}>Nessun interesse aggiunto.</p>}
        </div>
      </div>

      <div className={styles.languagesSection}>
        <h3>Lingue parlate</h3>
        {isEditing && (
          <div className={styles.inputGroup}>
            <input type="text" value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} placeholder="Aggiungi lingua..." />
            <button onClick={handleAddLanguage}><FaPlus /></button>
          </div>
        )}
        <div className={styles.tagsList}>
          {languages.length > 0 ? languages.map((item, index) => (
            <span key={index} className={styles.languageTag}>
              {item}
              {isEditing && <button onClick={() => handleRemoveLanguage(item)}><FaTimes /></button>}
            </span>
          )) : !isEditing && <p className={styles.noItems}>Nessuna lingua aggiunta.</p>}
        </div>
      </div>

      <div className={styles.cuisineSection}>
        <h3>Cucina Preferita</h3>
        {!isEditing ? (
          <div className={styles.preferredCuisine}>
            {preferredCuisine ? <span className={styles.cuisineTag}>{preferredCuisine}</span> : <p className={styles.noItems}>Nessuna cucina selezionata.</p>}
          </div>
        ) : (
          <select value={preferredCuisine} onChange={(e) => setPreferredCuisine(e.target.value)} className={styles.cuisineSelect}>
            <option value="">Seleziona una cucina...</option>
            {availableCuisines.map((cuisine, index) => (
              <option key={index} value={cuisine}>{cuisine}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default InterestsSection;