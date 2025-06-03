import React, { useState } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import { joinMeal, getMealById } from '../../services/mealService';
import { toast } from 'react-toastify';

const JoinMealButton = ({ mealId, disabled, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Prima verifica se il pasto è ancora disponibile
      const currentMeal = await getMealById(mealId);
      
      if (currentMeal.status !== 'scheduled') {
        throw new Error('Questo pasto non è più disponibile');
      }
      
      if (currentMeal.participants.length >= currentMeal.maxParticipants) {
        throw new Error('Questo pasto è già al completo');
      }
      
      // Procedi con l'iscrizione
      await joinMeal(mealId);
      
      // Ottieni il pasto aggiornato
      const updatedMeal = await getMealById(mealId);
      
      // Notifica il successo
      toast.success('Ti sei unito al pasto con successo!');
      
      // Notifica il componente padre
      if (onSuccess) onSuccess(updatedMeal);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Errore durante l\'iscrizione al pasto';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Errore durante l\'iscrizione al pasto:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button 
        variant="primary" 
        onClick={handleJoin}
        disabled={disabled || loading}
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
            <i className="fas fa-user-plus me-2"></i>
            Unisciti al pasto
          </>
        )}
      </Button>
      {error && (
        <Alert variant="danger" className="mt-2">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}
    </div>
  );
};

export default JoinMealButton;