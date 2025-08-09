// File: src/contexts/NotificationContext.js

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!token) return; // Non connettere se non c'è token

    // Usa esattamente lo stesso indirizzo IP delle API HTTP
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.224:5001/api';
    const socketUrl = apiUrl.replace('/api', '');
    console.log(`[NotificationContext] Socket URL: ${socketUrl}`);
    const socket = io(socketUrl, { 
      auth: { token },
      transports: ['websocket'], // Forza solo WebSocket
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      console.log('Socket per notifiche connesso.');
    });

    socket.on('new_notification', (notification) => {
      console.log('Nuova notifica ricevuta:', notification);
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
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const value = { notifications };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};