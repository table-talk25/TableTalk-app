// File: src/pages/MapPage/index.js
import React, { useState, useEffect } from 'react';
import MapView from '../../components/Map/MapView';
import profileService from '../../services/profileService';
import mealService from '../../services/mealService';
import { useAuth } from '../../contexts/AuthContext';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import BackButton from '../../components/common/BackButton';
import { Button, Alert, Spinner } from 'react-bootstrap';

const MapPage = () => {
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
            
            // Passiamo un nuovo filtro al servizio!
            const data = await mealService.getMeals({
                near: `${coords.latitude},${coords.longitude}`,
                mealType: 'physical', // <-- AGGIUNTA FONDAMENTALE
                status: 'upcoming,ongoing'
            });
            
            // Filtra ulteriormente per sicurezza, come già fai
            const validMeals = data.filter(meal => meal.location && meal.location.coordinates);
            console.log(`[MapPage] Trovati ${validMeals.length} TableTalk® fisici nelle vicinanze.`);
            setNearbyMeals(validMeals);
        } catch (err) {
                    console.error('[MapPage] Errore nel caricamento TableTalk®:', err);
        // Non blocchiamo l'intera pagina se i TableTalk® non si caricano
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

    // Funzione per richiedere i permessi
    const requestLocationPermission = async () => {
        try {
            console.log('[MapPage] Richiesta permessi di geolocalizzazione...');
            
            if (Capacitor.isNativePlatform()) {
                // Su piattaforma nativa, richiedi esplicitamente i permessi
                const permissions = await Geolocation.requestPermissions();
                console.log('[MapPage] Risultato richiesta permessi:', permissions.location);
                return permissions.location;
            } else {
                // Su browser, i permessi vengono richiesti automaticamente
                // quando si chiama getCurrentPosition per la prima volta
                return 'prompt';
            }
        } catch (err) {
            console.error('[MapPage] Errore nella richiesta permessi:', err);
            return 'denied';
        }
    };

    // Funzione per ottenere la posizione (solo dopo aver ottenuto i permessi)
    const getCurrentPosition = async () => {
        try {
            console.log('[MapPage] Ottenimento posizione corrente...');
            
            let position;
            if (Capacitor.isNativePlatform()) {
                // Usa Capacitor Geolocation su mobile
                position = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 60000 // Cache per 1 minuto
                });
            } else {
                // Usa Web Geolocation API sul browser
                position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => resolve({
                            coords: {
                                latitude: pos.coords.latitude,
                                longitude: pos.coords.longitude
                            }
                        }),
                        (err) => reject(err),
                        {
                            enableHighAccuracy: true,
                            timeout: 15000,
                            maximumAge: 60000
                        }
                    );
                });
            }

            console.log('[MapPage] Posizione ottenuta:', position.coords);
            return position.coords;
        } catch (err) {
            console.error('[MapPage] Errore nell\'ottenimento posizione:', err);
            throw err;
        }
    };

    // Funzione principale per inizializzare la geolocalizzazione
    const initializeLocation = async () => {
        console.log('[MapPage] 1. Inizializzazione geolocalizzazione...');
        
        try {
            // 1. Controlla lo stato dei permessi
            const currentPermissionStatus = await checkPermissionStatus();
            setPermissionStatus(currentPermissionStatus);
            
            if (currentPermissionStatus === 'denied') {
                setError('Permesso di geolocalizzazione negato. Per utilizzare la mappa, abilita i permessi di localizzazione nelle impostazioni del dispositivo.');
                setLoading(false);
                return;
            }

            // 2. Se i permessi non sono ancora stati concessi, richiedili
            if (currentPermissionStatus === 'prompt' || currentPermissionStatus === 'unknown') {
                const newPermissionStatus = await requestLocationPermission();
                setPermissionStatus(newPermissionStatus);
                
                if (newPermissionStatus === 'denied') {
                    setError('Permesso di geolocalizzazione negato. Per utilizzare la mappa, abilita i permessi di localizzazione nelle impostazioni del dispositivo.');
                    setLoading(false);
                    return;
                }
            }

            // 3. Ora che abbiamo i permessi, otteniamo la posizione
            const coords = await getCurrentPosition();
            const { latitude, longitude } = coords;
            const pos = { lat: latitude, lng: longitude };
            
            setCurrentUserPosition(pos);

            // 4. Aggiorna posizione nel DB se l'utente ha abilitato la condivisione
            if (user.settings?.privacy?.showLocationOnMap) {
                console.log('[MapPage] Aggiorno posizione utente nel DB...');
                try {
                    await profileService.updateUserLocation({ latitude, longitude });
                    console.log('[MapPage] Posizione utente aggiornata.');
                } catch (updateError) {
                    console.warn('[MapPage] Errore aggiornamento posizione:', updateError);
                }
            }

            // 5. Cerca utenti vicini
            console.log('[MapPage] Cerco utenti vicini...');
            const users = await profileService.getNearbyUsers({ 
                latitude, 
                longitude, 
                distance: 20000 // 20km
            });
            console.log(`[MapPage] Trovati ${users.length} utenti vicini.`);
            setNearbyUsers(users);

            // 6. Cerca TableTalk® fisici nelle vicinanze
            await fetchNearbyMeals(coords);

        } catch (err) {
            console.error('[MapPage] ERRORE:', err);
            
            // Gestisci errori specifici
            if (err.message.includes('permission')) {
                setError('Permesso di geolocalizzazione negato. Abilita i permessi di localizzazione per utilizzare la mappa.');
            } else if (err.message.includes('timeout')) {
                setError('Timeout nel recupero della posizione. Verifica la connessione GPS e riprova.');
            } else if (err.message.includes('unavailable')) {
                setError('Servizio di geolocalizzazione non disponibile su questo dispositivo.');
            } else if (err.message.includes('not supported')) {
                setError('Geolocalizzazione non supportata dal tuo browser. Prova con un browser diverso.');
            } else {
                setError(`Impossibile ottenere la posizione: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Funzione per riprovare
    const handleRetry = () => {
        setError('');
        setLoading(true);
        setPermissionStatus('unknown');
        setNearbyMeals([]);
        initializeLocation();
    };

    useEffect(() => {
        if (user) {
            initializeLocation();
        } else {
            setError('Utente non autenticato');
            setLoading(false);
        }
    }, [user?.id]);
    
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '400px',
                flexDirection: 'column'
            }}>
                <Spinner animation="border" />
                <div style={{ marginTop: '15px' }}>
                    {permissionStatus === 'prompt' ? 'Richiesta permessi...' : 'Caricamento mappa...'}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    {permissionStatus === 'prompt' ? 'Concedi i permessi di localizzazione' : 'Ottenendo la tua posizione...'}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                padding: '20px',
                maxWidth: '500px',
                margin: '20px auto'
            }}>
                <Alert variant="danger" className="text-center">
                    <Alert.Heading>Errore Geolocalizzazione</Alert.Heading>
                    <p>{error}</p>
                    <hr />
                    <div className="d-flex justify-content-center gap-2">
                        <Button 
                            variant="primary" 
                            onClick={handleRetry}
                        >
                            Riprova
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={() => window.history.back()}
                        >
                            Torna Indietro
                        </Button>
                    </div>
                </Alert>
                <div className="text-center mt-3">
                    <BackButton />
                </div>
            </div>
        );
    }

    return (
        // 1. Contenitore principale: lo facciamo diventare alto come tutto lo schermo
        //    e usiamo flexbox per disporre gli elementi in colonna.
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh' // Occupa il 100% dell'altezza del viewport
        }}>
          <div style={{ padding: '0 20px' }}> {/* Un po' di padding per il titolo */}
                  <h1>Utenti e TableTalk® Fisici Vicino a Te</h1>
      <p>Esplora chi è disponibile per un TableTalk® nei dintorni e scopri i TableTalk® fisici in programma!</p>
          </div>
          
          {/* 2. Wrapper per la mappa: gli diciamo di occupare tutto lo spazio rimanente */}
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            {currentUserPosition && (
              <MapView
                userPosition={currentUserPosition}
                nearbyUsers={nearbyUsers}
                nearbyMeals={nearbyMeals} // Passiamo anche i TableTalk® fisici
              />
            )}
          </div>
    
          {/* Questo non è più necessario qui perché la mappa ha uno spazio definito */}
          {/* {nearbyUsers.length === 0 && ( ... )} */}
          
          <div style={{ padding: '20px' }}>
            <BackButton />
          </div>
        </div>
      );
};

export default MapPage;