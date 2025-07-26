// File: FRONTEND/client/src/pages/VideoCallPage/index.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Video from 'twilio-video';
import { useAuth } from '../../contexts/AuthContext';
import videoService from '../../services/videoService';
import { Button, Container, Spinner, Alert } from 'react-bootstrap';
import styles from './VideoCallPage.module.css';
import mealService from '../../services/mealService'; 
import { Camera } from '@capacitor/camera';
import { MediaStream } from '@capacitor/core';
import BackButton from '../../components/common/BackButton';

const VideoCallPage = () => {
    const { id: roomName } = useParams(); // L'ID del TableTalk® è il nome della nostra stanza
    const { user } = useAuth();
    const navigate = useNavigate();
    const [meal, setMeal] = useState(null); // Ci serviranno i dati del TableTalk®

    const [room, setRoom] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retrying, setRetrying] = useState(false);

    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    const connectedRoomRef = useRef(null);

    const getErrorMessage = (error) => {
        // Messaggi di errore specifici per diversi tipi di problemi
        if (error.message?.includes('permission')) {
            return 'Permessi negati. Per partecipare alla videochiamata, devi concedere l\'accesso alla fotocamera e al microfono. Ricarica la pagina e riprova.';
        }
        
        if (error.message?.includes('network') || error.message?.includes('connection')) {
            return 'Problema di connessione. Verifica la tua connessione internet e riprova.';
        }
        
        if (error.message?.includes('token') || error.message?.includes('unauthorized')) {
            return 'Errore di autenticazione. La sessione potrebbe essere scaduta. Torna alla pagina del TableTalk® e riprova.';
        }
        
        if (error.message?.includes('room') || error.message?.includes('not found')) {
            return 'Stanza non trovata. La videochiamata potrebbe essere terminata o non esistere più.';
        }
        
        if (error.message?.includes('media') || error.message?.includes('camera') || error.message?.includes('microphone')) {
            return 'Impossibile accedere alla fotocamera o al microfono. Verifica che i dispositivi siano collegati e che i permessi siano concessi.';
        }
        
        // Errore generico ma informativo
        return 'Impossibile connettersi alla videochiamata. Verifica la tua connessione internet, i permessi del browser e riprova.';
    };

    const connectToRoom = async () => {
        console.log('[VideoCall] Passo 1: Inizio procedura di connessione.');

        try {
            setError(''); // Pulisci eventuali errori precedenti
            
            // --- A. CHIEDI I PERMESSI PRIMA DI TUTTO ---
            console.log('[VideoCall] Passo 2: Richiesta permessi fotocamera...');
            const permissions = await Camera.requestPermissions();

            if (permissions.camera !== 'granted' || permissions.photos !== 'granted') {
                const errorMsg = 'Per partecipare alla videochiamata, devi concedere i permessi per la fotocamera e il microfono.';
                console.error('[VideoCall] Permessi non concessi dall\'utente.');
                setError(errorMsg);
                setLoading(false);
                return;
            }
            console.log('[VideoCall] Permessi concessi con successo.');

            // --- B. OTTIENI IL TOKEN (solo dopo aver ottenuto i permessi) ---
            console.log(`[VideoCall] Passo 3: Richiesta token per la stanza ${roomName}...`);
            const response = await videoService.getTwilioToken(roomName); 
            const token = response.token;                 
            if (!token) {
                throw new Error('Token non valido ricevuto dal server.');
            }
            console.log('[VideoCall] Token Twilio ottenuto.');

            // --- C. CONNETTITI ALLA STANZA VIDEO ---
            console.log('[VideoCall] Passo 4: Connessione alla stanza Twilio...');
            const connectedRoom = await Video.connect(token, {
                name: roomName,
                audio: true,
                video: { width: 640 },
                dominantSpeaker: true
            });
            connectedRoomRef.current = connectedRoom;
            console.log('[VideoCall] Connesso con successo alla stanza:', connectedRoom.name);

            setRoom(connectedRoom);
            setParticipants(Array.from(connectedRoom.participants.values()));

            // Gestione eventi... (il resto della logica rimane simile)
            connectedRoom.on('participantConnected', participant => {
                setParticipants(prev => [...prev, participant]);
            });

            connectedRoom.on('participantDisconnected', participant => {
                setParticipants(prev => prev.filter(p => p !== participant));
            });
            
            connectedRoom.on('disconnected', () => {
               navigate(`/meals/${roomName}`);
            });

            // Mostra il video locale
            if (localVideoRef.current && connectedRoom.localParticipant.videoTracks.size > 0) {
                const localTrack = Array.from(connectedRoom.localParticipant.videoTracks.values())[0].track;
                localVideoRef.current.appendChild(localTrack.attach());
            }

        } catch (err) {
            console.error('[VideoCall] ERRORE CRITICO:', err);
            const userFriendlyError = getErrorMessage(err);
            setError(userFriendlyError);
        } finally {
            setLoading(false);
            setRetrying(false);
        }
    };

    useEffect(() => {
        if (user && roomName) {
            connectToRoom();
        }

        // Funzione di pulizia
        return () => {
            if (connectedRoomRef.current) {
                console.log('[VideoCall] Disconnessione dalla stanza...');
                connectedRoomRef.current.disconnect();
                connectedRoomRef.current = null;
            }
        };
    }, [roomName, user, navigate]);

    const handleRetry = () => {
        setRetrying(true);
        setLoading(true);
        setError('');
        connectToRoom();
    };

    useEffect(() => {
        // Gestisci i video dei partecipanti remoti
        const container = remoteVideoRef.current;
        if (!container) return;

        // Rimuovi tutti i video esistenti prima di ri-aggiungerli
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        participants.forEach(participant => {
            participant.tracks.forEach(publication => {
                if (publication.track && publication.track.attach) {
                    const videoElement = publication.track.attach();
                    videoElement.className = styles.participantVideo;
                    container.appendChild(videoElement);
                }
            });
        });

    }, [participants]);

    useEffect(() => {
        const getMeal = async () => {
            try {
                const res = await mealService.getMealById(roomName);
                setMeal(res.data);
            } catch (err) {
                console.error("Impossibile caricare i dati del TableTalk®");
            }
        };
        getMeal();
    }, [roomName]);

