import React, { useState, useEffect, useCallback } from 'react';
import { User, Camera, Save, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import '../../styles/ProfilePage.css';
import ImageUploader from '../../components/common/ImageUploader';

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
    
    // Logica per estrarre i dati utente effettivi
    const actualUserData = userData.user ? userData.user : userData;
    console.log('👤 Dati utente effettivi da usare:', actualUserData);
    console.log('🎯 Nickname originale:', actualUserData.nickname);

    const newProfileData = {
      nickname: actualUserData.nickname || '', 
      gender: actualUserData.gender || '',
      age: actualUserData.age || '',
      interests: Array.isArray(actualUserData.interests) ? actualUserData.interests.join(', ') : (actualUserData.interests || ''),
      language: Array.isArray(actualUserData.languages) && actualUserData.languages.length > 0 ? actualUserData.languages[0] : (actualUserData.language || ''),
      profileImage: actualUserData.profileImage || ''
    };

    console.log('📋 Dati profilo impostati:', newProfileData);
    console.log('🎯 Nickname impostato:', newProfileData.nickname, '(vuoto per nuovi utenti, valore esistente per utenti registrati)');
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
      const actualUserData = user.user ? user.user : user; 
      const originalForComparison = {
        nickname: actualUserData.nickname || '',
        gender: actualUserData.gender || '',
        age: actualUserData.age || '',
        interests: Array.isArray(actualUserData.interests) ? actualUserData.interests.join(', ') : (actualUserData.interests || ''),
        language: Array.isArray(actualUserData.languages) && actualUserData.languages.length > 0 ? actualUserData.languages[0] : (actualUserData.language || ''),
        profileImage: actualUserData.profileImage || ''
      };

      const changes = Object.keys(profileData).some(key => {
        const currentValue = profileData[key];
        const originalValue = originalForComparison[key] || ''; // Usa l'oggetto trasformato per il confronto
        return currentValue !== originalValue;
      });
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
  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      
      console.log('📤 Chiamata updateProfileImage...');
      const result = await updateProfileImage(formData);
      
      // Aggiorna lo stato o mostra un messaggio di successo
      console.log('✅ Immagine aggiornata con successo:', result);
      setMessage({ type: 'success', text: 'Immagine profilo aggiornata!' });
       setTimeout(() => { setMessage({ type: '', text: '' }); }, 3000);
    } catch (error) {
      console.error('❌ Errore durante l\'aggiornamento dell\'immagine:', error);
      setMessage({ type: 'error', text: error.message || 'Errore caricamento immagine.' });
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
        nickname: profileData.nickname.trim(),
        gender: profileData.gender,
        age: profileData.age ? parseInt(profileData.age) : null,
        interests: profileData.interests.split(',').map(item => item.trim()).filter(item => item), // Da stringa a array
        languages: profileData.language ? [profileData.language.trim()] : [] // Da stringa a array (se gestisci una sola lingua nel form)
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
                  <ImageUploader
                    onImageSelect={handleImageUpload}
                    maxSizeMB={5}
                    aspectRatio={1}
                    minWidth={200}
                    minHeight={200}
                    maxWidth={2000}
                    maxHeight={2000}
                    className="profile-image-uploader"
                  >
                    {user?.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt="Immagine profilo" 
                        className="current-profile-image"
                      />
                    ) : null}
                  </ImageUploader>
                </div>
                <label 
                  htmlFor="profileImage" 
                  className={`camera-button ${saving ? 'disabled' : ''}`}
                >
                  <Camera className="camera-icon" />
                </label>
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
                  <option value="uomo">Maschio</option>
                  <option value="donna">Femmina</option>
                  <option value="altro">Altro</option>
                  <option value="preferisco_non_dirlo">Preferisco non dire</option>
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