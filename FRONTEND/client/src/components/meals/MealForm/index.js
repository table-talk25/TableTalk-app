// File: /src/components/meals/MealForm.js (Versione Corretta e Aggiornata)

import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { mealTypeOptions } from '../../../constants/mealConstants';
import styles from './MealForm.module.css'; 
import dayjs from 'dayjs';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import TopicInput from '../TopicInput';

// Opzioni per la durata del pasto
const languageOptions = ['Italiano', 'English', 'Español', 'Français', 'Deutsch', '中文', 'العربية'];
const durationOptions = [
  { value: 30, label: '30 minuti' },
  { value: 60, label: '1 ora' },
  { value: 90, label: '1 ora e 30' },
  { value: 120, label: '2 ore' },
  { value: 150, label: '2 ore e 30' },
  { value: 180, label: '3 ore' },
];

const MealForm = ({ initialData, onSubmit, isLoading, submitButtonText = 'Salva' }) => {
  // Definiamo uno stato di default pulito
  const getInitialState = () => ({
    title: '',
    description: '',
    type: 'lunch',
    date: '',
    duration: 60,
    maxParticipants: 2,
    language: 'English',
    topics: [],
  });

  const [formData, setFormData] = useState(getInitialState());
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTopicsChange = (newTopics) => {
    setFormData(prev => ({ ...prev, topics: newTopics }));
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
    const formDataToSend = new FormData();
    const dataToProcess = { ...formData };

    if (dataToProcess.date) {
      dataToProcess.date = new Date(dataToProcess.date).toISOString();
    }

    for (const key in dataToProcess) {
      if (key === 'topics' && Array.isArray(dataToProcess[key])) {
        dataToProcess[key].forEach(topic => formDataToSend.append('topics[]', topic));
      } else {
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
      <Form.Group className="mb-3">
        <Form.Label className={styles.formLabel}>Titolo dell'Evento</Form.Label>
        <Form.Control className={styles.formControl} type="text" name="title" value={formData.title} onChange={handleChange} required />
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label className={styles.formLabel}>Descrizione</Form.Label>
        <Form.Control className={styles.formControl} as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange} required />
      </Form.Group>

      <Row className="mb-3">
        <Col md={6}>
            <Form.Group>
                <Form.Label className={styles.formLabel}>Tipo di TableTalk®</Form.Label>
                <Form.Select className={styles.formSelect} name="type" value={formData.type} onChange={handleChange} required>
                    <option value="" disabled>Seleziona...</option>
                    {mealTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </Form.Select>
            </Form.Group>
        </Col>
        <Col md={6}>
            <Form.Group>
                <Form.Label className={styles.formLabel}>Max Partecipanti</Form.Label>
                <Form.Control className={styles.formControl} type="number" name="maxParticipants" value={formData.maxParticipants} onChange={handleChange} required min="2" max="10" />
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
                <Form.Control className={styles.formControl} type="datetime-local" name="date" value={formData.date} onChange={handleChange} required />
            </Form.Group>
        </Col>
        <Col xs={12} md={6}>

        </Col>
      </Row>
      
      <Form.Group className="mb-3">
          <Form.Label className={styles.formLabel}>Argomenti di Conversazione</Form.Label>
          <TopicInput topics={formData.topics} setTopics={handleTopicsChange} />
          <Form.Text>Scrivi un argomento e premi Invio o la virgola per aggiungerlo. Massimo 5.</Form.Text>
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label>Immagine di Copertina</Form.Label>
        {imagePreview && <img src={imagePreview} alt="Anteprima TableTalk®" className={styles.imagePreview} />}
        <Button variant="secondary" onClick={handlePhotoSelect} className="d-block w-100 mt-2">Scegli dalla Galleria</Button>
      </Form.Group>
      
      <Button variant="primary" type="submit" className={styles.submitButton} disabled={isLoading}>
        {isLoading ? <Spinner as="span" animation="border" size="sm" /> : submitButtonText}
      </Button>
    </Form>
  );
};

export default MealForm;