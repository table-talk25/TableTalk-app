// File: /src/components/meals/MealsList.js

import React from 'react';
import MealCard from './MealCard'; // Importiamo la nostra nuova card
import styles from '../../styles/MealsList.module.css'; // Creeremo un po' di stile

const MealsList = ({ meals }) => {
  // Se non ci sono pasti, mostriamo un messaggio amichevole
  if (!meals || meals.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>Nessun pasto trovato</h3>
        <p>Non ci sono pasti che corrispondono ai filtri attuali. Prova a crearne uno tu!</p>
      </div>
    );
  }

  // Se ci sono pasti, li mappiamo e creiamo una MealCard per ognuno
  return (
    <div className={styles.mealsGrid}>
      {meals.map(meal => (
        <MealCard key={meal._id} meal={meal} />
      ))}
    </div>
  );
};

export default MealsList;