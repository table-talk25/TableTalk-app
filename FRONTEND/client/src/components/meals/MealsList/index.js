// File: src/components/meals/MealsList/index.js (Versione Carosello)

import React from 'react';
import MealCard from '../MealCard'; // Importiamo la nostra card
import styles from './MealsList.module.css'; // Useremo il suo stile dedicato

const MealsList = ({ meals }) => {
  if (!meals || meals.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>Nessun TableTalk® trovato</h3>
        <p>Non ci sono TableTalk® che corrispondono ai filtri attuali. Prova a cambiarli o creane uno tu!</p>
      </div>
    );
  }

  // Il nostro contenitore ora è un 'carousel'
  return (
    <div className={styles.carousel}>
      {meals.map(meal => (
        // Ogni card è un 'carouselItem'
        <div key={meal._id} className={styles.carouselItem}>
          <MealCard meal={meal} />
        </div>
      ))}
    </div>
  );
};

export default MealsList;