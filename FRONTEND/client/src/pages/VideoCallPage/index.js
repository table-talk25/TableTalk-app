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
    const { id: roomName } = useParams(); // L'ID del pasto è il nome della nostra stanza
    const { user } = useAuth();
    const navigate = useNavigate();
    const [meal, setMeal] = useState(null); // Ci serviranno i dati del pasto

    const [room, setRoom] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    const connectedRoomRef = useRef(null);

    useEffect(() => {
        const connectToRoom = async () => {
            console.log('[VideoCall] Passo 1: Inizio procedura di connessione.');

            try {
                // --- A. CHIEDI I PERMESSI PRIMA DI TUTTO ---
                console.log('[VideoCall] Passo 2: Richiesta permessi fotocamera...');
                const permissions = await Camera.requestPermissions();

                if (permissions.camera !== 'granted' || permissions.photos !== 'granted') {
                    console.error('[VideoCall] Permessi non concessi dall\'utente.');
                    setError('Per partecipare alla videochiamata, devi concedere i permessi per la fotocamera.');
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
                setError(err.message || 'Errore di connessione alla videochiamata.');
            } finally {
                setLoading(false);
            }
        };

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
        return <Container className={styles.centerContainer}><Spinner animation="border" /> <p className="ms-3">Connessione in corso...</p></Container>;
    }
    
    if (error) {
        return <Container className={styles.centerContainer}><Alert variant="danger">{error}</Alert></Container>;
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