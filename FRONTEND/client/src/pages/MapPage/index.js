// File: src/pages/MapPage/index.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MapView from '../../components/Map/MapView';
import profileService from '../../services/profileService';
import mealService from '../../services/mealService';
import { useAuth } from '../../contexts/AuthContext';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import BackButton from '../../components/common/BackButton';
import { Button, Alert, Spinner } from 'react-bootstrap';
import styles from './MapPage.module.css';

const MapPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [currentUserPosition, setCurrentUserPosition] = useState(null);
    const [nearbyUsers, setNearbyUsers] = useState([]);
    const [nearbyMeals, setNearbyMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [permissionStatus, setPermissionStatus] = useState('unknown'); // 'unknown', 'granted', 'denied', 'prompt'

    // Funzione per rimuovere la posizione quando l'app si chiude
    const removeLocationOnAppClose = async () => {
        try {
            // Rimuove la posizione solo se l'utente ha impostato "solo quando uso l'app"
            if (user?.settings?.privacy?.showLocationOnMap === false) {
                await profileService.removeUserLocation();
                console.log('[MapPage] Posizione rimossa al chiudere l\'app');
            }
        } catch (err) {
            console.error('[MapPage] Errore nel rimuovere la posizione:', err);
        }
    };

    // Listener per quando l'app si chiude
    useEffect(() => {
        const handleBeforeUnload = () => {
            removeLocationOnAppClose();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                removeLocationOnAppClose();
            }
        };

        // Aggiungi i listener
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user]);

            // Funzione per ottenere i TableTalk® fisici nelle vicinanze
    const fetchNearbyMeals = async (coords) => {
        try {
            console.log('🍽️ [MapPage] Cerco TableTalk® fisici nelle vicinanze...');
            console.log('📍 [MapPage] Coordinate:', coords);

            const mealsResp = await mealService.getMeals({
                near: `${coords.latitude},${coords.longitude}`,
                mealType: 'physical',
                status: 'upcoming,ongoing'
            });

            const meals = Array.isArray(mealsResp) ? mealsResp : (Array.isArray(mealsResp?.data) ? mealsResp.data : []);

            console.log('🔍 [MapPage] Meals ricevuti:', meals);
            const validMeals = meals.filter(meal => meal && meal._id && meal.location && meal.location.coordinates);
            console.log(`[MapPage] Trovati ${validMeals.length} TableTalk® fisici nelle vicinanze.`);
            setNearbyMeals(validMeals);
        } catch (error) {
            console.error('[MapPage] Errore nel caricamento TableTalk®:', error);
            setNearbyMeals([]);
        }
    };

    // Funzione per controllare lo stato dei permessi
    const checkPermissionStatus = async () => {
        try {
            if (Capacitor.isNativePlatform()) {
                // Su piattaforma nativa, usa Capacitor per controllare i permessi
                const permissions = await Geolocation.checkPermissions();
                console.log('[MapPage] Stato permessi nativi:', permissions.location);
                return permissions.location;
            } else {
                // Su browser, controlla se l'API è disponibile
                if (!navigator.geolocation) {
                    throw new Error('Geolocalizzazione non supportata dal browser');
                }
                
                // Su browser, i permessi vengono richiesti automaticamente
                // quando si chiama getCurrentPosition
                return 'prompt';
            }
        } catch (err) {
            console.error('[MapPage] Errore nel controllare i permessi:', err);
            return 'denied';
        }
    };

    // Funzione per richiedere i permessi di localizzazione
    const requestLocationPermission = async () => {
        try {
            if (Capacitor.isNativePlatform()) {
                const permissions = await Geolocation.requestPermissions();
                console.log('[MapPage] Permessi richiesti:', permissions.location);
                return permissions.location;
            } else {
                // Su browser, i permessi vengono richiesti automaticamente
                // quando si chiama getCurrentPosition
                return 'prompt';
            }
        } catch (err) {
            console.error('[MapPage] Errore nella richiesta permessi:', err);
            return 'denied';
        }
    };

    const DEFAULT_CENTER = { latitude: 41.9028, longitude: 12.4964 }; // Roma
    const GEO_TIMEOUT_MS = 8000;

    // Funzione per ottenere la posizione corrente
    const getCurrentPosition = async () => {
        try {
            if (Capacitor.isNativePlatform()) {
                const position = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: GEO_TIMEOUT_MS,
                    maximumAge: 60000
                });
                return {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
            } else {
                // Su browser, usa l'API standard
                return new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            resolve({
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude
                            });
                        },
                        (error) => {
                            reject(new Error(t('map.locationError')));
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: GEO_TIMEOUT_MS,
                            maximumAge: 60000
                        }
                    );
                });
            }
        } catch (err) {
            console.error('[MapPage] Errore nell\'ottenere la posizione:', err);
            throw err;
        }
    };

    // Funzione per inizializzare la localizzazione
    const initializeLocation = async () => {
        try {
            setLoading(true);
            setError('');

            // 1. Controlla lo stato dei permessi
            const permissionStatus = await checkPermissionStatus();
            setPermissionStatus(permissionStatus);

            if (permissionStatus === 'denied') {
                setError(t('map.permissionDenied'));
                setLoading(false);
                return;
            }

            // 2. Se i permessi non sono ancora stati concessi, richiedili
            if (permissionStatus === 'prompt') {
                const newPermissionStatus = await requestLocationPermission();
                setPermissionStatus(newPermissionStatus);
                
                if (newPermissionStatus === 'denied') {
                    setError(t('map.permissionDenied'));
                    setLoading(false);
                    return;
                }
            }

            // 3. Ottieni la posizione corrente
            const position = await getCurrentPosition();
            setCurrentUserPosition(position);

            // 4. Aggiorna la posizione dell'utente nel backend
            try {
                await profileService.updateLocationFromCoords(position);
                console.log('[MapPage] Posizione aggiornata nel backend');
            } catch (err) {
                console.error('[MapPage] Errore nell\'aggiornamento posizione backend:', err);
                // Non blocchiamo l'app se l'aggiornamento fallisce
            }

            // 5. Carica utenti e TableTalk® nelle vicinanze
            await Promise.all([
                fetchNearbyUsers(position),
                fetchNearbyMeals(position)
            ]);

        } catch (err) {
            console.error('[MapPage] Errore nell\'inizializzazione:', err);
            // Fallback rapido: niente alert invasivo, centro su default e mostro mappa
            setError('');
            setCurrentUserPosition(DEFAULT_CENTER);
            try {
                await Promise.all([
                  fetchNearbyUsers(DEFAULT_CENTER),
                  fetchNearbyMeals(DEFAULT_CENTER)
                ]);
            } catch (_) {}
        } finally {
            setLoading(false);
        }
    };

    // Funzione per caricare utenti nelle vicinanze
    const fetchNearbyUsers = async (coords) => {
        try {
            console.log('👥 [MapPage] Cerco utenti nelle vicinanze...');
            console.log('📍 [MapPage] Coordinate:', coords);
            
            const data = await profileService.getNearbyUsers({
                latitude: coords.latitude,
                longitude: coords.longitude,
                radius: 50 // 50 km di raggio
            });
            
            console.log(`[MapPage] Trovati ${data.length} utenti nelle vicinanze.`);
            setNearbyUsers(data);
        } catch (err) {
            console.error('[MapPage] Errore nel caricamento utenti:', err);
            setNearbyUsers([]);
        }
    };

    // Inizializza la localizzazione quando il componente si monta
    useEffect(() => {
        initializeLocation();
    }, []);

    const handleRetry = () => {
        initializeLocation();
    };

    if (loading) {
        return (
            <div className={styles.container}>
              <div className={styles.topBar}>
                <BackButton className={styles.backButton} />
              </div>
              <div className={styles.header}>
                <div className={styles.titleWrap}>
                  <h1 className={styles.title}>{t('map.title')}</h1>
                  <p className={styles.subtitle}>{t('map.subtitle')}</p>
                </div>
              </div>
              <div className="d-flex justify-content-center align-items-center" style={{ flex: 1 }}>
                <Spinner animation="border" />
              </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-5">
                <Alert variant="danger">
                    <h4>{t('map.errorTitle')}</h4>
                    <p>{error}</p>
                    <Button onClick={handleRetry} variant="primary">
                        {t('map.retryButton')}
                    </Button>
                </Alert>
            </div>
        );
    }

    return (
      <div className={styles.container}>
        <div className={styles.topBar}>
          <BackButton className={styles.backButton} />
        </div>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <h1 className={styles.title}>{t('map.title')}</h1>
            <p className={styles.subtitle}>{t('map.subtitle')}</p>
          </div>
        </div>
        <div className={styles.mapContainer}>
          <div className={styles.badge}>{permissionStatus === 'granted' ? 'GPS attivo' : 'GPS non attivo'}</div>
          <MapView
            userPosition={currentUserPosition}
            nearbyUsers={nearbyUsers}
            nearbyMeals={nearbyMeals}
            permissionStatus={permissionStatus}
          />
          <button
            type="button"
            className={styles.fab}
            onClick={initializeLocation}
          >
            Centra mappa
          </button>
        </div>
      </div>
    );
};

export default MapPage;