const handleLeaveCall = () => {
    // Se siamo connessi a una stanza, avviamo la disconnessione.
    // Questo avviene in background.
    if (room) {
        room.disconnect();
    }
    
    // In ogni caso, reindirizziamo l'utente immediatamente.
    // Questo garantisce che l'interfaccia utente risponda sempre
    // all'azione dell'utente.
    navigate(`/meals/${roomName}`);
};

const handleEndCallForEveryone = async () => {
    if (window.confirm('Sei sicuro di voler terminare la chiamata per tutti i partecipanti?')) {
        try {
            await videoService.endCall(roomName); // Chiamiamo il nostro nuovo endpoint
            // la disconnessione di Twilio ci reindirizzerà automaticamente
        } catch (err) {
            setError(err.message || 'Errore nel terminare la chiamata.');
        }
    }
};

    if (loading) {
        return (
            <Container className={styles.centerContainer}>
                <Spinner animation="border" /> 
                <p className="ms-3">
                    {retrying ? 'Riconnessione in corso...' : 'Connessione in corso...'}
                </p>
            </Container>
        );
    }
    
    if (error) {
        return (
            <Container className={styles.centerContainer}>
                <Alert variant="danger" className="text-center">
                    <Alert.Heading>Errore di Connessione</Alert.Heading>
                    <p>{error}</p>
                    <hr />
                    <div className="d-flex justify-content-center gap-2">
                        <Button 
                            variant="primary" 
                            onClick={handleRetry}
                            disabled={retrying}
                        >
                            {retrying ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                                    Riprovo...
                                </>
                            ) : (
                                'Riprova'
                            )}
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={() => navigate(`/meals/${roomName}`)}
                        >
                            Torna al TableTalk®
                        </Button>
                    </div>
                </Alert>
                <BackButton className="mt-3" />
            </Container>
        );
    }

    const isHost = user && meal && user.id === meal.host._id;

    return (
        <div className={styles.videoPage}>
            <div className={styles.remoteParticipantsContainer} ref={remoteVideoRef}>
                {/* I video dei partecipanti remoti verranno inseriti qui */}
            </div>
            <div className={styles.localParticipantContainer} ref={localVideoRef}>
                {/* Il nostro video verrà inserito qui */}
            </div>
            <div className={styles.controls}>
                <Button variant="secondary" onClick={handleLeaveCall}>
                    Abbandona Chiamata
                </Button> 
                {isHost && (
                    <Button variant="danger" onClick={handleEndCallForEveryone}>
                        Termina Per Tutti
                    </Button>
                )}
            </div>
            <BackButton className="mb-4" /> 
        </div>
    );
};

export default VideoCallPage;