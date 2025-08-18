import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
// import { GoogleMap } from '@capacitor/google-maps'; // DISABILITATO TEMPORANEAMENTE

const LocationPicker = ({ value, onChange, onLocationSelect, initialCenter = null, currentLocation = null }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [map, setMap] = useState(null);
  const mapRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // DISABILITATO TEMPORANEAMENTE - Google Maps non configurato
  useEffect(() => {
    console.log('[LocationPicker] Google Maps disabilitato temporaneamente - API key non configurata');
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
        let center = initialCenter || currentLocation || { coordinates: [12.4964, 41.9028] }; // Default: Roma
        
        const newMap = await GoogleMap.create({
          id: 'location-picker-map',
          element: mapRef.current,
          ...(runtimeApiKey ? { apiKey: runtimeApiKey } : {}),
          config: {
            center: center.coordinates ? { lat: center.coordinates[1], lng: center.coordinates[0] } : center,
            zoom: 13,
          },
        });

        setMap(newMap);

        // Gestione click sulla mappa
        newMap.setOnMapClickListener(async (event) => {
          const { lat, lng } = event.coordinate;
          
          try {
            // Geocoding inverso per ottenere l'indirizzo
            const address = await reverseGeocode(lat, lng);
            
            const location = {
              coordinates: [lng, lat],
              address: address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            };
            
            setSelectedLocation(location);
            onChange(location);
            onLocationSelect?.(location);
            
          } catch (error) {
            console.error('Errore nel geocoding inverso:', error);
            // Fallback con coordinate
            const location = {
              coordinates: [lng, lat],
              address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            };
            
            setSelectedLocation(location);
            onChange(location);
            onLocationSelect?.(location);
          }
        });

        setIsLoading(false);
        
      } catch (error) {
        console.error('Errore nell\'inizializzazione della mappa:', error);
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
  }, [initialCenter, currentLocation]);
  */

  // Funzione di geocoding inverso (commentata temporaneamente)
  /*
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&language=it`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return null;
    } catch (error) {
      console.error('Errore nel geocoding inverso:', error);
      return null;
    }
  };
  */

  // Render del fallback
  if (isLoading) {
    return (
      <div className="location-picker" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
          <p className="mt-2">Caricamento selettore posizione...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="location-picker" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="alert alert-warning" role="alert">
            <h5>📍 Selettore Posizione Temporaneamente Non Disponibile</h5>
            <p>{error}</p>
            <hr />
            <p className="mb-0">
              <strong>Posizione selezionata:</strong> {value?.address || 'Nessuna'}<br />
              <strong>Coordinate:</strong> {value?.coordinates ? `${value.coordinates[1].toFixed(6)}, ${value.coordinates[0].toFixed(6)}` : 'Nessuna'}
            </p>
            <p className="mt-2 small text-muted">
              Per abilitare la selezione posizione interattiva, configura la chiave API di Google Maps.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="location-picker">
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
          <h5>📍 Selettore Posizione Temporaneamente Non Disponibile</h5>
          <p>Google Maps richiede configurazione API key</p>
          <div className="mt-3">
            <strong>Posizione selezionata:</strong> {value?.address || 'Nessuna'}<br />
            <strong>Coordinate:</strong> {value?.coordinates ? `${value.coordinates[1].toFixed(6)}, ${value.coordinates[0].toFixed(6)}` : 'Nessuna'}
          </div>
          <p className="mt-2 small text-muted">
            Per abilitare la selezione posizione interattiva, configura la chiave API di Google Maps.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker; 