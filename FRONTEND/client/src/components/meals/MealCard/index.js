// File: src/components/meals/MealCard/index.js (Versione Finale e Intelligente)

import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaUsers, FaUserCircle, FaLanguage, FaClock } from 'react-icons/fa'; 
import { 
  formatDate, 
  getMealTypeText, 
  getMealCoverImageUrl, 
  getMealTypeColor, 
  getHostAvatarUrl,
  getMealModeText,
  getMealModeIcon,
  getMealModeColor
} from '../../../constants/mealConstants';
import { useAuth } from '../../../contexts/AuthContext';
import EditMealButton from '../EditMealButton';
import LeaveMealButton from '../LeaveMealButton';
import styles from './MealCard.module.css';

const MealCard = ({ meal, onLeaveSuccess }) => {
  const { user } = useAuth();

  if (!meal || !meal.host) {
    console.error("MealCard ha ricevuto dati incompleti: ", meal);
    return null;
  }

  const isHost = user && user.id === meal.host._id;
  const isParticipant = user && meal.participants && meal.participants.some(p => p._id === user.id);

  const imageUrl = getMealCoverImageUrl(meal.coverImage);
  const hostAvatarUrl = getHostAvatarUrl(meal.host.profileImage);

  const truncatedDescription = meal.description && meal.description.length > 80
    ? meal.description.substring(0, 80) + '...'
    : meal.description;

          // Calcolo se il TableTalk® è terminato
  const mealEndTime = new Date(new Date(meal.date).getTime() + (meal.duration || 0) * 60000);
  const isPast = meal.status === 'completed' || meal.status === 'cancelled' || new Date() > mealEndTime;

  return (
    <div className={styles.card}>
      <Link to={`/meals/${meal._id}`} className={styles.cardLink}>
        <div className={styles.cardImageWrapper}>
          <img src={imageUrl} alt={meal.title} className={styles.cardImage} />
          <div className={styles.cardImageType} style={{ backgroundColor: getMealTypeColor(meal.type) }}>
            {getMealTypeText(meal.type)}
          </div>
          {/* Badge per il tipo di TableTalk® (virtuale/fisico) */}
          <div 
            className={styles.mealModeBadge} 
            style={{ backgroundColor: getMealModeColor(meal.mealType) }}
          >
            <span className={styles.mealModeIcon}>{getMealModeIcon(meal.mealType)}</span>
            <span className={styles.mealModeText}>{getMealModeText(meal.mealType)}</span>
          </div>
        </div>
        <div className={styles.cardContent}>
          <h3 className={styles.cardTitle}>{meal.title}</h3>
          
          <div className={styles.cardDetail}>
            <FaLanguage />
            <span>{meal.language}</span>
          </div>
          
          <Link to={`/profilo/${meal.host._id}`} className={styles.hostLink}>
            <div className={styles.cardDetail}>
              <img src={hostAvatarUrl} alt={meal.host.nickname} className={styles.hostAvatar} />
              <span>Organizzato da <strong>{meal.host.nickname}</strong></span>
            </div>
          </Link>
          
          <div className={styles.cardDetail}>
            <FaCalendarAlt />
            <span>{formatDate(meal.date)}</span>
          </div>
          {/* Durata e orario di fine */}
          <div className={styles.cardDetail}>
            <FaClock />
            <span>Durata: {meal.duration} minuti</span>
          </div>
          <div className={styles.cardDetail}>
            <FaClock />
            <span>Fine: {formatDate(new Date(new Date(meal.date).getTime() + meal.duration * 60000), 'HH:mm')}</span>
          </div>
          
          {/* Mostra la posizione solo per TableTalk® fisici */}
          {meal.mealType === 'physical' && meal.location && (
            <div className={styles.cardDetail}>
              <span className={styles.locationIcon}>📍</span>
              <span className={styles.locationText}>{meal.location}</span>
            </div>
          )}
          
          <p className={styles.cardDescription}>{truncatedDescription}</p>
        </div>
      </Link>
      
      <div className={styles.cardActions}>
        <div className={styles.cardDetail}>
            <FaUsers />
            <span>{meal.participants?.length || 0} / {meal.maxParticipants} partecipanti</span>
        </div>
        <div className={styles.actionButtons}>
            {isHost && !isPast && <EditMealButton mealId={meal._id} />}
            {isParticipant && !isHost && !isPast && <LeaveMealButton mealId={meal._id} onSuccess={onLeaveSuccess} />}
        </div>
      </div>
    </div>
  );
};

export default MealCard;