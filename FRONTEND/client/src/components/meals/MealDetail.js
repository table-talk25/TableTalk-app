// File: /src/components/meals/MealDetail.js (Versione Rifattorizzata)

import React, { useState } from 'react';
import { Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useMeals } from '../../contexts/MealsContext'; // <-- USARE IL NOSTRO CONTEXT!
import { toast } from 'react-toastify';
import { getMealTypeText, getMealStatusText, formatDate } from '../../utils/mealUtils'; // <-- USARE LE UTILITY
import { MEAL_STATUS_COLORS } from '../../constants/mealConstants'; // <-- USARE LE COSTANTI
import { useParams, useNavigate } from 'react-router-dom';
import { FaCalendar, FaMapMarkerAlt, FaUsers, FaUtensils } from 'react-icons/fa';
import '../../styles/MealDetail.css';

const MealDetail = ({ meal, onClose }) => {
  const { user } = useAuth();
  const { joinMeal, leaveMeal, loading } = useMeals(); // <-- PRENDIAMO LE FUNZIONI DAL CONTEXT

  const { _id, title, type, date, maxParticipants, description, host, participants, language, videoCallLink, status } = meal;

  const isHost = host?._id === user?.id;
  const isParticipant = participants?.some(p => p._id === user?.id);
  const isFull = participants?.length >= maxParticipants;
  const isPast = new Date(date) < new Date();

  const handleJoin = async () => {
    try {
      await joinMeal(_id);
      // La notifica toast è già gestita dal context!
    } catch (error) {
      // Anche l'errore è già gestito e mostrato dal context. Non dobbiamo fare altro.
    }
  };

  const handleLeave = async () => {
    try {
      await leaveMeal(_id);
    } catch (error) {
      // Gestito dal context
    }
  };

  return (
    <Card className="meal-detail-card shadow-sm">
      <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
        {getMealTypeText(type)}
        <Button variant="close" aria-label="Close" onClick={onClose} />
      </Card.Header>
      <Card.Body>
        <h3 className="card-title">{title}</h3>
        <div className="mb-3">
          <Badge bg={MEAL_STATUS_COLORS[status] || 'secondary'} className="me-2">{getMealStatusText(status)}</Badge>
          <Badge bg="info">{language}</Badge>
        </div>
        <Card.Text><strong>Quando:</strong> {formatDate(date)}</Card.Text>
        <Card.Text><strong>Partecipanti:</strong> {participants?.length || 0} / {maxParticipants}</Card.Text>
        <hr />
        <p>{description}</p>
        <hr />
        <h5>Organizzato da: {host?.nickname}</h5>

        {/* Logica per i pulsanti di azione */}
        <div className="mt-4">
          {!isPast && status === 'upcoming' && !isHost && !isParticipant && !isFull && (
            <Button variant="primary" onClick={handleJoin} disabled={loading} className="w-100">
              {loading ? 'Elaborazione...' : 'Partecipa al Pasto'}
            </Button>
          )}
          {!isPast && !isHost && isParticipant && (
             <Button variant="outline-danger" onClick={handleLeave} disabled={loading} className="w-100">
              {loading ? 'Elaborazione...' : 'Abbandona il Pasto'}
            </Button>
          )}
          {videoCallLink && isParticipant && status === 'ongoing' && (
             <a href={videoCallLink} target="_blank" rel="noopener noreferrer" className="btn btn-success w-100">
                Entra nella Videochiamata
             </a>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default MealDetail;