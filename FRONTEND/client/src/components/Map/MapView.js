import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
// import { GoogleMap } from '@capacitor/google-maps'; // DISABILITATO TEMPORANEAMENTE

const MapView = ({ 
  nearbyUsers = [], 
  nearbyMeals = [], 
  onUserSelect, 
  onMealSelect,
  initialCenter = null,
  currentLocation = null
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [panelView, setPanelView] = useState('map');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // DISABILITATO TEMPORANEAMENTE - Google Maps non configurato
  useEffect(() => {
    console.log('[MapView] Google Maps disabilitato temporaneamente - API key non configurata');
    setIsLoading(false);
    setError('Google Maps temporaneamente non disponibile. Richiede configurazione API key.');
  }, []);

  // Codice originale commentato temporaneamente
  /*
  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Determina il centro della mappa
        let lat, lng;
        if (initialCenter?.coordinates) {
          [lng, lat] = initialCenter.coordinates;
        } else if (currentLocation?.coordinates) {
          [lng, lat] = currentLocation.coordinates;
        } else {
          // Default: Roma
          lat = 41.9028;
          lng = 12.4964;
        }

        if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
          throw new Error(`Coordinate non valide: lat=${lat}, lng=${lng}`);
        }

        const runtimeApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        map = await GoogleMap.create({
          id: 'my-map',
          element: mapRef.current,
          // La chiave API è configurata a livello nativo; se disponibile anche via env, la passiamo esplicitamente
          ...(runtimeApiKey ? { apiKey: runtimeApiKey } : {}),
          config: {
            center: { lat, lng },
            zoom: 13,
          },
        });
        
        console.log('✅ [MapView] Mappa creata con successo!');

        // Marker per la posizione dell'utente
        await map.addMarker({ 
          id: 'user-current', 
          coordinate: { lat, lng }, 
          title: 'Sei qui', 
          iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' 
        });

        // Creazione marker per utenti e pasti con indirizzi visibili
        // Il campo 'snippet' mostra l'indirizzo sotto il titolo del marker
        // Quando l'utente clicca sul marker, vede sia il titolo che l'indirizzo completo
        // Struttura location: { coordinates: [lng, lat], address: "Indirizzo completo" }

        // Marker per gli utenti nelle vicinanze (con indirizzo nel snippet)
        const userMarkers = nearbyUsers.map(user => ({
          id: `user-${user._id}`,
          coordinate: { lat: user.location.coordinates[1], lng: user.location.coordinates[0] },
          title: user.nickname,
          snippet: user.location.address || 'Indirizzo non disponibile', // Mostra l'indirizzo sotto il nome (fallback se mancante)
          iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
        }));
        await map.addMarkers(userMarkers);

        // Marker per i TableTalk® fisici nelle vicinanze (con indirizzo nel snippet)
        const mealMarkers = nearbyMeals.map(meal => ({
          id: `meal-${meal._id}`,
          coordinate: { lat: meal.location.coordinates[1], lng: meal.location.coordinates[0] },
          title: `${meal.title} - ${meal.host.nickname}`,
          snippet: meal.location.address || 'Indirizzo non disponibile', // Mostra l'indirizzo sotto il titolo (fallback se mancante)
          iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }));
        await map.addMarkers(mealMarkers);

        // Gestione click sui marker
        map.setOnMarkerClickListener(async (marker) => {
          console.log('--- Marker Cliccato! ---');
          console.log('Oggetto marker completo:', marker);

          // Controllo di sicurezza
          if (!marker || !marker.markerId) {
            console.log('Marker non valido o senza ID');
            return;
          }

          console.log('ID del marker:', marker.markerId);

          // Gestione marker utente
          if (marker.markerId.startsWith('user-') && marker.markerId !== 'user-current') {
            const userId = marker.markerId.replace('user-', '');
            console.log('ID utente estratto:', userId);
            const user = nearbyUsers.find(u => u._id === userId);
            
            if (user) {
              console.log('Utente trovato:', user.nickname);
              setSelectedUser(user);
              setSelectedMeal(null);
              setPanelView('profile');
            } else {
              console.error('ERRORE: Utente non trovato nell\'array nearbyUsers per l\'ID:', userId);
            }
          }
          // Gestione marker TableTalk®
          else if (marker.markerId.startsWith('meal-')) {
            const mealId = marker.markerId.replace('meal-', '');
            console.log('ID TableTalk® estratto:', mealId);
            const meal = nearbyMeals.find(m => m._id === mealId);
            
            if (meal) {
              console.log('TableTalk® trovato:', meal.title);
              setSelectedMeal(meal);
              setSelectedUser(null);
              setPanelView('meal');
            } else {
              console.error('ERRORE: TableTalk® non trovato nell\'array nearbyMeals per l\'ID:', mealId);
            }
          }
          // Marker dell'utente corrente
          else {
            console.log('Marker dell\'utente corrente cliccato. Nessuna azione.');
          }
        });

        setMap(map);
        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ [MapView] Errore nell\'inizializzazione della mappa:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, [initialCenter, currentLocation, nearbyUsers, nearbyMeals]);
  */

  // Render del fallback
  if (isLoading) {
    return (
      <div className="map-container" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
          <p className="mt-2">Caricamento mappa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-container" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="alert alert-warning" role="alert">
            <h5>🗺️ Mappa Temporaneamente Non Disponibile</h5>
            <p>{error}</p>
            <hr />
            <p className="mb-0">
              <strong>Utenti nelle vicinanze:</strong> {nearbyUsers.length}<br />
              <strong>TableTalk® nelle vicinanze:</strong> {nearbyMeals.length}
            </p>
            <p className="mt-2 small text-muted">
              Per abilitare Google Maps, configura la chiave API nelle variabili d'ambiente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '400px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="text-center">
          <h5>🗺️ Mappa Temporaneamente Non Disponibile</h5>
          <p>Google Maps richiede configurazione API key</p>
          <div className="mt-3">
            <strong>Utenti nelle vicinanze:</strong> {nearbyUsers.length}<br />
            <strong>TableTalk® nelle vicinanze:</strong> {nearbyMeals.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;