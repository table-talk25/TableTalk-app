import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import { Button, Alert, Spinner } from 'react-bootstrap';

const LocationPicker = ({ onLocationSelect, initialCenter }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPosition, setUserPosition] = useState(null);

  // Ottieni la posizione dell'utente
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Controlla i permessi
        const permissionStatus = await Geolocation.checkPermissions();
        if (permissionStatus.location !== 'granted') {
          const requestResult = await Geolocation.requestPermissions();
          if (requestResult.location !== 'granted') {
            throw new Error('Permessi di geolocalizzazione negati');
          }
        }

        const position = await Geolocation.getCurrentPosition();
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserPosition(userPos);
      } catch (err) {
        console.error('Errore nel ottenere la posizione:', err);
        setError('Impossibile ottenere la tua posizione. Usa la mappa per selezionare manualmente.');
        // Usa una posizione di default (Milano)
        setUserPosition({ lat: 45.4642, lng: 9.1900 });
      } finally {
        setLoading(false);
      }
    };

    getUserLocation();
  }, []);

  // Crea la mappa
  useEffect(() => {
    if (!userPosition || !mapRef.current) return;

    const createMap = async () => {
      try {
        const center = initialCenter || userPosition;
        
        const newMap = await GoogleMap.create({
          id: 'location-picker-map',
          element: mapRef.current,
          config: {
            center: center,
            zoom: 15,
          },
        });

        setMap(newMap);

        // Aggiungi marker per la posizione dell'utente
        await newMap.addMarker({
          id: 'user-current',
          coordinate: userPosition,
          title: 'La tua posizione',
          iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        });

        // Se c'è una posizione iniziale, aggiungi un marker
        if (initialCenter) {
          await newMap.addMarker({
            id: 'selected-location',
            coordinate: initialCenter,
            title: 'Posizione selezionata',
            iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          });
          setSelectedLocation({
            coordinates: [initialCenter.lng, initialCenter.lat],
            address: 'Posizione selezionata'
          });
        }

        // Gestisci il click sulla mappa
        newMap.setOnMapClickListener(async (event) => {
          const { coordinate } = event;
          
          // Rimuovi il marker precedente se esiste
          try {
            await newMap.removeMarker('selected-location');
          } catch (e) {
            // Marker non esiste, continua
          }

          // Aggiungi il nuovo marker
          await newMap.addMarker({
            id: 'selected-location',
            coordinate: coordinate,
            title: 'Posizione selezionata',
            iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          });

          // Ottieni l'indirizzo tramite reverse geocoding
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.lat},${coordinate.lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            
            if (data.results && data.results[0]) {
              const address = data.results[0].formatted_address;
              const locationData = {
                coordinates: [coordinate.lng, coordinate.lat],
                address: address
              };
              setSelectedLocation(locationData);
              onLocationSelect(locationData);
            } else {
              const locationData = {
                coordinates: [coordinate.lng, coordinate.lat],
                address: `${coordinate.lat.toFixed(6)}, ${coordinate.lng.toFixed(6)}`
              };
              setSelectedLocation(locationData);
              onLocationSelect(locationData);
            }
          } catch (error) {
            console.error('Errore nel reverse geocoding:', error);
            const locationData = {
              coordinates: [coordinate.lng, coordinate.lat],
              address: `${coordinate.lat.toFixed(6)}, ${coordinate.lng.toFixed(6)}`
            };
            setSelectedLocation(locationData);
            onLocationSelect(locationData);
          }
        });

      } catch (error) {
        console.error('Errore creazione mappa:', error);
        setError('Impossibile caricare la mappa. Riprova più tardi.');
      }
    };

    createMap();

    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, [userPosition, initialCenter, onLocationSelect]);

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
        title: 'Posizione selezionata',
        iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
      });

      // Centra la mappa sulla posizione corrente
      await map.setCamera({
        coordinate: userPosition,
        zoom: 15
      });

      const locationData = {
        coordinates: [userPosition.lng, userPosition.lat],
        address: 'La tua posizione attuale'
      };
      setSelectedLocation(locationData);
      onLocationSelect(locationData);
    } catch (error) {
      console.error('Errore nell\'uso della posizione corrente:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner animation="border" />
        <span className="ms-2">Caricamento mappa...</span>
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
          Riprova
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
          📍 Usa la mia posizione
        </Button>
        <small className="text-muted ms-2">
          Clicca sulla mappa per selezionare una posizione
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
      
      {selectedLocation && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          backgroundColor: '#e8f5e8', 
          border: '1px solid #28a745', 
          borderRadius: '6px' 
        }}>
          <strong>📍 Posizione selezionata:</strong> {selectedLocation.address}
        </div>
      )}
    </div>
  );
};

export default LocationPicker; 