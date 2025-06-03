import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { formatDateTime } from '../../utils/dateUtils';
import JoinMealButton from './JoinMealButton';
import { leaveMeal } from '../../services/mealService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { mealService } from '../../services/mealService';
import '../../styles/MealDetail.css';

const MEAL_TYPE_TRANSLATIONS = {
  'colazione': 'Colazione',
  'pranzo': 'Pranzo',
  'cena': 'Cena',
  'aperitivo': 'Aperitivo'
};

const LANGUAGE_TRANSLATIONS = {
  'Italiano': 'Italiano',
  'English': 'Inglese',
  'Español': 'Spagnolo',
  'Français': 'Francese',
  'Deutsch': 'Tedesco',
  '中文': 'Cinese',
  'العربية': 'Arabo'
};

const STATUS_TRANSLATIONS = {
  'pianificato': 'In arrivo',
  'in corso': 'In corso',
  'completato': 'Completato',
  'cancellato': 'Cancellato'
};

const STATUS_VARIANTS = {
  'pianificato': 'success',
  'in corso': 'warning',
  'completato': 'secondary',
  'cancellato': 'danger'
};

const MealDetail = ({ meal, onJoinSuccess, onLeaveSuccess }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState({});
  const { currentUser } = useAuth();

  const {
    _id, title, type, date, maxParticipants, description,
    host, participants, language, meetingLink, status
  } = meal;

  // Verifica se l'utente corrente è l'host
  const isHost = host?._id === currentUser?.id;
  
  // Verifica se l'utente corrente è un partecipante
  const isParticipant = participants?.some(p => p._id === currentUser?.id);
  
  // Verifica se il pasto è pieno
  const isFull = participants?.length >= maxParticipants;

  // Verifica se il pasto è già passato
  const isPast = new Date(date) < new Date();

  // Funzione per gestire gli errori di caricamento delle immagini
  const handleImageError = (id) => {
    setImageError(prev => ({ ...prev, [id]: true }));
  };

  // Funzione per abbandonare il pasto
  const handleLeaveMeal = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await leaveMeal(_id);
      setSuccess('Hai abbandonato il pasto con successo');
      toast.success('Hai abbandonato il pasto con successo');
      if (onLeaveSuccess) onLeaveSuccess();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Errore nell\'abbandonare il pasto';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="meal-detail">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h3>{title}</h3>
            <div className="meal-metadata">
              <Badge bg="primary" className="me-2">{MEAL_TYPE_TRANSLATIONS[type]}</Badge>
              <Badge bg="info" className="me-2">{LANGUAGE_TRANSLATIONS[language]}</Badge>
              <Badge bg={STATUS_VARIANTS[status]}>
                {STATUS_TRANSLATIONS[status]}
              </Badge>
            </div>
          </div>
          <div className="text-end">
            <h5>{formatDateTime(date)}</h5>
            <span>{participants?.length}/{maxParticipants} partecipanti</span>
          </div>
        </Card.Header>
        
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <p className="mb-4">{description}</p>
          
          <div className="host-info mb-4">
            <img 
              src={imageError[host._id] ? '/default-avatar.png' : (host.photo || '/default-avatar.png')} 
              alt={host.nickname} 
              className="host-avatar me-3"
              onError={() => handleImageError(host._id)}
            />
            <div>
              <h6>{host.nickname}</h6>
              <p className="text-muted">
                {host.age} anni · {host.gender}
              </p>
            </div>
          </div>
          
          <div className="meal-actions">
            {status === 'pianificato' && !isPast && (
              <>
                {!isParticipant ? (
                  <JoinMealButton 
                    mealId={_id} 
                    disabled={isFull || loading} 
                    onSuccess={onJoinSuccess}
                  />
                ) : !isHost ? (
                  <Button 
                    variant="outline-danger" 
                    onClick={handleLeaveMeal}
                    disabled={loading}
                    className="w-100"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Elaborazione...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-minus me-2"></i>
                        Abbandona pasto
                      </>
                    )}
                  </Button>
                ) : null}
              </>
            )}
          </div>

          {meetingLink && (
            <div className="video-call-info mt-4">
              <a 
                href={meetingLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary w-100"
              >
                <i className="fas fa-video me-2"></i>
                Partecipa alla videochiamata
              </a>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default MealDetail;