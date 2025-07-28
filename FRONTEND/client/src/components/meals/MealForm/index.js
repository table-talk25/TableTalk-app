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

        // Opzioni per la durata del TableTalk®
const languageOptions = ['Italiano', 'English', 'Español', 'Français', 'Deutsch', '中文', 'العربية'];

const MealForm = ({ initialData, onSubmit, isLoading, isSubmitting, submitButtonText }) => {
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
  const getInitialState = () => ({
    title: '',
    description: '',
    mealType: 'virtual', // Aggiungi questo! Iniziamo con 'virtual' come default
    type: 'lunch',
    date: '',
    duration: 60,
    maxParticipants: 2,
    language: 'English',
    topics: [],
    location: null, // Assicurati che location sia null all'inizio
            isPublic: true, // Di default i TableTalk® sono pubblici
  });

  const [formData, setFormData] = useState(getInitialState());
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  // Funzione di validazione
  const validateField = (name, value) => {
    switch (name) {
      case 'title':
        if (!value.trim()) return t('meals.form.titleRequired');
        if (value.trim().length < 10) return t('meals.form.titleMinLength');
        if (value.trim().length > 50) return t('meals.form.titleMaxLength');
        break;
      case 'description':
        if (!value.trim()) return t('meals.form.descriptionRequired');
        if (value.trim().length < 10) return t('meals.form.descriptionMinLength');
        if (value.trim().length > 1000) return t('meals.form.descriptionMaxLength');
        break;
      case 'date':
        if (!value) return t('meals.form.dateRequired');
        if (new Date(value) <= new Date()) return t('meals.form.dateFuture');
        break;
      case 'maxParticipants':
        if (!value || value < 2) return t('meals.form.maxParticipantsMin');
        if (value > 10) return t('meals.form.maxParticipantsMax');
        break;
      case 'topics':
        if (!value || value.length === 0) return t('meals.form.topicsRequired');
        break;
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
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });
      
      if (photo.webPath) {
        setImagePreview(photo.webPath);
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        setImageFile(blob);
      }
    } catch (error) {
      console.error("Errore selezione foto", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
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

    const formDataToSend = new FormData();
    const dataToProcess = { ...formData };

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
      formDataToSend.append('coverImage', imageFile, `photo_${Date.now()}.jpg`);
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
                <Form.Control 
                  className={`${styles.formControl} ${errors.date ? 'is-invalid' : ''}`}
                  type="datetime-local" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required 
                />
                {errors.date && <div className="invalid-feedback">{errors.date}</div>}
            </Form.Group>
        </Col>
        <Col xs={12} md={6}>
            {/* Campo per la posizione - visibile solo per TableTalk® fisici */}
            {formData.mealType === 'physical' && (
              <Form.Group>
                <Form.Label className={styles.formLabel}>{t('meals.form.addressLabel')}</Form.Label>
                <Form.Control 
                  className={`${styles.formControl} ${errors.location ? 'is-invalid' : ''}`}
                  type="text" 
                  name="location" 
                  placeholder={t('meals.form.addressPlaceholder')}
                  value={formData.location?.address || ''} 
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required 
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
              onLocationSelect={(location) => setFormData({ ...formData, location })}
              initialCenter={formData.location ? { lat: formData.location.coordinates[1], lng: formData.location.coordinates[0] } : undefined}
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
      </Form.Group>
      
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
    </Form>
  );
};

export default MealForm;