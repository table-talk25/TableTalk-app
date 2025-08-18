// File: FRONTEND/client/src/components/Map/PlacesAutocompleteInput.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
// import { GoogleMap } from '@capacitor/google-maps'; // DISABILITATO TEMPORANEAMENTE

const PlacesAutocompleteInput = ({ value, onChange, placeholder, className = '', disabled = false }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // DISABILITATO TEMPORANEAMENTE - Google Places non configurato
  useEffect(() => {
    console.log('[PlacesAutocompleteInput] Google Places disabilitato temporaneamente - API key non configurata');
    setError('Google Places temporaneamente non disponibile. Richiede configurazione API key.');
  }, []);

  // Codice originale commentato temporaneamente
  /*
  const apiKey = useMemo(() => process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '', []);

  useEffect(() => {
    setQuery(value?.address || '');
  }, [value?.address]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!apiKey) {
          console.warn('[PlacesAutocompleteInput] API key non configurata');
          return;
        }

        // Carica Google Places API
        if (!window.google || !window.google.maps || !window.google.maps.places) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          
          script.onload = () => {
            if (mounted) {
              console.log('[PlacesAutocompleteInput] Google Places API caricata');
            }
          };
          
          script.onerror = () => {
            if (mounted) {
              setError('Errore nel caricamento di Google Places API');
            }
          };
          
          document.head.appendChild(script);
        }
      } catch (error) {
        if (mounted) {
          console.error('[PlacesAutocompleteInput] Errore nell\'inizializzazione:', error);
          setError(error.message);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [apiKey]);

  const searchPlaces = async (searchQuery) => {
    if (!searchQuery.trim() || !window.google?.maps?.places) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const service = new window.google.maps.places.AutocompleteService();
      
      const request = {
        input: searchQuery,
        componentRestrictions: { country: 'it' },
        types: ['geocode', 'establishment']
      };

      service.getPlacePredictions(request, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
        setIsLoading(false);
      });

    } catch (error) {
      console.error('[PlacesAutocompleteInput] Errore nella ricerca:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowSuggestions(true);
    
    if (newQuery.trim()) {
      searchPlaces(newQuery);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    try {
      setQuery(suggestion.description);
      setShowSuggestions(false);
      setSuggestions([]);
      
      // Ottieni i dettagli del luogo
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      
      service.getDetails(
        { placeId: suggestion.place_id, fields: ['geometry', 'formatted_address'] },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const location = {
              coordinates: [place.geometry.location.lng(), place.geometry.location.lat()],
              address: place.formatted_address
            };
            onChange(location);
          }
        }
      );
      
    } catch (error) {
      console.error('[PlacesAutocompleteInput] Errore nella selezione:', error);
      setError(error.message);
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Ritarda la chiusura per permettere il click sui suggerimenti
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };
  */

  // Render del fallback
  if (error) {
    return (
      <div className={`places-autocomplete ${className}`}>
        <div className="alert alert-warning" role="alert">
          <h6>🔍 Ricerca Luoghi Temporaneamente Non Disponibile</h6>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            <strong>Indirizzo inserito:</strong> {value?.address || 'Nessuno'}<br />
            <strong>Coordinate:</strong> {value?.coordinates ? `${value.coordinates[1].toFixed(6)}, ${value.coordinates[0].toFixed(6)}` : 'Nessuna'}
          </p>
          <p className="mt-2 small text-muted">
            Per abilitare la ricerca luoghi automatica, configura la chiave API di Google Maps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`places-autocomplete ${className}`}>
      <div className="input-group">
        <input
          ref={inputRef}
          type="text"
          className="form-control"
          placeholder={placeholder || "Inserisci un indirizzo..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {}}
          onBlur={() => {}}
          disabled={disabled || true} // Disabilitato temporaneamente
        />
        {isLoading && (
          <span className="input-group-text">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Caricamento...</span>
            </div>
          </span>
        )}
      </div>
      
      <div className="mt-2">
        <div className="alert alert-info" role="alert">
          <h6>🔍 Ricerca Luoghi Temporaneamente Non Disponibile</h6>
          <p>Google Places richiede configurazione API key</p>
          <div className="mt-2">
            <strong>Indirizzo inserito:</strong> {value?.address || 'Nessuno'}<br />
            <strong>Coordinate:</strong> {value?.coordinates ? `${value.coordinates[1].toFixed(6)}, ${value.coordinates[0].toFixed(6)}` : 'Nessuna'}
          </div>
          <p className="mt-2 small text-muted">
            Per abilitare la ricerca luoghi automatica, configura la chiave API di Google Maps.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlacesAutocompleteInput;


