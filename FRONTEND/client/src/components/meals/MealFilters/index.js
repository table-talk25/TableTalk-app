// File: src/components/meals/MealFilters/index.js (Versione Corretta)

import React, { useState } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import styles from './MealFilters.module.css'; // Assicurati di avere il file di stile
import { mealTypeOptions } from '../../../constants/mealConstants';

// Il componente ora riceve i filtri e la funzione onFilterChange come props
const MealFilters = ({ onFilterChange }) => {

    // Funzione interna per gestire il cambiamento e notificare il genitore
    const handleChange = (e) => {
      const { name, value } = e.target;
      // Chiamiamo la funzione del genitore passandogli i nuovi valori
      onFilterChange(prevFilters => ({
        ...prevFilters,
        [name]: value
      }));
    };

    return (
      <div className={styles.filtersCard}>
        <h4>Filtri</h4>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Tipo TableTalk®</Form.Label>
            <Form.Select name="type" value={filters.type} onChange={handleChange}>
              <option value="">Tutti i Tipi</option>
              {mealTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </Form.Select>
          </Form.Group>
  
          <Form.Group className="mb-3">
            <Form.Label>Stato</Form.Label>
            <Form.Select name="status" value={filters.status} onChange={handleChange}>
              <option value="">Tutti</option>
              <option value="upcoming">In Programma</option>
              <option value="ongoing">In Corso</option>
            </Form.Select>
          </Form.Group>
  
          <Form.Group>
            <Form.Label>Ordina per</Form.Label>
            <Form.Select name="sortBy" value={filters.sortBy} onChange={handleChange}>
              <option value="date">Data (più vicini)</option>
              <option value="participants">Partecipanti (più popolati)</option>
            </Form.Select>
          </Form.Group>
        </Form>
      </div>
    );
  };
  
  export default MealFilters;