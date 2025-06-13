'use client';

import React, { useState } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import { joinMeal, getMealById } from '../../services/mealService';
import { toast } from 'react-toastify';
import styles from '../../styles/JoinMealButton.module.css';

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
    <div className={styles.container}>
      <Button 
        variant="primary" 
        onClick={handleJoin}
        disabled={disabled || loading}
        className={styles.joinButton}
      >
        {loading ? (
          <div className={styles.loadingContent}>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className={styles.spinner}
            />
            <span>Elaborazione...</span>
          </div>
        ) : (
          <div className={styles.buttonContent}>
            <i className="fas fa-user-plus"></i>
            <span>Unisciti al pasto</span>
          </div>
        )}
      </Button>
      {error && (
        <Alert variant="danger" className={styles.errorAlert}>
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </Alert>
      )}
    </div>
  );
};

export default JoinMealButton; 