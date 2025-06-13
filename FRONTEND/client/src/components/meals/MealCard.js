// File: /src/components/meals/MealCard.js (Versione per TableTalk)

import React from 'react';
import { Link } from 'react-router-dom';
import { FaRegClock, FaUsers, FaUserCircle } from 'react-icons/fa';
import { formatDate, getMealTypeText, getMealTypeColor } from '../../utils/mealUtils';
import styles from '../../styles/MealCard.module.css'; // Useremo un CSS leggermente modificato

const MealCard = ({ meal }) => {
  // Dati destrutturati dal nostro modello Meal.js
  const {
    _id,
    title,
    type,
    date,
    participantsCount,
    maxParticipants,
    host,
    language
  } = meal;

  const isFull = participantsCount >= maxParticipants;

  // L'intera card ora è un link alla pagina di dettaglio del pasto
  return (
    <Link to={`/meals/${_id}`} className={styles.mealCardLink}>
      <div className={`${styles.mealCard} ${isFull ? styles.full : ''}`}>
        
        <div className={styles.imageContainer}>
          {/* Per ora un'immagine placeholder, in futuro potremmo aggiungerla al modello */}
          <img src={`https://source.unsplash.com/random/400x250/?${type}`} alt={title} className={styles.image} />
          <span 
            className={styles.badge} 
            style={{ backgroundColor: getMealTypeColor(type) }}
          >
            {getMealTypeText(type)}
          </span>
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          
          <div className={styles.details}>
            <div className={styles.detail}>
              <FaRegClock className={styles.icon} />
              <span>{formatDate(date)}</span>
            </div>
            <div className={styles.detail}>
              <FaUsers className={styles.icon} />
              <span>{participantsCount} / {maxParticipants}</span>
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.hostInfo}>
              <FaUserCircle className={styles.hostIcon} />
              <span>Organizzato da <strong>{host?.nickname || 'Utente'}</strong></span>
            </div>
            <span className={styles.languageTag}>{language}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MealCard;