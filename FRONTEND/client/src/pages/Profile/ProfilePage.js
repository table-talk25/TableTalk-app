import React, { useState, useEffect, useCallback } from 'react';
import { User, Camera, Save, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import '../../styles/ProfilePage.css';

const ProfilePage = () => {
  // Usa il Context dell'utente
  const { 
    user, 
    updateProfile, 
    updateProfileImage, 
    getUserProfileImageUrl, 
    syncUser,
    isAccountDeactivated 
  } = useUser();

  // Stati locali per il form
  const [profileData, setProfileData] = useState({
    nickname: '',
    gender: '',
    age: '',
    interests: '',
    language: '',
    profileImage: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Carica i dati del profilo dall'oggetto utente
   */
  const loadProfileFromUser = useCallback((userData) => {
    console.log('📥 Caricamento dati utente completi:', userData);
    
    const newProfileData = {
      nickname: userData.nickname || '',
      gender: userData.gender || '',
      age: userData.age || '',
      interests: userData.interests || '',
      language: userData.language || '',
      profileImage: userData.profileImage || ''
    };

    console.log('📋 Dati profilo impostati:', newProfileData);
    setProfileData(newProfileData);
    
    // Imposta l'anteprima dell'immagine
    const imageUrl = getUserProfileImageUrl ? getUserProfileImageUrl() : '';
    console.log('🖼️ URL immagine profilo:', imageUrl);
    setImagePreview(imageUrl);
  }, [getUserProfileImageUrl]);

  // Effetto per caricare i dati del profilo quando l'utente cambia
  useEffect(() => {
    console.log('🔄 Utente cambiato:', user);
    if (user) {
      loadProfileFromUser(user);
    }
  }, [user, loadProfileFromUser]);

  // Effetto per tracciare i cambiamenti
  useEffect(() => {
    if (user) {
      const changes = Object.keys(profileData).some(key => {
        const currentValue = profileData[key];
        const originalValue = user[key] || '';
        const hasChange = currentValue !== originalValue;
        
        if (hasChange) {
          console.log(`📝 Campo modificato - ${key}: "${originalValue}" -> "${currentValue}"`);
        }
        
        return hasChange;
      });
      
      console.log('🔍 Controllo modifiche:', { changes, profileData, userData: user });
      setHasChanges(changes);
    }
  }, [profileData, user]);

  /**
   * Sincronizza i dati con il server
   */
  const handleSync = async () => {
    console.log('🔄 Inizio sincronizzazione...');
    setSyncing(true);
    setMessage({ type: '', text: '' });
    
    try {
      const syncedUser = await syncUser();
      console.log('✅ Utente sincronizzato:', syncedUser);
      
      setMessage({ 
        type: 'success', 
        text: 'Dati sincronizzati con successo!' 
      });
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      console.error('❌ Errore durante la sincronizzazione:', error);
      setMessage({ 
        type: 'error', 
        text: 'Errore durante la sincronizzazione. Riprova più tardi.' 
      });
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Gestisce i cambiamenti nei campi del form
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Campo modificato: ${name} = "${value}"`);
    
    setProfileData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      console.log('📋 Nuovo stato profileData:', newData);
      return newData;
    });
  };

  /**
   * Gestisce il cambiamento dell'immagine del profilo
   */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('🖼️ Nuovo file immagine selezionato:', file);

      // Validazione del file
      if (!file.type.startsWith('image/')) {
        setMessage({ 
          type: 'error', 
          text: 'Per favore seleziona un\'immagine valida.' 
        });
      return;
    }

      if (file.size > 5 * 1024 * 1024) {
        setMessage({ 
          type: 'error', 
          text: 'L\'immagine deve essere inferiore a 5MB.' 
        });
        return;
      }
      
      // Anteprima immediata
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('🖼️ Anteprima immagine caricata');
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Carica l'immagine
      uploadProfileImage(file);
    }
  };

  /**
   * Carica l'immagine del profilo
   */
  const uploadProfileImage = async (file) => {
    console.log('📤 Inizio caricamento immagine profilo...');
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      
      console.log('📤 Chiamata updateProfileImage...');
      const result = await updateProfileImage(formData);
      console.log('✅ Immagine profilo aggiornata:', result);

      setMessage({ 
        type: 'success', 
        text: 'Immagine del profilo aggiornata con successo!' 
      });
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Errore nel caricamento dell\'immagine:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Errore nel caricamento dell\'immagine.' 
      });
      
      // Ripristina l'anteprima precedente
       const originalImageUrl = getUserProfileImageUrl ? getUserProfileImageUrl() : '';
      setImagePreview(originalImageUrl);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Salva i dati del profilo
   */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    console.log('💾 Inizio salvataggio profilo...');
    
    // Validazione
    if (!profileData.nickname.trim()) {
      console.log('❌ Validazione fallita: nickname mancante');
      setMessage({ 
        type: 'error', 
        text: 'Il nickname è obbligatorio.' 
      });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Prepara i dati per l'invio
      const dataToSave = {
        ...profileData,
        age: profileData.age ? parseInt(profileData.age) : null
      };
      
      console.log('📤 Dati da salvare:', dataToSave);
      console.log('👤 Utente corrente prima del salvataggio:', user);
      
      const updatedUser = await updateProfile(dataToSave);
      console.log('✅ Profilo aggiornato, utente restituito:', updatedUser);

      // Verifica che i dati siano stati effettivamente salvati
      if (updatedUser) {
        console.log('🔄 Ricaricamento dati dal server...');
        loadProfileFromUser(updatedUser);
      }
      
      setMessage({ 
        type: 'success', 
        text: 'Profilo aggiornato con successo!' 
      });
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      console.error('❌ Errore nel salvataggio del profilo:', error);
      console.error('📋 Dettagli errore:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      // Gestione specifica per account disattivato
      if (error.message === 'Account disattivato') {
        setMessage({ 
          type: 'error', 
          text: 'Il tuo account è stato disattivato. Per favore contatta il supporto per maggiori informazioni.' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: error.message || 'Errore nel salvataggio del profilo. Riprova.' 
        });
      }
    } finally {
      setSaving(false);
    }
  };

  /**
   * Ripristina i dati originali
   */
  const handleReset = () => {
    console.log('🔄 Ripristino dati originali...');
    if (user) {
      loadProfileFromUser(user);
      setMessage({ type: '', text: '' });
    }
  };

    // Debug dello stato corrente
    useEffect(() => {
      console.log('🐛 Debug stato corrente:', {
        user: user,
        profileData: profileData,
        hasChanges: hasChanges,
        saving: saving
      });
    }, [user, profileData, hasChanges, saving]);

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner-large"></div>
          <p className="loading-text">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  if (isAccountDeactivated) {
    return (
      <div className="profile-container">
        <div className="profile-wrapper">
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-header-content">
                <div className="profile-title-section">
                  <AlertCircle className="profile-icon" />
                  <h1 className="profile-title">Account Disattivato</h1>
                </div>
              </div>
            </div>
            <div className="message-container message-error">
              <AlertCircle className="message-icon" />
              <p className="message-text">
                Il tuo account è stato disattivato. Per riattivare il tuo account, 
                contatta il supporto tecnico all'indirizzo support@tabletalk.com
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        <div className="profile-card">
          {/* Header */}
          <div className="profile-header">
            <div className="profile-header-content">
              <div className="profile-title-section">
                <User className="profile-icon" />
                <h1 className="profile-title">Il Tuo Profilo</h1>
              </div>
              <button 
                onClick={handleSync}
                disabled={syncing}
                className="sync-button"
              >
                <RefreshCw className={`sync-icon ${syncing ? 'spinning' : ''}`} />
                <span>Sincronizza</span>
              </button>
            </div>
          </div>
          
          {/* Debug info (rimuovi in produzione) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="debug-section">
              <details>
                <summary className="debug-summary">Debug Info (solo sviluppo)</summary>
                <pre className="debug-content">
                  {JSON.stringify({ 
                    userId: user?._id,
                    hasChanges,
                    profileData,
                    userNickname: user?.nickname
                  }, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* Messaggio di stato */}
          {message.text && (
            <div className={`message-container ${
              message.type === 'success' ? 'message-success' : 'message-error'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="message-icon" />
              ) : (
                <AlertCircle className="message-icon" />
              )}
              <p className="message-text">{message.text}</p>
            </div>
          )}

          {/* Indicatore modifiche non salvate */}
          {hasChanges && (
            <div className="changes-indicator">
              <p className="changes-text">Hai modifiche non salvate</p>
              <button
                onClick={handleReset}
                className="reset-button"
              >
                Ripristina
              </button>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="profile-form">
            {/* Immagine del profilo */}
            <div className="profile-image-section">
              <div className="profile-image-container">
                <div className="profile-image-wrapper">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profilo" 
                      className="profile-image"
                    />
                  ) : (
                    <div className="profile-image-placeholder">
                      <User className="profile-image-placeholder-icon" />
                    </div>
                  )}
                </div>
                <label 
                  htmlFor="profileImage" 
                  className={`camera-button ${saving ? 'disabled' : ''}`}
                >
                  <Camera className="camera-icon" />
                </label>
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={saving}
                  className="sr-only"
                />
              </div>
              <p className="profile-image-hint">Clicca sulla fotocamera per cambiare l'immagine</p>
            </div>

            {/* Campi del profilo */}
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nickname" className="form-label required">
                  Nickname
                </label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  value={profileData.nickname}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                  className="form-input"
                  placeholder="Il tuo nickname"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender" className="form-label">
                  Genere
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={profileData.gender}
                  onChange={handleInputChange}
                  disabled={saving}
                  className="form-input"
                >
                  <option value="">Seleziona genere</option>
                  <option value="male">Maschio</option>
                  <option value="female">Femmina</option>
                  <option value="other">Altro</option>
                  <option value="prefer_not_to_say">Preferisco non dire</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="age" className="form-label">
                  Età
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={profileData.age}
                  onChange={handleInputChange}
                  disabled={saving}
                  min="13"
                  max="120"
                  className="form-input"
                  placeholder="La tua età"
                />
              </div>

              <div className="form-group">
                <label htmlFor="language" className="form-label">
                  Lingua
                </label>
                <select
                  id="language"
                  name="language"
                  value={profileData.language}
                  onChange={handleInputChange}
                  disabled={saving}
                  className="form-input"
                >
                  <option value="">Seleziona lingua</option>
                  <option value="italian">Italiano</option>
                  <option value="english">Inglese</option>
                  <option value="spanish">Spagnolo</option>
                  <option value="french">Francese</option>
                  <option value="german">Tedesco</option>
                  <option value="other">Altro</option>
                </select>
              </div>
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="interests" className="form-label">
                Interessi
              </label>
              <textarea
                id="interests"
                name="interests"
                value={profileData.interests}
                onChange={handleInputChange}
                disabled={saving}
                rows="3"
                className="form-textarea"
                placeholder="Parlaci dei tuoi interessi (cucina, viaggi, sport, musica, libri...)"
              />
            </div>

            {/* Pulsanti di azione */}
            <div className="form-actions">
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <div className="loading-spinner"></div>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="btn-icon" />
                    Salva Profilo
                  </>
                )}
              </button>

              {hasChanges && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="btn-secondary"
                >
                  Annulla
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Informazioni aggiuntive */}
        <div className="info-card">
          <h2 className="info-card-title">Perché completare il profilo?</h2>
          <div className="info-grid">
            <div className="info-item">
              <CheckCircle className="info-icon" />
              <p className="info-text">Trova persone con interessi simili ai tuoi</p>
            </div>
            <div className="info-item">
              <CheckCircle className="info-icon" />
              <p className="info-text">Comunicazione più facile con la lingua preferita</p>
            </div>
            <div className="info-item">
              <CheckCircle className="info-icon" />
              <p className="info-text">Crea connessioni autentiche</p>
            </div>
            <div className="info-item">
              <CheckCircle className="info-icon" />
              <p className="info-text">Partecipa a pasti virtuali più coinvolgenti</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;