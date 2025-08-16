// File: src/contexts/NotificationContext.js

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import { API_URL } from '../config/capacitorConfig';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      console.log('[NotificationContext] Nessun token disponibile, saltando connessione socket');
      return;
    }

    // Verifica che l'API_URL sia valido
    if (!API_URL) {
      console.error('[NotificationContext] API_URL non definito, impossibile connettersi');
      return;
    }

    let socket = null;

    try {
      // Usa la stessa base delle API (Render), rimuovendo il suffisso /api
      const socketUrl = API_URL.replace(/\/?api\/?$/, '');
      console.log(`[NotificationContext] Tentativo connessione socket a: ${socketUrl}`);
      
      socket = io(socketUrl, { 
        auth: { token },
        transports: ['websocket'], // Forza solo WebSocket
        reconnection: true,
        reconnectionAttempts: 5, // Limita i tentativi di riconnessione
        reconnectionDelay: 2000,
        timeout: 10000 // Timeout di 10 secondi
      });

      socket.on('connect', () => {
        console.log('[NotificationContext] Socket connesso con successo');
        setIsConnected(true);
      });

      socket.on('connect_error', (error) => {
        console.error('[NotificationContext] Errore connessione socket:', error);
        setIsConnected(false);
        // Non mostrare errori all'utente per evitare confusione
      });

      socket.on('disconnect', (reason) => {
        console.log('[NotificationContext] Socket disconnesso:', reason);
        setIsConnected(false);
      });

      socket.on('new_notification', (notification) => {
        try {
          console.log('[NotificationContext] Nuova notifica ricevuta:', notification);
          setNotifications(prev => [notification, ...prev]);
          
          // Toast personalizzati per inviti e accettazioni
          if (notification.type === 'new_invitation') {
            toast.info(`${notification.message} 👉 Vai alla pagina Inviti!`, {
              onClick: () => window.location.href = '/invitations'
            });
          } else if (notification.type === 'invitation_accepted' && notification.data && notification.data.chatId) {
            toast.success(`${notification.message} 👉 Vai alla chat!`, {
              onClick: () => window.location.href = `/chat/${notification.data.chatId}`
            });
          } else {
            toast.info(notification.message);
          }
        } catch (error) {
          console.error('[NotificationContext] Errore nel processare la notifica:', error);
        }
      });

    } catch (error) {
      console.error('[NotificationContext] Errore nell\'inizializzazione del socket:', error);
      setIsConnected(false);
    }

    return () => {
      if (socket) {
        try {
          socket.disconnect();
          setIsConnected(false);
        } catch (error) {
          console.error('[NotificationContext] Errore nella disconnessione del socket:', error);
        }
      }
    };
  }, [token]);

  const value = { 
    notifications, 
    isConnected,
    // Funzione per testare la connessione
    testConnection: () => isConnected
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};