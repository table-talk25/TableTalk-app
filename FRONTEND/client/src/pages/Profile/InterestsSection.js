import React, { useState } from 'react';
import { FaEdit, FaSave, FaTimes, FaPlus, FaTimes as FaRemove } from 'react-icons/fa';
import '../../styles/InterestsSection.css';

const InterestsSection = ({ interests = [], languages = [], onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [interestsList, setInterestsList] = useState(interests);
  const [languagesList, setLanguagesList] = useState(languages);
  const [newInterest, setNewInterest] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [preferredCuisine, setPreferredCuisine] = useState('');

  // Elenco delle lingue disponibili
  const availableLanguages = [
    { code: 'it', name: 'Italiano' },
    { code: 'en', name: 'Inglese' },
    { code: 'fr', name: 'Francese' },
    { code: 'es', name: 'Spagnolo' },
    { code: 'de', name: 'Tedesco' },
    { code: 'pt', name: 'Portoghese' },
    { code: 'ru', name: 'Russo' },
    { code: 'zh', name: 'Cinese' },
    { code: 'ja', name: 'Giapponese' },
    { code: 'ar', name: 'Arabo' }
  ];

  // Elenco delle cucine preferite
  const availableCuisines = [
    'Italiana',
    'Giapponese',
    'Cinese',
    'Indiana',
    'Messicana',
    'Mediterranea',
    'Vegana',
    'Vegetariana',
    'Fast Food',
    'Fusion'
  ];

  // Elenco degli interessi suggeriti
  const suggestedInterests = [
    'Cucina Italiana',
    'Cucina Giapponese',
    'Cucina Cinese',
    'Cucina Indiana',
    'Cucina Messicana',
    'Cucina Mediterranea',
    'Cucina Vegana',
    'Cucina Vegetariana',
    'Cucina Fusion',
    'Cucina Molecolare',
    'Cucina Tradizionale',
    'Cucina Contemporanea',
    'Cucina Regionale',
    'Cucina Internazionale',
    'Cucina Gourmet',
    'Cucina Street Food',
    'Cucina Fusion',
    'Cucina Sostenibile',
    'Cucina Biologica',
    'Cucina Slow Food'
  ];

  const handleAddInterest = () => {
    if (newInterest.trim() && !interestsList.includes(newInterest.trim())) {
      setInterestsList([...interestsList, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest) => {
    setInterestsList(interestsList.filter(item => item !== interest));
  };

  const handleAddLanguage = () => {
    if (newLanguage && !languagesList.find(lang => lang.code === newLanguage)) {
      const languageToAdd = availableLanguages.find(lang => lang.code === newLanguage);
      if (languageToAdd) {
        setLanguagesList([...languagesList, languageToAdd]);
        setNewLanguage('');
      }
    }
  };

  const handleRemoveLanguage = (languageCode) => {
    setLanguagesList(languagesList.filter(lang => lang.code !== languageCode));
  };

  const handleSave = async () => {
    await onUpdate({
      interests: interestsList,
      languages: languagesList,
      preferredCuisine: preferredCuisine
    });
    setIsEditing(false);
  };

  return (
    <div className="interests-container">
      <div className="section-header">
        <h2>Interessi e Lingue</h2>
        {!isEditing ? (
          <button 
            className="edit-button"
            onClick={() => setIsEditing(true)}
            aria-label="Modifica interessi e lingue"
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
              onClick={handleSave}
              aria-label="Salva modifiche"
            >
              <FaSave />
            </button>
          </div>
        )}
      </div>

      <div className="interests-section">
        <h3>I tuoi interessi</h3>
        
        {!isEditing ? (
          <div className="interests-list">
            {interestsList.length > 0 ? (
              interestsList.map((interest, index) => (
                <span key={index} className="interest-tag">
                  {interest}
                </span>
              ))
            ) : (
              <p className="no-items">Nessun interesse aggiunto.</p>
            )}
          </div>
        ) : (
          <div className="interests-edit">
            <div className="interests-input-group">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Aggiungi un interesse..."
                maxLength={30}
              />
              <button 
                onClick={handleAddInterest}
                disabled={!newInterest.trim()}
                className="add-button"
              >
                <FaPlus />
              </button>
            </div>
            
            <div className="suggested-interests">
              <h4>Interessi suggeriti:</h4>
              <div className="suggested-tags">
                {suggestedInterests.map((interest, index) => (
                  <button
                    key={index}
                    className="suggested-tag"
                    onClick={() => {
                      if (!interestsList.includes(interest)) {
                        setInterestsList([...interestsList, interest]);
                      }
                    }}
                    disabled={interestsList.includes(interest)}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="interests-list editable">
              {interestsList.map((interest, index) => (
                <span key={index} className="interest-tag">
                  {interest}
                  <button 
                    onClick={() => handleRemoveInterest(interest)}
                    className="remove-button"
                  >
                    <FaRemove />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="languages-section">
        <h3>Lingue parlate</h3>
        
        {!isEditing ? (
          <div className="languages-list">
            {languagesList.length > 0 ? (
              languagesList.map((language, index) => (
                <span key={index} className="language-tag">
                  {language.name}
                </span>
              ))
            ) : (
              <p className="no-items">Nessuna lingua aggiunta.</p>
            )}
          </div>
        ) : (
          <div className="languages-edit">
            <div className="languages-input-group">
              <select
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
              >
                <option value="">Seleziona una lingua...</option>
                {availableLanguages
                  .filter(lang => !languagesList.find(l => l.code === lang.code))
                  .map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
              </select>
              <button 
                onClick={handleAddLanguage}
                disabled={!newLanguage}
                className="add-button"
              >
                <FaPlus />
              </button>
            </div>
            
            <div className="languages-list editable">
              {languagesList.map((language, index) => (
                <span key={index} className="language-tag">
                  {language.name}
                  <button 
                    onClick={() => handleRemoveLanguage(language.code)}
                    className="remove-button"
                  >
                    <FaRemove />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="cuisine-section">
        <h3>Cucina Preferita</h3>
        
        {!isEditing ? (
          <div className="preferred-cuisine">
            {preferredCuisine ? (
              <span className="cuisine-tag">{preferredCuisine}</span>
            ) : (
              <p className="no-items">Nessuna cucina preferita selezionata.</p>
            )}
          </div>
        ) : (
          <div className="cuisine-edit">
            <select
              value={preferredCuisine}
              onChange={(e) => setPreferredCuisine(e.target.value)}
              className="cuisine-select"
            >
              <option value="">Seleziona una cucina...</option>
              {availableCuisines.map((cuisine, index) => (
                <option key={index} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterestsSection;