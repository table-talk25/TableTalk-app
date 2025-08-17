import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import { toast } from 'react-toastify';

import PublicProfileDetail from './PublicProfileDetail';
import InviteForm from './InviteForm';
import { sendInvitation } from '../../services/invitationService';

const MapView = ({ userPosition, nearbyUsers, nearbyMeals = [] }) => {
  const mapRef = useRef(null);
  const [fallbackUrl, setFallbackUrl] = useState(null);
  const fallbackToastShown = useRef(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [panelView, setPanelView] = useState('profile');

  useEffect(() => {
    let map = null;

    const createMap = async () => {
      try {
        console.log('🗺️ [MapView] Iniziando creazione mappa...');
        console.log('📍 [MapView] Posizione utente:', userPosition);
        console.log('👥 [MapView] Utenti nelle vicinanze:', nearbyUsers.length);
        console.log('🍽️ [MapView] TableTalk® nelle vicinanze:', nearbyMeals.length);
        
        const lat = (userPosition && (userPosition.latitude ?? userPosition.lat));
        const lng = (userPosition && (userPosition.longitude ?? userPosition.lng));
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

        map.setOnMapClickListener(() => {
            console.log('Click sulla mappa, nascondo il pannello.');
            setSelectedUser(null);
            setSelectedMeal(null);
        });

      } catch (error) {
        console.error('❌ [MapView] Errore creazione mappa:', error);
        console.error('❌ [MapView] Dettagli errore:', {
          message: error.message,
          stack: error.stack,
          userPosition,
          nearbyUsersCount: nearbyUsers.length,
          nearbyMealsCount: nearbyMeals.length
        });
        // Fallback: mappa web embedded senza chiave (degradata ma visibile)
        const flat = (userPosition && (userPosition.latitude ?? userPosition.lat));
        const flng = (userPosition && (userPosition.longitude ?? userPosition.lng));
        if (typeof flat === 'number' && typeof flng === 'number') {
          setFallbackUrl(`https://maps.google.com/maps?q=${flat},${flng}&z=13&output=embed`);
        }
        if (!fallbackToastShown.current) {
          fallbackToastShown.current = true;
          toast.info('Modalità mappa alternativa attiva.');
        }
      }
    };

    if (userPosition && mapRef.current) {
        createMap();
    }

    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, [userPosition, nearbyUsers, nearbyMeals]);

  const handleClosePanel = () => {
    setSelectedUser(null);
    setSelectedMeal(null);
  };

  const handleShowInviteForm = () => setPanelView('invite');
  const handleBackToProfile = () => setPanelView('profile');

  const handleSendInvitation = async (message) => {
    if (!selectedUser) return;
    try {
      await sendInvitation(selectedUser._id, message);
      toast.success('Invito inviato con successo!');
      handleClosePanel();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore nell\'invio dell\'invito.');
    }
  };

  const renderPanelContent = () => {
    if (selectedUser) {
      switch (panelView) {
        case 'profile':
          return <PublicProfileDetail user={selectedUser} onInvite={handleShowInviteForm} onBack={handleClosePanel} />;
        case 'invite':
          return <InviteForm recipient={selectedUser} onSend={handleSendInvitation} onBack={handleBackToProfile} />;
        default:
          return null;
      }
    }
    
    if (selectedMeal) {
      return (
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4>🍽️ {selectedMeal.title}</h4>
            <button 
              onClick={handleClosePanel}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '20px', 
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>📍 Posizione:</strong> {typeof selectedMeal.location === 'string' ? selectedMeal.location : (selectedMeal.location?.address || `${selectedMeal.location?.coordinates?.[1]}, ${selectedMeal.location?.coordinates?.[0]}`)}
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>👤 Organizzatore:</strong> {selectedMeal.host.nickname}
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>📅 Data:</strong> {new Date(selectedMeal.date).toLocaleString('it-IT')}
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>👥 Partecipanti:</strong> {selectedMeal.participants?.length || 0}/{selectedMeal.maxParticipants}
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>💬 Descrizione:</strong> {selectedMeal.description}
          </div>
          
          <button 
            onClick={() => window.location.href = `/meals/${selectedMeal._id}`}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Vai al Dettaglio
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      {fallbackUrl ? (
        <iframe
          title="Mappa"
          src={fallbackUrl}
          style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <capacitor-google-map ref={mapRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      )}

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        maxHeight: '80vh',
        overflowY: 'auto',
        transform: (selectedUser || selectedMeal) ? 'translateY(0%)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-in-out',
        padding: '20px',
      }}>
        {renderPanelContent()}
      </div>
    </div>
  );
};

export default MapView;