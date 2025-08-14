// File: /src/pages/Profile/index.js (Versione Definitiva e Completa)

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import profileService from '../../services/profileService';
import ProfileHeader from '../../components/profile/ProfileHeader';
import PersonalInfo from '../../components/profile/PersonalInfo';
import InterestsSection from '../../components/profile/InterestsSection';
import LanguagesSection from '../../components/profile/LanguagesSection';
import ProfileSettings from '../../components/profile/ProfileSettings';
import styles from './ProfilePage.module.css';
import BackButton from '../../components/common/BackButton';
import { Geolocation } from '@capacitor/geolocation';

const ProfilePage = () => {
  const { t } = useTranslation();
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
      setError(t('profile.loadError'));
    } finally {
      setLoading(false);
    }
  }, [updateUser, t]);

  useEffect(() => {
    console.log('[ProfilePage] useEffect attivato. user.id:', user?.id);

    if (user?.id) loadProfile();
  }, [user?.id, loadProfile]);

  const handleProfileUpdate = async (updatedData) => {
    setIsUpdating(true);
    try {
      // 1. Invia i dati da salvare al backend
      const fresh = await profileService.updateProfile(updatedData);
      
      // 2. Mostra un messaggio di successo
      toast.success(t('profile.updateSuccess'));
      
      // 3. Ricarica da zero tutti i dati dal server per essere sicuro al 100%
      setProfileData(fresh);
      // Propaga anche nel context per evitare che un refetch sovrascriva con i vecchi dati
      await updateUser(fresh);

    } catch (err) {
      const status = err?.response?.status;
      const code = err?.code;
      // Se è un errore di rete transitorio (es. ECONNABORTED/ERR_NETWORK) non mostriamo errore rosso
      if (!status && (code === 'ERR_NETWORK' || code === 'ECONNABORTED')) {
        // opzionale: toast.info(t('common.networkTemporary'));
      } else {
        toast.error(err?.response?.data?.message || err?.message || t('profile.updateError'));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageUpdate = async (formData) => {
    setIsUploading(true);
    try {
      await profileService.updateProfileImage(formData);
      toast.success(t('profile.imageUpdateSuccess'));
      await loadProfile(); // Ricarichiamo anche qui
    } catch (err) {
      const status = err?.response?.status;
      const code = err?.code;
      if (!status && (code === 'ERR_NETWORK' || code === 'ECONNABORTED')) {
        // opzionale: toast.info(t('common.networkTemporary'));
      } else {
        toast.error(err?.response?.data?.message || err?.message || t('profile.imageUpdateError'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (authLoading || loading) {
    return <Spinner fullscreen label={t('common.loadingProfile') || 'Caricamento profilo...'} />;
  }
  if (error) {
    return <Container><Alert variant="danger">{error}</Alert></Container>;
  }
  if (!profileData) {
    return <Container><Alert variant="warning">{t('profile.noDataAvailable')}</Alert></Container>;
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
      
      // 3. Aggiorna il context
      updateUser(updatedProfile);
      
      // 4. Mostra un messaggio di successo
      toast.success(t('profile.locationUpdateSuccess'));
      
    } catch (err) {
      console.error('Errore durante l\'aggiornamento della posizione:', err);
      toast.error(t('profile.locationUpdateError'));
    }
  };

  return (
    <Container fluid className={styles.profilePage}>
      <div className={styles.header}>
        <BackButton className={styles.smallBackButton} />
      </div>

      <div className={styles.content}>
        <ProfileHeader 
          profile={profileData} 
          onUpdateImage={handleImageUpdate}
        />
        
        <PersonalInfo 
          profileData={profileData} 
          onUpdate={handleProfileUpdate}
          isUpdating={isUpdating}
        />
        
        <InterestsSection 
          profileData={profileData} 
          onUpdate={handleProfileUpdate}
          isUpdating={isUpdating}
        />
        
        <LanguagesSection 
          profileData={profileData} 
          onUpdate={handleProfileUpdate}
          isUpdating={isUpdating}
        />
        
        <ProfileSettings 
          profileData={profileData}
          onUpdate={handleProfileUpdate}
          onLogout={logout}
          onDeleteAccount={deleteAccount}
        />
      </div>
    </Container>
  );
};

export default ProfilePage;