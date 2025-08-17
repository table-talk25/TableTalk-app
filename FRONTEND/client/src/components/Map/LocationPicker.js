import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { GoogleMap } from '@capacitor/google-maps';
import { Spinner, Alert, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

// Funzione per fare il geocoding inverso (da coordinate a indirizzo)
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

const LocationPicker = ({ onLocationSelect, initialCenter, currentLocation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const onSelectRef = useRef(onLocationSelect);
  const [userPosition, setUserPosition] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getUserLocation = async () => {
      if (!Capacitor.isNativePlatform()) {
        // Su web, usa l'API del browser
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserPosition({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            },
            (error) => {
              console.log('Errore geolocalizzazione web:', error);
              // Non blocchiamo il caricamento se la geolocalizzazione fallisce
            }
          );
        }
      } else {
        // Su mobile, usa Capacitor
        try {
          const position = await Geolocation.getCurrentPosition();
          setUserPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        } catch (error) {
          console.log('Errore geolocalizzazione mobile:', error);
          // Non blocchiamo il caricamento se la geolocalizzazione fallisce
        }
      }
    };

    getUserLocation();
  }, []);

  useEffect(() => {
    onSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    const createMap = async () => {
      try {
        setError('');

        // Se la mappa esiste già, aggiorna solo la camera senza mostrare loading
        if (map) {
          const center = initialCenter || userPosition || { lat: 41.9028, lng: 12.4964 };
          await map.setCamera({ coordinate: center, zoom: 13 });
          return;
        }

        // Se il ref non è ancora montato, esci senza attivare loading
        if (!mapRef.current) {
          return;
        }

        setLoading(true);

        const runtimeApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        // Crea la mappa
        const newMap = await GoogleMap.create({
          id: 'location-picker-map',
          element: mapRef.current,
          ...(runtimeApiKey ? { apiKey: runtimeApiKey } : {}),
          config: {
            center: initialCenter || userPosition || { lat: 41.9028, lng: 12.4964 }, // Roma di default
            zoom: 13
          }
        });

        setMap(newMap);

        // Aggiungi listener per i click sulla mappa
        newMap.setOnMapClickListener(async (event) => {
          const clickedPosition = event.coordinate;
          
          // Rimuovi il marker precedente se esiste
          try {
            await newMap.removeMarker('selected-location');
          } catch (e) {
            // Marker non esiste, continua
          }

          // Aggiungi il nuovo marker
          await newMap.addMarker({
            id: 'selected-location',
            coordinate: clickedPosition,
            title: t('map.selectedLocation'),
            iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          });

          // Fai il geocoding inverso per ottenere l'indirizzo
          const address = await reverseGeocode(clickedPosition.lat, clickedPosition.lng);
          
          // Crea l'oggetto location completo, preservando l'indirizzo esistente se disponibile
          const locationData = {
            coordinates: [clickedPosition.lng, clickedPosition.lat],
            address: address || currentLocation?.address || `${clickedPosition.lat.toFixed(6)}, ${clickedPosition.lng.toFixed(6)}`
          };
          
          setSelectedLocation(locationData);
          if (onSelectRef.current) onSelectRef.current(locationData);
        });

      } catch (error) {
        console.error('Errore creazione mappa:', error);
        setError(t('map.loadError'));
      } finally {
        setLoading(false);
      }
    };

    createMap();

    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, [userPosition, initialCenter]);

  const handleUseCurrentLocation = async () => {
    if (!map || !userPosition) return;
    
    try {
      // Rimuovi il marker precedente se esiste
      try {
        await map.removeMarker('selected-location');
      } catch (e) {
        // Marker non esiste, continua
      }

      // Aggiungi il marker per la posizione corrente
      await map.addMarker({
        id: 'selected-location',
        coordinate: userPosition,
        title: t('map.selectedLocation'),
        iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
      });

      // Centra la mappa sulla posizione corrente
      await map.setCamera({
        coordinate: userPosition,
        zoom: 15
      });

      // Fai il geocoding inverso per ottenere l'indirizzo della posizione corrente
      const address = await reverseGeocode(userPosition.lat, userPosition.lng);
      
      const locationData = {
        coordinates: [userPosition.lng, userPosition.lat],
        address: address || currentLocation?.address || t('map.currentLocation')
      };
      setSelectedLocation(locationData);
      if (onSelectRef.current) onSelectRef.current(locationData);
    } catch (error) {
      console.error('Errore nell\'uso della posizione corrente:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner animation="border" />
        <span className="ms-2">{t('map.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Alert variant="warning">
          {error}
        </Alert>
        <Button onClick={() => window.location.reload()} className="mt-2">
          {t('map.retryButton')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={handleUseCurrentLocation}
          disabled={!userPosition}
        >
          📍 {t('map.useMyLocation')}
        </Button>
        <small className="text-muted ms-2">
          {t('map.clickToSelect')}
        </small>
      </div>
      
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '300px', 
          border: '2px solid #e9ecef',
          borderRadius: '8px'
        }} 
      />
    </div>
  );
};

export default LocationPicker; 