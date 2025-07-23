// File: FRONTEND/client/src/pages/TestPage.js

import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import BackButton from '../components/common/BackButton';

const TestPage = () => {
  const [status, setStatus] = useState('Inizializzazione...');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // IMPORTANTE: Assicurati che questo sia l'IP corretto del tuo computer
    // e che la porta sia 5002 (quella del nostro server di test)
    const socket = io('http://192.168.1.151:5002');
    
    setStatus('Tentativo di connessione...');
    console.log('Tentativo di connessione a http://192.168.1.151:5002');

    socket.on('connect', () => {
      setStatus('✅ CONNESSO!');
      console.log('✅ CONNESSO!');
    });

    socket.on('connect_error', (err) => {
      setStatus(`❌ ERRORE: ${err.message}`);
      console.error('❌ ERRORE:', err.message);
    });

    socket.on('test-event', (data) => {
      setMessage(data);
      console.log('Messaggio ricevuto:', data);
    });

    // Questa funzione viene eseguita quando il componente viene smontato
    return () => socket.disconnect();
  }, []); // L'array vuoto assicura che questo effetto venga eseguito solo una volta

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Test di Connessione Socket</h1>
      <p style={{ fontSize: '1.5rem' }}>
        Stato: 
        <strong style={{ color: status.startsWith('✅') ? 'green' : 'red', marginLeft: '10px' }}>
          {status}
        </strong>
      </p>
      <p style={{ fontSize: '1.2rem' }}>
        Messaggio dal Server: <strong>{message}</strong>
      </p>
      <BackButton className="mb-4" /> 
    </div>
  );
};

export default TestPage;