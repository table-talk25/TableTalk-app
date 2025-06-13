// File: /src/components/meals/MealForm.js (Versione con Stili Corretti)

import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { mealTypeOptions } from '../../constants/mealConstants';
import styles from '../../styles/MealForm.module.css'; // <-- IMPORT CORRETTO

const MealForm = ({ initialData, onSubmit, isLoading, submitButtonText = 'Salva' }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    date: '',
    maxParticipants: 4,
    language: 'Italiano',
    topics: [],
  });

  useEffect(() => {
    if (initialData) {
      const dateObj = initialData.date ? new Date(initialData.date) : null;
      const formattedDate = dateObj ? dateObj.toISOString().slice(0, 16) : '';
      setFormData({ ...initialData, date: formattedDate });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTopicsChange = (e) => {
    const topicsArray = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, topics: topicsArray }));
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      date: new Date(formData.date).toISOString()
    };
    onSubmit(dataToSubmit);
  };

  // NOTA: Il JSX ora usa le classi dal nostro file CSS tramite l'oggetto 'styles'
  return (
    <Form onSubmit={handleSubmit} className={styles.form}>
      <Form.Group>
        <Form.Label className={styles.formLabel}>Titolo dell'Evento</Form.Label>
        <Form.Control className={styles.formControl} type="text" name="title" value={formData.title} onChange={handleChange} required />
      </Form.Group>
      
      <Form.Group>
        <Form.Label className={styles.formLabel}>Descrizione</Form.Label>
        <Form.Control className={styles.formControl} as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange} required />
      </Form.Group>

      <Row>
        <Col md={6}>
            <Form.Group>
                <Form.Label className={styles.formLabel}>Tipo di Pasto</Form.Label>
                <Form.Select className={styles.formSelect} name="type" value={formData.type} onChange={handleChange} required>
                    <option value="">Seleziona...</option>
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

      <Form.Group>
        <Form.Label className={styles.formLabel}>Data e Ora</Form.Label>
        <Form.Control className={styles.formControl} type="datetime-local" name="date" value={formData.date} onChange={handleChange} required />
      </Form.Group>
      
      <Form.Group>
          <Form.Label className={styles.formLabel}>Argomenti (separati da virgola)</Form.Label>
          <Form.Control className={styles.formControl} type="text" name="topics" value={formData.topics.join(', ')} onChange={handleTopicsChange} placeholder="Es. Viaggi, Cinema, Libri" />
      </Form.Group>
      
      <Button variant="primary" type="submit" className="w-100 mt-3" disabled={isLoading}>
        {isLoading ? <Spinner as="span" animation="border" size="sm" /> : submitButtonText}
      </Button>
    </Form>
  );
};

export default MealForm;