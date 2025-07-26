// File: /src/components/meals/MealForm.js (Versione Corretta e Aggiornata)

import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { mealTypeOptions } from '../../../constants/mealConstants';
import styles from './MealForm.module.css'; 
import dayjs from 'dayjs';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import TopicInput from '../TopicInput';
import LocationPicker from '../../Map/LocationPicker';

        // Opzioni per la durata del TableTalk®
const languageOptions = ['Italiano', 'English', 'Español', 'Français', 'Deutsch', '中文', 'العربية'];
const durationOptions = [
  { value: 30, label: '30 minuti' },
  { value: 60, label: '1 ora' },
  { value: 90, label: '1 ora e 30' },
  { value: 120, label: '2 ore' },
  { value: 150, label: '2 ore e 30' },
  { value: 180, label: '3 ore' },
];

const MealForm = ({ initialData, onSubmit, isLoading, isSubmitting, submitButtonText = 'Salva' }) => {
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
        if (!value.trim()) return 'Il titolo è obbligatorio';
        if (value.trim().length < 10) return 'Il titolo deve essere di almeno 10 caratteri';
        if (value.trim().length > 50) return 'Il titolo non può superare i 50 caratteri';
        break;
      case 'description':
        if (!value.trim()) return 'La descrizione è obbligatoria';
        if (value.trim().length < 10) return 'La descrizione deve essere di almeno 10 caratteri';
        if (value.trim().length > 1000) return 'La descrizione non può superare i 1000 caratteri';
        break;
      case 'date':
        if (!value) return 'Data e ora sono obbligatorie';
        if (new Date(value) <= new Date()) return 'La data deve essere futura';
        break;
      case 'maxParticipants':
        if (!value || value < 2) return 'Devono esserci almeno 2 partecipanti';
        if (value > 10) return 'Non possono partecipare più di 10 persone';
        break;
      case 'topics':
        if (!value || value.length === 0) return 'Aggiungi almeno un argomento di conversazione';
        break;
      case 'location':
        if (formData.mealType === 'physical' && !value) return 'La posizione è obbligatoria per un TableTalk® fisico';
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
        <label className={styles.formLabel}>Tipo di TableTalk®</label>
        <div className={styles.typeSelector}>
          <button
            type="button" // Importante per non inviare il form
            className={`${styles.typeButton} ${formData.mealType === 'virtual' ? styles.active : ''}`}
            onClick={() => setFormData({ ...formData, mealType: 'virtual', location: null })} // Resetta la location se si sceglie virtuale
          >
            <span className={styles.typeIcon}>🎥</span>
            <span className={styles.typeText}>Virtuale</span>
            <small className={styles.typeDescription}>(Videochiamata)</small>
          </button>
          <button
            type="button"
            className={`${styles.typeButton} ${formData.mealType === 'physical' ? styles.active : ''}`}
            onClick={() => setFormData({ ...formData, mealType: 'physical' })}
          >
            <span className={styles.typeIcon}>📍</span>
            <span className={styles.typeText}>Fisico</span>
            <small className={styles.typeDescription}>(In presenza)</small>
          </button>
        </div>
        <div className={styles.typeInfo}>
          {formData.mealType === 'virtual' 
            ? 'I partecipanti si incontreranno tramite videochiamata' 
            : 'I partecipanti si incontreranno di persona in un luogo specifico'
          }
        </div>
      </div>

              {/* Sezione Visibilità - solo per TableTalk® fisici */}
      {formData.mealType === 'physical' && (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Visibilità del TableTalk®</label>
          <div className={styles.visibilitySelector}>
            <button
              type="button"
              className={`${styles.visibilityButton} ${formData.isPublic ? styles.active : ''}`}
              onClick={() => setFormData({ ...formData, isPublic: true })}
            >
              <span className={styles.visibilityIcon}>🌍</span>
              <span className={styles.visibilityText}>Pubblico</span>
              <small className={styles.visibilityDescription}>(Chiunque può richiedere di partecipare)</small>
            </button>
            <button
              type="button"
              className={`${styles.visibilityButton} ${!formData.isPublic ? styles.active : ''}`}
              onClick={() => setFormData({ ...formData, isPublic: false })}
            >
              <span className={styles.visibilityIcon}>🔒</span>
              <span className={styles.visibilityText}>Privato</span>
              <small className={styles.visibilityDescription}>(Solo con invito)</small>
            </button>
          </div>
          <div className={styles.visibilityInfo}>
            {formData.isPublic 
                          ? 'Il TableTalk® sarà visibile sulla mappa e chiunque potrà richiedere di partecipare'
            : 'Il TableTalk® sarà visibile solo agli utenti che inviterai personalmente'
            }
          </div>
        </div>
      )}

      <Form.Group className="mb-3">
        <Form.Label className={styles.formLabel}>Titolo dell'Evento</Form.Label>
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
        <Form.Label className={styles.formLabel}>Descrizione</Form.Label>
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
                <Form.Label className={styles.formLabel}>Categoria</Form.Label>
                <Form.Select className={styles.formSelect} name="type" value={formData.type} onChange={handleChange} required>
                    <option value="" disabled>Seleziona...</option>
                    {mealTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </Form.Select>
            </Form.Group>
        </Col>
        <Col md={6}>
            <Form.Group>
                <Form.Label className={styles.formLabel}>Max Partecipanti</Form.Label>
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
                <Form.Label className={styles.formLabel}>Lingua della conversazione</Form.Label>
                <Form.Select className={styles.formSelect} name="language" value={formData.language} onChange={handleChange} required>
                    {languageOptions.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </Form.Select>
            </Form.Group>
        </Col>
        <Col xs={12} md={6}>
            <Form.Group>
                <Form.Label className={styles.formLabel}>Durata</Form.Label>
                <Form.Select className={styles.formSelect} name="duration" value={formData.duration} onChange={handleChange} required>
                    {durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </Form.Select>
            </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col xs={12} md={6}>
            <Form.Group>
                <Form.Label className={styles.formLabel}>Data e Ora</Form.Label>
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
                <Form.Label className={styles.formLabel}>Indirizzo</Form.Label>
                <Form.Control 
                  className={`${styles.formControl} ${errors.location ? 'is-invalid' : ''}`}
                  type="text" 
                  name="location" 
                  placeholder="Inserisci l'indirizzo del ristorante o luogo di incontro"
                  value={formData.location?.address || ''} 
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required 
                />
                {errors.location && <div className="invalid-feedback">{errors.location}</div>}
                <Form.Text className="text-muted">
                  Es: "Ristorante Il Gusto, Via Roma 123, Milano"
                </Form.Text>
              </Form.Group>
            )}
        </Col>
      </Row>

              {/* Mappa per TableTalk® fisici */}
      {formData.mealType === 'physical' && (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Seleziona la posizione sulla mappa</label>
          <div className={styles.mapContainer}>
            <LocationPicker
              onLocationSelect={(location) => setFormData({ ...formData, location })}
              initialCenter={formData.location ? { lat: formData.location.coordinates[1], lng: formData.location.coordinates[0] } : undefined}
            />
          </div>
        </div>
      )}
      
      <Form.Group className="mb-3">
          <Form.Label className={styles.formLabel}>Argomenti di Conversazione</Form.Label>
          <TopicInput topics={formData.topics} setTopics={handleTopicsChange} />
          {errors.topics && <div className="invalid-feedback d-block">{errors.topics}</div>}
          <Form.Text>Scrivi un argomento e premi Invio o la virgola per aggiungerlo. Massimo 5.</Form.Text>
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label>Immagine di Copertina</Form.Label>
        {imagePreview && <img src={imagePreview} alt="Anteprima TableTalk®" className={styles.imagePreview} />}
        <Button variant="secondary" onClick={handlePhotoSelect} className="d-block w-100 mt-2">Scegli dalla Galleria</Button>
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
            <span> {isSubmitting ? 'Salvataggio in corso...' : 'Caricamento...'}</span>
          </>
        ) : (
          submitButtonText
        )}
      </Button>
    </Form>
  );
};

export default MealForm;