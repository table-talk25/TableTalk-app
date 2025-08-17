import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Container, Row, Col, Card } from 'react-bootstrap';
import useTypingIndicator from '../../hooks/useTypingIndicator';
import useReadReceipts from '../../hooks/useReadReceipts';
import TypingIndicator from './TypingIndicator';
import ChatMessage from './ChatMessage';
import styles from './ChatExample.module.css';

/**
 * Componente di esempio che mostra l'integrazione di tutte le funzionalità della chat
 * Questo è un esempio per sviluppatori, non per uso in produzione
 */
const ChatExample = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId] = useState('example-chat-123');
  const [participants] = useState([
    { _id: 'user1', nickname: 'Mario', profileImage: '/default-avatar.jpg' },
    { _id: 'user2', nickname: 'Giulia', profileImage: '/default-avatar.jpg' },
    { _id: 'user3', nickname: 'Luca', profileImage: '/default-avatar.jpg' }
  ]);
  const [currentUser] = useState({ _id: 'user1', nickname: 'Mario' });

  // Hook per l'indicatore "sta scrivendo"
  const {
    isTyping,
    typingUsers,
    handleTextChange,
    updateTypingUsers
  } = useTypingIndicator(chatId, (typingState) => {
    console.log('Stato typing aggiornato:', typingState);
  });

  // Hook per le conferme di lettura
  const {
    readStatus,
    getMessageReadCount,
    getOtherParticipantsCount
  } = useReadReceipts(chatId, messages, (readState) => {
    console.log('Stato lettura aggiornato:', readState);
  });

  // Simula messaggi di esempio
  useEffect(() => {
    const exampleMessages = [
      {
        _id: 'msg1',
        content: 'Ciao a tutti! Come state?',
        sender: { _id: 'user1', nickname: 'Mario', profileImage: '/default-avatar.jpg' },
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: ['user1', 'user2'],
        readBy: [
          { user: { _id: 'user1', nickname: 'Mario' }, readAt: new Date(Date.now() - 300000) },
          { user: { _id: 'user2', nickname: 'Giulia' }, readAt: new Date(Date.now() - 250000) }
        ]
      },
      {
        _id: 'msg2',
        content: 'Ciao Mario! Tutto bene, grazie!',
        sender: { _id: 'user2', nickname: 'Giulia', profileImage: '/default-avatar.jpg' },
        timestamp: new Date(Date.now() - 200000).toISOString(),
        read: ['user1', 'user2'],
        readBy: [
          { user: { _id: 'user1', nickname: 'Mario' }, readAt: new Date(Date.now() - 200000) },
          { user: { _id: 'user2', nickname: 'Giulia' }, readAt: new Date(Date.now() - 200000) }
        ]
      },
      {
        _id: 'msg3',
        content: 'Perfetto! Ci vediamo presto!',
        sender: { _id: 'user1', nickname: 'Mario', profileImage: '/default-avatar.jpg' },
        timestamp: new Date(Date.now() - 100000).toISOString(),
        read: ['user1'],
        readBy: [
          { user: { _id: 'user1', nickname: 'Mario' }, readAt: new Date(Date.now() - 100000) }
        ]
      }
    ];
    setMessages(exampleMessages);
  }, []);

  // Simula utenti che scrivono
  const simulateTyping = () => {
    const typingUsers = [
      {
        user: { _id: 'user2', nickname: 'Giulia', profileImage: '/default-avatar.jpg' },
        startedAt: new Date()
      }
    ];
    updateTypingUsers(typingUsers);
  };

  const stopSimulatedTyping = () => {
    updateTypingUsers([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      _id: `msg${Date.now()}`,
      content: newMessage,
      sender: currentUser,
      timestamp: new Date().toISOString(),
      read: [currentUser._id],
      readBy: [
        { user: currentUser, readAt: new Date() }
      ]
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Simula che qualcun altro stia scrivendo
    setTimeout(simulateTyping, 1000);
    setTimeout(stopSimulatedTyping, 3000);
  };

  return (
    <Container className={styles.chatExample}>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h4>💬 Esempio Chat con Nuove Funzionalità</h4>
              <small className="text-muted">
                Questo è un esempio per sviluppatori che mostra l'integrazione di:
                <br />
                • Indicatore "sta scrivendo" • Conferme di lettura (spunte blu) • Gestione stato chat
              </small>
            </Card.Header>
            <Card.Body>
              <div className={styles.chatContainer}>
                {/* Messaggi */}
                <div className={styles.messagesArea}>
                  {messages.map(message => (
                    <ChatMessage
                      key={message._id}
                      message={message}
                      currentUser={currentUser}
                      participants={participants}
                      getMessageReadCount={getMessageReadCount}
                      getOtherParticipantsCount={getOtherParticipantsCount}
                    />
                  ))}
                  
                  {/* Indicatore "sta scrivendo" */}
                  <TypingIndicator 
                    typingUsers={typingUsers}
                    className={styles.typingIndicator}
                  />
                </div>

                {/* Form per nuovo messaggio */}
                <Form onSubmit={handleSubmit} className={styles.messageForm}>
                  <Row>
                    <Col xs={9}>
                      <Form.Control
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTextChange(e.target.value);
                        }}
                        placeholder={t('chat.messagePlaceholder')}
                        className={styles.messageInput}
                      />
                    </Col>
                    <Col xs={3}>
                      <Button 
                        type="submit" 
                        variant="primary" 
                        className={styles.sendButton}
                        disabled={!newMessage.trim()}
                      >
                        Invia
                      </Button>
                    </Col>
                  </Row>
                </Form>

                {/* Controlli di esempio */}
                <div className={styles.exampleControls}>
                  <h6>🎮 Controlli di Esempio:</h6>
                  <div className={styles.controlButtons}>
                    <Button 
                      size="sm" 
                      variant="outline-info" 
                      onClick={simulateTyping}
                    >
                      Simula "sta scrivendo"
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline-warning" 
                      onClick={stopSimulatedTyping}
                    >
                      Ferma "sta scrivendo"
                    </Button>
                  </div>
                  
                  <div className={styles.statusInfo}>
                    <small>
                      <strong>Stato attuale:</strong><br />
                      • Sta scrivendo: {isTyping ? 'Sì' : 'No'}<br />
                      • Utenti che scrivono: {typingUsers.length}<br />
                      • Messaggi totali: {messages.length}
                    </small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ChatExample;
