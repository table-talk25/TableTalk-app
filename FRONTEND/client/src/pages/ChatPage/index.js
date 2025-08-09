// File: src/pages/ChatPage/index.js (Versione Finale e Moderna)

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Alert, Image, Dropdown } from 'react-bootstrap'; // Dropdown è nuovo
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import chatService from '../../services/chatService';
import { getHostAvatarUrl } from '../../constants/mealConstants';
import styles from './ChatPage.module.css';
import { toast } from 'react-toastify';
import { BsThreeDotsVertical } from 'react-icons/bs'; // Icona per il menu
import { IoSend, IoRestaurantOutline, IoLogOutOutline } from 'react-icons/io5'; // Aggiungi IoRestaurantOutline e IoLogOutOutline
import BackButton from '../../components/common/BackButton';
import LeaveReportModal from '../../components/meals/LeaveReportModal';
import { sendLeaveReport } from '../../services/apiService';

const ChatPage = () => {
  const { t } = useTranslation();
  const { chatId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  console.log(`[DEBUG] Render - Stato Connessione: ${connectionStatus}`);


  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Effetto per lo scroll automatico 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effetto principale per dati e socket 
  useEffect(() => {
    let mounted = true;

    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        const chatData = await chatService.getChatById(chatId);
        if (mounted) {
          setChat(chatData);
          setMessages(chatData.messages);
        }
      } catch (err) {
        if (mounted) {
            setError(t('chat.loadError'));
            toast.error(err.response?.data?.error || t('chat.loadError'));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchChatHistory();

    console.log('[DEBUG] Tentativo di connessione, token presente:', !!token);

  
    // Se non c'è il token, non tentare di connettere il socket
    if (!token) {
      setConnectionStatus('error');
      setError(t('chat.authRequired'));
      console.error('[DEBUG] ERRORE: Token non trovato. Impossibile connettere il socket.');

      return;
  }


    // Usa esattamente lo stesso indirizzo IP delle API HTTP
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.224:5001/api';
    const socketUrl = apiUrl.replace('/api', '');
    console.log(`[DEBUG] API URL: ${apiUrl}`);
    console.log(`[DEBUG] Socket URL: ${socketUrl}`);
    
    const socket = io(socketUrl, { 
      auth: { token },
      // Configurazione ottimizzata per WebSocket
      transports: ['websocket'], // Forza solo WebSocket
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      timeout: 10000,
      withCredentials: true
    });
        
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[DEBUG] Socket connesso!');
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      console.log('[DEBUG] Socket disconnesso!');
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('[DEBUG] Errore di connessione socket:', error);
      setConnectionStatus('error');
      setError(t('chat.connectionError'));
    });

    socket.on('message', (message) => {
      console.log('[DEBUG] Nuovo messaggio ricevuto:', message);
      setMessages(prev => [...prev, message]);
    });

    socket.on('typing', (data) => {
      console.log('[DEBUG] Utente sta scrivendo:', data);
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId);
        return [...filtered, { userId: data.userId, username: data.username }];
      });
    });

    socket.on('stop_typing', (data) => {
      console.log('[DEBUG] Utente ha smesso di scrivere:', data);
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    // Join della chat room
    socket.emit('join_chat', { chatId });

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [chatId, token, t]);

  const handleTyping = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing', { chatId });
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('stop_typing', { chatId });
        }
      }, 1000);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current?.connected) return;

    const messageData = {
      chatId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    socketRef.current.emit('send_message', messageData);
    setNewMessage('');
    
    // Stop typing indicator
    if (socketRef.current?.connected) {
      socketRef.current.emit('stop_typing', { chatId });
    }
  };

  const handleLeaveChatWithReason = async ({ reason, customReason }) => {
    try {
      await sendLeaveReport({ type: 'chat', id: chatId, reason, customReason });
      await chatService.leaveChat(chatId);
      toast.success(t('chat.leaveSuccess'));
      navigate('/meals');
    } catch (err) {
      toast.error(t('chat.leaveError'));
    } finally {
      setShowLeaveModal(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <Alert variant="danger">
          <h4>{t('chat.errorTitle')}</h4>
          <p>{error}</p>
          <BackButton />
        </Alert>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="text-center py-5">
        <Alert variant="warning">
          <h4>{t('chat.notFoundTitle')}</h4>
          <p>{t('chat.notFoundMessage')}</p>
          <BackButton />
        </Alert>
      </div>
    );
  }

  return (
    <div className={styles.chatPage}>
      <div className={styles.chatHeader}>
        <BackButton />
        <div className={styles.chatInfo}>
          <h2>{t('chat.title')}</h2>
          <p>{t('chat.subtitle')}</p>
        </div>
        <Dropdown>
          <Dropdown.Toggle variant="light" id="chat-menu">
            <BsThreeDotsVertical />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => navigate(`/meals/${chat.mealId}`)}>
              <IoRestaurantOutline /> {t('chat.viewMeal')}
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setShowLeaveModal(true)}>
              <IoLogOutOutline /> {t('chat.leaveChat')}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div 
            key={message._id || index} 
            className={`${styles.message} ${message.userId === user?.id ? styles.ownMessage : styles.otherMessage}`}
          >
            <div className={styles.messageContent}>
              <div className={styles.messageHeader}>
                <img 
                  src={getHostAvatarUrl(message.user)} 
                  alt={t('chat.userAvatarAlt')}
                  className={styles.messageAvatar}
                />
                <span className={styles.messageAuthor}>{message.username}</span>
                <span className={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className={styles.messageText}>{message.content}</div>
            </div>
          </div>
        ))}
        
        {typingUsers.length > 0 && (
          <div className={styles.typingIndicator}>
            {typingUsers.map(user => user.username).join(', ')} {t('chat.isTyping')}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className={styles.messageForm}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder={t('chat.messagePlaceholder')}
          className={styles.messageInput}
          disabled={connectionStatus !== 'connected'}
        />
        <button 
          type="submit" 
          className={styles.sendButton}
          disabled={!newMessage.trim() || connectionStatus !== 'connected'}
        >
          <IoSend />
        </button>
      </form>

      <LeaveReportModal
        show={showLeaveModal}
        onHide={() => setShowLeaveModal(false)}
        onSubmit={handleLeaveChatWithReason}
        title={t('chat.leaveReportTitle')}
      />
    </div>
  );
};

export default ChatPage;