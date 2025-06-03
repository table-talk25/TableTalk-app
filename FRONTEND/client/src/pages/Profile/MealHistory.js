import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaUsers, FaUtensils } from 'react-icons/fa';
import '../../styles/MealHistory.css';

const MealHistory = ({ createdMeals = [], participatedMeals = [] }) => {
  // Formatta la data in un formato leggibile
  const formatDate = (dateString) => {
    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('it-IT', options);
  };

  // Ottieni il tipo di pasto in italiano
  const getMealTypeText = (type) => {
    const types = {
      colazione: 'Colazione',
      pranzo: 'Pranzo',
      cena: 'Cena',
      aperitivo: 'Aperitivo'
    };
    return types[type] || type;
  };

  // Restituisce un colore basato sul tipo di pasto
  const getMealTypeColor = (type) => {
    const colors = {
      colazione: '#ffc107', // Giallo per colazione
      pranzo: '#28a745',    // Verde per pranzo
      cena: '#6f42c1',      // Viola per cena
      aperitivo: '#fd7e14'  // Arancione per aperitivo
    };
    return colors[type] || '#007bff'; // Blu predefinito
  };

  // Funzione per renderizzare la card di un pasto
  const renderMealCard = (meal) => {
    return (
      <Link to={`/meals/${meal._id}`} key={meal._id} className="meal-card">
        <div 
          className="meal-type-indicator"
          style={{ backgroundColor: getMealTypeColor(meal.type) }}
        >
          {getMealTypeText(meal.type)}
        </div>
        
        <h3 className="meal-title">{meal.title}</h3>
        
        <div className="meal-info">
          <span className="meal-date">
            <FaCalendarAlt /> {formatDate(meal.date)}
          </span>
          <span className="meal-participants">
            <FaUsers /> {meal.participants?.length || 0}/{meal.maxParticipants}
          </span>
        </div>
        
        <p className="meal-description">{meal.description}</p>
      </Link>
    );
  };

  return (
    <div className="meal-history-container">
      <div className="created-meals">
        <h3>
          <FaUtensils /> Pasti creati da te
        </h3>
        
        <div className="meals-list">
          {createdMeals && createdMeals.length > 0 ? (
            createdMeals.map(meal => renderMealCard(meal))
          ) : (
            <p className="no-meals">Non hai ancora creato nessun pasto virtuale.</p>
          )}
        </div>
      </div>

      <div className="participated-meals">
        <h3>
          <FaUsers /> Pasti a cui hai partecipato
        </h3>
        
        <div className="meals-list">
          {participatedMeals && participatedMeals.length > 0 ? (
            participatedMeals.map(meal => renderMealCard(meal))
          ) : (
            <p className="no-meals">Non hai ancora partecipato a nessun pasto virtuale.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealHistory;