// File: /src/pages/Profile/index.js (Versione Unificata e Corretta)

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Alert, Spinner } from 'react-bootstrap';
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

import styles from './ProfilePage.module.css'; // Useremo lo stile della pagina profilo
import welcomeStyles from './ProfileWelcomeComponent.module.css'; // E lo stile del benvenuto che abbiamo creato

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
            <div className={welcomeStyles.welcomePage}>
                <div className={welcomeStyles.header}>
                    <h1 className={welcomeStyles.title}>Un ultimo passo!</h1>
                    <p className={welcomeStyles.subtitle}>
                        Completa il tuo profilo per rendere la tua esperienza su TableTalk unica.
                    </p>
                </div>

                <div className={welcomeStyles.benefitsGrid}>
                    <div className={welcomeStyles.benefitCard}>
                        <FaUsers className={welcomeStyles.icon} size={40} />
                        <h3 className={welcomeStyles.cardTitle}>Trova le Persone Giuste</h3>
                        <p className={welcomeStyles.cardText}>
                            Aggiungendo i tuoi interessi, ti aiuteremo a trovare pasti con persone simili a te.
                        </p>
                    </div>
                    <div className={welcomeStyles.benefitCard}>
                        <FaRegSmile className={welcomeStyles.icon} size={40} />
                        <h3 className={welcomeStyles.cardTitle}>Fai una Bella Impressione</h3>
                        <p className={welcomeStyles.cardText}>
                            Una bio e una foto profilo aiutano gli altri a conoscerti meglio prima di un pasto.
                        </p>
                    </div>
                    <div className={welcomeStyles.benefitCard}>
                        <FaCheckCircle className={welcomeStyles.icon} size={40} />
                        <h3 className={welcomeStyles.cardTitle}>Ottieni Più Inviti</h3>
                        <p className={welcomeStyles.cardText}>
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