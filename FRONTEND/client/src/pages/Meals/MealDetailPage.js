import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { getMealById, joinMeal, leaveMeal } from '../../services/mealService';
import { toast } from 'react-toastify';
import { formatDateTime } from '../../utils/dateUtils';
import '../../styles/MealDetailPage.css';

const MealDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [imageError, setImageError] = useState({});

  useEffect(() => {
    const fetchMeal = async () => {
      try {
        const data = await getMealById(id);
        setMeal(data);
      } catch (err) {
        setError('Pasto non trovato');
        toast.error('Errore nel caricamento del pasto');
      } finally {
        setLoading(false);
      }
    };

    fetchMeal();
  }, [id]);

  const handleJoinMeal = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsJoining(true);
    try {
      const updatedMeal = await joinMeal(id);
      setMeal(updatedMeal);
      toast.success('Ti sei unito al pasto con successo!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore durante la partecipazione al pasto');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveMeal = async () => {
    setIsJoining(true);
    try {
      const updatedMeal = await leaveMeal(id);
      setMeal(updatedMeal);
      toast.success('Hai lasciato il pasto con successo');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore durante l\'uscita dal pasto');
    } finally {
      setIsJoining(false);
    }
  };

  const handleImageError = (id) => {
    setImageError(prev => ({ ...prev, [id]: true }));
  };

  if (loading) {
    return (
      <div className="meal-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meal-detail-page">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button
            onClick={() => navigate('/meals')}
            className="btn btn-primary"
          >
            Torna alla lista dei pasti
          </button>
        </div>
      </div>
    );
  }

  const isHost = user && meal.host._id === user.id;
  const isParticipant = user && meal.participants.some(p => p._id === user.id);
  const canJoin = user && !isHost && !isParticipant && meal.participants.length < meal.maxParticipants;
  const isPast = new Date(meal.date) < new Date();

  return (
    <div className="meal-detail-page">
      <div className="meal-header">
        <div className="meal-cover">
          <img
            src={meal.imageUrl || '/default-meal.jpg'}
            alt={meal.title}
            className="cover-image"
          />
          <div className="meal-overlay">
            <div className="container">
              <h1>{meal.title}</h1>
              <div className="meal-meta">
                <span className="date">{formatDateTime(meal.date)}</span>
                <span className="participants">
                  {meal.participants.length}/{meal.maxParticipants} partecipanti
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="meal-content">
          <div className="row">
            <div className="col-lg-8">
              <div className="meal-section">
                <h2>Descrizione</h2>
                <p>{meal.description}</p>
              </div>

              <div className="meal-section">
                <h2>Host</h2>
                <div className="host-profile">
                  <img 
                    src={imageError[meal.host._id] ? '/default-avatar.png' : (meal.host.photo || '/default-avatar.png')} 
                    alt={meal.host.nickname}
                    className="host-avatar"
                    onError={() => handleImageError(meal.host._id)}
                  />
                  <div className="host-info">
                    <h3>{meal.host.nickname}</h3>
                    <p>{meal.host.age} anni · {meal.host.gender}</p>
                    {meal.host.interests && meal.host.interests.length > 0 && (
                      <div className="host-interests">
                        {meal.host.interests.map((interest, index) => (
                          <span key={index} className="interest-tag">{interest}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="meal-section">
                <h2>Partecipanti</h2>
                <div className="participants-grid">
                  {meal.participants.map(participant => (
                    <div key={participant._id} className="participant-card">
                      <img 
                        src={imageError[participant._id] ? '/default-avatar.png' : (participant.photo || '/default-avatar.png')} 
                        alt={participant.nickname}
                        className="participant-avatar"
                        onError={() => handleImageError(participant._id)}
                      />
                      <div className="participant-info">
                        <h4>{participant.nickname}</h4>
                        <p>{participant.age} anni</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="meal-sidebar">
                <div className="meal-info-card">
                  <h3>Informazioni</h3>
                  <ul className="info-list">
                    <li>
                      <i className="fas fa-utensils"></i>
                      <span>Tipo: {meal.type}</span>
                    </li>
                    <li>
                      <i className="fas fa-language"></i>
                      <span>Lingua: {meal.language}</span>
                    </li>
                    <li>
                      <i className="fas fa-users"></i>
                      <span>Partecipanti: {meal.participants.length}/{meal.maxParticipants}</span>
                    </li>
                    <li>
                      <i className="fas fa-calendar"></i>
                      <span>Data: {formatDateTime(meal.date)}</span>
                    </li>
                  </ul>
                </div>

                {meal.meetingLink && (
                  <div className="video-call-card">
                    <h3>
                      <i className="fas fa-video"></i>
                      Videochiamata
                    </h3>
                    <p>Unisciti alla videochiamata al momento del pasto</p>
                    <a 
                      href={meal.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary w-100"
                    >
                      <i className="fas fa-video me-2"></i>
                      Partecipa alla videochiamata
                    </a>
                  </div>
                )}

                <div className="action-card">
                  {isHost ? (
                    <div className="host-actions">
                      <button
                        onClick={() => navigate(`/meals/${id}/edit`)}
                        className="btn btn-outline-primary w-100 mb-2"
                      >
                        <i className="fas fa-edit me-2"></i>
                        Modifica pasto
                      </button>
                      <button
                        onClick={() => navigate(`/meals/${id}/manage`)}
                        className="btn btn-outline-secondary w-100"
                      >
                        <i className="fas fa-users-cog me-2"></i>
                        Gestisci partecipanti
                      </button>
                    </div>
                  ) : isParticipant ? (
                    <button
                      onClick={handleLeaveMeal}
                      disabled={isJoining}
                      className="btn btn-danger w-100"
                    >
                      {isJoining ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Uscita in corso...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-user-minus me-2"></i>
                          Esci dal pasto
                        </>
                      )}
                    </button>
                  ) : canJoin ? (
                    <button
                      onClick={handleJoinMeal}
                      disabled={isJoining}
                      className="btn btn-primary w-100"
                    >
                      {isJoining ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Partecipazione in corso...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-user-plus me-2"></i>
                          Partecipa al pasto
                        </>
                      )}
                    </button>
                  ) : (
                    <p className="text-muted text-center">
                      {!user
                        ? 'Accedi per partecipare al pasto'
                        : isPast
                        ? 'Questo pasto è già passato'
                        : 'Numero massimo di partecipanti raggiunto'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealDetailPage; 