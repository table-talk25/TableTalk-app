// File: FRONTEND/client/src/components/Map/PlacesAutocompleteInput.js
import React, { useEffect, useMemo, useRef, useState } from 'react';

const loadGooglePlacesScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }
    if (!apiKey) {
      reject(new Error('Google Maps API key non configurata'));
      return;
    }
    const existing = document.querySelector('script[data-tt-places="1"]');
    if (existing) {
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=it`;
    script.async = true;
    script.defer = true;
    script.dataset.ttPlaces = '1';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const PlacesAutocompleteInput = ({
  value,
  onSelect,
  onChange,
  placeholder = 'Inserisci un indirizzo',
  className,
  inputProps = {},
}) => {
  const [query, setQuery] = useState(value?.address || '');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const containerRef = useRef(null);

  const apiKey = useMemo(() => process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '', []);

  useEffect(() => {
    setQuery(value?.address || '');
  }, [value?.address]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadGooglePlacesScript(apiKey);
        if (!mounted) return;
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'));
      } catch (e) {
        setError('Autocompletamento non disponibile');
      }
    })();
    return () => { mounted = false; };
  }, [apiKey]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setPredictions([]);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    setError('');
    if (onChange) onChange(text);
    if (!autocompleteServiceRef.current || !text || text.length < 2) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    autocompleteServiceRef.current.getPlacePredictions(
      { input: text, language: 'it', types: ['geocode'] },
      (res, status) => {
        setLoading(false);
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !Array.isArray(res)) {
          setPredictions([]);
          return;
        }
        setPredictions(res.slice(0, 6));
      }
    );
  };

  const handlePick = (prediction) => {
    setPredictions([]);
    setQuery(prediction.description || '');
    if (!placesServiceRef.current) {
      onSelect && onSelect({ address: prediction.description || '', coordinates: undefined });
      return;
    }
    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ['formatted_address', 'geometry'] },
      (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) {
          onSelect && onSelect({ address: prediction.description || '', coordinates: undefined });
          return;
        }
        const address = place.formatted_address || prediction.description || '';
        const lat = place.geometry?.location?.lat?.();
        const lng = place.geometry?.location?.lng?.();
        const coordinates = (typeof lat === 'number' && typeof lng === 'number') ? [lng, lat] : undefined;
        onSelect && onSelect({ address, coordinates });
      }
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        {...inputProps}
      />
      {error && (
        <div style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{error}</div>
      )}
      {(predictions.length > 0) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
          background: '#fff', border: '1px solid #ccc', borderTop: 'none', maxHeight: 240, overflowY: 'auto'
        }}>
          {predictions.map((p) => (
            <div
              key={p.place_id}
              onClick={() => handlePick(p)}
              style={{ padding: '8px 10px', cursor: 'pointer' }}
            >
              {p.description}
            </div>
          ))}
          {loading && <div style={{ padding: 8, color: '#666' }}>Caricamento…</div>}
        </div>
      )}
    </div>
  );
};

export default PlacesAutocompleteInput;


