// File: /src/pages/Profile/ProfilePage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';

import { useAuth } from '../../contexts/AuthContext';
import profileService from '../../services/profileService';

import ProfileHeader from '../../components/profile/ProfileHeader';
import PersonalInfo from '../../components/profile/PersonalInfo';
import InterestsSection from '../../components/profile/InterestsSection';
import ProfileSettings from '../../components/profile/ProfileSettings';

import '../../styles/profile/ProfilePage.css';

const ProfilePage = () => {

  console.log('%c[ProfilePage] Inizio Render...', 'color: green;');

  // --- 1. HOOKS E STATO ---
  // Otteniamo dati e funzioni globali dal nostro AuthContext
  const { user, updateUser, loading: authLoading } = useAuth();
  
  // Hook per la navigazione e per leggere lo stato passato durante il redirect
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();

  // Stato specifico di questa pagina
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true); // Per il caricamento iniziale del profilo
  const [isUpdating, setIsUpdating] = useState(false); // Per gli aggiornamenti successivi (mostra lo spinner sui bottoni)
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false); // Aggiungiamo uno stato per l'upload
  const [meals, setMeals] = useState([]);

  // --- 2. LOGICA DI CARICAMENTO DATI ---
  // Funzione per caricare il profilo dal backend
  const loadProfile = useCallback(async () => {
    console.log('[ProfilePage] Eseguo loadProfile...');

    try {
      setLoading(true);
      const data = await profileService.getProfile();
      console.log('[ProfilePage] ✅ Dati del profilo ricevuti dal servizio:', data);

      setProfileData(data);
      setMeals(data.createdMeals || []);
    } catch (err) {
      console.error('[ProfilePage] ❌ Errore durante il caricamento del profilo:', err);

      toast.error(err.message || 'Errore durante il caricamento del profilo.');
      setError('Impossibile caricare il profilo. Riprova più tardi.');
    } finally {
      console.log('[ProfilePage] Imposto loading a false.');

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Carichiamo i dati solo se abbiamo un utente autenticato
    if (user?.id) {
        console.log('[ProfilePage] useEffect attivato per caricare i dati.');
        loadProfile();
    }
  }, [user, loadProfile]);

  // useEffect per mostrare il messaggio di benvenuto dopo la registrazione
  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message);
      // Pulisce lo stato dalla cronologia di navigazione per evitare che il toast riappaia
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // --- 3. GESTIONE DEGLI AGGIORNAMENTI ---
  // Un'unica funzione per gestire tutti gli aggiornamenti del profilo
  const handleProfileUpdate = async (updatedData) => {

    console.log('[ProfilePage] Dati parziali ricevuti dal figlio:', updatedData);

    const fullProfileData = { ...profileData, ...updatedData };

    console.log('[ProfilePage] Invio il profilo completo e unito al servizio:', fullProfileData);

    setIsUpdating(true);
    try {
      // Chiamiamo il nostro servizio semplificato. L'interceptor di Axios gestirà il token.
      const updatedUser = await profileService.updateProfile(fullProfileData);
      
      updateUser(updatedUser);

      setProfileData(updatedUser);
      setMeals(updatedUser.createdMeals || []);
      
      toast.success('Profilo aggiornato con successo!');
    } catch (err) {
      // L'errore che arriva qui è già stato processato dall'interceptor
      toast.error(err.message || 'Si è verificato un errore durante l\'aggiornamento.');
    } finally {
      setIsUpdating(false);
    }
  };

  console.log('[ProfilePage] Controllo condizioni di rendering:', { authLoading, loading, error, profileData });

  const handleImageUpdate = async (formData) => {
    setIsUploading(true);
    try {
      // Chiama il servizio dedicato all'upload di file
      const updatedUser = await profileService.updateAvatar(formData);      updateUser(updatedUser); // Aggiorna il context
      setProfileData(updatedUser); // Aggiorna lo stato locale
      setMeals(updatedUser.createdMeals || []);
      toast.success('Immagine aggiornata!');
    } catch (err) {
      toast.error(err.message || 'Errore durante l\'upload dell\'immagine.');
    } finally {
      setIsUploading(false);
    }
  };

  // --- 4. LOGICA DI RENDER ---
  // Mostra uno spinner durante il caricamento iniziale dei dati
  if (authLoading || loading) {
    console.log('[ProfilePage] Renderizzo: SPINNER');

    return (
      <Container className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </Spinner>
      </Container>
    );
  }

  // Mostra un messaggio di errore se il caricamento fallisce
  if (error) {
    console.log('[ProfilePage] Renderizzo: ERRORE');

    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  
  // Se non ci sono dati profilo (caso raro ma possibile), mostra un messaggio
  if (!profileData) {
    console.log('[ProfilePage] Renderizzo: NESSUN DATO PROFILO');

    return (
      <Container>
        <Alert variant="warning">Nessun dato del profilo disponibile.</Alert>
      </Container>
    );
  }

  console.log('[ProfilePage] Renderizzo: CONTENUTO PRINCIPALE');


  return (
    <div className="profile-page-background">
      <Container className="profile-container py-5">
        
        {/* Mostra un avviso se il profilo non è ancora stato completato */}
        {user && !user.profileCompleted && (
          <Alert variant="info" className="mb-4 shadow-sm">
            <div className="welcome-message">
              <strong>Benvenuto in TableTalk!</strong> Completa il tuo profilo per iniziare a trovare i compagni di pasto perfetti.
            </div>
          </Alert>
        )}

        <div className="profile-grid">
          {/* Componente per l'header del profilo (foto, nome, bio) */}
          <div className="profile-header-card">
            <ProfileHeader
              profile={profileData}
              onUpdate={handleProfileUpdate}
              onUpdateImage={handleImageUpdate}
              isUpdating={isUpdating || isUploading}
            />
          </div>

          {/* Componente per le informazioni personali */}
          <div className="profile-personal-info-card">
            <PersonalInfo
              profileData={profileData}
              onUpdate={handleProfileUpdate}
              isUpdating={isUpdating}
            />
          </div>

          {/* Componente per interessi e lingue */}
          <div className="profile-interests-card">
            <InterestsSection
              profileData={profileData}
              onUpdate={handleProfileUpdate}
              isUpdating={isUpdating}
            />
          </div>

          {/* Componente per le impostazioni dell'account */}
          <div className="profile-settings-card">
            <ProfileSettings
              profileData={profileData}
              onUpdate={handleProfileUpdate}
              isUpdating={isUpdating}
            />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProfilePage;