// File: /src/pages/Meals/CreateMealPage/index.js (Versione Finale Ristrutturata)

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import mealService from '../../../services/mealService'; 
import { useMeals } from '../../../contexts/MealsContext';
import { toast } from 'react-toastify';
import MealForm from '../../../components/meals/MealForm'; 
import styles from './CreateMealPage.module.css';
import BackButton from '../../../components/common/BackButton';

const CreateMealPage = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // La logica di submit ora chiama il servizio corretto
  const handleCreateSubmit = async (formData) => {
    setIsLoading(true);
    setError(''); // Pulisci eventuali errori precedenti
    try {
      const newMeal = await mealService.createMeal(formData); // Usiamo il servizio
      toast.success('TableTalk® creato con successo!');
      navigate(`/meals/${newMeal._id}`); 
    } catch (error) {
      const errorMessage = error.message || 'Errore nella creazione del TableTalk®.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.createMealPage}>
      <header className={styles.createMealHeader}>
      <h1 className={styles.createMealTitle}>Crea un Nuovo TableTalk®</h1>
      <p className={styles.createMealSubtitle}>Compila i campi per organizzare il tuo prossimo incontro virtuale.</p>
      </header>

      <div className={styles.createMealContent}>
        {error && (
          <div className={styles.errorMessage} style={{ 
            color: 'red', 
            backgroundColor: '#ffe6e6', 
            padding: '10px', 
            borderRadius: '5px', 
            marginBottom: '20px',
            border: '1px solid #ff9999'
          }}>
            {error}
          </div>
        )}
        <MealForm
          onSubmit={handleCreateSubmit}
          isLoading={isLoading}
          isSubmitting={isLoading}
          submitButtonText="Crea TableTalk®"
        />
      </div>
      <BackButton className="mb-4" /> 
    </div>
  );
};

export default CreateMealPage;