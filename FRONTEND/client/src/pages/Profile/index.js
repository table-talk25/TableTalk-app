// File: /src/pages/Profile/index.js (Versione Unificata e Corretta)

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Alert, Spinner, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { FaUsers, FaRegSmile, FaCheckCircle } from 'react-icons/fa';

import { useAuth } from '../../contexts/AuthContext';
import profileService from '../../services/profileService';

import ProfileHeader from '../../components/profile/ProfileHeader';
import PersonalInfo from '../../components/profile/PersonalInfo';
import InterestsSection from '../../components/profile/InterestsSection';
import LanguagesSection from '../../components/profile/LanguagesSection';
import ProfileSettings from '../../components/profile/ProfileSettings';
import BackButton from '../../components/common/BackButton';

import styles from './ProfilePage.module.css'; // Useremo solo lo stile della pagina profilo

const ProfilePage = () => {
    const { t } = useTranslation();
    const { user, updateUser, loading: authLoading, logout, deleteAccount } = useAuth();
    
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState('');

    const loadProfile = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await profileService.getProfile();
            setProfileData(data);
            // Aggiorna anche lo stato globale
            updateUser(data);
        } catch (err) {
            setError(t('profile.loadError'));
        } finally {
            setLoading(false);
        }
    }, [user?.id, t]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleProfileUpdate = async (updatedData) => {
        setIsUpdating(true);
        try {
            const freshProfile = await profileService.updateProfile(updatedData);
            setProfileData(freshProfile);
            updateUser(freshProfile); // Aggiorna il context
            toast.success(t('profile.updateSuccess'));

            // Se il profilo era incompleto, ora è completo!
            if (!user.profileCompleted) {
                // Potresti mostrare un messaggio di successo e reindirizzare
            }
        } catch (err) {
            toast.error(err.response?.data?.message || t('profile.updateError'));
        } finally {
            setIsUpdating(false);
        }
    };

    // --- LOGICA DI RENDER PRINCIPALE ---

    if (authLoading || loading) {
        return <Spinner fullscreen label={t('common.loadingProfile') || 'Caricamento profilo...'} />;
    }

    if (error) {
        return <Container><Alert variant="danger">{error}</Alert></Container>;
    }

    // SCENARIO 1: L'utente è loggato ma il profilo NON è completo
    if (user && !user.profileCompleted) {
        return (
            <div className={styles.welcomePage}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Un ultimo passo!</h1>
                    <p className={styles.subtitle}>
                        Completa il tuo profilo per rendere la tua esperienza su TableTalk unica.
                    </p>
                </div>

                <div className={styles.benefitsGrid}>
                    <div className={styles.benefitCard}>
                        <FaUsers className={styles.icon} size={40} />
                        <h3 className={styles.cardTitle}>Trova le Persone Giuste</h3>
                        <p className={styles.cardText}>
                            Aggiungendo i tuoi interessi, ti aiuteremo a trovare pasti con persone simili a te.
                        </p>
                    </div>
                    <div className={styles.benefitCard}>
                        <FaRegSmile className={styles.icon} size={40} />
                        <h3 className={styles.cardTitle}>Fai una Bella Impressione</h3>
                        <p className={styles.cardText}>
                            Una bio e una foto profilo aiutano gli altri a conoscerti meglio prima di un pasto.
                        </p>
                    </div>
                    <div className={styles.benefitCard}>
                        <FaCheckCircle className={styles.icon} size={40} />
                        <h3 className={styles.cardTitle}>Ottieni Più Inviti</h3>
                        <p className={styles.cardText}>
                            I profili completi hanno il 75% in più di probabilità di essere invitati a pasti esclusivi.
                        </p>
                    </div>
                </div>

                {/* Mostriamo direttamente il form di modifica sotto! */}
                <div className={styles.profilePage} style={{ paddingTop: '2rem' }}>
                    <div className={styles.content}>
                        <PersonalInfo profileData={user} onUpdate={handleProfileUpdate} isUpdating={isUpdating} />
                        <InterestsSection profileData={user} onUpdate={handleProfileUpdate} isUpdating={isUpdating} />
                    </div>
                </div>
            </div>
        );
    }
    
    // SCENARIO 2: Il profilo è completo, mostra la pagina di modifica standard
    return (
        <Container fluid className={styles.profilePage}>
            <div className={styles.header}>
                <BackButton className={styles.smallBackButton} />
            </div>
            <div className={styles.content}>
                <ProfileHeader profile={profileData} onUpdateImage={() => {}} />
                <PersonalInfo profileData={profileData} onUpdate={handleProfileUpdate} isUpdating={isUpdating} />
                <InterestsSection profileData={profileData} onUpdate={handleProfileUpdate} isUpdating={isUpdating} />
                <LanguagesSection profileData={profileData} onUpdate={handleProfileUpdate} isUpdating={isUpdating} />
                <ProfileSettings profileData={profileData} onUpdate={handleProfileUpdate} onLogout={logout} onDeleteAccount={deleteAccount} />
            </div>
        </Container>
    );
};

export default ProfilePage;