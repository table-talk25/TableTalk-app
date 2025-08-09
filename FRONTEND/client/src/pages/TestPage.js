// File: FRONTEND/client/src/pages/TestPage.js

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import BackButton from '../components/common/BackButton';

const TestPage = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState(t('test.initializing'));
  const [message, setMessage] = useState('');

  useEffect(() => {
    // IMPORTANTE: Assicurati che questo sia l'IP corretto del tuo computer
    // e che la porta sia 5002 (quella del nostro server di test)
    const socket = io('http://192.168.1.224:5002');
    
    setStatus(t('test.connecting'));
    console.log('Tentativo di connessione a http://192.168.1.224:5002');

    socket.on('connect', () => {
      setStatus(t('test.connected'));
      console.log('✅ CONNESSO!');
    });

    socket.on('connect_error', (err) => {
      setStatus(`${t('test.error')}: ${err.message}`);
      console.error('❌ ERRORE:', err.message);
    });

    socket.on('test-event', (data) => {
      setMessage(data);
      console.log('Messaggio ricevuto:', data);
    });

    // Questa funzione viene eseguita quando il componente viene smontato
    return () => socket.disconnect();
  }, [t]); // L'array vuoto assicura che questo effetto venga eseguito solo una volta

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>{t('test.title')}</h1>
      <p style={{ fontSize: '1.5rem' }}>
        {t('test.status')}: 
        <strong style={{ color: status.startsWith('✅') ? 'green' : 'red', marginLeft: '10px' }}>
          {status}
        </strong>
      </p>
      <p style={{ fontSize: '1.2rem' }}>
        {t('test.messageFromServer')}: <strong>{message}</strong>
      </p>
      <BackButton className="mb-4" /> 
    </div>
  );
};

export default TestPage;