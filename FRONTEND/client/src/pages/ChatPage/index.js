// File: src/pages/ChatPage/index.js (Versione Finale e Moderna)

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Alert, Image, Dropdown } from 'react-bootstrap'; // Dropdown è nuovo
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
            setError('Impossibile caricare la cronologia della chat.');
            toast.error(err.response?.data?.error || 'Errore di caricamento.');
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
      setError('Autenticazione richiesta per la chat.');
      console.error('[DEBUG] ERRORE: Token non trovato. Impossibile connettere il socket.');

      return;
  }


    // Usa esattamente lo stesso indirizzo IP delle API HTTP
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.151:5001/api';
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
      console.log('✅ [DEBUG] Evento "connect" ricevuto! Socket CONNESSO!');
      console.log(`[DEBUG] Trasporto utilizzato: ${socket.io.engine.transport.name}`);
      console.log(`[DEBUG] WebSocket attivo: ${socket.io.engine.transport.name === 'websocket'}`);

      if (mounted) {
        setConnectionStatus('connected');
        socket.emit('joinChatRoom', chatId);
        console.log(`[Socket] Connesso e unito alla stanza ${chatId}`);
      }
    });

    socket.on('userTyping', ({ user, isTyping }) => {
      if (isTyping) {
        // Aggiungi l'utente alla lista se non c'è già
        setTypingUsers(prev => [...prev.filter(u => u._id !== user._id), user]);
      } else {
        // Rimuovi l'utente dalla lista
        setTypingUsers(prev => prev.filter(u => u._id !== user._id));
      }
    });

    socket.on('disconnect', (reason) => { 
      if(mounted) {
        setConnectionStatus('disconnected');
        console.log(`[DEBUG] Socket DISCONNESSO! Motivo: ${reason}`);
        
        // Se la disconnessione è dovuta a un errore del server, mostra un messaggio
        if (reason === 'io server disconnect') {
          toast.error('Connessione persa. Tentativo di riconnessione...');
        }
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`[DEBUG] Socket RICONNESSO dopo ${attemptNumber} tentativi!`);
      if (mounted) {
        setConnectionStatus('connected');
        socket.emit('joinChatRoom', chatId);
        toast.success('Connessione ripristinata!');
      }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[DEBUG] Tentativo di riconnessione #${attemptNumber}`);
    });

    socket.on('reconnect_error', (error) => {
      console.error(`[DEBUG] Errore durante la riconnessione:`, error);
    });

    socket.on('reconnect_failed', () => {
      console.error('[DEBUG] Tutti i tentativi di riconnessione falliti!');
      if (mounted) {
        setConnectionStatus('error');
        toast.error('Impossibile riconnettersi. Ricarica la pagina.');
      }
    });

    socket.on('connect_error', (err) => {
      console.error(`❌ [DEBUG] Evento "connect_error". Causa: ${err.message}`);

      if (mounted) {
        setConnectionStatus('error');
        console.error('[Socket] Errore di connessione:', err.message);
        
        // Se è un errore WebSocket, prova a forzare il polling
        if (err.message.includes('websocket')) {
          console.log('[DEBUG] Tentativo di riconnessione con polling...');
          socket.io.opts.transports = ['polling'];
          socket.connect();
        }
      }
    });

    socket.on('receiveMessage', (receivedMessage) => {
      if (mounted) {
        setMessages(prevMessages => {
            if (prevMessages.some(msg => msg._id === receivedMessage._id)) {
                return prevMessages;
            }
            return [...prevMessages, receivedMessage];
        });
      }
    });

    socket.on('chatError', (err) => {
      if (mounted) toast.error(err.message);
    });

    return () => {
      mounted = false;
      socket.disconnect();
      console.log('[Socket] Disconnesso.');
    };
  }, [chatId, token]);

    // 3. Crea una funzione per gestire l'evento di scrittura
    const handleTyping = () => {
      // Invia "sta scrivendo" subito
      socketRef.current.emit('typing', { chatId, isTyping: true });
  
      // Cancella il timeout precedente
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
  
      // Imposta un nuovo timeout per inviare "ha smesso di scrivere"
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('typing', { chatId, isTyping: false });
      }, 2000); // 2 secondi di inattività
    };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || connectionStatus !== 'connected' || !socketRef.current) return;

    const messageData = { chatId, content: newMessage.trim() };

    socketRef.current.emit('sendMessage', messageData, (response) => {
      if (response && response.success) {
        setNewMessage('');
        toast.success('Messaggio inviato!');
      } else {
        toast.error(response?.error || "Impossibile inviare il messaggio.");
      }
    });
  };
  
  const handleLeaveChatWithReason = async ({ reason, customReason }) => {
    try {
      await sendLeaveReport({ type: 'chat', id: chatId, reason, customReason });
      await chatService.leaveChat(chatId);
      toast.info('Hai lasciato la chat. Grazie per il feedback!');
      navigate(`/meals/${chat.mealId._id}`);
    } catch (err) {
      toast.error('Impossibile lasciare la chat.');
    } finally {
      setShowLeaveModal(false);
    }
  };

  // --- JSX CON NUOVO LAYOUT MODERNO ---

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" /></div>;
  if (error) return <div className="p-5 text-center"><Alert variant="danger">{error}</Alert></div>;

  const isInputDisabled = connectionStatus !== 'connected';
  console.log(`[DEBUG] L'input è disabilitato? ${isInputDisabled} (Stato: ${connectionStatus})`);

  return (
    <div className={styles.chatPage}>
      <header className={styles.chatHeader}>
        <h1 className={styles.chatTitle}>{chat?.name}</h1>
        <Dropdown>
  <Dropdown.Toggle as="button" className={styles.menuButton}>
    <BsThreeDotsVertical />
  </Dropdown.Toggle>
  <Dropdown.Menu align="end" className={styles.dropdownMenu}>
  <Dropdown.Item onClick={() => navigate(`/meals/${chat?.mealId?._id}`)} className={styles.dropdownItem}>
    <IoRestaurantOutline size={18} />
                      <span>Vedi Dettagli TableTalk®</span>
    </Dropdown.Item>
    <Dropdown.Divider />
    <Dropdown.Item onClick={() => setShowLeaveModal(true)} className={`${styles.dropdownItem} ${styles.dangerItem}`}>
      <IoLogOutOutline size={18} />
      <span>Lascia la Chat</span>
    </Dropdown.Item>
  </Dropdown.Menu>
</Dropdown>
</header>
      <div className={styles.messagesList}>
        {messages.map(msg => (
          <div key={msg._id} className={`${styles.messageItem} ${msg.sender._id === user.id ? styles.myMessage : styles.otherMessage}`}>
            <Image src={getHostAvatarUrl(msg.sender.profileImage)} className={styles.avatar} />
            <div className={styles.messageBubble}>
              {msg.sender._id !== user.id && <div className={styles.senderName}>{msg.sender.nickname}</div>}
              <p className={styles.messageText}>{msg.content}</p>
              <span className={styles.timestamp}>
                {new Date(msg.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {typingUsers.length > 0 && (
          <div className={styles.typingIndicator}>
            {typingUsers.map(u => u.nickname).join(', ')} sta scrivendo...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className={styles.messageForm}>
        <input
          type="text"
          className={styles.chatInput}
          placeholder="Scrivi un messaggio..."
          value={newMessage}
          onChange={(e) => {
            console.log(`[DEBUG] onChange chiamato. Nuovo valore: ${e.target.value}`);

            setNewMessage(e.target.value);
            handleTyping();
          }}
          autoComplete="off"
          disabled={connectionStatus !== 'connected'}
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={connectionStatus !== 'connected' || !newMessage.trim()}
          aria-label="Invia messaggio"
        >
          <IoSend />
        </button>
      </form>
      <BackButton className="mb-4" /> 
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