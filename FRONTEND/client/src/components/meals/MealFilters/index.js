// File: src/components/meals/MealFilters/index.js (Versione Corretta)

import React, { useState } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import styles from './MealFilters.module.css';
import { MEAL_TYPES, MEAL_MODES } from '../../../constants/mealConstants';
import { useMealTranslations } from '../../../hooks/useMealTranslations';

// Il componente ora riceve i filtri e la funzione onFilterChange come props
const MealFilters = ({ filters, onFilterChange }) => {
  const { t } = useTranslation();
  const { getMealTypeOptions, getMealModeOptions } = useMealTranslations();

  // Funzione interna per gestire il cambiamento e notificare il genitore
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Chiamiamo la funzione del genitore passandogli i nuovi valori
    onFilterChange(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  // Funzione per resettare tutti i filtri ai valori di default
  const handleReset = () => {
    onFilterChange(() => ({
      type: '',
      mealType: '', // Reset anche il tipo di TableTalk®
      status: '',
      sortBy: 'date',
    }));
  };

  return (
    <div className={styles.filtersCard}>
      <h4>{t('meals.filters.title')}</h4>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>{t('meals.filters.mealType')}</Form.Label>
          <Form.Select name="type" value={filters.type} onChange={handleChange}>
            <option value="">{t('meals.filters.allTypes')}</option>
            {getMealTypeOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>{t('meals.filters.mode')}</Form.Label>
          <Form.Select name="mealType" value={filters.mealType} onChange={handleChange}>
            <option value="">{t('meals.filters.allModes')}</option>
            {getMealModeOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label} {option.value === MEAL_MODES.VIRTUAL ? '🎥' : '📍'}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>{t('meals.filters.status')}</Form.Label>
          <Form.Select name="status" value={filters.status} onChange={handleChange}>
            <option value="">{t('meals.filters.allStatus')}</option>
            <option value="upcoming">{t('meals.mealStatus.upcoming')}</option>
            <option value="ongoing">{t('meals.mealStatus.ongoing')}</option>
          </Form.Select>
        </Form.Group>

        <Form.Group>
          <Form.Label>{t('meals.filters.sortBy')}</Form.Label>
          <Form.Select name="sortBy" value={filters.sortBy} onChange={handleChange}>
            <option value="date">{t('meals.filters.dateClosest')}</option>
            <option value="participants">{t('meals.filters.participantsMost')}</option>
          </Form.Select>
        </Form.Group>
      </Form>
      <button type="button" className={styles.resetButton} onClick={handleReset} style={{marginTop: '1rem'}}>
        {t('meals.filters.resetFilters')}
      </button>
    </div>
  );
};

export default MealFilters;