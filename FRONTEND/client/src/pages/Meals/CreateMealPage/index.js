// File: /src/pages/Meals/CreateMealPage/index.js (Versione Finale Ristrutturata)

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import mealService from '../../../services/mealService'; 
import { useMeals } from '../../../contexts/MealsContext';
import { toast } from 'react-toastify';
import MealForm from '../../../components/meals/MealForm'; 
import styles from './CreateMealPage.module.css';
import BackButton from '../../../components/common/BackButton';
import { Capacitor } from '@capacitor/core';

const CreateMealPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createMeal, fetchMeals, upsertMeal } = useMeals();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [createdMealId, setCreatedMealId] = useState(null);

  // 🔄 FLUSSO IN DUE PASSAGGI: Prima crea il pasto, poi carica l'immagine
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
      console.log('📡 [CreateMeal] Chiamando createMeal (context)...');
      
      // 🔄 PASSO 1: Crea il pasto SENZA immagine per feedback immediato
      const formDataWithoutImage = new FormData();
      
      // Copia tutti i campi tranne l'immagine
      for (let [key, value] of formData.entries()) {
        if (key !== 'coverImage' && key !== 'coverImageBase64' && key !== 'coverLocalUri') {
          formDataWithoutImage.append(key, value);
        }
      }
      
      const newMeal = await createMeal(formDataWithoutImage);
      console.log('✅ [CreateMeal] Pasto creato con successo:', newMeal);
      console.log('✅ [CreateMeal] newMeal._id:', newMeal._id);
      
      // Salva l'ID del pasto creato per l'upload dell'immagine
      setCreatedMealId(newMeal._id);
      
      // Mostra successo immediato
      toast.success(t('meals.createSuccess'));
      
      // 🔄 PASSO 2: Se c'è un'immagine, caricala separatamente con progress bar
      if (formData instanceof FormData && formData.get('coverImage')) {
        await uploadMealImage(newMeal._id, formData);
      } else {
        // Nessuna immagine, naviga direttamente
        setTimeout(() => {
          console.log('🚀 [CreateMeal] Eseguendo navigazione...');
          navigate(`/meals/${newMeal._id}`);
        }, 800);
      }
      
    } catch (error) {
      console.error('❌ [CreateMeal] Errore nella creazione:', error);
      console.error('❌ [CreateMeal] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      // Non mostrare toast rosso per errori di rete transitori
      const isTransientNetwork = !error.response?.status && (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED');
      const errorMessage = error.response?.data?.message || t('meals.createError');
      setError(errorMessage);
      if (!isTransientNetwork) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🔄 PASSO 2: Upload separato dell'immagine con progress bar
   * @param {string} mealId - ID del pasto creato
   * @param {FormData} formData - Dati del form con l'immagine
   */
  const uploadMealImage = async (mealId, formData) => {
    console.log('🖼️ [CreateMeal] Inizio upload immagine per pasto:', mealId);
    
    setIsImageUploading(true);
    setImageUploadProgress(0);
    
    try {
      // Prepara i dati dell'immagine
      const original = formData.get('coverImage');
      const fileToSend = original && typeof original.name !== 'string'
        ? new File([original], `cover_${Date.now()}.jpg`, { type: original.type || 'image/jpeg' })
        : original;
      
      const onlyImage = new FormData();
      onlyImage.append('coverImage', fileToSend);
      
      // Includi fallback base64 se disponibile
      try {
        const preview = formData.get('coverLocalUri');
        if (typeof preview === 'string' && preview.startsWith('data:image/')) {
          onlyImage.append('coverImageBase64', preview);
        }
      } catch(_) {}
      
      try {
        const base64 = formData.get('coverImageBase64');
        if (typeof base64 === 'string' && base64.startsWith('data:image/')) {
          onlyImage.append('coverImageBase64', base64);
        }
      } catch(_) {}
      
      // Simula progress bar (in un'implementazione reale, usa axios interceptor)
      const progressInterval = setInterval(() => {
        setImageUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // Upload dell'immagine
      const updated = await mealService.updateMeal(mealId, onlyImage);
      const updatedMeal = updated?.data || updated;
      
      // Aggiorna lo stato locale
      try { 
        upsertMeal(updatedMeal); 
      } catch (_) {}
      
      // Aggiorna la lista dei pasti
      try { 
        await fetchMeals({ status: 'upcoming,ongoing', suppressErrorAlert: true }); 
      } catch (_) {}
      
      // Completa la progress bar
      setImageUploadProgress(100);
      
      // Mostra successo
      toast.success(t('meals.imageUploadSuccess') || 'Immagine caricata con successo!');
      
      console.log('✅ [CreateMeal] Immagine caricata con successo');
      
      // Naviga alla pagina del pasto dopo un breve delay
      setTimeout(() => {
        console.log('🚀 [CreateMeal] Eseguendo navigazione dopo upload immagine...');
        navigate(`/meals/${mealId}`);
      }, 1000);
      
    } catch (imgErr) {
      console.warn('⚠️ [CreateMeal] Upload immagine fallito:', imgErr?.message || imgErr);
      
      // Mostra warning ma non blocca il flusso
      toast.warning(t('meals.imageUploadWarning') || 'Pasto creato! Puoi aggiungere l\'immagine dopo.');
      
      // Naviga comunque alla pagina del pasto
      setTimeout(() => {
        console.log('🚀 [CreateMeal] Eseguendo navigazione nonostante errore immagine...');
        navigate(`/meals/${mealId}`);
      }, 1000);
      
    } finally {
      setIsImageUploading(false);
      setImageUploadProgress(0);
    }
  };

  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    let subscriptions = [];
    (async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const { Keyboard } = await import('@capacitor/keyboard');
          const showSub = Keyboard.addListener('keyboardWillShow', () => setKeyboardOpen(true));
          const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardOpen(false));
          subscriptions.push(showSub, hideSub);
        }
      } catch (_) {}
    })();
    return () => {
      subscriptions.forEach(sub => { try { sub.remove(); } catch (_) {} });
    };
  }, []);

  return (
    <div className={styles.createMealPage} style={keyboardOpen ? { paddingBottom: 90 } : undefined}>
      <div className={styles.topBar}>
        <BackButton className={styles.backButton} />
      </div>
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

        {/* 🔄 Progress bar per upload immagine */}
        {isImageUploading && (
          <div className={styles.imageUploadProgress} style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ marginRight: '10px' }}>🖼️</div>
              <div>
                <strong>Caricamento immagine in corso...</strong>
                <small style={{ display: 'block', color: '#6c757d' }}>
                  Pasto creato! Stiamo caricando l'immagine...
                </small>
              </div>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: '#e9ecef', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${imageUploadProgress}%`,
                height: '100%',
                backgroundColor: '#007bff',
                transition: 'width 0.3s ease',
                borderRadius: '4px'
              }} />
            </div>
            <small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
              {imageUploadProgress}% completato
            </small>
          </div>
        )}

        <MealForm
          onSubmit={handleCreateSubmit}
          isLoading={isLoading || isImageUploading}
          isSubmitting={isLoading || isImageUploading}
          submitButtonText={
            isLoading ? t('meals.createButton') :
            isImageUploading ? 'Pasto creato! Caricando immagine...' :
            t('meals.createButton')
          }
        />
      </div>
    </div>
  );
};

export default CreateMealPage;