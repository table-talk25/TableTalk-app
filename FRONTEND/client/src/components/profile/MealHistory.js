// File: /src/components/profile/MealHistory.js (Versione Corretta)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FaCalendarAlt, FaUsers, FaMapMarkerAlt } from 'react-icons/fa';
import '../../styles/profile/MealHistory.css';

const MealHistory = ({ meals }) => {
    const [filter, setFilter] = useState('all'); // 'all', 'created', 'joined'
    const navigate = useNavigate();

    const filteredMeals = meals.filter(meal => {
        if (filter === 'all') return true;
        if (filter === 'created') return meal.isCreator;
        if (filter === 'joined') return !meal.isCreator;
        return true;
    });

    const handleMealClick = (mealId) => {
        navigate(`/meals/${mealId}`);
    };

    return (
        <div className="meal-history-container">
            <div className="meal-history-header">
                <h2>Cronologia Pasti</h2>
                <div className="meal-history-filters">
                    <button 
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Tutti
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'created' ? 'active' : ''}`}
                        onClick={() => setFilter('created')}
                    >
                        Creati
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'joined' ? 'active' : ''}`}
                        onClick={() => setFilter('joined')}
                    >
                        Partecipati
                    </button>
                </div>
            </div>

            <div className="meal-history-list">
                {filteredMeals.length === 0 ? (
                    <div className="no-meals-message">
                        {filter === 'all' && "Non hai ancora partecipato a nessun pasto"}
                        {filter === 'created' && "Non hai ancora creato nessun pasto"}
                        {filter === 'joined' && "Non hai ancora partecipato a nessun pasto"}
                    </div>
                ) : (
                    filteredMeals.map(meal => (
                        <div 
                            key={meal._id} 
                            className="meal-history-item"
                            onClick={() => handleMealClick(meal._id)}
                        >
                            <div className="meal-history-item-content">
                                <div className="meal-history-item-header">
                                    <h3>{meal.title}</h3>
                                    <span className={`meal-status ${meal.status}`}>
                                        {meal.status === 'completed' && 'Completato'}
                                        {meal.status === 'cancelled' && 'Annullato'}
                                        {meal.status === 'upcoming' && 'In arrivo'}
                                    </span>
                                </div>
                                <div className="meal-history-item-details">
                                    <p className="meal-date">
                                        {format(new Date(meal.date), "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it })}
                                    </p>
                                    <p className="meal-location">{meal.location}</p>
                                </div>
                                <div className="meal-history-item-footer">
                                    <span className="meal-type">{meal.type}</span>
                                    <span className="meal-participants">
                                        {meal.participants.length} partecipanti
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MealHistory;