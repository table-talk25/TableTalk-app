// File: src/pages/ChatPage/index.js (Versione Finale e Moderna)

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Alert, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import chatService from '../../services/chatService';
import { getHostAvatarUrl } from '../../constants/mealConstants';
import styles from './ChatPage.module.css';
import { toast } from 'react-toastify';
import { IoSend } from 'react-icons/io5';
import BackButton from '../../components/common/BackButton';
import LeaveReportModal from '../../components/meals/LeaveReportModal';
import { sendLeaveReport } from '../../services/apiService';
import mealService from '../../services/mealService';
import { Keyboard } from '@capacitor/keyboard';

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
  const messageIdsRef = useRef(new Set());

  console.log(`[DEBUG] Render - Stato Connessione: ${connectionStatus}`);


  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  const currentUserId = user?._id || user?.id;
  const currentUserName = user?.nickname || user?.name || 'Tu';

  const [hostAvatar, setHostAvatar] = useState(null);
  const [participantsCount, setParticipantsCount] = useState(null);
  const [maxParticipants, setMaxParticipants] = useState(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const normalizeMessage = (msg) => {
    const sender = msg.sender || msg.user || {};
    const senderId = sender._id || msg.userId;
    return {
      _id: msg._id || msg.id,
      sender,
      senderId,
      username: sender.nickname || msg.username || '',
      profileImage: sender.profileImage,
      content: msg.content,
      timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
    };
  };
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Effetto per lo scroll automatico 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gestione tastiera mobile: tieni l'input sopra la tastiera e scrolla ai nuovi messaggi
  useEffect(() => {
    let showSub, hideSub;
    (async () => {
      try {
        await Keyboard.setResizeMode({ mode: 'body' });
      } catch (_) {}
      try {
        showSub = Keyboard.addListener('keyboardWillShow', (info) => {
          const h = info?.keyboardHeight || 320;
          setKeyboardOffset(h);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        });
        hideSub = Keyboard.addListener('keyboardDidHide', () => {
          setKeyboardOffset(0);
        });
      } catch (_) {}
    })();
    // Fallback con visualViewport (alcuni device non emettono eventi Keyboard)
    const handleVV = () => {
      if (window.visualViewport) {
        const offset = Math.max(0, window.innerHeight - window.visualViewport.height);
        setKeyboardOffset(offset);
      }
    };
    window.visualViewport?.addEventListener('resize', handleVV);
    return () => {
      showSub?.remove?.();
      hideSub?.remove?.();
      window.visualViewport?.removeEventListener('resize', handleVV);
    };
  }, []);

  // Effetto principale per dati e socket 
  useEffect(() => {
    let mounted = true;

    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        const chatData = await chatService.getChatById(chatId);
        if (mounted) {
          setChat(chatData);
          const initial = (chatData.messages || []).map(normalizeMessage);
          setMessages(initial);
          // Registra gli ID per deduplicare
          messageIdsRef.current = new Set(initial.map(m => m._id).filter(Boolean));

          // Prova a ricavare meta dalla chat; altrimenti fallback al meal
          const countFromChat = Array.isArray(chatData.participants) ? chatData.participants.length : null;
          const maxFromChat = typeof chatData.maxParticipants === 'number' ? chatData.maxParticipants : null;
          if (countFromChat != null) setParticipantsCount(countFromChat);
          if (maxFromChat != null) setMaxParticipants(maxFromChat);

          if (chatData.mealId) {
            try {
              const meal = await mealService.getMealById(chatData.mealId);
              // Se il servizio restituisce { data: meal }, uniformiamo
              const mealObj = meal?.data || meal;
              if (mealObj) {
                setParticipantsCount(mealObj.participants?.length ?? participantsCount);
                setMaxParticipants(mealObj.maxParticipants ?? maxParticipants);
                const profileImage = mealObj.host?.profileImage;
                if (profileImage) setHostAvatar(getHostAvatarUrl(profileImage));
              }
            } catch (_) {}
          }
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
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
    const socketUrl = apiUrl.replace('/api', '');
    console.log(`[DEBUG] API URL: ${apiUrl}`);
    console.log(`[DEBUG] Socket URL: ${socketUrl}`);
    
    const socket = io(socketUrl, { 
      auth: { token },
      // Permetti fallback a polling per reti che bloccano i WebSocket
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      timeout: 15000,
      withCredentials: true
    });
        
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[DEBUG] Socket connesso!');
      setConnectionStatus('connected');
      // Unisciti alla stanza dopo la connessione
      socket.emit('joinChatRoom', chatId);
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

    socket.on('reconnect', (attempt) => {
      console.log('[DEBUG] Socket riconnesso, tentativo:', attempt);
      setConnectionStatus('connected');
      // Riunisciti alla stanza dopo la riconnessione
      socket.emit('joinChatRoom', chatId);
    });

    socket.on('receiveMessage', (message) => {
      console.log('[DEBUG] Nuovo messaggio ricevuto:', message);
      const nm = normalizeMessage(message);
      const mid = nm._id;
      if (mid && messageIdsRef.current.has(mid)) return;
      if (mid) messageIdsRef.current.add(mid);
      setMessages(prev => [...prev, nm]);
    });

    socket.on('userTyping', ({ user: typingUser, isTyping }) => {
      if (!typingUser?._id) return;
      setTypingUsers(prev => {
        const exists = prev.find(u => u.userId === typingUser._id);
        if (isTyping) {
          if (exists) return prev;
          return [...prev, { userId: typingUser._id, username: typingUser.nickname }];
        }
        return prev.filter(u => u.userId !== typingUser._id);
      });
    });

    // Join gestito sui callback di connect/reconnect

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [chatId, token, t]);

  const handleTyping = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing', { chatId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit('typing', { chatId, isTyping: false });
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

    socketRef.current.emit('sendMessage', { chatId, content: messageData.content }, (ack) => {
      // Non aggiungiamo subito il messaggio: arriverà tramite 'receiveMessage'.
      // Evitiamo duplicati lato mittente.
    });
    setNewMessage('');
    
    // Stop typing indicator
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { chatId, isTyping: false });
    }
  };

  const handleLeaveChatWithReason = async ({ reason, customReason }) => {
    try {
      if (isHost) {
        toast.info(t('chat.hostCannotLeave'));
        setShowLeaveModal(false);
        return;
      }
      await sendLeaveReport({ type: 'chat', id: chatId, reason, customReason });
      await chatService.leaveChat(chatId);
      toast.success(t('chat.leaveSuccess'));
      navigate('/meals');
    } catch (err) {
      // Silenzia errori di rete transitori
      const transient = err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED' || !err?.response;
      if (!transient) toast.error(t('chat.leaveError'));
      navigate('/meals');
    } finally {
      setShowLeaveModal(false);
    }
  };

  const hostId = chat?.mealId?.host?._id || chat?.mealId?.host;
  const isHost = !!(hostId && hostId.toString() === (currentUserId || '').toString());
  const handleCloseChat = async () => {
    try {
      await chatService.closeChat(chatId);
      toast.success(t('chat.closeSuccess'));
      navigate('/meals');
    } catch (err) {
      const transient = err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED' || !err?.response;
      if (!transient) toast.error(t('chat.closeError'));
      navigate('/meals');
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
        <BackButton className={styles.backButton} />
        <div className={styles.chatInfo}>
          <p className={styles.chatTitle}>{chat?.title || t('chat.subtitle')}</p>
          <div className={styles.headerMeta}>
            {hostAvatar && (
              <img src={hostAvatar} alt={t('profile.header.avatarAlt')} className={styles.headerAvatar} />
            )}
            {participantsCount != null && maxParticipants != null && (
              <span className={styles.participantsSummary}>
                {t('meals.detail.participantsText', { current: participantsCount, max: maxParticipants })}
              </span>
            )}
          </div>
        </div>
        <div className="d-flex align-items-center" style={{ gap: 8 }}>
          {isHost ? (
            <Button size="sm" variant="outline-danger" onClick={handleCloseChat}>{t('chat.close')}</Button>
          ) : (
            <Button size="sm" variant="outline-secondary" onClick={() => setShowLeaveModal(true)}>{t('chat.leave')}</Button>
          )}
        </div>
      </div>

      <div className={styles.messagesContainer} style={{ paddingBottom: 72 + (keyboardOffset || 0) }}>
        {messages.map((message, index) => (
          <div 
            key={message._id || index} 
            className={`${styles.message} ${message.senderId === currentUserId ? styles.ownMessage : styles.otherMessage}`}
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

      <form onSubmit={handleSendMessage} className={styles.messageForm} style={{ bottom: showLeaveModal ? 0 : (keyboardOffset || 0), pointerEvents: showLeaveModal ? 'none' : 'auto', opacity: showLeaveModal ? 0.4 : 1 }}>
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
          enterKeyHint="send"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
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
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeaveChatWithReason}
        type="chat"
      />
    </div>
  );
};

export default ChatPage;