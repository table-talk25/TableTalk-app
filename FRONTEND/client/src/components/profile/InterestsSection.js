// File: frontend/client/src/components/profile/InterestsSection.js (Versione Unificata e Corretta)

import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaTimes, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { availableCuisines, suggestedInterests } from '../../constants/profileConstants'; // Assumendo che gli interessi suggeriti siano qui
import '../../styles/InterestsSection.css';

// Questo componente ora riceve l'intero oggetto `profileData` per semplicità
const InterestsSection = ({ profileData, onUpdate }) => {
  // Stato per la modalità modifica
  const [isEditing, setIsEditing] = useState(false);

  // Stati locali per gestire gli input durante la modifica
  const [interests, setInterests] = useState(profileData.interests || []);
  const [languages, setLanguages] = useState(profileData.languages || []);
  const [preferredCuisine, setPreferredCuisine] = useState(profileData.preferredCuisine || '');
  
  const [newInterest, setNewInterest] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  // Sincronizza lo stato se i dati del profilo cambiano dall'esterno
  useEffect(() => {
    setInterests(profileData.interests || []);
    setLanguages(profileData.languages || []);
    setPreferredCuisine(profileData.preferredCuisine || '');
  }, [profileData]);

  // Gestori per aggiungere/rimuovere Interessi e Lingue come TAGS
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
  
  // --- FUNZIONE DI SALVATAGGIO UNIFICATA ---
  const handleSave = () => {
    // Il componente invia solo i dati che gestisce, nel formato corretto
    const dataToUpdate = {
      interests: interests,         // Array di stringhe
      languages: languages,         // Array di stringhe
      preferredCuisine: preferredCuisine  // Singola stringa
    };
    
    // Chiama la funzione di aggiornamento del genitore (ProfilePage)
    onUpdate(dataToUpdate);
    setIsEditing(false); // Esce dalla modalità modifica
    toast.success("Preferenze aggiornate!");
  };

  // Funzione per annullare e ripristinare i dati originali
  const handleCancel = () => {
    setInterests(profileData.interests || []);
    setLanguages(profileData.languages || []);
    setPreferredCuisine(profileData.preferredCuisine || '');
    setIsEditing(false);
  };

  return (
    <div className="interests-container">
      <div className="section-header">
        <h2>Interessi e Preferenze</h2>
        {!isEditing ? (
          <button className="edit-button" onClick={() => setIsEditing(true)}><FaEdit /></button>
        ) : (
          <div className="edit-buttons">
            <button className="cancel-button" onClick={handleCancel}><FaTimes /></button>
            <button className="save-button" onClick={handleSave}><FaSave /></button>
          </div>
        )}
      </div>

      {/* --- SEZIONE INTERESSI (gestita con tags) --- */}
      <div className="interests-section">
        <h3>I tuoi interessi</h3>
        {isEditing ? (
          <div className="input-group">
            <input type="text" value={newInterest} onChange={(e) => setNewInterest(e.target.value)} placeholder="Aggiungi interesse..." />
            <button onClick={handleAddInterest}><FaPlus /></button>
          </div>
        ) : null}
        <div className="tags-list">
          {interests.length > 0 ? interests.map((item, index) => (
            <span key={index} className="interest-tag">
              {item}
              {isEditing && <button onClick={() => handleRemoveInterest(item)}><FaTimes /></button>}
            </span>
          )) : <p className="no-items">Nessun interesse aggiunto.</p>}
        </div>
      </div>

      {/* --- SEZIONE LINGUE (gestita con tags) --- */}
      <div className="languages-section">
        <h3>Lingue parlate</h3>
        {isEditing ? (
          <div className="input-group">
            <input type="text" value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} placeholder="Aggiungi lingua..." />
            <button onClick={handleAddLanguage}><FaPlus /></button>
          </div>
        ) : null}
        <div className="tags-list">
          {languages.length > 0 ? languages.map((item, index) => (
            <span key={index} className="language-tag">
              {item}
              {isEditing && <button onClick={() => handleRemoveLanguage(item)}><FaTimes /></button>}
            </span>
          )) : <p className="no-items">Nessuna lingua aggiunta.</p>}
        </div>
      </div>

      {/* --- SEZIONE CUCINA PREFERITA (gestita con select) --- */}
      <div className="cuisine-section">
        <h3>Cucina Preferita</h3>
        {!isEditing ? (
          <div className="preferred-cuisine">
            {preferredCuisine ? <span className="cuisine-tag">{preferredCuisine}</span> : <p className="no-items">Nessuna cucina selezionata.</p>}
          </div>
        ) : (
          <select value={preferredCuisine} onChange={(e) => setPreferredCuisine(e.target.value)} className="cuisine-select">
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