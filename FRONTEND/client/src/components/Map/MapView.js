import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import { toast } from 'react-toastify';

import PublicProfileDetail from './PublicProfileDetail';
import InviteForm from './InviteForm';
import { sendInvitation } from '../../services/invitationService';

const MapView = ({ userPosition, nearbyUsers }) => {
  const mapRef = useRef(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [panelView, setPanelView] = useState('profile');

  useEffect(() => {
    let map = null;

    const createMap = async () => {
      try {
        map = await GoogleMap.create({
          id: 'my-map',
          element: mapRef.current,
          apiKey: 'AIzaSyBffwVOLM6qWg0Nphy9uEMR8AeqJ8hzizQ', // <-- la tua chiave qui
          config: {
            center: { lat: userPosition.lat, lng: userPosition.lng },
            zoom: 13,
          },
        });

        await map.addMarker({ id: 'user-current', coordinate: { lat: userPosition.lat, lng: userPosition.lng }, title: 'Sei qui', iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' });
        const userMarkers = nearbyUsers.map(user => ({
          id: `user-${user._id}`,
          coordinate: { lat: user.location.coordinates[1], lng: user.location.coordinates[0] },
        }));
        await map.addMarkers(userMarkers);

        // --- INIZIO SEZIONE DI DIAGNOSI ---
        map.setOnMarkerClickListener(async (marker) => {
          console.log('--- Marker Cliccato! ---');
          console.log('Oggetto marker completo:', marker);

          // Controllo di sicurezza
          if (marker && marker.markerId) {
            if (marker.markerId.startsWith('user-') && marker.markerId !== 'user-current') {            console.log('Marker non valido o senza ID');
            return;
          }

          console.log('ID del marker:', marker.markerId);

          // Usiamo il title per ottenere l'ID dell'utente
          const userId = marker.markerId.replace('user-', '');
          
            console.log('ID utente estratto:', userId);
            const user = nearbyUsers.find(u => u._id === userId);
            
            if (user) {
              console.log('Utente trovato:', user.nickname);
              setSelectedUser(user);
              setPanelView('profile');
            } else {
              console.error('ERRORE: Utente non trovato nell\'array nearbyUsers per l\'ID:', userId);
            }
          } else {
            console.log('Marker dell\'utente corrente o non valido cliccato. Nessuna azione.');
          }
        });
        // --- FINE SEZIONE DI DIAGNOSI ---

        map.setOnMapClickListener(() => {
            console.log('Click sulla mappa, nascondo il pannello.');
            setSelectedUser(null);
        });

      } catch (error) {
        console.error('Errore creazione mappa:', error);
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
  }, [userPosition, nearbyUsers]);

  // Il resto del file rimane invariato...
  const handleClosePanel = () => {
    setSelectedUser(null);
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
    if (!selectedUser) return null;

    switch (panelView) {
      case 'profile':
        return <PublicProfileDetail user={selectedUser} onInvite={handleShowInviteForm} onBack={handleClosePanel} />;
      case 'invite':
        return <InviteForm recipient={selectedUser} onSend={handleSendInvitation} onBack={handleBackToProfile} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      <capacitor-google-map ref={mapRef} style={{ display: 'block', width: '100%', height: '100%' }} />

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
        transform: selectedUser ? 'translateY(0%)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-in-out',
        padding: '20px',
      }}>
        {renderPanelContent()}
      </div>
    </div>
  );
};

export default MapView;