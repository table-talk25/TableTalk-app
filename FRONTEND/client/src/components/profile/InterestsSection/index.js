import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaSave, FaTimes, FaPlus, FaChevronDown } from 'react-icons/fa';
import { availableCuisines, availableInterests, availableLanguages } from '../../../constants/profileConstants';
import styles from './InterestsSection.module.css';

const InterestsSection = ({ profileData, onUpdate, isPublicView = false }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [interests, setInterests] = useState(profileData?.interests || []);
  const [languages, setLanguages] = useState(profileData?.languages || []);
  const [preferredCuisine, setPreferredCuisine] = useState(profileData?.preferredCuisine || '');
  const [newInterest, setNewInterest] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [showInterestSuggestions, setShowInterestSuggestions] = useState(false);
  const [showLanguageSuggestions, setShowLanguageSuggestions] = useState(false);
  
  const interestInputRef = useRef(null);
  const languageInputRef = useRef(null);

  useEffect(() => {
    if (profileData) {
      setInterests(profileData.interests || []);
      setLanguages(profileData.languages || []);
      setPreferredCuisine(profileData.preferredCuisine || '');
    }
  }, [profileData]);

  // Gestisce la chiusura dei suggerimenti quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (interestInputRef.current && !interestInputRef.current.contains(event.target)) {
        setShowInterestSuggestions(false);
      }
      if (languageInputRef.current && !languageInputRef.current.contains(event.target)) {
        setShowLanguageSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!profileData) {
    return null;
  }

  // Filtra gli interessi disponibili escludendo quelli già selezionati
  const availableInterestsFiltered = availableInterests.filter(
    interest => !interests.includes(interest)
  );

  // Filtra le lingue disponibili escludendo quelle già selezionate
  const availableLanguagesFiltered = availableLanguages.filter(
    lang => !languages.includes(lang.name)
  );

  // Filtra i suggerimenti in base al testo digitato
  const filteredInterestSuggestions = availableInterestsFiltered.filter(
    interest => interest.toLowerCase().includes(newInterest.toLowerCase())
  ).slice(0, 8); // Mostra massimo 8 suggerimenti

  const filteredLanguageSuggestions = availableLanguagesFiltered.filter(
    lang => lang.name.toLowerCase().includes(newLanguage.toLowerCase())
  ).slice(0, 8);

  const handleAddInterest = (interest) => {
    if (interest && !interests.includes(interest)) {
      setInterests([...interests, interest]);
      setNewInterest('');
      setShowInterestSuggestions(false);
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  const handleAddLanguage = (language) => {
    if (language && !languages.includes(language)) {
      setLanguages([...languages, language]);
      setNewLanguage('');
      setShowLanguageSuggestions(false);
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
        <h2>{t('profile.interests.title')}</h2>
        {!isPublicView && !isEditing && (
          <button className={styles.editButton} onClick={() => setIsEditing(true)}><FaEdit /> {t('profile.interests.edit')}</button>
        )}
        {isEditing && (
          <div className={styles.editButtons}>
            <button className={styles.cancelButton} onClick={handleCancel}><FaTimes /> {t('profile.interests.cancel')}</button>
            <button className={styles.saveButton} onClick={handleSave}><FaSave /> {t('profile.interests.save')}</button>
          </div>
        )}
      </div>

      <div className={styles.interestsSection}>
        <h3>{t('profile.interests.yourInterests')}</h3>
        {isEditing && (
          <div className={styles.inputGroup}>
            <div className={styles.autocompleteContainer} ref={interestInputRef}>
              <input 
                type="text" 
                value={newInterest} 
                onChange={(e) => {
                  setNewInterest(e.target.value);
                  setShowInterestSuggestions(true);
                }}
                onFocus={() => setShowInterestSuggestions(true)}
                placeholder={t('profile.interests.searchInterest')} 
                className={styles.autocompleteInput}
              />
              {showInterestSuggestions && filteredInterestSuggestions.length > 0 && (
                <div className={styles.suggestionsList}>
                  {filteredInterestSuggestions.map((interest, index) => (
                    <div 
                      key={index} 
                      className={styles.suggestionItem}
                      onClick={() => handleAddInterest(interest)}
                    >
                      {interest}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => handleAddInterest(newInterest)} disabled={!newInterest.trim() || interests.includes(newInterest.trim())}>
              <FaPlus />
            </button>
          </div>
        )}
        <div className={styles.tagsList}>
          {interests.length > 0 ? interests.map((item, index) => (
            <span key={index} className={styles.interestTag}>
              {item}
              {isEditing && <button onClick={() => handleRemoveInterest(item)}><FaTimes /></button>}
            </span>
          )) : !isEditing && <p className={styles.noItems}>{t('profile.interests.noInterests')}</p>}
        </div>
      </div>

      <div className={styles.languagesSection}>
        <h3>{t('profile.interests.languagesSpoken')}</h3>
        {isEditing && (
          <div className={styles.inputGroup}>
            <div className={styles.autocompleteContainer} ref={languageInputRef}>
              <input 
                type="text" 
                value={newLanguage} 
                onChange={(e) => {
                  setNewLanguage(e.target.value);
                  setShowLanguageSuggestions(true);
                }}
                onFocus={() => setShowLanguageSuggestions(true)}
                placeholder={t('profile.interests.searchLanguage')} 
                className={styles.autocompleteInput}
              />
              {showLanguageSuggestions && filteredLanguageSuggestions.length > 0 && (
                <div className={styles.suggestionsList}>
                  {filteredLanguageSuggestions.map((lang, index) => (
                    <div 
                      key={index} 
                      className={styles.suggestionItem}
                      onClick={() => handleAddLanguage(lang.name)}
                    >
                      {lang.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => handleAddLanguage(newLanguage)} disabled={!newLanguage.trim() || languages.includes(newLanguage.trim())}>
              <FaPlus />
            </button>
          </div>
        )}
        <div className={styles.tagsList}>
          {languages.length > 0 ? languages.map((item, index) => (
            <span key={index} className={styles.languageTag}>
              {item}
              {isEditing && <button onClick={() => handleRemoveLanguage(item)}><FaTimes /></button>}
            </span>
          )) : !isEditing && <p className={styles.noItems}>{t('profile.interests.noLanguages')}</p>}
        </div>
      </div>

      <div className={styles.cuisineSection}>
        <h3>{t('profile.interests.preferredCuisine')}</h3>
        {!isEditing ? (
          <div className={styles.preferredCuisine}>
            {preferredCuisine ? <span className={styles.cuisineTag}>{preferredCuisine}</span> : <p className={styles.noItems}>{t('profile.interests.noCuisine')}</p>}
          </div>
        ) : (
          <select value={preferredCuisine} onChange={(e) => setPreferredCuisine(e.target.value)} className={styles.cuisineSelect}>
            <option value="">{t('profile.interests.selectCuisine')}</option>
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