// File: src/pages/MapPage/index.js
import React, { useState, useEffect } from 'react';
import MapView from '../../components/Map/MapView';
import profileService from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import BackButton from '../../components/common/BackButton';

const MapPage = () => {
    const { user } = useAuth();
    const [currentUserPosition, setCurrentUserPosition] = useState(null);
    const [nearbyUsers, setNearbyUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    useEffect(() => {
        const findMyLocation = async () => {
            console.log('[MapPage] 1. Avvio findMyLocation...');
            try {
                // Controllo se siamo su piattaforma nativa
                if (Capacitor.isNativePlatform()) {
                    console.log('[MapPage] 2. Piattaforma nativa - richiedo permessi...');
                    const permissions = await Geolocation.requestPermissions();
                    console.log('[MapPage] 3. Risultato permessi:', permissions.location);

                    if (permissions.location !== 'granted') {
                        setError('Permesso di geolocalizzazione negato. Per utilizzare la mappa, abilita i permessi di localizzazione nelle impostazioni.');
                        setLoading(false);
                        return;
                    }
                }

                console.log('[MapPage] 4. Ottengo la posizione corrente...');
                
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

                console.log('[MapPage] 5. Posizione ottenuta:', position.coords);
                
                const { latitude, longitude } = position.coords;
                const pos = { lat: latitude, lng: longitude };
                
                setCurrentUserPosition(pos);

                // Aggiorna posizione nel DB se l'utente ha abilitato la condivisione
                if (user.settings?.privacy?.showLocationOnMap) {
                   console.log('[MapPage] 6. Aggiorno posizione utente nel DB...');
                   try {
                       await profileService.updateUserLocation({ latitude, longitude });
                       console.log('[MapPage] 7. Posizione utente aggiornata.');
                   } catch (updateError) {
                       console.warn('[MapPage] Errore aggiornamento posizione:', updateError);
                   }
                }

                console.log('[MapPage] 8. Cerco utenti vicini...');
                const users = await profileService.getNearbyUsers({ 
                    latitude, 
                    longitude, 
                    distance: 20000 // 20km
                });
                console.log(`[MapPage] 9. Trovati ${users.length} utenti vicini.`);
                setNearbyUsers(users);

            } catch (err) {
                console.error('[MapPage] ERRORE:', err);
                
                // Gestisci errori specifici
                if (err.message.includes('permission')) {
                    setError('Permesso di geolocalizzazione negato. Abilita i permessi di localizzazione per utilizzare la mappa.');
                } else if (err.message.includes('timeout')) {
                    setError('Timeout nel recupero della posizione. Verifica la connessione GPS.');
                } else if (err.message.includes('unavailable')) {
                    setError('Servizio di geolocalizzazione non disponibile.');
                } else {
                    setError(`Impossibile ottenere la posizione: ${err.message}`);
                }
            } finally {
                console.log('[MapPage] 10. Imposto loading a false.');
                setLoading(false);
            }
        };

        if (user) {
            findMyLocation();
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
                <div>Caricamento mappa...</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    Ottenendo la tua posizione...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                color: 'blue', 
                textAlign: 'center', 
                marginTop: '20px',
                padding: '20px',
                backgroundColor: '#ffebee',
                borderRadius: '8px',
                border: '1px solid #ffcdd2'
            }}>
                <h3>Errore Geolocalizzazione</h3>
                <p>{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '10px'
                    }}
                >
                    Riprova
                </button>
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
            <h1>Utenti Vicino a Te</h1>
            <p>Esplora chi è disponibile per un TableTalk® nei dintorni!</p>
          </div>
          
          {/* 2. Wrapper per la mappa: gli diciamo di occupare tutto lo spazio rimanente */}
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            {currentUserPosition && (
              <MapView
                userPosition={currentUserPosition}
                nearbyUsers={nearbyUsers}
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