// File: /src/pages/Profile/index.js (Versione Definitiva e Completa)

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import profileService from '../../services/profileService';
import ProfileHeader from '../../components/profile/ProfileHeader';
import PersonalInfo from '../../components/profile/PersonalInfo';
import InterestsSection from '../../components/profile/InterestsSection';
import ProfileSettings from '../../components/profile/ProfileSettings';
import styles from './ProfilePage.module.css';
import BackButton from '../../components/common/BackButton';
import { Geolocation } from '@capacitor/geolocation';

const ProfilePage = () => {
  const { user, updateUser, loading: authLoading, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setProfileData(data);
    } catch (err) {
      setError('Impossibile caricare il profilo. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    console.log('[ProfilePage] useEffect attivato. user.id:', user?.id);

    if (user?.id) loadProfile();
  }, [user?.id, loadProfile]);

 const handleProfileUpdate = async (updatedData) => {
    setIsUpdating(true);
    try {
      // 1. Invia i dati da salvare al backend
      await profileService.updateProfile(updatedData);
      
      // 2. Mostra un messaggio di successo
      toast.success('Profilo aggiornato!');
      
      // 3. Ricarica da zero tutti i dati dal server per essere sicuro al 100%
      await loadProfile();

    } catch (err) {
      toast.error(err.message || 'Errore durante l\'aggiornamento.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageUpdate = async (formData) => {
    setIsUploading(true);
    try {
      await profileService.updateProfileImage(formData);
      toast.success('Immagine aggiornata!');
      await loadProfile(); // Ricarichiamo anche qui
    } catch (err) {
      toast.error(err.message || 'Errore durante l\'upload dell\'immagine.');
    } finally {
      setIsUploading(false);
    }
  };

  if (authLoading || loading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }
  if (error) {
    return <Container><Alert variant="danger">{error}</Alert></Container>;
  }
  if (!profileData) {
    return <Container><Alert variant="warning">Dati del profilo non disponibili.</Alert></Container>;
  }

  const handleUpdateLocation = async () => {
    try {
      // 1. Chiedi i permessi e ottieni la posizione
      await Geolocation.requestPermissions();
      const position = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = position.coords;
  
      // 2. Chiama il nostro nuovo servizio
      const updatedProfile = await profileService.updateLocationFromCoords({
        latitude,
        longitude,
      });
      
      // 3. Aggiorna lo stato del profilo nell'app per mostrare il nuovo indirizzo
      console.log('Indirizzo aggiornato:', updatedProfile.address);
      // Qui aggiornerai lo stato del tuo componente con il nuovo indirizzo
      // setUserProfile({ ...userProfile, location: { address: updatedProfile.address } });
  
    } catch (error) {
      console.error("Errore nell'aggiornamento della posizione:", error);
      // Mostra un messaggio di errore all'utente
    }
  };
  
  return (
    <div className={styles.profilePageBackground}>
      <Container className={styles.profileContainer}>
        <div className={styles.profileGrid}>
          <div className={styles.profileHeaderCard}>
            <ProfileHeader profile={profileData} onUpdateImage={handleImageUpdate} isPublicView={false} />
          </div>
          <div className={styles.profilePersonalInfoCard}>
            <PersonalInfo profileData={profileData} onUpdate={handleProfileUpdate} />
          </div>
          <div className={styles.profileInterestsCard}>
            <InterestsSection profileData={profileData} onUpdate={handleProfileUpdate} isPublicView={false} />
          </div>
          <button className="btn btn-primary" onClick={handleUpdateLocation}>
            📍 Usa la mia posizione attuale
          </button>
          <div className={styles.profileSettingsCard}>
            <ProfileSettings profileData={profileData} onUpdate={handleProfileUpdate} onLogout={logout} onDeleteAccount={deleteAccount} />
          </div>
        </div>
        <p>
          Per maggiori informazioni su come trattiamo i tuoi dati, 
          leggi la nostra <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </Container>
      <BackButton className="mb-4" /> 

    </div>
  );
};

export default ProfilePage;