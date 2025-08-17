// File: /src/components/meals/MealForm.js (Versione Corretta e Aggiornata)

import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { mealTypeOptions } from '../../../constants/mealConstants';
import styles from './MealForm.module.css'; 
import dayjs from 'dayjs';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import TopicInput from '../TopicInput';
import LocationPicker from '../../Map/LocationPicker';
import PlacesAutocompleteInput from '../../Map/PlacesAutocompleteInput';
import { sanitizeMealData, containsDangerousContent } from '../../../services/sanitizationService';

        // Opzioni per la durata del TableTalk®
const languageOptions = ['Italiano', 'English', 'Español', 'Français', 'Deutsch', '中文', 'العربية'];

const MealForm = ({ initialData, onSubmit, onCancel, isLoading, isSubmitting, submitButtonText }) => {
  const { t } = useTranslation();
  
  // Opzioni di durata tradotte
  const durationOptions = [
    { value: 30, label: t('meals.form.durationOptions.30min') },
    { value: 60, label: t('meals.form.durationOptions.1hour') },
    { value: 90, label: t('meals.form.durationOptions.1hour30') },
    { value: 120, label: t('meals.form.durationOptions.2hours') },
    { value: 150, label: t('meals.form.durationOptions.2hours30') },
    { value: 180, label: t('meals.form.durationOptions.3hours') },
  ];

  // Definiamo uno stato di default pulito
  const getInitialState = () => {
    // 🔒 VALIDAZIONE DATA: Suggerisci una data valida di default
    const now = new Date();
    const suggestedDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 ora da ora
    
    // Formatta per input datetime-local
    const year = suggestedDate.getFullYear();
    const month = String(suggestedDate.getMonth() + 1).padStart(2, '0');
    const day = String(suggestedDate.getDate()).padStart(2, '0');
    const hours = String(suggestedDate.getHours()).padStart(2, '0');
    const minutes = String(suggestedDate.getMinutes()).padStart(2, '0');
    
    return {
      title: '',
      description: '',
      mealType: 'virtual', // Aggiungi questo! Iniziamo con 'virtual' come default
      type: 'lunch',
      date: `${year}-${month}-${day}T${hours}:${minutes}`, // 🔒 Data valida di default
      duration: 60,
      maxParticipants: 2,
      language: 'English',
      topics: [],
      location: null, // Assicurati che location sia null all'inizio
      isPublic: true, // Di default i TableTalk® sono pubblici
    };
  };

  const [formData, setFormData] = useState(getInitialState());
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState('');
  const [errors, setErrors] = useState({});

  // 🔒 VALIDAZIONE DATA: Calcola la data minima valida per l'input
  const getMinValidDateTime = () => {
    const now = new Date();
    // Tolleranza di 5 minuti per sincronizzazione dispositivi
    const toleranceMs = 5 * 60 * 1000;
    const minValidDate = new Date(now.getTime() - toleranceMs);
    
    // Formatta per input datetime-local (YYYY-MM-DDTHH:mm)
    const year = minValidDate.getFullYear();
    const month = String(minValidDate.getMonth() + 1).padStart(2, '0');
    const day = String(minValidDate.getDate()).padStart(2, '0');
    const hours = String(minValidDate.getHours()).padStart(2, '0');
    const minutes = String(minValidDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Funzione di validazione
  const validateField = (name, value) => {
    switch (name) {
      case 'title':
        if (!value.trim()) return t('meals.form.titleRequired');
        if (value.trim().length < 5) return t('meals.form.titleMinLength');
        if (value.trim().length > 50) return t('meals.form.titleMaxLength');
        
        // 🛡️ PROTEZIONE XSS: Controlla contenuto pericoloso
        if (containsDangerousContent(value)) {
          return 'Il titolo contiene contenuto non permesso (HTML/JavaScript)';
        }
        break;
      case 'description':
        if (!value.trim()) return t('meals.form.descriptionRequired');
        if (value.trim().length < 10) return t('meals.form.descriptionMinLength');
        if (value.trim().length > 1000) return t('meals.form.descriptionMaxLength');
        
        // 🛡️ PROTEZIONE XSS: Controlla contenuto pericoloso
        if (containsDangerousContent(value)) {
          return 'La descrizione contiene contenuto non permesso (HTML/JavaScript)';
        }
        break;
      case 'date':
        if (!value) return t('meals.form.dateRequired');
        
        // 🔒 VALIDAZIONE DATA: Impedisce selezione date passate
        const selectedDate = new Date(value);
        const now = new Date();
        
        // Tolleranza di 5 minuti per sincronizzazione dispositivi
        const toleranceMs = 5 * 60 * 1000; // 5 minuti
        const minValidDate = new Date(now.getTime() - toleranceMs);
        
        if (selectedDate < minValidDate) {
          return t('meals.form.datePast') || 'La data deve essere nel futuro';
        }
        
        // Validazione aggiuntiva: non permettere date troppo lontane nel futuro (es. > 1 anno)
        const maxFutureDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        if (selectedDate > maxFutureDate) {
          return t('meals.form.dateTooFar') || 'La data non può essere più di un anno nel futuro';
        }
        
        break;
      case 'maxParticipants':
        if (!value || value < 2) return t('meals.form.maxParticipantsMin');
        if (value > 10) return t('meals.form.maxParticipantsMax');
        break;
      case 'topics':
        // Opzionale: niente errore se vuoto
        return '';
      case 'location':
        if (formData.mealType === 'physical' && !value) return t('meals.form.locationRequired');
        break;
      default:
        return '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 🔒 VALIDAZIONE DATA SPECIALE: Controllo immediato per date non valide
    if (name === 'date' && value) {
      const selectedDate = new Date(value);
      const now = new Date();
      const toleranceMs = 5 * 60 * 1000; // 5 minuti
      const minValidDate = new Date(now.getTime() - toleranceMs);
      
      // Se la data selezionata è nel passato, resetta il campo
      if (selectedDate < minValidDate) {
        console.warn('⚠️ [MealForm] Data nel passato selezionata, reset campo');
        setFormData(prev => ({ ...prev, date: '' }));
        setErrors(prev => ({
          ...prev,
          date: t('meals.form.datePast') || 'La data deve essere nel futuro'
        }));
        return;
      }
    }
    
    if (name === 'location') {
      // Mantieni 'location' come oggetto con chiave 'address' per evitare crash
      setFormData(prev => ({
        ...prev,
        location: prev && typeof prev.location === 'object' && prev.location !== null
          ? { ...prev.location, address: value }
          : { address: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Validazione in tempo reale
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleTopicsChange = (newTopics) => {
    setFormData(prev => ({ ...prev, topics: newTopics }));
    
    // Validazione per i topics
    const error = validateField('topics', newTopics);
    setErrors(prev => ({
      ...prev,
      topics: error
    }));
  };

  const handlePhotoSelect = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        width: 1600, // suggerisci una dimensione massima per ridurre peso
      });
      
      if (photo.webPath) {
        setImagePreview(photo.webPath);
        const response = await fetch(photo.webPath);
        let blob = await response.blob();
        const type = 'image/jpeg';
        // comprimi se > 4MB
        if (blob.size > 4 * 1024 * 1024) {
          blob = await compressImageBlob(blob, { maxWidth: 1600, quality: 0.7 });
        }
        const file = new File([blob], `cover_${Date.now()}.jpg`, { type });
        setImageFile(file);
        // genera anche un base64 da usare come fallback
        try {
          const base64 = await blobToBase64(blob);
          if (typeof base64 === 'string') setImageBase64(base64);
        } catch (_) {}
      }
    } catch (error) {
      console.error("Errore selezione foto", error);
    }
  };

  // Comprimi immagine usando canvas
  const compressImageBlob = async (blob, { maxWidth = 1600, quality = 0.7 } = {}) => {
    try {
      const imageBitmap = await createImageBitmap(blob);
      const scale = Math.min(1, maxWidth / imageBitmap.width);
      const targetWidth = Math.round(imageBitmap.width * scale);
      const targetHeight = Math.round(imageBitmap.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch (e) {
      // in caso di fallimento, restituisci l'originale
      return blob;
    }
  };

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    } catch (e) { reject(e); }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 🔒 VALIDAZIONE DATA FINALE: Controllo aggiuntivo prima del submit
    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const now = new Date();
      const toleranceMs = 5 * 60 * 1000; // 5 minuti
      const minValidDate = new Date(now.getTime() - toleranceMs);
      
      if (selectedDate < minValidDate) {
        console.warn('⚠️ [MealForm] Submit bloccato: data nel passato rilevata');
        setErrors(prev => ({
          ...prev,
          date: t('meals.form.datePast') || 'La data deve essere nel futuro'
        }));
        return; // Blocca il submit
      }
    }
    
    // Validazione completa prima del submit
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Non procedere se ci sono errori
    }

    // 🛡️ PROTEZIONE XSS: Sanitizza tutti i dati prima dell'invio
    const sanitizedData = sanitizeMealData(formData);
    
    // Log per debugging (solo in development)
    if (process.env.NODE_ENV === 'development') {
      const hasChanges = JSON.stringify(sanitizedData) !== JSON.stringify(formData);
      if (hasChanges) {
        console.log('🛡️ [MealForm] Dati sanitizzati prima dell\'invio:', {
          original: formData,
          sanitized: sanitizedData
        });
      }
    }

    const formDataToSend = new FormData();
    const dataToProcess = { ...sanitizedData };

    if (dataToProcess.date) {
      dataToProcess.date = new Date(dataToProcess.date).toISOString();
    }

    for (const key in dataToProcess) {
      if (key === 'topics' && Array.isArray(dataToProcess[key])) {
        dataToProcess[key].forEach(topic => formDataToSend.append('topics[]', topic));
      } else if (key === 'location' && dataToProcess[key]) {
        // Per i TableTalk® fisici, aggiungi la location
        formDataToSend.append('location', JSON.stringify(dataToProcess[key]));
      } else if (key !== 'location' || formData.mealType === 'physical') {
        // Aggiungi tutti i campi tranne location se è virtuale
        formDataToSend.append(key, dataToProcess[key]);
      }
    }
    
    if (imageFile) {
      formDataToSend.append('coverImage', imageFile);
      if (imageBase64) {
        formDataToSend.append('coverImageBase64', imageBase64);
      }
      if (imagePreview) {
        formDataToSend.append('coverLocalUri', imagePreview);
      }
    }
    
    onSubmit(formDataToSend);
  };

  return (
    <Form onSubmit={handleSubmit} className={styles.form}>
              {/* Sezione Tipo di TableTalk® con pulsanti personalizzati */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>{t('meals.form.typeLabel')}</label>
        <div className={styles.typeSelector}>
          <button
            type="button" // Importante per non inviare il form
            className={`${styles.typeButton} ${formData.mealType === 'virtual' ? styles.active : ''}`}
            onClick={() => setFormData({ ...formData, mealType: 'virtual', location: null })} // Resetta la location se si sceglie virtuale
          >
            <span className={styles.typeIcon}>🎥</span>
            <span className={styles.typeText}>{t('meals.form.virtualType')}</span>
            <small className={styles.typeDescription}>{t('meals.form.virtualDescription')}</small>
          </button>
          <button
            type="button"
            className={`${styles.typeButton} ${formData.mealType === 'physical' ? styles.active : ''}`}
            onClick={() => setFormData({ ...formData, mealType: 'physical' })}
          >
            <span className={styles.typeIcon}>📍</span>
            <span className={styles.typeText}>{t('meals.form.physicalType')}</span>
            <small className={styles.typeDescription}>{t('meals.form.physicalDescription')}</small>
          </button>
        </div>
        <div className={styles.typeInfo}>
          {formData.mealType === 'virtual' 
            ? t('meals.form.virtualInfo')
            : t('meals.form.physicalInfo')
          }
        </div>
      </div>

              {/* Sezione Visibilità - solo per TableTalk® fisici */}
      {formData.mealType === 'physical' && (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('meals.form.visibilityLabel')}</label>
          <div className={styles.visibilitySelector}>
            <button
              type="button"
              className={`${styles.visibilityButton} ${formData.isPublic ? styles.active : ''}`}
              onClick={() => setFormData({ ...formData, isPublic: true })}
            >
              <span className={styles.visibilityIcon}>🌍</span>
              <span className={styles.visibilityText}>{t('meals.form.publicVisibility')}</span>
              <small className={styles.visibilityDescription}>{t('meals.form.publicDescription')}</small>
            </button>
            <button
              type="button"
              className={`${styles.visibilityButton} ${!formData.isPublic ? styles.active : ''}`}
              onClick={() => setFormData({ ...formData, isPublic: false })}
            >
              <span className={styles.visibilityIcon}>🔒</span>
              <span className={styles.visibilityText}>{t('meals.form.privateVisibility')}</span>
              <small className={styles.visibilityDescription}>{t('meals.form.privateDescription')}</small>
            </button>
          </div>
          <div className={styles.visibilityInfo}>
            {formData.isPublic 
                          ? t('meals.form.publicInfo')
            : t('meals.form.privateInfo')
            }
          </div>
        </div>
      )}

      <Form.Group className="mb-3">
        <Form.Label className={styles.formLabel}>{t('meals.form.titleLabel')}</Form.Label>
        <Form.Control 
          className={`${styles.formControl} ${errors.title ? 'is-invalid' : ''}`}
          type="text" 
          name="title" 
          value={formData.title} 
          onChange={handleChange}
          onBlur={handleBlur}
          required 
        />
        {errors.title && <div className="invalid-feedback">{errors.title}</div>}
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label className={styles.formLabel}>{t('meals.form.descriptionLabel')}</Form.Label>
        <Form.Control 
          className={`${styles.formControl} ${errors.description ? 'is-invalid' : ''}`}
          as="textarea" 
          rows={3} 
          name="description" 
          value={formData.description} 
          onChange={handleChange}
          onBlur={handleBlur}
          required 
        />
        {errors.description && <div className="invalid-feedback">{errors.description}</div>}
      </Form.Group>

      <Row className="mb-3">
        <Col md={6}>
            <Form.Group>
                <Form.Label className={styles.formLabel}>{t('meals.form.categoryLabel')}</Form.Label>
                <Form.Select className={styles.formSelect} name="type" value={formData.type} onChange={handleChange} required>
                    <option value="" disabled>{t('meals.form.selectCategory')}</option>
                    {mealTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </Form.Select>
            </Form.Group>
        </Col>
        <Col md={6}>
            <Form.Group>
                <Form.Label className={styles.formLabel}>{t('meals.form.maxParticipantsLabel')}</Form.Label>
                <Form.Control 
                  className={`${styles.formControl} ${errors.maxParticipants ? 'is-invalid' : ''}`}
                  type="number" 
                  name="maxParticipants" 
                  value={formData.maxParticipants} 
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required 
                  min="2" 
                  max="10" 
                />
                {errors.maxParticipants && <div className="invalid-feedback">{errors.maxParticipants}</div>}
            </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col xs={12} md={6}>
            <Form.Group>
                <Form.Label className={styles.formLabel}>{t('meals.form.languageLabel')}</Form.Label>
                <Form.Select className={styles.formSelect} name="language" value={formData.language} onChange={handleChange} required>
                    {languageOptions.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </Form.Select>
            </Form.Group>
        </Col>
        <Col xs={12} md={6}>
            <Form.Group>
                <Form.Label className={styles.formLabel}>{t('meals.form.durationLabel')}</Form.Label>
                <Form.Select className={styles.formSelect} name="duration" value={formData.duration} onChange={handleChange} required>
                    {durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </Form.Select>
            </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col xs={12} md={6}>
            <Form.Group>
                <Form.Label className={styles.formLabel}>{t('meals.form.dateLabel')}</Form.Label>
                <div className={styles.dateInputContainer}>
                  <Form.Control 
                    className={`${styles.formControl} ${errors.date ? 'is-invalid' : ''}`}
                    type="datetime-local" 
                    name="date" 
                    value={formData.date} 
                    min={getMinValidDateTime()} // 🔒 Impedisce selezione date passate
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required 
                  />
                  <button
                    type="button"
                    className={styles.dateHelperButton}
                    onClick={() => {
                      // 🔒 SUGGERIMENTO DATA: Imposta una data valida di default
                      const now = new Date();
                      const suggestedDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 ora da ora
                      
                      const year = suggestedDate.getFullYear();
                      const month = String(suggestedDate.getMonth() + 1).padStart(2, '0');
                      const day = String(suggestedDate.getDate()).padStart(2, '0');
                      const hours = String(suggestedDate.getHours()).padStart(2, '0');
                      const minutes = String(suggestedDate.getMinutes()).padStart(2, '0');
                      
                      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
                      setFormData(prev => ({ ...prev, date: formattedDate }));
                      
                      // Pulisci eventuali errori
                      setErrors(prev => ({ ...prev, date: '' }));
                    }}
                    title="Suggerisci data valida (1 ora da ora)"
                  >
                    🕐
                  </button>
                </div>
                {errors.date && <div className="invalid-feedback">{errors.date}</div>}
                <Form.Text className="text-muted">
                  📅 Seleziona una data e ora nel futuro
                </Form.Text>
            </Form.Group>
        </Col>
        <Col xs={12} md={6}>
            {/* Campo per la posizione - visibile solo per TableTalk® fisici */}
            {formData.mealType === 'physical' && (
              <Form.Group>
                <Form.Label className={styles.formLabel}>{t('meals.form.addressLabel')}</Form.Label>
                <PlacesAutocompleteInput
                  value={formData.location}
                  onChange={(text) => setFormData(prev => ({ 
                    ...prev, 
                    location: { 
                      ...(prev.location || {}), 
                      address: text,
                      coordinates: prev.location?.coordinates || undefined
                    } 
                  }))}
                  onSelect={(loc) => setFormData(prev => ({ 
                    ...prev, 
                    location: {
                      address: loc.address,
                      coordinates: loc.coordinates || prev.location?.coordinates
                    }
                  }))}
                  placeholder={t('meals.form.addressPlaceholder')}
                  className={`${styles.formControl} ${errors.location ? 'is-invalid' : ''}`}
                />
                {errors.location && <div className="invalid-feedback">{errors.location}</div>}
                <Form.Text className="text-muted">
                  {t('meals.form.addressExample')}
                </Form.Text>
              </Form.Group>
            )}
        </Col>
      </Row>

              {/* Mappa per TableTalk® fisici */}
      {formData.mealType === 'physical' && (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('meals.form.mapLabel')}</label>
          <div className={styles.mapContainer}>
            <LocationPicker
              onLocationSelect={(location) => setFormData(prev => ({ 
                ...prev, 
                location: {
                  address: location.address || prev.location?.address,
                  coordinates: location.coordinates
                }
              }))}
              currentLocation={formData.location}
              initialCenter={
                formData.location && typeof formData.location === 'object' && Array.isArray(formData.location.coordinates) && formData.location.coordinates.length >= 2
                  ? { lat: formData.location.coordinates[1], lng: formData.location.coordinates[0] }
                  : undefined
              }
            />
          </div>
        </div>
      )}
      
      <Form.Group className="mb-3">
          <Form.Label className={styles.formLabel}>{t('meals.form.topicsLabel')}</Form.Label>
          <TopicInput topics={formData.topics} setTopics={handleTopicsChange} />
          {errors.topics && <div className="invalid-feedback d-block">{errors.topics}</div>}
          <Form.Text>{t('meals.form.topicsHelp')}</Form.Text>
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label>{t('meals.form.coverImageLabel')}</Form.Label>
        {imagePreview && <img src={imagePreview} alt={t('meals.form.coverImageAlt')} className={styles.imagePreview} />}
        <Button variant="secondary" onClick={handlePhotoSelect} className="d-block w-100 mt-2">{t('meals.form.chooseFromGallery')}</Button>
        
        {/* 🔄 Indicatore stato immagine */}
        {imageFile && (
          <div className="mt-2 p-2 bg-light rounded" style={{ fontSize: '0.9em' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>📷 Immagine selezionata</span>
              <small className="text-muted">
                {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
              </small>
            </div>
            <small className="text-muted d-block mt-1">
              L'immagine verrà caricata dopo la creazione del pasto
            </small>
          </div>
        )}
      </Form.Group>
      
      <div className={styles.stickyActions}>
        <Button 
          variant="primary" 
          type="submit" 
          className={styles.submitButton} 
          disabled={isLoading || isSubmitting}
        >
          {isLoading || isSubmitting ? (
            <>
              <Spinner as="span" animation="border" size="sm" />
              <span> {isSubmitting ? t('meals.form.saving') : t('meals.form.loading')}</span>
            </>
          ) : (
            submitButtonText || t('forms.save')
          )}
        </Button>
      </div>
    </Form>
  );
};

export default MealForm;