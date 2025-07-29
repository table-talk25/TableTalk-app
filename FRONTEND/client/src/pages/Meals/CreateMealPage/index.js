// File: /src/pages/Meals/CreateMealPage/index.js (Versione Finale Ristrutturata)

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import mealService from '../../../services/mealService'; 
import { useMeals } from '../../../contexts/MealsContext';
import { toast } from 'react-toastify';
import MealForm from '../../../components/meals/MealForm'; 
import styles from './CreateMealPage.module.css';
import BackButton from '../../../components/common/BackButton';

const CreateMealPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // La logica di submit ora chiama il servizio corretto
  const handleCreateSubmit = async (formData) => {
    console.log('🚀 [CreateMeal] Inizio creazione pasto...');
    console.log('🚀 [CreateMeal] FormData ricevuto:', formData);
    
    // Debug: mostra tutti i campi del FormData
    if (formData instanceof FormData) {
      console.log('🚀 [CreateMeal] Campi FormData:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
    }
    
    setIsLoading(true);
    setError(''); // Pulisci eventuali errori precedenti
    try {
      console.log('📡 [CreateMeal] Chiamando mealService.createMeal...');
      const newMeal = await mealService.createMeal(formData); // Usiamo il servizio
      console.log('✅ [CreateMeal] Pasto creato con successo:', newMeal);
      toast.success(t('meals.createSuccess'));
      navigate(`/meals/${newMeal._id}`); 
    } catch (error) {
      console.error('❌ [CreateMeal] Errore nella creazione:', error);
      console.error('❌ [CreateMeal] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.message || error.message || t('meals.createError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.createMealPage}>
      <header className={styles.createMealHeader}>
        <h1 className={styles.createMealTitle}>{t('meals.createNewTitle')}</h1>
        <p className={styles.createMealSubtitle}>{t('meals.createNewSubtitle')}</p>
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
          submitButtonText={t('meals.createButton')}
        />
      </div>
      <BackButton className="mb-4" /> 
    </div>
  );
};

export default CreateMealPage;