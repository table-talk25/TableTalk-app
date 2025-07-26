// File: src/pages/Meals/EditMealPage/index.js (Versione Corretta)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import mealService from '../../../services/mealService';
import { toast } from 'react-toastify';
import { Card, Spinner, Alert, Button } from 'react-bootstrap';
import MealForm from '../../../components/meals/MealForm';
import styles from './EditMealPage.module.css';
import { useMeals } from '../../../contexts/MealsContext'; // <-- 1. IMPORTA L'HOOK
import BackButton from '../../../components/common/BackButton';

const EditMealPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

          // Carichiamo i dati del TableTalk® da modificare
  const fetchMealData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await mealService.getMealById(id);
      setInitialData(response.data); // Salviamo i dati per pre-compilare il form
    } catch (err) {
      setError(err.message || 'Errore nel caricamento dei dati.');
              toast.error('Impossibile caricare i dati del TableTalk®.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMealData();
  }, [fetchMealData]);

  // Gestiamo il salvataggio delle modifiche
  const handleEditSubmit = async (formData) => {
    setIsUpdating(true);
    try {
      const response = await mealService.updateMeal(id, formData);
              toast.success('TableTalk® aggiornato con successo!');
      navigate(`/meals/${response.data._id}`);
    } catch (err) {
      toast.error(err.message || 'Errore durante l\'aggiornamento.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className={styles.loadingContainer}><Spinner animation="border" /></div>;
  if (error) return <div className={styles.errorContainer}><Alert variant="danger">{error}</Alert></div>;

  return (
    <div className={styles.editPage}>
      <Card className={styles.card}>
        <Card.Body className="p-4 p-md-5">
          <h2 className={styles.title}>Modifica il Tuo TableTalk®</h2>
          {initialData ? (
            <MealForm
              initialData={initialData}
              onSubmit={handleEditSubmit}
              isLoading={isUpdating}
              submitButtonText="Salva Modifiche"
            />
          ) : (
            <Alert variant="warning">Dati del TableTalk® non trovati.</Alert>
          )}
        </Card.Body>
      </Card>
      <BackButton className="mb-4" /> 
                </div>
  );
};

export default EditMealPage;